<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

<#if section = "header">
    ${msg("loginTitle")!"Masuk ke Akun Anda"}
<#elseif section = "form">
    <form id="kc-form-login" class="s4ras-form" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post" novalidate="novalidate">
        <div class="s4ras-field">
            <label for="username" class="s4ras-label">${msg("usernameOrEmail")!"Username atau Email"}</label>
            <input tabindex="1" id="username" class="s4ras-input" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="username" placeholder="${msg("usernameOrEmail")!"Masukkan username atau email"}" />
        </div>

        <div class="s4ras-field">
            <label for="password" class="s4ras-label">${msg("password")!"Password"}</label>
            <div class="s4ras-password-wrap">
                <input tabindex="2" id="password" class="s4ras-input s4ras-input-pw" name="password" type="password" autocomplete="current-password" placeholder="${msg("password")!"Masukkan password"}" />
                <button type="button" class="s4ras-pw-toggle" aria-label="${msg("showPassword")!"Tampilkan password"}" data-password-toggle aria-controls="password">
                    <!-- Eye Open SVG (shown when password is hidden) -->
                    <svg class="s4ras-icon-eye" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <!-- Eye Off SVG (shown when password is visible) -->
                    <svg class="s4ras-icon-eye-off" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
                        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
                        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>
                        <path d="m2 2 20 20"/>
                    </svg>
                </button>
            </div>
        </div>

        <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth?has_content && auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>

        <button tabindex="3" class="s4ras-btn-submit" name="login" id="kc-login" type="submit">${msg("doLogIn")!"Sign In"}</button>
    </form>

    <div class="s4ras-help-text">
        ${msg("s4rasLoginForgotHelp")!"Lupa password? Hubungi administrator S4RAS."}
    </div>
</#if>

</@layout.registrationLayout>
