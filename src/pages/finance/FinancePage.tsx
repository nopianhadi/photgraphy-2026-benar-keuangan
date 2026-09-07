import React, { useState } from 'react';
import {
    Transaction,
    TransactionType,
    FinancialPocket,
    Profile,
    Project,
    Card,
    TeamMember
} from '../../types';

import {
    PlusIcon,
    FileTextIcon,
    ClipboardListIcon,
    CreditCardIcon,
    TrendingUpIcon,
    BarChart2Icon,
    DollarSignIcon
} from '../../constants';

import { FinanceHeaderStats } from '../../features/finance/components/FinanceHeaderStats';
import { FinanceTabs } from '../../features/finance/components/FinanceTabs';
import TransactionsTab from '../../features/finance/components/TransactionsTab';
import PocketsTab from '../../features/finance/components/PocketsTab';
import CardsTab from '../../features/finance/components/CardsTab';
import CashflowTab from '../../features/finance/components/CashflowTab';
import CardReportTab from '../../features/finance/components/CardReportTab';
import FinanceReportsTab from '../../features/finance/components/FinanceReportsTab';
import EventProfitabilityTab from '../../features/finance/components/EventProfitabilityTab';
import FinanceFormModal from '../../features/finance/components/FinanceFormModal';
import FinanceHistoryModal from '../../features/finance/components/FinanceHistoryModal';
import FinanceStatDetailModal from '../../features/finance/components/FinanceStatDetailModal';
import FinanceGuideModal from '../../features/finance/components/FinanceGuideModal';

import { useFinance } from '../../features/finance/hooks/useFinance';
import { useFinanceCalculations } from '../../features/finance/hooks/useFinanceCalculations';
import { useFinanceOperations } from '../../features/finance/hooks/useFinanceOperations';
import {
    getTransactionSubDescription,
    pocketIcons
} from '../../features/finance/utils/financeHelpers';
import {
    downloadReportCSV,
    downloadTransactionsCSV,
    downloadProfitReportCSV
} from '../../features/finance/utils/financeExport';

interface FinanceProps {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    pockets: FinancialPocket[];
    setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    profile: Profile;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    teamMembers: TeamMember[];
}

export type FinanceTabType =
    | 'transactions'
    | 'pockets'
    | 'cards'
    | 'cashflow'
    | 'laporan'
    | 'laporanKartu'
    | 'labaAcara Pernikahan';

