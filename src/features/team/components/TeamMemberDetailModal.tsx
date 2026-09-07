/**
 * TeamMemberDetailModal
 *
 * Redesigned detail modal for a team / vendor member.
 *
 * Layout:
 *   ┌─ Profile header (avatar, name, role, category badge, contact)
 *   ├─ Snapshot row  (total acara · total pendapatan · rating)
 *   ├─ Tab nav       (Acara | Pembayaran | Kinerja | Portal)
 *   └─ Tab content   (scrollable)
 */

import React, { useMemo } from 'react';
import Modal from '../../../shared/ui/Modal';
import FreelancerProjects from './FreelancerProjects';
import PerformanceTab from './PerformanceTab';
import CreatePaymentTab from './CreatePaymentTab';
import {
  TeamMember,
  TeamProjectPayment,
  TeamPaymentRecord,
  Project,
  Card,
  FinancialPocket,
  PerformanceNoteType,
} from '../../../types';
import { formatCurrency, formatDate } from '../utils/teamUtils';
import { StarIcon, FileTextIcon, HistoryIcon, Share2Icon } from '../../../constants';

// ─── Local types ──────────────────────────────────────────────────────────────

type DetailTab = 'projects' | 'payments' | 'performance' | 'create-payment';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeamMemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMember: TeamMember;
  detailTab: DetailTab;
  setDetailTab: (tab: DetailTab) => void;
  // Projects tab
  selectedMemberUnpaidProjects: TeamProjectPayment[];
  projectsToPay: string[];
  onToggleProject: (id: string) => void;
  onProceedToPayment: () => void;
  projectsInDateRange: Project[];
  // Payments tab
  teamProjectPayments: TeamProjectPayment[];
  teamPaymentRecords: TeamPaymentRecord[];
  projects: Project[];
  expandedRecordId: string | null;
  onToggleExpandRecord: (id: string) => void;
  onViewSlip: (record: TeamPaymentRecord) => void;
  // Performance tab
  newNote: string;
  setNewNote: (note: string) => void;
  newNoteType: PerformanceNoteType;
  setNewNoteType: (type: PerformanceNoteType) => void;
  onSetRating: (rating: number) => void;
  onAddNote: () => void;
  onDeleteNote: (noteId: string) => void;
  // Create-payment tab
  paymentAmount: number | '';
  setPaymentAmount: React.Dispatch<React.SetStateAction<number | ''>>;
  isInstallment: boolean;
  setIsInstallment: React.Dispatch<React.SetStateAction<boolean>>;
  onPay: () => void;
  renderPaymentSlipBody: (record: TeamPaymentRecord) => React.ReactNode;
  cards: Card[];
  monthlyBudgetPocket: FinancialPocket | undefined;
  paymentSourceId: string;
  setPaymentSourceId: (id: string) => void;
  onSign: () => void;
  // Portal
  onOpenQrModal: (member: TeamMember) => void;
}

// ─── Snapshot stat ────────────────────────────────────────────────────────────

const SnapshotStat: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
}> = ({ label, value, sub }) => (
  <div className="flex-1 min-w-0 text-center px-4 py-3">
    <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary mb-1">
      {label}
    </p>
    <div className="text-xl font-black text-brand-text-primary leading-none">{value}</div>
    {sub && <p className="text-[10px] text-brand-text-secondary mt-1">{sub}</p>}
  </div>
);

// ─── Tab button ───────────────────────────────────────────────────────────────

const TabBtn: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
      whitespace-nowrap transition-all duration-200
      ${active
        ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/25'
        : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg'
      }
    `}
  >
    {icon}
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span
        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${
          active ? 'bg-white/25 text-white' : 'bg-red-500/15 text-red-400 border border-red-500/25'
        }`}
      >
        {badge}
      </span>
    )}
  </button>
);

// ─── Payments tab content ─────────────────────────────────────────────────────

