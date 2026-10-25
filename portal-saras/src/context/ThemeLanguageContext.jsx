import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeLanguageContext = createContext();

export const useThemeLanguage = () => useContext(ThemeLanguageContext);

const translations = {
  id: {
    // Navigation
    'nav.home': 'Beranda',
    'nav.account': 'Akun',
    'nav.announcements': 'Pengumuman',
    'nav.settings': 'Pengaturan Web',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',
    
    // Beranda / Home
    'home.greeting.morning': 'Selamat pagi',
    'home.greeting.afternoon': 'Selamat siang',
    'home.greeting.evening': 'Selamat sore',
    'home.greeting.night': 'Selamat malam',
    'home.today': 'Hari ini adalah',
    'home.sso_login': 'Anda login menggunakan Single Sign-On (SSO) Portal S4RAS.',
    'home.apps_services': 'Aplikasi dan Layanan',
    'home.service_status': 'Status Layanan',
    'home.status.online': 'Online',
    'home.status.offline': 'Offline',
    'home.status.loading': 'Memuat...',
    'home.notice.text1': 'Butuh bantuan login atau integrasi SSO? Kunjungi halaman ',
    'home.notice.link': 'Pengaturan Web',
    'home.notice.text2': ' atau hubungi admin portal.',
    'home.ann.title': 'Pengumuman Terbaru',
    'home.ann.view_all': 'Lihat semua pengumuman',
    'home.ann.loading': 'Memuat pengumuman...',
    'home.apps': 'Aplikasi',
    'home.apps_integrated': 'Layanan Terintegrasi',
    'home.apps_favorites': 'Favorit',
    'home.apps_show_fav': 'Tampilkan Favorit Saja',
    'home.apps_show_all': 'Tampilkan Semua Aplikasi',
    'home.apps_search': 'Cari aplikasi atau layanan...',
    'home.apps_not_found': 'Tidak ditemukan aplikasi dengan kata kunci',
    'home.edit_favorites': 'Edit Favorit',
    'home.edit_favorites_sub': 'Pilih Hingga 8 Aplikasi',
    'home.manage_account': 'Kelola Akun',
    'home.announcements': 'Pengumuman',
    'home.view_all_announcements': 'Lihat Semua Pengumuman',
    'home.academic_week': 'Pekan Pembelajaran & Pelatihan ke-7',
    'home.modal_fav_title': 'Sesuaikan Aplikasi Favorit',
    'home.modal_fav_desc': 'Pilih aplikasi favorit (maksimal 8) yang akan tampil di halaman utama beranda myS4RAS Portal.',
    'home.modal_fav_selected': 'dipilih',
    'home.modal_fav_save': 'Simpan Favorit',
    'home.modal_fav_cancel': 'Batal',
    'home.modal_fav_reset': 'Atur Ulang Default',
    
    // Service descriptions (Indonesian)
    'service.desc.moodle': 'Platform pembelajaran daring untuk materi dan tugas.',
    'service.desc.sso': 'Otentikasi terpusat untuk seluruh layanan S4RAS.',
    'service.desc.cloud': 'Penyimpanan awan untuk dokumen dan file penting.',
    'service.desc.iptv': 'Layanan IPTV untuk siaran dan konten video.',
    'service.desc.voip': 'Layanan telepon berbasis IP untuk civitas.',
    'service.desc.monitor': 'Dashboard monitoring untuk infrastruktur S4RAS.',

    // Akun / Account
    'account.title': 'Profil Pengguna',
    'account.title_info': 'Informasi Akun',
    'account.back': 'Kembali ke Beranda',
    'account.role': 'Peran',
    'account.username': 'Nama Pengguna',
    'account.email': 'Email',
    'account.firstname': 'Nama Depan',
    'account.lastname': 'Nama Belakang',
    'account.manage_btn': 'Kelola Profil Akun',
    'account.personal_info': 'Informasi Pribadi',
    'account.personal_desc': 'Data diri Anda yang terintegrasi pada sistem SSO S4RAS',
    'account.contact_info': 'Hubungan Kontak',
    'account.contact_desc': 'Alamat email aktif untuk notifikasi sistem',
    'account.fullname': 'Nama Lengkap',
    'account.user_portal': 'Pengguna Portal',
    'account.fullname_sub': 'Nama lengkap terdaftar',
    'account.username_sub': 'ID unik pengguna',
    'account.email_sub': 'Email aktif untuk autentikasi',
    
    // Pengumuman / Announcements
    'ann.title': 'Daftar Pengumuman',
    'ann.back': 'Kembali ke Beranda',
    'ann.search_placeholder': 'Cari pengumuman...',
    'ann.no_results': 'Tidak ada pengumuman yang cocok dengan pencarian Anda.',
    'ann.loading': 'Memuat pengumuman...',
    
    // Roles
    'role.admin': 'Administrator',
    'role.dev': 'Administrator',
    'role.teacher': 'Dosen',
    'role.student': 'Mahasiswa',

    // Pengaturan / Settings
    'set.title': 'Pengaturan Web',
    'set.theme_title': 'Mode Tampilan',
    'set.theme_desc': 'Pilih mode tampilan yang nyaman untuk Anda',
    'set.theme.dark': 'Mode Gelap',
    'set.theme.light': 'Mode Terang',
    'set.lang_title': 'Bahasa',
    'set.lang_desc': 'Pilih bahasa yang Anda gunakan',
    'set.lang.id': 'Bahasa Indonesia',
    'set.lang.en': 'English',
    
    // SSO Integration Card
    'set.sso_title': 'Integrasi Single Sign-On (SSO)',
    'set.sso_desc': 'Status koneksi autentikasi terpusat Keycloak OIDC dan sesi login Anda',
    'set.sso_realm': 'SSO Realm',
    'set.sso_client': 'OIDC Client ID',
    'set.sso_auth_server': 'Auth Server URL',
    'set.sso_status_active': 'Terautentikasi & Aktif',
    'set.sso_session_user': 'Pengguna Aktif',
    'set.sso_manage_btn': 'Buka Akun Keycloak',
    'set.sso_manage_desc': 'Kelola kata sandi, autentikasi 2-faktor (TOTP), dan riwayat sesi login langsung pada server SSO',
    'set.sso_refresh_btn': 'Segarkan Sesi Token',
    'set.sso_refreshing': 'Menyegarkan Sesi...',
    'set.sso_refreshed': 'Sesi token berhasil diperbarui',
    'set.sso_faq_title': 'Panduan Bantuan Login & SSO',
    'set.sso_faq_desc': 'Jika Anda mengalami kendala saat mengakses layanan SSO terpadu:',
    'set.sso_faq_tip1': 'Pastikan peramban Anda mengizinkan cookie dari domain *.s4ras.site.',
    'set.sso_faq_tip2': 'Gunakan username resmi (misal: student1, teacher1, dev1) sesuai hak akses.',
    'set.sso_faq_tip3': 'Jika sesi terputus saat berpindah aplikasi, klik tombol Segarkan Sesi atau logout lalu login kembali.',
    
    // Helpdesk & Contact Admin
    'set.support_title': 'Bantuan & Kontak Administrator',
    'set.support_desc': 'Saluran komunikasi teknis dan pusat bantuan untuk sivitas akademika',
    'set.support_voip': 'Telepon Kampus (VoIP PBX)',
    'set.support_voip_desc': 'Hubungi operator kampus di Ekstensi 1000 atau tele-konsultasi di 1004',
    'set.support_call_btn': 'Panggil Operator (1000)',
    'set.support_call_cons': 'Konsultasi Teknis (1004)',
    'set.support_email': 'Email Helpdesk',
    'set.support_hours': 'Jam Operasional',
    'set.support_hours_val': 'Senin – Jumat, 08:00 – 16:00 WIB',
    'set.support_docs': 'Dokumentasi Sistem',
    'set.support_docs_link': 'Lihat Panduan & Runbook Operasional',

    // Admin
    'admin.title': 'Panel Administrasi Klaster',
    'admin.subtitle': 'Pusat Manajemen Infrastruktur S4RAS, Telemetri Klaster, Kontrol Deploy PM2 & Event Mesh',
    'admin.api_config': 'Konfigurasi API & Gateway',
    'admin.api_url': 'Backend API Gateway URL',
    'admin.not_configured': 'Belum dikonfigurasi',
    'admin.deploy_control': 'Kontrol Deployment Produksi',
    'admin.deploy_desc': 'Trigger build otomatis dan reload klaster PM2 zero-downtime di server produksi VM 208.',
    'admin.deploy_btn': 'Trigger Deploy PM2',
    'admin.deploying': 'Sedang Mendeploy...',
    'admin.deploy_success': 'Deploy Berhasil',
    'admin.deploy_failed': 'Deploy Gagal',
    'admin.telemetry': 'Telemetri & Log Deployment',
    'admin.status': 'Status',
    'admin.commit': 'Commit',
    'admin.build_duration': 'Waktu Build',
    'admin.rollback_badge': 'Proteksi Rollback Aktif',
    'admin.tab_nodes': 'Infrastruktur & Node',
    'admin.tab_deploy': 'Kontrol Deploy & PM2',
    'admin.tab_telemetry': 'Telemetri & Metrik',
    'admin.tab_cockpit': 'Kokpit Sivitas & Event',
    'admin.tab_config': 'Konfigurasi & Gateway',
    'admin.node_title': 'Topologi Node Klaster Virtual S4RAS',
    'admin.node_desc': 'Pemetaan 10 Virtual Machine pada klaster Proxmox VE dengan isolasi jaringan lokal 192.168.10.0/24.',
    'admin.probe_health': 'Uji Endpoint Gateway',
    'admin.copy_url': 'Salin URL',
    'admin.copied': 'Tersalin!',

    // Academic Hub
    'academic.hub_title': 'S4RAS Academic & Course Hub',
    'academic.hub_subtitle': 'Integrasi Terpadu Moodle LMS & Nextcloud SAN Storage',
    'academic.persona_teacher': 'Dosen Pengampu — 3 Kelas Aktif',
    'academic.persona_admin': 'Administrator Kurikulum — Akses Penuh',
    'academic.persona_student': 'Mahasiswa Terdaftar — 3 Mata Kuliah Semester Ini',
    'academic.instructor': 'Dosen',
    'academic.open_course': 'Buka Kelas',
    'academic.san_title': 'Direktori Bersama Nextcloud SAN',
    'academic.open_cloud': 'Buka Cloud Drive',
    'academic.folder_materials': 'Slide, Diktat & Rekaman Kuliah',
    'academic.folder_assignments': 'Pengumpulan & Review Tugas',
    'academic.folder_research': 'Dataset & Skema Eksperimen',
    'academic.count_files': 'Berkas',
    'academic.count_dirs': 'Direktori'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.account': 'Account',
    'nav.announcements': 'Announcements',
    'nav.settings': 'Web Settings',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',
    
    // Roles
    'role.admin': 'Administrator',
    'role.dev': 'Administrator',
    'role.teacher': 'Lecturer',
    'role.student': 'Student',

    // Beranda / Home
    'home.greeting.morning': 'Good morning',
    'home.greeting.afternoon': 'Good afternoon',
    'home.greeting.evening': 'Good evening',
    'home.greeting.night': 'Good night',
    'home.today': 'Today is',
    'home.sso_login': 'You are logged in using Portal S4RAS Single Sign-On (SSO).',
    'home.apps_services': 'Applications and Services',
    'home.service_status': 'Service Status',
    'home.status.online': 'Online',
    'home.status.offline': 'Offline',
    'home.status.loading': 'Loading...',
    'home.notice.text1': 'Need help logging in or with SSO integration? Visit the ',
    'home.notice.link': 'Web Settings',
    'home.notice.text2': ' page or contact the portal admin.',
    'home.ann.title': 'Recent Announcements',
    'home.ann.view_all': 'View all announcements',
    'home.ann.loading': 'Loading announcements...',
    'home.apps': 'Applications',
    'home.apps_integrated': 'Integrated Services',
    'home.apps_favorites': 'Favorites',
    'home.apps_show_fav': 'Show Favorites Only',
    'home.apps_show_all': 'Show All Applications',
    'home.apps_search': 'Search applications or services...',
    'home.apps_not_found': 'No applications found matching',
    'home.edit_favorites': 'Edit Favorites',
    'home.edit_favorites_sub': 'Choose Up to 8 Apps',
    'home.manage_account': 'Manage Account',
    'home.announcements': 'Announcements',
    'home.view_all_announcements': 'View All Announcements',
    'home.academic_week': '7th Learning & Training Session',
    'home.modal_fav_title': 'Customize Favorite Apps',
    'home.modal_fav_desc': 'Select favorite applications (up to 8) to display on your myS4RAS Portal home screen.',
    'home.modal_fav_selected': 'selected',
    'home.modal_fav_save': 'Save Favorites',
    'home.modal_fav_cancel': 'Cancel',
    'home.modal_fav_reset': 'Reset to Default',
    
    // Service descriptions (English)
    'service.desc.moodle': 'Online learning platform for course materials and assignments.',
    'service.desc.sso': 'Centralized authentication for all S4RAS services.',
    'service.desc.cloud': 'Cloud storage for documents and important files.',
    'service.desc.iptv': 'IPTV service for broadcasting and video content.',
    'service.desc.voip': 'IP-based telephone service for the campus community.',
    'service.desc.monitor': 'Monitoring dashboard for S4RAS infrastructure.',

    // Akun / Account
    'account.title': 'User Profile',
    'account.title_info': 'Account Information',
    'account.back': 'Back to Home',
    'account.role': 'Role',
    'account.username': 'Username',
    'account.email': 'Email',
    'account.firstname': 'First Name',
    'account.lastname': 'Last Name',
    'account.manage_btn': 'Manage Account Profile',
    'account.personal_info': 'Personal Information',
    'account.personal_desc': 'Your personal data integrated with SSO S4RAS system',
    'account.contact_info': 'Contact Connections',
    'account.contact_desc': 'Active email address for system notifications',
    'account.fullname': 'Full Name',
    'account.user_portal': 'Portal User',
    'account.fullname_sub': 'Registered full name',
    'account.username_sub': 'Unique user ID',
    'account.email_sub': 'Active email for authentication',
    
    // Pengumuman / Announcements
    'ann.title': 'Announcements List',
    'ann.back': 'Back to Home',
    'ann.search_placeholder': 'Search announcements...',
    'ann.no_results': 'No announcements match your search.',
    'ann.loading': 'Loading announcements...',
    
    // Pengaturan / Settings
    'set.title': 'Web Settings',
    'set.theme_title': 'Appearance Mode',
    'set.theme_desc': 'Choose an appearance mode comfortable for you',
    'set.theme.dark': 'Dark Mode',
    'set.theme.light': 'Light Mode',
    'set.lang_title': 'Language',
    'set.lang_desc': 'Choose the language you use',
    'set.lang.id': 'Bahasa Indonesia',
    'set.lang.en': 'English',
    
    // SSO Integration Card
    'set.sso_title': 'Single Sign-On (SSO) Integration',
    'set.sso_desc': 'Centralized Keycloak OIDC identity connection status and your active session',
    'set.sso_realm': 'SSO Realm',
    'set.sso_client': 'OIDC Client ID',
    'set.sso_auth_server': 'Auth Server URL',
    'set.sso_status_active': 'Authenticated & Active',
    'set.sso_session_user': 'Active User',
    'set.sso_manage_btn': 'Open Keycloak Account Console',
    'set.sso_manage_desc': 'Manage password, two-factor authentication (TOTP), and login sessions directly on SSO server',
    'set.sso_refresh_btn': 'Refresh Token Session',
    'set.sso_refreshing': 'Refreshing Session...',
    'set.sso_refreshed': 'Token session refreshed successfully',
    'set.sso_faq_title': 'Login & SSO Troubleshooting Guide',
    'set.sso_faq_desc': 'If you experience issues switching between unified services:',
    'set.sso_faq_tip1': 'Ensure your browser allows cookies from *.s4ras.site domain.',
    'set.sso_faq_tip2': 'Use your registered username (e.g., student1, teacher1, dev1) matching your role.',
    'set.sso_faq_tip3': 'If your session expires across apps, click Refresh Session or log out and log back in.',
    
    // Helpdesk & Contact Admin
    'set.support_title': 'Helpdesk & Administrator Contact',
    'set.support_desc': 'Technical support channels and campus help center for all members',
    'set.support_voip': 'Campus Phone (VoIP PBX)',
    'set.support_voip_desc': 'Call campus operator at Extension 1000 or tele-consultation at 1004',
    'set.support_call_btn': 'Call Operator (1000)',
    'set.support_call_cons': 'Tech Consultation (1004)',
    'set.support_email': 'Helpdesk Email',
    'set.support_hours': 'Operational Hours',
    'set.support_hours_val': 'Monday – Friday, 08:00 – 16:00 WIB',
    'set.support_docs': 'System Documentation',
    'set.support_docs_link': 'View Operational Guides & Runbooks',

    // Admin
    'admin.title': 'Cluster Administration Panel',
    'admin.subtitle': 'S4RAS Infrastructure Management, Cluster Telemetry, PM2 Deployment Control & Event Mesh',
    'admin.api_config': 'API & Gateway Configuration',
    'admin.api_url': 'Backend API Gateway URL',
    'admin.not_configured': 'Not configured',
    'admin.deploy_control': 'Production Deployment Control',
    'admin.deploy_desc': 'Trigger automated build and zero-downtime PM2 cluster reload on production server VM 208.',
    'admin.deploy_btn': 'Trigger PM2 Deploy',
    'admin.deploying': 'Deploying...',
    'admin.deploy_success': 'Deploy Succeeded',
    'admin.deploy_failed': 'Deploy Failed',
    'admin.telemetry': 'Telemetry & Deployment Logs',
    'admin.status': 'Status',
    'admin.commit': 'Commit',
    'admin.build_duration': 'Build Duration',
    'admin.rollback_badge': 'Rollback Protection Active',
    'admin.tab_nodes': 'Infrastructure & Nodes',
    'admin.tab_deploy': 'Deploy & PM2 Control',
    'admin.tab_telemetry': 'Telemetry & Metrics',
    'admin.tab_cockpit': 'Campus Cockpit & Events',
    'admin.tab_config': 'Configuration & Gateway',
    'admin.node_title': 'S4RAS Virtual Cluster Node Topology',
    'admin.node_desc': 'Mapping of 10 Virtual Machines on Proxmox VE cluster with local subnet isolation 192.168.10.0/24.',
    'admin.probe_health': 'Probe Gateway Endpoint',
    'admin.copy_url': 'Copy URL',
    'admin.copied': 'Copied!',

    // Academic Hub
    'academic.hub_title': 'S4RAS Academic & Course Hub',
    'academic.hub_subtitle': 'Integrated Moodle LMS & Nextcloud SAN Storage',
    'academic.persona_teacher': 'Course Lecturer — 3 Active Classes',
    'academic.persona_admin': 'Curriculum Administrator — Full Access',
    'academic.persona_student': 'Enrolled Student — 3 Courses This Semester',
    'academic.instructor': 'Lecturer',
    'academic.open_course': 'Open Course',
    'academic.san_title': 'Nextcloud SAN Shared Directories',
    'academic.open_cloud': 'Open Cloud Drive',
    'academic.folder_materials': 'Slides, Handouts & Class Recordings',
    'academic.folder_assignments': 'Assignments Submission & Review',
    'academic.folder_research': 'Datasets & Experiment Schemas',
    'academic.count_files': 'Files',
    'academic.count_dirs': 'Directories'
  }
};

export const ThemeLanguageProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('saras-theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('saras-lang') || 'id');

  useEffect(() => {
    localStorage.setItem('saras-theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('saras-lang', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['id']?.[key] || key;
  };

  return (
    <ThemeLanguageContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
};
