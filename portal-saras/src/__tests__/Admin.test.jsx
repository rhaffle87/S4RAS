/* global vi */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Admin from '../pages/Admin';
import { ThemeLanguageProvider } from '../context/ThemeLanguageContext';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../context/KeycloakContext', () => ({
  useKeycloak: () => ({
    authenticated: true,
    initialized: true,
    isAdmin: true,
    persona: 'admin',
    roleLabel: 'Cluster Administrator',
    profile: {
      username: 'admin',
      email: 'admin@s4ras.site'
    }
  })
}));

beforeAll(() => {
  global.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/health')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy', uptime: 12345 })
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success' })
    });
  });
});

afterAll(() => {
  global.fetch.mockRestore?.();
});

test('renders simplified Admin page with primary cards and actions', async () => {
  render(
    <ThemeLanguageProvider>
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    </ThemeLanguageProvider>
  );

  // Check header
  expect(screen.getByText(/Panel Administrasi Klaster/i)).toBeInTheDocument();

  // Check Deploy button
  const deployBtn = screen.getByRole('button', { name: /Trigger Deploy PM2/i });
  expect(deployBtn).toBeInTheDocument();

  // Check Gateway Probe button
  const probeBtn = screen.getByRole('button', { name: /Uji Endpoint Gateway/i });
  expect(probeBtn).toBeInTheDocument();
  fireEvent.click(probeBtn);

  await waitFor(() => {
    expect(screen.getByText(/Gateway Ready/i)).toBeInTheDocument();
  });
});