const PaymentsTabContent: React.FC<{
  memberPaymentRecords: TeamPaymentRecord[];
  teamProjectPayments: TeamProjectPayment[];
  projects: Project[];
  expandedRecordId: string | null;
  onToggleExpandRecord: (id: string) => void;
  onViewSlip: (record: TeamPaymentRecord) => void;
}> = ({
  memberPaymentRecords,
  teamProjectPayments,
  projects,
  expandedRecordId,
  onToggleExpandRecord,
  onViewSlip,
}) => {
  if (memberPaymentRecords.length === 0) {
    return (
      <div className="flex flex-col items-center py-14 text-center">
        <svg className="w-12 h-12 text-brand-text-secondary/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium text-brand-text-secondary">Belum ada riwayat pembayaran.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {memberPaymentRecords.map((record, idx) => {
        const isExpanded = expandedRecordId === record.id;
        return (
          <div
            key={record.id}
            className="border border-brand-border rounded-2xl overflow-hidden transition-all"
          >
            {/* Record row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs font-bold text-brand-text-secondary w-5 text-center shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-brand-text-secondary truncate">
                  {record.recordNumber}
                </p>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  {formatDate(record.date)}
                </p>
              </div>
              <span className="font-black text-sm text-green-400 shrink-0">
                {formatCurrency(record.totalAmount)}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onToggleExpandRecord(record.id)}
                  title={isExpanded ? 'Tutup rincian' : 'Lihat rincian'}
                  className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg transition-all"
                >
                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => onViewSlip(record)}
                  title="Lihat Slip"
                  className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent/10 transition-all"
                >
                  <FileTextIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-brand-border bg-brand-bg/40">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary my-3">
                  Acara yang dibayar
                </p>
                <div className="space-y-1.5">
                  {record.projectPaymentIds.map((paymentId) => {
                    const payment = teamProjectPayments.find((p) => p.id === paymentId);
                    const project = projects.find((p) => p.id === payment?.projectId);
                    return (
                      <div
                        key={paymentId}
                        className="flex justify-between items-center gap-3 text-sm"
                      >
                        <span className="text-brand-text-primary truncate">
                          {project?.projectName ?? 'Acara tidak ditemukan'}
                        </span>
                        <span className="font-semibold text-brand-text-primary shrink-0">
                          {formatCurrency(payment?.fee ?? 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const TeamMemberDetailModal: React.FC<TeamMemberDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMember,
  detailTab,
  setDetailTab,
  selectedMemberUnpaidProjects,
  projectsToPay,
  onToggleProject,
  onProceedToPayment,
  projectsInDateRange,
  teamProjectPayments,
  teamPaymentRecords,
  projects,
  expandedRecordId,
  onToggleExpandRecord,
  onViewSlip,
  newNote,
  setNewNote,
  newNoteType,
  setNewNoteType,
  onSetRating,
  onAddNote,
  onDeleteNote,
  paymentAmount,
  setPaymentAmount,
  isInstallment,
  setIsInstallment,
  onPay,
  renderPaymentSlipBody,
  cards,
  monthlyBudgetPocket,
  paymentSourceId,
  setPaymentSourceId,
  onSign,
  onOpenQrModal,
}) => {
  const memberPaymentRecords = useMemo(
    () => teamPaymentRecords.filter((r) => r.teamMemberId === selectedMember.id),
    [teamPaymentRecords, selectedMember.id],
  );

  const totalPaidEvents = useMemo(
    () =>
      teamProjectPayments.filter(
        (p) => p.teamMemberId === selectedMember.id && p.status === 'Paid',
      ).length,
    [teamProjectPayments, selectedMember.id],
  );

  const totalEarnings = useMemo(
    () =>
      teamProjectPayments
        .filter((p) => p.teamMemberId === selectedMember.id && p.status === 'Paid')
        .reduce((sum, p) => sum + p.fee, 0),
    [teamProjectPayments, selectedMember.id],
  );

  const isProjectsActive = detailTab === 'projects' || detailTab === 'create-payment';
  const avatarLetter = selectedMember.name?.charAt(0).toUpperCase() ?? '?';
  const isVendor = selectedMember.category === 'Vendor';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="4xl"
    >
      <div className="flex flex-col gap-5 -mt-2">

        {/* ── Profile header ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-brand-accent flex items-center justify-center shrink-0 text-white text-2xl font-black shadow-lg shadow-brand-accent/25">
            {avatarLetter}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-lg font-black text-brand-text-primary leading-tight">
                  {selectedMember.name}
                </h3>
                <p className="text-sm text-brand-text-secondary mt-0.5">{selectedMember.role}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold border shrink-0 ${
                  isVendor
                    ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                    : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                }`}
              >
                {isVendor ? 'Vendor Eksternal' : 'Tim Internal'}
              </span>
            </div>

            {/* Contact chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedMember.phone && (
                <a
                  href={`tel:${selectedMember.phone}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-brand-text-secondary bg-brand-bg border border-brand-border hover:text-brand-text-primary transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {selectedMember.phone}
                </a>
              )}
              {selectedMember.email && (
                <a
                  href={`mailto:${selectedMember.email}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-brand-text-secondary bg-brand-bg border border-brand-border hover:text-brand-text-primary transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {selectedMember.email}
                </a>
              )}
              {selectedMember.noRek && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-brand-text-secondary bg-brand-bg border border-brand-border">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {selectedMember.bankName ? `${selectedMember.bankName} · ` : ''}{selectedMember.noRek}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Snapshot stats row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 divide-x divide-brand-border bg-brand-bg border border-brand-border rounded-2xl overflow-hidden">
          <SnapshotStat
            label="Acara Selesai"
            value={totalPaidEvents}
            sub="Sudah dibayar"
          />
          <SnapshotStat
            label="Total Pendapatan"
            value={
              <span className="text-base font-black">{formatCurrency(totalEarnings)}</span>
            }
            sub="Lifetime"
          />
          <SnapshotStat
            label="Rating"
            value={
              <span className="inline-flex items-center gap-1 justify-center">
                {selectedMember.rating.toFixed(1)}
                <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
              </span>
            }
            sub="dari 5"
          />
        </div>

        {/* ── Tab navigation ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 bg-brand-bg border border-brand-border rounded-2xl overflow-x-auto">
          <TabBtn
            active={isProjectsActive}
            onClick={() => setDetailTab('projects')}
            icon={<FileTextIcon className="w-3.5 h-3.5 shrink-0" />}
            label="Acara Pernikahan"
            badge={selectedMemberUnpaidProjects.length}
          />
          <TabBtn
            active={detailTab === 'payments'}
            onClick={() => setDetailTab('payments')}
            icon={<HistoryIcon className="w-3.5 h-3.5 shrink-0" />}
            label="Pembayaran"
          />
          <TabBtn
            active={detailTab === 'performance'}
            onClick={() => setDetailTab('performance')}
            icon={<StarIcon className="w-3.5 h-3.5 shrink-0" />}
            label="Kinerja"
          />
          <TabBtn
            active={false}
            onClick={() => onOpenQrModal(selectedMember)}
            icon={<Share2Icon className="w-3.5 h-3.5 shrink-0" />}
            label="Portal"
          />
        </div>

        {/* ── Tab content (scrollable) ────────────────────────────────────── */}
        <div className="max-h-[55vh] overflow-y-auto pr-1 pb-2">

          {/* Tab: Acara Pernikahan */}
          {detailTab === 'projects' && (
            <FreelancerProjects
              unpaidProjects={selectedMemberUnpaidProjects}
              projectsToPay={projectsToPay}
              onToggleProject={onToggleProject}
              onProceedToPayment={onProceedToPayment}
              projects={projectsInDateRange}
            />
          )}

          {/* Tab: Riwayat Pembayaran */}
          {detailTab === 'payments' && (
            <PaymentsTabContent
              memberPaymentRecords={memberPaymentRecords}
              teamProjectPayments={teamProjectPayments}
              projects={projects}
              expandedRecordId={expandedRecordId}
              onToggleExpandRecord={onToggleExpandRecord}
              onViewSlip={onViewSlip}
            />
          )}

          {/* Tab: Kinerja */}
          {detailTab === 'performance' && (
            <PerformanceTab
              member={selectedMember}
              onSetRating={onSetRating}
              newNote={newNote}
              setNewNote={setNewNote}
              newNoteType={newNoteType}
              setNewNoteType={setNewNoteType}
              onAddNote={onAddNote}
              onDeleteNote={onDeleteNote}
            />
          )}

          {/* Tab: Buat Pembayaran */}
          {detailTab === 'create-payment' && (
            <CreatePaymentTab
              member={selectedMember}
              paymentDetails={{
                projects: selectedMemberUnpaidProjects.filter((p) =>
                  projectsToPay.includes(p.id),
                ),
                total: typeof paymentAmount === 'number' ? paymentAmount : 0,
              }}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              isInstallment={isInstallment}
              setIsInstallment={setIsInstallment}
              onPay={onPay}
              onSetTab={() => setDetailTab('projects')}
              renderPaymentDetailsContent={() =>
                renderPaymentSlipBody({
                  id: `TEMP-${Date.now()}`,
                  recordNumber: `PAY-FR-${selectedMember.id.slice(-4)}-${Date.now()}`,
                  teamMemberId: selectedMember.id,
                  date: new Date().toISOString(),
                  projectPaymentIds: projectsToPay,
                  totalAmount: typeof paymentAmount === 'number' ? paymentAmount : 0,
                })
              }
              cards={cards}
              monthlyBudgetPocket={monthlyBudgetPocket}
              paymentSourceId={paymentSourceId}
              setPaymentSourceId={setPaymentSourceId}
              onSign={onSign}
            />
          )}

        </div>
      </div>
    </Modal>
  );
};

export default TeamMemberDetailModal;
