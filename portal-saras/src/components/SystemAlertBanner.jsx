import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useKeycloak } from '../context/KeycloakContext';

export default function SystemAlertBanner() {
  const { isAdmin } = useKeycloak();
  const [alerts, setAlerts] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts');
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
        }
      } catch {
        // Backend probe quiet fail
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000); // 15s poll
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (!isAdmin || !alerts || alerts.length === 0) {
    return null; // Keep navbar completely clean when all systems are normal or user is not an admin
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="w-full bg-neutral-bg2 border-b border-border-default transition-all duration-300">
      {/* Top Notice Bar */}
      <div className={`px-6 py-2 flex items-center justify-between text-xs font-medium ${
        criticalCount > 0
          ? 'bg-red-500/10 text-red-400 border-l-4 border-l-red-500'
          : 'bg-amber-500/10 text-amber-400 border-l-4 border-l-amber-500'
      }`}>
        <div className="flex items-center gap-2">
          {criticalCount > 0 ? (
            <AlertCircle size={16} className="text-red-400 animate-pulse" />
          ) : (
            <AlertTriangle size={16} className="text-amber-400" />
          )}
          <span className="font-bold">
            {criticalCount > 0
              ? `${criticalCount} Insiden Kritis Terdeteksi`
              : `${alerts.length} Peringatan Operasional Terdeteksi`}
          </span>
          <span className="hidden sm:inline text-text-secondary">|</span>
          <span className="hidden sm:inline truncate max-w-md text-text-primary">
            {alerts[0]?.summary || alerts[0]?.alertname} ({alerts[0]?.instance})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-text-secondary hover:text-text-primary py-0.5 px-2 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span>{expanded ? 'Sembunyikan Detail' : `Lihat Semua (${alerts.length})`}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Alert Drawer */}
      {expanded && (
        <div className="px-6 py-4 bg-neutral-bg1 border-t border-border-default/60 space-y-2 max-h-64 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.key}
              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                alert.severity === 'critical'
                  ? 'bg-red-500/5 border-red-500/30'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="font-bold text-text-primary font-mono">{alert.alertname}</span>
                  <span className="text-text-secondary">· Node: <span className="text-text-primary font-semibold">{alert.instance}</span></span>
                </div>
                <p className="text-text-secondary m-0">{alert.summary}</p>
                {alert.description && (
                  <p className="text-text-secondary/70 text-[11px] m-0 font-mono">{alert.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-[10px] text-text-secondary font-mono">
                  {new Date(alert.startsAt).toLocaleTimeString()}
                </span>
                <a
                  href="https://monitor.s4ras.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-brand-light hover:underline font-semibold text-[11px]"
                >
                  <span>Investigasi Grafana</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
