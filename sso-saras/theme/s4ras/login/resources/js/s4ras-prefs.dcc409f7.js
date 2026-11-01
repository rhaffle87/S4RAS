/**
 * S4RAS Theme, Language & Carousel Controller
 * CSP-compliant script (script-src 'self')
 * Handles:
 * 1. Cross-subdomain (.s4ras.site) theme & language sync (Zero FOUC)
 * 2. Auto-sliding visual & headline carousel (2000ms interval, no arrow buttons)
 * 3. myITS-style floating popover menus for instant language & theme switching
 */

(function () {
  'use strict';

  // 1. Translations Dictionary for Instant Client-Side Switching
  var DICTIONARY = {
    id: {
      formTitle: 'Masuk ke akun Anda',
      formSubtitle: 'Satu akun terpadu untuk seluruh layanan',
      usernamePlaceholder: 'Username atau Email',
      passwordPlaceholder: 'Password',
      submitBtn: 'Sign In',
      divider: 'Bantuan & Informasi',
      forgotHelp: 'Lupa password? Hubungi administrator S4RAS',
      backToSaras: 'Kembali ke S4RAS',
      returnMobile: '← Kembali ke Beranda',
      langTrigger: 'Bahasa Indonesia',
      themeDark: 'Mode Gelap',
      themeLight: 'Mode Terang',
      headlines: [
        'Satu Identitas,<br>Seluruh Layanan Ekosistem',
        'Terhubung Tanpa Batas,<br>Infrastruktur Mandiri 3T',
        'Akses Cepat & Aman,<br>Pembelajaran hingga Komunikasi'
      ]
    },
    en: {
      formTitle: 'Sign in to your account',
      formSubtitle: 'One unified account for all services',
      usernamePlaceholder: 'Username or Email',
      passwordPlaceholder: 'Password',
      submitBtn: 'Sign In',
      divider: 'Help & Information',
      forgotHelp: 'Forgot password? Contact S4RAS administrator',
      backToSaras: 'Back to S4RAS',
      returnMobile: '← Back to Home',
      langTrigger: 'English',
      themeDark: 'Dark Mode',
      themeLight: 'Light Mode',
      headlines: [
        'One Identity,<br>Every Ecosystem Service',
        'Seamlessly Connected,<br>Autonomous 3T Infrastructure',
        'Fast & Secure Access,<br>From Learning to Communication'
      ]
    }
  };

  function getCookie(name) {
    if (typeof document === 'undefined') return null;
    var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }

  function setCookie(name, val) {
    try {
      var domainAttr = window.location.hostname.indexOf('s4ras.site') !== -1 ? '; domain=.s4ras.site' : '';
      document.cookie = name + '=' + encodeURIComponent(val) + domainAttr + '; path=/; max-age=31536000; SameSite=Lax';
    } catch (e) {
      // ignore
    }
  }

  function getQueryParam(param) {
    if (typeof window === 'undefined') return null;
    var match = window.location.search.match(new RegExp('[?&]' + param + '=([^&]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  // Determine active theme (URL > Cookie > System > default 'dark')
  var currentTheme = (function () {
    var urlTheme = getQueryParam('theme');
    if (urlTheme === 'light' || urlTheme === 'dark') return urlTheme;
    var cookieTheme = getCookie('s4ras_theme');
    if (cookieTheme === 'light' || cookieTheme === 'dark') return cookieTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  })();

  // Determine active language (URL > Cookie > Keycloak URL > default 'id')
  var currentLang = (function () {
    var urlLang = getQueryParam('lang') || getQueryParam('kc_locale') || getQueryParam('ui_locales');
    if (urlLang) {
      urlLang = urlLang.toLowerCase();
      if (urlLang.indexOf('en') === 0) return 'en';
      if (urlLang.indexOf('id') === 0) return 'id';
    }
    var cookieLang = getCookie('s4ras_lang');
    if (cookieLang === 'en' || cookieLang === 'id') return cookieLang;
    var htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang.indexOf('en') === 0) return 'en';
    return 'id';
  })();

  // 2. Synchronous Fast Execution to prevent FOUC
  function applyThemeSync(theme) {
    var docEl = document.documentElement;
    docEl.classList.remove('dark', 'light');
    docEl.classList.add(theme);
    docEl.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', theme);
  }

  try {
    applyThemeSync(currentTheme);
    document.documentElement.lang = currentLang;
  } catch (e) {}

  // 3. DOM-Ready Setup: Carousel & Popovers
  document.addEventListener('DOMContentLoaded', function () {
    applyThemeSync(currentTheme);
    updateLanguageUI(currentLang, false);
    initCarousel();
    initPopovers();
  });

  // 4. Update Language UI (Dynamic switching)
  function updateLanguageUI(lang, persist) {
    currentLang = lang;
    if (persist) {
      setCookie('s4ras_lang', lang);
    }
    document.documentElement.lang = lang;

    var d = DICTIONARY[lang] || DICTIONARY.id;

    // Form elements
    var formTitle = document.getElementById('form-main-title');
    if (formTitle) formTitle.textContent = d.formTitle;

    var formSubtitle = document.getElementById('form-main-subtitle');
    if (formSubtitle) formSubtitle.textContent = d.formSubtitle;

    var userInput = document.getElementById('username');
    if (userInput) userInput.setAttribute('placeholder', d.usernamePlaceholder);

    var userLabel = document.getElementById('label-username');
    if (userLabel) userLabel.textContent = d.usernamePlaceholder;

    var passInput = document.getElementById('password');
    if (passInput) passInput.setAttribute('placeholder', d.passwordPlaceholder);

    var passLabel = document.getElementById('label-password');
    if (passLabel) passLabel.textContent = d.passwordPlaceholder;

    var submitBtn = document.getElementById('kc-login');
    if (submitBtn) submitBtn.textContent = d.submitBtn;

    var dividerText = document.getElementById('form-divider-text');
    if (dividerText) dividerText.textContent = d.divider;

    var helpText = document.getElementById('form-help-text');
    if (helpText) helpText.textContent = d.forgotHelp;

    var backText = document.getElementById('s4ras-back-text');
    if (backText) backText.textContent = d.backToSaras;

    var returnMobile = document.getElementById('s4ras-return-mobile');
    if (returnMobile) returnMobile.textContent = d.returnMobile;

    // Trigger label
    var langTriggerLabel = document.getElementById('lang-trigger-label');
    if (langTriggerLabel) langTriggerLabel.textContent = d.langTrigger;

    // Theme labels in current language
    var themeTriggerLabel = document.getElementById('theme-trigger-label');
    if (themeTriggerLabel) {
      themeTriggerLabel.textContent = currentTheme === 'light' ? d.themeLight : d.themeDark;
    }
    var optLight = document.getElementById('label-opt-light');
    if (optLight) optLight.textContent = d.themeLight;
    var optDark = document.getElementById('label-opt-dark');
    if (optDark) optDark.textContent = d.themeDark;

    // Headlines in Carousel
    d.headlines.forEach(function (text, i) {
      var h = document.getElementById('headline-' + i);
      if (h) h.innerHTML = text;
    });

    // Update Popover items active state
    var langItems = document.querySelectorAll('[data-lang-opt]');
    langItems.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang-opt') === lang);
    });
  }

  // 5. Update Theme UI
  function updateThemeUI(theme, persist) {
    currentTheme = theme;
    if (persist) {
      setCookie('s4ras_theme', theme);
    }
    applyThemeSync(theme);

    var d = DICTIONARY[currentLang] || DICTIONARY.id;
    var themeTriggerLabel = document.getElementById('theme-trigger-label');
    if (themeTriggerLabel) {
      themeTriggerLabel.textContent = theme === 'light' ? d.themeLight : d.themeDark;
    }

    var themeItems = document.querySelectorAll('[data-theme-opt]');
    themeItems.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-theme-opt') === theme);
    });
  }

  // 6. Auto-Sliding Carousel (Interval 2000ms / 2 seconds)
  var currentSlide = 0;
  var totalSlides = 3;
  var carouselTimer = null;

  function initCarousel() {
    var slides = document.querySelectorAll('.s4ras-slide');
    var headlines = document.querySelectorAll('.s4ras-vis-headline');
    var dashes = document.querySelectorAll('.s4ras-dash');

    if (slides.length === 0) return;

    function goToSlide(index) {
      currentSlide = (index + totalSlides) % totalSlides;

      slides.forEach(function (s, i) {
        s.classList.toggle('active', i === currentSlide);
      });

      headlines.forEach(function (h, i) {
        h.classList.toggle('active', i === currentSlide);
      });

      dashes.forEach(function (d, i) {
        d.classList.toggle('active', i === currentSlide);
      });
    }

    function startTimer() {
      if (carouselTimer) clearInterval(carouselTimer);
      carouselTimer = setInterval(function () {
        goToSlide(currentSlide + 1);
      }, 2000);
    }

    // Allow clicking dash pills to select slide directly
    dashes.forEach(function (dash, i) {
      dash.addEventListener('click', function () {
        goToSlide(i);
        startTimer(); // Reset interval on click
      });
    });

    // Start auto-slide
    startTimer();
  }

  // 7. myITS-Style Floating Popover Menus
  function initPopovers() {
    var langTrigger = document.getElementById('lang-trigger');
    var langPopover = document.getElementById('lang-popover');
    var themeTrigger = document.getElementById('theme-trigger');
    var themePopover = document.getElementById('theme-popover');

    function closeAllPopovers() {
      if (langPopover) {
        langPopover.classList.remove('open');
        if (langTrigger) langTrigger.setAttribute('aria-expanded', 'false');
      }
      if (themePopover) {
        themePopover.classList.remove('open');
        if (themeTrigger) themeTrigger.setAttribute('aria-expanded', 'false');
      }
    }

    if (langTrigger && langPopover) {
      langTrigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = langPopover.classList.contains('open');
        closeAllPopovers();
        if (!isOpen) {
          langPopover.classList.add('open');
          langTrigger.setAttribute('aria-expanded', 'true');
        }
      });
    }

    if (themeTrigger && themePopover) {
      themeTrigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = themePopover.classList.contains('open');
        closeAllPopovers();
        if (!isOpen) {
          themePopover.classList.add('open');
          themeTrigger.setAttribute('aria-expanded', 'true');
        }
      });
    }

    // Option clicks
    var langOptions = document.querySelectorAll('[data-lang-opt]');
    langOptions.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var opt = btn.getAttribute('data-lang-opt');
        updateLanguageUI(opt, true);
        closeAllPopovers();
      });
    });

    var themeOptions = document.querySelectorAll('[data-theme-opt]');
    themeOptions.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var opt = btn.getAttribute('data-theme-opt');
        updateThemeUI(opt, true);
        closeAllPopovers();
      });
    });

    // Close on click outside or escape key
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.s4ras-popover-wrap')) {
        closeAllPopovers();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAllPopovers();
      }
    });
  }
})();
