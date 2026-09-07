import React, { useState, useMemo, useEffect } from 'react';
import {
    PlusIcon,
    Share2Icon,
    UsersIcon,
    AlertCircleIcon,
    TrendingUpIcon,
} from '../../constants';
import {
    Client,
    Project,
    Package,
    AddOn,
    Transaction,
    Profile,
    NavigationAction,
    Card,
    FinancialPocket,
    ViewType,
    ClientFeedback,
    PromoCode,
    Notification,
    ClientStatus,
} from '../../types';
import Modal from '../../shared/ui/Modal';
import DonutChart from '../../shared/ui/DonutChart';
import ClientForm from '../../features/clients/components/ClientForm';
import ClientDetailModal from '../../features/clients/components/ClientDetailModal';
import BillingChatModal from '../../features/clients/components/BillingChatModal';
import NewClientsChart from '../../features/clients/components/NewClientsChart';
import { useClients } from '../../features/clients/hooks/useClients';
import { ensureOnlineOrNotify } from '../../features/clients/utils/clientHelpers';
import { exportClientsToCSV } from '../../features/clients/utils/clientExport';
import { deleteProject as deleteProjectRow } from '../../services/projects';

// Modular Components
import ClientStatsCards, { StatModalType } from '../../features/clients/components/ClientStatsCards';
import ClientFilterBar from '../../features/clients/components/ClientFilterBar';
import ClientTableView, { ClientTabType } from '../../features/clients/components/ClientTableView';
import ClientDuesView from '../../features/clients/components/ClientDuesView';
import ClientDocumentModal from '../../features/clients/components/ClientDocumentModal';
import ClientTransactionEditModal from '../../features/clients/components/ClientTransactionEditModal';
import ClientQrShareModals from '../../features/clients/components/ClientQrShareModals';

// Custom Hooks
import { useClientDocumentActions, DocumentToView } from '../../features/clients/hooks/useClientDocumentActions';
import { useClientPaymentOperations } from '../../features/clients/hooks/useClientPaymentOperations';
import { useClientFormHandler } from '../../features/clients/hooks/useClientFormHandler';

interface ClientsProps {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    packages: Package[];
    addOns: AddOn[];
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    userProfile: Profile;
    showNotification: (message: string) => void;
    initialAction: NavigationAction | null;
    setInitialAction: (action: NavigationAction | null) => void;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    pockets: FinancialPocket[];
    setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
    handleNavigation: (view: ViewType, action: NavigationAction) => void;
    clientFeedback: ClientFeedback[];
    promoCodes: PromoCode[];
    setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
    onSignInvoice: (projectId: string, signatureDataUrl: string) => void;
    onSignTransaction: (transactionId: string, signatureDataUrl: string) => void;
    onRecordPayment: (projectId: string, amount: number, destinationCardId: string) => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
    totals: {
        projects: number;
        activeProjects: number;
        clients: number;
        activeClients: number;
        leads: number;
        discussionLeads: number;
        followUpLeads: number;
        teamMembers: number;
        transactions: number;
        revenue: number;
        expense: number;
    };
}

