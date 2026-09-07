import React, { useState } from 'react';
import {
  Client, Project, PaymentStatus, Package, AddOn, TransactionType,
  Transaction, Card, ViewType, NavigationAction
} from '../../../types';
import Modal from '../../../shared/ui/Modal';
import RupiahInput from '../../../shared/form/RupiahInput';
import {
  PencilIcon, Trash2Icon, FileTextIcon, CreditCardIcon, Share2Icon,
  HistoryIcon, DollarSignIcon, FolderKanbanIcon, UsersIcon, TrendingUpIcon,
  TrendingDownIcon, CheckIcon, XIcon, cleanPhoneNumber
} from '../../../constants';
import { updateProject as updateProjectRow } from '../../../services/projects';
import { formatCurrency, normalizeTerminology } from '../utils/clientHelpers';

interface ClientDetailModalProps {
  client: Client | null;
  projects: Project[];
  transactions: Transaction[];
  packages: Package[];
  onClose: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onViewReceipt: (transaction: Transaction) => void;
  onViewInvoice: (project: Project) => void;
  handleNavigation: (view: ViewType, action?: NavigationAction) => void;
  onRecordPayment: (projectId: string, amount: number, destinationCardId: string) => void;
  cards: Card[];
  onSharePortal: (client: Client) => void;
  onDeleteProject: (projectId: string) => void;
  showNotification: (message: string) => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
}

// ─── Tiny reusable sub-components ───────────────────────────────────────────

const InfoField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-secondary">{label}</span>
    <span className="text-sm font-semibold text-brand-text-light">{children}</span>
  </div>
);

