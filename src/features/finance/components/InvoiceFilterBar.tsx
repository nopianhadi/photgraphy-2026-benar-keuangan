import React from 'react';
import { FilterKind } from '../hooks/useInvoices';

interface ClientOption {
  id: string;
  name: string;
}

interface InvoiceFilterBarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterKind: FilterKind;
  onFilterKindChange: (v: FilterKind) => void;
  filterStatus: string;
  onFilterStatusChange: (v: string) => void;
  filterClientId: string;
  onFilterClientChange: (v: string) => void;
  filterMonth: string;
  onFilterMonthChange: (v: string) => void;
  clientOptions: ClientOption[];
}

const SearchIcon = () => (
  <svg className="w-4 h-4 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const KIND_TABS: { value: FilterKind; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Tanda Terima' },
];

const STATUS_OPTIONS = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'Lunas', label: 'Lunas' },
  { value: 'DP Terbayar', label: 'DP Terbayar' },
  { value: 'Belum Bayar', label: 'Belum Bayar' },
  { value: 'Pemasukan', label: 'Pemasukan' },
];

const InvoiceFilterBar: React.FC<InvoiceFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filterKind,
  onFilterKindChange,
  filterStatus,
  onFilterStatusChange,
  filterClientId,
  onFilterClientChange,
  filterMonth,
  onFilterMonthChange,
  clientOptions,
}) => {
  return (
    <div className="space-y-3">
      {/* Kind tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-brand-bg/80 rounded-xl border border-brand-border/60 w-fit">
        {KIND_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onFilterKindChange(tab.value)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterKind === tab.value
                ? 'bg-brand-accent text-white shadow-sm'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + filters row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nomor, nama klien, atau proyek..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/60 transition-all"
          />
        </div>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all min-w-[150px]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Client */}
        <select
          value={filterClientId}
          onChange={(e) => onFilterClientChange(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all min-w-[150px]"
        >
          <option value="semua">Semua Klien</option>
          {clientOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Month */}
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => onFilterMonthChange(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all min-w-[150px]"
        />
      </div>
    </div>
  );
};

export default InvoiceFilterBar;
