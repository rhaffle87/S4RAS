import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import ServiceSparkline from './ServiceSparkline';
import services from '../config/services';
import { checkServiceHealth } from '../services/backend';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export default function ClusterTelemetryCard({
  healthStatuses: externalStatuses,
  loading: externalLoading,
  className = ''
}) {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';

  const [internalStatuses, setInternalStatuses] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);

  // If statuses not supplied by parent, fetch them independently
  useEffect(() => {
    if (externalStatuses && externalStatuses.length > 0) return;
    let mounted = true;
    const loadHealth = async () => {
      try {
        const results = await Promise.all(services.map(checkServiceHealth));
        if (mounted) {
          setInternalStatuses(results);
          setInternalLoading(false);
        }
      } catch (_e) {
        if (mounted) setInternalLoading(false);
      }
    };
    loadHealth();
    return () => {
      mounted = false;
    };
  }, [externalStatuses]);

  const statuses =
    externalStatuses && externalStatuses.length > 0 ? externalStatuses : internalStatuses;
  const isLoading = typeof externalLoading === 'boolean' ? externalLoading : internalLoading;

  const total = services.length;
  const onlineCount = statuses.filter((s) => s.status === 'online').length;
  const allOnline = onlineCount === total && total > 0;
  const isDegraded = onlineCount > 0 && onlineCount < total;

  const avgLatency = useMemo(() => {
    const latencies = statuses
      .map((s) => (typeof s.latency === 'number' && s.latency > 0 ? s.latency : null))
      .filter((l) => l !== null);
    if (latencies.length === 0) return 19;
    return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  }, [statuses]);

  // Key campus service list for quick status display
  const keyServices = [
    { name: 'Moodle', key: 'moodle' },
    { name: 'Keycloak', key: 'sso' },
    { name: 'Nextcloud', key: 'cloud' },
    { name: 'Jellyfin', key: 'iptv' },
    { name: 'Asterisk PBX', key: 'voip' },
    { name: 'Telemetry', key: 'monitor' }
  ];

  return (
    <div
      className={`flex flex-col gap-4 text-xs transition-all ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
              isLoading
                ? 'bg-amber-400 animate-pulse'
                : allOnline
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse'
                : isDegraded
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
            }`}
          />
          <span className="font-bold text-sm text-text-primary tracking-tight">
            {isLoading
              ? isEn
                ? 'Probing Cluster Health...'
                : 'Memeriksa Status Klaster...'
              : allOnline
              ? isEn
                ? `${total} Microservices Ready`
                : `${total} Mikroservis Siap & Aktif`
              : `${onlineCount}/${total} Microservices Online`}
          </span>
        </div>

        <a
          href="https://status.s4ras.site"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors shrink-0 group"
        >
          <span>{isEn ? 'Status Page' : 'Halaman Status'}</span>
          <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Latency Metric Overview Bar */}
      <div className="flex items-end justify-between gap-4 pt-1">
        <div className="flex flex-col">
          <span className="text-[11px] text-text-muted font-medium">
            {isEn ? 'Average Response Latency' : 'Rata-rata Latensi Respons'}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-mono font-bold text-text-primary tracking-tight">
              {isLoading ? '...' : avgLatency}
            </span>
            <span className="text-xs font-mono font-semibold text-text-secondary">ms</span>
            <span className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium ml-2">
              • {isEn ? 'Normal Latency' : 'Respons Normal'}
            </span>
          </div>
        </div>
      </div>

      {/* Full-width Responsive Smooth Telemetry Wave */}
      <div className="w-full pt-1 pb-1">
        <ServiceSparkline
          healthStatuses={statuses}
          loading={isLoading}
          height={56}
          showGuides={true}
        />
      </div>

      {/* Bottom Microservices Quick Health Strip */}
      <div className="pt-3 border-t border-border-default/60 flex items-center justify-between gap-2 flex-wrap text-[11px]">
        <span className="text-text-muted font-medium">
          {isEn ? 'Core Services:' : 'Layanan Utama:'}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {keyServices.map((svc) => (
            <span
              key={svc.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-bg2 border border-border-default/80 text-text-secondary font-medium"
            >
              <CheckCircle2 size={11} className="text-emerald-400" />
              <span>{svc.name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
