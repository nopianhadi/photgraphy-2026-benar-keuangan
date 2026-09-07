import React, { useState } from 'react';
import {
  Client,
  Project,
  Transaction,
  Profile,
  Package,
  ViewType,
  NavigationAction,
} from '../../types';
import { useInvoices, InvoiceDoc } from '../../features/finance/hooks/useInvoices';
import InvoiceStatsBar from '../../features/finance/components/InvoiceStatsBar';
import InvoiceFilterBar from '../../features/finance/components/InvoiceFilterBar';
import InvoiceListTable from '../../features/finance/components/InvoiceListTable';
import ClientDocumentModal from '../../features/clients/components/ClientDocumentModal';
import ShareMessageModal from '../../features/communication/components/ShareMessageModal';
import Modal from '../../shared/ui/Modal';
import {
  useClientDocumentActions,
  DocumentToView,
} from '../../features/clients/hooks/useClientDocumentActions';
import { updateProject as updateProjectInDb } from '../../services/projects';
import { updateTransaction as updateTransactionInDb } from '../../services/transactions';

// ─── Props ────────────────────────────────────────────────────────────────

interface InvoicePageProps {
  clients: Client[];
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  packages: Package[];
  userProfile: Profile;
  showNotification: (msg: string) => void;
  handleNavigation: (view: ViewType, action?: NavigationAction) => void;
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────

const DeleteConfirmModal: React.FC<{
  doc: InvoiceDoc | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ doc, isDeleting, onConfirm, onCancel }) => (
  <Modal
    isOpen={!!doc}
    onClose={onCancel}
    title="Konfirmasi Hapus"
    size="sm"
  >
    <div className="space-y-4">
      <p className="text-sm text-brand-text-secondary">
        Yakin ingin menghapus{' '}
        <span className="font-bold text-brand-text-primary">
          {doc?.kind === 'invoice' ? 'invoice' : 'tanda terima'}
        </span>{' '}
        <span className="font-mono text-brand-accent">{doc?.number}</span> untuk klien{' '}
        <span className="font-bold text-brand-text-primary">{doc?.clientName}</span>?
      </p>
      {doc?.kind === 'invoice' && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          ⚠️ Menghapus invoice akan menghapus seluruh data proyek terkait secara permanen.
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="button-secondary px-4 py-2 text-sm"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
        >
          {isDeleting ? 'Menghapus...' : 'Hapus'}
        </button>
      </div>
    </div>
  </Modal>
);

// ─── Page ─────────────────────────────────────────────────────────────────

const InvoicePage: React.FC<InvoicePageProps> = ({
  clients,
  projects,
  setProjects,
  transactions,
  setTransactions,
  packages,
  userProfile,
  showNotification,
  handleNavigation,
}) => {
  // Share WA preview state
  const [sharePreview, setSharePreview] = useState<{
    title: string;
    message: string;
    phone?: string;
  } | null>(null);

  // DocumentToView maps to ClientDocumentModal's expected format
  const [documentToView, setDocumentToView] = useState<DocumentToView | null>(null);

  // Client for the currently viewed document
  const [clientForDetail, setClientForDetail] = useState<Client | null>(null);

  // ── Hook: invoice data ────────────────────────────────────────────────
  const {
    filteredDocs,
    stats,
    clientOptions,
    searchTerm,
    setSearchTerm,
    filterKind,
    setFilterKind,
    filterStatus,
    setFilterStatus,
    filterClientId,
    setFilterClientId,
    filterMonth,
    setFilterMonth,
    sortField,
    sortDir,
    handleSort,
    deleteConfirm,
    setDeleteConfirm,
    isDeleting,
    handleDeleteConfirm,
  } = useInvoices({
    projects,
    transactions,
    clients,
    showNotification,
    onDeleteProject: (projectId) =>
      setProjects((prev) => prev.filter((p) => p.id !== projectId)),
    onDeleteTransaction: (txId) =>
      setTransactions((prev) => prev.filter((t) => t.id !== txId)),
  });

  // ── Hook: document actions (PDF, WA, signature) ───────────────────────
  const {
    isSignatureModalOpen,
    setIsSignatureModalOpen,
    handleSaveSignature,
    handleShareDocumentWA,
    handleDownloadPDF,
  } = useClientDocumentActions({
    documentToView,
    clientForDetail,
    userProfile,
    projects,
    showNotification,
    onSignInvoice: async (projectId, signatureDataUrl) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, invoiceSignature: signatureDataUrl } : p)),
      );
      try {
        await updateProjectInDb(projectId, { invoiceSignature: signatureDataUrl } as any);
      } catch (e) {
        console.warn('[InvoicePage] Failed to persist invoice signature:', e);
      }
    },
    onSignTransaction: async (txId, signatureDataUrl) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, vendorSignature: signatureDataUrl } : t)),
      );
      try {
        await updateTransactionInDb(txId, { vendorSignature: signatureDataUrl } as any);
      } catch (e) {
        console.warn('[InvoicePage] Failed to persist transaction signature:', e);
      }
    },
    setSharePreview,
  });

  // ── Open document preview ─────────────────────────────────────────────
  const handleViewDoc = (doc: InvoiceDoc) => {
    const client = doc.client ?? null;
    setClientForDetail(client);

    if (doc.kind === 'invoice' && doc.project) {
      setDocumentToView({ type: 'invoice', project: doc.project });
    } else if (doc.kind === 'receipt' && doc.transaction) {
      setDocumentToView({ type: 'receipt', transaction: doc.transaction });
    }
  };

  // ── Navigate to edit ──────────────────────────────────────────────────
  const handleEditDocument = () => {
    if (!documentToView) return;
    setDocumentToView(null);
    if (documentToView.type === 'invoice') {
      handleNavigation(ViewType.CLIENTS, {
        type: 'openClientDetail',
        id: documentToView.project.clientId,
        tab: 'invoice',
      });
    } else {
      handleNavigation(ViewType.FINANCE, { type: 'openTransaction', id: documentToView.transaction.id });
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-bg">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-brand-text-primary tracking-tight">
              Daftar Invoice
            </h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              {filteredDocs.length} dokumen ditemukan
            </p>
          </div>
          <button
            onClick={() =>
              handleNavigation(ViewType.CLIENTS, { type: 'openAddClientModal' })
            }
            className="btn-box-add flex items-center gap-2 px-4 py-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Invoice Baru</span>
          </button>
        </div>
      </div>

      {/* ── Page Body ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <InvoiceStatsBar stats={stats} />

        {/* Filters */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-4">
          <InvoiceFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterKind={filterKind}
            onFilterKindChange={setFilterKind}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterClientId={filterClientId}
            onFilterClientChange={setFilterClientId}
            filterMonth={filterMonth}
            onFilterMonthChange={setFilterMonth}
            clientOptions={clientOptions}
          />
        </div>

        {/* Table */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <InvoiceListTable
            docs={filteredDocs}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            onView={handleViewDoc}
            onDelete={setDeleteConfirm}
          />
        </div>
      </div>

      {/* ── Document Preview Modal ──────────────────────────────────── */}
      <ClientDocumentModal
        documentToView={documentToView}
        onClose={() => setDocumentToView(null)}
        clientForDetail={clientForDetail}
        userProfile={userProfile}
        packages={packages}
        projects={projects}
        isSignatureModalOpen={isSignatureModalOpen}
        setIsSignatureModalOpen={setIsSignatureModalOpen}
        onSaveSignature={handleSaveSignature}
        onEditDocument={handleEditDocument}
        onDownloadPDF={handleDownloadPDF}
        onShareDocumentWA={handleShareDocumentWA}
      />

      {/* ── Share WA Modal ──────────────────────────────────────────── */}
      {sharePreview && (
        <ShareMessageModal
          isOpen={!!sharePreview}
          onClose={() => setSharePreview(null)}
          title={sharePreview.title}
          initialMessage={sharePreview.message}
          phone={sharePreview.phone}
          showNotification={showNotification}
        />
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────── */}
      <DeleteConfirmModal
        doc={deleteConfirm}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default InvoicePage;
