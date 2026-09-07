import React from 'react';
import { Project, ProjectStatusConfig, Client } from '../../../types';
import ProjectCard from '../../projects/components/ProjectCard';
import { ListIcon } from '../../../constants';

interface ProjectListProps {
    projects: Project[];
    clients: Client[];
    config: ProjectStatusConfig[];
    onViewDetails: (project: Project) => void;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
    onStatusChange: (projectId: string, status: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, clients, config, onViewDetails, onEdit, onDelete, onStatusChange }) => {
    return (
        <div className="space-y-4">
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            client={clients.find(c => c.id === project.clientId)}
                            projectStatusConfig={config}
                            onViewDetails={onViewDetails}
                            onEdit={onEdit}
                            onStatusChange={(id, status) => onStatusChange(id, status)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-brand-surface rounded-2xl border border-dashed border-brand-border">
                    <ListIcon className="w-12 h-12 text-brand-text-secondary opacity-20 mb-4" />
                    <p className="text-brand-text-secondary">Tidak ada Acara Pernikahan yang ditemukan.</p>
                </div>
            )}
        </div>
    );
};

export default ProjectList;
