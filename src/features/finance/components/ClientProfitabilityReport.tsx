import React from 'react';
import { Transaction, TransactionType, Profile, Project } from '../../../types';
import StatCard from '../../../shared/ui/StatCard';
import TransactionTable from './TransactionTable';
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon } from '../../../constants';
import { formatCurrency } from '../../../utils/currency';

const PRODUCTION_COST_CATEGORIES = ["Gaji Tim / Vendor", "Transport", "Transportasi", "Konsumsi", "Sewa Tempat", "Sewa Alat", "Produksi Fisik"];

interface ClientProfitabilityReportProps {
    transactions: Transaction[];
    clientName: string;
    periodText: string;
    profile: Profile;
    projects: Project[];
}

const ClientProfitabilityReport: React.FC<ClientProfitabilityReportProps> = ({
    transactions,
    clientName,
    periodText,
    profile,
    projects
}) => {
    const clientIncome = transactions.filter(t => t.type === TransactionType.INCOME);
    const clientCost = transactions.filter(t => t.type === TransactionType.EXPENSE && PRODUCTION_COST_CATEGORIES.includes(t.category));
    const totalIncome = clientIncome.reduce((sum, t) => sum + t.amount, 0);
    const totalCost = clientCost.reduce((sum, t) => sum + t.amount, 0);
    const profit = totalIncome - totalCost;

    // Breakdown based on project settings
    const relevantProjects = projects.filter(p => transactions.some(t => t.projectId === p.id));
    const baseProjectValue = relevantProjects.reduce((sum, p) => sum + (p.totalCost - (p.customCosts?.reduce((s, c) => s + c.amount, 0) || 0) - (Number(p.transportCost) || 0)), 0);
    const totalCustomCosts = relevantProjects.reduce((sum, p) => sum + (p.customCosts?.reduce((s, c) => s + c.amount, 0) || 0), 0);
    const totalTransportFees = relevantProjects.reduce((sum, p) => sum + (Number(p.transportCost) || 0), 0);

    return (
        <div className="printable-report space-y-6">
            {/* Print Header */}
            <div className="hidden print:block text-black mb-6">
                <h1 className="text-xl font-bold">{profile.companyName}</h1>
                <p className="text-sm">{profile.address}</p>
                <div className="mt-4 pt-4 border-t-2 border-black">
                    <h2>Laporan Profitabilitas Pengantin</h2>
                    <p>Pengantin: {clientName} | Periode: {periodText}</p>
                </div>
            </div>

            {/* Screen Header */}
            <div className="print:hidden">
                <h2 className="text-2xl font-bold mb-2 text-gradient">Laporan Profitabilitas Pengantin</h2>
                <p className="mb-6 text-brand-text-primary">Pengantin: <span className="font-semibold">{clientName}</span> | Periode: {periodText}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 StatCard-container">
                <StatCard icon={<ArrowUpIcon className="w-6 h-6" />} title="Total Pemasukan" value={formatCurrency(totalIncome)} iconBgColor="bg-brand-success/20" iconColor="text-brand-success" />
                <StatCard icon={<ArrowDownIcon className="w-6 h-6" />} title="Total Biaya Produksi" value={formatCurrency(totalCost)} iconBgColor="bg-brand-danger/20" iconColor="text-brand-danger" />
                <StatCard icon={<DollarSignIcon className="w-6 h-6" />} title="Laba Bersih" value={formatCurrency(profit)} />
            </div>

            {/* Project Breakdown Section */}
            <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border">
                <h3 className="text-lg font-bold text-gradient mb-4">Konfigurasi Biaya Proyek</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-brand-bg rounded-xl border border-brand-border/50">
                        <p className="text-xs text-brand-text-secondary uppercase font-bold tracking-wider mb-1">Package Utama</p>
                        <p className="text-xl font-bold text-brand-text-light">{formatCurrency(baseProjectValue)}</p>
                    </div>
                    <div className="p-4 bg-brand-bg rounded-xl border border-brand-border/50">
                        <p className="text-xs text-orange-800 uppercase font-bold tracking-wider mb-1">Biaya Tambahan (Custom)</p>
                        <p className="text-xl font-bold text-orange-800">+{formatCurrency(totalCustomCosts)}</p>
                    </div>
                    <div className="p-4 bg-brand-bg rounded-xl border border-brand-border/50">
                        <p className="text-xs text-brand-text-secondary uppercase font-bold tracking-wider mb-1">Biaya Transport</p>
                        <p className="text-xl font-bold text-brand-text-light">{formatCurrency(totalTransportFees)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border chart-wrapper">
                    <h3 className="text-lg font-bold text-gradient mb-4">Rincian Pemasukan dari Pengantin</h3>
                    <div className="overflow-x-auto max-h-[400px] print:max-h-none print:overflow-visible"><TransactionTable transactions={clientIncome} /></div>
                </div>
                <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border chart-wrapper">
                    <h3 className="text-lg font-bold text-gradient mb-4">Rincian Biaya Produksi</h3>
                    <div className="overflow-x-auto max-h-[400px] print:max-h-none print:overflow-visible"><TransactionTable transactions={clientCost} /></div>
                </div>
            </div>
        </div>
    );
};

export default ClientProfitabilityReport;
