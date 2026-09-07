import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Project, PaymentStatus, TeamMember, Client, Profile,
  Package, Transaction, TeamProjectPayment, Card, AssignedTeamMember,
} from '../../../types';
import {
  ClipboardListIcon, CheckCircleIcon, FileTextIcon, SendIcon,
  PencilIcon, Trash2Icon, UserIcon, PlusIcon, Share2Icon, ArrowDownIcon,
  X as XIcon, Save as SaveIcon,
} from 'lucide-react';
import {
  listChecklistByProject, deleteChecklistItem,
  initializeDefaultChecklist, setChecklistItemCompleted, updateChecklistItemFields,
  renameChecklistCategory, deleteChecklistItemsByProjectAndCategory,
} from '../../../services/weddingDayChecklist';
import { updateProject as updateProjectInDb } from '../../../services/projects';
import supabase from '../../../lib/supabaseClient';
import { formatCurrency, getStatusClass, getProgressForStatus } from '../utils/projectHelpers';
import { EditFormData } from '../hooks/useProjectEditMode';

export interface ProjectDetailModalProps {
  selectedProject: Project | null;
  setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>>;
  teamMembers: TeamMember[];
  clients: Client[];
  profile: Profile;
  showNotification: (message: string) => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onClose: () => void;
  /** @deprecated tombol edit sekarang inline — prop ini dipertahankan agar kode lain tidak error */
  handleOpenForm: (mode: 'edit', project: Project) => void;
  handleProjectDelete: (projectId: string) => void;
  handleOpenBriefingModal: () => void;
  packages: Package[];
  transactions: Transaction[];
  teamProjectPayments: TeamProjectPayment[];
  cards: Card[];
  onOpenSharePreview: (data: { title: string; message: string; phone?: string | null }) => void;
  // ── Edit mode props (injected from ProjectsPage via useProjectEditMode) ──
  isEditing: boolean;
  isSaving: boolean;
  editFormData: EditFormData | null;
  editTeamByCategory: Record<string, Record<string, TeamMember[]>>;
  onEnterEditMode: (project: Project) => void;
  onCancelEditMode: () => void;
  onEditFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onEditTeamChange: (member: TeamMember) => void;
  onEditTeamFeeChange: (memberId: string, fee: number) => void;
  onEditTeamSubJobChange: (memberId: string, subJob: string) => void;
  onEditReplaceTeamMember: (oldMemberId: string, newMember: TeamMember) => void;
  onSaveEdit: () => void;
}

// ─── Reusable atoms ──────────────────────────────────────────────────────────

const InfoField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary">{label}</span>
    <span className="text-sm font-semibold text-brand-text-light">{children || <span className="opacity-30">—</span>}</span>
  </div>
);

