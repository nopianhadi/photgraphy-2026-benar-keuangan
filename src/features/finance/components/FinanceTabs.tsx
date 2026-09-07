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

const ChartToggleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M7 13l3-4 3 3 3-5" />
    </svg>
);

export const FinanceTabs: React.FC<FinanceTabsProps> = ({
    activeTab,
    setActiveTab,
    showVisualSummary,
    setShowVisualSummary
}) => {
    const tabs = [
        { id: 'transactions',          label: 'Transaksi',          shortLabel: 'Transaksi',  icon: FileTextIcon },
        { id: 'pockets',               label: 'Kantong',            shortLabel: 'Kantong',    icon: ClipboardListIcon },
        { id: 'cards',                 label: 'Kartu Saya',         shortLabel: 'Kartu',      icon: CreditCardIcon },
        { id: 'cashflow',              label: 'Arus Kas',           shortLabel: 'Arus Kas',   icon: TrendingUpIcon },
        { id: 'laporan',               label: 'Laporan Umum',       shortLabel: 'Laporan',    icon: BarChart2Icon },
        { id: 'laporanKartu',          label: 'Laporan Kartu',      shortLabel: 'Lap. Kartu', icon: CreditCardIcon },
        { id: 'labaAcara Pernikahan',  label: 'Laba Acara',         shortLabel: 'Laba',       icon: DollarSignIcon },
    ];

    return (
        <div className="non-printable">
            {/* ── Shared scrollable pill row (all breakpoints) ───────────────── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide
                            bg-brand-surface rounded-2xl border border-brand-border
                            px-2 py-2 shadow-sm">

                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                shrink-0 inline-flex items-center gap-1.5
                                px-3 py-2 rounded-xl
                                font-semibold text-xs sm:text-sm
                                transition-all duration-200
                                ${isActive
                                    ? 'bg-brand-accent text-white shadow-md shadow-blue-500/25'
                                    : 'text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text-light'
                                }
                            `}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {/* Full label on md+, short label on mobile */}
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.shortLabel}</span>
                        </button>
                    );
                })}

                {/* Spacer pushes toggle to the far right */}
                <div className="flex-1 min-w-[8px]" />

                {/* Graph toggle — always visible inside the pill bar */}
                <button
                    onClick={() => setShowVisualSummary(!showVisualSummary)}
                    title={showVisualSummary ? 'Sembunyikan Grafik' : 'Tampilkan Grafik Ringkasan'}
                    className={`
                        shrink-0 inline-flex items-center gap-1.5
                        px-3 py-2 rounded-xl
                        font-semibold text-xs
                        border transition-all duration-200
                        ${showVisualSummary
                            ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-700'
                            : 'bg-brand-bg border-brand-border text-brand-text-secondary hover:text-brand-text-light hover:bg-brand-surface'
                        }
                    `}
                >
                    <ChartToggleIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden md:inline">
                        {showVisualSummary ? 'Tutup Grafik' : 'Grafik'}
                    </span>
                </button>
            </div>
        </div>
    );
};
