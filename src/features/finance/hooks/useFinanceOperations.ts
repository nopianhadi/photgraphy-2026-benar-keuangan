import { useState, useEffect } from 'react';
import {
    Transaction,
    TransactionType,
    Card,
    CardType,
    FinancialPocket,
    PocketType,
    Project,
    PaymentStatus
} from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { createPocket as createPocketRow, updatePocket as updatePocketRow } from '../../../services/pockets';
import { createCard as createCardRow, updateCard as updateCardRow } from '../../../services/cards';
import { createTransaction as createTransactionRow } from '../../../services/transactions';
import { emptyTransaction, emptyPocket, emptyCard } from '../utils/financeHelpers';

interface UseFinanceOperationsParams {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    pockets: FinancialPocket[];
    setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    handleAddTransaction: (tx: Omit<Transaction, 'id' | 'vendorSignature'>) => Promise<Transaction>;
    handleUpdateTransaction: (id: string, patch: Partial<Transaction>, before: Transaction) => Promise<Transaction>;
    showNotification: (msg: string) => void;
    monthlyBudgetPocket: FinancialPocket | undefined;
    setFilters: React.Dispatch<React.SetStateAction<{ searchTerm: string; dateFrom: string; dateTo: string }>>;
}

export type FinanceModalType = null | 'transaction' | 'pocket' | 'card' | 'transfer' | 'topup-cash';

