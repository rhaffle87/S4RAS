import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft, ExternalLink, Phone } from 'lucide-react';
import services from '../config/services';

/**
 * Command palette (Ctrl/Cmd+K) — quick jump to pages, services and actions.
 * Self-contained: no extra dependencies. Opens via keyboard shortcut or by
 * dispatching `window.dispatchEvent(new Event('open-command-palette'))`.
 */

const COPY = {
  id: {
    label: 'Palet perintah',
    placeholder: 'Cari halaman atau layanan…',
    pages: 'Halaman',
    services: 'Layanan',
    actions: 'Aksi',
    empty: 'Tidak ada hasil untuk',
    phone: 'Buka WebPhone (Telefoni)',
    phoneDesc: 'Layanan komunikasi suara WebRTC & VoIP',
    results: (n) => `${n} hasil`,
    hints: ['↑↓ pilih', '↵ buka', 'esc tutup'],
  },
  en: {
    label: 'Command palette',
    placeholder: 'Search pages or services…',
    pages: 'Pages',
    services: 'Services',
    actions: 'Actions',
    empty: 'No results for',
    phone: 'Open WebPhone (Telephony)',
    phoneDesc: 'WebRTC voice & VoIP telephony service',
    results: (n) => `${n} result${n === 1 ? '' : 's'}`,
    hints: ['↑↓ select', '↵ open', 'esc close'],
  },
};

const isInternal = (url) => typeof url === 'string' && url.startsWith('/');

