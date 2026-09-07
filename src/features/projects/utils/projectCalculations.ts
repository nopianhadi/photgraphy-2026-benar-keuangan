import { Project } from '../../../types';

export interface ProjectModalStats {
    activeCount: number;
    allActiveProjectsForStats: Project[];
    deadlineSoonProjects: Project[];
    topProjectType: string;
    topStatus: string;
}

export function calculateProjectsModalStats(projects: Project[]): ProjectModalStats {
    const allActiveProjectsForStats = projects.filter(
        p => p.status !== 'Selesai' && p.status !== 'Dibatalkan'
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const deadlineSoonProjects = allActiveProjectsForStats.filter(p => {
        const d = new Date(p.deadlineDate || p.date);
        d.setHours(0, 0, 0, 0);
        return d >= today && d <= in7Days;
    });

    const projectTypeCounts = projects.reduce((acc, p) => {
        acc[p.projectType] = (acc[p.projectType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topProjectType = Object.keys(projectTypeCounts).length > 0
        ? Object.entries(projectTypeCounts).sort(([, a], [, b]) => b - a)[0][0]
        : 'N/A';

    const statusCounts = allActiveProjectsForStats.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topStatus = Object.keys(statusCounts).length > 0
        ? Object.entries(statusCounts).sort(([, a], [, b]) => b - a)[0][0]
        : 'N/A';

    return {
        activeCount: allActiveProjectsForStats.length,
        allActiveProjectsForStats,
        deadlineSoonProjects,
        topProjectType,
        topStatus
    };
}
