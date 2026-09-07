import { Project, ProjectStatusConfig } from '../../../types';

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const getSubStatusText = (project: Project): string => {
    if (project.activeSubStatuses && project.activeSubStatuses.length > 0) {
        return project.activeSubStatuses.join(', ');
    }
    if (project.status === 'Dikirim' && project.shippingDetails) {
        return `Dikirim: ${project.shippingDetails}`;
    }
    return project.status;
};

export const getStatusColor = (status: string, config: ProjectStatusConfig[]): string => {
    const statusConfig = config.find(c => c.name === status);
    return statusConfig ? statusConfig.color : '#64748b'; // slate-500 default
};

export const getStatusClass = (status: string, config: ProjectStatusConfig[]) => {
    const color = getStatusColor(status, config);
    const colorMap: { [key: string]: string } = {
        '#10b981': 'status-badge status-success', // Selesai
        '#3b82f6': 'status-badge status-info', // Dikonfirmasi
        '#8b5cf6': 'status-badge status-purple', // Editing
        '#f97316': 'status-badge status-orange', // Produksi Fisik
        '#06b6d4': 'status-badge status-cyan', // Dikirim
        '#eab308': 'status-badge status-warning', // Tertunda
        '#6366f1': 'status-badge status-info', // Persiapan
        '#ef4444': 'status-badge status-danger', // Dibatalkan
        '#14b8a6': 'status-badge status-cyan', // Revisi
    };
    return colorMap[color] || 'status-badge status-gray';
};

/** Progress 0-100 from project.progress or derived from status order / defaultProgress in config */
export const getDisplayProgress = (project: Project, config: ProjectStatusConfig[]): number => {
    const raw = project.progress;
    if (typeof raw === 'number' && !Number.isNaN(raw) && raw >= 0 && raw <= 100) return Math.round(raw);
    const idx = config.findIndex(s => s.name === project.status);
    if (idx === -1) return 0;
    const statusConfig = config[idx];
    if (statusConfig.defaultProgress != null && statusConfig.defaultProgress !== undefined) {
        return Math.min(100, Math.max(0, statusConfig.defaultProgress));
    }
    return Math.round(((idx + 1) / config.length) * 100);
};

export const getProgressForStatus = (status: string, config: ProjectStatusConfig[]): number => {
    const idx = config.findIndex(s => s.name === status);
    if (idx === -1) return 0;
    const statusConfig = config[idx];
    if (statusConfig.defaultProgress != null && statusConfig.defaultProgress !== undefined) {
        return Math.min(100, Math.max(0, statusConfig.defaultProgress));
    }
    return Math.round(((idx + 1) / config.length) * 100);
};
