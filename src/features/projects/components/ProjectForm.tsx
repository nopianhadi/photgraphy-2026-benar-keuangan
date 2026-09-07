import React, { useState, useMemo } from 'react';
import { TeamMember, Client, TeamProjectPayment, Profile, PrintingItem, SubStatusConfig } from '../../../types';
import Modal from '../../../shared/ui/Modal';
import CollapsibleSection from '../../../shared/ui/CollapsibleSection';
import { Trash2Icon } from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export interface ProjectFormProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    formData: any;
    onFormChange: (e: React.ChangeEvent<any>) => void;
    onSubStatusChange: (option: string, isChecked: boolean) => void;
    onClientChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onTeamChange: (member: TeamMember) => void;
    onTeamFeeChange: (memberId: string, fee: number) => void;
    onReplaceTeamMember?: (oldMemberId: string, newMember: TeamMember) => void;
    onTeamSubJobChange: (memberId: string, subJob: string) => void;
    onTeamClientPortalLinkChange: (memberId: string, link: string) => void;
    onCustomSubStatusChange: (index: number, field: 'name' | 'note', value: string) => void;
    onAddCustomSubStatus: () => void;
    onRemoveCustomSubStatus: (index: number) => void;
    onSubmit: (e: React.FormEvent) => Promise<void> | void;
    clients: Client[];
    teamMembers: TeamMember[];
    teamProjectPayments: TeamProjectPayment[];
    profile: Profile;
    teamByCategory: Record<string, Record<string, TeamMember[]>>;
    showNotification: (message: string) => void;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
    isOpen, onClose, mode, formData, onFormChange, onSubStatusChange, onClientChange,
    onTeamChange, onTeamFeeChange, onReplaceTeamMember, onTeamSubJobChange,
    onCustomSubStatusChange, onAddCustomSubStatus, onRemoveCustomSubStatus,
    onSubmit, clients, teamMembers,
    teamProjectPayments,
    profile, teamByCategory,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInternalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const paidMemberIdsForThisProject = useMemo(() => {
        const projectId = formData?.id;
        if (!projectId) return new Set<string>();
        return new Set(
            (teamProjectPayments || [])
                .filter(p => p.projectId === projectId && p.status === 'Paid')
                .map(p => p.teamMemberId)
        );
    }, [teamProjectPayments, formData?.id]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'add' ? 'Tambah Acara Pernikahan Baru (Operasional)' : `Edit Acara Pernikahan: ${formData.projectName}`}
            size="4xl"
        >
            <form onSubmit={handleInternalSubmit} className="space-y-4 md:space-y-6">
                {/* Hapus max-h + overflow-y-auto agar tidak ada nested scroll di mobile.
                    Scroll ditangani oleh modal-content-area di Modal.tsx */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-4 md:gap-y-6">
                    {/* --- LEFT COLUMN --- */}
                    <div className="space-y-5 md:space-y-6">
                        {/* Section 1: Basic Info */}
                        <section className="bg-brand-surface rounded-2xl p-4 border border-brand-border">
                            <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border pb-2 mb-4">Informasi Dasar Acara Pernikahan</h4>
                            <div className="space-y-5">
                                {mode === 'add' && (
                                    <div className="space-y-2">
                                        <label htmlFor="clientId" className="block text-xs font-semibold text-brand-text-secondary">Pengantin</label>
                                        <select id="clientId" name="clientId" value={formData.clientId} onChange={onClientChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" required>
                                            <option value="">Pilih Pengantin...</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <p className="text-xs text-brand-text-secondary">Pilih pengantin yang terkait dengan Acara Pernikahan ini</p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label htmlFor="projectName" className="block text-xs font-semibold text-brand-text-secondary">Nama Acara Pernikahan</label>
                                    <input type="text" id="projectName" name="projectName" value={formData.projectName} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" placeholder="Masukkan nama Acara Pernikahan" required />
                                    <p className="text-xs text-brand-text-secondary">Nama Acara Pernikahan (contoh: Wedding John & Jane)</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="projectType" className="block text-xs font-semibold text-brand-text-secondary">Jenis Acara Pernikahan</label>
                                        <select id="projectType" name="projectType" value={formData.projectType} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" required>
                                            <option value="" disabled>Pilih Jenis...</option>
                                            {profile.projectTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                        </select>
                                        <p className="text-xs text-brand-text-secondary">Kategori jenis Acara Pernikahan</p>
                                    </div>
                                    {mode === 'add' && (
                                        <div className="space-y-2">
                                            <label htmlFor="status" className="block text-xs font-semibold text-brand-text-secondary">Progres Acara Pernikahan Pengantin</label>
                                            <select id="status" name="status" value={formData.status} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" required>
                                                {profile.projectStatusConfig.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            </select>
                                            <p className="text-xs text-brand-text-secondary">Status progres Acara Pernikahan saat ini</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="location" className="block text-xs font-semibold text-brand-text-secondary">Lokasi (Kota)</label>
                                        <input type="text" id="location" name="location" value={formData.location} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" placeholder="Kota Contoh: Jakarta" />
                                        <p className="text-xs text-brand-text-secondary">Kota tempat Acara Pernikahan berlangsung</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="address" className="block text-xs font-semibold text-brand-text-secondary">Alamat Lengkap / Gedung</label>
                                        <textarea id="address" name="address" value={formData.address} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" placeholder="Contoh: Gedung Mulia, Jl. Gatot Subroto No. 1" rows={3}></textarea>
                                        <p className="text-xs text-brand-text-secondary">Alamat spesifik venue Acara Pernikahan</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Schedule & Details */}
                        <section className="bg-brand-surface rounded-2xl p-4 border border-brand-border">
                            <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border pb-2 mb-4">Jadwal & Detail</h4>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="date" className="block text-xs font-semibold text-brand-text-secondary">Tanggal Acara Pernikahan</label>
                                        <input type="date" id="date" name="date" value={formData.date || ''} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" required />
                                        <p className="text-xs text-brand-text-secondary">Tanggal pelaksanaan Acara Pernikahan</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="deadlineDate" className="block text-xs font-semibold text-brand-text-secondary">Deadline</label>
                                        <input type="date" id="deadlineDate" name="deadlineDate" value={formData.deadlineDate || ''} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" />
                                        <p className="text-xs text-brand-text-secondary">Batas waktu penyerahan hasil</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="startTime" className="block text-xs font-semibold text-brand-text-secondary">Waktu Mulai</label>
                                        <input type="time" id="startTime" name="startTime" value={formData.startTime || ''} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" />
                                        <p className="text-xs text-brand-text-secondary">Jam mulai Acara Pernikahan</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="endTime" className="block text-xs font-semibold text-brand-text-secondary">Waktu Selesai</label>
                                        <input type="time" id="endTime" name="endTime" value={formData.endTime || ''} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" />
                                        <p className="text-xs text-brand-text-secondary">Jam selesai Acara Pernikahan</p>
                                    </div>
                                </div>
                                {formData.status === 'Dikirim' && (
                                    <div className="space-y-2">
                                        <label htmlFor="shippingDetails" className="block text-xs font-semibold text-brand-text-secondary">Detail Pengiriman</label>
                                        <input type="text" id="shippingDetails" name="shippingDetails" value={formData.shippingDetails} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" placeholder="Masukkan detail pengiriman" />
                                        <p className="text-xs text-brand-text-secondary">Informasi pengiriman hasil ke pengantin</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section 3: Links & Notes */}
                        <CollapsibleSection
                            title="Tautan & Catatan"
                            defaultExpanded={false}
                            status={formData.driveLink || formData.notes ? 'valid' : undefined}
                            statusText={formData.driveLink || formData.notes ? 'Terisi' : undefined}
                        >
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="driveLink" className="block text-xs font-semibold text-brand-text-secondary">Link Brief/Moodboard (Internal)</label>
                                    <input type="url" id="driveLink" name="driveLink" value={formData.driveLink} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" placeholder="https://..." />
                                    <p className="text-xs text-brand-text-secondary">Link ke folder brief atau moodboard untuk tim internal</p>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="clientDriveLink" className="block text-xs font-semibold text-brand-text-secondary">Link File dari Pengantin</label>
                                    <input type="url" id="clientDriveLink" name="clientDriveLink" value={formData.clientDriveLink || ''} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" placeholder="https://drive.google.com/..." />
                                    <p className="text-xs text-brand-text-secondary">Link file atau referensi yang diberikan pengantin</p>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="finalDriveLink" className="block text-xs font-semibold text-brand-text-secondary">Link File Jadi (untuk Pengantin)</label>
                                    <input type="url" id="finalDriveLink" name="finalDriveLink" value={formData.finalDriveLink || ''} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" placeholder="https://drive.google.com/..." />
                                    <p className="text-xs text-brand-text-secondary">Link hasil akhir yang akan dibagikan ke pengantin</p>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="notes" className="block text-xs font-semibold text-brand-text-secondary">Catatan Tambahan</label>
                                    <textarea id="notes" name="notes" value={formData.notes} onChange={onFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all resize-none" placeholder="Catatan tambahan untuk Acara Pernikahan ini..." rows={4}></textarea>
                                    <p className="text-xs text-brand-text-secondary">Catatan penting terkait Acara Pernikahan ini</p>
                                </div>
                            </div>
                        </CollapsibleSection>
                    </div>

                    {/* --- RIGHT COLUMN --- */}
                    <div className="space-y-5 md:space-y-6">
                        {/* Section 4: Team Assignment */}
                        <section className="bg-brand-surface rounded-2xl p-4 border border-brand-border">
                            <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border pb-2 mb-4">Tugas Tim</h4>
                            <div className="space-y-6">
                                {(['Tim', 'Vendor'] as const).map(category => (
                                    <div key={category} className="space-y-4">
                                        <h5 className={`text-sm font-bold uppercase tracking-widest pb-2 border-b-2 flex items-center gap-2 ${category === 'Tim' ? 'text-blue-700 border-blue-700/20' : 'text-purple-600 border-purple-600/20'}`}>
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${category === 'Tim' ? 'bg-blue-700' : 'bg-purple-600'}`}></div>
                                            {category === 'Tim' ? 'Tim Internal' : 'Vendor / Mitra'}
                                        </h5>

                                        <div className="space-y-4">
                                            {Object.entries(teamByCategory[category] || {}).map(([role, members]) => (
                                                <div key={role} className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h6 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-tighter">{role}</h6>
                                                        <div className="h-px flex-grow bg-brand-border/30"></div>
                                                    </div>
                                                    {(members as TeamMember[]).map(member => {
                                                        const assignedMember = formData.team.find((t: any) => t.memberId === member.id);
                                                        const isSelected = !!assignedMember;
                                                        return (
                                                            <div key={member.id} className={`p-4 rounded-xl transition-all ${isSelected ? 'bg-blue-50 border-2 border-brand-accent' : 'bg-brand-bg border border-brand-border hover:border-brand-accent/30'}`}>
                                                                <div className="flex items-start gap-3">
                                                                    <label className="flex items-center gap-3 cursor-pointer flex-grow min-w-0">
                                                                        <input type="checkbox" checked={isSelected} onChange={() => onTeamChange(member)} className="h-5 w-5 text-brand-accent rounded-lg border-brand-border bg-brand-input focus:ring-brand-accent/40 flex-shrink-0" />
                                                                        <div className="min-w-0">
                                                                            <p className="font-semibold text-brand-text-light truncate">{member.name}</p>
                                                                            {isSelected && <p className="text-[10px] text-brand-text-secondary mt-0.5">Pembayaran Standar: {formatCurrency(member.standardFee)}</p>}
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-brand-border/40">
                                                                        <div className="sm:col-span-2 space-y-1.5">
                                                                            <label className="block text-[10px] uppercase font-bold text-brand-text-secondary">Biaya Tim / Vendor per Acara</label>
                                                                            <input
                                                                                type="number"
                                                                                value={assignedMember.fee}
                                                                                onChange={e => onTeamFeeChange(member.id, Number(e.target.value))}
                                                                                disabled={paidMemberIdsForThisProject.has(member.id)}
                                                                                className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all text-right font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                placeholder="0"
                                                                            />
                                                                        </div>
                                                                        <div className="sm:col-span-2 space-y-1.5">
                                                                            <label className="block text-[10px] uppercase font-bold text-brand-text-secondary">Keterangan Tugas Spesifik</label>
                                                                            <input
                                                                                type="text"
                                                                                value={assignedMember.subJob || ''}
                                                                                onChange={e => onTeamSubJobChange(member.id, e.target.value)}
                                                                                className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
                                                                                placeholder="Tugas spesifik (misal: Leader, Drone Operator, dll)"
                                                                            />
                                                                        </div>
                                                                        {onReplaceTeamMember && (
                                                                            <div className="sm:col-span-2 space-y-1.5">
                                                                                <label className="block text-[10px] uppercase font-bold text-brand-text-secondary">Ganti Personil / Freelance</label>
                                                                                <select
                                                                                    value=""
                                                                                    onChange={e => {
                                                                                        const newMember = (teamMembers || []).find(tm => tm.id === e.target.value);
                                                                                        if (newMember) {
                                                                                            onReplaceTeamMember(member.id, newMember);
                                                                                        }
                                                                                    }}
                                                                                    className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all cursor-pointer"
                                                                                >
                                                                                    <option value="">-- Tetap {member.name} (atau pilih personil pengganti) --</option>
                                                                                    {(teamMembers || [])
                                                                                        .filter(tm => tm.id !== member.id)
                                                                                        .map(tm => (
                                                                                            <option key={tm.id} value={tm.id}>
                                                                                                Ganti ke: {tm.name} ({tm.role || 'Tim'})
                                                                                            </option>
                                                                                        ))}
                                                                                </select>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <CollapsibleSection
                            title="Vendor (Allpackage)"
                            defaultExpanded={false}
                            status={(formData.printingDetails || []).length > 0 ? 'info' : undefined}
                            statusText={(formData.printingDetails || []).length > 0 ? `${(formData.printingDetails || []).length} item` : undefined}
                        >
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {(formData.printingDetails || []).length > 0 ? (formData.printingDetails || []).map((item: PrintingItem) => (
                                    <div key={item.id} className="p-3 rounded-lg bg-brand-bg flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-brand-text-light">{item.customName || item.type}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-center text-brand-text-secondary py-4">Tidak ada layanan/produk yang ditambahkan ke Package ini.</p>}
                            </div>
                        </CollapsibleSection>

                        {mode === 'add' && (
                            <section className="bg-brand-surface rounded-2xl p-4 border border-brand-border">
                                <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border pb-2 mb-4">Sub-Status untuk "{formData.status}"</h4>
                                <div className="p-4 bg-brand-bg rounded-xl">
                                    <label className="block text-xs font-semibold text-brand-text-secondary mb-2">Pilih sub-status aktif:</label>
                                    <p className="text-xs text-brand-text-secondary mb-3">Centang sub-status yang sedang aktif untuk Acara Pernikahan ini</p>
                                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                                        {(formData.customSubStatuses || []).map((sub: SubStatusConfig) => (
                                            <label key={sub.name} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${(formData.activeSubStatuses || []).includes(sub.name)
                                                ? 'bg-blue-50 border-2 border-brand-accent'
                                                : 'bg-brand-input border border-brand-border hover:border-brand-accent/30'
                                                }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.activeSubStatuses || []).includes(sub.name)}
                                                    onChange={e => onSubStatusChange(sub.name, e.target.checked)}
                                                    className="h-4 w-4 text-brand-accent rounded focus:ring-brand-accent/40 flex-shrink-0"
                                                />
                                                <span className="font-medium text-sm text-brand-text-primary">{sub.name}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <h5 className="text-sm font-semibold text-brand-text-secondary mt-6 pt-4 border-t border-brand-border">Edit Sub-Status (khusus Acara Pernikahan ini)</h5>
                                    <p className="text-xs text-brand-text-secondary mb-3">Kelola sub-status khusus untuk Acara Pernikahan ini</p>
                                    <div className="space-y-4 mt-3 max-h-60 overflow-y-auto pr-2">
                                        {(formData.customSubStatuses || []).map((sub: SubStatusConfig, index: number) => (
                                            <div key={index} className="p-4 bg-brand-surface rounded-xl border border-brand-border space-y-4">
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-semibold text-brand-text-secondary">Nama Sub-Status</label>
                                                    <input
                                                        type="text"
                                                        value={sub.name || ''}
                                                        onChange={e => onCustomSubStatusChange(index, 'name', e.target.value)}
                                                        placeholder="Masukkan nama sub-status"
                                                        className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
                                                    />
                                                    <p className="text-xs text-brand-text-secondary">Nama tahapan atau status (contoh: Persiapan Materi / Produksi)</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-semibold text-brand-text-secondary">Catatan (Opsional)</label>
                                                    <input
                                                        type="text"
                                                        value={sub.note || ''}
                                                        onChange={e => onCustomSubStatusChange(index, 'note', e.target.value)}
                                                        placeholder="Catatan tambahan"
                                                        className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
                                                    />
                                                    <p className="text-xs text-brand-text-secondary">Keterangan atau detail tambahan</p>
                                                </div>
                                                <div className="flex justify-end pt-2 border-t border-brand-border">
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemoveCustomSubStatus(index)}
                                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-brand-danger hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2Icon className="w-4 h-4 flex-shrink-0" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onAddCustomSubStatus}
                                        className="mt-3 px-4 py-2 text-sm font-semibold text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                                    >
                                        + Tambah Sub-Status Baru
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-6 border-t border-brand-border">
                    <button type="button" onClick={onClose} className="button-secondary w-full sm:w-auto order-2 sm:order-1">Batal</button>
                    <button type="submit" disabled={isSubmitting} className="button-primary w-full sm:w-auto order-1 sm:order-2 active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed">{isSubmitting ? 'Menyimpan...' : (mode === 'add' ? 'Simpan Acara Pernikahan' : 'Update Acara Pernikahan')}</button>
                </div>
            </form>
        </Modal>
    );
};

export default ProjectForm;
