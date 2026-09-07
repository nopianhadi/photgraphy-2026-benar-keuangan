import { useState, useCallback } from 'react';
import {
    Project,
    Profile,
    TeamProjectPayment,
    Transaction,
    TransactionType,
    Card,
    FinancialPocket,
    PrintingItem
} from '../../../types';
import {
    deleteProject as deleteProjectInDb,
    updateProject as updateProjectInDb
} from '../../../services/projects';
import {
    createTransaction,
    updateCardBalance
} from '../../../services/transactions';
import { syncClientStatusFromProjects } from '../../../services/clients';
import { getProgressForStatus } from '../utils/projectHelpers';

const ensureOnlineOrNotify = (showNotification: (message: string) => void): boolean => {
    if (!navigator.onLine) {
        showNotification('Harus online untuk melakukan perubahan');
        return false;
    }
    return true;
};

interface UseProjectOperationsParams {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    selectedProject: Project | null;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    setTeamProjectPayments: React.Dispatch<React.SetStateAction<TeamProjectPayment[]>>;
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    pockets: FinancialPocket[];
    setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
    profile: Profile;
    showNotification: (msg: string) => void;
}

export function useProjectOperations({
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
}: UseProjectOperationsParams) {
    const [offset, setOffset] = useState(100);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

    const loadMoreProjects = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const { listProjectsWithRelations } = await import('../../../services/projects');
            const nextProjects = await listProjectsWithRelations({ limit: 100, offset });
            if (nextProjects.length < 100) {
                setHasMore(false);
            }
            if (nextProjects.length > 0) {
                setProjects(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = nextProjects.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
                setOffset(prev => prev + 100);
            } else {
                setHasMore(false);
            }
        } catch (e) {
            console.error('[Projects] Failed to load more projects:', e);
            showNotification('Gagal memuat lebih banyak Acara Pernikahan.');
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleProjectDelete = async (projectId: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus Acara Pernikahan ini? Semua data terkait (termasuk tugas tim dan transaksi) akan dihapus.")) {
            if (!ensureOnlineOrNotify(showNotification)) return;
            try {
                await deleteProjectInDb(projectId);
            } catch (err) {
                console.warn('[Projects] Failed to delete project in Supabase:', err);
                showNotification(!navigator.onLine ? 'Harus online untuk melakukan perubahan' : 'Gagal menghapus Acara Pernikahan di server. Coba lagi.');
                return;
            }
            setProjects(prev => prev.filter(p => p.id !== projectId));
            setTeamProjectPayments(prev => prev.filter(fp => fp.projectId !== projectId));
            setTransactions(prev => prev.filter(t => t.projectId !== projectId));
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, projectId: string) => {
        e.dataTransfer.setData("projectId", projectId);
        setDraggedProjectId(projectId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
        e.preventDefault();
        const projectId = e.dataTransfer.getData("projectId");
        const projectToUpdate = projects.find(p => p.id === projectId);

        if (projectToUpdate && projectToUpdate.status !== newStatus) {
            const nextProgress = getProgressForStatus(newStatus, profile.projectStatusConfig);
            try {
                await updateProjectInDb(projectToUpdate.id, {
                    status: newStatus as any,
                    progress: nextProgress as any,
                    activeSubStatuses: [] as any,
                } as any);
                setProjects(prevProjects =>
                    prevProjects.map(p =>
                        p.id === projectId ? { ...p, status: newStatus, progress: nextProgress, activeSubStatuses: [] } : p
                    )
                );

                try {
                    await syncClientStatusFromProjects(projectToUpdate.clientId);
                } catch (errSync) {
                    console.warn('[Projects] Failed to sync client status from projects:', errSync);
                }
                showNotification(`Status "${projectToUpdate.projectName}" diubah ke "${newStatus}"`);
            } catch (err) {
                console.warn('[Projects] Failed to persist status change to Supabase:', err);
                showNotification('Gagal memperbarui Progres Acara Pernikahan Pengantin di server. Coba lagi.');
            }
        }
        setDraggedProjectId(null);
    };

    const handlePayForPrintingItem = async (
        projectId: string,
        printingItemId: string,
        sourceCardId: string,
        sourcePocketId?: string
    ) => {
        const project = projects.find(p => p.id === projectId) || (selectedProject && selectedProject.id === projectId ? selectedProject : null);
        const formIsForThisProject = !!(formData?.id && formData.id === projectId);
        const currentItems: PrintingItem[] = (project?.printingDetails && project.printingDetails.length > 0)
            ? (project.printingDetails as PrintingItem[])
            : (formIsForThisProject && Array.isArray(formData.printingDetails) ? (formData.printingDetails as PrintingItem[]) : []);

        const printingItem = currentItems.find(item => item.id === printingItemId);

        const isFromPocket = !!sourcePocketId;
        const sourcePocket = isFromPocket ? pockets.find(p => p.id === sourcePocketId) : null;
        const sourceCard = !isFromPocket ? cards.find(c => c.id === sourceCardId) : null;

        if (!printingItem || (!sourcePocket && !sourceCard)) {
            showNotification("Error: Data tidak lengkap untuk memproses pembayaran.");
            return;
        }

        if (isFromPocket && sourcePocket) {
            if (sourcePocket.amount < printingItem.cost) {
                showNotification(`Error: Saldo di kantong ${sourcePocket.name} tidak mencukupi.`);
                return;
            }
        } else if (sourceCard) {
            if (sourceCard.balance < printingItem.cost) {
                showNotification(`Error: Saldo di ${sourceCard.bankName} tidak mencukupi.`);
                return;
            }
        }

        try {
            const created = await createTransaction({
                date: new Date().toISOString().split('T')[0],
                description: `Biaya Produksi Fisik: ${printingItem.customName || printingItem.type} - Acara Pernikahan ${project?.projectName || (formIsForThisProject ? formData.projectName : 'Acara Pernikahan')}`,
                amount: printingItem.cost,
                type: TransactionType.EXPENSE,
                projectId: projectId,
                category: 'Produksi Fisik',
                method: 'Sistem',
                cardId: isFromPocket ? undefined : sourceCardId,
                pocketId: isFromPocket ? sourcePocketId : undefined,
                printingItemId: printingItemId,
            } as any);

            if (isFromPocket && sourcePocketId) {
                const { updatePocket } = await import('../../../services/pockets');
                await updatePocket(sourcePocketId, { amount: sourcePocket!.amount - printingItem.cost });
            } else if (sourceCardId) {
                await updateCardBalance(sourceCardId, -Math.abs(printingItem.cost));
            }

            const updatedPrintingDetails = (currentItems || []).map(item =>
                item.id === printingItemId ? { ...item, paymentStatus: 'Paid' as 'Paid' } : item
            );
            await updateProjectInDb(projectId, { printingDetails: updatedPrintingDetails } as any);

            setTransactions(prev => [created, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            if (isFromPocket && sourcePocketId) {
                setPockets(prev => prev.map(p => p.id === sourcePocketId ? { ...p, amount: p.amount - printingItem.cost } : p));
            } else if (sourceCardId) {
                setCards(prev => prev.map(c => c.id === sourceCardId ? { ...c, balance: c.balance - printingItem.cost } : c));
            }

            if (project) {
                setProjects(prevProjects => prevProjects.map(p => {
                    if (p.id === projectId) {
                        return { ...p, printingDetails: updatedPrintingDetails } as Project;
                    }
                    return p;
                }));
            }
            setFormData((prev: any) => {
                const updatedPrintingDetailsForm = (prev.printingDetails || []).map((item: PrintingItem) =>
                    item.id === printingItemId ? { ...item, paymentStatus: 'Paid' as 'Paid' } : item
                );
                return { ...prev, printingDetails: updatedPrintingDetailsForm };
            });

            const sourceName = isFromPocket ? sourcePocket!.name : sourceCard!.bankName;
            showNotification(`Pembayaran untuk "${printingItem.customName || printingItem.type}" berhasil dari ${sourceName}.`);
        } catch (err) {
            console.warn('[Projects] Failed to process printing payment:', err);
            showNotification('Gagal memproses pembayaran produksi fisik di server. Coba lagi.');
        }
    };

    const handleQuickStatusChange = useCallback(async (
        projectId: string,
        newStatus: string,
        notifyClient: boolean
    ) => {
        try {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;

            const nextProgress = getProgressForStatus(newStatus, profile.projectStatusConfig);
            const updated = {
                ...project,
                status: newStatus,
                progress: nextProgress,
                activeSubStatuses: [],
            } as Project;
            await updateProjectInDb(projectId, {
                status: newStatus,
                progress: nextProgress,
                activeSubStatuses: [],
            } as any);

            setProjects(prev => prev.map(p => p.id === projectId ? updated : p));

            try {
                await syncClientStatusFromProjects(project.clientId);
            } catch (e) {
                console.warn('[Projects] Failed to sync client status from projects:', e);
            }

            if (notifyClient) {
                console.log('Notifying client about status change:', newStatus);
            }

            showNotification(`Status berhasil diubah ke "${newStatus}"`);
        } catch (error) {
            console.error('Quick status change error:', error);
            showNotification('Gagal mengubah status');
        }
    }, [projects, profile.projectStatusConfig, setProjects, showNotification]);

    return {
        offset,
        hasMore,
        isLoadingMore,
        draggedProjectId,
        loadMoreProjects,
        handleProjectDelete,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handlePayForPrintingItem,
        handleQuickStatusChange
    };
}
