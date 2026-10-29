<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html lang="${lang}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="color-scheme" content="dark">
    <meta name="viewport" content="width=device-width, initial-scale=1">

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
    <header class="s4ras-brand-wrap">
        <a href="https://s4ras.site" class="s4ras-brand-link" title="S4RAS Ecosystem">
            <img src="${url.resourcesPath}/img/favicon.svg" class="s4ras-brand-logo" alt="myS4RAS Portal" />
            <div class="s4ras-brand-title">
                <span class="s4ras-brand-portal">myS4RAS</span>
                <span class="s4ras-brand-service">Portal</span>
            </div>
        </a>
        <p class="s4ras-brand-subtitle">Single Sign-On Ekosistem Layanan 3T</p>
    </header>

    <main class="s4ras-card">
        <h1 class="s4ras-card-title"><#nested "header"></h1>

        <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
            <div class="s4ras-alert">
                <svg class="s4ras-alert-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <span>${kcSanitize(message.summary)?no_esc}</span>
            </div>
        </#if>

        <#nested "form">
    </main>

    <div class="s4ras-return-home">
        <a href="https://s4ras.site">&larr; Kembali ke Beranda</a>
    </div>
</div>
</body>
</html>
</#macro>
