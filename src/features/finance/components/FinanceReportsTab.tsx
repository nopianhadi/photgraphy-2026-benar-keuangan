import React from 'react';
import { Profile, Project, Transaction, TransactionType } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { DownloadIcon, PrinterIcon } from '../../../constants';
import ClientProfitabilityReport from './ClientProfitabilityReport';
import GeneralFinancialReport from './GeneralFinancialReport';

export const PRODUCTION_COST_CATEGORIES = [
    "Gaji Tim / Vendor",
    "Transport",
    "Transportasi",
    "Konsumsi",
    "Sewa Tempat",
    "Sewa Alat",
    "Produksi Fisik"
];

interface ReportFilters {
    client: string;
    dateFrom: string;
    dateTo: string;
}

interface ClientOption {
    id: string;
    name: string;
}

interface GeneralReportMetrics {
    reportIncome: number;
    reportExpense: number;
    [key: string]: any;
}

interface FinanceReportsTabProps {
    reportFilters: ReportFilters;
    setReportFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
    reportClientOptions: ClientOption[];
    handleDownloadReportCSV: () => void;
    generalReportMetrics: GeneralReportMetrics | null;
    reportTransactions: Transaction[];
    profile: Profile;
    projects: Project[];
}

const FinanceReportsTab: React.FC<FinanceReportsTabProps> = ({
    reportFilters,
    setReportFilters,
    reportClientOptions,
    handleDownloadReportCSV,
    generalReportMetrics,
    reportTransactions,
    profile,
    projects
}) => {
    return (
        <div className="space-y-6 printable-area widget-animate">
            <div className="bg-brand-surface p-3 sm:p-4 rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center non-printable border border-brand-border">
                <h4 className="text-sm font-semibold text-brand-text-light whitespace-nowrap">Filter Laporan:</h4>
                <select
                    name="client"
                    value={reportFilters.client}
                    onChange={e => setReportFilters(p => ({ ...p, client: e.target.value }))}
                    className="input-field !rounded-lg !border p-2 text-sm w-full md:w-auto"
                >
                    <option value="all">Semua Pengantin</option>
                    {reportClientOptions.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
                    <input
                        type="date"
                        name="dateFrom"
                        value={reportFilters.dateFrom}
                        onChange={e => setReportFilters(p => ({ ...p, dateFrom: e.target.value }))}
                        className="input-field !rounded-lg !border p-2 text-sm w-full"
                        title="Dari Tanggal"
                    />
                    <input
                        type="date"
                        name="dateTo"
                        value={reportFilters.dateTo}
                        onChange={e => setReportFilters(p => ({ ...p, dateTo: e.target.value }))}
                        className="input-field !rounded-lg !border p-2 text-sm w-full"
                        title="Sampai Tanggal"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
                    <button
                        onClick={handleDownloadReportCSV}
                        className="button-secondary inline-flex items-center justify-center gap-2 flex-1 md:flex-none min-h-[40px] text-xs sm:text-sm font-semibold"
                    >
                        <DownloadIcon className="w-4 h-4 flex-shrink-0" />Unduh CSV
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="button-primary inline-flex items-center justify-center gap-2 flex-1 md:flex-none min-h-[40px] text-xs sm:text-sm font-semibold"
                    >
                        <PrinterIcon className="w-4 h-4 flex-shrink-0" />Cetak PDF
                    </button>
                </div>
            </div>

            {/* Mobile simple report */}
            <div className="md:hidden space-y-3">
                {generalReportMetrics && reportFilters.client === 'all' && (
                    <>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                                <p className="text-[11px] text-brand-text-secondary">Income</p>
                                <p className="font-semibold">{formatCurrency(generalReportMetrics.reportIncome)}</p>
                            </div>
                            <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                                <p className="text-[11px] text-brand-text-secondary">Expense</p>
                                <p className="font-semibold">{formatCurrency(generalReportMetrics.reportExpense)}</p>
                            </div>
                            <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                                <p className="text-[11px] text-brand-text-secondary">Net</p>
                                <p className="font-semibold">{formatCurrency(generalReportMetrics.reportIncome - generalReportMetrics.reportExpense)}</p>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-brand-border p-4">
                            <h4 className="font-semibold mb-2">Transaksi</h4>
                            <div className="space-y-2">
                                {reportTransactions.map(t => (
                                    <div key={t.id} className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-medium">{t.description}</p>
                                            <p className="text-[11px] text-brand-text-secondary">
                                                {new Date(t.date).toLocaleDateString('id-ID')} • {t.category}
                                            </p>
                                        </div>
                                        <p className={`font-semibold ${t.type === TransactionType.INCOME ? 'text-brand-success' : 'text-brand-danger'}`}>
                                            {formatCurrency(t.amount)}
                                        </p>
                                    </div>
                                ))}
                                {reportTransactions.length === 0 && <p className="text-sm text-brand-text-secondary">Tidak ada data.</p>}
                            </div>
                        </div>
                    </>
                )}
                {reportFilters.client !== 'all' && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                                <p className="text-[11px] text-brand-text-secondary">Income</p>
                                <p className="font-semibold">
                                    {formatCurrency(reportTransactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0))}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                                <p className="text-[11px] text-brand-text-secondary">Biaya Produksi</p>
                                <p className="font-semibold">
                                    {formatCurrency(reportTransactions.filter(t => t.type === TransactionType.EXPENSE && PRODUCTION_COST_CATEGORIES.includes(t.category)).reduce((s, t) => s + t.amount, 0))}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                                <p className="text-[11px] text-brand-text-secondary">Laba</p>
                                <p className="font-semibold">
                                    {formatCurrency(
                                        reportTransactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0) -
                                        reportTransactions.filter(t => t.type === TransactionType.EXPENSE && PRODUCTION_COST_CATEGORIES.includes(t.category)).reduce((s, t) => s + t.amount, 0)
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-brand-border p-4">
                            <h4 className="font-semibold mb-2">Transaksi</h4>
                            <div className="space-y-2">
                                {reportTransactions.map(t => (
                                    <div key={t.id} className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-medium">{t.description}</p>
                                            <p className="text-[11px] text-brand-text-secondary">
                                                {new Date(t.date).toLocaleDateString('id-ID')} • {t.category}
                                            </p>
                                        </div>
                                        <p className={`font-semibold ${t.type === TransactionType.INCOME ? 'text-brand-success' : 'text-brand-danger'}`}>
                                            {formatCurrency(t.amount)}
                                        </p>
                                    </div>
                                ))}
                                {reportTransactions.length === 0 && <p className="text-sm text-brand-text-secondary">Tidak ada data.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop report */}
            {reportFilters.client !== 'all' ? (
                <div className="hidden md:block">
                    <ClientProfitabilityReport
                        transactions={reportTransactions}
                        clientName={reportClientOptions.find(c => c.id === reportFilters.client)?.name || ''}
                        periodText={`${reportFilters.dateFrom || ''} - ${reportFilters.dateTo || ''}`}
                        profile={profile}
                        projects={projects}
                    />
                </div>
            ) : (
                generalReportMetrics && (
                    <div className="hidden md:block">
                        <GeneralFinancialReport
                            metrics={generalReportMetrics}
                            transactions={reportTransactions}
                            periodText={`${reportFilters.dateFrom || ''} - ${reportFilters.dateTo || ''}`}
                            profile={profile}
                        />
                    </div>
                )
            )}
        </div>
    );
};

export default FinanceReportsTab;
