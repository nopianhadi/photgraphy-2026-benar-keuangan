import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Project,
    TeamMember,
    Client,
    Package,
    TeamProjectPayment,
    Transaction,
    Profile,
    NavigationAction,
    Card,
    FinancialPocket
} from '../../types';

import Modal from '../../shared/ui/Modal';
import { ListIcon, LayoutGridIcon, CalendarIcon } from '../../constants';
import { PlusIcon } from 'lucide-react';
import ProjectForm from '../../features/projects/components/ProjectForm';
import ProjectAnalytics from '../../features/projects/components/ProjectAnalytics';
import { ProjectListView, ProjectKanbanView } from '../../features/projects/components/ProjectViews';
import ProjectDetailModal from '../../features/projects/components/ProjectDetailModal';
import QuickStatusModal from '../../features/projects/components/QuickStatusModal';
import ChatModal from '../../features/communication/components/ChatModal';
import ShareMessageModal from '../../features/communication/components/ShareMessageModal';
import ProjectBriefingModal from '../../features/projects/components/ProjectBriefingModal';
import ProjectStatModals from '../../features/projects/components/ProjectStatModals';

import { useProjectFilters } from '../../features/projects/hooks/useProjectFilters';
import { useProjectBriefing } from '../../features/projects/hooks/useProjectBriefing';
import { useProjectForm } from '../../features/projects/hooks/useProjectForm';
import { useProjectOperations } from '../../features/projects/hooks/useProjectOperations';
import { calculateProjectsModalStats } from '../../features/projects/utils/projectCalculations';
import { getProjectWithRelations } from '../../services/projects';

