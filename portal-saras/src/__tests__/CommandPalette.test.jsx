/* global vi */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommandPalette from '../components/CommandPalette';

const mockNavItems = [
  { to: '/home', label: 'Beranda' },
  { to: '/akun', label: 'Akun' },
  { to: '/pengumuman', label: 'Pengumuman' },
  { to: '/admin', label: 'Admin' },
];

describe('CommandPalette (Ctrl/Cmd+K)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('opens via open-command-palette event and closes on Escape', () => {
    render(
      <MemoryRouter>
        <CommandPalette navItems={mockNavItems} language="id" isAdmin={false} />
      </MemoryRouter>
    );

    // Initially not in document
    expect(screen.queryByRole('dialog')).toBeNull();

    // Trigger open event
    act(() => {
      window.dispatchEvent(new Event('open-command-palette'));
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();

    // Press Escape to close
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('filters admin-only services when isAdmin is false', () => {
    render(
      <MemoryRouter>
        <CommandPalette navItems={mockNavItems} language="id" isAdmin={false} />
      </MemoryRouter>
    );

    act(() => {
      window.dispatchEvent(new Event('open-command-palette'));
    });

    // Moodle LMS and Nextcloud should exist
    expect(screen.getByText('Moodle LMS')).toBeInTheDocument();
    expect(screen.getByText('Nextcloud SAN')).toBeInTheDocument();

    // Monitoring (Grafana) and Benchmark should NOT exist for non-admin
    expect(screen.queryByText('Monitoring')).toBeNull();
    expect(screen.queryByText('Benchmark Reports')).toBeNull();
  });

  test('shows admin services when isAdmin is true', () => {
    render(
      <MemoryRouter>
        <CommandPalette navItems={mockNavItems} language="id" isAdmin={true} />
      </MemoryRouter>
    );

    act(() => {
      window.dispatchEvent(new Event('open-command-palette'));
    });

    // Monitoring (Grafana) and Benchmark should exist for admin
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Benchmark Reports')).toBeInTheDocument();
  });

  test('filters results according to user query', () => {
    render(
      <MemoryRouter>
        <CommandPalette navItems={mockNavItems} language="id" isAdmin={true} />
      </MemoryRouter>
    );

    act(() => {
      window.dispatchEvent(new Event('open-command-palette'));
    });

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'moodle' } });

    expect(screen.getByText('Moodle LMS')).toBeInTheDocument();
    expect(screen.queryByText('Nextcloud SAN')).toBeNull();
  });
});
