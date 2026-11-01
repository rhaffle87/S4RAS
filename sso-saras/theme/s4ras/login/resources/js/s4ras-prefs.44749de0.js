/**
 * S4RAS Theme & Preferences Sync
 * CSP-compliant script (script-src 'self')
 * Reads 's4ras_theme' cookie from .s4ras.site with fallback to prefers-color-scheme
 * Prevents FOUC (Flash of Unstyled Content)
 */
(function() {
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }

  function applyTheme() {
    var cookieTheme = getCookie('s4ras_theme');
    // Default to dark theme matching S4RAS ecosystem standard
    var theme = 'dark';

    if (cookieTheme === 'light') {
      theme = 'light';
    } else if (cookieTheme === 'dark') {
      theme = 'dark';
    }

    var docEl = document.documentElement;
    docEl.classList.remove('dark', 'light');
    docEl.classList.add(theme);
    docEl.setAttribute('data-theme', theme);

    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute('content', theme);
    }
  }

  // Run synchronously immediately on script parse
  try {
    applyTheme();
  } catch (e) {
    // Graceful fallback
  }

  // Re-run on DOM ready to ensure DOM elements reflect theme
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTheme);
  }

  // Listen to prefers-color-scheme change if user hasn't explicitly set cookie
  if (window.matchMedia) {
    var mql = window.matchMedia('(prefers-color-scheme: light)');
    if (mql.addEventListener) {
      mql.addEventListener('change', function() {
        if (!getCookie('s4ras_theme')) {
          applyTheme();
        }
      });
    }
  }
})();
