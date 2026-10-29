/**
 * S4RAS Password Visibility Toggle
 * Keycloak 26 CSP-compliant script (script-src 'self')
 */
document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.querySelector('.s4ras-pw-toggle');
  const pwInput = document.getElementById('password');

  if (toggleBtn && pwInput) {
    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const isPassword = pwInput.getAttribute('type') === 'password';
      const newType = isPassword ? 'text' : 'password';
      pwInput.setAttribute('type', newType);
      toggleBtn.setAttribute('aria-label', isPassword ? 'Sembunyikan password' : 'Tampilkan password');
      pwInput.focus();
    });
  }
});
