/**
 * useTeamPayments
 *
 * Owns:
 * - Payment flow state (projectsToPay, paymentAmount, paymentSourceId, isInstallment)
 * - Payment slip / signature modal state
 * - handleCreatePayment  — pre-fills amount & source, moves to create-payment tab
 * - handlePay            — executes full payment: card/pocket deduction, transactions,
 *                          team payment record, DB refresh (identical logic to original)
 * - handleSaveSignature  — persists signature on payment record
 * - handleDownloadPDF    — html2pdf export
 * - renderPaymentSlipBody — renders PaymentSlipDocument (used in slip modal + create-payment preview)
 */

import { useState, useMemo, useCallback } from 'react';
import React from 'react';
import {
    TeamMember,
    TeamProjectPayment,
    TeamPaymentRecord,
    Transaction,
    TransactionType,
    Project,
    Card,
    FinancialPocket,
    PocketType,
    CardType,
    Profile,
} from '../../../types';
import {
    markTeamPaymentStatus,
    listAllTeamPayments,
    updateTeamProjectPayments as updateTeamProjectPaymentsApi,
} from '../../../services/teamProjectPayments';
import {
    createTransactions as createTransactionsApi,
    listTransactions as listTransactionsApi,
    updateCardBalance as updateCardBalanceApi,
} from '../../../services/transactions';
import { createTeamPaymentRecord } from '../../../services/teamPaymentRecords';
import { updatePocket as updatePocketRow } from '../../../services/pockets';
import { formatCurrency } from '../utils/teamUtils';
import PaymentSlipDocument from '../components/PaymentSlipDocument';

interface UseTeamPaymentsParams {
    selectedMember: TeamMember | null;
    teamProjectPayments: TeamProjectPayment[];
    setTeamProjectPayments: React.Dispatch<React.SetStateAction<TeamProjectPayment[]>>;
    teamPaymentRecords: TeamPaymentRecord[];
    setTeamPaymentRecords: React.Dispatch<React.SetStateAction<TeamPaymentRecord[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    projects: Project[];
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    pockets: FinancialPocket[];
    setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
    teamMembers: TeamMember[];
    userProfile: Profile;
    showNotification: (message: string) => void;
    onSignPaymentRecord: (recordId: string, signatureDataUrl: string) => void;
    setDetailTab: (tab: 'projects' | 'payments' | 'performance' | 'create-payment') => void;
    setIsDetailOpen: (open: boolean) => void;
    /** Date-range-filtered payments — used to derive unpaid projects for selectedMember */
    teamProjectPaymentsInDateRange: TeamProjectPayment[];
}

export const useTeamPayments = ({
    selectedMember,
    teamProjectPayments,
    setTeamProjectPayments,
    teamPaymentRecords,
    setTeamPaymentRecords,
    transactions,
    setTransactions,
    projects,
    cards,
    setCards,
    pockets,
    setPockets,
    teamMembers,
    userProfile,
    showNotification,
    onSignPaymentRecord,
    setDetailTab,
    setIsDetailOpen,
    teamProjectPaymentsInDateRange,
}: UseTeamPaymentsParams) => {
    // ── Payment flow state ───────────────────────────────────────────────────
    const [projectsToPay, setProjectsToPay] = useState<string[]>([]);
    const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
    const [paymentSourceId, setPaymentSourceId] = useState('');
    const [isInstallment, setIsInstallment] = useState(false);

    // ── Slip / signature state ───────────────────────────────────────────────
    const [paymentSlipToView, setPaymentSlipToView] = useState<TeamPaymentRecord | null>(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

    // ── Derived: unpaid projects for selected member (date-range-aware) ──────
    const selectedMemberUnpaidProjects = useMemo(() => {
        if (!selectedMember) return [];
        return teamProjectPaymentsInDateRange.filter(
            p => p.teamMemberId === selectedMember.id && p.status === 'Unpaid',
        );
    }, [teamProjectPaymentsInDateRange, selectedMember]);

    // ── Derived: budget pocket ───────────────────────────────────────────────
    const monthlyBudgetPocket = useMemo(
        () => pockets.find(p => p.type === PocketType.EXPENSE),
        [pockets],
    );

    // ── Unique payment records (de-duplicated) ───────────────────────────────
    const uniqueTeamPaymentRecords = useMemo(() => {
        const seen = new Set<string>();
        return teamPaymentRecords.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
        });
    }, [teamPaymentRecords]);

    // ── handleCreatePayment — pre-fill amount/source, navigate to payment tab ─
    const handleCreatePayment = useCallback(() => {
        if (!selectedMember || projectsToPay.length === 0) return;

        const totalToPay = selectedMemberUnpaidProjects
            .filter(p => projectsToPay.includes(p.id))
            .reduce((sum, p) => sum + p.fee, 0);
        setPaymentAmount(totalToPay);

        const budgetPocket = pockets.find(p => p.type === PocketType.EXPENSE);
        if (budgetPocket && budgetPocket.amount >= totalToPay) {
            setPaymentSourceId(`pocket-${budgetPocket.id}`);
        } else {
            setPaymentSourceId('');
        }

        setDetailTab('create-payment');
    }, [selectedMember, projectsToPay, selectedMemberUnpaidProjects, pockets, setDetailTab]);

