const services = [
  // Portal entry removed: portal is the current application and should not link to itself
  {
    key: 'moodle',
    title: 'Moodle LMS',
    description: 'Platform pembelajaran daring untuk materi dan tugas.',
    iconName: 'GraduationCap',
    url: 'https://moodle.s4ras.site/auth/oidc/',
    internalUrl: 'http://192.168.10.203'
  },
  {
    key: 'sso',
    title: 'SSO Keycloak',
    description: 'Otentikasi terpusat untuk seluruh layanan S4RAS.',
    iconName: 'KeyRound',
    url: 'https://sso.s4ras.site/realms/S4RAS/account/',
    // Port 9000 = Keycloak 26.1 Quarkus management interface (health/ready returns structured JSON)
    internalUrl: 'http://192.168.10.206:9000/health/ready'
  },
  {
    key: 'cloud',
    title: 'Nextcloud SAN',
    description: 'Penyimpanan awan untuk dokumen dan file penting.',
    iconName: 'Cloud',
    url: 'https://cloud.s4ras.site/apps/user_oidc/login/1',
    internalUrl: 'http://192.168.10.207/status.php'
  },
  {
    key: 'iptv',
    title: 'Jellyfin IPTV',
    description: 'Layanan IPTV untuk siaran dan konten video.',
    iconName: 'Tv',
    url: 'https://iptv.s4ras.site/sso/OID/start/keycloak',
    internalUrl: 'http://192.168.10.200:8096'
  },
  {
    key: 'dispatcharr',
    title: 'Dispatcharr IPTV',
    description: 'Manajemen channel TV, guide EPG, dan proxy multimedia.',
    iconName: 'Radio',
    url: 'https://dispatcharr.s4ras.site',
    internalUrl: 'http://192.168.10.200:9191'
  },
  {
    key: 'jellyseerr',
    title: 'Media Request',
    description: 'Portal permohonan serial, animasi, dan film edukasi.',
    iconName: 'Film',
    url: 'https://request.s4ras.site',
    internalUrl: 'http://192.168.10.200:5055'
  },
  {
    key: 'voip',
    title: 'VoIP Server',
    description: 'Layanan telepon berbasis IP untuk civitas.',
    iconName: 'Phone',
    url: 'https://voip.s4ras.site',
    internalUrl: 'http://192.168.10.202'
  },
  {
    key: 'monitor',
    title: 'Monitoring',
    description: 'Dashboard monitoring untuk infrastruktur S4RAS.',
    iconName: 'BarChart3',
    url: 'https://monitor.s4ras.site/login/generic_oauth',
    internalUrl: 'http://192.168.10.204:3000'
  },
  {
    key: 'status',
    title: 'Status Layanan',
    description: 'Status page uptime real-time dan pantauan insiden.',
    iconName: 'ShieldCheck',
    url: 'https://status.s4ras.site',
    internalUrl: 'http://192.168.10.204:3001'
  },
  {
    key: 'benchmark',
    title: 'Benchmark Reports',
    description: 'Laporan visual uji beban & throughput Apache JMeter.',
    iconName: 'Activity',
    url: '/benchmark/',
    internalUrl: 'http://192.168.10.209:8088'
  },
  // Prometheus removed: monitoring.s4ras.site will be managed separately on VM 192.168.10.204
];

export default services;
