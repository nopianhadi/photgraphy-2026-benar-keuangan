import React from 'react';
import { FinancialPocket, Transaction, TransactionType } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { DownloadIcon, PencilIcon, Trash2Icon, ArrowDownIcon } from '../../../constants';

interface CategoryTotals {
    income: { [key: string]: number };
    expense: { [key: string]: number };
}

interface TransactionsTabProps {
    monthlyBudgetPocket?: FinancialPocket;
    onTutupAnggaran: () => void;
    categoryTotals: CategoryTotals;
    categoryFilter: { type: TransactionType | 'all'; category: string };
    setCategoryFilter: (filter: { type: TransactionType | 'all'; category: string }) => void;
    filters: { searchTerm: string; dateFrom: string; dateTo: string };
    handleFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDownloadTransactionsCSV: () => void;
    filteredSummary: { income: number; expense: number; net: number };
    filteredTransactions: Transaction[];
    getTransactionSubDescription: (t: Transaction) => string | null;
    onOpenModal: (type: 'transaction', mode: 'add' | 'edit', data?: any) => void;
    onDeleteTransaction: (id: string) => void;
    hasMore: boolean;
    loadMoreTransactions: () => void;
    isLoadingMore: boolean;
}

const CategoryButton: React.FC<{
    type: TransactionType;
    categoryName: string;
    amount: number;
    isActive: boolean;
    onClick: () => void;
}> = ({ type, categoryName, amount, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex justify-between items-center text-left p-3 rounded-lg text-sm transition-colors ${
            isActive ? 'bg-blue-100 text-brand-accent font-semibold' : 'text-brand-text-primary hover:bg-brand-input'
        }`}
    >
        <span className="truncate">{categoryName}</span>
        <span
            className={`font-medium ${
                amount > 0
                    ? type === TransactionType.INCOME
                        ? 'text-brand-success/80'
                        : 'text-brand-danger/80'
                    : 'text-brand-text-secondary'
            }`}
        >
            {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(amount)}
        </span>
    </button>
);

const TransactionsTab: React.FC<TransactionsTabProps> = ({
    monthlyBudgetPocket,
    onTutupAnggaran,
    categoryTotals,
    categoryFilter,
    setCategoryFilter,
    filters,
    handleFilterChange,
    handleDownloadTransactionsCSV,
    filteredSummary,
    filteredTransactions,
    getTransactionSubDescription,
    onOpenModal,
    onDeleteTransaction,
    hasMore,
    loadMoreTransactions,
    isLoadingMore
}) => {
    const allIncomeTotal: number = Object.keys(categoryTotals.income).reduce(
        (sum: number, key: string) => sum + categoryTotals.income[key],
        0
    );
    const allExpenseTotal: number = Object.keys(categoryTotals.expense).reduce(
        (sum: number, key: string) => sum + categoryTotals.expense[key],
        0
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Column: Category Filters & Budget */}
            <div className="lg:col-span-1 space-y-6">
                {monthlyBudgetPocket && (
                    <div className="bg-brand-surface p-4 rounded-2xl shadow-lg border border-brand-border">
                        <h4 className="font-semibold text-gradient mb-2">{monthlyBudgetPocket.name}</h4>
                        <p className="text-2xl font-bold text-blue-800">{formatCurrency(monthlyBudgetPocket.amount)}</p>
                        <p className="text-xs text-brand-text-secondary mt-1">
                            dari {formatCurrency(monthlyBudgetPocket.goalAmount || 0)}
                        </p>
                        <button onClick={onTutupAnggaran} className="w-full mt-3 button-secondary text-sm">
                            Tutup & Simpan Sisa
                        </button>
                    </div>
                )}
                <div className="bg-brand-surface p-4 rounded-2xl shadow-lg border border-brand-border">
                    <h4 className="font-semibold text-gradient mb-3 px-2">Pemasukan</h4>
                    <div className="space-y-1">
                        <CategoryButton
                            type={TransactionType.INCOME}
                            categoryName="Semua"
                            amount={allIncomeTotal}
                            isActive={categoryFilter.type === TransactionType.INCOME && categoryFilter.category === 'Semua'}
                            onClick={() => setCategoryFilter({ type: TransactionType.INCOME, category: 'Semua' })}
                        />
                        {Object.entries(categoryTotals.income).map(([name, amount]: [string, number]) => (
                            <CategoryButton
                                key={name}
                                type={TransactionType.INCOME}
                                categoryName={name}
                                amount={amount}
                                isActive={categoryFilter.type === TransactionType.INCOME && categoryFilter.category === name}
                                onClick={() => setCategoryFilter({ type: TransactionType.INCOME, category: name })}
                            />
                        ))}
                    </div>
                </div>
                <div className="bg-brand-surface p-4 rounded-2xl shadow-lg border border-brand-border">
                    <h4 className="font-semibold text-gradient mb-3 px-2">Pengeluaran</h4>
                    <div className="space-y-1">
                        <CategoryButton
                            type={TransactionType.EXPENSE}
                            categoryName="Semua"
                            amount={allExpenseTotal}
                            isActive={categoryFilter.type === TransactionType.EXPENSE && categoryFilter.category === 'Semua'}
                            onClick={() => setCategoryFilter({ type: TransactionType.EXPENSE, category: 'Semua' })}
                        />
                        {Object.entries(categoryTotals.expense).map(([name, amount]: [string, number]) => (
                            <CategoryButton
                                key={name}
                                type={TransactionType.EXPENSE}
                                categoryName={name}
                                amount={amount}
                                isActive={categoryFilter.type === TransactionType.EXPENSE && categoryFilter.category === name}
                                onClick={() => setCategoryFilter({ type: TransactionType.EXPENSE, category: name })}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Main Content */}
            <div className="lg:col-span-3 bg-brand-surface p-4 sm:p-6 rounded-2xl shadow-lg border border-brand-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4 items-end">
                    <input
                        name="searchTerm"
                        value={filters.searchTerm}
                        onChange={handleFilterChange}
                        placeholder="Cari deskripsi, kategori..."
                        className="input-field !rounded-lg !border p-2 md:p-2.5 sm:col-span-2 md:col-span-1 text-sm"
                    />
                    <input
                        name="dateFrom"
                        value={filters.dateFrom}
                        onChange={handleFilterChange}
                        type="date"
                        className="input-field !rounded-lg !border p-2 md:p-2.5 text-sm"
                        title="Dari Tanggal"
                    />
                    <input
                        name="dateTo"
                        value={filters.dateTo}
                        onChange={handleFilterChange}
                        type="date"
                        className="input-field !rounded-lg !border p-2 md:p-2.5 text-sm"
                        title="Sampai Tanggal"
                    />
                    <div className="non-printable flex md:justify-end sm:col-span-2 md:col-span-1">
                        <button
                            onClick={handleDownloadTransactionsCSV}
                            className="button-secondary inline-flex items-center justify-center gap-2 w-full md:w-auto min-h-[40px] text-xs sm:text-sm font-semibold"
                        >
                            <DownloadIcon className="w-4 h-4 flex-shrink-0" /> Unduh CSV
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-brand-bg rounded-xl">
                    <div>
                        <p className="text-sm text-brand-text-secondary">Total Pemasukan (Filter)</p>
                        <p className="text-lg font-bold text-brand-success">{formatCurrency(filteredSummary.income)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-brand-text-secondary">Total Pengeluaran (Filter)</p>
                        <p className="text-lg font-bold text-brand-danger">{formatCurrency(filteredSummary.expense)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-brand-text-secondary">Laba/Rugi Bersih (Filter)</p>
                        <p className="text-lg font-bold text-brand-text-light">{formatCurrency(filteredSummary.net)}</p>
                    </div>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                    {filteredTransactions.map(t => {
                        const subDescription = getTransactionSubDescription(t);
                        return (
                            <div key={t.id} className="rounded-2xl bg-white/5 border border-brand-border p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-brand-text-light leading-tight">{t.description}</p>
                                        {subDescription && <p className="text-xs text-brand-text-secondary mt-0.5">{subDescription}</p>}
                                        <p className="text-[11px] text-brand-text-secondary mt-1">
                                            {new Date(t.date).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={`text-sm font-bold ${
                                                t.type === TransactionType.INCOME ? 'text-brand-success' : 'text-brand-danger'
                                            }`}
                                        >
                                            {formatCurrency(t.amount)}
                                        </p>
                                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full bg-brand-bg text-brand-text-primary">
                                            {t.category || '-'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onOpenModal('transaction', 'edit', t); }}
                                        className="btn-box-edit text-xs px-3 py-1.5"
                                        title="Edit Transaksi"
                                        aria-label={`Edit transaksi ${t.description}`}
                                    >
                                        <PencilIcon className="w-3.5 h-3.5 flex-shrink-0" /> Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteTransaction(t.id); }}
                                        className="btn-box-delete text-xs px-3 py-1.5"
                                        title="Hapus Transaksi"
                                        aria-label={`Hapus transaksi ${t.description}`}
                                    >
                                        <Trash2Icon className="w-3.5 h-3.5 flex-shrink-0 text-white" /> Hapus
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {filteredTransactions.length === 0 && (
                        <p className="text-center py-10 text-brand-text-secondary">Tidak ada transaksi yang cocok.</p>
                    )}
                </div>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-brand-text-secondary uppercase">
                            <tr>
                                <th className="p-3 text-center w-12">No</th>
                                <th className="p-3 text-left">Tanggal</th>
                                <th className="p-3 text-left">Deskripsi</th>
                                <th className="p-3 text-left">Kategori</th>
                                <th className="p-3 text-right">Jumlah</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {filteredTransactions.map((t, index) => {
                                const subDescription = getTransactionSubDescription(t);
                                return (
                                    <tr key={t.id} className="hover:bg-brand-bg">
                                        <td className="p-3 text-center text-brand-text-secondary font-medium">{index + 1}</td>
                                        <td className="p-3">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                        <td className="p-3">
                                            <p className="font-semibold text-brand-text-light">{t.description}</p>
                                            {subDescription && <p className="text-xs text-brand-text-secondary">{subDescription}</p>}
                                        </td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 text-xs bg-brand-bg text-brand-text-primary rounded-full">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td
                                            className={`p-3 text-right font-semibold ${
                                                t.type === TransactionType.INCOME ? 'text-brand-success' : 'text-brand-danger'
                                            }`}
                                        >
                                            {formatCurrency(t.amount)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center space-x-1.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onOpenModal('transaction', 'edit', t); }}
                                                    className="btn-box-edit w-8 h-8 rounded-lg"
                                                    title="Edit Transaksi"
                                                >
                                                    <PencilIcon className="w-4 h-4 flex-shrink-0" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteTransaction(t.id); }}
                                                    className="btn-box-delete w-8 h-8 rounded-lg"
                                                    title="Hapus Transaksi"
                                                >
                                                    <Trash2Icon className="w-4 h-4 text-white flex-shrink-0" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (
                        <p className="text-center py-10 text-brand-text-secondary">Tidak ada transaksi yang cocok.</p>
                    )}
                </div>

                {hasMore && filteredTransactions.length >= 10 && (
                    <div className="mt-8 flex justify-center pb-4">
                        <button
                            onClick={loadMoreTransactions}
                            disabled={isLoadingMore}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary hover:bg-brand-surface transition-all disabled:opacity-50"
                        >
                            {isLoadingMore ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <ArrowDownIcon className="w-4 h-4" />
                                    Muat Lebih Banyak
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionsTab;
