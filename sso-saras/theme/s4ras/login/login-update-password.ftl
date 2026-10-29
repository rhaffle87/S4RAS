<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password-new','password-confirm'); section>

<#if section = "header">
    ${msg("updatePasswordTitle")!"Perbarui Password"}
<#elseif section = "form">
    <form id="kc-passwd-update-form" class="s4ras-form" action="${url.loginAction}" method="post">
        <div class="s4ras-field">
            <label for="password-new" class="s4ras-label">${msg("passwordNew")!"Password Baru"}</label>
            <div class="s4ras-password-wrap">
                <input type="password" id="password-new" name="password-new" class="s4ras-input s4ras-input-pw" autofocus autocomplete="new-password" placeholder="${msg("passwordNew")!"Masukkan password baru"}" />
                <button type="button" class="s4ras-pw-toggle" aria-label="${msg("showPassword")!"Tampilkan password"}" data-password-toggle aria-controls="password-new">
                    <svg class="s4ras-icon-eye" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <svg class="s4ras-icon-eye-off" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
                        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
                        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>
                        <path d="m2 2 20 20"/>
                    </svg>
                </button>
            </div>
            <#if messagesPerField.existsError('password-new')>
                <span class="s4ras-error-text">${kcSanitize(messagesPerField.get('password-new'))?no_esc}</span>
            </#if>
        </div>

        <div class="s4ras-field">
            <label for="password-confirm" class="s4ras-label">${msg("passwordConfirm")!"Konfirmasi Password Baru"}</label>
            <div class="s4ras-password-wrap">
                <input type="password" id="password-confirm" name="password-confirm" class="s4ras-input s4ras-input-pw" autocomplete="new-password" placeholder="${msg("passwordConfirm")!"Ulangi password baru"}" />
                <button type="button" class="s4ras-pw-toggle" aria-label="${msg("showPassword")!"Tampilkan password"}" data-password-toggle aria-controls="password-confirm">
                    <svg class="s4ras-icon-eye" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <svg class="s4ras-icon-eye-off" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
                        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
                        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>
                        <path d="m2 2 20 20"/>
                    </svg>
                </button>
            </div>
            <#if messagesPerField.existsError('password-confirm')>
                <span class="s4ras-error-text">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
            </#if>
        </div>

        <#if isAppInitiatedAction??>
            <div class="s4ras-btn-row">
                <button class="s4ras-btn-submit" type="submit" name="submitAction" value="update">${msg("doSubmit")!"Simpan Password"}</button>
                <button class="s4ras-btn-secondary" type="submit" name="cancel-aio" value="true">${msg("doCancel")!"Batal"}</button>
            </div>
        <#else>
            <button class="s4ras-btn-submit" type="submit">${msg("doSubmit")!"Simpan Password Baru"}</button>
        </#if>
    </form>
</#if>

</@layout.registrationLayout>
