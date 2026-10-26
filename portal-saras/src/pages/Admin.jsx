// Admin — Administration Page (Clean Monochrome Vertical Flow Aligned with Pengaturan)
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Rocket,
  Server,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Activity,
  ExternalLink,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import Layout from '../components/Layout';
import ClusterTelemetryCard from '../components/ClusterTelemetryCard';
import { useKeycloak } from '../context/KeycloakContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin + '/api' : 'https://portal.s4ras.site/api');

function Admin() {
  const { profile, isAdmin, keycloak } = useKeycloak();
  const { t, language } = useThemeLanguage();
  const isEn = language === 'en';

  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState(null);

  const canManage = !!isAdmin;

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  const triggerDeploy = async () => {
    setDeploying(true);
    setResult(null);
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(keycloak?.token ? { 'Authorization': `Bearer ${keycloak.token}` } : {})
        },
        body: JSON.stringify({ triggeredBy: profile?.username || 'admin' })
      });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}: Deployment request failed` }));
      if (!res.ok && !data.error) {
        data.error = `HTTP ${res.status}: Unauthorized or service unavailable`;
      }
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setDeploying(false);
    }
  };

  const testGatewayProbe = async () => {
    setProbing(true);
    setProbeResult(null);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const timeMs = Math.round(performance.now() - start);
      const data = await res.json();
      setProbeResult({
        status: res.ok ? 'success' : 'failed',
        statusCode: res.status,
        latencyMs: timeMs,
        data
      });
    } catch (err) {
      const timeMs = Math.round(performance.now() - start);
      setProbeResult({
        status: 'error',
        error: err.message,
        latencyMs: timeMs
      });
    } finally {
      setProbing(false);
    }
  };

  const copyToClipboard = (text, key) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const hasError = result?.error || (result?.exitCode && result.exitCode !== 0);

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Page Title Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] m-0">
            {t('admin.title')}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] m-0">
            {t('admin.subtitle')}
          </p>
        </div>

        {/* Primary Admin Cards (Matching Mode Tampilan & Bahasa Pattern) */}
        <div className="flex flex-col gap-4">
          {/* Card 1: Status Layanan & Telemetri Klaster */}
          <div className="card p-6 sm:p-7 bg-[var(--color-neutral-bg2)]/90 border border-[var(--color-border-default)] rounded-3xl shadow-md flex flex-col relative overflow-visible hover:transform-none">
            <div className="flex items-start gap-4">
              <Activity className="w-5 h-5 text-[var(--color-text-primary)] shrink-0 mt-0.5" />
              <div className="flex flex-col flex-1">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] m-0">
                  {isEn ? 'Cluster & Microservices Telemetry' : 'Telemetri Klaster & Mikroservis'}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
                  {isEn
                    ? 'Real-time uptime and latency monitoring for S4RAS campus services'
                    : 'Pemantauan ketersediaan dan latensi real-time layanan sivitas S4RAS'}
                </p>

                <div className="mt-4">
                  <ClusterTelemetryCard />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Deployment Server Produksi (Zero-Downtime PM2) */}
          <div className="card p-6 sm:p-7 bg-[var(--color-neutral-bg2)]/90 border border-[var(--color-border-default)] rounded-3xl shadow-md flex flex-col relative overflow-visible hover:transform-none">
            <div className="flex items-start gap-4">
              <Rocket className="w-5 h-5 text-[var(--color-text-primary)] shrink-0 mt-0.5" />
              <div className="flex flex-col flex-1">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] m-0">
                  {t('admin.deploy_control')}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
                  {t('admin.deploy_desc')}
                </p>

                <div className="mt-4 flex flex-col gap-4">
                  {/* Target info pills */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="rounded-lg px-2.5 py-1 bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] font-mono">
                      Host: <strong className="text-[var(--color-text-primary)] font-semibold">VM 208</strong>
                    </span>
                    <span className="rounded-lg px-2.5 py-1 bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] font-mono">
                      Branch: <strong className="text-[var(--color-text-primary)] font-semibold">main</strong>
                    </span>
                    <span className="rounded-lg px-2.5 py-1 bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] font-mono">
                      Target: <strong className="text-[var(--color-text-primary)] font-semibold">PM2 Cluster</strong>
                    </span>
                    <span className="rounded-lg px-2.5 py-1 bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] inline-flex items-center gap-1.5 ml-auto">
                      <ShieldCheck size={13} className="text-[var(--color-text-primary)]" />
                      <span className="text-[var(--color-text-primary)] font-medium">{t('admin.rollback_badge')}</span>
                    </span>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-3">
                    <button
                      disabled={!canManage || deploying}
                      onClick={triggerDeploy}
                      className="h-10 px-4 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deploying ? (
                        <>
                          <Loader2 size={15} className="animate-spin text-[var(--color-text-primary)]" />
                          <span>{t('admin.deploying')}</span>
                        </>
                      ) : (
                        <>
                          <Rocket size={15} className="text-[var(--color-text-primary)]" />
                          <span>{t('admin.deploy_btn')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Deploy Result Notification */}
                  {result && (
                    <div
                      className={`p-4 rounded-2xl border flex flex-col gap-2 text-xs transition-all ${
                        hasError
                          ? 'bg-red-500/10 border-red-500/20 text-red-300'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <div className="flex items-center gap-2">
                          {hasError ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                          <span>{hasError ? t('admin.deploy_failed') : t('admin.deploy_success')}</span>
                        </div>
                        {result.buildDurationMs && (
                          <span className="font-mono text-[var(--color-text-muted)] text-[11px]">
                            {t('admin.build_duration')}: {result.buildDurationMs} ms
                          </span>
                        )}
                      </div>
                      {result.error && (
                        <p className="m-0 text-[var(--color-text-secondary)] text-[11px] leading-relaxed">
                          {result.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Konfigurasi API Gateway & Endpoint */}
          <div className="card p-6 sm:p-7 bg-[var(--color-neutral-bg2)]/90 border border-[var(--color-border-default)] rounded-3xl shadow-md flex flex-col relative overflow-visible hover:transform-none">
            <div className="flex items-start gap-4">
              <Server className="w-5 h-5 text-[var(--color-text-primary)] shrink-0 mt-0.5" />
              <div className="flex flex-col flex-1">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] m-0">
                  {t('admin.api_config')}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
                  {isEn
                    ? 'Backend reverse proxy endpoint and central authentication gateway'
                    : 'Endpoint reverse proxy backend dan gateway otentikasi terpusat'}
                </p>

                <div className="mt-4 flex flex-col gap-3">
                  {/* API Gateway URL */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-[var(--color-text-secondary)]">{t('admin.api_url')}</span>
                    <div className="flex items-center justify-between h-10 px-4 rounded-xl bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)]">
                      <code className="font-mono text-xs text-[var(--color-text-primary)] break-all">
                        {BACKEND_URL}
                      </code>
                      <button
                        onClick={() => copyToClipboard(BACKEND_URL, 'api_url')}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] ml-2 cursor-pointer bg-transparent border-none p-1 transition-colors"
                        title={t('admin.copy_url')}
                      >
                        {copiedKey === 'api_url' ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Probe Test Action */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <button
                      disabled={probing}
                      onClick={testGatewayProbe}
                      className="h-10 px-4 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {probing ? (
                        <Loader2 size={14} className="animate-spin text-[var(--color-text-primary)]" />
                      ) : (
                        <RefreshCw size={14} className="text-[var(--color-text-primary)]" />
                      )}
                      <span>{t('admin.probe_health')}</span>
                    </button>

                    {probeResult && (
                      <span
                        className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                          probeResult.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {probeResult.status === 'success' ? (
                          <CheckCircle size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                        <span>
                          {probeResult.status === 'success' ? 'Gateway Ready' : 'Probe Failed'} ({probeResult.latencyMs} ms)
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Konsol Manajemen Infrastruktur */}
          <div className="card p-6 sm:p-7 bg-[var(--color-neutral-bg2)]/90 border border-[var(--color-border-default)] rounded-3xl shadow-md flex flex-col relative overflow-visible hover:transform-none">
            <div className="flex items-start gap-4">
              <ExternalLink className="w-5 h-5 text-[var(--color-text-primary)] shrink-0 mt-0.5" />
              <div className="flex flex-col flex-1">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] m-0">
                  {isEn ? 'Infrastructure Consoles' : 'Konsol Manajemen Infrastruktur'}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
                  {isEn
                    ? 'Direct links to specialized S4RAS service management panels'
                    : 'Tautan langsung ke panel manajemen layanan spesifik di klaster S4RAS'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <a
                    href="https://monitor.s4ras.site"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl p-3.5 bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] flex items-center justify-between transition-colors no-underline group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        Prometheus & Grafana
                      </span>
                      <span className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">Metrik & Telemetri Klaster</span>
                    </div>
                    <ExternalLink size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors shrink-0" />
                  </a>

                  <a
                    href="https://sso.s4ras.site/admin/"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl p-3.5 bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] flex items-center justify-between transition-colors no-underline group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        Keycloak Admin Console
                      </span>
                      <span className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">Manajemen User & Realm S4RAS</span>
                    </div>
                    <ExternalLink size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors shrink-0" />
                  </a>

                  <a
                    href="https://status.s4ras.site"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl p-3.5 bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] flex items-center justify-between transition-colors no-underline group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        Status Page Uptime
                      </span>
                      <span className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">Pemantauan Insiden 24/7</span>
                    </div>
                    <ExternalLink size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors shrink-0" />
                  </a>

                  <a
                    href="/benchmark/"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl p-3.5 bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] flex items-center justify-between transition-colors no-underline group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        Laporan Benchmark JMeter
                      </span>
                      <span className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">Uji Beban & Throughput</span>
                    </div>
                    <ExternalLink size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Admin;