function CommandPalette({ navItems = [], language = 'id', isAdmin = false }) {
  const copy = COPY[language] || COPY.id;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const returnFocusRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    const el = returnFocusRef.current;
    if (el && typeof el.focus === 'function') el.focus();
  }, []);

  const show = useCallback(() => {
    returnFocusRef.current = document.activeElement;
    setQuery('');
    setActive(0);
    setOpen(true);
  }, []);

  // Global shortcut + programmatic open
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            returnFocusRef.current = document.activeElement;
            setQuery('');
            setActive(0);
          }
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', show);
    };
  }, [show]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const items = useMemo(() => {
    const pages = navItems.map((n) => ({
      id: `page:${n.to}`,
      group: 'pages',
      title: n.label,
      desc: '',
      Icon: n.icon,
      run: () => navigate(n.to),
    }));
    const svc = services
      .filter((s) => {
        if (s.key === 'monitor' || s.key === 'benchmark') return Boolean(isAdmin);
        return true;
      })
      .map((s) => ({
      id: `svc:${s.key}`,
      group: 'services',
      title: s.title,
      desc: s.description,
      external: s.action === 'open-phone' ? false : !isInternal(s.url),
      run: () => {
        if (s.action === 'open-phone') {
          window.dispatchEvent(new CustomEvent('open-campus-phone'));
        } else if (isInternal(s.url)) {
          window.location.assign(s.url);
        } else {
          window.open(s.url, '_blank', 'noopener,noreferrer');
        }
      },
      keywords: s.key,
    }));
    const actions = [
      {
        id: 'action:phone',
        group: 'actions',
        title: copy.phone,
        desc: copy.phoneDesc,
        Icon: Phone,
        run: () => window.dispatchEvent(new Event('open-campus-phone')),
        keywords: 'telepon voip phone sip webrtc dialer softphone',
      },
      {
        id: 'action:call-operator',
        group: 'actions',
        title: language === 'en' ? 'Call Operator (1000)' : 'Panggil Operator (1000)',
        desc: language === 'en' ? 'S4RAS Technical Support & Helpdesk' : 'Pusat Bantuan & Layanan Operator S4RAS',
        Icon: Phone,
        run: () => window.dispatchEvent(new CustomEvent('open-campus-phone', { detail: { ext: '1000' } })),
        keywords: 'operator bantuan helpdesk telepon 1000',
      },
      {
        id: 'action:call-echo',
        group: 'actions',
        title: language === 'en' ? 'Audio Echo Test (600)' : 'Uji Audio & Gema (600)',
        desc: language === 'en' ? 'Loopback microphone & latency test' : 'Uji mikrofon dan latensi audio VoIP',
        Icon: Phone,
        run: () => window.dispatchEvent(new CustomEvent('open-campus-phone', { detail: { ext: '600' } })),
        keywords: 'echo test uji audio gema 600',
      },
    ];
    return [...pages, ...svc, ...actions];
  }, [navItems, navigate, copy.phone, copy.phoneDesc, isAdmin, language]);

  const flat = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = items
      .map((it) => {
        const title = it.title.toLowerCase();
        const hay = `${title} ${it.desc.toLowerCase()} ${it.keywords || ''}`;
        if (!tokens.every((t) => hay.includes(t))) return null;
        const pos = tokens.length ? title.indexOf(tokens[0]) : 0;
        return { it, score: pos === -1 ? 1000 : pos };
      })
      .filter(Boolean);
    const order = { pages: 0, services: 1, actions: 2 };
    scored.sort((a, b) => order[a.it.group] - order[b.it.group] || a.score - b.score);
    return scored.map((s) => s.it);
  }, [items, query]);

  // Keep the highlighted row valid and visible
  useEffect(() => {
    if (active >= flat.length) setActive(0);
  }, [flat.length, active]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector('[aria-selected="true"]');
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
  }, [active, open, flat]);

  const choose = useCallback(
    (it) => {
      if (!it) return;
      setOpen(false);
      returnFocusRef.current = null;
      it.run();
    },
    []
  );

  const onInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flat.length) setActive((i) => (i + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flat.length) setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      if (flat.length) setActive(flat.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(flat[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') {
      e.preventDefault(); // single focus target inside the dialog
    }
  };

  if (!open) return null;

  const groupLabel = { pages: copy.pages, services: copy.services, actions: copy.actions };
  let lastGroup = null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center p-3 sm:px-4 pt-[8vh] sm:pt-[12vh] bg-black/60 backdrop-blur-sm"
      onMouseDown={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.label}
        className="w-full max-w-xl max-h-[85dvh] flex flex-col rounded-2xl border border-border-strong bg-neutral-bg2 shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-border-default">
          <Search size={16} className="text-text-muted shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder={copy.placeholder}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-autocomplete="list"
            aria-activedescendant={flat[active] ? `cmdk-opt-${flat[active].id}` : undefined}
            aria-label={copy.placeholder}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent border-0 outline-none py-4 text-sm text-text-primary placeholder:text-text-muted"
          />
          <kbd className="hidden sm:inline font-mono text-[10px] text-text-muted border border-border-default rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        <ul
          id="cmdk-list"
          ref={listRef}
          role="listbox"
          aria-label={copy.label}
          className="max-h-[55vh] flex-1 min-h-0 overflow-y-auto p-2 m-0 list-none"
        >
          {flat.map((it, i) => {
            const header = it.group !== lastGroup ? groupLabel[it.group] : null;
            lastGroup = it.group;
            const selected = i === active;
            return (
              <React.Fragment key={it.id}>
                {header && (
                  <li
                    role="presentation"
                    className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted"
                  >
                    {header}
                  </li>
                )}
                <li
                  id={`cmdk-opt-${it.id}`}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => !selected && setActive(i)}
                  onClick={() => choose(it)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${
                    selected ? 'bg-brand-subtle text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {it.Icon ? (
                    <it.Icon size={16} className="shrink-0 text-text-muted" aria-hidden="true" />
                  ) : (
                    <span className="w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{it.title}</span>
                    {it.desc && (
                      <span className="block text-xs text-text-muted truncate">{it.desc}</span>
                    )}
                  </span>
                  {it.external && (
                    <ExternalLink size={13} className="shrink-0 text-text-muted" aria-hidden="true" />
                  )}
                  {selected && !it.external && (
                    <CornerDownLeft size={13} className="shrink-0 text-text-muted" aria-hidden="true" />
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ul>

        {flat.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            {copy.empty} “{query}”
          </div>
        )}

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border-default text-[11px] text-text-muted">
          {copy.hints.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>

        <div className="sr-only" role="status" aria-live="polite">
          {copy.results(flat.length)}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
