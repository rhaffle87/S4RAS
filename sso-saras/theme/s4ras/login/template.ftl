<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html lang="${lang}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="color-scheme" content="dark light">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

    <title>${msg("loginTitle",(realm.displayName!'myS4RAS Portal'))}</title>
    <link rel="icon" type="image/svg+xml" href="${url.resourcesPath}/img/favicon.svg" />
    <link rel="alternate icon" type="image/x-icon" href="${url.resourcesPath}/img/favicon.ico" />

    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>

    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
</head>

<body>
<div class="s4ras-shell">
    <!-- Visual Inset Panel (Left column on >= 960px, hidden on < 960px) -->
    <aside class="s4ras-visual-panel" aria-label="Visual Gallery">
        <!-- 3-Slide Atmospheric Carousel Viewport -->
        <div class="s4ras-carousel-viewport" aria-hidden="true">
            <!-- Slide 1: Crimson Dusk Dunes -->
            <div class="s4ras-slide active" data-slide-index="0">
                <svg class="s4ras-scenic-art" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="skyDusk" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#2a1636" />
                            <stop offset="35%" stop-color="#3d1d36" />
                            <stop offset="60%" stop-color="#4e2133" />
                            <stop offset="85%" stop-color="#281423" />
                            <stop offset="100%" stop-color="#140a17" />
                        </linearGradient>
                        <radialGradient id="glowDusk" cx="45%" cy="58%" r="65%">
                            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.22" />
                            <stop offset="60%" stop-color="#a855f7" stop-opacity="0.08" />
                            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="600" height="800" fill="url(#skyDusk)" />
                    <rect width="600" height="800" fill="url(#glowDusk)" />
                    <g fill="#ffffff" opacity="0.45">
                        <circle cx="85" cy="110" r="1.2" opacity="0.7"/>
                        <circle cx="160" cy="75" r="1.5" opacity="0.5"/>
                        <circle cx="240" cy="140" r="1" opacity="0.6"/>
                        <circle cx="310" cy="90" r="1.8" opacity="0.8"/>
                        <circle cx="420" cy="60" r="1.2" opacity="0.4"/>
                        <circle cx="510" cy="130" r="1.4" opacity="0.7"/>
                        <circle cx="120" cy="210" r="1" opacity="0.5"/>
                        <circle cx="280" cy="220" r="1.3" opacity="0.6"/>
                        <circle cx="480" cy="190" r="1.5" opacity="0.55"/>
                    </g>
                    <path d="M0,490 Q150,450 320,495 T600,470 L600,800 L0,800 Z" fill="#25142f" opacity="0.85" />
                    <path d="M0,560 C120,530 260,490 380,520 C490,550 540,590 600,600 L600,800 L0,800 Z" fill="#180c20" />
                    <path d="M0,560 C120,530 260,490 380,520 C490,550 540,590 600,600" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />
                    <path d="M0,640 C140,650 240,600 360,630 C470,660 530,710 600,740 L600,800 L0,800 Z" fill="#0d0612" />
                    <path d="M0,640 C140,650 240,600 360,630 C470,660 530,710 600,740" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.2" />
                </svg>
            </div>

            <!-- Slide 2: Midnight Constellation Horizon -->
            <div class="s4ras-slide" data-slide-index="1">
                <svg class="s4ras-scenic-art" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="skyMidnight" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#0c1322" />
                            <stop offset="40%" stop-color="#141c38" />
                            <stop offset="70%" stop-color="#1f1e4d" />
                            <stop offset="90%" stop-color="#111328" />
                            <stop offset="100%" stop-color="#070913" />
                        </linearGradient>
                        <radialGradient id="glowMidnight" cx="50%" cy="50%" r="60%">
                            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.18" />
                            <stop offset="50%" stop-color="#6366f1" stop-opacity="0.10" />
                            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="600" height="800" fill="url(#skyMidnight)" />
                    <rect width="600" height="800" fill="url(#glowMidnight)" />
                    <!-- Rich Constellation Points & Lines -->
                    <g fill="#ffffff">
                        <circle cx="95" cy="80" r="1.8" opacity="0.9"/>
                        <circle cx="140" cy="115" r="1.3" opacity="0.7"/>
                        <circle cx="195" cy="95" r="2.2" opacity="0.95"/>
                        <circle cx="270" cy="130" r="1.2" opacity="0.6"/>
                        <circle cx="360" cy="70" r="1.7" opacity="0.8"/>
                        <circle cx="430" cy="110" r="2" opacity="0.9"/>
                        <circle cx="505" cy="85" r="1.3" opacity="0.75"/>
                        <circle cx="110" cy="190" r="1.4" opacity="0.6"/>
                        <circle cx="230" cy="220" r="1.9" opacity="0.85"/>
                        <circle cx="330" cy="195" r="1.2" opacity="0.5"/>
                        <circle cx="470" cy="240" r="1.6" opacity="0.8"/>
                    </g>
                    <!-- Constellation connection lines -->
                    <g stroke="rgba(255,255,255,0.18)" stroke-width="0.8" stroke-dasharray="3 3">
                        <line x1="95" y1="80" x2="140" y2="115" />
                        <line x1="140" y1="115" x2="195" y2="95" />
                        <line x1="360" y1="70" x2="430" y2="110" />
                        <line x1="430" y1="110" x2="505" y2="85" />
                    </g>
                    <path d="M0,480 C180,440 280,510 420,470 C510,445 560,460 600,470 L600,800 L0,800 Z" fill="#141a33" opacity="0.85" />
                    <path d="M0,550 C130,520 270,570 390,530 C490,495 550,530 600,545 L600,800 L0,800 Z" fill="#0d1224" />
                    <path d="M0,550 C130,520 270,570 390,530 C490,495 550,530 600,545" fill="none" stroke="rgba(56,189,248,0.22)" stroke-width="1.5" />
                    <path d="M0,630 C120,600 240,640 370,610 C480,580 540,630 600,660 L600,800 L0,800 Z" fill="#060913" />
                </svg>
            </div>

            <!-- Slide 3: Dawn Archipelago Peaks -->
            <div class="s4ras-slide" data-slide-index="2">
                <svg class="s4ras-scenic-art" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="skyDawn" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#3b1322" />
                            <stop offset="30%" stop-color="#551a24" />
                            <stop offset="60%" stop-color="#7a2622" />
                            <stop offset="85%" stop-color="#38101a" />
                            <stop offset="100%" stop-color="#14060b" />
                        </linearGradient>
                        <radialGradient id="glowDawn" cx="50%" cy="65%" r="55%">
                            <stop offset="0%" stop-color="#fb923c" stop-opacity="0.32" />
                            <stop offset="40%" stop-color="#ef4444" stop-opacity="0.18" />
                            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="600" height="800" fill="url(#skyDawn)" />
                    <rect width="600" height="800" fill="url(#glowDawn)" />
                    <!-- Rising dawn stars -->
                    <g fill="#ffffff" opacity="0.4">
                        <circle cx="100" cy="90" r="1.3" opacity="0.6"/>
                        <circle cx="210" cy="70" r="1.7" opacity="0.8"/>
                        <circle cx="340" cy="110" r="1.1" opacity="0.5"/>
                        <circle cx="460" cy="80" r="1.5" opacity="0.7"/>
                        <circle cx="170" cy="160" r="1.2" opacity="0.5"/>
                        <circle cx="390" cy="170" r="1.6" opacity="0.6"/>
                    </g>
                    <!-- Layered Archipelago Mountain Peaks -->
                    <path d="M0,510 L70,470 L140,515 L220,460 L310,520 L400,450 L490,510 L600,460 L600,800 L0,800 Z" fill="#2d0f1a" opacity="0.8" />
                    <path d="M0,570 L110,500 L200,560 L290,490 L400,570 L510,510 L600,580 L600,800 L0,800 Z" fill="#1b0811" />
                    <path d="M0,570 L110,500 L200,560 L290,490 L400,570 L510,510 L600,580" fill="none" stroke="rgba(251,146,60,0.18)" stroke-width="1.5" />
                    <path d="M0,640 C140,620 220,660 350,620 C460,590 520,650 600,680 L600,800 L0,800 Z" fill="#0d0307" />
                </svg>
            </div>
        </div>

        <!-- Top Header: Portal Bento Logo Mark on Left, Refined Back Pill on Right -->
        <div class="s4ras-vis-top">
            <a href="https://s4ras.site" class="s4ras-vis-brand" tabindex="-1">
                <!-- Canonical myS4RAS Portal Bento Logo Mark (#dc2626 solid + 4 white nodes) -->
                <svg class="s4ras-vis-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect x="4" y="4" width="92" height="92" rx="22" fill="#dc2626"/>
                    <g stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.45">
                        <line x1="46" y1="34" x2="56" y2="34"/>
                        <line x1="34" y1="46" x2="34" y2="56"/>
                        <line x1="56" y1="68" x2="46" y2="68"/>
                        <line x1="68" y1="56" x2="68" y2="46"/>
                    </g>
                    <!-- Bento Module Tiles -->
                    <rect x="22" y="22" width="24" height="24" rx="7" fill="#ffffff"/>
                    <rect x="22" y="56" width="24" height="24" rx="7" fill="#ffffff"/>
                    <rect x="56" y="56" width="24" height="24" rx="7" fill="#ffffff"/>
                    <!-- Top-Right Portal Signal Node -->
                    <circle cx="68" cy="34" r="14" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
                    <circle cx="68" cy="34" r="8" fill="#ffffff"/>
                    <circle cx="68" cy="34" r="3" fill="#dc2626"/>
                </svg>
                <span class="s4ras-vis-title">my<span class="s4ras-accent-brand">S4RAS</span> Portal</span>
            </a>

            <a href="https://s4ras.site" class="s4ras-vis-pill s4ras-back-pill" id="s4ras-back-link" title="S4RAS Ecosystem" tabindex="-1">
                <span id="s4ras-back-text">${msg("s4rasBackToWebsite")!"Kembali ke S4RAS"}</span>
                <svg class="s4ras-arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
        </div>

        <!-- Bottom Editorial Typography & Dash Indicators -->
        <div class="s4ras-vis-bottom">
            <div class="s4ras-headlines-wrap">
                <h2 class="s4ras-vis-headline active" data-headline-index="0" id="headline-0">
                    ${kcSanitize(msg("s4rasVisualTagline1")!"Satu Identitas,<br>Seluruh Layanan Ekosistem")?no_esc}
                </h2>
                <h2 class="s4ras-vis-headline" data-headline-index="1" id="headline-1">
                    ${kcSanitize(msg("s4rasVisualTagline2")!"Terhubung Tanpa Batas,<br>Infrastruktur Mandiri 3T")?no_esc}
                </h2>
                <h2 class="s4ras-vis-headline" data-headline-index="2" id="headline-2">
                    ${kcSanitize(msg("s4rasVisualTagline3")!"Akses Cepat & Aman,<br>Pembelajaran hingga Komunikasi")?no_esc}
                </h2>
            </div>
            <div class="s4ras-vis-dashes" role="tablist" aria-label="Slide Indicator">
                <button type="button" class="s4ras-dash active" data-dash-index="0" aria-label="Slide 1"></button>
                <button type="button" class="s4ras-dash" data-dash-index="1" aria-label="Slide 2"></button>
                <button type="button" class="s4ras-dash" data-dash-index="2" aria-label="Slide 3"></button>
            </div>
        </div>
    </aside>

    <!-- Form Panel (Right column on >= 960px, full-bleed centered on < 960px) -->
    <main class="s4ras-form-panel">
        <div class="s4ras-form-container">
            <!-- Mobile Brand Header (only displayed on < 960px) -->
            <div class="s4ras-mobile-brand">
                <a href="https://s4ras.site" class="s4ras-mobile-brand-link" title="S4RAS Ecosystem">
                    <svg class="s4ras-brand-logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="4" y="4" width="92" height="92" rx="22" fill="#dc2626"/>
                        <g stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.45">
                            <line x1="46" y1="34" x2="56" y2="34"/>
                            <line x1="34" y1="46" x2="34" y2="56"/>
                            <line x1="56" y1="68" x2="46" y2="68"/>
                            <line x1="68" y1="56" x2="68" y2="46"/>
                        </g>
                        <rect x="22" y="22" width="24" height="24" rx="7" fill="#ffffff"/>
                        <rect x="22" y="56" width="24" height="24" rx="7" fill="#ffffff"/>
                        <rect x="56" y="56" width="24" height="24" rx="7" fill="#ffffff"/>
                        <circle cx="68" cy="34" r="14" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
                        <circle cx="68" cy="34" r="8" fill="#ffffff"/>
                        <circle cx="68" cy="34" r="3" fill="#dc2626"/>
                    </svg>
                    <span class="s4ras-mobile-title">my<span class="s4ras-accent-brand">S4RAS</span> Portal</span>
                </a>
            </div>

            <div class="s4ras-form-header">
                <h1 class="s4ras-form-title" id="form-main-title"><#nested "header"></h1>
                <p class="s4ras-form-subtitle" id="form-main-subtitle">
                    ${msg("loginSubTitle")!"Satu akun terpadu untuk seluruh layanan"}
                </p>
            </div>

            <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <div class="s4ras-alert s4ras-alert-${message.type}">
                    <svg class="s4ras-alert-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <span>${kcSanitize(message.summary)?no_esc}</span>
                </div>
            </#if>

            <#nested "form">

            <!-- myITS-Style Dropdown Footer Bar for Language and Theme Popovers -->
            <footer class="s4ras-form-footer">
                <!-- Language Selector Popover -->
                <div class="s4ras-popover-wrap" id="lang-popover-wrap">
                    <button type="button" class="s4ras-footer-trigger" id="lang-trigger" aria-haspopup="true" aria-expanded="false" title="Pilih Bahasa / Select Language">
                        <svg class="s4ras-trigger-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        <span id="lang-trigger-label">${(lang == 'en')?then('English', 'Bahasa Indonesia')}</span>
                        <span class="s4ras-caret" aria-hidden="true">▾</span>
                    </button>
                    <div class="s4ras-popover" id="lang-popover" role="menu" aria-hidden="true">
                        <button type="button" class="s4ras-popover-item <#if lang != 'en'>active</#if>" data-lang-opt="id" role="menuitem">
                            <span>Bahasa Indonesia</span>
                            <svg class="s4ras-check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button type="button" class="s4ras-popover-item <#if lang == 'en'>active</#if>" data-lang-opt="en" role="menuitem">
                            <span>English</span>
                            <svg class="s4ras-check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Theme Selector Popover -->
                <div class="s4ras-popover-wrap" id="theme-popover-wrap">
                    <button type="button" class="s4ras-footer-trigger" id="theme-trigger" aria-haspopup="true" aria-expanded="false" title="Pilih Tema / Select Theme">
                        <svg class="s4ras-trigger-icon icon-moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                        <svg class="s4ras-trigger-icon icon-sun" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="5"/>
                            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                        <span id="theme-trigger-label">${msg("s4rasThemeDark")!"Mode Gelap"}</span>
                        <span class="s4ras-caret" aria-hidden="true">▾</span>
                    </button>
                    <div class="s4ras-popover" id="theme-popover" role="menu" aria-hidden="true">
                        <button type="button" class="s4ras-popover-item" data-theme-opt="light" role="menuitem">
                            <span id="label-opt-light">${msg("s4rasThemeLight")!"Mode Terang"}</span>
                            <svg class="s4ras-check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button type="button" class="s4ras-popover-item active" data-theme-opt="dark" role="menuitem">
                            <span id="label-opt-dark">${msg("s4rasThemeDark")!"Mode Gelap"}</span>
                            <svg class="s4ras-check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                    </div>
                </div>
            </footer>

            <!-- Mobile Return to Home link (only shown on < 960px) -->
            <div class="s4ras-return-home-mobile">
                <a href="https://s4ras.site" id="s4ras-return-mobile">&larr; ${msg("s4rasReturnHome")!"Kembali ke Beranda"}</a>
            </div>
        </div>
    </main>
</div>
</body>
</html>
</#macro>
