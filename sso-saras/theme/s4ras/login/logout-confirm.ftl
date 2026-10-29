<#import "template.ftl" as layout>
<@layout.registrationLayout; section>

<#if section = "header">
    ${msg("logoutConfirmTitle")!"Konfirmasi Keluar"}
<#elseif section = "form">
    <div class="s4ras-help-text" style="text-align: left; margin-bottom: 20px;">
        ${msg("logoutConfirmHeader")!"Apakah Anda yakin ingin keluar dari semua sesi akun S4RAS?"}
    </div>

    <form class="s4ras-form" action="${url.logoutConfirmAction}" method="POST">
        <input type="hidden" name="session_code" value="${logoutConfirm.code}">
        <div class="s4ras-btn-row">
            <button class="s4ras-btn-submit" name="confirmLogout" id="kc-logout" type="submit">
                ${msg("doLogout")!"Ya, Keluar"}
            </button>
        </div>
    </form>
</#if>

</@layout.registrationLayout>
