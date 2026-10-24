/* global vi */

import '@testing-library/jest-dom';

// Mock Keycloak for Vitest so `keycloak-js` ESM code does not break tests.
vi.mock('keycloak-js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(true),
      login: vi.fn(),
      logout: vi.fn(),
      loadUserProfile: vi.fn().mockResolvedValue({
        username: 'ci-user',
        email: 'ci-user@example.com',
        firstName: 'CI',
        lastName: 'User',
        attributes: { role: ['admin'] }
      }),
      onReady: null,
      onAuthSuccess: null,
      onAuthError: null,
      onAuthRefreshSuccess: null,
      onAuthRefreshError: null,
      onTokenExpired: null,
      token: 'fake-token',
      tokenParsed: {
        preferred_username: 'ci-user'
      }
    }))
  };
});