export function useFinanceOperations({
    transactions,
    setTransactions,
    pockets,
    setPockets,
    cards,
    setCards,
    projects,
    setProjects,
    handleAddTransaction,
    handleUpdateTransaction,
    showNotification,
    monthlyBudgetPocket,
    setFilters
}: UseFinanceOperationsParams) {
    const [modalState, setModalState] = useState<{
        type: FinanceModalType;
        mode: 'add' | 'edit';
        data?: any;
    }>({ type: null, mode: 'add' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<any>({});

    const [offset, setOffset] = useState(100);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const loadMoreTransactions = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const { listTransactions } = await import('../../../services/transactions');
            const nextTxs = await listTransactions({ limit: 100, offset });
            if (nextTxs.length < 100) {
                setHasMore(false);
            }
            if (nextTxs.length > 0) {
                setTransactions(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const uniqueNew = nextTxs.filter(t => !existingIds.has(t.id));
                    return [...prev, ...uniqueNew].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });
                setOffset(prev => prev + 100);
            } else {
                setHasMore(false);
            }
        } catch (e) {
            console.error('[Finance] Failed to load more transactions:', e);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleCloseBudget = (budgetPocket: FinancialPocket, isAutomatic: boolean = false) => {
        if (!budgetPocket) {
            return;
        }

        const now = new Date();
        const closedPocketName = budgetPocket.name;
        const currentMonthName = `Anggaran Operasional ${now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`;

        if (budgetPocket.amount > 0) {
            const newSavedPocket: FinancialPocket = {
                id: `POC-SISA-${now.getTime()}`,
                name: `Sisa ${closedPocketName}`,
                description: 'Hasil penutupan anggaran bulanan.',
                icon: 'piggy-bank',
                type: PocketType.SAVING,
                amount: budgetPocket.amount,
                sourceCardId: budgetPocket.sourceCardId,
            };

            const closingTx: Transaction = {
                id: `TRN-CLOSE-${now.getTime()}`,
                date: now.toISOString().split('T')[0],
                description: `Penutupan anggaran: ${closedPocketName}`,
                amount: budgetPocket.amount,
                type: TransactionType.EXPENSE,
                category: 'Penutupan Anggaran',
                method: 'Sistem',
                pocketId: budgetPocket.id
            };

            setPockets(prev => {
                const withNewPocket = [...prev, newSavedPocket];
                return withNewPocket.map(p =>
                    p.id === budgetPocket.id
                        ? { ...p, amount: 0, name: currentMonthName }
                        : p);
            });
            setTransactions(prev => [closingTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            showNotification(`Anggaran "${closedPocketName}" ditutup. Sisa ${formatCurrency(budgetPocket.amount)} disimpan.`);
        } else {
            setPockets(prev => prev.map(p =>
                p.id === budgetPocket.id
                    ? { ...p, name: currentMonthName }
                    : p
            ));
            if (isAutomatic) {
                showNotification(`Anggaran bulanan telah diperbarui untuk ${now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}.`);
            }
        }
    };

    useEffect(() => {
        const autoCloseBudget = () => {
            const budgetPocket = pockets.find(p => p.type === PocketType.EXPENSE);
            if (!budgetPocket) return;

            const nameParts = budgetPocket.name.replace('Anggaran Operasional ', '').split(' ');
            if (nameParts.length < 2) return;

            const monthName = nameParts[0];
            const year = parseInt(nameParts[1], 10);

            if (isNaN(year)) return;

            const monthMap: { [key in string]: number } = {
                'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
                'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
            };
            const month = monthMap[monthName];

            if (month === undefined) return;

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();

            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                handleCloseBudget(budgetPocket, true);
            }
        };

        autoCloseBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenModal = (type: FinanceModalType, mode: 'add' | 'edit', data?: any) => {
        if (!type) return;
        setModalState({ type, mode, data });
        if (mode === 'add') {
            if (type === 'transaction') {
                setForm({
                    ...emptyTransaction,
                    cardId: cards.find(c => c.cardType !== CardType.TUNAI)?.id || '',
                    sourceId: cards.find(c => c.cardType !== CardType.TUNAI)?.id ? `card-${cards.find(c => c.cardType !== CardType.TUNAI)?.id}` : '',
                    projectId: ''
                });
            }
            if (type === 'pocket') setForm(emptyPocket);
            if (type === 'card') setForm({ ...emptyCard, initialBalance: '' });
            if (type === 'transfer') {
                const transferType = data?.transferType || 'deposit';
                setForm({
                    amount: '',
                    fromCardId: cards.find(c => c.cardType !== CardType.TUNAI)?.id || cards[0]?.id || '',
                    toPocketId: data?.id,
                    type: transferType
                });
            }
            if (type === 'topup-cash') setForm({ amount: '', fromCardId: cards.find(c => c.cardType !== CardType.TUNAI)?.id || '' });
        } else {
            setForm({ ...data, adjustmentAmount: '', adjustmentReason: '' });
        }
    };

    const handleCloseModal = () => {
        setModalState({ type: null, mode: 'add' });
        setForm({});
    };

    const handleSubmitInner = async (e: React.FormEvent) => {
        e.preventDefault();
        const { type, mode, data } = modalState;

        if (type === 'transaction') {
            const newTx = { ...form, amount: Number(form.amount) };
            if (mode === 'add') {
                if (newTx.type === TransactionType.EXPENSE) {
                    const source = newTx.sourceId; // e.g., 'card-CARD001' or 'pocket-POC003'
                    if (source.startsWith('pocket-')) {
                        const pocketId = source.replace('pocket-', '');
                        const pocket = pockets.find(p => p.id === pocketId);
                        if (pocket && pocket.amount < newTx.amount) {
                            alert(`Saldo kantong "${pocket.name}" tidak mencukupi. Saldo: ${formatCurrency(pocket.amount)}`);
                            return;
                        }
                        newTx.pocketId = pocketId;
                        delete newTx.sourceId;
                    } else if (source.startsWith('card-')) {
                        const cardId = source.replace('card-', '');
                        newTx.cardId = cardId;
                        delete newTx.sourceId;
                    }
                }
                await handleAddTransaction({
                    date: newTx.date,
                    description: newTx.description,
                    amount: newTx.amount,
                    type: newTx.type,
                    projectId: newTx.projectId || undefined,
                    category: newTx.category,
                    method: newTx.method,
                    pocketId: newTx.pocketId || undefined,
                    cardId: newTx.cardId || undefined,
                } as Omit<Transaction, 'id' | 'vendorSignature'>);
            } else {
                const before = transactions.find(t => t.id === data.id);
                if (before) {
                    await handleUpdateTransaction(data.id, {
                        date: newTx.date,
                        description: newTx.description,
                        amount: newTx.amount,
                        type: newTx.type,
                        projectId: newTx.projectId,
                        category: newTx.category,
                        method: newTx.method,
                        pocketId: newTx.pocketId,
                        cardId: newTx.cardId,
                    }, before);
                }
            }

            // [SYNC] Update Project amountPaid and paymentStatus if linked
            if (newTx.projectId) {
                const proj = projects.find(p => p.id === newTx.projectId);
                if (proj) {
                    const projectTransactions = [...transactions, ...(mode === 'add' ? [form] : [])].filter(t =>
                        t.projectId === proj.id &&
                        (t.category.includes('DP') || t.category.includes('Pelunasan') || t.category.includes('Pembayaran') || t.category.includes('Koreksi'))
                    );

                    const totalPaid = projectTransactions.reduce((acc, t) => {
                        if (t.id === data?.id && mode === 'edit') {
                            return acc + Number(form.amount);
                        }
                        return acc + t.amount;
                    }, 0);

                    const newPaymentStatus = totalPaid >= proj.totalCost ? PaymentStatus.LUNAS : (totalPaid > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR);

                    try {
                        const { updateProject: updateProjectInDb } = await import('../../../services/projects');
                        await updateProjectInDb(proj.id, { amountPaid: totalPaid, paymentStatus: newPaymentStatus });
                        setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, amountPaid: totalPaid, paymentStatus: newPaymentStatus as any } : p));
                    } catch (e) {
                        console.warn('[Sync] Gagal memperbarui status proyek:', e);
                    }
                }
            }
        }

        if (type === 'pocket') {
            if (mode === 'add') {
                try {
                    const created = await createPocketRow({
                        name: form.name,
                        description: form.description || '',
                        icon: form.icon,
                        type: form.type,
                        amount: 0,
                        sourceCardId: form.sourceCardId || undefined,
                        goalAmount: form.goalAmount || undefined,
                        lockEndDate: form.lockEndDate || undefined,
                    } as Omit<FinancialPocket, 'id' | 'members'>);
                    setPockets(prev => [...prev, created]);
                    showNotification('Kantong berhasil dibuat.');
                } catch {
                    alert('Gagal menyimpan kantong ke database. Coba lagi.');
                    return;
                }
            } else {
                try {
                    const updated = await updatePocketRow(data.id, {
                        name: form.name,
                        description: form.description,
                        icon: form.icon,
                        type: form.type,
                        amount: form.amount,
                        sourceCardId: form.sourceCardId,
                        goalAmount: form.goalAmount,
                        lockEndDate: form.lockEndDate,
                    } as Partial<FinancialPocket>);
                    setPockets(prev => prev.map(p => p.id === data.id ? updated : p));
                    showNotification('Kantong berhasil diperbarui.');
                } catch {
                    alert('Gagal memperbarui kantong di database. Coba lagi.');
                    return;
                }
            }
        }

        if (type === 'card') {
            const initialBalance = Number(form.initialBalance || 0);
            if (mode === 'add') {
                try {
                    const created = await createCardRow({
                        card_holder_name: form.cardHolderName,
                        bank_name: form.bankName,
                        card_type: form.cardType,
                        last_four_digits: form.lastFourDigits,
                        expiry_date: form.expiryDate || null,
                        balance: 0,
                        color_gradient: form.colorGradient || null,
                    });
                    const uiCard: Card = {
                        id: created.id,
                        cardHolderName: created.card_holder_name,
                        bankName: created.bank_name,
                        cardType: created.card_type as CardType,
                        lastFourDigits: created.last_four_digits,
                        expiryDate: created.expiry_date || '',
                        colorGradient: created.color_gradient || '',
                        balance: Number(created.balance || 0),
                    };
                    setCards(prev => [...prev, uiCard]);

                    if (initialBalance > 0) {
                        try {
                            const tx = await createTransactionRow({
                                date: new Date().toISOString().split('T')[0],
                                description: `Saldo Awal - ${uiCard.bankName} ${uiCard.cardType !== CardType.TUNAI ? uiCard.lastFourDigits : ''}`.trim(),
                                amount: initialBalance,
                                type: TransactionType.INCOME,
                                projectId: undefined,
                                category: 'Modal',
                                method: 'Sistem',
                                cardId: uiCard.id,
                            } as Omit<Transaction, 'id' | 'vendorSignature'>);
                            setTransactions(prev => [...prev, tx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                            setCards(prev => prev.map(c => c.id === uiCard.id ? { ...c, balance: c.balance + initialBalance } : c));
                        } catch (err) {
                            console.warn('[Supabase] Gagal membuat transaksi saldo awal kartu, fallback lokal.', err);
                            const initialTx: Transaction = {
                                id: `TRN-INIT-${uiCard.id}`,
                                date: new Date().toISOString().split('T')[0],
                                description: `Saldo Awal - ${uiCard.bankName} ${uiCard.cardType !== CardType.TUNAI ? uiCard.lastFourDigits : ''}`.trim(),
                                amount: initialBalance,
                                type: TransactionType.INCOME,
                                category: 'Modal',
                                method: 'Sistem',
                                cardId: uiCard.id,
                            };
                            setTransactions(prev => [...prev, initialTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                            setCards(prev => prev.map(c => c.id === uiCard.id ? { ...c, balance: c.balance + initialBalance } : c));
                        }
                    }
                    showNotification('Kartu baru berhasil ditambahkan.');
                } catch {
                    alert('Gagal menambahkan kartu ke database. Coba lagi.');
                    return;
                }
            } else if (mode === 'edit' && data?.id) {
                try {
                    const updated = await updateCardRow(data.id, {
                        card_holder_name: form.cardHolderName,
                        bank_name: form.bankName,
                        card_type: form.cardType,
                        last_four_digits: form.lastFourDigits,
                        expiry_date: form.expiryDate || null,
                        color_gradient: form.colorGradient || null,
                    });

                    let finalBalance = Number(updated.balance || 0);
                    if (form.adjustmentAmount && Number(form.adjustmentAmount) !== 0) {
                        const amount = Number(form.adjustmentAmount);
                        const reason = form.adjustmentReason || 'Penyesuaian Saldo';

                        try {
                            const adjTx = await createTransactionRow({
                                date: new Date().toISOString().split('T')[0],
                                description: `${reason} - ${updated.bank_name}`,
                                amount: Math.abs(amount),
                                type: amount > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                                category: 'Penyesuaian',
                                method: 'Sistem',
                                cardId: updated.id,
                            } as Omit<Transaction, 'id' | 'vendorSignature'>);

                            setTransactions(prev => [adjTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                            finalBalance = finalBalance + amount;
                        } catch (e) {
                            console.warn('[Finance] Gagal menyimpan penyesuaian saldo.', e);
                        }
                    }

                    const uiCard: Card = {
                        id: updated.id,
                        cardHolderName: updated.card_holder_name,
                        bankName: updated.bank_name,
                        cardType: updated.card_type as CardType,
                        lastFourDigits: updated.last_four_digits,
                        expiryDate: updated.expiry_date || '',
                        colorGradient: updated.color_gradient || '',
                        balance: finalBalance,
                    };
                    setCards(prev => prev.map(c => c.id === uiCard.id ? { ...c, ...uiCard } : c));
                    showNotification('Kartu berhasil diperbarui.');
                } catch {
                    alert('Gagal memperbarui kartu di database. Coba lagi.');
                }
            }
        }

        if (type === 'transfer') {
            const amount = Number(form.amount);
            const fromCardId = form.fromCardId;
            const toPocketId = form.toPocketId;
            const transferType = form.type;

            if (transferType === 'deposit') {
                try {
                    const transferTx = await createTransactionRow({
                        date: new Date().toISOString().split('T')[0],
                        description: 'Transfer ke kantong',
                        amount,
                        type: TransactionType.EXPENSE,
                        category: 'Transfer Internal',
                        method: 'Sistem',
                        cardId: fromCardId,
                        projectId: undefined,
                        pocketId: undefined,
                    } as Omit<Transaction, 'id' | 'vendorSignature'>);
                    setTransactions(prev => [...prev, transferTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                    setPockets(prev => prev.map(p => p.id === toPocketId ? { ...p, amount: p.amount + amount } : p));
                    try {
                        const pocketTo = pockets.find(p => p.id === toPocketId);
                        await updatePocketRow(toPocketId, { amount: (pocketTo?.amount || 0) + amount });
                    } catch (e) {
                        console.warn('[Supabase] Gagal memperbarui saldo kantong saat deposit transfer.', e);
                    }
                    setCards(prev => prev.map(c => c.id === fromCardId ? { ...c, balance: c.balance - amount } : c));
                    showNotification('Transfer berhasil.');
                } catch {
                    alert('Gagal menyimpan transaksi transfer (deposit) ke database. Coba lagi.');
                    return;
                }
            } else {
                const pocket = pockets.find(p => p.id === toPocketId);
                if (pocket && pocket.amount < amount) {
                    alert(`Saldo kantong tidak mencukupi. Saldo: ${formatCurrency(pocket.amount)}`);
                    return;
                }
                try {
                    const withdrawTx = await createTransactionRow({
                        date: new Date().toISOString().split('T')[0],
                        description: 'Penarikan dari kantong',
                        amount,
                        type: TransactionType.INCOME,
                        category: 'Transfer Internal',
                        method: 'Sistem',
                        cardId: fromCardId,
                        projectId: undefined,
                        pocketId: undefined,
                    } as Omit<Transaction, 'id' | 'vendorSignature'>);
                    setTransactions(prev => [...prev, withdrawTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                    setPockets(prev => prev.map(p => p.id === toPocketId ? { ...p, amount: p.amount - amount } : p));
                    try {
                        await updatePocketRow(toPocketId, { amount: (pocket?.amount || 0) - amount });
                    } catch (e) {
                        console.warn('[Supabase] Gagal memperbarui saldo kantong saat withdraw transfer.', e);
                    }
                    setCards(prev => prev.map(c => c.id === fromCardId ? { ...c, balance: c.balance + amount } : c));
                    showNotification('Penarikan berhasil.');
                } catch {
                    alert('Gagal menyimpan transaksi transfer (withdraw) ke database. Coba lagi.');
                    return;
                }
            }
        }

        if (type === 'topup-cash') {
            const amount = Number(form.amount);
            const fromCardId = form.fromCardId;
            const cashCard = cards.find(c => c.cardType === CardType.TUNAI);

            if (cashCard) {
                try {
                    const topupTx = await createTransactionRow({
                        date: new Date().toISOString().split('T')[0],
                        description: 'Top-up Tunai',
                        amount,
                        type: TransactionType.EXPENSE,
                        category: 'Transfer Internal',
                        method: 'Sistem',
                        cardId: fromCardId,
                        projectId: undefined,
                        pocketId: undefined,
                    } as Omit<Transaction, 'id' | 'vendorSignature'>);
                    const cashIncomeTx = await createTransactionRow({
                        date: new Date().toISOString().split('T')[0],
                        description: 'Penerimaan Tunai',
                        amount,
                        type: TransactionType.INCOME,
                        category: 'Transfer Internal',
                        method: 'Sistem',
                        cardId: cashCard.id,
                        projectId: undefined,
                        pocketId: undefined,
                    } as Omit<Transaction, 'id' | 'vendorSignature'>);
                    setTransactions(prev => [...prev, topupTx, cashIncomeTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                    setCards(prev => prev.map(c => c.id === fromCardId ? { ...c, balance: c.balance - amount } : c));
                    setCards(prev => prev.map(c => c.id === cashCard.id ? { ...c, balance: c.balance + amount } : c));
                    showNotification('Top-up tunai berhasil.');
                } catch {
                    alert('Gagal menyimpan transaksi top-up tunai ke database. Coba lagi.');
                    return;
                }
            }
        }

        handleCloseModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await handleSubmitInner(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<any>) => setForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleFilterChange = (e: React.ChangeEvent<any>) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleTutupAnggaran = () => {
        if (!monthlyBudgetPocket) { return; }
        if (monthlyBudgetPocket.amount <= 0) {
            alert("Tidak ada sisa anggaran untuk disimpan.");
            return;
        }
        if (window.confirm(`Anda akan menyimpan sisa anggaran sebesar ${formatCurrency(monthlyBudgetPocket.amount)} ke kantong baru. Lanjutkan?`)) {
            handleCloseBudget(monthlyBudgetPocket, false);
        }
    };

    return {
        modalState,
        setModalState,
        isSubmitting,
        form,
        setForm,
        offset,
        hasMore,
        isLoadingMore,
        loadMoreTransactions,
        handleOpenModal,
        handleCloseModal,
        handleSubmit,
        handleFormChange,
        handleFilterChange,
        handleTutupAnggaran,
        handleCloseBudget
    };
}
