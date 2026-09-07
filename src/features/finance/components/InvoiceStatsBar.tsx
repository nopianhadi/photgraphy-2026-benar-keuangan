import React from 'react';

interface InvoiceStats {
  totalInvoice: number;
  totalReceipt: number;
  totalInvoiceValue: number;
  totalPaid: number;
  totalUnpaid: number;
  lunas: number;
  pending: number;
  totalReceipts: number;
}

interface InvoiceStatsBarProps {
  stats: InvoiceStats;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  accent?: string; // tailwind text color class
  icon: React.ReactNode;
}> = ({ label, value, sub, accent = 'text-brand-text-primary', icon }) => (
  <div className="flex items-center gap-3 bg-brand-surface border border-brand-border rounded-2xl px-4 py-3.5 min-w-0 flex-1">
    <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary truncate">
        {label}
      </p>
      <p className={`text-lg font-black leading-tight ${accent} truncate`}>{value}</p>
      {sub && <p className="text-[10px] text-brand-text-secondary mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

// Icons (inline SVG untuk hindari import tambahan)
const FileTextIcon = () => (
  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ReceiptIcon = () => (
  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const InvoiceStatsBar: React.FC<InvoiceStatsBarProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Total Invoice"
        value={stats.totalInvoice}
        sub={`${stats.lunas} lunas · ${stats.pending} pending`}
        accent="text-blue-400"
        icon={<FileTextIcon />}
      />
      <StatCard
        label="Sudah Terbayar"
        value={formatCurrency(stats.totalPaid)}
        sub={`dari ${formatCurrency(stats.totalInvoiceValue)}`}
        accent="text-green-400"
        icon={<CheckCircleIcon />}
      />
      <StatCard
        label="Sisa Tagihan"
        value={formatCurrency(stats.totalUnpaid)}
        sub={`${stats.pending} invoice belum lunas`}
        accent="text-orange-400"
        icon={<ClockIcon />}
      />
      <StatCard
        label="Tanda Terima"
        value={stats.totalReceipt}
        sub={formatCurrency(stats.totalReceipts)}
        accent="text-purple-400"
        icon={<ReceiptIcon />}
      />
    </div>
  );
};

export default InvoiceStatsBar;
