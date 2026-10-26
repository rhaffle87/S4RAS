import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import ServiceSparkline from './ServiceSparkline';
import services from '../config/services';
import { checkServiceHealth } from '../services/backend';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export default function ClusterTelemetryCard({
  healthStatuses: externalStatuses,
  loading: externalLoading,
  className = ''
}) {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';

  const [internalStatuses, setInternalStatuses] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);

  // If statuses not supplied by parent, fetch them independently
  useEffect(() => {
    if (externalStatuses && externalStatuses.length > 0) return;
    let mounted = true;
    const loadHealth = async () => {
      try {
        const results = await Promise.all(services.map(checkServiceHealth));
        if (mounted) {
          setInternalStatuses(results);
          setInternalLoading(false);
        }
      } catch (_e) {
        if (mounted) setInternalLoading(false);
      }
    };
    loadHealth();
    return () => {
      mounted = false;
    };
  }, [externalStatuses]);

  const statuses =
    externalStatuses && externalStatuses.length > 0 ? externalStatuses : internalStatuses;
  const isLoading = typeof externalLoading === 'boolean' ? externalLoading : internalLoading;

  const total = services.length;
  const onlineCount = statuses.filter((s) => s.status === 'online').length;
  const allOnline = onlineCount === total && total > 0;
  const isDegraded = onlineCount > 0 && onlineCount < total;

  const avgLatency = useMemo(() => {
    const latencies = statuses
      .map((s) => (typeof s.latency === 'number' && s.latency > 0 ? s.latency : null))
      .filter((l) => l !== null);
    if (latencies.length === 0) return 19;
    return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  }, [statuses]);

  // Key campus service list for quick status display
  const keyServices = [
    { name: 'Moodle', key: 'moodle' },
    { name: 'Keycloak', key: 'sso' },
    { name: 'Nextcloud', key: 'cloud' },
    { name: 'Jellyfin', key: 'iptv' },
    { name: 'Asterisk PBX', key: 'voip' },
    { name: 'Telemetry', key: 'monitor' }
  ];

  return (
    <div className={`flex flex-col gap-4 text-xs transition-all ${className}`}>
      {/* Top Header Row: Status and Status Page Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isLoading
                ? 'bg-amber-400 animate-pulse'
                : allOnline
                ? 'bg-emerald-500'
                : isDegraded
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
          <span className="font-semibold text-sm text-[var(--color-text-primary)] tracking-tight">
            {isLoading
              ? isEn
                ? 'Probing Cluster Health...'
                : 'Memeriksa Status Klaster...'
              : allOnline
              ? isEn
                ? `${total} Microservices Ready`
                : `${total} Mikroservis Siap & Aktif`
              : `${onlineCount}/${total} Microservices Online`}
          </span>
        </div>

        <a
          href="https://status.s4ras.site"
          target="_blank"
          rel="noreferrer"
          className="h-8 px-3 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center gap-1.5 transition-colors no-underline shrink-0"
        >
          <span>{isEn ? 'Status Page' : 'Halaman Status'}</span>
          <ExternalLink size={12} className="text-[var(--color-text-secondary)]" />
        </a>
      </div>

      {/* Latency Metric Overview Bar */}
      <div className="flex items-end justify-between gap-4 pt-1">
        <div className="flex flex-col">
          <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
            {isEn ? 'Average Response Latency' : 'Rata-rata Latensi Respons'}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-mono font-bold text-[var(--color-text-primary)] tracking-tight">
              {isLoading ? '...' : avgLatency}
            </span>
            <span className="text-xs font-mono font-semibold text-[var(--color-text-secondary)]">ms</span>
            <span className="text-[11px] text-[var(--color-text-secondary)] font-normal ml-2">
              • {isEn ? 'Normal Latency' : 'Respons Normal'}
            </span>
          </div>
        </div>
      </div>

      {/* Full-width Responsive Smooth Telemetry Wave */}
      <div className="w-full pt-1 pb-1">
        <ServiceSparkline
          healthStatuses={statuses}
          loading={isLoading}
          height={56}
          showGuides={true}
        />
      </div>

      {/* Bottom Microservices Quick Health Strip */}
      <div className="pt-3 border-t border-[var(--color-border-default)]/60 flex items-center justify-between gap-2 flex-wrap text-[11px]">
        <span className="text-[var(--color-text-muted)] font-medium">
          {isEn ? 'Core Services:' : 'Layanan Utama:'}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {keyServices.map((svc) => (
            <span
              key={svc.key}
              className="rounded-lg px-2.5 py-1 bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-primary)] inline-flex items-center gap-1.5 font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>{svc.name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
