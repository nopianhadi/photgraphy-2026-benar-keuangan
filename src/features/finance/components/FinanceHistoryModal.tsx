import React from 'react';
import { Transaction, TransactionType, Card, FinancialPocket } from '../../../types';
import Modal from '../../../shared/ui/Modal';
import { formatCurrency } from '../../../utils/currency';

interface FinanceHistoryModalProps {
    historyModalState: { type: 'card' | 'pocket'; item: Card | FinancialPocket | null } | null;
    onClose: () => void;
    transactions: Transaction[];
    cards: Card[];
}

const FinanceHistoryModal: React.FC<FinanceHistoryModalProps> = ({
    historyModalState,
    onClose,
    transactions,
    cards
}) => {
    if (!historyModalState || !historyModalState.item) return null;

    const historyItem = historyModalState.item;
    const title = `Riwayat: ${historyModalState.type === 'card' ? (historyItem as Card).cardHolderName : (historyItem as FinancialPocket).name}`;

    const filtered = transactions
        .filter(t =>
            (historyModalState.type === 'card' && t.cardId === historyItem?.id) ||
            (historyModalState.type === 'pocket' && t.pocketId === historyItem?.id)
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Modal
            isOpen={!!historyModalState}
            onClose={onClose}
            title={title}
            size="3xl"
        >
            <div>
                <div className="overflow-y-auto max-h-[60vh]">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-brand-text-secondary uppercase">
                            <tr>
                                <th className="p-3 text-center w-12">No</th>
                                <th className="p-3 text-left">Tanggal</th>
                                <th className="p-3 text-left">Deskripsi</th>
                                <th className="p-3 text-left">Kategori</th>
                                <th className="p-3 text-left">Sumber/Tujuan</th>
                                <th className="p-3 text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-brand-text-secondary">
                                        Tidak ada riwayat transaksi.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((t) => {
                                    const card = cards.find(c => c.id === t.cardId);
                                    const bankName = card?.bankName || (historyModalState.type === 'card' ? (historyModalState.item as Card).bankName : null) || 'N/A';

                                    let sourceDestText = '';
                                    if (t.category === 'Penyesuaian') {
                                        sourceDestText = `${t.type === TransactionType.INCOME ? 'Ke' : 'Dari'}: ${bankName}`;
                                    } else if (t.category.includes('Transfer') || t.category.includes('Penutupan')) {
                                        if (t.description.toLowerCase().includes('setor ke') || t.description.toLowerCase().includes('transfer ke')) {
                                            sourceDestText = `Dari: ${bankName}`;
                                        } else if (t.description.toLowerCase().includes('tarik dari') || t.description.toLowerCase().includes('penarikan dari')) {
                                            sourceDestText = `Ke: ${bankName}`;
                                        } else {
                                            sourceDestText = 'Sistem Internal';
                                        }
                                    } else if (t.type === TransactionType.INCOME) {
                                        sourceDestText = `Ke: ${bankName}`;
                                    } else if (t.type === TransactionType.EXPENSE) {
                                        sourceDestText = `Dari: ${bankName}`;
                                    }

                                    return (
                                        <tr key={t.id} className="hover:bg-brand-bg">
                                            <td className="p-3 whitespace-nowrap">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                            <td className="p-3 font-semibold text-brand-text-light">{t.description}</td>
                                            <td className="p-3">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    t.category === 'Penyesuaian'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : t.category.includes('Transfer')
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : t.type === TransactionType.INCOME
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="p-3 text-brand-text-secondary">{sourceDestText}</td>
                                            <td className={`p-3 text-right font-semibold ${t.type === TransactionType.INCOME ? 'text-brand-success' : 'text-brand-danger'}`}>
                                                {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatCurrency(t.amount)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    );
};

export default FinanceHistoryModal;
