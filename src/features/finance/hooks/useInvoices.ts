import { useMemo, useState, useCallback } from 'react';
import { Client, Project, Transaction, TransactionType, PaymentStatus } from '../../../types';
import { deleteProject } from '../../../services/projects';
import { deleteTransaction } from '../../../services/transactions';

// ─── Unified document types ────────────────────────────────────────────────

export type InvoiceDocKind = 'invoice' | 'receipt';

export interface InvoiceDoc {
  id: string;               // project.id for invoice, transaction.id for receipt
  kind: InvoiceDocKind;
  number: string;           // display number e.g. "INV-XXXXXXXX"
  clientName: string;
  date: string;             // ISO date string
  amount: number;
  paidAmount: number;
  paymentStatus: string;    // 'Lunas' | 'DP Terbayar' | 'Belum Bayar' | 'Pemasukan'
  method?: string;          // only for receipts
  category?: string;        // only for receipts
  projectName?: string;
  projectId?: string;
  // raw data for modals
  project?: Project;
  transaction?: Transaction;
  client?: Client;
}

export type FilterKind = 'semua' | 'invoice' | 'receipt';
export type SortField = 'date' | 'amount' | 'clientName' | 'number';
export type SortDir = 'asc' | 'desc';

// ─── Hook ──────────────────────────────────────────────────────────────────

export interface UseInvoicesParams {
  projects: Project[];
  transactions: Transaction[];
  clients: Client[];
  showNotification: (msg: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

export function useInvoices({
  projects,
  transactions,
  clients,
  showNotification,
  onDeleteProject,
  onDeleteTransaction,
}: UseInvoicesParams) {
  // ── Filter & sort state ──────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKind, setFilterKind] = useState<FilterKind>('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterClientId, setFilterClientId] = useState('semua');
  const [filterMonth, setFilterMonth] = useState('');       // 'YYYY-MM' format
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ── UI state ─────────────────────────────────────────────────────────────
  const [selectedDoc, setSelectedDoc] = useState<InvoiceDoc | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<InvoiceDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Client lookup map ─────────────────────────────────────────────────────
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  // ── Project lookup map ────────────────────────────────────────────────────
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // ── Build unified list ────────────────────────────────────────────────────
  const allDocs = useMemo((): InvoiceDoc[] => {
    const docs: InvoiceDoc[] = [];

    // 1. Invoice docs — one per project
    projects.forEach((proj) => {
      const client = proj.clientId ? clientMap.get(proj.clientId) : undefined;
      docs.push({
        id: proj.id,
        kind: 'invoice',
        number: `INV-${proj.id.slice(-8).toUpperCase()}`,
        clientName: proj.clientName,
        date: proj.date || proj.createdAt || '',
        amount: proj.totalCost,
        paidAmount: proj.amountPaid || 0,
        paymentStatus: proj.paymentStatus || PaymentStatus.BELUM_BAYAR,
        projectName: proj.projectName,
        projectId: proj.id,
        project: proj,
        client,
      });
    });

    // 2. Receipt docs — transactions with type INCOME that have a projectId
    transactions
      .filter((tx) => tx.type === TransactionType.INCOME)
      .forEach((tx) => {
        const project = tx.projectId ? projectMap.get(tx.projectId) : undefined;
        const client = project?.clientId ? clientMap.get(project.clientId) : undefined;
        docs.push({
          id: tx.id,
          kind: 'receipt',
          number: `RCP-${tx.id.slice(0, 8).toUpperCase()}`,
          clientName: client?.name || project?.clientName || tx.description.slice(0, 30),
          date: tx.date,
          amount: tx.amount,
          paidAmount: tx.amount,
          paymentStatus: 'Pemasukan',
          method: tx.method,
          category: tx.category,
          projectName: project?.projectName,
          projectId: tx.projectId,
          project,
          transaction: tx,
          client,
        });
      });

    return docs;
  }, [projects, transactions, clientMap, projectMap]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const invoiceDocs = allDocs.filter((d) => d.kind === 'invoice');
    const receiptDocs = allDocs.filter((d) => d.kind === 'receipt');

    const totalInvoiceValue = invoiceDocs.reduce((s, d) => s + d.amount, 0);
    const totalPaid = invoiceDocs.reduce((s, d) => s + d.paidAmount, 0);
    const totalUnpaid = invoiceDocs.reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    const lunas = invoiceDocs.filter((d) => d.paymentStatus === PaymentStatus.LUNAS).length;
    const pending = invoiceDocs.filter((d) => d.paymentStatus !== PaymentStatus.LUNAS).length;
    const totalReceipts = receiptDocs.reduce((s, d) => s + d.amount, 0);

    return {
      totalInvoice: invoiceDocs.length,
      totalReceipt: receiptDocs.length,
      totalInvoiceValue,
      totalPaid,
      totalUnpaid,
      lunas,
      pending,
      totalReceipts,
    };
  }, [allDocs]);

  // ── Available client options for filter ───────────────────────────────────
  const clientOptions = useMemo(() => {
    const seen = new Map<string, string>();
    allDocs.forEach((d) => {
      if (d.client) {
        seen.set(d.client.id, d.client.name);
      } else if (d.clientName) {
        seen.set(d.clientName, d.clientName);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [allDocs]);

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    let result = allDocs;

    // Kind filter
    if (filterKind !== 'semua') {
      result = result.filter((d) => d.kind === filterKind);
    }

    // Status filter
    if (filterStatus !== 'semua') {
      result = result.filter((d) => d.paymentStatus === filterStatus);
    }

    // Client filter
    if (filterClientId !== 'semua') {
      result = result.filter(
        (d) => d.client?.id === filterClientId || d.clientName === filterClientId,
      );
    }

    // Month filter ('YYYY-MM')
    if (filterMonth) {
      result = result.filter((d) => d.date && d.date.startsWith(filterMonth));
    }

    // Search (number, client name, project name)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.number.toLowerCase().includes(q) ||
          d.clientName.toLowerCase().includes(q) ||
          (d.projectName || '').toLowerCase().includes(q),
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        cmp = a.amount - b.amount;
      } else if (sortField === 'clientName') {
        cmp = a.clientName.localeCompare(b.clientName);
      } else if (sortField === 'number') {
        cmp = a.number.localeCompare(b.number);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [allDocs, filterKind, filterStatus, filterClientId, filterMonth, searchTerm, sortField, sortDir]);

  // ── Sorting toggle ────────────────────────────────────────────────────────
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('desc');
      }
    },
    [sortField],
  );

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      if (deleteConfirm.kind === 'invoice') {
        await deleteProject(deleteConfirm.id);
        onDeleteProject?.(deleteConfirm.id);
        showNotification('Invoice (proyek) berhasil dihapus.');
      } else {
        await deleteTransaction(deleteConfirm.id);
        onDeleteTransaction?.(deleteConfirm.id);
        showNotification('Tanda terima berhasil dihapus.');
      }
    } catch (err) {
      console.error('[useInvoices] delete error', err);
      showNotification('Gagal menghapus dokumen. Coba lagi.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, onDeleteProject, onDeleteTransaction, showNotification]);

  return {
    // data
    allDocs,
    filteredDocs,
    stats,
    clientOptions,
    // filter state
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
    // sort state
    sortField,
    sortDir,
    handleSort,
    // UI state
    selectedDoc,
    setSelectedDoc,
    deleteConfirm,
    setDeleteConfirm,
    isDeleting,
    handleDeleteConfirm,
  };
}
