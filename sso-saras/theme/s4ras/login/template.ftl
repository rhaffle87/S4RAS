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
    <aside class="s4ras-visual-panel" aria-hidden="true">
        <!-- Scenic SVG Dunes Artwork (Full-Bleed Responsive Background) -->
        <svg class="s4ras-scenic-art" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Scenic Topography Landscape">
            <defs>
                <!-- Sky Twilight Gradient -->
                <linearGradient id="scenicSky" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#2a1636" />
                    <stop offset="35%" stop-color="#3d1d36" />
                    <stop offset="60%" stop-color="#4e2133" />
                    <stop offset="85%" stop-color="#281423" />
                    <stop offset="100%" stop-color="#140a17" />
                </linearGradient>

                <!-- Distant Dune Gradient -->
                <linearGradient id="duneFar" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#25142f" />
                    <stop offset="100%" stop-color="#150a1d" />
                </linearGradient>

                <!-- Mid Ridge Dune Gradient -->
                <linearGradient id="duneMid" x1="0%" y1="0%" x2="100%" y2="80%">
                    <stop offset="0%" stop-color="#1e1026" />
                    <stop offset="50%" stop-color="#180c20" />
                    <stop offset="100%" stop-color="#0f0714" />
                </linearGradient>

                <!-- Front Dune Deep Shadow Gradient -->
                <linearGradient id="duneFront" x1="30%" y1="0%" x2="70%" y2="100%">
                    <stop offset="0%" stop-color="#140a1b" />
                    <stop offset="40%" stop-color="#0f0715" />
                    <stop offset="100%" stop-color="#07030a" />
                </linearGradient>

                <!-- Subtle Ambient Horizon Glow -->
                <radialGradient id="horizonGlow" cx="45%" cy="58%" r="65%">
                    <stop offset="0%" stop-color="#ef4444" stop-opacity="0.18" />
                    <stop offset="60%" stop-color="#a855f7" stop-opacity="0.08" />
                    <stop offset="100%" stop-color="#000000" stop-opacity="0" />
                </radialGradient>
            </defs>

            <!-- Sky Base -->
            <rect width="600" height="800" fill="url(#scenicSky)" />

            <!-- Soft Horizon Radial Glow -->
            <rect width="600" height="800" fill="url(#horizonGlow)" />

            <!-- Subtle Night Stars / Atmosphere -->
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
                <circle cx="390" cy="270" r="1" opacity="0.4"/>
            </g>

            <!-- Layer 1: Distant Topographic Waves -->
            <path d="M0,490 Q150,450 320,495 T600,470 L600,800 L0,800 Z" fill="url(#duneFar)" opacity="0.85" />

            <!-- Layer 2: Sweeping Mountain / Dune Crest -->
            <path d="M0,560 C120,530 260,490 380,520 C490,550 540,590 600,600 L600,800 L0,800 Z" fill="url(#duneMid)" />
            <!-- Highlight along Ridge 2 -->
            <path d="M0,560 C120,530 260,490 380,520 C490,550 540,590 600,600" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />

            <!-- Layer 3: Foreground Atmospheric Dune -->
            <path d="M0,640 C140,650 240,600 360,630 C470,660 530,710 600,740 L600,800 L0,800 Z" fill="url(#duneFront)" />
            <!-- Subtle Ridge Rim Light -->
            <path d="M0,640 C140,650 240,600 360,630 C470,660 530,710 600,740" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.2" />
        </svg>

        <!-- Top Header: Logo Mark on Left, Glassmorphism Back Button on Right -->
        <div class="s4ras-vis-top">
            <a href="https://s4ras.site" class="s4ras-vis-brand" tabindex="-1">
                <svg class="s4ras-vis-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect x="4" y="4" width="92" height="92" rx="22" fill="none" stroke="currentColor" stroke-width="5"/>
                    <g stroke="currentColor" stroke-width="3.2" stroke-linecap="round" opacity="0.65">
                        <line x1="40.5" y1="35" x2="58.5" y2="35"/>
                        <line x1="35" y1="40.5" x2="35" y2="58.5"/>
                        <line x1="65" y1="40.5" x2="65" y2="58.5"/>
                        <line x1="40.5" y1="65" x2="58.5" y2="65"/>
                    </g>
                    <circle cx="35" cy="35" r="9.5" fill="currentColor"/>
                    <circle cx="65" cy="35" r="7" fill="none" stroke="currentColor" stroke-width="3"/>
                    <circle cx="35" cy="65" r="7" fill="none" stroke="currentColor" stroke-width="3"/>
                    <circle cx="65" cy="65" r="7" fill="none" stroke="currentColor" stroke-width="3"/>
                </svg>
                <span class="s4ras-vis-title">myS4RAS</span>
            </a>

            <a href="https://s4ras.site" class="s4ras-vis-pill" title="S4RAS Ecosystem" tabindex="-1">
                ${msg("s4rasBackToWebsite")!"Kembali ke s4ras.site"} &rarr;
            </a>
        </div>

        <!-- Bottom Editorial Typography & Centered Dash Indicators -->
        <div class="s4ras-vis-bottom">
            <h2 class="s4ras-vis-headline">${kcSanitize(msg("s4rasVisualTagline")!"Satu Identitas,<br>Seluruh Layanan Ekosistem")?no_esc}</h2>
            <div class="s4ras-vis-dashes" aria-hidden="true">
                <span class="s4ras-dash"></span>
                <span class="s4ras-dash active"></span>
                <span class="s4ras-dash"></span>
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
                        <rect x="4" y="4" width="92" height="92" rx="22" fill="none" stroke="currentColor" stroke-width="5"/>
                        <g stroke="currentColor" stroke-width="3.2" stroke-linecap="round" opacity="0.65">
                            <line x1="40.5" y1="35" x2="58.5" y2="35"/>
                            <line x1="35" y1="40.5" x2="35" y2="58.5"/>
                            <line x1="65" y1="40.5" x2="65" y2="58.5"/>
                            <line x1="40.5" y1="65" x2="58.5" y2="65"/>
                        </g>
                        <circle cx="35" cy="35" r="9.5" fill="currentColor"/>
                        <circle cx="65" cy="35" r="7" fill="none" stroke="currentColor" stroke-width="3"/>
                        <circle cx="35" cy="65" r="7" fill="none" stroke="currentColor" stroke-width="3"/>
                        <circle cx="65" cy="65" r="7" fill="none" stroke="currentColor" stroke-width="3"/>
                    </svg>
                    <span class="s4ras-mobile-title">myS4RAS</span>
                </a>
            </div>

            <div class="s4ras-form-header">
                <h1 class="s4ras-form-title"><#nested "header"></h1>
                <p class="s4ras-form-subtitle">
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

            <!-- Mobile Return to Home link (only shown on < 960px) -->
            <div class="s4ras-return-home-mobile">
                <a href="https://s4ras.site">&larr; ${msg("s4rasReturnHome")!"Kembali ke Beranda"}</a>
            </div>
        </div>
    </main>
</div>
</body>
</html>
</#macro>
