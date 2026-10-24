/* global vi */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Akun from '../pages/Akun';
import { ThemeLanguageProvider } from '../context/ThemeLanguageContext';

const mockAccountManagement = vi.fn();

vi.mock('../context/KeycloakContext', () => ({
  useKeycloak: () => ({
    keycloak: {
      token: 'mock-token',
      accountManagement: mockAccountManagement
    },
    authenticated: true,
    initialized: true,
    isAdmin: true,
    persona: 'dev',
    roleLabel: 'Administrator',
    sipExtension: '1074700',
    storageQuota: '500GB',
    department: 'Direktorat Sistem Informasi & Digitalisasi',
    moodleCohort: 'ADMIN-CLUSTER',
    profile: {
      username: 'admin',
      firstName: 'Sivitas',
      lastName: 'Akademika',
      email: 'civitas@s4ras.site',
      attributes: {
        phone: ['081200000001'],
        studentId: ['5048000001'],
        altEmail: ['civitas@s4ras.site']
      }
    }
  })
}));

test('renders Akun page without runtime crash and handles Keycloak navigation', () => {
  render(
    <ThemeLanguageProvider>
      <MemoryRouter>
        <Akun />
      </MemoryRouter>
    </ThemeLanguageProvider>
  );

  // Checks header and profile information
  expect(screen.getAllByText('Akun').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Sivitas Akademika').length).toBeGreaterThan(0);
  // Verify removed badges are absent
  expect(screen.queryByText('S4RAS Civitas ID')).toBeNull();
  expect(screen.queryByText(/WebRTC SIP Ready/i)).toBeNull();
  expect(screen.queryByText(/Departemen \/ Unit/i)).toBeNull();
  expect(screen.queryByText(/Alokasi Penyimpanan/i)).toBeNull();

  expect(screen.getByText('myITS ID')).toBeDefined();
  expect(screen.getByText('5048000001')).toBeDefined();

  // Test handleOpenKeycloak interaction
  const ssoButton = screen.getByText('Pusat Akun Sivitas');
  expect(ssoButton).toBeDefined();
  fireEvent.click(ssoButton);
  expect(mockAccountManagement).toHaveBeenCalled();
});
