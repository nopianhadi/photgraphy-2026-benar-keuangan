import React from 'react';
import { Project, Profile, TeamMember, Client, Package, TeamProjectPayment, Transaction, Card, AssignedTeamMember, PaymentStatus, SubStatusConfig } from '../../../types';
import { PencilIcon, Share2Icon, CheckCircleIcon, ClipboardListIcon, FileTextIcon } from '../../../constants';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

interface ProjectDetailViewProps {
    project: Project;
    profile: Profile;
    teamMembers: TeamMember[];
    clients: Client[];
    packages: Package[];
    onEdit: () => void;
    onShareBriefing: () => void;
    onUpdateStatus: (status: string) => void;
    onToggleSubStatus: (name: string, active: boolean) => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, profile, teamMembers, clients, packages, onEdit, onShareBriefing, onUpdateStatus, onToggleSubStatus }) => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <h4 className="text-lg font-bold text-brand-text-light flex items-center gap-2">
                        <ClipboardListIcon className="w-5 h-5 text-brand-accent" /> Detail Acara
                    </h4>
                    <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border space-y-4 text-sm">
                        <div className="flex justify-between py-2 border-b border-brand-border/50">
                            <span className="text-brand-text-secondary">Pengantin</span>
                            <span className="font-bold text-brand-text-light">{project.clientName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-brand-border/50">
                            <span className="text-brand-text-secondary">Tanggal</span>
                            <span className="font-bold text-brand-text-light">{new Date(project.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-brand-border/50">
                            <span className="text-brand-text-secondary">Lokasi</span>
                            <span className="font-bold text-brand-text-light">{project.location}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-brand-text-secondary">Package</span>
                            <span className="font-bold text-brand-accent">{project.packageName}</span>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h4 className="text-lg font-bold text-brand-text-light flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-brand-success" /> Progres Pengerjaan
                    </h4>
                    <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border">
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Status Utama</label>
                            <select
                                value={project.status}
                                onChange={(e) => onUpdateStatus(e.target.value)}
                                className="w-full p-3 rounded-xl bg-brand-surface border border-brand-border text-brand-text-light font-bold outline-none"
                            >
                                {profile.projectStatusConfig.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Sub-Status / Tahapan</label>
                            {(project.customSubStatuses || []).map(sub => (
                                <label key={sub.name} className="flex items-center gap-3 p-3 rounded-xl bg-brand-surface border border-brand-border cursor-pointer transition-all hover:border-brand-accent/50">
                                    <input
                                        type="checkbox"
                                        checked={project.activeSubStatuses?.includes(sub.name)}
                                        onChange={(e) => onToggleSubStatus(sub.name, e.target.checked)}
                                        className="w-5 h-5 rounded border-brand-border text-brand-accent focus:ring-brand-accent/50"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-brand-text-light">{sub.name}</p>
                                        {sub.note && <p className="text-[10px] text-brand-text-secondary">{sub.note}</p>}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <div className="flex gap-3">
                <button onClick={onEdit} className="flex-1 py-3 rounded-xl bg-brand-surface border border-brand-border text-brand-text-light font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                    <PencilIcon className="w-5 h-5" /> Edit Data
                </button>
                <button onClick={onShareBriefing} className="flex-1 py-3 rounded-xl bg-brand-accent text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 hover:scale-[1.02] transition-all">
                    <Share2Icon className="w-5 h-5" /> Bagikan Briefing
                </button>
            </div>
        </div>
    );
};

export default ProjectDetailView;
