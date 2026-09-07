import { useState, useMemo } from 'react';
import { Project } from '../../../types';

export function useProjectFilters(projects: Project[]) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [projectListTab, setProjectListTab] = useState<'active' | 'completed' | 'all'>('active');

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => viewMode === 'kanban' || statusFilter === 'all' || p.status === statusFilter)
            .filter(p =>
                p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .filter(p => {
                if (!dateFrom && !dateTo) return true;
                const d = new Date(p.date);
                d.setHours(0, 0, 0, 0);
                if (dateFrom) {
                    const from = new Date(dateFrom);
                    from.setHours(0, 0, 0, 0);
                    if (d < from) return false;
                }
                if (dateTo) {
                    const to = new Date(dateTo);
                    to.setHours(23, 59, 59, 999);
                    if (d > to) return false;
                }
                return true;
            });
    }, [projects, searchTerm, statusFilter, viewMode, dateFrom, dateTo]);

    const activeProjects = useMemo(
        () => filteredProjects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan'),
        [filteredProjects]
    );

    const completedAndCancelledProjects = useMemo(
        () => filteredProjects.filter(p => p.status === 'Selesai' || p.status === 'Dibatalkan'),
        [filteredProjects]
    );

    const displayProjects = useMemo(() => {
        if (projectListTab === 'active') return activeProjects;
        if (projectListTab === 'completed') return completedAndCancelledProjects;
        return filteredProjects;
    }, [projectListTab, activeProjects, completedAndCancelledProjects, filteredProjects]);

    return {
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
    };
}
