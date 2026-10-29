<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>

<#if section = "header">
    ${msg("pageExpiredTitle")!"Sesi Kedaluwarsa"}
<#elseif section = "form">
    <div id="instruction1" class="s4ras-help-text" style="text-align: left; margin-bottom: 16px;">
        ${msg("pageExpiredMsg1")!"Sesi autentikasi telah kedaluwarsa demi keamanan."}
    </div>

    <a id="loginRestartLink" class="s4ras-btn-submit" href="${url.loginRestartFlowUrl}">
        ${msg("doTryAgain")!"Ulangi Proses Masuk"}
    </a>
</#if>

</@layout.registrationLayout>