export interface ProjectsProps {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    clients: Client[];
    packages: Package[];
    teamMembers: TeamMember[];
    teamProjectPayments: TeamProjectPayment[];
    setTeamProjectPayments: React.Dispatch<React.SetStateAction<TeamProjectPayment[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    initialAction: NavigationAction | null;
    setInitialAction: (action: NavigationAction | null) => void;
    profile: Profile;
    showNotification: (message: string) => void;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    pockets: FinancialPocket[];
    setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
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

type SharePreviewData = {
    title: string;
    message: string;
    phone?: string | null;
} | null;

export const Projects: React.FC<ProjectsProps> = ({
    projects,
    setProjects,
    clients,
    packages,
    teamMembers,
    teamProjectPayments,
    setTeamProjectPayments,
    transactions,
    setTransactions,
    initialAction,
    setInitialAction,
    profile,
    showNotification,
    cards,
    setCards,
    pockets,
    setPockets,
    totals
}) => {
    // Communication & Preview States
    const [chatModalData, setChatModalData] = useState<{ project: Project; client: Client } | null>(null);
    const [sharePreview, setSharePreview] = useState<SharePreviewData>(null);

    // Detail & Selection States
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [quickStatusModalOpen, setQuickStatusModalOpen] = useState(false);
    const [selectedProjectForStatus, setSelectedProjectForStatus] = useState<Project | null>(null);
    const [activeStatModal, setActiveStatModal] = useState<string | null>(null);

    // Custom Hooks
    const {
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        viewMode,
        setViewMode,
        projectListTab,
        setProjectListTab,
        filteredProjects,
        activeProjects,
        completedAndCancelledProjects,
        displayProjects
    } = useProjectFilters(projects);

    const {
        isBriefingModalOpen,
        briefingProject,
        briefingData,
        handleOpenBriefingModal,
        handleCloseBriefingModal
    } = useProjectBriefing(profile);

    const {
        isFormModalOpen,
        formMode,
        formData,
        setFormData,
        teamByCategory,
        handleOpenForm,
        handleCloseForm,
        handleFormChange,
        handleSubStatusChange,
        handleClientChange,
        handleTeamChange,
        handleReplaceTeamMember,
        handleTeamFeeChange,
        handleTeamSubJobChange,
        handleTeamClientPortalLinkChange,
        handleCustomSubStatusChange,
        addCustomSubStatus,
        removeCustomSubStatus,
        handleFormSubmit
    } = useProjectForm({
        projects,
        setProjects,
        clients,
        packages,
        teamMembers,
        teamProjectPayments,
        setTeamProjectPayments,
        transactions,
        setTransactions,
        cards,
        setCards,
        profile,
        showNotification,
        setSelectedProject
    });

    const {
        hasMore,
        isLoadingMore,
        draggedProjectId,
        loadMoreProjects,
        handleProjectDelete,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleQuickStatusChange
    } = useProjectOperations({
        projects,
        setProjects,
        selectedProject,
        formData,
        setFormData,
        setTeamProjectPayments,
        setTransactions,
        cards,
        setCards,
        pockets,
        setPockets,
        profile,
        showNotification
    });

    // Modal Stats Calculation
    const { activeCount, allActiveProjectsForStats, deadlineSoonProjects, topProjectType, topStatus } =
        useMemo(() => calculateProjectsModalStats(projects), [projects]);

    const statsForModal = useMemo(
        () => ({
            activeCount,
            allActiveProjectsForStats,
            deadlineSoonProjects,
            topProjectType,
            topStatus
        }),
        [activeCount, allActiveProjectsForStats, deadlineSoonProjects, topProjectType, topStatus]
    );

    // Synchronize selectedProject if projects snapshot changes in background
    useEffect(() => {
        if (!selectedProject) return;
        const updated = projects.find(p => p.id === selectedProject.id);
        if (updated && updated !== selectedProject) {
            const merged = {
                ...updated,
                team: (updated as any).team && (updated as any).team.length > 0 ? (updated as any).team : (selectedProject as any).team,
            } as Project;
            setSelectedProject(merged);
        }
    }, [projects, selectedProject?.id]);

    const handleOpenDetailModal = useCallback((project: Project) => {
        setSelectedProject(project);
        setIsDetailModalOpen(true);

        (async () => {
            try {
                const fresh = await getProjectWithRelations(project.id);
                if (fresh) {
                    setSelectedProject(fresh);
                    setProjects(prev => prev.map(p => p.id === project.id ? fresh : p));
                }
            } catch (err) {
                console.warn('[Projects] Background fetch failed for detail:', err);
            }
        })();
    }, [setProjects]);

    // Handle deep navigation initialAction
    useEffect(() => {
        if (initialAction && initialAction.type === 'VIEW_PROJECT_DETAILS' && initialAction.id) {
            const projectToView = projects.find(p => p.id === initialAction.id);
            if (projectToView) {
                handleOpenDetailModal(projectToView);
            }
            setInitialAction(null);
        }
    }, [initialAction, projects, setInitialAction, handleOpenDetailModal]);

    const handleSendMessage = (project: Project) => {
        const client = clients.find(c => c.id === project.clientId);
        if (!client) return;
        setChatModalData({ project, client });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2 justify-end">
                <button
                    onClick={() => handleOpenForm('add')}
                    className="button-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm py-2"
                >
                    <PlusIcon className="w-5 h-5 flex-shrink-0" />
                    Tambah Acara Pernikahan
                </button>
            </div>

            <div className="space-y-6">
                <ProjectAnalytics
                    projects={projects}
                    projectStatusConfig={profile.projectStatusConfig}
                    totals={totals}
                    onStatCardClick={setActiveStatModal}
                />

                <div className="bg-brand-surface p-3 md:p-4 rounded-xl shadow-lg border border-brand-border flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
                    <div className="input-group flex-grow !mt-0 w-full lg:w-auto">
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="input-field !rounded-lg !border !bg-brand-bg p-2 md:p-2.5 text-sm"
                            placeholder=" "
                        />
                        <label className="input-label text-sm">Cari Acara Pernikahan atau pengantin...</label>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full lg:w-auto">
                        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <CalendarIcon className="w-4 h-4 text-brand-text-secondary flex-shrink-0" />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="input-field !rounded-lg !border !bg-brand-bg p-2 text-sm w-full sm:w-36"
                                    title="Dari tanggal"
                                />
                            </div>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="input-field !rounded-lg !border !bg-brand-bg p-2 text-sm w-full sm:w-36"
                                title="Sampai tanggal"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="input-field !rounded-lg !border !bg-brand-bg p-2 md:p-2.5 text-sm w-full sm:w-44"
                        >
                            <option value="all">Semua Status</option>
                            {profile.projectStatusConfig.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                        <div className="p-1 bg-brand-bg border border-brand-border/60 rounded-lg flex items-center h-10 w-full sm:w-auto justify-center">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex-1 sm:flex-none flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-brand-surface shadow-sm text-brand-text-light'
                                        : 'text-brand-text-secondary hover:text-brand-text-primary'
                                }`}
                                title="Tampilan Daftar"
                            >
                                <ListIcon className="w-4 h-4 flex-shrink-0" />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`flex-1 sm:flex-none flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                    viewMode === 'kanban'
                                        ? 'bg-brand-surface shadow-sm text-brand-text-light'
                                        : 'text-brand-text-secondary hover:text-brand-text-primary'
                                }`}
                                title="Tampilan Kanban"
                            >
                                <LayoutGridIcon className="w-4 h-4 flex-shrink-0" />
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border overflow-hidden">
                        <div className="p-3 md:p-4 border-b border-brand-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 p-1 bg-brand-bg/80 rounded-xl border border-brand-border/60">
                                <button
                                    type="button"
                                    onClick={() => setProjectListTab('active')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                        projectListTab === 'active'
                                            ? 'bg-brand-accent text-brand-surface shadow-sm'
                                            : 'text-brand-text-secondary hover:text-brand-text-light'
                                    }`}
                                >
                                    Acara Aktif ({activeProjects.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProjectListTab('completed')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                        projectListTab === 'completed'
                                            ? 'bg-brand-accent text-brand-surface shadow-sm'
                                            : 'text-brand-text-secondary hover:text-brand-text-light'
                                    }`}
                                >
                                    Selesai & Batal ({completedAndCancelledProjects.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProjectListTab('all')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                        projectListTab === 'all'
                                            ? 'bg-brand-accent text-brand-surface shadow-sm'
                                            : 'text-brand-text-secondary hover:text-brand-text-light'
                                    }`}
                                >
                                    Semua ({filteredProjects.length})
                                </button>
                            </div>
                            <div className="text-xs text-brand-text-secondary text-right">
                                Menampilkan <span className="font-bold text-brand-text-light">
                                    {displayProjects.length}
                                </span> Acara
                            </div>
                        </div>
                        <ProjectListView
                            projects={displayProjects}
                            handleOpenDetailModal={handleOpenDetailModal}
                            handleOpenForm={handleOpenForm}
                            handleProjectDelete={handleProjectDelete}
                            config={profile.projectStatusConfig}
                            clients={clients}
                            handleQuickStatusChange={handleQuickStatusChange}
                            handleSendMessage={handleSendMessage}
                            hasMore={hasMore}
                            isLoadingMore={isLoadingMore}
                            onLoadMore={loadMoreProjects}
                        />
                    </div>
                ) : (
                    <ProjectKanbanView
                        projects={filteredProjects}
                        handleOpenDetailModal={handleOpenDetailModal}
                        draggedProjectId={draggedProjectId}
                        handleDragStart={handleDragStart}
                        handleDragOver={handleDragOver}
                        handleDrop={handleDrop}
                        config={profile.projectStatusConfig}
                    />
                )}
            </div>

            <ProjectForm
                isOpen={isFormModalOpen}
                onClose={handleCloseForm}
                mode={formMode}
                formData={formData}
                onFormChange={handleFormChange}
                onSubStatusChange={handleSubStatusChange}
                onClientChange={handleClientChange}
                onTeamChange={handleTeamChange}
                onTeamFeeChange={handleTeamFeeChange}
                onReplaceTeamMember={handleReplaceTeamMember}
                onTeamSubJobChange={handleTeamSubJobChange}
                onTeamClientPortalLinkChange={handleTeamClientPortalLinkChange}
                onCustomSubStatusChange={handleCustomSubStatusChange}
                onAddCustomSubStatus={addCustomSubStatus}
                onRemoveCustomSubStatus={removeCustomSubStatus}
                onSubmit={handleFormSubmit}
                clients={clients}
                teamMembers={teamMembers}
                teamProjectPayments={teamProjectPayments}
                profile={profile}
                teamByCategory={teamByCategory}
                showNotification={showNotification}
                setFormData={setFormData}
            />

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Detail Acara Pernikahan: ${selectedProject?.projectName}`}
                size="3xl"
            >
                <ProjectDetailModal
                    selectedProject={selectedProject}
                    setSelectedProject={setSelectedProject}
                    teamMembers={teamMembers}
                    clients={clients}
                    profile={profile}
                    showNotification={showNotification}
                    setProjects={setProjects}
                    onClose={() => setIsDetailModalOpen(false)}
                    handleOpenForm={handleOpenForm}
                    handleProjectDelete={handleProjectDelete}
                    handleOpenBriefingModal={() => {
                        if (selectedProject) handleOpenBriefingModal(selectedProject);
                    }}
                    packages={packages}
                    transactions={transactions}
                    teamProjectPayments={teamProjectPayments}
                    cards={cards}
                    onOpenSharePreview={(data) => setSharePreview({ title: data.title, message: data.message, phone: data.phone })}
                />
            </Modal>

            <ProjectBriefingModal
                isOpen={isBriefingModalOpen}
                onClose={handleCloseBriefingModal}
                project={briefingProject}
                briefingData={briefingData}
            />

            <ProjectStatModals
                activeStatModal={activeStatModal}
                onClose={() => setActiveStatModal(null)}
                statsForModal={statsForModal}
                allActiveProjectsForStats={allActiveProjectsForStats}
                projects={projects}
                clients={clients}
            />

            <QuickStatusModal
                isOpen={quickStatusModalOpen}
                onClose={() => {
                    setQuickStatusModalOpen(false);
                    setSelectedProjectForStatus(null);
                }}
                project={selectedProjectForStatus}
                statusConfig={profile.projectStatusConfig}
                onStatusChange={handleQuickStatusChange}
                showNotification={showNotification}
            />

            {chatModalData && (
                <ChatModal
                    isOpen={!!chatModalData}
                    onClose={() => setChatModalData(null)}
                    project={chatModalData.project}
                    client={chatModalData.client}
                    userProfile={profile}
                    onSendMessage={(_projectId, messageText) => {
                        setSharePreview({
                            title: `Bagikan Pesan - ${chatModalData.client.name}`,
                            message: messageText,
                            phone: chatModalData.client.whatsapp || chatModalData.client.phone,
                        });
                    }}
                />
            )}

            {sharePreview && (
                <ShareMessageModal
                    isOpen={!!sharePreview}
                    onClose={() => setSharePreview(null)}
                    title={sharePreview.title}
                    initialMessage={sharePreview.message}
                    phone={sharePreview.phone}
                    showNotification={showNotification}
                />
            )}
        </div>
    );
};

export default Projects;
