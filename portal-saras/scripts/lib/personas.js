/**
 * S4RAS Canonical Personas Definitions (Phase 36/38)
 * Contains identity profiles, default extensions, quotas, and roles.
 * NOTE: Credentials (passwords, sip_secrets) are strictly excluded.
 */

const CANONICAL_PERSONAS = {
  student: {
    username: 'student1',
    name: 'Budi Pratama',
    email: 'student1@s4ras.site',
    department: 'Teknik Informatika',
    storage_quota: '15GB',
    moodle_cohort: 'KOM-401-2026',
    sip_extension: '1001',
    roles: ['Mahasiswa', 'student']
  },
  teacher: {
    username: 'teacher1',
    name: 'Dr. Hendra Wijaya',
    email: 'teacher1@s4ras.site',
    department: 'Teknik Elektro & Telematika',
    storage_quota: '50GB',
    moodle_cohort: 'FACULTY-2026',
    sip_extension: '1002',
    roles: ['Dosen', 'teacher']
  },
  dev: {
    username: 'dev1',
    name: 'S4RAS DevOps Admin',
    email: 'dev1@s4ras.site',
    department: 'IT & Cloud Infrastructure',
    storage_quota: '100GB',
    moodle_cohort: 'DEVOPS-2026',
    sip_extension: '1003',
    roles: ['Admin', 'dev']
  },
  admin: {
    username: 'admin',
    name: 'S4RAS Administrator',
    email: 'admin@s4ras.site',
    department: 'Rektorat & Administrasi Sistem',
    storage_quota: '500GB',
    moodle_cohort: 'ADMIN-CLUSTER',
    sip_extension: '1003',
    roles: ['Super Admin', 'admin']
  },
  nathan1: {
    username: 'nathan1',
    name: 'Nathan Co-Dev',
    email: 'natumpal2004@gmail.com',
    department: 'Co-Developer & Cluster Architecture',
    storage_quota: '500GB',
    moodle_cohort: 'ADMIN-CLUSTER',
    sip_extension: '1004',
    roles: ['Super Admin', 'admin']
  },
  testuser: {
    username: 'testuser',
    name: 'Sivitas Peneliti',
    email: 'civitas@s4ras.site',
    department: 'Research Fellowship / S4RAS',
    storage_quota: '200GB',
    moodle_cohort: 'RESEARCH-FELLOW-2026',
    sip_extension: '1003',
    roles: ['Super Admin', 'admin', 'fellow']
  }
};

module.exports = {
  CANONICAL_PERSONAS
};
