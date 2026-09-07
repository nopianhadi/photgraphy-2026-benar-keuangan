import { useState, useMemo, useCallback } from 'react';
import {
    Project,
    Profile,
    TeamMember,
    TeamProjectPayment,
    Transaction,
    TransactionType,
    Card,
    AssignedTeamMember,
    PrintingItem,
    SubStatusConfig,
    PaymentStatus,
} from '../../../types';
import {
    updateProject as updateProjectInDb,
    getProjectWithRelations,
} from '../../../services/projects';
import { upsertAssignmentsForProject } from '../../../services/projectTeamAssignments';
import { upsertTeamPaymentsForProject } from '../../../services/teamProjectPayments';
import {
    createTransaction,
    updateCardBalance,
    updateTransaction as updateTransactionRow,
    deleteTransaction as deleteTransactionRow,
} from '../../../services/transactions';
import { syncClientStatusFromProjects } from '../../../services/clients';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditFormData {
    id: string;
    clientId: string;
    projectName: string;
    clientName: string;
    projectType: string;
    packageName: string;
    status: string;
    activeSubStatuses: string[];
    customSubStatuses: SubStatusConfig[];
    customCosts: { id: string; description: string; amount: string | number }[];
    location: string;
    date: string;
    deadlineDate: string;
    team: AssignedTeamMember[];
    notes: string;
    driveLink: string;
    clientDriveLink: string;
    finalDriveLink: string;
    startTime: string;
    endTime: string;
    shippingDetails: string;
    printingDetails: PrintingItem[];
    printingCost: number;
    address: string;
    durationSelection: string | undefined;
    unitPrice: number | undefined;
}

export interface UseProjectEditModeParams {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    teamMembers: TeamMember[];
    teamProjectPayments: TeamProjectPayment[];
    setTeamProjectPayments: React.Dispatch<React.SetStateAction<TeamProjectPayment[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    profile: Profile;
    showNotification: (msg: string) => void;
    setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildEditFormData(project: Project, profile: Profile): EditFormData {
    const statusConfig = profile.projectStatusConfig.find(s => s.name === project.status);
    const subStatuses = project.customSubStatuses ?? statusConfig?.subStatuses ?? [];

    let printingDetailsBase = (project.printingDetails || []) as PrintingItem[];
    const printingDetailsWithStatus = printingDetailsBase.map(item => ({
        ...item,
        paymentStatus: item.paymentStatus || ('Unpaid' as const),
    }));

    return {
        id: project.id,
        clientId: project.clientId,
        projectName: project.projectName,
        clientName: project.clientName,
        projectType: project.projectType,
        packageName: project.packageName,
        status: project.status,
        activeSubStatuses: project.activeSubStatuses || [],
        customSubStatuses: subStatuses,
        customCosts: (project.customCosts || []).map(c => ({ ...c })),
        location: project.location || '',
        date: (project.date || '').split('T')[0],
        deadlineDate: project.deadlineDate ? project.deadlineDate.split('T')[0] : '',
        team: (project.team || []).map((t: AssignedTeamMember) => ({
            id: t.id,
            memberId: t.memberId,
            name: t.name,
            role: t.role,
            fee: t.fee,
            subJob: t.subJob,
        })),
        notes: project.notes || '',
        driveLink: project.driveLink || '',
        clientDriveLink: project.clientDriveLink || '',
        finalDriveLink: project.finalDriveLink || '',
        startTime: project.startTime ? project.startTime.split(':').slice(0, 2).join(':') : '',
        endTime: project.endTime ? project.endTime.split(':').slice(0, 2).join(':') : '',
        shippingDetails: project.shippingDetails || '',
        printingDetails: printingDetailsWithStatus,
        printingCost: project.printingCost || 0,
        address: project.address || '',
        durationSelection: (project as any).durationSelection || '',
        unitPrice: (project as any).unitPrice,
    };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProjectEditMode({
    projects,
    setProjects,
    teamMembers,
    teamProjectPayments,
    setTeamProjectPayments,
    transactions,
    setTransactions,
    cards,
    setCards,
    profile,
    showNotification,
    setSelectedProject,
}: UseProjectEditModeParams) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

    // ── teamByCategory for edit form ──────────────────────────────────────────
    const teamByCategory = useMemo(() => {
        return teamMembers.reduce(
            (acc, member) => {
                const category = member.category || 'Tim';
                if (!acc[category]) acc[category] = {};
                if (!acc[category][member.role]) acc[category][member.role] = [];
                acc[category][member.role].push(member);
                return acc;
            },
            { Tim: {}, Vendor: {} } as Record<string, Record<string, TeamMember[]>>,
        );
    }, [teamMembers]);

    // ── Enter edit mode ───────────────────────────────────────────────────────
    const enterEditMode = useCallback(
        (project: Project) => {
            setEditFormData(buildEditFormData(project, profile));
            setIsEditing(true);
        },
        [profile],
    );

    // ── Cancel edit mode ──────────────────────────────────────────────────────
    const cancelEditMode = useCallback(() => {
        setIsEditing(false);
        setEditFormData(null);
    }, []);

    // ── Form field change ─────────────────────────────────────────────────────
    const handleEditFormChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setEditFormData(prev => {
                if (!prev) return prev;
                const next = { ...prev, [name]: value };
                if (name === 'status') {
                    next.activeSubStatuses = [];
                    const statusConfig = profile.projectStatusConfig.find(s => s.name === value);
                    next.customSubStatuses = statusConfig?.subStatuses || [];
                    if (value !== 'Dikirim') next.shippingDetails = '';
                }
                return next;
            });
        },
        [profile],
    );