export const Clients: React.FC<ClientsProps> = ({
    clients,
    setClients,
    projects,
    setProjects,
    packages,
    addOns,
    transactions,
    setTransactions,
    userProfile,
    showNotification,
    initialAction,
    setInitialAction,
    cards,
    setCards,
    handleNavigation,
    promoCodes,
    setPromoCodes,
    onSignInvoice,
    onSignTransaction,
    addNotification,
    totals,
}) => {
    const {
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        monthFilter,
        setMonthFilter,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        allClientData,
        filteredClientData,
        clientStats,
        handleDeleteClient,
    } = useClients(
        clients,
        setClients,
        projects,
        setProjects,
        transactions,
        setTransactions,
        showNotification,
        cards,
        setCards,
        totals
    );

    // Navigation and View Section States
    const [activeViewSection, setActiveViewSection] = useState<'clients' | 'dues' | 'analytics'>('clients');
    const [clientTab, setClientTab] = useState<ClientTabType>('active');
    const [activeStatModal, setActiveStatModal] = useState<StatModalType>(null);
    const [showAllDues, setShowAllDues] = useState(false);

    // Detail & Document States
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [clientForDetail, setClientForDetail] = useState<Client | null>(null);
    const [billingChatModal, setBillingChatModal] = useState<Client | null>(null);
    const [documentToView, setDocumentToView] = useState<DocumentToView | null>(null);

    // Sharing Modals States
    const [isBookingFormShareModalOpen, setIsBookingFormShareModalOpen] = useState(false);
    const [qrModalContent, setQrModalContent] = useState<{
        title: string;
        url: string;
        clientName?: string;
        clientPhone?: string;
    } | null>(null);
    const [sharePreview, setSharePreview] = useState<{
        title: string;
        message: string;
        phone?: string;
    } | null>(null);

    // Document Actions Hook (PDF, WhatsApp, Signature)
    const {
        isSignatureModalOpen,
        setIsSignatureModalOpen,
        handleSaveSignature,
        handleShareDocumentWA,
        handleDownloadPDF,
    } = useClientDocumentActions({
        documentToView,
        clientForDetail,
        userProfile,
        projects,
        showNotification,
        onSignInvoice,
        onSignTransaction,
        setSharePreview,
    });

    // Payment Operations Hook (Record Payment, Edit Transaction, Sync Cards)
    const {
        isTransactionEditModalOpen,
        setIsTransactionEditModalOpen,
        txFormData,
        setTxFormData,
        handleOpenEditTransaction,
        handleUpdateTransaction,
        handleRecordPayment,
    } = useClientPaymentOperations({
        projects,
        setProjects,
        transactions,
        setTransactions,
        cards,
        setCards,
        showNotification,
        addNotification,
        documentToView,
        setDocumentToView,
    });

    // Form Handling Hook (Client & Project modal add/edit)
    const {
        isModalOpen,
        modalMode,
        selectedClient,
        formData,
        setFormData,
        handleOpenModal,
        handleCloseModal,
        handleFormChange,
        handleFormSubmit,
    } = useClientFormHandler({
        clients,
        setClients,
        projects,
        setProjects,
        packages,
        addOns,
        transactions,
        setTransactions,
        cards,
        setCards,
        promoCodes,
        setPromoCodes,
        userProfile,
        showNotification,
        clientForDetail,
        setClientForDetail,
        documentToView,
        setDocumentToView,
        setIsSignatureModalOpen,
    });

    // Handle incoming deep navigation actions
    useEffect(() => {
        if (initialAction && initialAction.type === 'VIEW_CLIENT_DETAILS' && initialAction.id) {
            const clientToView = clients.find(c => c.id === initialAction.id);
            if (clientToView) {
                setClientForDetail(clientToView);
                setIsDetailModalOpen(true);
            }
            setInitialAction(null);
        } else if (initialAction && initialAction.type === 'EDIT_CLIENT' && initialAction.id) {
            const clientToEdit = clients.find(c => c.id === initialAction.id);
            if (clientToEdit) {
                const clientProj =
                    projects.find(p => p.clientId === clientToEdit.id) || clientToEdit.mostRecentProject;
                handleOpenModal('edit', clientToEdit, clientProj);
            }
            setInitialAction(null);
        }
    }, [initialAction, clients, projects, setInitialAction]);

    const bookingFormUrl = useMemo(() => {
        const path = window.location.pathname.replace(/index\.html$/, '');
        return `${window.location.origin}${path}#/public-booking`;
    }, []);

    const handleOpenQrModal = (client: Client) => {
        const path = window.location.pathname.replace(/index\.html$/, '');
        const url = `${window.location.origin}${path}#/portal/${client.portalAccessId}`;
        setQrModalContent({
            title: `Portal QR Code untuk ${client.name}`,
            url,
            clientName: client.name,
            clientPhone: client.whatsapp || client.phone,
        });
    };

    const clientsWithDues = useMemo(() => {
        return allClientData
            .filter(client => client.balanceDue > 0)
            .sort((a, b) => b.balanceDue - a.balanceDue);
    }, [allClientData]);

    const clientStatusDonutData = useMemo(() => {
        const statusCounts = clients.reduce((acc, client) => {
            acc[client.status] = (acc[client.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const statusColors: { [key in ClientStatus]?: string } = {
            [ClientStatus.ACTIVE]: '#10b981',
            [ClientStatus.INACTIVE]: '#64748b',
            [ClientStatus.LEAD]: '#3b82f6',
            [ClientStatus.LOST]: '#ef4444',
        };

        return Object.entries(statusCounts).map(([label, value]) => ({
            label,
            value,
            color: statusColors[label as ClientStatus] || '#9ca3af',
        }));
    }, [clients]);

    const newClientsChartData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        const data = months.map(month => ({ name: month, count: 0 }));

        clients.forEach(c => {
            const joinDate = new Date(c.since);
            if (joinDate.getFullYear() === currentYear) {
                const monthIndex = joinDate.getMonth();
                data[monthIndex].count += 1;
            }
        });
        return data;
    }, [clients]);

    const handleDeleteProject = async (projectId: string) => {
        if (
            !window.confirm(
                'Hapus Acara Pernikahan ini? Semua transaksi terkait akan tetap ada, tetapi tidak lagi terhubung ke Acara Pernikahan. Lanjutkan?'
            )
        )
            return;

        if (!ensureOnlineOrNotify(showNotification)) return;
        const success = await deleteProjectRow(projectId);
        if (success) {
            setProjects(prev => prev.filter(p => p.id !== projectId));
            showNotification('Acara Pernikahan berhasil dihapus.');
        } else {
            showNotification(
                !navigator.onLine
                    ? 'Harus online untuk melakukan perubahan'
                    : 'Gagal menghapus Acara Pernikahan di database. Coba lagi.'
            );
        }
    };

    const handleEditDocument = () => {
        if (!documentToView) return;
        if (documentToView.type === 'invoice') {
            const proj = documentToView.project;
            const client = clients.find(c => c.id === proj.clientId);
            if (client) {
                setDocumentToView(null);
                handleOpenModal('edit', client, proj);
            }
        } else {
            const tx = documentToView.transaction;
            handleOpenEditTransaction(tx);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Action Buttons */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2 sm:gap-3 mt-4 sm:mt-0">
                <button
                    onClick={() => setIsBookingFormShareModalOpen(true)}
                    className="button-secondary inline-flex items-center justify-center gap-2 text-xs sm:text-sm py-2"
                >
                    <Share2Icon className="w-4 h-4 flex-shrink-0" /> Bagikan Form Booking
                </button>
                <button
                    onClick={() => handleOpenModal('add')}
                    className="button-primary inline-flex items-center justify-center gap-2 text-xs sm:text-sm py-2"
                >
                    <PlusIcon className="w-5 h-5 flex-shrink-0" /> Tambah Pengantin & Acara Pernikahan
                </button>
            </div>

            {/* 4 Summary StatCards & Detail Modals */}
            <ClientStatsCards
                clientStats={clientStats}
                activeStatModal={activeStatModal}
                setActiveStatModal={setActiveStatModal}
                clients={clients}
                projects={projects}
            />

            {/* View Section Tabs for Progressive Disclosure */}
            <div className="flex flex-wrap items-center gap-2 border-b border-brand-border/60 pb-3">
                <button
                    type="button"
                    onClick={() => setActiveViewSection('clients')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                        activeViewSection === 'clients'
                            ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20'
                            : 'bg-brand-surface text-brand-text-secondary hover:text-brand-text-light hover:bg-brand-bg border border-brand-border/60'
                    }`}
                >
                    <UsersIcon className="w-4 h-4" />
                    <span>Daftar Pengantin</span>
                    <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            activeViewSection === 'clients'
                                ? 'bg-white/20 text-white'
                                : 'bg-brand-bg text-brand-text-secondary'
                        }`}
                    >
                        {clientStats.totalClients}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveViewSection('dues')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                        activeViewSection === 'dues'
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                            : 'bg-brand-surface text-brand-text-secondary hover:text-brand-text-light hover:bg-brand-bg border border-brand-border/60'
                    }`}
                >
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>Tagihan Belum Lunas</span>
                    {clientsWithDues.length > 0 && (
                        <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                activeViewSection === 'dues' ? 'bg-white/25 text-white' : 'bg-rose-500/20 text-rose-400'
                            }`}
                        >
                            {clientsWithDues.length}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveViewSection('analytics')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                        activeViewSection === 'analytics'
                            ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20'
                            : 'bg-brand-surface text-brand-text-secondary hover:text-brand-text-light hover:bg-brand-bg border border-brand-border/60'
                    }`}
                >
                    <TrendingUpIcon className="w-4 h-4" />
                    <span>Grafik & Analitik</span>
                </button>
            </div>

            {/* Analytics Section */}
            {activeViewSection === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6 widget-animate animate-fade-in">
                    <div className="lg:col-span-2 bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border">
                        <h3 className="font-bold text-lg text-gradient mb-4">Distribusi Status Pengantin</h3>
                        <DonutChart data={clientStatusDonutData} />
                    </div>
                    <div className="lg:col-span-3">
                        <NewClientsChart data={newClientsChartData} />
                    </div>
                </div>
            )}

            {/* Dues Section */}
            {activeViewSection === 'dues' && (
                <ClientDuesView
                    clientsWithDues={clientsWithDues}
                    showAllDues={showAllDues}
                    setShowAllDues={setShowAllDues}
                    onBillingClick={client => setBillingChatModal(client)}
                />
            )}

            {/* Main Clients List Section */}
            {activeViewSection === 'clients' && (
                <>
                    <ClientFilterBar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        monthFilter={monthFilter}
                        setMonthFilter={setMonthFilter}
                        dateFrom={dateFrom}
                        setDateFrom={setDateFrom}
                        dateTo={dateTo}
                        setDateTo={setDateTo}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        onDownloadCSV={() => exportClientsToCSV(filteredClientData)}
                    />

                    <ClientTableView
                        clientTab={clientTab}
                        setClientTab={setClientTab}
                        filteredClientData={filteredClientData}
                        onViewDetail={client => {
                            setClientForDetail(client);
                            setIsDetailModalOpen(true);
                        }}
                        onEditClient={(client, project) => handleOpenModal('edit', client, project)}
                        onDeleteClient={handleDeleteClient}
                        onAddProject={client => handleOpenModal('add', client)}
                    />
                </>
            )}

            {/* Add / Edit Client & Project Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={
                    modalMode === 'add'
                        ? selectedClient
                            ? 'Tambah Acara Pernikahan Baru'
                            : 'Tambah Pengantin & Acara Pernikahan Baru'
                        : 'Edit Pengantin & Acara Pernikahan'
                }
                size="4xl"
            >
                <ClientForm
                    formData={formData}
                    setFormData={setFormData}
                    handleFormChange={handleFormChange}
                    handleFormSubmit={handleFormSubmit}
                    handleCloseModal={handleCloseModal}
                    packages={packages}
                    addOns={addOns}
                    userProfile={userProfile}
                    modalMode={modalMode}
                    cards={cards}
                    promoCodes={promoCodes}
                />
            </Modal>

            {/* Client Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Detail Pengantin: ${clientForDetail?.name}`}
                size="4xl"
            >
                <ClientDetailModal
                    client={clientForDetail}
                    projects={projects}
                    transactions={transactions}
                    packages={packages}
                    onClose={() => setIsDetailModalOpen(false)}
                    onEditClient={client =>
                        handleOpenModal('edit', client, projects.find(p => p.clientId === client.id))
                    }
                    onDeleteClient={handleDeleteClient}
                    onViewReceipt={tx => setDocumentToView({ type: 'receipt', transaction: tx })}
                    onViewInvoice={proj => setDocumentToView({ type: 'invoice', project: proj })}
                    handleNavigation={handleNavigation}
                    onRecordPayment={handleRecordPayment}
                    cards={cards}
                    onSharePortal={handleOpenQrModal}
                    onDeleteProject={handleDeleteProject}
                    showNotification={showNotification}
                    setProjects={setProjects}
                    setTransactions={setTransactions}
                    setCards={setCards}
                />
            </Modal>

            {/* Invoice & Receipt Document Preview Modal */}
            <ClientDocumentModal
                documentToView={documentToView}
                onClose={() => setDocumentToView(null)}
                clientForDetail={clientForDetail}
                userProfile={userProfile}
                packages={packages}
                projects={projects}
                isSignatureModalOpen={isSignatureModalOpen}
                setIsSignatureModalOpen={setIsSignatureModalOpen}
                onSaveSignature={handleSaveSignature}
                onEditDocument={handleEditDocument}
                onDownloadPDF={handleDownloadPDF}
                onShareDocumentWA={handleShareDocumentWA}
            />

            {/* QR Code & Message Sharing Modals */}
            <ClientQrShareModals
                bookingFormUrl={bookingFormUrl}
                isBookingFormShareModalOpen={isBookingFormShareModalOpen}
                onCloseBookingFormShareModal={() => setIsBookingFormShareModalOpen(false)}
                qrModalContent={qrModalContent}
                onCloseQrModal={() => setQrModalContent(null)}
                sharePreview={sharePreview}
                setSharePreview={setSharePreview}
                userProfile={userProfile}
                showNotification={showNotification}
            />

            {/* Billing WhatsApp Reminder Modal */}
            {billingChatModal && (
                <BillingChatModal
                    isOpen={!!billingChatModal}
                    onClose={() => setBillingChatModal(null)}
                    client={billingChatModal}
                    projects={projects}
                    userProfile={userProfile}
                    showNotification={showNotification}
                />
            )}

            {/* Transaction / Receipt Edit Modal */}
            <ClientTransactionEditModal
                isOpen={isTransactionEditModalOpen}
                onClose={() => setIsTransactionEditModalOpen(false)}
                txFormData={txFormData}
                setTxFormData={setTxFormData}
                onSubmit={handleUpdateTransaction}
                cards={cards}
            />
        </div>
    );
};

export default Clients;
