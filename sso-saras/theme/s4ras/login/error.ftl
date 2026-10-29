<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>

<#if section = "header">
    ${msg("errorTitle")!"Terjadi Kesalahan"}
<#elseif section = "form">
    <div id="kc-error-message">
        <p class="s4ras-error-desc">${kcSanitize(message.summary)?no_esc}</p>
        <#if skipLink??>
        <#else>
            <#if client?? && client.baseUrl?has_content>
                <div class="s4ras-action-link">
                    <a id="backToApplication" class="s4ras-btn-secondary" href="${client.baseUrl}">${kcSanitize(msg("backToApplication"))!"Kembali ke Aplikasi"}</a>
                </div>
            </#if>
        </#if>
    </div>
</#if>

</@layout.registrationLayout>