const SectionCard: React.FC<{
  title: string;
  sub?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, sub, action, children, className = '' }) => (
  <div className={`bg-brand-surface rounded-2xl border border-brand-border overflow-hidden shadow-sm ${className}`}>
    <div className="px-4 py-3 bg-brand-bg/60 border-b border-brand-border flex items-center gap-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary flex-1">{title}</p>
      {sub && <p className="text-[10px] text-brand-text-secondary/60">{sub}</p>}
      {action}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// Shared input / label classes for edit mode
const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-transparent transition-all';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary mb-1.5';

// ─── Main component ──────────────────────────────────────────────────────────

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  selectedProject, setSelectedProject, teamMembers, clients, profile,
  showNotification, setProjects, onClose,
  handleProjectDelete, handleOpenBriefingModal, packages, transactions,
  teamProjectPayments, cards, onOpenSharePreview,
  // edit mode
  isEditing, isSaving, editFormData, editTeamByCategory,
  onEnterEditMode, onCancelEditMode,
  onEditFormChange, onEditTeamChange, onEditTeamFeeChange,
  onEditTeamSubJobChange, onEditReplaceTeamMember, onSaveEdit,
}) => {
  const [detailTab, setDetailTab] = useState<'details' | 'checklist' | 'files'>('details');
  const [isEditingFinalLink, setIsEditingFinalLink] = useState(false);
  const [tempFinalLink, setTempFinalLink] = useState('');
  const [editingChecklistNotesId, setEditingChecklistNotesId] = useState<string | null>(null);
  const [checklistNotesDraft, setChecklistNotesDraft] = useState('');
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<string | null>(null);
  const [checklistItemNameDraft, setChecklistItemNameDraft] = useState('');
  const [picDraft, setPicDraft] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [categoryNameDraft, setCategoryNameDraft] = useState('');
  const [isInitializingChecklist, setIsInitializingChecklist] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // ── paidMemberIds — for edit form fee lock ────────────────────────────────
  const paidMemberIdsForProject = useMemo(() => {
    const projectId = selectedProject?.id;
    if (!projectId) return new Set<string>();
    return new Set(
      teamProjectPayments.filter(p => p.projectId === projectId && p.status === 'Paid').map(p => p.teamMemberId),
    );
  }, [teamProjectPayments, selectedProject?.id]);

  // ── team by category — for VIEW mode ─────────────────────────────────────
  const teamByCategory = useMemo(() => {
    if (!selectedProject?.team) return { Tim: {}, Vendor: {} };
    return selectedProject.team.reduce(
      (acc, member) => {
        const orig = teamMembers.find(m => m.id === member.memberId);
        const cat = orig?.category || 'Tim';
        if (!acc[cat]) acc[cat] = {};
        if (!acc[cat][member.role]) acc[cat][member.role] = [];
        acc[cat][member.role].push(member);
        return acc;
      },
      { Tim: {}, Vendor: {} } as Record<string, Record<string, AssignedTeamMember[]>>,
    );
  }, [selectedProject?.team, teamMembers]);

  // ── reset checklist state on project change ───────────────────────────────
  useEffect(() => {
    setEditingChecklistItemId(null);
    setChecklistItemNameDraft('');
    setPicDraft('');
    setEditingChecklistNotesId(null);
    setChecklistNotesDraft('');
    setEditingCategoryName(null);
    setCategoryNameDraft('');
    setActiveCategory(null);
  }, [selectedProject?.id]);

  // ── real-time checklist sync ──────────────────────────────────────────────
  useEffect(() => {
    const projectId = selectedProject?.id;
    if (!projectId || detailTab !== 'checklist') return;

    (async () => {
      try {
        const items = await listChecklistByProject(projectId);
        setSelectedProject(prev => {
          if (!prev || prev.id !== projectId) return prev;
          const updated = { ...prev, weddingDayChecklist: items };
          setProjects(all => all.map(p => (p.id === projectId ? updated : p)));
          return updated;
        });
      } catch (e) {
        console.error('Failed to load checklist:', e);
      }
    })();

    const channel = supabase
      .channel(`admin:wedding_day_checklists:project_id=eq.${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wedding_day_checklists', filter: `project_id=eq.${projectId}` },
        payload => {
          setSelectedProject(prev => {
            if (!prev || prev.id !== projectId) return prev;
            const cur = prev.weddingDayChecklist || [];
            let next = [...cur];
            if (payload.eventType === 'INSERT') {
              const n = payload.new as any;
              const item = { id: n.id, projectId: n.project_id, category: n.category, itemName: n.item_name, isCompleted: n.is_completed, assignedTo: n.assigned_to, notes: n.notes, createdAt: n.created_at, updatedAt: n.updated_at };
              if (!next.some(i => i.id === item.id)) next.push(item);
            } else if (payload.eventType === 'UPDATE') {
              const n = payload.new as any;
              const item = { id: n.id, projectId: n.project_id, category: n.category, itemName: n.item_name, isCompleted: n.is_completed, assignedTo: n.assigned_to, notes: n.notes, createdAt: n.created_at, updatedAt: n.updated_at };
              next = next.map(i => (i.id === item.id ? item : i));
            } else if (payload.eventType === 'DELETE') {
              next = next.filter(i => i.id !== (payload.old as any).id);
            }
            if (JSON.stringify(next) === JSON.stringify(cur)) return prev;
            const updated = { ...prev, weddingDayChecklist: next };
            setProjects(all => all.map(p => (p.id === projectId ? updated : p)));
            return updated;
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [detailTab, selectedProject?.id, setProjects]);

  // ── handlers (view mode) ─────────────────────────────────────────────────

  const formatDateFull = (d: string) =>
    d ? new Date(d).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedProject) return;
    const nextProgress = getProgressForStatus(newStatus, profile.projectStatusConfig);
    const statusConfig = profile.projectStatusConfig.find(s => s.name === newStatus);
    try {
      const updated = { ...selectedProject, status: newStatus, progress: nextProgress, activeSubStatuses: [], customSubStatuses: statusConfig?.subStatuses || [] } as Project;
      await updateProjectInDb(selectedProject.id, { status: newStatus as any, progress: nextProgress as any, activeSubStatuses: [] as any, customSubStatuses: (statusConfig?.subStatuses || []) as any } as any);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
      setSelectedProject(updated);
      showNotification(`Status diubah ke "${newStatus}"`);
    } catch {
      showNotification('Gagal memperbarui status. Coba lagi.');
    }
  };

  const handleSubStatusToggle = async (subName: string, checked: boolean) => {
    if (!selectedProject) return;
    const nextActive = checked
      ? [...(selectedProject.activeSubStatuses || []), subName]
      : (selectedProject.activeSubStatuses || []).filter(s => s !== subName);
    try {
      const updated = { ...selectedProject, activeSubStatuses: nextActive };
      await updateProjectInDb(selectedProject.id, { activeSubStatuses: nextActive as any } as any);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
      setSelectedProject(updated);
    } catch {
      showNotification('Gagal memperbarui tahapan.');
    }
  };

  const handleSaveFinalLink = async () => {
    if (!selectedProject) return;
    try {
      const updated = { ...selectedProject, finalDriveLink: tempFinalLink };
      await updateProjectInDb(selectedProject.id, { finalDriveLink: tempFinalLink } as any);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
      setSelectedProject(updated);
      setIsEditingFinalLink(false);
      showNotification('Link File Jadi berhasil diperbarui.');
    } catch {
      showNotification('Gagal memperbarui link.');
    }
  };

  const handleSendFinalLink = () => {
    if (!selectedProject?.finalDriveLink) { showNotification('Link File Jadi belum tersedia.'); return; }
    const client = clients.find(c => c.id === selectedProject.clientId);
    const phone = client?.whatsapp || client?.phone;
    if (!phone) { showNotification('Nomor WhatsApp pengantin tidak ditemukan.'); return; }
    const template =
      profile.chatTemplates?.find(t => t.title.toLowerCase().includes('link'))?.template ||
      `Halo Kak {clientName},\n\nTerima kasih telah mempercayakan acara {projectName} kepada kami.\nBerikut link file hasil dokumentasi:\n{finalDriveLink}\n\nSemoga suka!`;
    const message = template
      .replace(/{clientName}/g, selectedProject.clientName)
      .replace(/{projectName}/g, selectedProject.projectName)
      .replace(/{finalDriveLink}/g, selectedProject.finalDriveLink);
    onOpenSharePreview({ title: `Bagikan Link File Jadi — ${selectedProject.projectName}`, message, phone });
  };

  const handleToggleChecklistItem = async (itemId: string, current: boolean) => {
    if (!selectedProject) return;
    try {
      const row = await setChecklistItemCompleted(itemId, !current);
      const items = selectedProject.weddingDayChecklist?.map(i => (i.id === itemId ? { ...i, isCompleted: row.isCompleted, updatedAt: row.updatedAt } : i)) || [];
      const updated = { ...selectedProject, weddingDayChecklist: items };
      setSelectedProject(updated);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
    } catch {
      showNotification('Gagal memperbarui checklist.');
    }
  };

  const handleSaveChecklistNotes = async () => {
    if (!selectedProject || !editingChecklistNotesId) return;
    try {
      const row = await updateChecklistItemFields(editingChecklistNotesId, { notes: checklistNotesDraft });
      const items = selectedProject.weddingDayChecklist?.map(i => (i.id === editingChecklistNotesId ? { ...i, notes: row.notes, updatedAt: row.updatedAt } : i)) || [];
      const updated = { ...selectedProject, weddingDayChecklist: items };
      setSelectedProject(updated);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
      setEditingChecklistNotesId(null);
      setChecklistNotesDraft('');
    } catch {
      showNotification('Gagal menyimpan catatan.');
    }
  };

  const handleSaveItemEdits = async () => {
    if (!selectedProject || !editingChecklistItemId) return;
    try {
      const row = await updateChecklistItemFields(editingChecklistItemId, { itemName: checklistItemNameDraft, assignedTo: picDraft });
      const items = selectedProject.weddingDayChecklist?.map(i => (i.id === editingChecklistItemId ? { ...i, itemName: row.itemName, assignedTo: row.assignedTo, updatedAt: row.updatedAt } : i)) || [];
      const updated = { ...selectedProject, weddingDayChecklist: items };
      setSelectedProject(updated);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
      setEditingChecklistItemId(null);
      setChecklistItemNameDraft('');
      setPicDraft('');
    } catch {
      showNotification('Gagal menyimpan item.');
    }
  };

  const handleAddChecklistItem = async (category: string, itemName: string) => {
    if (!selectedProject) return;
    try {
      const { upsertChecklistItems } = await import('../../../services/weddingDayChecklist');
      const [row] = await upsertChecklistItems([{ projectId: selectedProject.id, category, itemName, isCompleted: false }]);
      const items = [...(selectedProject.weddingDayChecklist || []), row];
      const updated = { ...selectedProject, weddingDayChecklist: items };
      setSelectedProject(updated);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
    } catch {
      showNotification('Gagal menambah item.');
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!selectedProject) return;
    try {
      await deleteChecklistItem(itemId);
      const items = selectedProject.weddingDayChecklist?.filter(i => i.id !== itemId) || [];
      const updated = { ...selectedProject, weddingDayChecklist: items };
      setSelectedProject(updated);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
    } catch {
      showNotification('Gagal menghapus item.');
    }
  };

  const handleSaveCategoryName = async () => {
    if (!selectedProject || !editingCategoryName) return;
    const newName = categoryNameDraft.trim();
    if (!newName) { showNotification('Nama kategori tidak boleh kosong.'); return; }
    if (newName === editingCategoryName) { setEditingCategoryName(null); setCategoryNameDraft(''); return; }
    try {
      await renameChecklistCategory(selectedProject.id, editingCategoryName, newName);
      const refreshed = await listChecklistByProject(selectedProject.id);
      const updated = { ...selectedProject, weddingDayChecklist: refreshed };
      setSelectedProject(updated);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
      setEditingCategoryName(null);
      setCategoryNameDraft('');
      showNotification('Kategori berhasil diubah.');
    } catch {
      showNotification('Gagal mengubah nama kategori.');
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!selectedProject) return;
    const catItems = selectedProject.weddingDayChecklist?.filter(i => i.category === category) || [];
    if (!catItems.length) return;
    if (!window.confirm(`Hapus kategori "${category}" beserta ${catItems.length} item di dalamnya?`)) return;
    try {
      await deleteChecklistItemsByProjectAndCategory(selectedProject.id, category);
      const refreshed = await listChecklistByProject(selectedProject.id);
      const updated = { ...selectedProject, weddingDayChecklist: refreshed };
      setSelectedProject(updated);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
      showNotification('Kategori berhasil dihapus.');
    } catch {
      showNotification('Gagal menghapus kategori.');
    }
  };

  const handleInitializeChecklist = async () => {
    if (!selectedProject || isInitializingChecklist) return;
    setIsInitializingChecklist(true);
    try {
      const custom = profile.checklistTemplates?.length ? profile.checklistTemplates : undefined;
      const result = await initializeDefaultChecklist(selectedProject.id, custom);
      const updated = { ...selectedProject, weddingDayChecklist: result };
      setSelectedProject(updated);
      setProjects(prev => prev.map(p => (p.id === selectedProject.id ? updated : p)));
      showNotification('Checklist Hari H berhasil dibuat.');
    } catch {
      showNotification('Gagal membuat checklist default.');
    } finally {
      setIsInitializingChecklist(false);
    }
  };

  const handleShareChecklist = () => {
    if (!selectedProject) return;
    const byCat = (selectedProject.weddingDayChecklist || []).reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    let message = `*REKAP CHECKLIST HARI H — ${selectedProject.projectName}*\n\n`;
    Object.entries(byCat).forEach(([cat, items]) => {
      message += `*${cat}:*\n`;
      items.forEach(i => { message += `${i.isCompleted ? '✅' : '⬜'} ${i.itemName}\n`; });
      message += '\n';
    });
    onOpenSharePreview({ title: `Bagikan Rekap Checklist — ${selectedProject.projectName}`, message, phone: null });
  };

  const handleShareChecklistPortal = () => {
    if (!selectedProject) return;
    const link = `${window.location.origin}/#/checklist-portal/${selectedProject.id}`;
    onOpenSharePreview({ title: `Portal Checklist — ${selectedProject.projectName}`, message: `Portal Checklist Hari H — ${selectedProject.projectName}\n\n${link}`, phone: null });
  };

  // ── guard ─────────────────────────────────────────────────────────────────
  if (!selectedProject) return null;

  // ── derived data ──────────────────────────────────────────────────────────
  const allSubStatuses =
    selectedProject.customSubStatuses ||
    profile.projectStatusConfig.find(s => s.name === selectedProject.status)?.subStatuses ||
    [];

  const pkg = packages.find(p => p.id === selectedProject.packageId) ?? null;
  const totalPaid = selectedProject.amountPaid || 0;
  const paidPct = selectedProject.totalCost > 0 ? Math.min(100, Math.round((totalPaid / selectedProject.totalCost) * 100)) : 0;

  const tabs = [
    { key: 'details'   as const, label: 'Detail',    icon: <ClipboardListIcon className="w-4 h-4" /> },
    { key: 'checklist' as const, label: 'Checklist', icon: <CheckCircleIcon   className="w-4 h-4" /> },
    { key: 'files'     as const, label: 'File',      icon: <FileTextIcon      className="w-4 h-4" /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full -mt-1">

      {/* ══════════════════════════════════════════════════════════════════
          HERO HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-500 shadow-lg shadow-purple-500/25">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="text-2xl select-none">💍</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-200/80 mb-0.5">
                Detail Acara Pernikahan
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{selectedProject.projectName}</h2>
              <p className="text-sm text-purple-100/80 mt-0.5 font-medium">{selectedProject.clientName}</p>

              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
                  {selectedProject.status}
                </span>
                {selectedProject.paymentStatus && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold text-white">
                    {selectedProject.paymentStatus === PaymentStatus.LUNAS ? '✅' : selectedProject.paymentStatus === PaymentStatus.DP_TERBAYAR ? '🔵' : '🔴'}{' '}
                    {selectedProject.paymentStatus}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-semibold text-white">
                  📅 {new Date(selectedProject.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Quick actions */}
            {!isEditing ? (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onEnterEditMode(selectedProject)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all active:scale-90"
                  title="Edit Acara"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Acara</span>
                </button>
                <button
                  onClick={handleOpenBriefingModal}
                  className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                  title="Briefing Tim"
                >
                  <Share2Icon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
                  <PencilIcon className="w-3.5 h-3.5" />
                  Mode Edit
                </span>
              </div>
            )}
          </div>

          {/* Finance strip */}
          <div className="mt-4 grid grid-cols-3 rounded-xl overflow-hidden divide-x divide-white/10 border border-white/10">
            {[
              { label: 'Total Biaya', value: formatCurrency(selectedProject.totalCost) },
              { label: 'Terbayar',    value: formatCurrency(totalPaid) },
              { label: 'Sisa',        value: formatCurrency(selectedProject.totalCost - totalPaid) },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center py-2.5 px-2 bg-white/5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-purple-200/70">{item.label}</span>
                <span className="text-sm font-black text-white mt-0.5 text-center leading-tight">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Payment progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[9px] font-semibold text-purple-100/60 mb-1">
              <span>Progres Pembayaran</span>
              <span>{paidPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${paidPct >= 100 ? 'bg-emerald-400' : 'bg-white/70'}`}
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB BAR  — hidden in edit mode
      ══════════════════════════════════════════════════════════════════ */}
      {!isEditing && (
        <div className="flex gap-1.5 p-1 bg-brand-bg rounded-xl border border-brand-border mb-4 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setDetailTab(tab.key)}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                detailTab === tab.key
                  ? 'bg-brand-surface text-brand-accent shadow-sm border border-brand-border'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EDIT MODE
      ══════════════════════════════════════════════════════════════════ */}
      {isEditing && editFormData && (
        <EditModeContent
          editFormData={editFormData}
          profile={profile}
          teamMembers={teamMembers}
          teamByCategory={editTeamByCategory}
          paidMemberIds={paidMemberIdsForProject}
          isSaving={isSaving}
          onFormChange={onEditFormChange}
          onTeamChange={onEditTeamChange}
          onTeamFeeChange={onEditTeamFeeChange}
          onTeamSubJobChange={onEditTeamSubJobChange}
          onReplaceTeamMember={onEditReplaceTeamMember}
          onSave={onSaveEdit}
          onCancel={onCancelEditMode}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIEW MODE
      ══════════════════════════════════════════════════════════════════ */}
      {!isEditing && (
        <div>

          {/* ──────────── TAB: DETAILS ──────────────────────────────── */}
          {detailTab === 'details' && (
            <div className="space-y-4 animate-fade-in">

              <SectionCard title="Informasi Acara">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Pengantin">{selectedProject.clientName}</InfoField>
                  <InfoField label="Tanggal Acara">{formatDateFull(selectedProject.date)}</InfoField>
                  <InfoField label="Lokasi">{selectedProject.location || '—'}</InfoField>
                  <InfoField label="Alamat / Gedung">{selectedProject.address || '—'}</InfoField>
                  {selectedProject.startTime && <InfoField label="Jam Mulai">{selectedProject.startTime}</InfoField>}
                  {selectedProject.endTime   && <InfoField label="Jam Selesai">{selectedProject.endTime}</InfoField>}
                </div>
              </SectionCard>

              <SectionCard title="Progres & Status">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-xs font-semibold text-brand-text-secondary shrink-0">Status Acara:</p>
                    <div className="relative inline-block">
                      <select
                        value={selectedProject.status}
                        onChange={e => handleStatusUpdate(e.target.value)}
                        className={`appearance-none pl-4 pr-9 py-2 text-xs font-bold rounded-xl border-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-accent/40 transition-all ${getStatusClass(selectedProject.status, profile.projectStatusConfig)}`}
                      >
                        {profile.projectStatusConfig.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                      <ArrowDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-60" />
                    </div>
                    <p className="text-[10px] text-brand-text-secondary hidden sm:block italic">Pilih untuk mengubah progres otomatis</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-brand-text-secondary mb-1.5">
                      <span>Progres Pengerjaan</span>
                      <span className="text-violet-600">{selectedProject.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700" style={{ width: `${selectedProject.progress}%` }} />
                    </div>
                  </div>

                  {allSubStatuses.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary mb-2">Tahapan Detail</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                        {allSubStatuses.map(sub => {
                          const isActive = selectedProject.activeSubStatuses?.includes(sub.name);
                          return (
                            <label key={sub.name} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] select-none ${isActive ? 'bg-violet-50 border-2 border-violet-400 shadow-sm' : 'bg-brand-bg border border-brand-border hover:border-violet-300'}`}>
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isActive ? 'bg-violet-500 border-violet-500' : 'border-slate-300 bg-white'}`}>
                                {isActive && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <input type="checkbox" className="hidden" checked={!!isActive} onChange={e => handleSubStatusToggle(sub.name, e.target.checked)} />
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${isActive ? 'text-violet-700' : 'text-brand-text-secondary'}`}>{sub.name}</p>
                                {sub.note && <p className="text-[10px] text-brand-text-secondary/70 line-clamp-1 mt-0.5">{sub.note}</p>}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Package & Rincian Biaya">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <InfoField label="Package">{selectedProject.packageName || '—'}</InfoField>
                      {(selectedProject as any).durationSelection && (
                        <p className="text-[11px] text-brand-accent font-medium italic mt-1">{(selectedProject as any).durationSelection}</p>
                      )}
                      {pkg?.digitalItems?.length ? (
                        <ul className="mt-2 space-y-0.5">
                          {pkg.digitalItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[10px] text-brand-text-secondary">
                              <span className="text-brand-accent font-bold mt-px">·</span>{item}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <InfoField label="Add-ons">
                      {selectedProject.addOns?.map(a => a.name).filter(Boolean).join(', ') || '—'}
                    </InfoField>
                  </div>

                  {(() => {
                    const prints = selectedProject.printingDetails || [];
                    const physicals = pkg?.physicalItems || [];
                    if (!prints.length && !physicals.length) return null;
                    return (
                      <div className="pt-3 border-t border-brand-border/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary mb-2">Item Fisik / Vendor</p>
                        <ul className="space-y-1">
                          {(prints.length > 0 ? prints.map(it => it.customName || it.type) : physicals.map(it => it.name)).map((name, i) => (
                            <li key={i} className="flex items-center gap-1.5 text-xs text-brand-text-light">
                              <span className="w-1 h-1 rounded-full bg-violet-500 flex-shrink-0" />{name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}

                  {selectedProject.customCosts?.length ? (
                    <div className="pt-3 border-t border-brand-border/50">
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-2">Biaya Tambahan</p>
                      <div className="space-y-1.5">
                        {selectedProject.customCosts.map(c => (
                          <div key={c.id} className="flex justify-between items-center px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                            <span className="text-xs text-amber-700 font-semibold">+ {c.description}</span>
                            <span className="text-xs text-amber-700 font-bold">{formatCurrency(c.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard title="Tim & Vendor">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(['Tim', 'Vendor'] as const).map(cat => (
                    <div key={cat}>
                      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${cat === 'Tim' ? 'border-blue-100' : 'border-purple-100'}`}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat === 'Tim' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                        <h5 className={`text-[10px] font-black uppercase tracking-widest ${cat === 'Tim' ? 'text-blue-600' : 'text-purple-600'}`}>
                          {cat === 'Tim' ? 'Tim Internal' : 'Vendor / Mitra'}
                        </h5>
                      </div>
                      {Object.entries(teamByCategory[cat]).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(teamByCategory[cat]).map(([role, members]) => (
                            <div key={role}>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-brand-text-secondary">{role}</p>
                                <div className="h-px flex-grow bg-brand-border/40" />
                              </div>
                              <div className="space-y-2">
                                {(members as AssignedTeamMember[]).map(member => {
                                  const payment = teamProjectPayments.find(p => p.projectId === selectedProject.id && p.teamMemberId === member.memberId);
                                  const isPaid = payment?.status === 'Paid';
                                  return (
                                    <div key={member.memberId} className="flex items-center justify-between p-3 rounded-xl bg-brand-bg border border-transparent hover:border-brand-border/50 transition-all">
                                      <div>
                                        <p className="text-sm font-semibold text-brand-text-light">{member.name}</p>
                                        {member.subJob && <p className="text-[10px] text-brand-text-secondary mt-0.5">{member.subJob}</p>}
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                          {isPaid ? 'Lunas' : 'Belum Bayar'}
                                        </span>
                                        <div className="text-right">
                                          <p className="text-[9px] text-brand-text-secondary">Fee</p>
                                          <p className="text-xs font-bold text-brand-text-light">{formatCurrency(member.fee)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center bg-brand-bg/50 rounded-xl border border-dashed border-brand-border">
                          <p className="text-xs text-brand-text-secondary italic">Belum ada {cat === 'Tim' ? 'tim internal' : 'vendor'} bertugas.</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>

              {selectedProject.notes && (
                <SectionCard title="Catatan">
                  <p className="text-sm text-brand-text-primary whitespace-pre-wrap leading-relaxed">{selectedProject.notes}</p>
                </SectionCard>
              )}
            </div>
          )}

          {/* ──────────── TAB: CHECKLIST ────────────────────────────── */}
          {detailTab === 'checklist' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-brand-text-light">Checklist Hari H</h3>
                  <p className="text-[11px] text-brand-text-secondary mt-0.5">Kelola persiapan lapangan secara real-time</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleShareChecklistPortal} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-xs font-bold text-brand-text-secondary hover:text-brand-accent hover:border-brand-accent/40 transition-all active:scale-95">
                    <SendIcon className="w-3.5 h-3.5" /> Portal
                  </button>
                  <button onClick={handleShareChecklist} className="btn-box-wa px-3.5 py-2 text-xs">
                    <SendIcon className="w-3.5 h-3.5 text-white" /> WhatsApp
                  </button>
                  {!selectedProject.weddingDayChecklist?.length && (
                    <button onClick={handleInitializeChecklist} disabled={isInitializingChecklist} className="button-primary !py-2 !px-4 text-xs disabled:opacity-50">
                      {isInitializingChecklist ? 'Membuat…' : 'Buat Checklist'}
                    </button>
                  )}
                </div>
              </div>

              {selectedProject.weddingDayChecklist?.length ? (() => {
                const total = selectedProject.weddingDayChecklist.length;
                const done  = selectedProject.weddingDayChecklist.filter(i => i.isCompleted).length;
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div className="grid grid-cols-4 gap-2">
                    {([
                      { label: 'Total',  val: total,        color: 'text-brand-text-light', bg: 'bg-slate-50  border-slate-200'  },
                      { label: 'Selesai',val: done,         color: 'text-emerald-700',       bg: 'bg-emerald-50 border-emerald-200' },
                      { label: 'Sisa',   val: total - done, color: 'text-amber-700',         bg: 'bg-amber-50  border-amber-200'  },
                      { label: 'Done',   val: `${pct}%`,    color: 'text-violet-700',        bg: 'bg-violet-50 border-violet-200' },
                    ] as const).map(s => (
                      <div key={s.label} className={`${s.bg} border rounded-2xl p-3 flex flex-col items-center`}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary/60">{s.label}</p>
                        <p className={`text-xl font-black ${s.color} mt-0.5`}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                );
              })() : null}

              {(() => {
                const existingCategories = Array.from(new Set(
                  (selectedProject.weddingDayChecklist || []).slice().sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()).map(i => i.category),
                ));
                if (!existingCategories.length) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 bg-brand-surface rounded-2xl border-2 border-dashed border-brand-border text-center">
                      <CheckCircleIcon className="w-12 h-12 text-brand-text-secondary/20 mb-3" />
                      <h4 className="text-sm font-bold text-brand-text-light">Belum Ada Checklist</h4>
                      <p className="text-xs text-brand-text-secondary mt-1 mb-5">Inisialisasi checklist default untuk membantu persiapan lapangan.</p>
                      <button onClick={handleInitializeChecklist} className="button-primary !py-2 !px-6 text-xs">Inisialisasi Sekarang</button>
                    </div>
                  );
                }
                const currentCat = activeCategory || existingCategories[0];
                return (
                  <>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {existingCategories.map(cat => {
                        const catItems = (selectedProject.weddingDayChecklist || []).filter(i => i.category === cat);
                        const catDone  = catItems.filter(i => i.isCompleted).length;
                        const isAct    = cat === currentCat;
                        return (
                          <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${isAct ? 'bg-brand-surface border-brand-accent text-brand-accent shadow-sm' : 'bg-brand-bg border-brand-border text-brand-text-secondary hover:border-brand-accent/50'}`}>
                            {cat}
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${catDone === catItems.length && catItems.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{catDone}/{catItems.length}</span>
                          </button>
                        );
                      })}
                    </div>
                    {(() => {
                      const catItems = (selectedProject.weddingDayChecklist || []).filter(i => i.category === currentCat);
                      const catDone  = catItems.filter(i => i.isCompleted).length;
                      return (
                        <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-hidden">
                          <div className="px-4 py-3 bg-brand-bg border-b border-brand-border flex items-center justify-between group">
                            {editingCategoryName === currentCat ? (
                              <div className="flex items-center gap-2 flex-grow">
                                <input value={categoryNameDraft} onChange={e => setCategoryNameDraft(e.target.value)} className="flex-grow bg-brand-surface border border-brand-border rounded-xl px-3 py-1.5 text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/40" onKeyDown={e => { if (e.key === 'Enter') handleSaveCategoryName(); if (e.key === 'Escape') { setEditingCategoryName(null); setCategoryNameDraft(''); } }} autoFocus />
                                <button onClick={handleSaveCategoryName} className="p-2 bg-brand-accent text-white rounded-lg"><CheckCircleIcon className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-brand-accent flex-shrink-0" />
                                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-light">{currentCat}</p>
                                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingCategoryName(currentCat); setCategoryNameDraft(currentCat); }} className="p-1.5 text-brand-text-secondary hover:text-brand-accent transition-colors"><PencilIcon className="w-3 h-3" /></button>
                                    <button onClick={() => handleDeleteCategory(currentCat)} className="p-1.5 text-brand-text-secondary hover:text-red-500 transition-colors"><Trash2Icon className="w-3 h-3" /></button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-brand-text-secondary">{catDone}/{catItems.length}</span>
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-accent rounded-full transition-all duration-500" style={{ width: `${catItems.length > 0 ? (catDone / catItems.length) * 100 : 0}%` }} />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="p-3 space-y-0.5">
                            {catItems.map(item => (
                              <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-brand-bg/60 transition-all group/item">
                                <button onClick={() => handleToggleChecklistItem(item.id, item.isCompleted)} className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all active:scale-90 ${item.isCompleted ? 'bg-brand-accent border-brand-accent shadow-sm' : 'border-slate-300 bg-white hover:border-brand-accent/60'}`}>
                                  {item.isCompleted && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                </button>
                                <div className="flex-grow min-w-0">
                                  {editingChecklistItemId === item.id ? (
                                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-brand-bg border border-brand-border">
                                      <input value={checklistItemNameDraft} onChange={e => setChecklistItemNameDraft(e.target.value)} className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/40" placeholder="Nama tugas" autoFocus />
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="relative flex-grow">
                                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text-secondary" />
                                          <input value={picDraft} onChange={e => setPicDraft(e.target.value)} className="w-full bg-white border border-brand-border rounded-xl pl-8 pr-3 py-2 text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/40" placeholder="PIC / Penanggung Jawab" onKeyDown={e => { if (e.key === 'Enter') handleSaveItemEdits(); if (e.key === 'Escape') { setEditingChecklistItemId(null); setChecklistItemNameDraft(''); setPicDraft(''); } }} />
                                        </div>
                                        <div className="flex gap-2">
                                          <button onClick={() => { setEditingChecklistItemId(null); setChecklistItemNameDraft(''); setPicDraft(''); }} className="px-3 py-2 bg-brand-surface text-brand-text-secondary text-xs rounded-xl border border-brand-border">Batal</button>
                                          <button onClick={handleSaveItemEdits} className="button-primary !py-2 !px-4 text-xs">Simpan</button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className={`text-sm font-medium transition-colors ${item.isCompleted ? 'text-brand-text-secondary line-through' : 'text-brand-text-light'}`}>{item.itemName}</p>
                                        {item.assignedTo && (
                                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-semibold text-brand-text-secondary">
                                            <UserIcon className="w-2.5 h-2.5 text-brand-accent" />{item.assignedTo}
                                          </span>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                          <button onClick={() => { setEditingChecklistNotesId(item.id); setChecklistNotesDraft(item.notes || ''); }} className={`text-[9px] font-bold uppercase tracking-wider hover:text-brand-accent transition-colors ${item.notes ? 'text-brand-accent' : 'text-brand-text-secondary'}`}>
                                            {item.notes ? '• Lihat Catatan' : '+ Catatan'}
                                          </button>
                                          {item.isCompleted && item.updatedAt && (
                                            <span className="text-[9px] text-brand-text-secondary/50">✓ {new Date(item.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                                        <button onClick={() => { setEditingChecklistItemId(item.id); setChecklistItemNameDraft(item.itemName); setPicDraft(item.assignedTo || ''); }} className="p-1.5 text-brand-text-secondary hover:text-brand-accent transition-colors"><PencilIcon className="w-3 h-3" /></button>
                                        <button onClick={() => handleDeleteChecklistItem(item.id)} className="p-1.5 text-brand-text-secondary hover:text-red-500 transition-colors"><Trash2Icon className="w-3 h-3" /></button>
                                      </div>
                                    </div>
                                  )}
                                  {editingChecklistNotesId === item.id && (
                                    <div className="mt-2 p-3 rounded-xl bg-brand-surface border border-brand-border shadow-sm animate-fade-in">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary mb-2">Catatan Item</p>
                                      <textarea value={checklistNotesDraft} onChange={e => setChecklistNotesDraft(e.target.value)} rows={3} className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/40 resize-none" placeholder="Tambahkan instruksi atau update lapangan…" />
                                      <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={() => { setEditingChecklistNotesId(null); setChecklistNotesDraft(''); }} className="px-3 py-1.5 bg-brand-surface text-brand-text-secondary text-xs rounded-xl border border-brand-border">Batal</button>
                                        <button onClick={handleSaveChecklistNotes} className="button-primary !py-1.5 !px-4 text-xs">Simpan Catatan</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            <div className="mt-3 px-1 pt-3 border-t border-brand-border/30">
                              <div className="relative">
                                <PlusIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder={`Tambah item ke ${currentCat}…`}
                                  className="w-full bg-brand-bg border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition-all"
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                      handleAddChecklistItem(currentCat, e.currentTarget.value);
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
            </div>
          )}

          {/* ──────────── TAB: FILES ────────────────────────────────── */}
          {detailTab === 'files' && (
            <div className="space-y-4 animate-fade-in">
              <SectionCard title="File & Tautan Penting">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg border border-brand-border">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Brief / Moodboard</p>
                      <p className="text-xs text-brand-text-secondary mt-0.5">Link internal untuk tim</p>
                    </div>
                    {selectedProject.driveLink ? (
                      <a href={selectedProject.driveLink} target="_blank" rel="noopener noreferrer" className="button-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5">
                        <FileTextIcon className="w-3.5 h-3.5" /> Buka
                      </a>
                    ) : <span className="text-xs text-brand-text-secondary/50 italic">Belum ada</span>}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg border border-brand-border">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">File dari Pengantin</p>
                      <p className="text-xs text-brand-text-secondary mt-0.5">Foto / dokumen diterima dari pengantin</p>
                    </div>
                    {selectedProject.clientDriveLink ? (
                      <a href={selectedProject.clientDriveLink} target="_blank" rel="noopener noreferrer" className="button-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5">
                        <FileTextIcon className="w-3.5 h-3.5" /> Buka
                      </a>
                    ) : <span className="text-xs text-brand-text-secondary/50 italic">Belum ada</span>}
                  </div>

                  <div className="p-3 rounded-xl bg-brand-bg border border-brand-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">File Jadi</p>
                        <p className="text-xs text-brand-text-secondary mt-0.5">Link hasil akhir untuk dikirim ke pengantin</p>
                      </div>
                      {!isEditingFinalLink && (
                        <div className="flex items-center gap-2">
                          {selectedProject.finalDriveLink && (
                            <button onClick={handleSendFinalLink} className="btn-box-wa !py-1.5 !px-3 text-xs">
                              <SendIcon className="w-3.5 h-3.5 text-white" /> Kirim WA
                            </button>
                          )}
                          <button onClick={() => { setTempFinalLink(selectedProject.finalDriveLink || ''); setIsEditingFinalLink(true); }} className="btn-box-edit !py-1.5 !px-3 text-xs">
                            <PencilIcon className="w-3.5 h-3.5" /> Edit
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditingFinalLink ? (
                      <div className="flex items-center gap-2">
                        <input type="url" value={tempFinalLink} onChange={e => setTempFinalLink(e.target.value)} placeholder="https://drive.google.com/…" className="flex-1 px-3 py-2 text-sm rounded-xl border border-brand-border bg-brand-surface text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 transition-all" />
                        <button onClick={handleSaveFinalLink} className="button-primary !py-2 !px-4 text-xs flex-shrink-0">Simpan</button>
                        <button onClick={() => setIsEditingFinalLink(false)} className="px-3 py-2 text-xs text-brand-text-secondary hover:text-brand-text-light flex-shrink-0">Batal</button>
                      </div>
                    ) : selectedProject.finalDriveLink ? (
                      <a href={selectedProject.finalDriveLink} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-accent hover:underline font-semibold break-all">
                        {selectedProject.finalDriveLink}
                      </a>
                    ) : (
                      <p className="text-xs text-brand-text-secondary/60 italic">Belum tersedia — klik Edit untuk menambahkan.</p>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetailModal;

// ══════════════════════════════════════════════════════════════════════════════
// EDIT MODE CONTENT — sub-component agar ProjectDetailModal tetap terbaca
// ══════════════════════════════════════════════════════════════════════════════

interface EditModeContentProps {
  editFormData: EditFormData;
  profile: Profile;
  teamMembers: TeamMember[];
  teamByCategory: Record<string, Record<string, TeamMember[]>>;
  paidMemberIds: Set<string>;
  isSaving: boolean;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTeamChange: (member: TeamMember) => void;
  onTeamFeeChange: (memberId: string, fee: number) => void;
  onTeamSubJobChange: (memberId: string, subJob: string) => void;
  onReplaceTeamMember: (oldMemberId: string, newMember: TeamMember) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditModeContent: React.FC<EditModeContentProps> = ({
  editFormData, profile, teamMembers, teamByCategory, paidMemberIds,
  isSaving, onFormChange, onTeamChange, onTeamFeeChange,
  onTeamSubJobChange, onReplaceTeamMember, onSave, onCancel,
}) => {
  return (
    <div className="animate-fade-in pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* 1 — Informasi Dasar */}
          <SectionCard title="Informasi Dasar Acara">
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-projectName" className={labelCls}>Nama Acara Pernikahan <span className="text-red-400">*</span></label>
                <input id="edit-projectName" type="text" name="projectName" value={editFormData.projectName} onChange={onFormChange} className={inputCls} placeholder="Contoh: Wedding Xander & Alya" required />
              </div>
              <div>
                <label htmlFor="edit-projectType" className={labelCls}>Jenis Acara Pernikahan <span className="text-red-400">*</span></label>
                <select id="edit-projectType" name="projectType" value={editFormData.projectType} onChange={onFormChange} className={inputCls} required>
                  <option value="" disabled>Pilih Jenis...</option>
                  {profile.projectTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-location" className={labelCls}>Lokasi / Kota</label>
                <input id="edit-location" type="text" name="location" value={editFormData.location} onChange={onFormChange} className={inputCls} placeholder="Contoh: Jakarta" />
              </div>
              <div>
                <label htmlFor="edit-address" className={labelCls}>Alamat Lengkap / Gedung</label>
                <textarea id="edit-address" name="address" value={editFormData.address} onChange={onFormChange} className={inputCls} placeholder="Contoh: Gedung Mulia, Jl. Gatot Subroto No. 1" rows={3} />
              </div>
            </div>
          </SectionCard>

          {/* 2 — Jadwal & Detail */}
          <SectionCard title="Jadwal & Detail">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-date" className={labelCls}>Tanggal Acara <span className="text-red-400">*</span></label>
                  <input id="edit-date" type="date" name="date" value={editFormData.date} onChange={onFormChange} className={inputCls} required />
                </div>
                <div>
                  <label htmlFor="edit-deadlineDate" className={labelCls}>Deadline</label>
                  <input id="edit-deadlineDate" type="date" name="deadlineDate" value={editFormData.deadlineDate} onChange={onFormChange} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-startTime" className={labelCls}>Waktu Mulai</label>
                  <input id="edit-startTime" type="time" name="startTime" value={editFormData.startTime} onChange={onFormChange} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="edit-endTime" className={labelCls}>Waktu Selesai</label>
                  <input id="edit-endTime" type="time" name="endTime" value={editFormData.endTime} onChange={onFormChange} className={inputCls} />
                </div>
              </div>
              {editFormData.status === 'Dikirim' && (
                <div>
                  <label htmlFor="edit-shippingDetails" className={labelCls}>Detail Pengiriman</label>
                  <input id="edit-shippingDetails" type="text" name="shippingDetails" value={editFormData.shippingDetails} onChange={onFormChange} className={inputCls} placeholder="Informasi pengiriman hasil ke pengantin" />
                </div>
              )}
            </div>
          </SectionCard>

          {/* 3 — Tautan & Catatan */}
          <SectionCard title="Tautan & Catatan">
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-driveLink" className={labelCls}>Link Brief / Moodboard (Internal)</label>
                <input id="edit-driveLink" type="url" name="driveLink" value={editFormData.driveLink} onChange={onFormChange} className={inputCls} placeholder="https://..." />
              </div>
              <div>
                <label htmlFor="edit-clientDriveLink" className={labelCls}>Link File dari Pengantin</label>
                <input id="edit-clientDriveLink" type="url" name="clientDriveLink" value={editFormData.clientDriveLink} onChange={onFormChange} className={inputCls} placeholder="https://drive.google.com/..." />
              </div>
              <div>
                <label htmlFor="edit-finalDriveLink" className={labelCls}>Link File Jadi (untuk Pengantin)</label>
                <input id="edit-finalDriveLink" type="url" name="finalDriveLink" value={editFormData.finalDriveLink} onChange={onFormChange} className={inputCls} placeholder="https://drive.google.com/..." />
              </div>
              <div>
                <label htmlFor="edit-notes" className={labelCls}>Catatan Acara</label>
                <textarea id="edit-notes" name="notes" value={editFormData.notes} onChange={onFormChange} className={inputCls} placeholder="Catatan penting terkait acara ini..." rows={4} />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {(['Tim', 'Vendor'] as const).map(category => (
            <SectionCard key={category} title={category === 'Tim' ? 'Tim Internal' : 'Vendor / Mitra'}>
              <div className="space-y-4">
                {Object.entries(teamByCategory[category] || {}).length === 0 && (
                  <p className="text-xs text-brand-text-secondary/60 italic text-center py-3">
                    Belum ada {category === 'Tim' ? 'anggota tim' : 'vendor'} terdaftar.
                  </p>
                )}
                {Object.entries(teamByCategory[category] || {}).map(([role, members]) => (
                  <div key={role} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-widest">{role}</p>
                      <div className="h-px flex-grow bg-brand-border/40" />
                    </div>
                    {(members as TeamMember[]).map(member => {
                      const assignedMember = editFormData.team.find(t => t.memberId === member.id);
                      const isSelected = !!assignedMember;
                      const isPaid = paidMemberIds.has(member.id);
                      return (
                        <div key={member.id} className={`p-3 rounded-xl transition-all ${isSelected ? 'bg-blue-50/10 border-2 border-brand-accent' : 'bg-brand-bg border border-brand-border hover:border-brand-accent/30'}`}>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={isSelected} onChange={() => onTeamChange(member)} className="h-4 w-4 text-brand-accent rounded border-brand-border focus:ring-brand-accent/40" />
                            <div className="flex-grow">
                              <p className="text-sm font-semibold text-brand-text-light">{member.name}</p>
                              {isSelected && <p className="text-[10px] text-brand-text-secondary mt-0.5">Fee standar: {formatCurrency(member.standardFee)}</p>}
                            </div>
                          </label>
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-brand-border/40 space-y-3">
                              <div>
                                <label className={labelCls}>Biaya per Acara</label>
                                <input type="number" value={assignedMember!.fee} onChange={e => onTeamFeeChange(member.id, Number(e.target.value))} disabled={isPaid} className={`${inputCls} text-right font-mono ${isPaid ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="0" />
                                {isPaid && <p className="text-[10px] text-amber-600 mt-1">Sudah dibayar — tidak dapat diubah</p>}
                              </div>
                              <div>
                                <label className={labelCls}>Keterangan Tugas</label>
                                <input type="text" value={assignedMember!.subJob || ''} onChange={e => onTeamSubJobChange(member.id, e.target.value)} className={inputCls} placeholder="Contoh: Leader, Drone Operator..." />
                              </div>
                              <div>
                                <label className={labelCls}>Ganti Personil / Freelance</label>
                                <select value="" onChange={e => { const m = teamMembers.find(tm => tm.id === e.target.value); if (m) onReplaceTeamMember(member.id, m); }} className={`${inputCls} cursor-pointer`}>
                                  <option value="">— Tetap {member.name} (atau pilih pengganti) —</option>
                                  {teamMembers.filter(tm => tm.id !== member.id).map(tm => (
                                    <option key={tm.id} value={tm.id}>Ganti ke: {tm.name} ({tm.role || 'Tim'})</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      </div>

      {/* ── Sticky Action Bar ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-end items-center gap-3 px-4 py-3 bg-brand-surface/95 backdrop-blur-md border-t border-brand-border shadow-2xl">
        <p className="flex-1 text-xs text-brand-text-secondary hidden sm:block">
          <span className="font-bold text-amber-600">Mode Edit Aktif</span> — Perubahan belum disimpan ke database
        </p>
        <button type="button" onClick={onCancel} disabled={isSaving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border bg-brand-bg text-brand-text-secondary text-sm font-semibold hover:text-brand-text-primary transition-all active:scale-95 disabled:opacity-50">
          <XIcon className="w-4 h-4" />
          Batal
        </button>
        <button type="button" onClick={onSave} disabled={isSaving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-accent/25">
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyimpan...
            </>
          ) : (
            <>
              <SaveIcon className="w-4 h-4" />
              Simpan Perubahan
            </>
          )}
        </button>
      </div>
    </div>
  );
};
