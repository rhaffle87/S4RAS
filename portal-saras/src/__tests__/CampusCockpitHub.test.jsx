/* global vi */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CampusCockpitHub from '../components/CampusCockpitHub';
import { ThemeLanguageProvider } from '../context/ThemeLanguageContext';

vi.mock('../context/KeycloakContext', () => ({
  useKeycloak: () => ({
    keycloak: { token: 'mock-token' },
    authenticated: true,
    initialized: true,
    isAdmin: true,
    persona: 'fellow',
    roleLabel: 'Research Fellow',
    sipExtension: '1079348',
    storageQuota: '200GB',
    moodleCohort: 'RESEARCH-FELLOW-2026',
    profile: { username: 'testuser', email: 'civitas@s4ras.site' }
  })
}));

beforeAll(() => {
  global.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/academic/summary')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          status: 'ok',
          stats: { gpa: '4.00' },
          enrolledCourses: [{ id: 'KOM-401', name: 'Sistem Terdistribusi', progress: 80, completedModules: 12, totalModules: 14, schedule: 'Senin' }],
          upcomingDeadlines: [{ id: 'assign-1', courseName: 'KOM-401', title: 'Tugas 1: Raft', daysLeft: 7, submitted: false }]
        })
      });
    }
    if (url.includes('/api/storage/summary')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          status: 'ok',
          usedGB: '76.4',
          totalGB: 200,
          usedPercent: 38,
          sharedFolders: [{ id: 'dir-1', name: 'Riset_Laboratorium', size: '12.6 GB', itemCount: 54, url: '#' }],
          recentFiles: [{ id: 'f-1', name: 'Dataset.csv', size: '18MB', updatedAt: 'Today' }]
        })
      });
    }
    if (url.includes('/api/media/watchlist')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          status: 'ok',
          liveChannels: [{ id: 'ch-1', name: 'TVRI Nasional HD', status: 'LIVE', resolution: '1080p', viewers: 100, url: '#' }],
          featuredMedia: []
        })
      });
    }
    if (url.includes('/api/voicemail/status')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 'ok', newMsg: 0, mailboxes: {} })
      });
    }
    if (url.includes('/api/events')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          status: 'ok',
          events: [{ id: 'evt-1', service: 'cluster', title: 'Cluster Synced', message: 'All nodes healthy' }]
        })
      });
    }
    if (url.includes('/api/webhooks/event')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          status: 'success',
          event: { id: 'evt-2', service: 'moodle', title: 'Test Dispatched' }
        })
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({})
    });
  });
});

afterAll(() => {
  global.fetch.mockRestore?.();
});

test('renders CampusCockpitHub and displays overview cards', async () => {
  render(
    <ThemeLanguageProvider>
      <CampusCockpitHub />
    </ThemeLanguageProvider>
  );

  expect(await screen.findByText(/S4RAS Campus Cockpit|Kokpit Terpadu/i)).toBeInTheDocument();
  expect(await screen.findByText(/Moodle LMS/i)).toBeInTheDocument();
  expect(await screen.findByText(/Nextcloud SAN/i)).toBeInTheDocument();
  expect(await screen.findByText(/Asterisk 22/i)).toBeInTheDocument();
  expect(await screen.findByText(/Jellyfin IPTV/i)).toBeInTheDocument();
});

test('can switch between tabs in CampusCockpitHub', async () => {
  render(
    <ThemeLanguageProvider>
      <CampusCockpitHub />
    </ThemeLanguageProvider>
  );

  const academicTab = screen.getByRole('button', { name: /Akademik|Academic/i });
  fireEvent.click(academicTab);

  expect(await screen.findByText(/Mata Kuliah Semester Gasal|Enrolled Academic Courses/i)).toBeInTheDocument();

  const storageTab = screen.getByRole('button', { name: /Penyimpanan|Cloud SAN/i });
  fireEvent.click(storageTab);

  expect(await screen.findByText(/Alokasi Kuota Penyimpanan|Storage Quota/i)).toBeInTheDocument();

  const telephonyTab = screen.getByRole('button', { name: /Telefoni|VoIP \/ PBX/i });
  fireEvent.click(telephonyTab);

  expect(await screen.findByText(/Kredensial Telefoni WebRTC|WebRTC SIP Credentials/i)).toBeInTheDocument();
});