const FinancePill: React.FC<{
  label: string;
  value: string;
  color: 'neutral' | 'green' | 'red';
}> = ({ label, value, color }) => {
  const colorMap = {
    neutral: 'bg-slate-100 border-slate-200 text-slate-700',
    green:   'bg-emerald-50 border-emerald-200 text-emerald-700',
    red:     'bg-red-50   border-red-200   text-red-700',
  };
  return (
    <div className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border ${colorMap[color]}`}>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">{label}</span>
      <span className="text-base font-black tracking-tight">{value}</span>
    </div>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode; sub?: string }> = ({ children, sub }) => (
  <div className="mb-3">
    <h4 className="text-sm font-bold text-brand-text-light">{children}</h4>
    {sub && <p className="text-[11px] text-brand-text-secondary mt-0.5">{sub}</p>}
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client, projects, transactions, packages,
  onClose, onEditClient, onDeleteClient,
  onViewReceipt, onViewInvoice, handleNavigation,
  onRecordPayment, cards, onSharePortal, onDeleteProject,
  showNotification, setProjects, setTransactions, setCards,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'payments'>('info');
  const [newPayments, setNewPayments] = useState<{ [key: string]: { amount: string; destinationCardId: string } }>({});
  const [newCharge, setNewCharge] = useState<{ [key: string]: { name: string; amount: string } }>({});
  const [projectOverrides, setProjectOverrides] = useState<{ [projectId: string]: Partial<Project> }>({});
  const [editingChargeId, setEditingChargeId] = useState<string | null>(null);
  const [editChargeData, setEditChargeData] = useState({ name: '', amount: '' });

  if (!client) return null;

  // ── handlers (unchanged logic) ──────────────────────────────────────────

  const handleNewPaymentChange = (projectId: string, field: 'amount' | 'destinationCardId', value: string) => {
    const current = newPayments[projectId] || { amount: '', destinationCardId: '' };
    setNewPayments(prev => ({ ...prev, [projectId]: { ...current, [field]: value } }));
  };

  const handleNewPaymentSubmit = (projectId: string) => {
    const paymentData = newPayments[projectId];
    const project = clientProjects.find(p => p.id === projectId);
    if (paymentData && Number(paymentData.amount) > 0 && paymentData.destinationCardId && project) {
      const amount = Number(paymentData.amount);
      if (amount > (project.totalCost - project.amountPaid)) {
        alert('Jumlah pembayaran melebihi sisa tagihan.');
        return;
      }
      onRecordPayment(projectId, amount, paymentData.destinationCardId);
      setNewPayments(prev => ({ ...prev, [projectId]: { amount: '', destinationCardId: '' } }));
    } else {
      showNotification('Harap isi jumlah dan tujuan pembayaran dengan benar.');
    }
  };

  const handleNewChargeChange = (projectId: string, field: 'name' | 'amount', value: string) => {
    const current = newCharge[projectId] || { name: '', amount: '' };
    setNewCharge(prev => ({ ...prev, [projectId]: { ...current, [field]: value } }));
  };

  const handleNewChargeSubmit = async (projectId: string) => {
    const chargeData = newCharge[projectId];
    const project = clientProjects.find(p => p.id === projectId);
    if (chargeData && chargeData.name.trim() && Number(chargeData.amount) > 0 && project) {
      const amount = Number(chargeData.amount);
      const newCustomCost = { id: `custom-${Date.now()}`, description: chargeData.name.trim(), amount };
      const updatedCustomCosts = [...(project.customCosts || []), newCustomCost];
      const newTotalCost = project.totalCost + amount;
      const remaining = newTotalCost - project.amountPaid;
      const newPaymentStatus = remaining <= 0 ? PaymentStatus.LUNAS : (project.amountPaid > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR);
      try {
        await updateProjectRow(projectId, { customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus });
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus } : p));
        setNewCharge(prev => ({ ...prev, [projectId]: { name: '', amount: '' } }));
        showNotification('Biaya tambahan berhasil ditambahkan.');
      } catch (err) {
        console.error('Gagal menambahkan biaya tambahan:', err);
        showNotification('Gagal menambahkan biaya tambahan.');
      }
    } else {
      showNotification('Harap isi nama dan jumlah biaya dengan benar.');
    }
  };

  const handleDeleteCharge = async (projectId: string, chargeId: string) => {
    if (!window.confirm('Hapus biaya tambahan ini?')) return;
    const project = clientProjects.find(p => p.id === projectId);
    if (!project?.customCosts) return;
    const chargeToDelete = project.customCosts.find(c => c.id === chargeId);
    if (!chargeToDelete) return;
    const updatedCustomCosts = project.customCosts.filter(c => c.id !== chargeId);
    const newTotalCost = project.totalCost - chargeToDelete.amount;
    const remaining = newTotalCost - project.amountPaid;
    const newPaymentStatus = remaining <= 0 ? PaymentStatus.LUNAS : (project.amountPaid > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR);
    try {
      await updateProjectRow(projectId, { customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus } : p));
      showNotification('Biaya tambahan berhasil dihapus.');
    } catch (err) {
      console.error('Gagal menghapus biaya tambahan:', err);
      showNotification('Gagal menghapus biaya tambahan.');
    }
  };

  const handleStartEditCharge = (charge: { id: string; description: string; amount: number }) => {
    setEditingChargeId(charge.id);
    setEditChargeData({ name: charge.description, amount: String(charge.amount) });
  };

  const handleSaveEditCharge = async (projectId: string) => {
    const project = clientProjects.find(p => p.id === projectId);
    if (!project?.customCosts || !editingChargeId) return;
    const chargeToUpdate = project.customCosts.find(c => c.id === editingChargeId);
    if (!chargeToUpdate) return;
    const newAmount = Number(editChargeData.amount);
    const name = editChargeData.name.trim();
    if (!name || isNaN(newAmount)) { showNotification('Harap isi nama dan jumlah biaya dengan benar.'); return; }
    const diff = newAmount - chargeToUpdate.amount;
    const updatedCustomCosts = project.customCosts.map(c => c.id === editingChargeId ? { ...c, description: name, amount: newAmount } : c);
    const newTotalCost = project.totalCost + diff;
    const remaining = newTotalCost - project.amountPaid;
    const newPaymentStatus = remaining <= 0 ? PaymentStatus.LUNAS : (project.amountPaid > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR);
    try {
      await updateProjectRow(projectId, { customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus } : p));
      setEditingChargeId(null);
      showNotification('Biaya tambahan berhasil diperbarui.');
    } catch (err) {
      console.error('Gagal update biaya tambahan:', err);
      showNotification('Gagal memperbarui biaya tambahan.');
    }
  };

  // ── derived data ─────────────────────────────────────────────────────────

  const clientProjects = projects
    .filter(p => p.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(p => projectOverrides[p.id] ? { ...p, ...projectOverrides[p.id] } : p);

  const clientTransactions = transactions
    .filter(t => clientProjects.some(p => p.id === t.projectId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalProjects     = clientProjects.length;
  const totalProjectValue = clientProjects.reduce((s, p) => s + p.totalCost, 0);
  const totalPaid         = clientProjects.reduce((s, p) => s + p.amountPaid, 0);
  const totalDue          = totalProjectValue - totalPaid;

  // ── avatar initials ───────────────────────────────────────────────────────

  const initials = client.name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  // ── payment status badge ──────────────────────────────────────────────────

  const getStatusBadge = (status: PaymentStatus | null) => {
    switch (status) {
      case PaymentStatus.LUNAS:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Lunas
          </span>
        );
      case PaymentStatus.DP_TERBAYAR:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            DP Terbayar
          </span>
        );
      case PaymentStatus.BELUM_BAYAR:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            Belum Bayar
          </span>
        );
    }
  };

  // ── tab config ────────────────────────────────────────────────────────────

  const tabs: { key: 'info' | 'payments'; label: string; icon: React.ReactNode }[] = [
    { key: 'info',     label: 'Informasi',  icon: <UsersIcon   className="w-4 h-4" /> },
    { key: 'payments', label: 'Pembayaran', icon: <HistoryIcon className="w-4 h-4" /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full -mt-1">

      {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden mb-5 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20">
        {/* decorative rings */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 sm:p-6">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner border border-white/30">
            <span className="text-white font-black text-xl sm:text-2xl tracking-tight select-none">{initials}</span>
          </div>

          {/* Name + meta */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-100/80 mb-0.5">Detail Pengantin</p>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">{client.name}</h2>
            <div className="mt-1.5 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-white text-[10px] font-semibold border border-white/20">
                💍 {client.clientType}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-white text-[10px] font-semibold border border-white/20">
                📅 Sejak {new Date(client.since).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {totalProjects > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-white text-[10px] font-semibold border border-white/20">
                  🎊 {totalProjects} Acara
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onEditClient(client)}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-all active:scale-90"
              title="Edit Pengantin"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSharePortal(client)}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-all active:scale-90"
              title="Bagikan Portal"
            >
              <Share2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Finance summary strip */}
        <div className="relative grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
          {[
            { label: 'Total Package',   value: formatCurrency(totalProjectValue), icon: '💰' },
            { label: 'Terbayar',        value: formatCurrency(totalPaid),         icon: '✅' },
            { label: 'Sisa Tagihan',    value: formatCurrency(totalDue),          icon: '⏳' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center py-3 px-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-blue-100/70">{item.label}</span>
              <span className="text-sm sm:text-base font-black text-white mt-0.5 text-center leading-tight">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 p-1 bg-brand-bg rounded-xl border border-brand-border mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-brand-surface text-brand-accent shadow-sm border border-brand-border'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── SCROLLABLE CONTENT ──────────────────────────────────────────── */}
      <div className="pb-4">

        {/* ════════════════════════════════════════════════════════════════
            TAB: INFO
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'info' && (
          <div className="space-y-5 animate-fade-in">

            {/* Contact & identity card */}
            <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-brand-border bg-brand-bg/60">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Kontak &amp; Identitas</p>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Email">
                  <span className="break-all">{client.email || '-'}</span>
                </InfoField>
                <InfoField label="Telepon">
                  <a
                    href={`https://wa.me/${cleanPhoneNumber(client.whatsapp || client.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-accent hover:underline"
                  >
                    {client.whatsapp || client.phone || '-'}
                  </a>
                </InfoField>
                <InfoField label="No. WhatsApp">
                  <a
                    href={`https://wa.me/${cleanPhoneNumber(client.whatsapp || client.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-accent hover:underline"
                  >
                    {client.whatsapp || client.phone || '-'}
                  </a>
                </InfoField>
                <InfoField label="Instagram">
                  {client.instagram
                    ? <a href={`https://instagram.com/${client.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">{client.instagram}</a>
                    : '-'
                  }
                </InfoField>
                <InfoField label="Jenis Pengantin">{client.clientType}</InfoField>
                <InfoField label="Status">{client.status}</InfoField>
                {client.address && (
                  <div className="sm:col-span-2">
                    <InfoField label="Alamat Lengkap">{client.address}</InfoField>
                  </div>
                )}
              </div>
            </div>

            {/* Financial summary cards */}
            <div>
              <SectionTitle sub="Total Package, pembayaran, dan sisa tagihan pengantin ini">
                Ringkasan Keuangan
              </SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: <FolderKanbanIcon className="w-5 h-5 text-indigo-500" />,
                    label: 'Jumlah Acara',
                    value: totalProjects.toString(),
                    accent: 'from-indigo-50 to-white border-indigo-100',
                    text: 'text-indigo-700',
                  },
                  {
                    icon: <DollarSignIcon className="w-5 h-5 text-blue-500" />,
                    label: 'Total Package',
                    value: formatCurrency(totalProjectValue),
                    accent: 'from-blue-50 to-white border-blue-100',
                    text: 'text-blue-700',
                  },
                  {
                    icon: <TrendingUpIcon className="w-5 h-5 text-emerald-500" />,
                    label: 'Terbayar',
                    value: formatCurrency(totalPaid),
                    accent: 'from-emerald-50 to-white border-emerald-100',
                    text: 'text-emerald-700',
                  },
                  {
                    icon: <TrendingDownIcon className="w-5 h-5 text-red-400" />,
                    label: 'Sisa Tagihan',
                    value: formatCurrency(totalDue),
                    accent: totalDue > 0 ? 'from-red-50 to-white border-red-100' : 'from-emerald-50 to-white border-emerald-100',
                    text: totalDue > 0 ? 'text-red-700' : 'text-emerald-700',
                  },
                ].map(card => (
                  <div
                    key={card.label}
                    className={`bg-gradient-to-br ${card.accent} border rounded-2xl p-4 flex items-center gap-3 shadow-sm`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-slate-100">
                      {card.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">{card.label}</p>
                      <p className={`text-sm font-black ${card.text} truncate`}>{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portal share button */}
            <button
              onClick={() => onSharePortal(client)}
              className="w-full button-secondary inline-flex items-center justify-center gap-2 text-sm"
            >
              <Share2Icon className="w-4 h-4" />
              Bagikan Portal Pengantin
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: PAYMENTS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'payments' && (
          <div className="space-y-8 animate-fade-in">
            {clientProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center mb-4">
                  <FolderKanbanIcon className="w-7 h-7 text-brand-text-secondary" />
                </div>
                <p className="text-sm font-semibold text-brand-text-light">Belum ada acara pernikahan</p>
                <p className="text-xs text-brand-text-secondary mt-1">Tambahkan acara pernikahan untuk pengantin ini.</p>
              </div>
            )}

            {clientProjects.map((p, projectIndex) => {
              const transactionsForProject = clientTransactions.filter(t => t.projectId === p.id);
              const remainingBalance       = p.totalCost - p.amountPaid;
              const displayProjectName     = (p.projectName || '').replace(/^Acara Pernikahan\s+/i, '').trim();
              const pkg                    = packages.find(pkg => pkg.id === p.packageId) || null;
              const selectedAddOns         = (p.addOns || []).filter(a => a && (a.name || a.id));
              const paidPercent            = p.totalCost > 0 ? Math.min(100, Math.round((p.amountPaid / p.totalCost) * 100)) : 0;

              return (
                <div key={p.id} className="relative">
                  {/* Project number connector line (skip last) */}
                  {projectIndex < clientProjects.length - 1 && (
                    <div className="absolute left-5 top-full w-px h-8 bg-gradient-to-b from-brand-border to-transparent" />
                  )}

                  {/* ── PROJECT HEADER ───────────────────────────────── */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200 mt-0.5">
                        <span className="text-white font-black text-xs">#{projectIndex + 1}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-text-light leading-tight">
                          {displayProjectName || p.projectName}
                        </h4>
                        <p className="text-[10px] text-brand-text-secondary mt-0.5">
                          PRJ-{p.id.slice(-6).toUpperCase()} &nbsp;•&nbsp;
                          {new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(p.paymentStatus)}
                  </div>

                  {/* ── PROJECT CARD ──────────────────────────────────── */}
                  <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-hidden">

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${paidPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>

                    <div className="p-4 sm:p-5 space-y-5">

                      {/* Info grid: package / location / address */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary mb-1">Package Layanan</p>
                          <p className="text-sm font-semibold text-brand-text-light">{p.packageName || pkg?.name || '-'}</p>
                          {((p as any).durationSelection || '').trim() && (
                            <p className="text-[11px] text-brand-accent font-medium mt-0.5 italic">{(p as any).durationSelection}</p>
                          )}
                          {pkg && pkg.digitalItems.length > 0 && (
                            <ul className="mt-1.5 space-y-0.5">
                              {pkg.digitalItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-[10px] text-brand-text-secondary">
                                  <span className="text-brand-accent font-bold mt-px">·</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary mb-1">Lokasi</p>
                          <p className="text-sm font-semibold text-brand-text-light">{p.location || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary mb-1">Alamat / Gedung</p>
                          <p className="text-sm font-semibold text-brand-text-light line-clamp-2" title={p.address}>{p.address || '-'}</p>
                        </div>
                      </div>

                      {/* Cost breakdown */}
                      <div className="rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200">
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary">Rincian Biaya</p>
                        </div>
                        <div className="px-4 py-3 space-y-2.5">
                          {/* Base package */}
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-brand-text-secondary font-medium">Package Utama</span>
                            <span className="font-bold text-brand-text-light">
                              {formatCurrency(
                                p.totalCost
                                - (p.customCosts?.reduce((s, c) => s + c.amount, 0) || 0)
                                - selectedAddOns.reduce((s, a) => s + (Number(a.price) || 0), 0)
                                - (Number(p.transportCost) || 0)
                              )}
                            </span>
                          </div>
                          {pkg && pkg.digitalItems.length > 0 && (
                            <div className="pl-3 space-y-0.5 opacity-60">
                              {pkg.digitalItems.map((item, idx) => (
                                <p key={idx} className="text-[10px] text-brand-text-secondary italic">– {item}</p>
                              ))}
                            </div>
                          )}

                          {/* Add-ons */}
                          {selectedAddOns.length > 0 && selectedAddOns.map((a, idx) => (
                            <div key={a.id || a.name || idx} className="flex justify-between items-center text-xs">
                              <span className="text-brand-text-secondary">+ {a.name} <span className="opacity-60">(Add-on)</span></span>
                              <span className="font-semibold text-brand-text-light">{formatCurrency(Number(a.price || 0))}</span>
                            </div>
                          ))}

                          {/* Transport */}
                          {p.transportCost && Number(p.transportCost) > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-brand-text-secondary">+ Biaya Transport</span>
                              <span className="font-semibold text-brand-text-light">{formatCurrency(Number(p.transportCost))}</span>
                            </div>
                          )}

                          {/* Custom costs */}
                          {p.customCosts && p.customCosts.length > 0 && (
                            <div className="pt-1 space-y-1.5 border-t border-slate-200">
                              {p.customCosts.map(c => {
                                const isEditing = editingChargeId === c.id;
                                return (
                                  <div key={c.id} className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 group/charge">
                                    {isEditing ? (
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                          type="text"
                                          value={editChargeData.name}
                                          onChange={e => setEditChargeData({ ...editChargeData, name: e.target.value })}
                                          className="flex-grow p-1.5 text-xs bg-white border border-brand-border rounded-lg text-brand-text-light focus:border-brand-accent outline-none"
                                        />
                                        <RupiahInput
                                          value={editChargeData.amount}
                                          onChange={val => setEditChargeData({ ...editChargeData, amount: val })}
                                          className="w-full sm:w-32 p-1.5 text-xs bg-white border border-brand-border rounded-lg text-brand-text-light focus:border-brand-accent outline-none"
                                        />
                                        <div className="flex gap-1">
                                          <button onClick={() => handleSaveEditCharge(p.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all">
                                            <CheckIcon className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={() => setEditingChargeId(null)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all">
                                            <XIcon className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                          <span className="text-amber-700 font-semibold">+ {c.description}</span>
                                          <div className="flex items-center gap-0.5 opacity-0 group-hover/charge:opacity-100 transition-all">
                                            <button onClick={() => handleStartEditCharge(c)} className="p-1 text-blue-500 hover:text-blue-700 active:scale-90 transition-all" title="Edit">
                                              <PencilIcon className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleDeleteCharge(p.id, c.id)} className="p-1 text-red-400 hover:text-red-600 active:scale-90 transition-all" title="Hapus">
                                              <Trash2Icon className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                        <span className="font-bold text-amber-700">{formatCurrency(c.amount)}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Divider + totals */}
                          <div className="pt-2 border-t border-slate-200">
                            <div className="flex justify-between items-center text-xs font-black">
                              <span className="text-brand-text-secondary uppercase tracking-wide">Total Tagihan</span>
                              <span className="text-base text-brand-text-light">{formatCurrency(p.totalCost)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial pills + payment progress */}
                      <div className="space-y-3">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          <FinancePill label="Total"    value={formatCurrency(p.totalCost)}      color="neutral" />
                          <FinancePill label="Terbayar" value={formatCurrency(p.amountPaid)}     color="green"   />
                          <FinancePill label="Sisa"     value={formatCurrency(remainingBalance)} color={remainingBalance > 0 ? 'red' : 'green'} />
                        </div>

                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-[10px] font-semibold text-brand-text-secondary mb-1">
                            <span>Progres Pembayaran</span>
                            <span className={paidPercent >= 100 ? 'text-emerald-600' : 'text-blue-600'}>{paidPercent}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${paidPercent >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                              style={{ width: `${paidPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {p.dpProofUrl && (
                          <a
                            href={p.dpProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 button-secondary !py-2 !px-3 text-xs inline-flex items-center justify-center gap-1.5"
                          >
                            <CreditCardIcon className="w-3.5 h-3.5 text-brand-accent" />
                            Bukti DP
                          </a>
                        )}
                        <button
                          onClick={() => onViewInvoice(p)}
                          className="flex-1 button-primary !py-2 !px-3 text-xs inline-flex items-center justify-center gap-1.5"
                        >
                          <FileTextIcon className="w-3.5 h-3.5" />
                          Invoice PDF
                        </button>
                        <button
                          onClick={() => onDeleteProject(p.id)}
                          className="w-9 h-9 rounded-xl border border-brand-border text-brand-text-secondary hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center"
                          title="Hapus Acara"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── TRANSACTION HISTORY ───────────────────────────── */}
                  <div className="mt-4">
                    <SectionTitle sub="Riwayat semua pembayaran yang telah dilakukan">
                      Detail Transaksi
                    </SectionTitle>

                    {/* Mobile transaction cards */}
                    <div className="md:hidden space-y-2">
                      {transactionsForProject.length > 0 ? transactionsForProject.map(t => {
                        const isTransport =
                          (t.category?.toLowerCase().includes('transport')) ||
                          (t.description?.toLowerCase().includes('transport'));
                        return (
                          <div key={t.id} className="rounded-xl bg-brand-surface border border-brand-border p-3 shadow-sm flex items-start justify-between active:scale-[0.98] transition-transform">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <p className="text-xs font-semibold text-brand-text-light truncate">{normalizeTerminology(t.description)}</p>
                                {isTransport && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">🚗 Transport</span>}
                              </div>
                              <p className="text-[10px] text-brand-text-secondary">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                              <p className="text-[10px] text-brand-text-secondary opacity-70 mt-0.5">{normalizeTerminology(t.category || '-')}</p>
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                              <p className={`text-sm font-black mb-1.5 ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-500'}`}>
                                {formatCurrency(t.amount)}
                              </p>
                              <button onClick={() => onViewReceipt(t)} className="button-secondary !text-[10px] !px-2.5 !py-1 active:scale-95">Bukti</button>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="text-center py-8 bg-brand-surface rounded-2xl border border-brand-border border-dashed">
                          <p className="text-xs text-brand-text-secondary">Belum ada transaksi untuk acara ini.</p>
                        </div>
                      )}
                    </div>

                    {/* Desktop transaction table */}
                    <div className="hidden md:block rounded-2xl border border-brand-border overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-brand-bg">
                            <th className="px-3 py-3 text-center font-semibold text-brand-text-secondary w-10 text-xs">#</th>
                            <th className="px-3 py-3 text-left  font-semibold text-brand-text-secondary text-xs">Tanggal</th>
                            <th className="px-3 py-3 text-left  font-semibold text-brand-text-secondary text-xs">Deskripsi</th>
                            <th className="px-3 py-3 text-left  font-semibold text-brand-text-secondary text-xs">Kategori</th>
                            <th className="px-3 py-3 text-right font-semibold text-brand-text-secondary text-xs">Jumlah</th>
                            <th className="px-3 py-3 text-center font-semibold text-brand-text-secondary text-xs w-12">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                          {transactionsForProject.length > 0 ? transactionsForProject.map((t, index) => {
                            const isTransport =
                              (t.category?.toLowerCase().includes('transport')) ||
                              (t.description?.toLowerCase().includes('transport'));
                            return (
                              <tr key={t.id} className="hover:bg-brand-bg/60 transition-colors">
                                <td className="px-3 py-3 text-center text-xs text-brand-text-secondary font-medium">{index + 1}</td>
                                <td className="px-3 py-3 text-xs text-brand-text-secondary whitespace-nowrap">
                                  {new Date(t.date).toLocaleDateString('id-ID')}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-brand-text-light">{normalizeTerminology(t.description)}</span>
                                    {isTransport && (
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">🚗 Transport</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-[10px] text-brand-text-secondary">{normalizeTerminology(t.category || '-')}</td>
                                <td className={`px-3 py-3 text-right text-xs font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {formatCurrency(t.amount)}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    onClick={() => onViewReceipt(t)}
                                    className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-accent hover:bg-blue-50 transition-all"
                                    title="Lihat Bukti"
                                  >
                                    <FileTextIcon className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-xs text-brand-text-secondary">
                                Belum ada transaksi untuk acara ini.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── RECORD NEW PAYMENT ───────────────────────────── */}
                  {remainingBalance > 0 && (
                    <div className="mt-5">
                      <SectionTitle sub={`Sisa tagihan: ${formatCurrency(remainingBalance)}`}>
                        Catat Pembayaran Baru
                      </SectionTitle>
                      <div className="bg-brand-surface rounded-2xl border border-brand-border p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="input-group flex-grow w-full !mt-0">
                            <RupiahInput
                              id={`amount-${p.id}`}
                              value={newPayments[p.id]?.amount || ''}
                              onChange={(raw) => handleNewPaymentChange(p.id, 'amount', raw)}
                              max={remainingBalance}
                              className="input-field"
                              placeholder=" "
                            />
                            <label htmlFor={`amount-${p.id}`} className="input-label">
                              Jumlah (Maks: {formatCurrency(remainingBalance)})
                            </label>
                          </div>
                          <div className="input-group w-full sm:w-56 !mt-0">
                            <select
                              id={`dest-${p.id}`}
                              value={newPayments[p.id]?.destinationCardId || ''}
                              onChange={e => handleNewPaymentChange(p.id, 'destinationCardId', e.target.value)}
                              className="input-field"
                            >
                              <option value="">Pilih Tujuan...</option>
                              {cards.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.bankName} {c.lastFourDigits !== 'CASH' ? `**** ${c.lastFourDigits}` : '(Tunai)'}
                                </option>
                              ))}
                            </select>
                            <label htmlFor={`dest-${p.id}`} className="input-label">Tujuan Pembayaran</label>
                          </div>
                          <button
                            onClick={() => handleNewPaymentSubmit(p.id)}
                            className="button-primary h-fit w-full sm:w-auto flex-shrink-0 !py-2.5"
                          >
                            Catat
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── ADD EXTRA CHARGE ─────────────────────────────── */}
                  <div className="mt-5">
                    <SectionTitle sub="Tambahkan biaya jika ada addons, overtime, dll.">
                      Tambah Biaya Tambahan
                    </SectionTitle>
                    <div className="bg-brand-surface rounded-2xl border border-brand-border p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="input-group flex-grow w-full !mt-0">
                          <input
                            type="text"
                            id={`charge-name-${p.id}`}
                            value={newCharge[p.id]?.name || ''}
                            onChange={e => handleNewChargeChange(p.id, 'name', e.target.value)}
                            className="input-field"
                            placeholder=" "
                          />
                          <label htmlFor={`charge-name-${p.id}`} className="input-label">Nama Biaya (misal: Overtime)</label>
                        </div>
                        <div className="input-group w-full sm:w-56 !mt-0">
                          <RupiahInput
                            id={`charge-amount-${p.id}`}
                            value={newCharge[p.id]?.amount || ''}
                            onChange={raw => handleNewChargeChange(p.id, 'amount', raw)}
                            className="input-field"
                            placeholder=" "
                          />
                          <label htmlFor={`charge-amount-${p.id}`} className="input-label">Jumlah Biaya</label>
                        </div>
                        <button
                          onClick={() => handleNewChargeSubmit(p.id)}
                          className="button-secondary h-fit w-full sm:w-auto flex-shrink-0 !py-2.5 !border-brand-accent !text-brand-accent hover:!bg-brand-accent/10"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailModal;
