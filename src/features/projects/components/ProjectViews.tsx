import React from 'react';
import { Project, ProjectStatusConfig, Client } from '../../../types';
import ProjectCard from './ProjectCard';
import { EyeIcon } from '../../../constants';
import { PencilIcon, Trash2Icon, ArrowDownIcon } from 'lucide-react';
import { getStatusColor, getStatusClass, getSubStatusText, getDisplayProgress } from '../utils/projectHelpers';

export interface ProjectListViewProps {
    projects: Project[];
    handleOpenDetailModal: (project: Project) => void;
    handleOpenForm: (mode: 'edit', project: Project) => void;
    handleProjectDelete: (projectId: string) => void;
    config: ProjectStatusConfig[];
    clients: Client[];
    handleQuickStatusChange: (projectId: string, newStatus: string, notifyClient: boolean) => Promise<void>;
    handleSendMessage: (project: Project) => void;
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
    projects, handleOpenDetailModal, handleOpenForm, handleProjectDelete,
    config, clients, handleQuickStatusChange, handleSendMessage,
    hasMore, isLoadingMore, onLoadMore
}) => {
    const ProgressBar: React.FC<{ progress: number, status: string, config: ProjectStatusConfig[] }> = ({ progress, status, config }) => (
        <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: getStatusColor(status, config) }}></div>
        </div>
    );

    return (
        <div>
            {/* Mobile cards - Using ProjectCard Component */}
            <div className="md:hidden space-y-3">
                {projects.map(p => {
                    const client = clients.find(c => c.id === p.clientId);
                    return (
                        <ProjectCard
                            key={p.id}
                            project={p}
                            client={client}
                            projectStatusConfig={config}
                            onStatusChange={(projectId, newStatus) => handleQuickStatusChange(projectId, newStatus, false)}
                            onViewDetails={handleOpenDetailModal}
                            onEdit={(project) => handleOpenForm('edit', project)}
                            onSendMessage={handleSendMessage}
                        />
                    );
                })}
                {projects.length === 0 && <p className="text-center py-8 text-sm text-brand-text-secondary">Tidak ada Acara Pernikahan dalam kategori ini.</p>}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-brand-text-secondary uppercase">
                        <tr>
                            <th className="px-4 py-4 font-medium tracking-wider text-center w-12">No</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Nama Acara Pernikahan</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Pengantin</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Tanggal</th>
                            <th className="px-6 py-4 font-medium tracking-wider min-w-[200px]">Progress</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Tim</th>
                            <th className="px-6 py-4 font-medium tracking-wider text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {projects.map((p, index) => (
                            <tr key={p.id} className="hover:bg-brand-bg transition-colors">
                                <td className="px-4 py-4 text-center font-medium text-brand-text-secondary">{index + 1}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-brand-text-light">{p.projectName}</p>
                                    </div>
                                    <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${getStatusClass(p.status, config)}`}>
                                        {getSubStatusText(p)}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-brand-text-primary">{p.clientName}</td>
                                <td className="px-6 py-4 text-brand-text-primary">{new Date(p.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <ProgressBar progress={getDisplayProgress(p, config)} status={p.status} config={config} />
                                        <span className="text-xs font-semibold text-brand-text-secondary">{getDisplayProgress(p, config)}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-brand-text-primary">{p.team.map(t => t.name.split(' ')[0]).join(', ') || '-'}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center space-x-1.5">
                                        <button onClick={() => handleOpenDetailModal(p)} className="btn-box-read w-8 h-8 rounded-lg" title="Detail Acara Pernikahan"><EyeIcon className="w-4 h-4 text-white flex-shrink-0" /></button>
                                        <button onClick={() => handleOpenForm('edit', p)} className="btn-box-edit w-8 h-8 rounded-lg" title="Edit Acara Pernikahan"><PencilIcon className="w-4 h-4 flex-shrink-0" /></button>
                                        <button onClick={() => handleProjectDelete(p.id)} className="btn-box-delete w-8 h-8 rounded-lg" title="Hapus Acara Pernikahan"><Trash2Icon className="w-4 h-4 text-white flex-shrink-0" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {hasMore && (
                <div className="mt-8 flex justify-center pb-8">
                    <button
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary hover:bg-brand-surface transition-all disabled:opacity-50"
                    >
                        {isLoadingMore ? (
                            <>
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                Loading...
                            </>
                        ) : (
                            <>
                                <ArrowDownIcon className="w-4 h-4" />
                                Muat Lebih Banyak
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export interface ProjectKanbanViewProps {
    projects: Project[];
    handleOpenDetailModal: (project: Project) => void;
    draggedProjectId: string | null;
    handleDragStart: (e: React.DragEvent<HTMLDivElement>, projectId: string) => void;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>, newStatus: string) => void;
    config: ProjectStatusConfig[];
}

export const ProjectKanbanView: React.FC<ProjectKanbanViewProps> = ({
    projects, handleOpenDetailModal, draggedProjectId,
    handleDragStart, handleDragOver, handleDrop, config
}) => {
    const ProgressBar: React.FC<{ progress: number, status: string, config: ProjectStatusConfig[] }> = ({ progress, status, config }) => (
        <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: getStatusColor(status, config) }}></div>
        </div>
    );

    return (
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 overscroll-x-contain scroll-smooth projects-kanban-scroll hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
            {config
                .filter(statusConfig => statusConfig.name !== 'Dibatalkan')
                .map(statusConfig => {
                    const status = statusConfig.name;
                    return (
                        <div
                            key={status}
                            className="w-72 min-w-[280px] md:w-80 flex-shrink-0 bg-brand-bg rounded-2xl border border-brand-border snap-start"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status)}
                        >
                            <div className="p-4 font-semibold text-brand-text-light border-b-2 flex justify-between items-center sticky top-0 bg-brand-bg/80 backdrop-blur-sm rounded-t-2xl z-10" style={{ borderBottomColor: getStatusColor(status, config) }}>
                                <span>{status}</span>
                                <span className="text-sm font-normal bg-brand-surface text-brand-text-secondary px-2.5 py-1 rounded-full">{projects.filter(p => p.status === status).length}</span>
                            </div>
                            <div className="p-3 space-y-3 min-h-[200px] h-[calc(100vh-380px)] sm:h-[calc(100vh-420px)] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                                {projects
                                    .filter(p => p.status === status)
                                    .map(p => (
                                        <div
                                            key={p.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, p.id)}
                                            onClick={() => handleOpenDetailModal(p)}
                                            className={`p-4 bg-brand-surface rounded-xl cursor-grab border-l-4 shadow-lg ${draggedProjectId === p.id ? 'opacity-50 ring-2 ring-brand-accent' : 'opacity-100'}`}
                                            style={{ borderLeftColor: getStatusColor(p.status, config) }}
                                        >
                                            <p className="font-semibold text-sm text-brand-text-light">{p.projectName}</p>
                                            <p className="text-xs text-brand-text-secondary mt-1">{p.clientName}</p>
                                            <p className="text-xs font-bold text-brand-text-primary mt-1">
                                                {getSubStatusText(p)}
                                            </p>
                                            <ProgressBar progress={getDisplayProgress(p, config)} status={p.status} config={config} />
                                            <div className="flex justify-between items-center mt-3 text-xs">
                                                <span className="text-brand-text-secondary">{new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    );
                })
            }
        </div>
    );
};
