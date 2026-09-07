import { useState, useMemo, useCallback } from 'react';
import { Project, ProjectStatusConfig, TeamProjectPayment, Transaction, Card, FinancialPocket } from '../../../types';
import { updateProject as updateProjectInDb, deleteProject as deleteProjectInDb } from '../../../services/projects';

export const useProjects = (
    projects: Project[],
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
    showNotification: (message: string) => void
) => {
    const handleStatusUpdate = useCallback(async (projectId: string, newStatus: string, config: ProjectStatusConfig[]) => {
        try {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;

            const statusConfig = config.find(s => s.name === newStatus);
            const nextProgress = statusConfig?.defaultProgress ?? 0;

            const updated = await updateProjectInDb(projectId, {
                status: newStatus as any,
                progress: nextProgress as any,
                activeSubStatuses: [] as any
            });

            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: updated.status, progress: updated.progress, activeSubStatuses: [] } : p));
            showNotification(`Status berhasil diperbarui ke ${newStatus}`);
        } catch (err) {
            showNotification('Gagal memperbarui status.');
        }
    }, [projects, setProjects, showNotification]);

    const handleDeleteProject = useCallback(async (projectId: string) => {
        if (!window.confirm('Hapus Acara Pernikahan ini?')) return;
        try {
            await deleteProjectInDb(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            showNotification('Acara Pernikahan berhasil dihapus.');
        } catch (err) {
            showNotification('Gagal menghapus Acara Pernikahan.');
        }
    }, [setProjects, showNotification]);

    return {
        handleStatusUpdate,
        handleDeleteProject
    };
};
