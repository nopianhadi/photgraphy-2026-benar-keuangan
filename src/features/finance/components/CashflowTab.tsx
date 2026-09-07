import React from 'react';
import StatCard from '../../../shared/ui/StatCard';
import InteractiveCashflowChart from '../../../shared/ui/InteractiveCashflowChart';
import DonutChart from '../../../shared/ui/DonutChart';
import { formatCurrency } from '../../../utils/currency';
import { DollarSignIcon, TrendingUpIcon, TrendingDownIcon } from '../../../constants';

const ShieldIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);

interface CashflowMetrics {
    runway: string;
    avgIncome: number;
    avgExpense: number;
    burnRate: number;
}

interface CashflowChartItem {
    label: string;
    income: number;
    expense: number;
    balance: number;
}

interface CashflowTabProps {
    cashflowMetrics: CashflowMetrics;
    filteredSummary: { net: number };
    cashflowChartData: CashflowChartItem[];
    expenseDonutData: any[];
}

const CashflowTab: React.FC<CashflowTabProps> = ({
    cashflowMetrics,
    filteredSummary,
    cashflowChartData,
    expenseDonutData
}) => {
    return (
        <div className="space-y-6 widget-animate">
            {/* Mobile summary */}
            <div className="md:hidden grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                    <p className="text-xs text-brand-text-secondary">Runway</p>
                    <p className="font-semibold">{cashflowMetrics.runway}</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                    <p className="text-xs text-brand-text-secondary">Laba/Rugi</p>
                    <p className="font-semibold">{formatCurrency(filteredSummary.net)}</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                    <p className="text-xs text-brand-text-secondary">Avg Pemasukan/bln</p>
                    <p className="font-semibold">{formatCurrency(cashflowMetrics.avgIncome)}</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                    <p className="text-xs text-brand-text-secondary">Avg Pengeluaran/bln</p>
                    <p className="font-semibold">{formatCurrency(cashflowMetrics.avgExpense)}</p>
                </div>
            </div>
            {/* Desktop summary */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<ShieldIcon className="w-6 h-6" />}
                    title="Ketahanan Keuangan (Runway)"
                    value={cashflowMetrics.runway}
                    subtitle={`Estimasi operasional berdasarkan burn rate. Burn Rate: ${formatCurrency(cashflowMetrics.burnRate)}/bln`}
                    colorVariant="orange"
                />
                <StatCard
                    icon={<DollarSignIcon className="w-6 h-6" />}
                    title="Total Laba/Rugi"
                    value={formatCurrency(filteredSummary.net)}
                    subtitle="Berdasarkan filter transaksi saat ini"
                    colorVariant="purple"
                />
                <StatCard
                    icon={<TrendingUpIcon className="w-6 h-6" />}
                    title="Rata-rata Pemasukan/bln"
                    value={formatCurrency(cashflowMetrics.avgIncome)}
                    subtitle="Selama periode data tersedia"
                    colorVariant="green"
                />
                <StatCard
                    icon={<TrendingDownIcon className="w-6 h-6" />}
                    title="Rata-rata Pengeluaran/bln"
                    value={formatCurrency(cashflowMetrics.avgExpense)}
                    subtitle="Selama periode data tersedia"
                    colorVariant="pink"
                />
            </div>
            {/* Mobile month cards */}
            <div className="md:hidden space-y-3">
                {cashflowChartData.map(d => (
                    <div key={d.label} className="rounded-2xl bg-white/5 border border-brand-border p-4 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-brand-text-light">{d.label}</p>
                            <p className="text-[11px] text-brand-text-secondary">{formatCurrency(d.income)} • {formatCurrency(d.expense)}</p>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold text-sm ${d.income - d.expense >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                                {formatCurrency(d.income - d.expense)}
                            </p>
                            <p className="text-xs text-brand-text-secondary">Saldo {formatCurrency(d.balance)}</p>
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop charts & table */}
            <div className="hidden md:grid grid-cols-2 gap-6">
                <div className="col-span-2 bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border">
                    <h4 className="text-lg font-bold text-gradient mb-4">Grafik Arus Kas</h4>
                    <InteractiveCashflowChart data={cashflowChartData} />
                </div>
                <div className="col-span-2 bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border">
                    <h4 className="text-lg font-bold text-gradient mb-4">Pengeluaran per Kategori</h4>
                    <DonutChart data={expenseDonutData} />
                </div>
            </div>
            <div className="hidden md:block bg-brand-surface p-6 rounded-2xl shadow-lg mt-6 border border-brand-border">
                <h4 className="text-lg font-bold text-gradient mb-4">Data Arus Kas Bulanan</h4>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase print-bg-slate bg-brand-input">
                            <tr className="print-text-black">
                                <th className="p-3 text-center w-12">No</th>
                                <th className="p-3 text-left">Periode</th>
                                <th className="p-3 text-right">Pemasukan</th>
                                <th className="p-3 text-right">Pengeluaran</th>
                                <th className="p-3 text-right">Laba/Rugi</th>
                                <th className="p-3 text-right">Saldo Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {cashflowChartData.map((d, index) => (
                                <tr key={d.label}>
                                    <td className="p-3 text-center text-brand-text-secondary font-medium">{index + 1}</td>
                                    <td className="p-3 font-semibold">{d.label}</td>
                                    <td className="p-3 text-right text-brand-success">{formatCurrency(d.income)}</td>
                                    <td className="p-3 text-right text-brand-danger">{formatCurrency(d.expense)}</td>
                                    <td className={`p-3 text-right font-semibold ${d.income - d.expense >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                                        {formatCurrency(d.income - d.expense)}
                                    </td>
                                    <td className="p-3 text-right font-bold text-brand-text-light">{formatCurrency(d.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CashflowTab;
