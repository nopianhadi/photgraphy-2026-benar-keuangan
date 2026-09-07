import React, { useState, useMemo, useEffect } from 'react';
import {
  Client, Project, ClientFeedback, SatisfactionLevel, Transaction,
  Profile, Package, SubStatusConfig, TransactionType, ClientPortalProps,
  ProjectStatusConfig, TeamMember,
} from '../../../types';
import {
  FolderKanbanIcon, ClockIcon, StarIcon, FileTextIcon, HomeIcon,
  CreditCardIcon, CheckCircleIcon, SendIcon, DownloadIcon,
  GalleryHorizontalIcon, MessageSquareIcon, ChevronRightIcon,
  CalendarIcon, BriefcaseIcon, DollarSignIcon, UsersIcon,
  GoogleIcon, LinkIcon,
} from '../../../constants';
import Modal from '../../../shared/ui/Modal';
import SignaturePad from '../../../shared/ui/SignaturePad';
import { createClientFeedback, updateClientFeedback } from '../../../services/clientFeedback';
import { getClientByPortalAccessId } from '../../../services/clients';
import { listProjectsByClientId } from '../../../services/projects';
import { supabase } from '../../../lib/supabaseClient';
import HelpBox from '../../../shared/ui/HelpBox';
import InvoiceDocument from '../../finance/components/InvoiceDocument';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

const formatCurrency = (amount: number, opts?: { showDecimals?: boolean; compact?: boolean }) => {
  const { showDecimals = true, compact = false } = opts || {};
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
    notation: compact ? 'compact' : 'standard',
  }).format(amount);
};
const formatDocumentCurrency = (n: number) => formatCurrency(n, { showDecimals: true });
const formatDisplayCurrency  = (n: number) => formatCurrency(n, { showDecimals: false });

const getSatisfactionFromRating = (r: number): SatisfactionLevel => {
  if (r >= 5) return SatisfactionLevel.VERY_SATISFIED;
  if (r >= 4) return SatisfactionLevel.SATISFIED;
  if (r >= 3) return SatisfactionLevel.NEUTRAL;
  return SatisfactionLevel.UNSATISFIED;
};

const getDisplayProgress = (project: Project, config: ProjectStatusConfig[]): number => {
  if (!config?.length) return typeof project.progress === 'number' ? Math.round(project.progress) : 0;
  const raw = project.progress;
  if (typeof raw === 'number' && !Number.isNaN(raw) && raw >= 0 && raw <= 100) return Math.round(raw);
  const idx = config.findIndex(s => s.name === project.status);
  if (idx === -1) return 0;
  const sc = config[idx];
  if (sc.defaultProgress != null) return Math.min(100, Math.max(0, sc.defaultProgress));
  return Math.round(((idx + 1) / config.length) * 100);
};

// ─── Portal CSS — monochrome ──────────────────────────────────────────────────

const PORTAL_STYLES = `
  /* ── base ── */
  .portal-page { background: #f4f4f5; min-height: 100vh; }

  .portal-card {
    background: #ffffff;
    border: 1px solid #e4e4e7;
    box-shadow: 0 2px 12px -4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  }

  /* ── hero ── */
  .hero-gradient { background: #18181b; }

  /* ── tabs ── */
  .tab-active-mono {
    background: #18181b;
    color: #ffffff;
    box-shadow: 0 4px 14px -4px rgba(0,0,0,0.30);
  }

  /* ── progress bar ── */
  .progress-bar { background: #3f3f46; }

  /* ── timeline dots ── */
  .timeline-dot-done    { background: #52525b; }
  .timeline-dot-current { background: #18181b; animation: portalPulse 2s infinite; }
  .timeline-dot-future  { background: #d4d4d8; }

  @keyframes portalPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(24,24,27,0.30); }
    50%      { box-shadow: 0 0 0 8px rgba(24,24,27,0); }
  }
  @keyframes portalFadeUp {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .portal-animate   { animation: portalFadeUp 0.4s ease both; }
  .portal-animate-1 { animation-delay:0.05s; }
  .portal-animate-2 { animation-delay:0.10s; }
  .portal-animate-3 { animation-delay:0.15s; }
  .portal-animate-4 { animation-delay:0.20s; }
  .portal-animate-5 { animation-delay:0.25s; }
`;

// ─── Main component ───────────────────────────────────────────────────────────

