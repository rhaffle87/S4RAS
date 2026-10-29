<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

<#if section = "header">
    Masuk ke Akun Anda
<#elseif section = "form">
    <form id="kc-form-login" class="s4ras-form" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post" novalidate="novalidate">
        <div class="s4ras-field">
            <label for="username" class="s4ras-label">Username atau Email</label>
            <input tabindex="1" id="username" class="s4ras-input" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="username" placeholder="Masukkan username atau email" />
        </div>

        <div class="s4ras-field">
            <label for="password" class="s4ras-label">Password</label>
            <div class="s4ras-password-wrap">
                <input tabindex="2" id="password" class="s4ras-input s4ras-input-pw" name="password" type="password" autocomplete="current-password" placeholder="Masukkan password" />
                <button type="button" class="s4ras-pw-toggle" aria-label="Tampilkan password" onclick="const p=document.getElementById('password'); p.type=p.type==='password'?'text':'password';">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </div>
        </div>

        <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth?has_content && auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>

        <button tabindex="3" class="s4ras-btn-submit" name="login" id="kc-login" type="submit">Sign In</button>
    </form>
</#if>

</@layout.registrationLayout>
