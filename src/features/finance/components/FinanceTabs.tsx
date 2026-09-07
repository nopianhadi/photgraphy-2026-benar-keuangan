import React from 'react';
import { 
    FileTextIcon, ClipboardListIcon, CreditCardIcon, TrendingUpIcon, 
    BarChart2Icon, DollarSignIcon 
} from '../../../constants';

interface FinanceTabsProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    showVisualSummary: boolean;
    setShowVisualSummary: (show: boolean) => void;
}

export const FinanceTabs: React.FC<FinanceTabsProps> = ({ 
    activeTab, 
    setActiveTab, 
    showVisualSummary, 
    setShowVisualSummary 
}) => {
    const tabs = [
        { id: 'transactions', label: 'Transaksi', icon: FileTextIcon },
        { id: 'pockets', label: 'Kantong', icon: ClipboardListIcon },
        { id: 'cards', label: 'Kartu Saya', icon: CreditCardIcon },
        { id: 'cashflow', label: 'Arus Kas', icon: TrendingUpIcon },
        { id: 'laporan', label: 'Laporan Umum', icon: BarChart2Icon },
        { id: 'laporanKartu', label: 'Laporan Kartu', icon: CreditCardIcon },
        { id: 'labaAcara Pernikahan', label: 'Laba Acara Pernikahan', icon: DollarSignIcon },
    ];

    return (
        <div className="flex items-center justify-between border-b border-brand-border mb-6 non-printable">
            <nav className="-mb-px flex space-x-6 overflow-x-auto pb-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 inline-flex items-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 border-b-2 ${
                                isActive 
                                    ? 'border-blue-600 text-blue-800 bg-blue-100' 
                                    : 'border-transparent text-blue-700 bg-blue-50 hover:bg-blue-100'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
            <button
                onClick={() => setShowVisualSummary(!showVisualSummary)}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    showVisualSummary 
                        ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' 
                        : 'bg-brand-surface border-brand-border text-brand-text-secondary hover:text-brand-text-light'
                }`}
            >
                <TrendingUpIcon className="w-3.5 h-3.5" />
                <span>{showVisualSummary ? 'Sembunyikan Grafik' : 'Lihat Ringkasan Grafik'}</span>
            </button>
        </div>
    );
};
