import React from 'react';
import StatCard from '../../../shared/ui/StatCard';
import { CreditCardIcon, ClipboardListIcon, ArrowUpIcon, ArrowDownIcon } from '../../../constants';
import { formatCurrency } from '../../../utils/currency';

const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="3" x2="12" y2="21" />
        <path d="M3 9l9-6 9 6" />
        <path d="M3 14h6l-3 5-3-5z" />
        <path d="M15 14h6l-3 5-3-5z" />
    </svg>
);

interface FinanceHeaderStatsProps {
    summary: {
        totalAssets: number;
        pocketsTotal: number;
        totalIncomeThisMonth: number;
        totalExpenseThisMonth: number;
    };
    /** All-time totals computed from full transactions list */
    allTimeTotals: {
        income: number;
        expense: number;
    };
    setActiveStatModal: (type: 'assets' | 'pockets' | 'income' | 'expense' | null) => void;
}

export const FinanceHeaderStats: React.FC<FinanceHeaderStatsProps> = ({
    summary,
    allTimeTotals,
    setActiveStatModal,
}) => {
    const netAllTime = allTimeTotals.income - allTimeTotals.expense;
    const isProfit = netAllTime >= 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 non-printable">

            {/* 1. Total Aset */}
            <div className="widget-animate cursor-pointer" style={{ animationDelay: '100ms' }}
                onClick={() => setActiveStatModal('assets')}>
                <StatCard
                    icon={<CreditCardIcon className="w-6 h-6" />}
                    title="Total Aset"
                    value={formatCurrency(summary.totalAssets)}
                    subtitle="Saldo semua kartu & tunai"
                    colorVariant="blue"
                />
            </div>

            {/* 2. Dana di Kantong */}
            <div className="widget-animate cursor-pointer" style={{ animationDelay: '150ms' }}
                onClick={() => setActiveStatModal('pockets')}>
                <StatCard
                    icon={<ClipboardListIcon className="w-6 h-6" />}
                    title="Dana di Kantong"
                    value={formatCurrency(summary.pocketsTotal)}
                    subtitle="Total alokasi kantong"
                    colorVariant="purple"
                />
            </div>

            {/* 3. Total Pemasukan (all-time) */}
            <div className="widget-animate cursor-pointer" style={{ animationDelay: '200ms' }}
                onClick={() => setActiveStatModal('income')}>
                <StatCard
                    icon={<ArrowUpIcon className="w-6 h-6" />}
                    title="Total Pemasukan"
                    value={formatCurrency(allTimeTotals.income)}
                    subtitle="Keseluruhan pemasukan"
                    colorVariant="green"
                    changeType="increase"
                />
            </div>

            {/* 4. Total Pengeluaran (all-time) */}
            <div className="widget-animate cursor-pointer" style={{ animationDelay: '250ms' }}
                onClick={() => setActiveStatModal('expense')}>
                <StatCard
                    icon={<ArrowDownIcon className="w-6 h-6" />}
                    title="Total Pengeluaran"
                    value={formatCurrency(allTimeTotals.expense)}
                    subtitle="Keseluruhan pengeluaran"
                    colorVariant="red"
                    changeType="decrease"
                />
            </div>

            {/* 5. Laba / Rugi Bersih (all-time) — full width on 2-col mobile */}
            <div className="widget-animate col-span-2 lg:col-span-1" style={{ animationDelay: '300ms' }}>
                <StatCard
                    icon={<ScaleIcon className="w-6 h-6" />}
                    title="Laba / Rugi Bersih"
                    value={formatCurrency(netAllTime)}
                    subtitle={isProfit ? 'Surplus keseluruhan 🎉' : 'Defisit keseluruhan ⚠️'}
                    colorVariant={isProfit ? 'green' : 'red'}
                    change={isProfit ? '+' + formatCurrency(netAllTime) : formatCurrency(netAllTime)}
                    changeType={isProfit ? 'increase' : 'decrease'}
                />
            </div>
        </div>
    );
};
