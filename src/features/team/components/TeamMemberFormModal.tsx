import React from 'react';
import { Users as UsersIcon } from 'lucide-react';
import Modal from '../../../shared/ui/Modal';
import RupiahInput from '../../../shared/form/RupiahInput';
import { TeamMember } from '../../../types';

export interface TeamMemberFormData {
    name: string;
    role: string;
    email: string;
    phone: string;
    standardFee: number;
    noRek: string;
    bankName?: string;
    category?: 'Tim' | 'Vendor';
}

export interface TeamMemberFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    formMode: 'add' | 'edit';
    formData: Omit<TeamMember, 'id' | 'rating' | 'performanceNotes' | 'portalAccessId'>;
    setFormData: React.Dispatch<React.SetStateAction<Omit<TeamMember, 'id' | 'rating' | 'performanceNotes' | 'portalAccessId'>>>;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export const TeamMemberFormModal: React.FC<TeamMemberFormModalProps> = ({
    isOpen,
    onClose,
    formMode,
    formData,
    setFormData,
    onSubmit,
    isSubmitting
}) => {
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'standardFee' ? Number(value) : value
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formMode === 'add' ? 'Tambah Tim / Vendor' : 'Edit Tim / Vendor'}>
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="bg-blue-100 border border-blue-600/30 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <UsersIcon className="w-4 h-4" />
                        Informasi Tim / Vendor
                    </h4>
                    <p className="text-xs text-brand-text-secondary">
                        Tambahkan data lengkap Tim / Vendor yang akan bekerja sama dengan Anda. Data ini akan digunakan untuk manajemen Acara Pernikahan dan pembayaran.
                    </p>
                </div>

                <div>
                    <h5 className="text-sm font-semibold text-brand-text-light mb-3">Data Pribadi</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="input-group">
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} className="input-field" placeholder=" " required />
                            <label htmlFor="name" className="input-label">Nama Tim / Freelance</label>
                            <p className="text-xs text-brand-text-secondary mt-1">Nama Pengantin Tim / Vendor</p>
                        </div>
                        <div className="input-group">
                            <input type="text" id="role" name="role" value={formData.role} onChange={handleFormChange} className="input-field" placeholder=" " required />
                            <label htmlFor="role" className="input-label">Role/Posisi</label>
                            <p className="text-xs text-brand-text-secondary mt-1">Contoh: Make-Up Artist, Dekorator, Musisi</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h5 className="text-sm font-semibold text-brand-text-light mb-3">Kontak</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="input-group">
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} className="input-field" placeholder=" " required />
                            <label htmlFor="email" className="input-label">Email</label>
                            <p className="text-xs text-brand-text-secondary mt-1">Email untuk komunikasi dan akses portal</p>
                        </div>
                        <div className="input-group">
                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleFormChange} className="input-field" placeholder=" " required />
                            <label htmlFor="phone" className="input-label">Nomor Telepon</label>
                            <p className="text-xs text-brand-text-secondary mt-1">Nomor WhatsApp/telepon aktif</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h5 className="text-sm font-semibold text-brand-text-light mb-3">Informasi Pembayaran</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="input-group">
                            <RupiahInput id="standardFee" value={formData.standardFee.toString()} onChange={(raw) => setFormData(prev => ({ ...prev, standardFee: Number(raw) }))} className="input-field" placeholder=" " required />
                            <label htmlFor="standardFee" className="input-label">Fee Standar (IDR)</label>
                            <p className="text-xs text-brand-text-secondary mt-1">Fee default per Acara Pernikahan dalam Rupiah</p>
                        </div>
                        <div className="input-group">
                            <input type="text" id="noRek" name="noRek" value={formData.noRek} onChange={handleFormChange} className="input-field" placeholder=" " />
                            <label htmlFor="noRek" className="input-label">Nomor Rekening</label>
                            <p className="text-xs text-brand-text-secondary mt-1">Untuk transfer pembayaran (opsional)</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h5 className="text-sm font-semibold text-brand-text-light mb-3">Kategori</h5>
                    <div className="input-group">
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleFormChange}
                            className="input-field"
                        >
                            <option value="Tim">Tim Internal</option>
                            <option value="Vendor">Vendor Eksternal</option>
                        </select>
                        <label htmlFor="category" className="input-label">Pilih Kategori</label>
                        <p className="text-xs text-brand-text-secondary mt-1">Pilih "Tim" untuk tim internal Anda, atau "Vendor" untuk pihak ketiga.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-brand-border">
                    <button type="button" onClick={onClose} className="button-secondary w-full sm:w-auto">Batal</button>
                    <button type="submit" disabled={isSubmitting} className="button-primary w-full sm:w-auto">{isSubmitting ? 'Menyimpan...' : (formMode === 'add' ? 'Simpan' : 'Update')}</button>
                </div>
            </form>
        </Modal>
    );
};

export default TeamMemberFormModal;
