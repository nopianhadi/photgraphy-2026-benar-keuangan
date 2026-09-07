import React from 'react';
import StatCard from '../../../shared/ui/StatCard';
import { CreditCardIcon, ClipboardListIcon, ArrowUpIcon, ArrowDownIcon } from '../../../constants';
import { formatCurrency } from '../../../utils/currency';

interface FinanceHeaderStatsProps {
    summary: { totalAssets: number, pocketsTotal: number, totalIncomeThisMonth: number, totalExpenseThisMonth: number };
    setActiveStatModal: (type: 'assets' | 'pockets' | 'income' | 'expense' | null) => void;
}

export const FinanceHeaderStats: React.FC<FinanceHeaderStatsProps> = ({ summary, setActiveStatModal }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" style={{ animationDelay: '100ms' }} onClick={() => setActiveStatModal('assets')}>
                <StatCard icon={<CreditCardIcon className="w-6 h-6" />} title="Total Aset" value={formatCurrency(summary.totalAssets)} subtitle="Total gabungan saldo di semua kartu & tunai Anda." colorVariant="blue" />
            </div>
            <div className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" style={{ animationDelay: '200ms' }} onClick={() => setActiveStatModal('pockets')}>
                <StatCard icon={<ClipboardListIcon className="w-6 h-6" />} title="Dana di Kantong" value={formatCurrency(summary.pocketsTotal)} subtitle="Total dana yang dialokasikan di semua kantong." colorVariant="purple" />
            </div>
            <div className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" style={{ animationDelay: '300ms' }} onClick={() => setActiveStatModal('income')}>
                <StatCard icon={<ArrowUpIcon className="w-6 h-6" />} title="Pemasukan Bulan Ini" value={formatCurrency(summary.totalIncomeThisMonth)} subtitle="Total pemasukan yang tercatat bulan ini." colorVariant="green" />
            </div>
            <div className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" style={{ animationDelay: '400ms' }} onClick={() => setActiveStatModal('expense')}>
                <StatCard icon={<ArrowDownIcon className="w-6 h-6" />} title="Pengeluaran Bulan Ini" value={formatCurrency(summary.totalExpenseThisMonth)} subtitle="Total pengeluaran yang tercatat bulan ini." colorVariant="red" />
            </div>
        </div>
    );
};