    // ── Team change ───────────────────────────────────────────────────────────
    const handleEditTeamChange = useCallback((member: TeamMember) => {
        setEditFormData(prev => {
            if (!prev) return prev;
            const isSelected = prev.team.some(t => t.memberId === member.id);
            if (isSelected) {
                return { ...prev, team: prev.team.filter(t => t.memberId !== member.id) };
            }
            const newTeamMember: AssignedTeamMember = {
                memberId: member.id,
                name: member.name,
                role: member.role,
                fee: member.standardFee,
            };
            return { ...prev, team: [...prev.team, newTeamMember] };
        });
    }, []);

    const handleEditTeamFeeChange = useCallback((memberId: string, fee: number) => {
        setEditFormData(prev => {
            if (!prev) return prev;
            return { ...prev, team: prev.team.map(t => (t.memberId === memberId ? { ...t, fee } : t)) };
        });
    }, []);

    const handleEditTeamSubJobChange = useCallback((memberId: string, subJob: string) => {
        setEditFormData(prev => {
            if (!prev) return prev;
            return { ...prev, team: prev.team.map(t => (t.memberId === memberId ? { ...t, subJob } : t)) };
        });
    }, []);

    const handleEditReplaceTeamMember = useCallback(
        (oldMemberId: string, newMember: TeamMember) => {
            setEditFormData(prev => {
                if (!prev) return prev;
                if (prev.team.some(t => t.memberId === newMember.id && t.memberId !== oldMemberId)) {
                    showNotification(`${newMember.name} sudah dipilih dalam project ini.`);
                    return prev;
                }
                return {
                    ...prev,
                    team: prev.team.map(t =>
                        t.memberId === oldMemberId
                            ? { ...t, memberId: newMember.id, name: newMember.name, role: newMember.role || t.role, fee: newMember.standardFee || t.fee }
                            : t,
                    ),
                };
            });
        },
        [showNotification],
    );

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSaveEdit = useCallback(async () => {
        if (!editFormData) return;
        if (!navigator.onLine) {
            showNotification('Harus online untuk melakukan perubahan');
            return;
        }

        // Validate minimal required fields
        if (!editFormData.projectName.trim()) {
            showNotification('Nama acara tidak boleh kosong.');
            return;
        }
        if (!editFormData.projectType) {
            showNotification('Jenis acara harus dipilih.');
            return;
        }
        if (!editFormData.date) {
            showNotification('Tanggal acara harus diisi.');
            return;
        }

        setIsSaving(true);
        const clientIdsToSync = new Set<string>();

        try {
            const originalProject = projects.find(p => p.id === editFormData.id);
            if (!originalProject) {
                showNotification('Data acara tidak ditemukan.');
                setIsSaving(false);
                return;
            }

            if (originalProject.clientId) clientIdsToSync.add(originalProject.clientId);

            // Cost calculation (preserve existing payment logic)
            const oldPrintingCost = originalProject.printingCost || 0;
            const oldCustomCostsTotal = (originalProject.customCosts || []).reduce((sum, c) => sum + c.amount, 0);
            const newPrintingCost = Number(editFormData.printingCost) || 0;
            const newCustomCosts = (editFormData.customCosts || [])
                .filter(c => c.description && Number(c.amount) > 0)
                .map(c => ({ ...c, id: (c as any).id || `cc-${Date.now()}`, amount: Number(c.amount) }));
            const newCustomCostsTotal = newCustomCosts.reduce((sum, c) => sum + c.amount, 0);
            const costDifference = (newPrintingCost - oldPrintingCost) + (newCustomCostsTotal - oldCustomCostsTotal);
            const newTotalCost = originalProject.totalCost + costDifference;
            const newAmountPaid = originalProject.amountPaid;
            const newPaymentStatus =
                newAmountPaid >= newTotalCost
                    ? PaymentStatus.LUNAS
                    : newAmountPaid > 0
                    ? PaymentStatus.DP_TERBAYAR
                    : PaymentStatus.BELUM_BAYAR;

            let projectData: Project = {
                ...originalProject,
                projectName: editFormData.projectName,
                clientName: editFormData.clientName,
                clientId: editFormData.clientId,
                projectType: editFormData.projectType,
                packageName: editFormData.packageName,
                date: editFormData.date,
                deadlineDate: editFormData.deadlineDate || undefined,
                location: editFormData.location,
                address: editFormData.address || undefined,
                startTime: editFormData.startTime || undefined,
                endTime: editFormData.endTime || undefined,
                notes: editFormData.notes || undefined,
                driveLink: editFormData.driveLink || undefined,
                clientDriveLink: editFormData.clientDriveLink || undefined,
                finalDriveLink: editFormData.finalDriveLink || undefined,
                shippingDetails: editFormData.shippingDetails || undefined,
                activeSubStatuses: editFormData.activeSubStatuses,
                customSubStatuses: editFormData.customSubStatuses,
                team: editFormData.team,
                printingDetails: editFormData.printingDetails,
                customCosts: newCustomCosts,
                printingCost: newPrintingCost,
                totalCost: newTotalCost,
                paymentStatus: newPaymentStatus,
                durationSelection: editFormData.durationSelection as any,
                unitPrice: editFormData.unitPrice as any,
            };

            // 1. Update project in DB
            await updateProjectInDb(projectData.id, {
                projectName: projectData.projectName,
                clientName: projectData.clientName,
                clientId: projectData.clientId,
                projectType: projectData.projectType,
                packageName: projectData.packageName,
                date: projectData.date,
                deadlineDate: projectData.deadlineDate as any,
                location: projectData.location,
                status: projectData.status,
                progress: projectData.progress,
                totalCost: projectData.totalCost,
                amountPaid: projectData.amountPaid,
                paymentStatus: projectData.paymentStatus,
                notes: projectData.notes,
                driveLink: projectData.driveLink,
                clientDriveLink: projectData.clientDriveLink as any,
                finalDriveLink: projectData.finalDriveLink as any,
                startTime: projectData.startTime as any,
                endTime: projectData.endTime as any,
                printingDetails: projectData.printingDetails as any,
                customCosts: projectData.customCosts as any,
                printingCost: projectData.printingCost,
                address: projectData.address as any,
                shippingDetails: projectData.shippingDetails as any,
                durationSelection: (projectData as any).durationSelection,
                unitPrice: (projectData as any).unitPrice,
                activeSubStatuses: projectData.activeSubStatuses as any,
                customSubStatuses: projectData.customSubStatuses as any,
                confirmedSubStatuses: projectData.confirmedSubStatuses as any,
                clientSubStatusNotes: projectData.clientSubStatusNotes as any,
            } as any);

            // 2. Upsert team assignments
            try {
                const updatedAssignments = await upsertAssignmentsForProject(
                    projectData.id,
                    (projectData.team || []).map(t => ({
                        id: t.id,
                        memberId: t.memberId,
                        name: t.name,
                        role: t.role,
                        fee: t.fee,
                        subJob: t.subJob,
                    })),
                );
                if (updatedAssignments && updatedAssignments.length > 0) {
                    projectData = { ...projectData, team: updatedAssignments };
                }
            } catch (teamErr) {
                console.warn('[EditMode] Failed to persist team assignments:', teamErr);
            }

            // 3. Handle printing cost transaction (same logic as useProjectForm)
            const paymentCardId = cards.find(c => c.id !== 'CARD_CASH')?.id;
            if (paymentCardId && originalProject.printingCost !== projectData.printingCost) {
                const cost = projectData.printingCost || 0;
                const oldCost = originalProject.printingCost || 0;
                const costDiff = cost - oldCost;
                const category = 'Produksi Fisik';
                const description = `${category} - ${projectData.projectName}`;
                const existingTx = transactions.find(
                    t => t.projectId === projectData.id && t.category === category && t.description === description,
                );
                try {
                    if (existingTx) {
                        if (cost > 0) {
                            const updated = await updateTransactionRow(existingTx.id, { amount: cost });
                            if (costDiff !== 0) await updateCardBalance(paymentCardId, -Math.abs(costDiff) * Math.sign(costDiff));
                            setTransactions(prev =>
                                prev.map(tx => (tx.id === existingTx.id ? updated : tx)).sort(
                                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
                                ),
                            );
                            setCards(prev => prev.map(c => (c.id === paymentCardId ? { ...c, balance: c.balance - costDiff } : c)));
                        } else {
                            await deleteTransactionRow(existingTx.id);
                            await updateCardBalance(paymentCardId, Math.abs(oldCost));
                            setTransactions(prev => prev.filter(tx => tx.id !== existingTx.id));
                            setCards(prev => prev.map(c => (c.id === paymentCardId ? { ...c, balance: c.balance + oldCost } : c)));
                        }
                    } else if (cost > 0) {
                        const created = await createTransaction({
                            date: new Date().toISOString().split('T')[0],
                            description,
                            amount: cost,
                            type: TransactionType.EXPENSE,
                            projectId: projectData.id,
                            category,
                            method: 'Sistem',
                            cardId: paymentCardId,
                        } as any);
                        setTransactions(prev =>
                            [created, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                        );
                        setCards(prev => prev.map(c => (c.id === paymentCardId ? { ...c, balance: c.balance - cost } : c)));
                    }
                } catch (e) {
                    console.warn('[EditMode] Failed to persist cost transaction:', e);
                }
            }

            // 4. Upsert team payments (same logic as useProjectForm)
            const allTeamMembersOnProject = projectData.team || [];
            const otherProjectPayments = teamProjectPayments.filter(p => p.projectId !== projectData.id);
            const existingProjectPayments = teamProjectPayments.filter(p => p.projectId === projectData.id);
            const existingPaymentsByMemberId = new Map(existingProjectPayments.map(p => [p.teamMemberId, p] as const));
            const unusedExistingPayments = existingProjectPayments.filter(
                p => !allTeamMembersOnProject.some(m => m.memberId === p.teamMemberId),
            );

            const newProjectPaymentEntries = allTeamMembersOnProject.map(teamMember => {
                const prev = existingPaymentsByMemberId.get(teamMember.memberId);
                if (prev) {
                    const isPaid = prev.status === 'Paid';
                    return {
                        id: prev.id,
                        projectId: projectData.id,
                        teamMemberName: isPaid ? (prev.teamMemberName || teamMember.name) : teamMember.name,
                        teamMemberId: teamMember.memberId,
                        date: isPaid ? (prev.date || projectData.date) : projectData.date,
                        status: isPaid ? 'Paid' : ('Unpaid' as 'Paid' | 'Unpaid'),
                        fee: isPaid ? (prev.fee || teamMember.fee) : teamMember.fee,
                        createdAt: prev.createdAt,
                        updatedAt: prev.updatedAt,
                    };
                }
                if (unusedExistingPayments.length > 0) {
                    const reused = unusedExistingPayments.shift()!;
                    const isPaid = reused.status === 'Paid';
                    return {
                        id: reused.id,
                        projectId: projectData.id,
                        teamMemberName: teamMember.name,
                        teamMemberId: teamMember.memberId,
                        date: reused.date || projectData.date,
                        status: isPaid ? 'Paid' : ('Unpaid' as 'Paid' | 'Unpaid'),
                        fee: isPaid ? reused.fee : teamMember.fee,
                        createdAt: reused.createdAt,
                        updatedAt: reused.updatedAt,
                    };
                }
                return {
                    id: crypto.randomUUID(),
                    projectId: projectData.id,
                    teamMemberName: teamMember.name,
                    teamMemberId: teamMember.memberId,
                    date: projectData.date,
                    status: 'Unpaid' as 'Paid' | 'Unpaid',
                    fee: teamMember.fee,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
            });

            let persistedPayments: TeamProjectPayment[] = newProjectPaymentEntries as TeamProjectPayment[];
            try {
                persistedPayments = await upsertTeamPaymentsForProject(projectData.id, newProjectPaymentEntries as TeamProjectPayment[]);
            } catch (e) {
                console.warn('[EditMode] Failed to persist team payments:', e);
            }
            setTeamProjectPayments([...otherProjectPayments, ...persistedPayments]);

            // 5. Re-fetch fresh data
            let finalProject = projectData;
            try {
                const freshProject = await getProjectWithRelations(projectData.id);
                if (freshProject) finalProject = freshProject;
            } catch (fetchErr) {
                console.warn('[EditMode] Failed to re-fetch updated project:', fetchErr);
            }

            // 6. Sync client status
            if (clientIdsToSync.size > 0) {
                try {
                    await Promise.all(Array.from(clientIdsToSync).map(id => syncClientStatusFromProjects(id)));
                } catch (e) {
                    console.warn('[EditMode] Failed to sync client status:', e);
                }
            }

            // 7. Update state
            setProjects(prev =>
                prev.map(p => (p.id === finalProject.id ? finalProject : p)).sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
                ),
            );
            setSelectedProject(prev => (prev && prev.id === finalProject.id ? finalProject : prev));

            // 8. Exit edit mode
            setIsEditing(false);
            setEditFormData(null);
            showNotification('Perubahan acara berhasil disimpan.');
        } catch (err) {
            console.error('[EditMode] Save failed:', err);
            showNotification(
                !navigator.onLine
                    ? 'Harus online untuk melakukan perubahan'
                    : 'Gagal menyimpan perubahan acara. Silakan coba lagi.',
            );
        } finally {
            setIsSaving(false);
        }
    }, [
        editFormData,
        projects,
        teamProjectPayments,
        transactions,
        cards,
        showNotification,
        setProjects,
        setSelectedProject,
        setTeamProjectPayments,
        setTransactions,
        setCards,
    ]);

    return {
        isEditing,
        isSaving,
        editFormData,
        setEditFormData,
        teamByCategory,
        enterEditMode,
        cancelEditMode,
        handleEditFormChange,
        handleEditTeamChange,
        handleEditTeamFeeChange,
        handleEditTeamSubJobChange,
        handleEditReplaceTeamMember,
        handleSaveEdit,
    };
}
