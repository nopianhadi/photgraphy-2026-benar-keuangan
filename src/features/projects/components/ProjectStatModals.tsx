import React from 'react';
import StatCardModal from '../../../shared/ui/StatCardModal';
import { FolderKanbanIcon, ClockIcon, CheckSquareIcon } from '../../../constants';
import { Project, Client } from '../../../types';
import { ProjectModalStats } from '../utils/projectCalculations';

interface ProjectStatModalsProps {
    activeStatModal: string | null;
    onClose: () => void;
    statsForModal: ProjectModalStats;
    allActiveProjectsForStats: Project[];
    projects: Project[];
    clients: Client[];
}

export const ProjectStatModals: React.FC<ProjectStatModalsProps> = ({
    activeStatModal,
    onClose,
    statsForModal,
    allActiveProjectsForStats,
    projects,
    clients
}) => {
    return (
        <>
            {/* Modal: Acara Pernikahan Aktif */}
            <StatCardModal
                isOpen={activeStatModal === 'count'}
                onClose={onClose}
                icon={<FolderKanbanIcon className="w-6 h-6" />}
                title="Acara Pernikahan Aktif"
                value={String(statsForModal.activeCount)}
                subtitle="Acara Pernikahan yang sedang berjalan"
                colorVariant="blue"
                description={`Jumlah Acara Pernikahan yang sedang aktif.\n\nTotal: ${statsForModal.activeCount} Acara Pernikahan`}
            >
                <div className="space-y-3">
                    <h4 className="font-semibold text-brand-text-light border-b border-brand-border pb-2">
                        Daftar Acara Pernikahan Aktif
                    </h4>
                    {allActiveProjectsForStats.slice(0, 10).map(project => (
                        <div key={project.id} className="p-3 bg-brand-bg rounded-lg hover:bg-brand-input transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <p className="font-semibold text-brand-text-light text-sm">{project.projectName}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-accent/20 text-brand-accent">
                                    {project.status}
                                </span>
                            </div>
                            <p className="text-xs text-brand-text-secondary">
                                {clients.find(c => c.id === project.clientId)?.name}
                            </p>
                        </div>
                    ))}
                    {allActiveProjectsForStats.length > 10 && (
                        <p className="text-xs text-brand-text-secondary text-center pt-2">
                            Dan {allActiveProjectsForStats.length - 10} Acara Pernikahan lainnya...
                        </p>
                    )}
                </div>
            </StatCardModal>

            {/* Modal: Deadline Dekat */}
            <StatCardModal
                isOpen={activeStatModal === 'deadline'}
                onClose={onClose}
                icon={<ClockIcon className="w-6 h-6" />}
                title="Deadline Dekat"
                value={String(statsForModal.deadlineSoonProjects.length)}
                subtitle="Acara Pernikahan jatuh tempo 7 hari ke depan"
                colorVariant="orange"
                description={`Acara Pernikahan dengan deadline dalam 7 hari ke depan: ${statsForModal.deadlineSoonProjects.length} Acara Pernikahan`}
            >
                <div className="space-y-3">
                    <h4 className="font-semibold text-brand-text-light border-b border-brand-border pb-2">
                        Acara Pernikahan Mendekati Deadline
                    </h4>
                    {statsForModal.deadlineSoonProjects.length > 0 ? (
                        statsForModal.deadlineSoonProjects.map(project => (
                            <div key={project.id} className="p-3 bg-brand-bg rounded-lg hover:bg-brand-input transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-semibold text-brand-text-light text-sm">{project.projectName}</p>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                                        {new Date(project.deadlineDate || project.date).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <p className="text-xs text-brand-text-secondary">
                                    {clients.find(c => c.id === project.clientId)?.name}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-brand-text-secondary py-4 text-center">
                            Tidak ada Acara Pernikahan dengan deadline dalam 7 hari ke depan
                        </p>
                    )}
                </div>
            </StatCardModal>

            {/* Modal: Status Terbanyak */}
            <StatCardModal
                isOpen={activeStatModal === 'status_dist'}
                onClose={onClose}
                icon={<CheckSquareIcon className="w-6 h-6" />}
                title="Status Terbanyak"
                value={statsForModal.topStatus}
                subtitle="Progres Acara Pernikahan Pengantin paling banyak saat ini"
                colorVariant="purple"
                description={`Status paling banyak: ${statsForModal.topStatus}`}
            >
                <div className="space-y-3">
                    <h4 className="font-semibold text-brand-text-light border-b border-brand-border pb-2">
                        Acara Pernikahan dengan Status: {statsForModal.topStatus}
                    </h4>
                    {allActiveProjectsForStats.filter(p => p.status === statsForModal.topStatus).slice(0, 10).map(project => (
                        <div key={project.id} className="p-3 bg-brand-bg rounded-lg hover:bg-brand-input transition-colors">
                            <p className="font-semibold text-brand-text-light text-sm">{project.projectName}</p>
                            <p className="text-xs text-brand-text-secondary">
                                {clients.find(c => c.id === project.clientId)?.name}
                            </p>
                        </div>
                    ))}
                    {allActiveProjectsForStats.filter(p => p.status === statsForModal.topStatus).length > 10 && (
                        <p className="text-xs text-brand-text-secondary text-center pt-2">
                            Dan {allActiveProjectsForStats.filter(p => p.status === statsForModal.topStatus).length - 10} Acara Pernikahan lainnya...
                        </p>
                    )}
                </div>
            </StatCardModal>

            {/* Modal: Jenis Acara Pernikahan Teratas */}
            <StatCardModal
                isOpen={activeStatModal === 'top_type'}
                onClose={onClose}
                icon={<FolderKanbanIcon className="w-6 h-6" />}
                title="Jenis Acara Pernikahan Teratas"
                value={statsForModal.topProjectType}
                subtitle="Jenis paling banyak dikerjakan"
                colorVariant="purple"
                description={`Jenis Acara Pernikahan yang paling sering Anda kerjakan.\n\nJenis Teratas: ${statsForModal.topProjectType}\n\nInformasi ini membantu Anda memahami spesialisasi bisnis dan fokus pemasaran.`}
            >
                <div className="space-y-3">
                    <h4 className="font-semibold text-brand-text-light border-b border-brand-border pb-2">
                        Distribusi Jenis Acara Pernikahan
                    </h4>
                    {Object.entries(
                        projects.reduce((acc, p) => {
                            acc[p.projectType] = (acc[p.projectType] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>)
                    ).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                        <div key={type} className="p-3 bg-brand-bg rounded-lg flex justify-between items-center">
                            <p className="font-semibold text-brand-text-light text-sm">{type}</p>
                            <span className="text-sm text-brand-accent font-semibold">{count} Acara Pernikahan</span>
                        </div>
                    ))}
                </div>
            </StatCardModal>
        </>
    );
};

export default ProjectStatModals;
