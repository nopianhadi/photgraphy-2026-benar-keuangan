import React from 'react';
import { Transaction, Profile } from '../../../types';
import StatCard from '../../../shared/ui/StatCard';
import DonutChart from '../../../shared/ui/DonutChart';
import TransactionTable from './TransactionTable';
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon } from '../../../constants';
import { formatCurrency } from '../../../utils/currency';

export interface GeneralFinancialReportMetrics {
    reportIncome: number;
    reportExpense: number;
    incomeDonut: { label: string; value: number; color: string }[];
    expenseDonut: { label: string; value: number; color: string }[];
}

interface GeneralFinancialReportProps {
    metrics: GeneralFinancialReportMetrics;
    transactions: Transaction[];
    periodText: string;
    profile: Profile;
}

const GeneralFinancialReport: React.FC<GeneralFinancialReportProps> = ({
    metrics,
    transactions,
    periodText,
    profile
}) => (
    <div className="printable-report space-y-6">
        {/* Print Header */}
        <div className="hidden print:block text-black mb-6">
            <h1 className="text-xl font-bold">{profile.companyName}</h1>
            <p className="text-sm">{profile.address}</p>
            <div className="mt-4 pt-4 border-t-2 border-black">
                <h2>Laporan Keuangan Umum</h2>
                <p>Periode: {periodText}</p>
            </div>
        </div>

        {/* Screen Header */}
        <div className="print:hidden">
            <h2 className="text-2xl font-bold mb-2 text-gradient">Laporan Keuangan Umum</h2>
            <p className="mb-6 text-brand-text-primary">Periode: {periodText}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 StatCard-container">
            <StatCard icon={<ArrowUpIcon className="w-6 h-6" />} title="Total Pemasukan" value={formatCurrency(metrics.reportIncome)} subtitle="Pemasukan periode ini" colorVariant="green" />
            <StatCard icon={<ArrowDownIcon className="w-6 h-6" />} title="Total Pengeluaran" value={formatCurrency(metrics.reportExpense)} subtitle="Pengeluaran periode ini" colorVariant="pink" />
            <StatCard icon={<DollarSignIcon className="w-6 h-6" />} title="Laba / Rugi Bersih" value={formatCurrency(metrics.reportIncome - metrics.reportExpense)} subtitle="Selisih pemasukan & pengeluaran" colorVariant="blue" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 charts-container">
            <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border chart-wrapper"><h3 className="text-lg font-bold text-gradient mb-4">Analisis Pemasukan</h3><DonutChart data={metrics.incomeDonut} /></div>
            <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border chart-wrapper"><h3 className="text-lg font-bold text-gradient mb-4">Analisis Pengeluaran</h3><DonutChart data={metrics.expenseDonut} /></div>
        </div>
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg mt-6 border border-brand-border">
            <h3 className="text-lg font-bold text-gradient mb-4">Rincian Semua Transaksi</h3>
            <div className="overflow-x-auto max-h-[500px] print:max-h-none print:overflow-visible"><TransactionTable transactions={transactions} /></div>
        </div>
    </div>
);

export default GeneralFinancialReport;
