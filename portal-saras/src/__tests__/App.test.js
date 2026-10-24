/* global vi */

import React from 'react';
import App from '../App';
import { render, screen } from '@testing-library/react';

vi.mock('../context/KeycloakContext', () => ({
  KeycloakProvider: ({ children }) => children,
  useKeycloak: () => ({
    authenticated: true,
    initialized: true,
    isAdmin: false,
    profile: {
      username: 'ci-user',
      email: 'ci-user@example.com'
    },
    logout: vi.fn()
  })
}));

beforeAll(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({})
  });
});

afterAll(() => {
  global.fetch.mockRestore?.();
});

test('renders the portal home page and hides Admin navigation for non-admin users', async () => {
  render(React.createElement(App));
  expect(await screen.findByRole('heading', { name: /^Aplikasi$/i, level: 3 })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Admin/i })).not.toBeInTheDocument();
});
