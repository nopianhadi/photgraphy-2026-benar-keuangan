import React from 'react';
import { Transaction, TransactionType } from '../../../types';

import { formatCurrency } from '../../../utils/currency';

interface TransactionTableProps {
    transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
    if (transactions.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 bg-brand-surface rounded-2xl border border-dashed border-brand-border">
            <p className="text-brand-text-secondary">Tidak ada transaksi pada periode ini.</p>
        </div>
    );

    return (
        <div className="overflow-x-auto rounded-xl border border-brand-border">
            <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-brand-input text-brand-text-secondary">
                    <tr>
                        <th className="p-4 font-bold tracking-wider text-center w-12">No</th>
                        <th className="p-4 font-bold tracking-wider">Tanggal</th>
                        <th className="p-4 font-bold tracking-wider">Deskripsi</th>
                        <th className="p-4 font-bold tracking-wider">Kategori</th>
                        <th className="p-4 font-bold tracking-wider text-right">Jumlah</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-border bg-brand-surface">
                    {transactions.map((t, idx) => (
                        <tr key={`${t.id || 'no-id'}-${idx}`} className="hover:bg-brand-bg transition-colors">
                            <td className="p-4 text-center font-medium text-brand-text-secondary">{idx + 1}</td>
                            <td className="p-4 text-brand-text-primary">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                            <td className="p-4">
                                <p className="font-semibold text-brand-text-light">{t.description}</p>
                                <p className="text-[10px] text-brand-text-secondary font-mono mt-0.5">{t.id.slice(0, 8).toUpperCase()}</p>
                            </td>
                            <td className="p-4">
                                <span className="px-2.5 py-1 rounded-full bg-brand-bg text-brand-text-secondary text-[10px] font-bold border border-brand-border">
                                    {t.category}
                                </span>
                            </td>
                            <td className={`p-4 text-right font-black ${t.type === TransactionType.INCOME ? 'text-brand-success' : 'text-brand-danger'}`}>
                                {t.type === TransactionType.EXPENSE ? '-' : ''}{formatCurrency(t.amount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TransactionTable;