const ClientPortal: React.FC<ClientPortalProps> = ({
  accessId, clients, projects, transactions, setClientFeedback,
  showNotification, userProfile, packages, teamMembers,
}) => {
  const profile = userProfile;
  const [fetchedClient,   setFetchedClient]   = useState<Client | null>(null);
  const [fetchedProjects, setFetchedProjects] = useState<Project[]>([]);
  const [isFetchingDirect,          setIsFetchingDirect]          = useState(false);
  const [hasAttemptedDirectFetch,   setHasAttemptedDirectFetch]   = useState(false);

  const client = useMemo(() => {
    const fromProps = clients?.find(c => c.portalAccessId === accessId || c.id === accessId);
    return fromProps || fetchedClient;
  }, [clients, accessId, fetchedClient]);

  useEffect(() => {
    if (!accessId) return;
    const existsInProps = clients?.some(c => c.portalAccessId === accessId || c.id === accessId);
    if (!existsInProps && !client) {
      let active = true;
      setIsFetchingDirect(true);
      getClientByPortalAccessId(accessId)
        .then(c => {
          if (!active) return;
          setFetchedClient(c);
          if (c?.id) listProjectsByClientId(c.id).then(prjs => { if (active) setFetchedProjects(prjs); });
        })
        .catch(err => console.warn('[ClientPortal] Direct fetch error:', err))
        .finally(() => { if (active) { setIsFetchingDirect(false); setHasAttemptedDirectFetch(true); } });
      return () => { active = false; };
    } else if (client && fetchedProjects.length === 0) {
      const hasInProps = projects?.some(p => p.clientId === client.id);
      if (!hasInProps) listProjectsByClientId(client.id).then(setFetchedProjects);
    }
  }, [accessId, clients, client]);

  const isVendorClient = client?.clientType === 'Vendor';

  const clientProjects = useMemo(() => {
    const pool = projects && projects.length > 0 ? projects : fetchedProjects;
    const filtered = pool.filter(p => p.clientId === client?.id);
    return filtered.length > 0
      ? filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : fetchedProjects;
  }, [projects, fetchedProjects, client]);

  const [viewingDocument, setViewingDocument] = useState<{ type: 'invoice' | 'receipt'; project: Project; data: any } | null>(null);
  const [activeTab, setActiveTab] = useState<string>(isVendorClient ? 'proyek' : 'beranda');

  // Loading state
  if (!client) {
    if (isFetchingDirect || (!hasAttemptedDirectFetch && (!clients || clients.length === 0))) {
      return (
        <div className="flex items-center justify-center min-h-screen portal-page">
          <style>{PORTAL_STYLES}</style>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-xl">💍</div>
            </div>
            <p className="text-sm font-semibold text-slate-500 animate-pulse">Memuat Portal Pengantin…</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen portal-page px-4">
        <style>{PORTAL_STYLES}</style>
        <div className="portal-card rounded-3xl p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-black text-slate-800">Portal Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">Tautan portal yang Anda buka tidak valid atau sudah tidak aktif.</p>
          <a href="#/home" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const tabs = [
    ...(!isVendorClient ? [{ key: 'beranda',   label: 'Beranda',    icon: '🏠', active: 'tab-active-mono' }] : []),
    {                      key: 'proyek',    label: 'Acara Saya', icon: '💍', active: 'tab-active-mono' },
    {                      key: 'dokumen',   label: 'File',       icon: '📁', active: 'tab-active-mono' },
    ...(!isVendorClient ? [{ key: 'keuangan',  label: 'Keuangan',   icon: '💰', active: 'tab-active-mono' }] : []),
    {                      key: 'testimoni', label: 'Testimoni',  icon: '⭐', active: 'tab-active-mono' },
  ];

  return (
    <div className="portal-page">
      <style>{PORTAL_STYLES}</style>

      {/* ══════════════════════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <div className="hero-gradient relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] opacity-5 select-none">💍</div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-3xl bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0 shadow-xl">
              <span className="text-4xl select-none">💍</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">{profile.companyName}</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Halo, <span className="text-zinc-300">{client.name.split(/[\s&]/)[0]}!</span> 👋
              </h1>
              <p className="text-white/60 text-sm mt-1 font-medium">Selamat datang di portal pernikahan Anda</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {clientProjects.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold">
                    🎊 {clientProjects.length} Acara
                  </span>
                )}
                {clientProjects.some(p => p.paymentStatus === 'Lunas') && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-zinc-200 text-xs font-semibold">
                    ✅ Lunas
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold">
                  📅 Klien sejak {formatDate(client.since)}
                </span>
              </div>
            </div>

            {profile?.phone && (
              <div className="sm:w-64 flex-shrink-0">
                <HelpBox variant="public" phone={profile.phone} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB NAV
      ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-zinc-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === tab.key
                    ? tab.active
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB CONTENT
      ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'beranda'   && !isVendorClient && <DashboardTab  client={client} projects={clientProjects} profile={profile} packages={packages} />}
        {activeTab === 'proyek'                        && <ProjectsTab   projects={clientProjects} profile={profile} teamMembers={teamMembers} />}
        {activeTab === 'dokumen'                       && <GalleryTab    projects={clientProjects} packages={packages} />}
        {activeTab === 'keuangan'  && !isVendorClient  && <FinanceTab    projects={clientProjects} transactions={transactions} profile={profile} packages={packages} client={client} onViewDocument={setViewingDocument} />}
        {activeTab === 'testimoni'                     && <FeedbackTab   client={client} setClientFeedback={setClientFeedback} showNotification={showNotification} />}
      </div>

      {/* Document viewer */}
      <DocumentViewerModal
        viewingDocument={viewingDocument}
        onClose={() => setViewingDocument(null)}
        profile={profile}
        packages={packages}
        client={client}
        projects={clientProjects}
      />
    </div>
  );
};

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

const DashboardTab: React.FC<{
  client: Client; projects: Project[]; profile: Profile; packages: Package[];
}> = ({ client, projects, profile, packages }) => {
  const activeProject   = useMemo(() => projects.find(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan'), [projects]);
  const displayProgress = useMemo(() => activeProject ? getDisplayProgress(activeProject, profile.projectStatusConfig || []) : 0, [activeProject, profile]);
  const upcomingProject = useMemo(() => projects.filter(p => new Date(p.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0], [projects]);
  const activePackage   = useMemo(() => activeProject ? packages.find(pk => pk.id === activeProject.packageId) || null : null, [activeProject, packages]);
  const addOnsTotal     = useMemo(() => activeProject ? (activeProject.addOns || []).reduce((s, a) => s + (a.price || 0), 0) : 0, [activeProject]);
  const customCostsTotal = useMemo(() => activeProject ? (activeProject.customCosts || []).reduce((s, c) => s + (c.amount || 0), 0) : 0, [activeProject]);

  const packagePrice = useMemo(() => {
    if (!activeProject) return 0;
    if ((activeProject as any).unitPrice) return Number((activeProject as any).unitPrice);
    if (activePackage) {
      const dur = (activeProject as any).durationSelection;
      if (dur && activePackage.durationOptions?.length) {
        const opt = activePackage.durationOptions.find(o => o.label === dur);
        return opt ? Number(opt.price) : Number(activePackage.price);
      }
      return Number(activePackage.price);
    }
    return Math.max(0, activeProject.totalCost + (activeProject.discountAmount || 0) - addOnsTotal - Number(activeProject.transportCost || 0));
  }, [activeProject, activePackage, addOnsTotal]);

  const financial = useMemo(() => ({
    totalValue: projects.reduce((s, p) => s + p.totalCost, 0),
    totalPaid:  projects.reduce((s, p) => s + p.amountPaid, 0),
    totalDue:   projects.reduce((s, p) => s + (p.totalCost - p.amountPaid), 0),
  }), [projects]);

  return (
    <div className="space-y-5">

      {/* Upcoming event banner */}
      {upcomingProject && (
        <div className="portal-card rounded-3xl overflow-hidden portal-animate portal-animate-1">
          <div className="bg-zinc-900 px-5 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Acara Mendatang</p>
          </div>
          <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-7 h-7 text-zinc-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-lg text-zinc-900 truncate">{upcomingProject.projectName}</p>
              <p className="text-sm text-zinc-500 mt-0.5">📍 {upcomingProject.location}</p>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-zinc-900 text-white text-center flex-shrink-0">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Tanggal</p>
              <p className="text-sm font-bold mt-0.5">{formatDate(upcomingProject.date)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Finance summary */}
      <div className="grid grid-cols-3 gap-3 portal-animate portal-animate-2">
        {[
          { label: 'Total Package', value: formatDisplayCurrency(financial.totalValue), icon: '💎', bg: 'bg-zinc-50' },
          { label: 'Terbayar',      value: formatDisplayCurrency(financial.totalPaid),  icon: '✅', bg: 'bg-zinc-50' },
          { label: 'Sisa Tagihan',  value: formatDisplayCurrency(financial.totalDue),   icon: '⏳', bg: financial.totalDue > 0 ? 'bg-zinc-100' : 'bg-zinc-50' },
        ].map(item => (
          <div key={item.label} className={`portal-card rounded-2xl p-4 flex flex-col gap-2`}>
            <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center text-lg`}>{item.icon}</div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{item.label}</p>
              <p className="text-sm font-black text-zinc-900 mt-0.5 leading-tight">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress card */}
      {activeProject && (
        <div className="portal-card rounded-3xl p-5 sm:p-6 portal-animate portal-animate-3">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-lg">
                <ClockIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-zinc-900">Progres Acara</p>
                <p className="text-xs text-zinc-500">{activeProject.projectName}</p>
              </div>
            </div>
            <span className="text-2xl font-black text-zinc-900 tabular-nums">{displayProgress}%</span>
          </div>

          <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div className="h-full progress-bar rounded-full transition-all duration-1000" style={{ width: `${displayProgress}%` }} />
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 inline-block animate-pulse" />
              {activeProject.status}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {displayProgress >= 100 ? '🎉 Selesai' : displayProgress >= 75 ? '🎯 Hampir Selesai' : '⚡ On Going'}
            </span>
          </div>
        </div>
      )}

      {/* Package detail */}
      {activeProject && (
        <div className="portal-card rounded-3xl p-5 sm:p-6 portal-animate portal-animate-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
              <BriefcaseIcon className="w-5 h-5 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-black text-zinc-900">Rincian Package</p>
              <p className="text-xs text-zinc-500">Detail pesanan Anda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Package name */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Paket Terpilih</p>
              <p className="text-base font-black text-zinc-900">{activeProject.packageName || activePackage?.name || 'Custom Package'}</p>
              <p className="text-sm font-bold text-zinc-600 mt-1">
                {formatDisplayCurrency(packagePrice)}
                {(activeProject as any).durationSelection && <span className="text-zinc-400 font-medium text-xs ml-1">/ {(activeProject as any).durationSelection}</span>}
              </p>
            </div>

            {/* Cost summary */}
            <div className="bg-zinc-900 rounded-2xl p-4 text-white">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3">Ringkasan Biaya</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="opacity-50">Package</span><span className="font-bold">{formatDisplayCurrency(packagePrice)}</span></div>
                {addOnsTotal > 0 && (
                  <div className="flex justify-between text-xs"><span className="opacity-50">Add-ons</span><span className="font-bold">{formatDisplayCurrency(addOnsTotal)}</span></div>
                )}
                {customCostsTotal > 0 && (
                  <div className="flex justify-between text-xs"><span className="opacity-50">Biaya Tambahan</span><span className="font-bold">{formatDisplayCurrency(customCostsTotal)}</span></div>
                )}
                {Boolean(activeProject.discountAmount) && (
                  <div className="flex justify-between text-xs"><span className="opacity-50">Diskon</span><span className="font-bold">- {formatDisplayCurrency(activeProject.discountAmount || 0)}</span></div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Total</span>
                  <span className="text-lg font-black">{formatDisplayCurrency(activeProject.totalCost)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment status */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-700 text-sm">✅</div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Terbayar</p>
                <p className="text-sm font-black text-zinc-900">{formatDisplayCurrency(activeProject.amountPaid)}</p>
              </div>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-700 text-sm">
                {activeProject.totalCost - activeProject.amountPaid > 0 ? '⏳' : '🎉'}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Sisa</p>
                <p className="text-sm font-black text-zinc-900">{formatDisplayCurrency(activeProject.totalCost - activeProject.amountPaid)}</p>
              </div>
            </div>
          </div>

          {/* Package items */}
          {activePackage && (activePackage.digitalItems?.length > 0 || activePackage.physicalItems?.length > 0) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activePackage.digitalItems?.length > 0 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3">Layanan Digital</p>
                  <ul className="space-y-2">
                    {activePackage.digitalItems.map((it, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeProject.completedDigitalItems?.includes(it) ? 'bg-zinc-800' : 'bg-zinc-400'}`} />
                        <span className={activeProject.completedDigitalItems?.includes(it) ? 'line-through text-zinc-400' : ''}>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activePackage.physicalItems?.length > 0 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3">Item Fisik / Vendor</p>
                  <ul className="space-y-2">
                    {activePackage.physicalItems.map((it, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />{it.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Projects Tab ─────────────────────────────────────────────────────────────

const ProjectsTab: React.FC<{
  projects: Project[]; profile: Profile; teamMembers: TeamMember[];
}> = ({ projects, profile, teamMembers }) => {
  const [selectedId, setSelectedId] = useState<string | null>(projects[0]?.id || null);

  useEffect(() => {
    if (!selectedId && projects.length > 0) setSelectedId(projects[0].id);
  }, [projects, selectedId]);

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedId) || projects[0], [projects, selectedId]);
  const displayProgress = useMemo(() => selectedProject ? getDisplayProgress(selectedProject, profile.projectStatusConfig || []) : 0, [selectedProject, profile]);

  const teamByCategory = useMemo(() => {
    if (!selectedProject?.team) return { Tim: {}, Vendor: {} };
    return selectedProject.team.reduce((acc, member) => {
      const orig = teamMembers.find(m => m.id === member.memberId);
      const cat  = orig?.category || 'Tim';
      if (!acc[cat]) acc[cat] = {};
      if (!acc[cat][member.role]) acc[cat][member.role] = [];
      acc[cat][member.role].push({ ...member, phone: orig?.phone, email: orig?.email });
      return acc;
    }, { Tim: {}, Vendor: {} } as Record<string, Record<string, any[]>>);
  }, [selectedProject?.team, teamMembers]);

  return (
    <div className="space-y-5">
      {/* Project selector */}
      {projects.length > 1 && (
        <div className="portal-card rounded-2xl p-4 portal-animate portal-animate-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Pilih Acara</p>
          <div className="relative">
            <select
              value={selectedId || ''}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
            </select>
            <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {!selectedProject ? (
        <div className="portal-card rounded-3xl p-12 text-center portal-animate">
          <div className="text-4xl mb-3">💍</div>
          <p className="text-sm font-bold text-slate-400">Pilih acara untuk melihat detailnya</p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Header card */}
          <div className="portal-card rounded-3xl overflow-hidden portal-animate portal-animate-1">
            <div className="bg-zinc-900 p-5 sm:p-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Detail Acara</p>
              <h3 className="text-xl font-black text-white">{selectedProject.projectName}</h3>
              <p className="text-sm text-white/60 mt-0.5">📍 {selectedProject.location}</p>
              <p className="text-sm text-white/60">📅 {formatDate(selectedProject.date)}</p>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold text-white/50 mb-1.5">
                  <span>Progres Pengerjaan</span>
                  <span>{displayProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${displayProgress}%` }} />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-zinc-100">
              {[
                { label: 'Status',  value: selectedProject.status,                        color: 'text-zinc-800' },
                { label: 'Progres', value: `${displayProgress}%`,                         color: 'text-zinc-800' },
                { label: 'Tahapan',value: `${profile.projectStatusConfig.length} Langkah`, color: 'text-zinc-800' },
              ].map(s => (
                <div key={s.label} className="px-4 py-3 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{s.label}</p>
                  <p className={`text-xs font-black mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Journey roadmap */}
          <div className="portal-card rounded-3xl p-5 sm:p-6 portal-animate portal-animate-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-5">Perjalanan Acara</p>

            <div className="relative pl-9">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-zinc-200" />
              <div className="absolute left-3 top-2 w-px progress-bar transition-all duration-1000" style={{ height: `${displayProgress}%`, maxHeight: 'calc(100% - 16px)' }} />

              <div className="space-y-6">
                {profile.projectStatusConfig
                  .filter(s => s.name !== 'Dibatalkan' || selectedProject.status === 'Dibatalkan')
                  .map((sc, idx) => {
                    const stageIdx  = profile.projectStatusConfig.findIndex(s => s.name === selectedProject.status);
                    const isCurrent = selectedProject.status === sc.name;
                    const isPast    = idx < stageIdx;
                    const isFuture  = idx > stageIdx;

                    return (
                      <div key={sc.id} className="relative">
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white shadow-md z-10 flex items-center justify-center ${
                          isPast ? 'timeline-dot-done' : isCurrent ? 'timeline-dot-current' : 'timeline-dot-future'
                        }`}>
                          {isPast    && <CheckCircleIcon className="w-3 h-3 text-white" />}
                          {isCurrent && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>

                        <div className={`rounded-2xl border p-4 transition-all ${
                          isCurrent ? 'bg-white border-zinc-300 shadow-md ring-1 ring-zinc-200' :
                          isPast    ? 'bg-zinc-50 border-zinc-100 opacity-70' :
                                      'bg-transparent border-transparent opacity-40'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-zinc-600' : 'text-zinc-400'}`}>Tahap {idx + 1}</span>
                              {isCurrent && <span className="px-2 py-0.5 bg-zinc-900 text-white rounded-full text-[9px] font-black uppercase tracking-wider">Aktif</span>}
                            </div>
                            {sc.subStatuses.length > 0 && (
                              <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
                                {sc.subStatuses.filter(s => selectedProject.confirmedSubStatuses?.includes(s.name)).length}/{sc.subStatuses.length}
                              </span>
                            )}
                          </div>

                          <h4 className={`font-black text-base ${isCurrent ? 'text-zinc-900' : isPast ? 'text-zinc-600' : 'text-zinc-400'}`}>{sc.name}</h4>

                          {sc.subStatuses.length > 0 && !isFuture && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sc.subStatuses.map(sub => {
                                const isConfirmed = selectedProject.confirmedSubStatuses?.includes(sub.name);
                                const isActive    = selectedProject.activeSubStatuses?.includes(sub.name) && isCurrent;
                                return (
                                  <div key={sub.name} className={`flex items-start gap-2.5 p-3 rounded-xl text-xs ${
                                    isConfirmed ? 'bg-zinc-100 opacity-60' :
                                    isActive    ? 'bg-zinc-100 border border-zinc-300' :
                                                  'bg-zinc-50'
                                  }`}>
                                    <div className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
                                      isConfirmed ? 'bg-zinc-600' :
                                      isActive    ? 'bg-zinc-900 shadow-sm' :
                                                    'border-2 border-zinc-300 bg-white'
                                    }`}>
                                      {isConfirmed && <CheckCircleIcon className="w-2.5 h-2.5 text-white" />}
                                      {isActive    && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <div>
                                      <p className={`font-bold leading-tight ${isActive ? 'text-zinc-900' : isConfirmed ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>{sub.name}</p>
                                      {sub.note && <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{sub.note}</p>}
                                      {selectedProject.clientSubStatusNotes?.[sub.name] && (
                                        <p className="text-[10px] text-zinc-600 font-bold mt-1 bg-white rounded-lg px-2 py-1 border border-zinc-200">
                                          "{selectedProject.clientSubStatusNotes[sub.name]}"
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Vendor list */}
          {selectedProject.team && selectedProject.team.length > 0 && Object.values(teamByCategory['Vendor']).flat().length > 0 && (
            <div className="portal-card rounded-3xl p-5 sm:p-6 portal-animate portal-animate-3">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900">Daftar Vendor</p>
                  <p className="text-xs text-zinc-500">Tim yang bertugas di acara Anda</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(teamByCategory['Vendor']).map(([role, members]: [string, any[]]) => (
                  <div key={role}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">{role}</p>
                    {members.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl mb-2">
                        <div className="w-8 h-8 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-700 font-black text-xs flex-shrink-0">
                          {m.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate">{m.name}</p>
                          {m.subJob && <p className="text-[10px] text-zinc-500">{m.subJob}</p>}
                          {m.phone  && <p className="text-[10px] text-zinc-400 mt-0.5">📱 {m.phone}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Gallery / Files Tab ──────────────────────────────────────────────────────

const GalleryTab: React.FC<{ projects: Project[]; packages: Package[] }> = ({ projects, packages }) => (
  <div className="space-y-5">
    {projects.map((project, i) => {
      const pkg = packages.find(p => p.id === project.packageId);
      return (
        <div key={project.id} className="portal-card rounded-3xl p-5 sm:p-6 portal-animate" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <GoogleIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">File & Tautan</p>
              <p className="text-xs text-slate-500">{project.projectName}</p>
            </div>
          </div>

          {/* Drive link cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Hasil Akhir',       sub: 'File final Anda',  url: project.finalDriveLink,  emoji: '🎬', active: 'bg-zinc-900 text-white border-transparent shadow-lg' },
              { label: 'Moodboard / Brief', sub: 'Referensi tim',    url: project.driveLink,       emoji: '📌', active: 'bg-zinc-800 text-white border-transparent shadow-lg' },
              { label: 'File dari Anda',    sub: 'Unggahan Anda',    url: project.clientDriveLink, emoji: '📤', active: 'bg-zinc-700 text-white border-transparent shadow-lg' },
            ].map(link => (
              <a
                key={link.label}
                href={link.url || '#'}
                target={link.url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                  link.url
                    ? `${link.active} hover:scale-[1.02] active:scale-95 cursor-pointer`
                    : 'bg-zinc-50 border-zinc-200 text-zinc-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl">{link.emoji}</span>
                <div>
                  <p className="text-xs font-black">{link.label}</p>
                  <p className={`text-[10px] mt-0.5 ${link.url ? 'opacity-60' : 'text-zinc-400'}`}>{link.url ? 'Buka Tautan →' : 'Belum Tersedia'}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Digital items checklist */}
          {pkg?.digitalItems?.length ? (
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3">Kelengkapan File Digital</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pkg.digitalItems.map((item, idx) => {
                  const isDone = project.completedDigitalItems?.includes(item);
                  return (
                    <div key={idx} className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs ${isDone ? 'bg-zinc-200 border border-zinc-300' : 'bg-white border border-zinc-200'}`}>
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${isDone ? 'bg-zinc-700' : 'bg-zinc-100'}`}>
                        {isDone ? <CheckCircleIcon className="w-3.5 h-3.5 text-white" /> : <div className="w-2 h-2 rounded-full bg-zinc-300" />}
                      </div>
                      <span className={`font-semibold ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-700'}`}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      );
    })}
  </div>
);

// ─── Finance Tab ──────────────────────────────────────────────────────────────

const FinanceTab: React.FC<{
  projects: Project[]; transactions: Transaction[]; profile: Profile;
  packages: Package[]; client: Client; onViewDocument: (d: any) => void;
}> = ({ projects, transactions, client, onViewDocument }) => (
  <div className="space-y-5">
    {projects.map((project, i) => {
      const txs = transactions.filter(t => t.projectId === project.id && t.type === TransactionType.INCOME);
      const paidPct = project.totalCost > 0 ? Math.min(100, Math.round((project.amountPaid / project.totalCost) * 100)) : 0;

      return (
        <div key={project.id} className="portal-card rounded-3xl p-5 sm:p-6 portal-animate" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSignIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">{project.projectName}</p>
                <p className="text-xs text-slate-500">{formatDate(project.date)}</p>
              </div>
            </div>
            <button
              onClick={() => onViewDocument({ type: 'invoice', project, data: project })}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              <FileTextIcon className="w-3.5 h-3.5" /> Invoice
            </button>
          </div>

          {/* Payment summary */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1.5">
              <span>Progres Pembayaran</span>
              <span className="text-zinc-700">{paidPct}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
              <div className="h-full progress-bar rounded-full transition-all duration-700" style={{ width: `${paidPct}%` }} />
            </div>
            <div className="flex gap-3 mt-3">
              <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Terbayar</p>
                <p className="text-sm font-black text-zinc-900 mt-0.5">{formatDisplayCurrency(project.amountPaid)}</p>
              </div>
              <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Sisa</p>
                <p className="text-sm font-black text-zinc-900 mt-0.5">{formatDisplayCurrency(project.totalCost - project.amountPaid)}</p>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3">Riwayat Pembayaran</p>
            <div className="space-y-2">
              {txs.length > 0 ? txs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-zinc-100 hover:shadow-sm transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-100 transition-colors flex-shrink-0">
                    <CreditCardIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-700 truncate">{tx.description}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{formatDate(tx.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-sm font-black text-zinc-900">{formatDisplayCurrency(tx.amount)}</p>
                    <button onClick={() => onViewDocument({ type: 'receipt', project, data: tx })} className="p-1.5 rounded-lg text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-all">
                      <FileTextIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <p className="text-sm font-bold text-zinc-400">Belum ada pembayaran tercatat</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// ─── Feedback Tab ─────────────────────────────────────────────────────────────

const FeedbackTab: React.FC<{
  client: Client; setClientFeedback: any; showNotification: any;
}> = ({ client, setClientFeedback, showNotification }) => {
  const [rating,             setRating]             = useState(0);
  const [feedbackText,       setFeedbackText]       = useState('');
  const [existingFeedbackId, setExistingFeedbackId] = useState<string | null>(null);
  const [isSubmitting,       setIsSubmitting]       = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!client?.name) return;
      try {
        const { data } = await supabase
          .from('client_feedback')
          .select('*')
          .eq('client_name', client.name)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data && mounted) {
          setExistingFeedbackId(data.id);
          setRating(data.rating || 0);
          setFeedbackText(data.feedback || '');
        }
      } catch (err) { console.warn('Could not check existing feedback:', err); }
    })();
    return () => { mounted = false; };
  }, [client?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { alert('Mohon berikan peringkat.'); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        clientName: client!.name, rating,
        satisfaction: getSatisfactionFromRating(rating),
        feedback: feedbackText,
        date: new Date().toISOString(),
      };
      if (existingFeedbackId) {
        const updated = await updateClientFeedback(existingFeedbackId, payload);
        setClientFeedback((prev: ClientFeedback[]) => prev.map(f => f.id === existingFeedbackId ? updated : f));
        showNotification('Terima kasih! Ulasan Anda telah diperbarui.');
      } else {
        const created = await createClientFeedback(payload as Omit<ClientFeedback, 'id'>);
        setExistingFeedbackId(created.id);
        setClientFeedback((prev: ClientFeedback[]) => [created, ...prev]);
        showNotification('Terima kasih! Masukan Anda telah tersimpan.');
      }
    } catch (err) {
      console.error('[ClientPortal] Feedback save failed:', err);
      showNotification('Gagal menyimpan masukan. Coba lagi.');
    } finally { setIsSubmitting(false); }
  };

  const labels = ['', 'Buruk', 'Kurang', 'Cukup', 'Bagus', 'Luar Biasa'];

  return (
    <div className="portal-card rounded-3xl p-5 sm:p-6 portal-animate portal-animate-1">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
          <StarIcon className="w-6 h-6 text-amber-500 fill-amber-500" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-800">{existingFeedbackId ? 'Ubah Testimoni' : 'Berikan Testimoni'}</h3>
          <p className="text-xs text-slate-500">{existingFeedbackId ? 'Perbarui penilaian Anda' : 'Berbagi pengalaman bersama kami'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star rating */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Tingkat Kepuasan</p>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-all hover:scale-125 active:scale-95"
              >
                <StarIcon className={`w-10 h-10 transition-all ${
                  rating >= star
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                    : 'text-slate-200 fill-slate-200'
                }`} />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm font-black text-amber-600 ml-1">{labels[rating]}</span>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Testimoni Anda</p>
          <textarea
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            placeholder="Tuliskan pengalaman berkesan Anda bersama kami…"
            rows={5}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-300 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-zinc-900 text-white font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Menyimpan…' : (
            <>{existingFeedbackId ? '💾 Perbarui Testimoni' : '🚀 Kirim Testimoni'}</>
          )}
        </button>
      </form>
    </div>
  );
};

// ─── Document Viewer Modal ────────────────────────────────────────────────────

const DocumentViewerModal: React.FC<{
  viewingDocument: any; onClose: any; profile: Profile;
  packages: Package[]; client: Client; projects: Project[];
}> = ({ viewingDocument, onClose, profile, packages, client, projects }) => {
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => { console.log('isSigning state changed to:', isSigning); }, [isSigning]);

  const handleSaveSignature = (signature: string) => {
    console.log('Saving signature:', signature?.substring(0, 50) + '...');
    setIsSigning(false);
  };

  const handleDownloadPDF = async () => {
    if (!viewingDocument) return;
    const targetId = viewingDocument.type === 'invoice' ? 'invoice-document' : 'receipt-document';
    const element  = document.getElementById(targetId);
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `${viewingDocument.type}-${viewingDocument.project?.clientName?.replace(/\s+/g, '-').toLowerCase()}-${viewingDocument.project?.id.slice(-8)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true, windowWidth: 1200 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };
    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf().set(opt).from(element).save();
  };

  const renderBody = () => {
    if (!viewingDocument) return null;
    const { type, project, data } = viewingDocument;
    if (type === 'invoice') {
      return <InvoiceDocument id="invoice-document" project={project} profile={profile} packages={packages} client={client} />;
    }
    const tx = data as Transaction;
    const proj = tx.projectId ? projects.find((p: Project) => p.id === tx.projectId) : null;
    return (
      <div id="receipt-document" className="p-4 sm:p-8 bg-white border border-slate-200 shadow-xl mx-auto max-w-2xl font-sans text-slate-900">
        <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-blue-600">
          <div>
            {profile.logoBase64
              ? <img src={profile.logoBase64} alt="Logo" className="h-14 object-contain mb-2" />
              : <h2 className="text-xl font-bold text-blue-600 mb-1">{profile.companyName}</h2>
            }
            <p className="text-xs text-slate-500">{profile.address}</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Tanda Terima</h1>
            <p className="text-xs font-mono text-slate-500 mt-1">#{tx.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl mb-8 border border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
          <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Telah Diterima Secara Sah</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{formatDocumentCurrency(tx.amount)}</p>
          <p className="text-xs text-slate-500 mt-2">Tanggal: <span className="font-bold text-slate-700">{formatDate(tx.date)}</span></p>
        </div>
        <div className="space-y-3 mb-8">
          {[['Diterima Dari', client.name], ['Metode', tx.method]].map(([l, v]) => (
            <div key={l} className="flex justify-between text-sm py-2 border-b border-slate-100">
              <span className="text-slate-500">{l}</span><span className="font-bold text-slate-800">{v}</span>
            </div>
          ))}
          <div className="py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Keterangan</p>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">{tx.description}</p>
          </div>
          {proj && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              <p className="font-bold mb-1">{proj.projectName}</p>
              <div className="flex justify-between">
                <span>Total: {formatDocumentCurrency(proj.totalCost)}</span>
                <span className="font-bold">Sisa: {formatDocumentCurrency(proj.totalCost - proj.amountPaid)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between items-end pt-6 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 italic">Dicetak oleh {profile.companyName}</p>
          <div className="text-center w-40">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Penerima,</p>
            <div className="h-16 flex items-center justify-center mb-1">
              {tx.vendorSignature
                ? <img src={tx.vendorSignature} alt="TTD" className="max-h-full object-contain" />
                : <div className="h-px w-24 bg-slate-200 mt-10 mx-auto" />
              }
            </div>
            <p className="text-sm font-bold text-slate-800 underline underline-offset-4 decoration-slate-300">
              ({profile.authorizedSigner || profile.companyName})
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        isOpen={!!viewingDocument}
        onClose={onClose}
        title={viewingDocument ? `${viewingDocument.type === 'invoice' ? 'Invoice' : 'Tanda Terima'}: ${viewingDocument.project.projectName}` : ''}
        size="4xl"
      >
        {viewingDocument && (
          <div>
            <div className="overflow-y-auto pr-1">{renderBody()}</div>
            <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <DownloadIcon className="w-4 h-4" /> Unduh PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Signature pad overlay */}
      <div
        style={{ display: isSigning ? 'flex' : 'none', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        className="items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) setIsSigning(false); }}
      >
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-lg font-bold text-slate-800">Bubuhkan Tanda Tangan</h3>
            <button onClick={() => setIsSigning(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <SignaturePad onSave={handleSaveSignature} onClose={() => setIsSigning(false)} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientPortal;
