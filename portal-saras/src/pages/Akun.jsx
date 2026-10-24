// Akun — Account Page (Fully Aligned with myITS Reference Layout & Dynamic Theme/Language)
import React, { useState, useRef } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ChevronRight, 
  Edit2, 
  Lock, 
  Calendar,
  IdCard,
  MoreHorizontal
} from 'lucide-react';
import { useKeycloak } from '../context/KeycloakContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import Layout from '../components/Layout';

function Akun() {
  const { keycloak, profile, persona, roleLabel } = useKeycloak();
  const { language } = useThemeLanguage();
  const isEn = language === 'en';

  const fileInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('s4ras_user_avatar') || null;
  });

  const handleOpenKeycloak = () => {
    if (keycloak && typeof keycloak.accountManagement === 'function') {
      keycloak.accountManagement();
    } else {
      window.open('https://sso.s4ras.site/realms/S4RAS/account/', '_blank', 'noopener,noreferrer');
    }
  };

  const fullName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile?.username || 'Sivitas Akademika';
  
  const studentId = profile?.attributes?.studentId?.[0] || '5048000001';
  const phone = profile?.attributes?.phone?.[0] || '081200000001';
  const emailUtama = profile?.email || 'civitas@s4ras.site';
  const emailAlt = profile?.attributes?.altEmail?.[0] || 'civitas@s4ras.site';

  const roleText = roleLabel || (persona === 'dev' ? (isEn ? 'Student' : 'Mahasiswa') : (isEn ? 'Student' : 'Mahasiswa'));

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (result) {
          setAvatarUrl(result);
          try {
            localStorage.setItem('s4ras_user_avatar', result);
          } catch (_e) {
            // storage quota limit
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12">
        {/* Page Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary m-0 tracking-tight">
          {isEn ? 'Account' : 'Akun'}
        </h2>

        {/* Profile Hero Section (Exact myITS Layout: Borderless with 2x2 Metadata Badges) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 py-2">
          {/* Left: Vibrant Gradient Avatar + Name & Role */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="relative shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarSelect}
                accept="image/*"
                className="hidden"
                aria-label="Upload profile picture"
              />
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-2xl border-2 border-border-default"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-brand-hover via-brand to-brand-light text-white flex items-center justify-center shadow-2xl border-2 border-white/10">
                  <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                </div>
              )}
              {/* Edit Pencil Badge Button */}
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-neutral-bg2 border border-border-default text-text-primary flex items-center justify-center hover:bg-neutral-bg3 transition-all cursor-pointer shadow-md"
                title={isEn ? 'Upload Profile Picture' : 'Unggah Foto Profil'}
                aria-label={isEn ? 'Upload Profile Picture' : 'Unggah foto profil'}
              >
                <Edit2 size={13} className="text-text-primary" />
              </button>
            </div>

            <div className="flex flex-col">
              <h3 className="text-lg sm:text-xl font-bold text-text-primary m-0 leading-tight">
                {fullName}
              </h3>
              <span className="text-xs sm:text-sm text-text-secondary mt-1 font-medium">
                {roleText}
              </span>
            </div>
          </div>

          {/* Right: 2x2 Metadata Badges (myITS/myS4RAS ID, Phone, Email Utama, Email Alternatif) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 shrink-0">
            {/* 1. myITS ID */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-bg3 border border-border-default flex items-center justify-center text-text-primary shrink-0">
                <IdCard size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-[170px]">{studentId}</span>
                <span className="text-[11px] text-text-muted">{isEn ? 'myS4RAS ID' : 'myITS ID'}</span>
              </div>
            </div>

            {/* 2. Nomor Ponsel */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-bg3 border border-border-default flex items-center justify-center text-text-primary shrink-0">
                <Phone size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-[170px]">{phone}</span>
                <span className="text-[11px] text-text-muted">{isEn ? 'Phone Number' : 'Nomor Ponsel'}</span>
              </div>
            </div>

            {/* 3. Email Utama */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-bg3 border border-border-default flex items-center justify-center text-text-primary shrink-0 relative">
                <Mail size={16} />
                <CheckCircle2 size={11} className="text-emerald-500 absolute -bottom-0.5 -right-0.5 bg-neutral-bg1 rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-[170px]">{emailUtama}</span>
                <span className="text-[11px] text-text-muted">{isEn ? 'Primary Email' : 'Email Utama'}</span>
              </div>
            </div>

            {/* 4. Email Alternatif */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-bg3 border border-border-default flex items-center justify-center text-text-primary shrink-0 relative">
                <Mail size={16} />
                <CheckCircle2 size={11} className="text-emerald-500 absolute -bottom-0.5 -right-0.5 bg-neutral-bg1 rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-[170px]">{emailAlt}</span>
                <span className="text-[11px] text-text-muted">{isEn ? 'Alternative Email' : 'Email Alternatif'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stacked Clean Setting Cards (Exact myITS Sections) */}
        <div className="flex flex-col gap-4 mt-2">
          {/* Section 1: SSO Account Hub (Keycloak) */}
          <div className="card p-5 sm:p-6 bg-neutral-bg2/90 border border-border-default rounded-2xl shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-brand-light animate-pulse" />
              <span className="text-xs font-semibold text-text-secondary">S4RAS SSO (Keycloak)</span>
            </div>

            <div 
              onClick={handleOpenKeycloak}
              className="flex items-center justify-between py-2 cursor-pointer group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <User size={18} className="text-text-secondary group-hover:text-text-primary transition-colors shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-text-primary group-hover:text-brand-light transition-colors">
                    {isEn ? 'Civitas Account Center' : 'Pusat Akun Sivitas'}
                  </span>
                  <span className="text-xs text-text-secondary mt-0.5">
                    {isEn ? 'Change profile picture, multi-factor authentication, and more' : 'Ubah foto profil, multi-factor authentication, dan lainnya'}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
            </div>
          </div>

          {/* Section 2: Informasi pribadi */}
          <div className="card p-5 sm:p-6 bg-neutral-bg2/90 border border-border-default rounded-2xl shadow-sm flex flex-col">
            <div className="flex flex-col mb-2">
              <h4 className="text-sm sm:text-base font-bold text-text-primary m-0">
                {isEn ? 'Personal Information' : 'Informasi pribadi'}
              </h4>
              <p className="text-xs text-text-secondary m-0 mt-0.5">
                {isEn ? 'Information commonly displayed across all myS4RAS services' : 'Data yang umumnya ditampilkan di semua web myS4RAS'}
              </p>
            </div>

            <div className="flex flex-col divide-y divide-border-default/60">
              {/* Row 1: Nama */}
              <div 
                onClick={handleOpenKeycloak}
                className="flex items-center justify-between py-3 cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <IdCard size={18} className="text-text-secondary group-hover:text-text-primary transition-colors shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-text-primary group-hover:text-brand-light transition-colors">
                      {isEn ? 'Name' : 'Nama'}
                    </span>
                    <span className="text-xs text-text-secondary mt-0.5">
                      {isEn ? 'Change preferred name' : 'Ubah nama panggilan'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
              </div>

              {/* Row 2: Tanggal Lahir */}
              <div 
                onClick={handleOpenKeycloak}
                className="flex items-center justify-between py-3 cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Calendar size={18} className="text-text-secondary group-hover:text-text-primary transition-colors shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-text-primary group-hover:text-brand-light transition-colors">
                      {isEn ? 'Date of Birth' : 'Tanggal Lahir'}
                    </span>
                    <span className="text-xs text-text-secondary mt-0.5">
                      {isEn ? 'View date of birth' : 'Melihat tanggal lahir'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
              </div>
            </div>
          </div>

          {/* Section 3: Kontak */}
          <div className="card p-5 sm:p-6 bg-neutral-bg2/90 border border-border-default rounded-2xl shadow-sm flex flex-col">
            <div className="flex flex-col mb-2">
              <h4 className="text-sm sm:text-base font-bold text-text-primary m-0">
                {isEn ? 'Contact' : 'Kontak'}
              </h4>
              <p className="text-xs text-text-secondary m-0 mt-0.5">
                {isEn ? 'Update email and phone number' : 'Ubah email dan nomor ponsel'}
              </p>
            </div>

            <div className="flex flex-col divide-y divide-border-default/60">
              {/* Row 1: Email */}
              <div 
                onClick={handleOpenKeycloak}
                className="flex items-center justify-between py-3 cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Mail size={18} className="text-text-secondary group-hover:text-text-primary transition-colors shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-text-primary group-hover:text-brand-light transition-colors">
                      Email
                    </span>
                    <span className="text-xs text-text-secondary mt-0.5">
                      {isEn ? 'Update and verify email' : 'Perbarui dan verifikasi email'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
              </div>

              {/* Row 2: Nomor Ponsel */}
              <div 
                onClick={handleOpenKeycloak}
                className="flex items-center justify-between py-3 cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Phone size={18} className="text-text-secondary group-hover:text-text-primary transition-colors shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-text-primary group-hover:text-brand-light transition-colors">
                      {isEn ? 'Phone Number' : 'Nomor Ponsel'}
                    </span>
                    <span className="text-xs text-text-secondary mt-0.5">
                      {isEn ? 'Update and verify phone number' : 'Perbarui dan verifikasi nomor telepon'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
              </div>
            </div>
          </div>

          {/* Section 4: Lainnya */}
          <div className="card p-5 sm:p-6 bg-neutral-bg2/90 border border-border-default rounded-2xl shadow-sm flex flex-col">
            <div className="flex flex-col mb-2">
              <h4 className="text-sm sm:text-base font-bold text-text-primary m-0">
                {isEn ? 'Others' : 'Lainnya'}
              </h4>
              <p className="text-xs text-text-secondary m-0 mt-0.5">
                {isEn ? 'Password and display preferences' : 'Kata sandi dan preferensi tampilan'}
              </p>
            </div>

            <div className="flex flex-col divide-y divide-border-default/60">
              {/* Row 1: Kata Sandi */}
              <div 
                onClick={handleOpenKeycloak}
                className="flex items-center justify-between py-3 cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <MoreHorizontal size={18} className="text-text-secondary group-hover:text-text-primary transition-colors shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-text-primary group-hover:text-brand-light transition-colors">
                      {isEn ? 'Password' : 'Kata Sandi'}
                    </span>
                    <span className="text-xs text-text-secondary mt-0.5">
                      {isEn ? 'Update account password' : 'Perbarui kata sandi'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
              </div>

              {/* Row 2: Multi-Factor Authentication */}
              <div 
                onClick={handleOpenKeycloak}
                className="flex items-center justify-between py-3 cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Lock size={18} className="text-text-secondary group-hover:text-text-primary transition-colors shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-text-primary group-hover:text-brand-light transition-colors">
                      Multi-Factor Authentication
                    </span>
                    <span className="text-xs text-text-secondary mt-0.5">
                      {isEn ? 'Manage your multi-factor authentication' : 'Kelola multi-factor authentication Anda'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Akun;