    // ── handlePay — full payment execution ──────────────────────────────────
    const handlePay = useCallback(async () => {
        if (!selectedMember || !paymentAmount || paymentAmount <= 0 || !paymentSourceId) {
            alert('Harap isi jumlah dan pilih sumber dana.');
            return;
        }

        const actualPaidAmount = Number(paymentAmount);
        const totalDue = selectedMemberUnpaidProjects
            .filter(p => projectsToPay.includes(p.id))
            .reduce((sum, p) => sum + p.fee, 0);

        if (actualPaidAmount > totalDue) {
            alert(
                `Jumlah bayar (${formatCurrency(actualPaidAmount)}) melebihi total tagihan (${formatCurrency(totalDue)}).`,
            );
            return;
        }

        const newTransaction: Transaction = {
            id: `TRN-PAY-FR-${crypto.randomUUID()}`,
            date: new Date().toISOString().split('T')[0],
            description: `Pembayaran Gaji Tim / Vendor: ${selectedMember.name} (${projectsToPay.length} Acara Pernikahan)`,
            amount: paymentAmount,
            type: TransactionType.EXPENSE,
            category: 'Gaji Tim / Vendor',
            method: 'Transfer Bank',
        };

        if (paymentSourceId.startsWith('card-')) {
            const cardId = paymentSourceId.replace('card-', '');
            const card = cards.find(c => c.id === cardId);
            if (!card || card.balance < paymentAmount) {
                alert(`Saldo di kartu ${card?.bankName} tidak mencukupi.`);
                return;
            }
            newTransaction.cardId = cardId;
            newTransaction.method = card.cardType === CardType.TUNAI ? 'Tunai' : 'Kartu';
            setCards(prev =>
                prev.map(c => (c.id === cardId ? { ...c, balance: c.balance - paymentAmount } : c)),
            );
            try {
                await updateCardBalanceApi(cardId, -paymentAmount);
            } catch (e) {
                console.warn('[Supabase] updateCardBalance failed:', e);
            }
        } else {
            // pocket
            const pocketId = paymentSourceId.replace('pocket-', '');
            const pocket = pockets.find(p => p.id === pocketId);
            if (!pocket || pocket.amount < paymentAmount) {
                alert(`Saldo di kantong ${pocket?.name} tidak mencukupi.`);
                return;
            }

            if (pocket.sourceCardId) {
                const sourceCard = cards.find(c => c.id === pocket.sourceCardId);
                if (!sourceCard || sourceCard.balance < paymentAmount) {
                    alert(
                        `Saldo di kartu sumber (${sourceCard?.bankName}) yang terhubung ke kantong ini tidak mencukupi.`,
                    );
                    return;
                }
                setCards(prev =>
                    prev.map(c =>
                        c.id === pocket.sourceCardId
                            ? { ...c, balance: c.balance - paymentAmount }
                            : c,
                    ),
                );
                try {
                    await updateCardBalanceApi(sourceCard.id, -paymentAmount);
                } catch (e) {
                    console.warn('[Supabase] updateCardBalance failed:', e);
                }
            }

            newTransaction.pocketId = pocketId;
            newTransaction.cardId = pocket.sourceCardId;
            newTransaction.method = 'Sistem';
            setPockets(prev =>
                prev.map(p =>
                    p.id === pocketId ? { ...p, amount: p.amount - paymentAmount } : p,
                ),
            );
        }

        const newRecordPayload = {
            recordNumber: `PAY-FR-${selectedMember.id.slice(-4)}-${Date.now()}`,
            teamMemberId: selectedMember.id,
            date: new Date().toISOString().split('T')[0],
            projectPaymentIds: projectsToPay,
            totalAmount: paymentAmount,
        } as Omit<TeamPaymentRecord, 'id'>;

        // Optimistic UI update
        setTeamProjectPayments(prev =>
            prev.map(p => (projectsToPay.includes(p.id) ? { ...p, status: 'Paid' } : p)),
        );

        // Persist per-project finance transactions
        try {
            let remainingToDistribute = actualPaidAmount;
            const selectedPayments = [...teamProjectPayments.filter(p => projectsToPay.includes(p.id))].sort(
                (a, b) => a.date.localeCompare(b.date),
            );

            const transactionsToCreate: Omit<Transaction, 'id' | 'vendorSignature'>[] = [];
            const paymentsToUpdate: TeamProjectPayment[] = [];

            for (const pay of selectedPayments) {
                if (remainingToDistribute <= 0) break;

                const payForThisProject = Math.min(pay.fee, remainingToDistribute);
                const isFullyPaid = payForThisProject >= pay.fee;
                remainingToDistribute -= payForThisProject;

                const proj = projects.find(pr => pr.id === pay.projectId);
                const tx: Omit<Transaction, 'id' | 'vendorSignature'> = {
                    date: newTransaction.date,
                    description: `Gaji Freelance - ${selectedMember.name}${proj ? ` (${proj.projectName})` : ''}${!isFullyPaid ? ' (Cicilan)' : ''}`,
                    amount: payForThisProject,
                    type: TransactionType.EXPENSE,
                    projectId: pay.projectId,
                    category: 'Gaji Tim / Vendor',
                    method: newTransaction.method,
                    pocketId: newTransaction.pocketId,
                    cardId: newTransaction.cardId,
                };
                transactionsToCreate.push(tx);

                paymentsToUpdate.push(
                    isFullyPaid
                        ? { ...pay, status: 'Paid' }
                        : { ...pay, fee: pay.fee - payForThisProject, status: 'Unpaid' },
                );
            }

            if (transactionsToCreate.length > 0) {
                await createTransactionsApi(transactionsToCreate);
            }
            if (paymentsToUpdate.length > 0) {
                await updateTeamProjectPaymentsApi(paymentsToUpdate);
            }

            const freshTx = await listTransactionsApi();
            setTransactions(Array.isArray(freshTx) ? freshTx : []);
        } catch (e) {
            console.error('[Supabase] createTransaction (per-project) failed:', e);
        }

        try {
            const createdRecord = await createTeamPaymentRecord(newRecordPayload);
            setTeamPaymentRecords(prev => {
                const exists = prev.some(r => r.id === createdRecord.id);
                return exists
                    ? prev.map(r => (r.id === createdRecord.id ? createdRecord : r))
                    : [...prev, createdRecord];
            });
            const freshPayments = await listAllTeamPayments();
            setTeamProjectPayments(Array.isArray(freshPayments) ? freshPayments : []);
        } catch (err) {
            console.error('[Supabase] Persist payment failed:', err);
        }

        showNotification(
            `Pembayaran untuk ${selectedMember.name} sebesar ${formatCurrency(paymentAmount)} berhasil dicatat.`,
        );

        setProjectsToPay([]);
        setPaymentAmount('');
        setIsDetailOpen(false);
    }, [
        selectedMember,
        paymentAmount,
        paymentSourceId,
        projectsToPay,
        selectedMemberUnpaidProjects,
        teamProjectPayments,
        cards,
        pockets,
        projects,
        setCards,
        setPockets,
        setTeamProjectPayments,
        setTeamPaymentRecords,
        setTransactions,
        showNotification,
        setIsDetailOpen,
    ]);