const Finance: React.FC<FinanceProps> = ({
    transactions,
    setTransactions,
    pockets,
    setPockets,
    projects,
    setProjects,
    profile,
    cards,
    setCards
}) => {
    const showNotification = (_message: string) => {
        // Notification placeholder to align with app state pattern
    };

    const { handleDelete, handleAddTransaction, handleUpdateTransaction } = useFinance(
        transactions,
        setTransactions,
        pockets,
        setPockets,
        cards,
        setCards,
        showNotification
    );

    // Navigation & Modal State
    const [activeTab, setActiveTab] = useState<FinanceTabType>('transactions');
    const [showVisualSummary, setShowVisualSummary] = useState(false);
    const [historyModalState, setHistoryModalState] = useState<{
        type: 'card' | 'pocket';
        item: Card | FinancialPocket | null;
    } | null>(null);
    const [activeStatModal, setActiveStatModal] = useState<'assets' | 'pockets' | 'income' | 'expense' | null>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    // Filters
    const [filters, setFilters] = useState({ searchTerm: '', dateFrom: '', dateTo: '' });
    const [categoryFilter, setCategoryFilter] = useState<{ type: TransactionType | 'all'; category: string }>({
        type: 'all',
        category: 'Semua'
    });
    const [reportFilters, setReportFilters] = useState({ client: 'all', dateFrom: '', dateTo: '' });
    const [profitReportFilters, setProfitReportFilters] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth()
    });
    const [transactionProjectMonthFilter, setTransactionProjectMonthFilter] = useState<string>(() => {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${now.getFullYear()}-${month}`;
    });

    // Calculations
    const {
        cashflowChartData,
        cashflowMetrics,
        summary,
        thisMonthIncome,
        thisMonthExpense,
        monthlyBudgetPocket,
        categoryTotals,
        filteredTransactions,
        filteredSummary,
        reportClientOptions,
        reportTransactions,
        projectProfitabilityData,
        profitReportMetrics,
        generalReportMetrics,
        cardStats,
        expenseDonutData
    } = useFinanceCalculations({
        transactions,
        cards,
        pockets,
        projects,
        filters,
        categoryFilter,
        reportFilters,
        profitReportFilters
    });

    // Business Operations & Forms
    const {
        modalState,
        isSubmitting,
        form,
        setForm,
        hasMore,
        isLoadingMore,
        loadMoreTransactions,
        handleOpenModal,
        handleCloseModal,
        handleSubmit,
        handleFormChange,
        handleFilterChange,
        handleTutupAnggaran
    } = useFinanceOperations({
        transactions,
        setTransactions,
        pockets,
        setPockets,
        cards,
        setCards,
        projects,
        setProjects,
        handleAddTransaction,
        handleUpdateTransaction,
        showNotification,
        monthlyBudgetPocket,
        setFilters
    });

    const handleDownloadReportCSVClick = () => {
        downloadReportCSV(reportTransactions, reportFilters, reportClientOptions);
    };

    const handleDownloadTransactionsCSVClick = () => {
        downloadTransactionsCSV(filteredTransactions, transactions, filteredSummary);
    };

    const handleDownloadProfitReportCSVClick = () => {
        downloadProfitReportCSV(projectProfitabilityData, profitReportFilters);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'transactions':
                return (
                    <TransactionsTab
                        monthlyBudgetPocket={monthlyBudgetPocket}
                        onTutupAnggaran={handleTutupAnggaran}
                        categoryTotals={categoryTotals}
                        categoryFilter={categoryFilter}
                        setCategoryFilter={setCategoryFilter}
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        handleDownloadTransactionsCSV={handleDownloadTransactionsCSVClick}
                        filteredSummary={filteredSummary}
                        filteredTransactions={filteredTransactions}
                        getTransactionSubDescription={(t) => getTransactionSubDescription(t, cards, pockets, projects)}
                        onOpenModal={handleOpenModal}
                        onDeleteTransaction={(id) => handleDelete('transaction', id)}
                        hasMore={hasMore}
                        loadMoreTransactions={loadMoreTransactions}
                        isLoadingMore={isLoadingMore}
                    />
                );
            case 'pockets':
                return (
                    <PocketsTab
                        pockets={pockets}
                        cards={cards}
                        summary={summary}
                        onOpenModal={handleOpenModal}
                        onDeletePocket={(id) => handleDelete('pocket', id)}
                        onViewHistory={(p) => setHistoryModalState({ type: 'pocket', item: p })}
                    />
                );
            case 'cards':
                return (
                    <CardsTab
                        cards={cards}
                        pockets={pockets}
                        cardStats={cardStats}
                        onOpenModal={handleOpenModal}
                        onDeleteCard={(id) => handleDelete('card', id)}
                        onViewHistory={(card) => setHistoryModalState({ type: 'card', item: card })}
                    />
                );
            case 'cashflow':
                return (
                    <CashflowTab
                        cashflowMetrics={cashflowMetrics}
                        filteredSummary={filteredSummary}
                        cashflowChartData={cashflowChartData}
                        expenseDonutData={expenseDonutData}
                    />
                );
            case 'laporan':
                return (
                    <FinanceReportsTab
                        reportFilters={reportFilters}
                        setReportFilters={setReportFilters}
                        reportClientOptions={reportClientOptions}
                        handleDownloadReportCSV={handleDownloadReportCSVClick}
                        generalReportMetrics={generalReportMetrics}
                        reportTransactions={reportTransactions}
                        profile={profile}
                        projects={projects}
                    />
                );
            case 'laporanKartu':
                return <CardReportTab transactions={transactions} cards={cards} profile={profile} />;
            case 'labaAcara Pernikahan':
                return (
                    <EventProfitabilityTab
                        profitReportFilters={profitReportFilters}
                        setProfitReportFilters={setProfitReportFilters}
                        profitReportMetrics={profitReportMetrics}
                        projectProfitabilityData={projectProfitabilityData}
                        projects={projects}
                        profile={profile}
                        handleDownloadProfitReportCSV={handleDownloadProfitReportCSVClick}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center gap-2 non-printable">
                <button
                    onClick={() => handleOpenModal('transaction', 'add')}
                    className="btn-box-add inline-flex items-center gap-2 text-sm px-3.5 py-2 font-semibold"
                >
                    <PlusIcon className="w-4 h-4 flex-shrink-0" />
                    Tambah Transaksi
                </button>
            </div>

            <FinanceHeaderStats summary={summary} setActiveStatModal={setActiveStatModal} />

            <FinanceTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                showVisualSummary={showVisualSummary}
                setShowVisualSummary={setShowVisualSummary}
            />

            {/* Optional Collapsible Visual Summary */}
            {showVisualSummary && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 rounded-2xl bg-brand-bg/60 border border-brand-border mb-6 animate-fade-in">
                    <p className="text-sm text-brand-text-secondary italic">
                        Ringkasan visual dan grafik akan muncul di sini.
                    </p>
                </div>
            )}

            {/* Mobile Tab Navigation - Horizontal Scrollable Navigation */}
            <div className="md:hidden non-printable widget-animate mb-4" style={{ animationDelay: '500ms' }}>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs sm:text-sm min-h-[38px] transition-all duration-300 border-b-2 ${
                            activeTab === 'transactions'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-brand-text-secondary hover:text-blue-600'
                        }`}
                    >
                        <FileTextIcon className="w-4 h-4 flex-shrink-0" />
                        <span>Transaksi</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pockets')}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs sm:text-sm min-h-[38px] transition-all duration-300 border-b-2 ${
                            activeTab === 'pockets'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-brand-text-secondary hover:text-blue-600'
                        }`}
                    >
                        <ClipboardListIcon className="w-4 h-4 flex-shrink-0" />
                        <span>Kantong</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs sm:text-sm min-h-[38px] transition-all duration-300 border-b-2 ${
                            activeTab === 'cards'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-brand-text-secondary hover:text-blue-600'
                        }`}
                    >
                        <CreditCardIcon className="w-4 h-4 flex-shrink-0" />
                        <span>Kartu</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cashflow')}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs sm:text-sm min-h-[38px] transition-all duration-300 border-b-2 ${
                            activeTab === 'cashflow'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-brand-text-secondary hover:text-blue-600'
                        }`}
                    >
                        <TrendingUpIcon className="w-4 h-4 flex-shrink-0" />
                        <span>Arus Kas</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('laporan')}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs sm:text-sm min-h-[38px] transition-all duration-300 border-b-2 ${
                            activeTab === 'laporan'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-brand-text-secondary hover:text-blue-600'
                        }`}
                    >
                        <BarChart2Icon className="w-4 h-4 flex-shrink-0" />
                        <span>Laporan</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('laporanKartu')}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs sm:text-sm min-h-[38px] transition-all duration-300 border-b-2 ${
                            activeTab === 'laporanKartu'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-brand-text-secondary hover:text-blue-600'
                        }`}
                    >
                        <CreditCardIcon className="w-4 h-4 flex-shrink-0" />
                        <span>Lap. Kartu</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('labaAcara Pernikahan')}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs sm:text-sm min-h-[38px] transition-all duration-300 border-b-2 ${
                            activeTab === 'labaAcara Pernikahan'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-brand-text-secondary hover:text-blue-600'
                        }`}
                    >
                        <DollarSignIcon className="w-4 h-4 flex-shrink-0" />
                        <span>Laba</span>
                    </button>
                </div>
            </div>

            <div className="widget-animate" style={{ animationDelay: '600ms' }}>
                {renderTabContent()}
            </div>

            <FinanceGuideModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
            />

            <FinanceFormModal
                modalState={modalState}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                form={form}
                setForm={setForm}
                handleFormChange={handleFormChange}
                isSubmitting={isSubmitting}
                profile={profile}
                cards={cards}
                pockets={pockets}
                projects={projects}
                transactionProjectMonthFilter={transactionProjectMonthFilter}
                setTransactionProjectMonthFilter={setTransactionProjectMonthFilter}
                pocketIcons={pocketIcons}
            />

            <FinanceHistoryModal
                historyModalState={historyModalState}
                onClose={() => setHistoryModalState(null)}
                transactions={transactions}
                cards={cards}
            />

            <FinanceStatDetailModal
                activeStatModal={activeStatModal}
                onClose={() => setActiveStatModal(null)}
                cards={cards}
                pockets={pockets}
                thisMonthIncome={thisMonthIncome}
                thisMonthExpense={thisMonthExpense}
            />
        </div>
    );
};

export default Finance;
