/**
 * S4RAS Password Visibility Toggle
 * Keycloak 26 CSP-compliant script (script-src 'self')
 * Handles all password toggle buttons with aria-pressed & multi-field support
 */
document.addEventListener('DOMContentLoaded', function () {
  const toggleButtons = document.querySelectorAll('.s4ras-pw-toggle, [data-password-toggle]');

  toggleButtons.forEach(function (toggleBtn) {
    // Find target input: either via aria-controls, preceding input, or #password
    let targetId = toggleBtn.getAttribute('aria-controls');
    let pwInput = targetId ? document.getElementById(targetId) : null;

    if (!pwInput) {
      const container = toggleBtn.closest('.s4ras-input-wrap, .s4ras-form-group');
      if (container) {
        pwInput = container.querySelector('input[type="password"], input[type="text"]');
      }
    }

    if (!pwInput) {
      pwInput = document.getElementById('password');
    }

    if (!pwInput) return;

    // Initialize aria-pressed
    toggleBtn.setAttribute('aria-pressed', pwInput.getAttribute('type') === 'text' ? 'true' : 'false');

    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const isPassword = pwInput.getAttribute('type') === 'password';
      const newType = isPassword ? 'text' : 'password';
      pwInput.setAttribute('type', newType);
      toggleBtn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', isPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
      pwInput.focus();
    });
  });
});
