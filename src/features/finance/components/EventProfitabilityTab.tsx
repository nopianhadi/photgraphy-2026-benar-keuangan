import React from 'react';
import { Profile, Project } from '../../../types';
import StatCard from '../../../shared/ui/StatCard';
import { formatCurrency } from '../../../utils/currency';
import {
    DollarSignIcon,
    UsersIcon,
    TrendingUpIcon,
    TargetIcon,
    DownloadIcon,
    PrinterIcon
} from '../../../constants';

interface ProfitReportFilters {
    year: number;
    month: number;
}

interface ProfitReportMetrics {
    totalProfit: number;
    avgProfit: number;
    mostProfitableClient: string;
    profitableProjectsCount: number;
}

interface EventProfitabilityTabProps {
    profitReportFilters: ProfitReportFilters;
    setProfitReportFilters: React.Dispatch<React.SetStateAction<ProfitReportFilters>>;
    profitReportMetrics: ProfitReportMetrics;
    projectProfitabilityData: any[];
    projects: Project[];
    profile: Profile;
    handleDownloadProfitReportCSV: () => void;
}

const EventProfitabilityTab: React.FC<EventProfitabilityTabProps> = ({
    profitReportFilters,
    setProfitReportFilters,
    profitReportMetrics,
    projectProfitabilityData,
    projects,
    profile,
    handleDownloadProfitReportCSV
}) => {
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        name: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
    }));

    const yearOptions: number[] = Array.from(
        new Set<number>(projects.map(p => new Date(p.date).getFullYear()))
    ).sort((a: number, b: number) => b - a);

    const currentMonthName = monthOptions.find(m => m.value === profitReportFilters.month)?.name;

    return (
        <div className="space-y-6 printable-area widget-animate">
            <div className="bg-brand-surface p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center non-printable border border-brand-border">
                <h4 className="text-md font-semibold text-gradient whitespace-nowrap">Filter Laporan Laba:</h4>
                <select
                    name="year"
                    value={profitReportFilters.year}
                    onChange={e => setProfitReportFilters(p => ({ ...p, year: Number(e.target.value) }))}
                    className="input-field !rounded-lg !border p-2.5 w-full md:w-auto"
                >
                    {yearOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                <select
                    name="month"
                    value={profitReportFilters.month}
                    onChange={e => setProfitReportFilters(p => ({ ...p, month: Number(e.target.value) }))}
                    className="input-field !rounded-lg !border p-2.5 w-full md:w-auto"
                >
                    {monthOptions.map(m => (
                        <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                </select>
                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={handleDownloadProfitReportCSV}
                        className="button-secondary inline-flex items-center gap-2"
                    >
                        <DownloadIcon className="w-5 h-5" />Unduh CSV
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="button-primary inline-flex items-center gap-2"
                    >
                        <PrinterIcon className="w-5 h-5" />Cetak PDF
                    </button>
                </div>
            </div>

            {/* Mobile summary + list */}
            <div className="md:hidden space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                        <p className="text-[11px] text-brand-text-secondary">Total Laba</p>
                        <p className="font-semibold">{formatCurrency(profitReportMetrics.totalProfit)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-brand-border p-3">
                        <p className="text-[11px] text-brand-text-secondary">Avg/Acara Pernikahan</p>
                        <p className="font-semibold">{formatCurrency(profitReportMetrics.avgProfit)}</p>
                    </div>
                </div>
                <div className="rounded-2xl bg-white/5 border border-brand-border p-4">
                    <h4 className="font-semibold mb-2">Laba per Pengantin</h4>
                    <div className="space-y-2">
                        {projectProfitabilityData.map(d => (
                            <div key={d!.clientId} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-medium">{d!.clientName}</p>
                                    <p className="text-[11px] text-brand-text-secondary">
                                        Income {formatCurrency(d!.totalIncome)} • Cost {formatCurrency(d!.totalCost)}
                                    </p>
                                </div>
                                <p className={`font-semibold ${d!.profit >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                                    {formatCurrency(d!.profit)}
                                </p>
                            </div>
                        ))}
                        {projectProfitabilityData.length === 0 && (
                            <p className="text-sm text-brand-text-secondary">Tidak ada data untuk periode ini.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop summary + printable */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 non-printable">
                <StatCard
                    icon={<DollarSignIcon className="w-6 h-6" />}
                    title="Total Laba Periode Ini"
                    value={formatCurrency(profitReportMetrics.totalProfit)}
                    colorVariant="blue"
                />
                <StatCard
                    icon={<UsersIcon className="w-6 h-6" />}
                    title="Pengantin Paling Profit"
                    value={profitReportMetrics.mostProfitableClient}
                    colorVariant="green"
                />
                <StatCard
                    icon={<TrendingUpIcon className="w-6 h-6" />}
                    title="Jumlah Acara Pernikahan Profit"
                    value={`${profitReportMetrics.profitableProjectsCount} dari ${projectProfitabilityData.length}`}
                    colorVariant="orange"
                />
                <StatCard
                    icon={<TargetIcon className="w-6 h-6" />}
                    title="Rata-rata Laba/Acara Pernikahan"
                    value={formatCurrency(profitReportMetrics.avgProfit)}
                    colorVariant="purple"
                />
            </div>

            <div className="printable-report hidden md:block">
                <div className="hidden print:block text-black mb-6">
                    <h1 className="text-xl font-bold">{profile.companyName}</h1>
                    <p className="text-sm">{profile.address}</p>
                    <div className="mt-4 pt-4 border-t-2 border-black">
                        <h2>Laporan Laba per Pengantin</h2>
                        <p>Periode: {currentMonthName} {profitReportFilters.year}</p>
                    </div>
                </div>
                <div className="bg-brand-surface p-6 rounded-2xl shadow-lg mt-6 border border-brand-border print:shadow-none print:border-none print:p-0 print:mt-0">
                    <div className="print:hidden">
                        <h3 className="text-lg font-bold mb-2 text-gradient">Laporan Laba per Pengantin</h3>
                        <p className="text-sm text-brand-text-primary mb-4">
                            Menampilkan profitabilitas untuk Acara Pernikahan yang dieksekusi pada <strong>{currentMonthName} {profitReportFilters.year}</strong>.
                        </p>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] print:max-h-none print:overflow-visible">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase print-bg-slate bg-brand-input">
                                <tr className="print-text-black">
                                    <th className="p-3 text-center w-12">No</th>
                                    <th className="p-3 text-left">Pelanggan</th>
                                    <th className="p-3 text-right">Harga Package</th>
                                    <th className="p-3 text-right">Biaya Tambahan</th>
                                    <th className="p-3 text-right">Transport</th>
                                    <th className="p-3 text-right">Total Tagihan</th>
                                    <th className="p-3 text-right">Total Terbayar</th>
                                    <th className="p-3 text-right">Biaya Produksi</th>
                                    <th className="p-3 text-right">Laba Bersih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {projectProfitabilityData.map((data, index) => {
                                    const totalTagihan = (data as any).totalPackageRevenue + (data as any).totalCustomCosts + (data as any).totalTransportCosts;
                                    return (
                                        <tr key={data!.clientId}>
                                            <td className="p-3 text-center text-brand-text-secondary font-medium">{index + 1}</td>
                                            <td className="p-3">
                                                <p className="font-semibold text-brand-text-light">{data!.clientName}</p>
                                                <p className="text-[10px] text-brand-text-secondary font-mono">
                                                    {(data as any).projects.map((p: any) => p.packageName).join(', ')}
                                                </p>
                                            </td>
                                            <td className="p-3 text-right text-brand-text-secondary">
                                                {formatCurrency((data as any).totalPackageRevenue)}
                                            </td>
                                            <td className="p-3 text-right text-orange-800 font-medium">
                                                +{formatCurrency((data as any).totalCustomCosts)}
                                            </td>
                                            <td className="p-3 text-right text-brand-text-secondary">
                                                {formatCurrency((data as any).totalTransportCosts)}
                                            </td>
                                            <td className="p-3 text-right font-bold text-brand-text-primary">
                                                {formatCurrency(totalTagihan)}
                                            </td>
                                            <td className="p-3 text-right text-brand-success font-semibold">
                                                {formatCurrency(data!.totalIncome)}
                                            </td>
                                            <td className="p-3 text-right text-brand-danger">
                                                {formatCurrency(data!.totalCost)}
                                            </td>
                                            <td className={`p-3 text-right font-black ${data!.profit >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                                                {formatCurrency(data!.profit)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {projectProfitabilityData.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center p-8 text-brand-text-secondary">
                                            Tidak ada data Acara Pernikahan untuk periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventProfitabilityTab;