    // ── handleSaveSignature ──────────────────────────────────────────────────
    const handleSaveSignature = useCallback(
        (signatureDataUrl: string) => {
            if (paymentSlipToView) {
                onSignPaymentRecord(paymentSlipToView.id, signatureDataUrl);
                setPaymentSlipToView(prev =>
                    prev ? { ...prev, vendorSignature: signatureDataUrl } : null,
                );
            }
            setIsSignatureModalOpen(false);
        },
        [paymentSlipToView, onSignPaymentRecord],
    );

    // ── handleDownloadPDF ────────────────────────────────────────────────────
    const handleDownloadPDF = useCallback(async () => {
        if (!paymentSlipToView) return;
        const element = document.getElementById(
            `payment-slip-content-${paymentSlipToView.id}`,
        );
        if (!element) return;

        const opt = {
            margin: 10,
            filename: `Slip-Gaji-${paymentSlipToView.recordNumber}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4' as const, orientation: 'portrait' as const },
        };

        const html2pdf = (await import('html2pdf.js')).default;
        html2pdf().set(opt).from(element).save();
    }, [paymentSlipToView]);

    // ── renderPaymentSlipBody ────────────────────────────────────────────────
    const renderPaymentSlipBody = useCallback(
        (record: TeamPaymentRecord) => {
            return React.createElement(PaymentSlipDocument, {
                record,
                teamMembers,
                teamProjectPayments,
                projects,
                userProfile,
            });
        },
        [teamMembers, teamProjectPayments, projects, userProfile],
    );

    return {
        // State
        projectsToPay,
        setProjectsToPay,
        paymentAmount,
        setPaymentAmount,
        paymentSourceId,
        setPaymentSourceId,
        isInstallment,
        setIsInstallment,
        paymentSlipToView,
        setPaymentSlipToView,
        isSignatureModalOpen,
        setIsSignatureModalOpen,
        expandedRecordId,
        setExpandedRecordId,

        // Derived
        selectedMemberUnpaidProjects,
        monthlyBudgetPocket,
        uniqueTeamPaymentRecords,

        // Handlers
        handleCreatePayment,
        handlePay,
        handleSaveSignature,
        handleDownloadPDF,
        renderPaymentSlipBody,
    };
};
