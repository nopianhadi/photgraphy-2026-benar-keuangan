import React, { useState, useMemo } from 'react';
import { Project, ProjectStatusConfig } from '../../../types';
import StatCard from '../../../shared/ui/StatCard';
import DonutChart from '../../../shared/ui/DonutChart';
import { FolderKanbanIcon, ClockIcon, CheckSquareIcon } from '../../../constants';
import { ChevronDown, BarChart2 } from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// --- Project Value by Type Chart Component ---
export const ProjectValueByTypeChart: React.FC<{ projects: Project[] }> = ({ projects }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        const typeValues = projects.reduce((acc, p) => {
            acc[p.projectType] = (acc[p.projectType] || 0) + p.totalCost;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(typeValues)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Top 6 types
    }, [projects]);

    const maxValue = Math.max(...chartData.map(d => d.value), 1);
    const colors = ['from-blue-600 to-cyan-400', 'from-purple-500 to-pink-400', 'from-green-500 to-emerald-400', 'from-orange-500 to-amber-400', 'from-pink-500 to-rose-400', 'from-indigo-500 to-blue-800'];

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-brand-text-secondary">
                Belum ada data Acara Pernikahan
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {chartData.map((item, index) => {
                const percentage = (item.value / maxValue) * 100;
                const isHovered = hoveredIndex === index;
                return (
                    <div
                        key={item.name}
                        className="relative"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-sm font-medium transition-colors ${isHovered ? 'text-brand-accent' : 'text-brand-text-light'}`}>
                                {item.name}
                            </span>
                            <span className="text-xs font-semibold text-brand-text-secondary">
                                {formatCurrency(item.value)}
                            </span>
                        </div>
                        <div className="h-3 bg-brand-bg rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-500 rounded-full ${isHovered ? 'shadow-lg' : ''}`}
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export interface ProjectAnalyticsProps {
    projects: Project[];
    projectStatusConfig: ProjectStatusConfig[];
    totals: {
        activeProjects: number;
        [key: string]: any;
    };
    onStatCardClick: (stat: 'count' | 'deadline' | 'top_type' | 'status_dist') => void;
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ projects, projectStatusConfig, totals, onStatCardClick }) => {
    const activeProjects = useMemo(() => projects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan'), [projects]);

    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const in7Days = new Date(today);
        in7Days.setDate(in7Days.getDate() + 7);

        const deadlineSoonCount = activeProjects.filter(p => {
            const d = new Date(p.deadlineDate || p.date);
            d.setHours(0, 0, 0, 0);
            return d >= today && d <= in7Days;
        }).length;

        const projectTypeCounts = projects.reduce((acc, p) => {
            acc[p.projectType] = (acc[p.projectType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topProjectType = Object.keys(projectTypeCounts).length > 0
            ? Object.entries(projectTypeCounts).sort(([, a], [, b]) => b - a)[0][0]
            : 'N/A';

        const statusCounts = activeProjects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const topStatus = Object.keys(statusCounts).length > 0
            ? Object.entries(statusCounts).sort(([, a], [, b]) => b - a)[0][0]
            : 'N/A';

        return { activeCount: totals.activeProjects, deadlineSoonCount, topProjectType, topStatus };
    }, [activeProjects, projects, totals.activeProjects]);

    const [showCharts, setShowCharts] = useState(false);

    const projectStatusDistribution = useMemo(() => {
        const statusCounts = activeProjects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusCounts).map(([label, value]) => {
            const config = projectStatusConfig.find(s => s.name === label);
            return {
                label,
                value,
                color: config ? config.color : '#64748b'
            };
        }).sort((a, b) => b.value - a.value);
    }, [activeProjects, projectStatusConfig]);

    return (
        <div className="mb-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <div className="widget-animate transition-transform duration-200 hover:scale-105" style={{ animationDelay: '100ms' }}>
                    <StatCard
                        icon={<FolderKanbanIcon className="w-5 h-5 md:w-6 md:h-6" />}
                        title="Acara Pernikahan Aktif"
                        value={String(stats.activeCount)}
                        subtitle="Acara Pernikahan yang sedang berjalan"
                        colorVariant="blue"
                        description={`Jumlah Acara Pernikahan yang sedang aktif (belum selesai atau dibatalkan).\n\nTotal: ${stats.activeCount} Acara Pernikahan\n\nFokus pada penyelesaian pekerjaan Acara Pernikahan-Acara Pernikahan ini.`}
                        onClick={() => onStatCardClick('count')}
                    />
                </div>
                <div className="widget-animate transition-transform duration-200 hover:scale-105" style={{ animationDelay: '200ms' }}>
                    <StatCard
                        icon={<ClockIcon className="w-5 h-5 md:w-6 md:h-6" />}
                        title="Deadline Dekat"
                        value={String(stats.deadlineSoonCount)}
                        subtitle="Acara Pernikahan jatuh tempo 7 hari ke depan"
                        colorVariant="orange"
                        description={`Acara Pernikahan dengan deadline dalam 7 hari ke depan.\n\nPerlu perhatian: ${stats.deadlineSoonCount} Acara Pernikahan\n\nPastikan Acara Pernikahan selesai tepat waktu.`}
                        onClick={() => onStatCardClick('deadline')}
                    />
                </div>
                <div className="widget-animate transition-transform duration-200 hover:scale-105" style={{ animationDelay: '300ms' }}>
                    <StatCard
                        icon={<CheckSquareIcon className="w-5 h-5 md:w-6 md:h-6" />}
                        title="Status Terbanyak"
                        value={stats.topStatus}
                        subtitle="Progres Acara Pernikahan Pengantin paling banyak saat ini"
                        colorVariant="purple"
                        description={`Status yang paling banyak saat ini: ${stats.topStatus}.\n\nMembantu memahami di tahap mana Acara Pernikahan-Acara Pernikahan Anda berada.`}
                        onClick={() => onStatCardClick('status_dist')}
                    />
                </div>
                <div className="widget-animate transition-transform duration-200 hover:scale-105" style={{ animationDelay: '400ms' }}>
                    <StatCard
                        icon={<FolderKanbanIcon className="w-5 h-5 md:w-6 md:h-6" />}
                        title="Jenis Acara Pernikahan Teratas"
                        value={stats.topProjectType}
                        subtitle="Jenis paling banyak dikerjakan"
                        colorVariant="purple"
                        description={`Jenis Acara Pernikahan yang paling sering Anda kerjakan.\n\nJenis Teratas: ${stats.topProjectType}\n\nInformasi ini membantu memahami fokus pekerjaan.`}
                        onClick={() => onStatCardClick('top_type')}
                    />
                </div>
            </div>

            {/* Progressive Disclosure Toggle for In-Depth Analytics */}
            <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-brand-text-secondary">
                    <span className="font-semibold text-brand-text-light">{stats.activeCount}</span> Acara Pernikahan aktif terpantau
                </p>
                <button
                    type="button"
                    onClick={() => setShowCharts(prev => !prev)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-surface border border-brand-border/80 text-brand-text-secondary hover:text-brand-text-light hover:border-brand-accent/50 transition-all shadow-sm active:scale-95"
                    aria-label="Buka analitik visual proyek"
                >
                    <BarChart2 className="w-3.5 h-3.5 text-brand-accent" />
                    <span>{showCharts ? 'Tutup Analisis Grafik' : 'Lihat Analisis Grafik & Nilai'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showCharts ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {showCharts && (
                <div className="bg-brand-surface p-4 md:p-6 rounded-2xl shadow-lg border border-brand-border widget-animate animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-base md:text-lg font-bold text-gradient mb-2">Distribusi Progres Acara Pernikahan Pengantin</h3>
                            <p className="text-xs text-brand-text-secondary mb-3 md:mb-4">Breakdown Progres Acara Pernikahan Pengantin aktif</p>
                            <DonutChart data={projectStatusDistribution} />
                        </div>
                        <div className="md:col-span-2">
                            <h3 className="text-base md:text-lg font-bold text-gradient mb-2">Nilai Acara Pernikahan per Jenis</h3>
                            <p className="text-xs text-brand-text-secondary mb-3 md:mb-4">Total nilai Acara Pernikahan berdasarkan jenis Acara Pernikahan</p>
                            <ProjectValueByTypeChart projects={activeProjects} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectAnalytics;
