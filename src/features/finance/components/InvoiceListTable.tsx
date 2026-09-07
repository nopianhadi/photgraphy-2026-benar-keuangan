import React from 'react';
import { InvoiceDoc, SortField, SortDir } from '../hooks/useInvoices';

// ─── Helpers ──────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ─── Status badge ─────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, string> = {
    Lunas: 'bg-green-500/15 text-green-400 border-green-500/30',
    'DP Terbayar': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Belum Bayar': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Pemasukan: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };
  const cls = cfg[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {status}
    </span>
  );
};

// ─── Kind badge ───────────────────────────────────────────────────────────

const KindBadge: React.FC<{ kind: 'invoice' | 'receipt' }> = ({ kind }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      kind === 'invoice'
        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
        : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    }`}
  >
    {kind === 'invoice' ? 'Invoice' : 'Tanda Terima'}
  </span>
);

// ─── Sort icon ────────────────────────────────────────────────────────────

const SortIcon: React.FC<{ field: SortField; current: SortField; dir: SortDir }> = ({
  field,
  current,
  dir,
}) => {
  if (field !== current) {
    return (
      <svg className="w-3 h-3 text-brand-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return dir === 'asc' ? (
    <svg className="w-3 h-3 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-3 h-3 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
};

// ─── Action buttons ───────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────

interface InvoiceListTableProps {
  docs: InvoiceDoc[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onView: (doc: InvoiceDoc) => void;
  onDelete: (doc: InvoiceDoc) => void;
}

// ─── Sortable TH ─────────────────────────────────────────────────────────

const Th: React.FC<{
  label: string;
  field?: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}> = ({ label, field, sortField, sortDir, onSort, className = '' }) => (
  <th
    className={`px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-brand-text-secondary whitespace-nowrap ${
      field ? 'cursor-pointer select-none hover:text-brand-text-primary transition-colors' : ''
    } ${className}`}
    onClick={() => field && onSort(field)}
  >
    <span className="inline-flex items-center gap-1">
      {label}
      {field && <SortIcon field={field} current={sortField} dir={sortDir} />}
    </span>
  </th>
);

// ─── Main Component ───────────────────────────────────────────────────────

const InvoiceListTable: React.FC<InvoiceListTableProps> = ({
  docs,
  sortField,
  sortDir,
  onSort,
  onView,
  onDelete,
}) => {
  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="w-14 h-14 text-brand-text-secondary/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-brand-text-secondary font-medium">Tidak ada dokumen ditemukan</p>
        <p className="text-xs text-brand-text-secondary/60 mt-1">Coba ubah filter atau kata kunci pencarian</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile card list ───────────────────────────────────────────── */}
      <div className="md:hidden divide-y divide-brand-border">
        {docs.map((doc) => (
          <div key={`${doc.kind}-${doc.id}`} className="p-3 hover:bg-brand-bg/40 transition-colors">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <KindBadge kind={doc.kind} />
                  <span className="text-[11px] font-mono text-brand-text-secondary">{doc.number}</span>
                </div>
                <p className="text-sm font-bold text-brand-text-primary truncate">{doc.clientName}</p>
                {doc.projectName && (
                  <p className="text-xs text-brand-text-secondary truncate">{doc.projectName}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-brand-text-primary">{formatCurrency(doc.amount)}</p>
                <StatusBadge status={doc.paymentStatus} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-brand-text-secondary">{formatDate(doc.date)}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onView(doc)}
                  className="p-1.5 rounded-lg text-brand-text-secondary hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  title="Lihat dokumen"
                >
                  <EyeIcon />
                </button>
                <button
                  onClick={() => onDelete(doc)}
                  className="p-1.5 rounded-lg text-brand-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Hapus dokumen"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table ──────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-brand-bg/60 border-b border-brand-border">
            <tr>
              <Th label="No. Dokumen" field="number" sortField={sortField} sortDir={sortDir} onSort={onSort} />
              <Th label="Jenis" sortField={sortField} sortDir={sortDir} onSort={onSort} />
              <Th label="Klien" field="clientName" sortField={sortField} sortDir={sortDir} onSort={onSort} />
              <Th label="Proyek" sortField={sortField} sortDir={sortDir} onSort={onSort} className="hidden lg:table-cell" />
              <Th label="Tanggal" field="date" sortField={sortField} sortDir={sortDir} onSort={onSort} />
              <Th label="Jumlah" field="amount" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right" />
              <Th label="Status" sortField={sortField} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider text-brand-text-secondary">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/50">
            {docs.map((doc, idx) => (
              <tr
                key={`${doc.kind}-${doc.id}`}
                className={`hover:bg-brand-bg/40 transition-colors ${
                  idx % 2 === 0 ? 'bg-brand-surface' : 'bg-brand-bg/20'
                }`}
              >
                {/* Number */}
                <td className="px-4 py-3">
                  <span className="text-xs font-mono font-bold text-brand-text-primary">{doc.number}</span>
                </td>

                {/* Kind */}
                <td className="px-4 py-3">
                  <KindBadge kind={doc.kind} />
                </td>

                {/* Client */}
                <td className="px-4 py-3">
                  <p className="font-semibold text-brand-text-primary max-w-[180px] truncate">{doc.clientName}</p>
                </td>

                {/* Project */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  <p className="text-brand-text-secondary text-xs max-w-[180px] truncate">
                    {doc.projectName || '—'}
                  </p>
                </td>

                {/* Date */}
                <td className="px-4 py-3 whitespace-nowrap text-brand-text-secondary text-xs">
                  {formatDate(doc.date)}
                </td>

                {/* Amount */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span className="font-bold text-brand-text-primary">{formatCurrency(doc.amount)}</span>
                  {doc.kind === 'invoice' && doc.paidAmount < doc.amount && (
                    <p className="text-[10px] text-orange-400 mt-0.5">
                      Sisa {formatCurrency(doc.amount - doc.paidAmount)}
                    </p>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge status={doc.paymentStatus} />
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(doc)}
                      className="p-1.5 rounded-lg text-brand-text-secondary hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      title="Lihat dokumen"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-1.5 rounded-lg text-brand-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Hapus dokumen"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InvoiceListTable;
