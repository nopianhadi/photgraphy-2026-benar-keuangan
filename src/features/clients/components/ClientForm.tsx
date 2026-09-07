import React, { useMemo, useState } from 'react';
import { Package, AddOn, Profile, Card, PromoCode, ClientType } from '../../../types';
import RupiahInput from '../../../shared/form/RupiahInput';
import { formatCurrency, initialFormState } from '../utils/clientHelpers';

interface ClientFormProps {
    formData: typeof initialFormState;
    setFormData: React.Dispatch<React.SetStateAction<typeof initialFormState>>;
    handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleFormSubmit: (e: React.FormEvent) => Promise<void> | void;
    handleCloseModal: () => void;
    packages: Package[];
    addOns: AddOn[];
    userProfile: Profile;
    modalMode: 'add' | 'edit';
    cards: Card[];
    promoCodes: PromoCode[];
}

const ClientForm: React.FC<ClientFormProps> = ({ formData, setFormData, handleFormChange, handleFormSubmit, handleCloseModal, packages, addOns, userProfile, modalMode, cards, promoCodes }) => {
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInternalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await handleFormSubmit(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get unique regions from packages
    const availableRegions = useMemo(() => {
        const regions = packages
            .map(p => p.region)
            .filter((r): r is string => !!r);
        return Array.from(new Set(regions));
    }, [packages]);

    // Filter packages by selected region
    const visiblePackages = useMemo(() => {
        if (!selectedRegion) return packages;
        return packages.filter(p => p.region === selectedRegion);
    }, [packages, selectedRegion]);

    // Filter add-ons by selected region
    const visibleAddOns = useMemo(() => {
        if (!selectedRegion) return addOns;
        return addOns.filter(a => !a.region || a.region === selectedRegion);
    }, [addOns, selectedRegion]);

    const priceCalculations = useMemo(() => {
        const selectedPackage = packages.find(p => p.id === formData.packageId);
        // Prefer explicit unitPrice stored in form (selected duration), fallback to package.price
        const packagePrice = (formData.unitPrice && Number(formData.unitPrice) > 0) ? Number(formData.unitPrice) : (selectedPackage?.price || 0);

        const addOnsPrice = addOns
            .filter(addon => formData.selectedAddOnIds.includes(addon.id))
            .reduce((sum, addon) => sum + addon.price, 0);

        let totalProjectBeforeDiscount = packagePrice + addOnsPrice;
        let discountAmount = 0;
        let discountApplied = 'N/A';
        const promoCode = promoCodes.find(p => p.id === formData.promoCodeId);

        if (promoCode) {
            if (promoCode.discountType === 'percentage') {
                discountAmount = (totalProjectBeforeDiscount * promoCode.discountValue) / 100;
                discountApplied = `${promoCode.discountValue}%`;
            } else { // fixed
                discountAmount = promoCode.discountValue;
                discountApplied = formatCurrency(promoCode.discountValue);
            }
        }

        const totalProject = totalProjectBeforeDiscount - discountAmount;
        const remainingPayment = totalProject - Number(formData.dp);

        return { packagePrice, addOnsPrice, totalProject, remainingPayment, discountAmount, discountApplied };
    }, [formData.packageId, formData.selectedAddOnIds, formData.dp, formData.promoCodeId, packages, addOns, promoCodes]);

    return (
        <form onSubmit={handleInternalSubmit} className="form-compact form-compact--ios-scale">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-2">
                {/* Left Column: Client & Project Info */}
                <div className="space-y-5">
                    <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border pb-2">Informasi Pengantin</h4>
                    <div className="space-y-2">
                        <label htmlFor="clientName" className="block text-xs text-brand-text-secondary">Nama Pengantin</label>
                        <input type="text" id="clientName" name="clientName" value={formData.clientName} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="Masukkan nama pengantin" required />
                        <p className="text-xs text-brand-text-secondary">Nama Pengantin pengantin atau pasangan</p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="clientType" className="block text-xs text-brand-text-secondary">Jenis Pengantin</label>
                        <select id="clientType" name="clientType" value={formData.clientType} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" required>
                            {Object.values(ClientType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                        </select>
                        <p className="text-xs text-brand-text-secondary">Kategori jenis pengantin (Direct/Vendor/Referral)</p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="phone" className="block text-xs text-brand-text-secondary">Nomor Telepon</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="08123456789" required />
                        <p className="text-xs text-brand-text-secondary">Nomor telepon utama yang bisa dihubungi</p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="whatsapp" className="block text-xs text-brand-text-secondary">No. WhatsApp (Opsional)</label>
                        <input type="tel" id="whatsapp" name="whatsapp" value={formData.whatsapp || ''} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="08123456789" />
                        <p className="text-xs text-brand-text-secondary">Nomor WhatsApp jika berbeda dengan nomor telepon</p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-xs text-brand-text-secondary">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="email@example.com" required />
                        <p className="text-xs text-brand-text-secondary">Alamat email untuk komunikasi dan invoice</p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="instagram" className="block text-xs text-brand-text-secondary">Instagram (Opsional)</label>
                        <input type="text" id="instagram" name="instagram" value={formData.instagram} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="@username" />
                        <p className="text-xs text-brand-text-secondary">Username Instagram pengantin (tanpa @)</p>
                    </div>

                    <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border pb-2 pt-4">Informasi Acara Pernikahan</h4>
                    <div className="space-y-2">
                        <label htmlFor="projectName" className="block text-xs text-brand-text-secondary">Nama Acara Pernikahan</label>
                        <input type="text" id="projectName" name="projectName" value={formData.projectName} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="Masukkan nama Acara Pernikahan" required />
                        <p className="text-xs text-brand-text-secondary">Nama Acara Pernikahan (contoh: Wedding John & Jane)</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="projectType" className="block text-xs text-brand-text-secondary">Jenis Acara Pernikahan</label>
                            <select id="projectType" name="projectType" value={formData.projectType} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" required>
                                <option value="" disabled>Pilih Jenis...</option>
                                {userProfile.projectTypes?.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                {formData.projectType && !userProfile.projectTypes?.includes(formData.projectType) && formData.projectType !== 'Other' && (
                                    <option value={formData.projectType}>{formData.projectType}</option>
                                )}
                                <option value="Other">+ Tambah Jenis Baru...</option>
                            </select>
                            {formData.projectType === 'Other' && (
                                <input
                                    type="text"
                                    placeholder="Masukkan jenis Acara Pernikahan..."
                                    className="input-field mt-2"
                                    onBlur={(e) => setFormData({ ...formData, projectType: e.target.value })}
                                />
                            )}
                            <p className="text-xs text-brand-text-secondary">Kategori jenis Acara Pernikahan</p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="date" className="block text-xs text-brand-text-secondary">Tanggal Acara Pernikahan</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" />
                            <p className="text-xs text-brand-text-secondary">Tanggal pelaksanaan Acara Pernikahan</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="location" className="block text-xs text-brand-text-secondary">Lokasi (Kota)</label>
                        <input type="text" id="location" name="location" value={formData.location} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="Kota Contoh: Jakarta" />
                        <p className="text-xs text-brand-text-secondary">Kota tempat Acara Pernikahan berlangsung</p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="address" className="block text-xs text-brand-text-secondary">Alamat Lengkap / Gedung</label>
                        <textarea id="address" name="address" value={formData.address} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="Contoh: Gedung Mulia, Jl. Gatot Subroto No. 1" rows={3}></textarea>
                        <p className="text-xs text-brand-text-secondary">Alamat spesifik venue Acara Pernikahan</p>
                    </div>
                </div>

                {/* Right Column: Financial & Other Info */}
                <div className="space-y-4">
                    <h4 className="text-base font-semibold text-gradient border-b border-brand-border pb-2">Detail Package & Pembayaran</h4>

                    {/* Region Selector */}
                    {availableRegions.length > 0 && (
                        <div className="input-group">
                            <select
                                id="regionSelector"
                                value={selectedRegion || ''}
                                onChange={(e) => {
                                    setSelectedRegion(e.target.value || null);
                                    // Reset package and addons when region changes
                                    setFormData({ ...formData, packageId: '', selectedAddOnIds: [] });
                                }}
                                className="input-field"
                            >
                                <option value="">Semua Daerah</option>
                                {availableRegions.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                            <label htmlFor="regionSelector" className="input-label">Pilih Daerah</label>
                            <p className="text-xs text-brand-text-secondary mt-1">Filter package dan add-on berdasarkan daerah</p>
                        </div>
                    )}

                    <div className="input-group">
                        <select id="packageId" name="packageId" value={formData.packageId} onChange={handleFormChange} className="input-field" required>
                            <option value="">Pilih Package...</option>
                            {visiblePackages.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name}{p.region ? ` (${p.region})` : ''}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="packageId" className="input-label">Package</label>
                        <p className="text-right text-xs text-brand-text-secondary mt-1">Harga Package: {formatCurrency(priceCalculations.packagePrice)}</p>
                    </div>
                    {/* Duration selector when package has durationOptions */}
                    {(() => {
                        const pkg = packages.find(p => p.id === formData.packageId);
                        if (pkg && Array.isArray(pkg.durationOptions) && pkg.durationOptions.length > 0) {
                            return (
                                <div className="input-group">
                                    <select id="durationSelection" name="durationSelection" value={formData.durationSelection || ''} onChange={handleFormChange} className="input-field">
                                        <option value="">Pilih Durasi...</option>
                                        {pkg.durationOptions.map((opt, idx) => <option key={idx} value={opt.label}>{opt.label} — {formatCurrency(opt.price)}</option>)}
                                    </select>
                                    <label htmlFor="durationSelection" className="input-label">Durasi</label>
                                    {formData.unitPrice && <p className="text-right text-xs text-brand-text-secondary mt-1">Harga Terpilih: {formatCurrency(Number(formData.unitPrice))}</p>}
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <div className="input-group">
                        <label className="input-label !static !-top-4 !text-brand-accent">Add-On</label>
                        <div className="p-3 border border-brand-border bg-brand-bg rounded-lg max-h-32 overflow-y-auto space-y-2 mt-2">
                            {visibleAddOns.length > 0 ? (
                                visibleAddOns.map(addon => (
                                    <label key={addon.id} className="flex items-center justify-between p-2 rounded-md hover:bg-brand-input cursor-pointer">
                                        <span className="text-sm text-brand-text-primary">
                                            {addon.name}{addon.region ? ` (${addon.region})` : ''}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-brand-text-secondary">{formatCurrency(addon.price)}</span>
                                            <input type="checkbox" id={addon.id} name="addOns" checked={formData.selectedAddOnIds.includes(addon.id)} onChange={handleFormChange} className="h-4 w-4 rounded flex-shrink-0 text-blue-600 focus:ring-blue-600 transition-colors" />
                                        </div>
                                    </label>
                                ))
                            ) : (
                                <p className="text-sm text-brand-text-secondary text-center py-2">
                                    {selectedRegion ? 'Tidak ada add-on untuk daerah ini' : 'Tidak ada add-on tersedia'}
                                </p>
                            )}
                        </div>
                        <p className="text-right text-xs text-brand-text-secondary mt-1">Total Harga Add-On: {formatCurrency(priceCalculations.addOnsPrice)}</p>
                    </div>

                    <div className="input-group">
                        <select id="promoCodeId" name="promoCodeId" value={formData.promoCodeId} onChange={handleFormChange} className="input-field">
                            <option value="">Tanpa Kode Promo</option>
                            {promoCodes.filter(p => p.isActive).map(p => (
                                <option key={p.id} value={p.id}>{p.code} - ({p.discountType === 'percentage' ? `${p.discountValue}%` : formatCurrency(p.discountValue)})</option>
                            ))}
                        </select>
                        <label htmlFor="promoCodeId" className="input-label">Kode Promo</label>
                        {formData.promoCodeId && <p className="text-right text-xs text-brand-success mt-1">Diskon Diterapkan: {priceCalculations.discountApplied}</p>}
                    </div>

                    <div className="p-4 bg-brand-bg rounded-lg space-y-3">
                        <div className="flex justify-between items-center font-bold text-lg"><span className="text-brand-text-secondary">Total Acara Pernikahan</span><span className="text-brand-text-light">{formatCurrency(priceCalculations.totalProject)}</span></div>
                        <div className="input-group !mt-2">
                            <RupiahInput
                                id="dp"
                                name="dp"
                                value={String(formData.dp ?? '')}
                                onChange={(raw) => setFormData((prev: any) => ({ ...prev, dp: raw }))}
                                className="input-field text-right"
                                placeholder=" "
                            />
                            <label htmlFor="dp" className="input-label">Uang DP</label>
                        </div>
                        {Number(formData.dp) > 0 && (
                            <div className="input-group !mt-2">
                                <select name="dpDestinationCardId" value={formData.dpDestinationCardId} onChange={handleFormChange} className="input-field" required>
                                    <option value="">Setor DP ke...</option>
                                    {cards.map(c => <option key={c.id} value={c.id}>{c.bankName} {c.lastFourDigits !== 'CASH' ? `**** ${c.lastFourDigits}` : '(Tunai)'}</option>)}
                                </select>
                                <label htmlFor="dpDestinationCardId" className="input-label">Kartu Tujuan</label>
                            </div>
                        )}
                        <hr className="border-brand-border" />
                        <div className="flex justify-between items-center font-bold text-lg"><span className="text-brand-text-secondary">Sisa Pembayaran</span><span className="text-blue-800">{formatCurrency(priceCalculations.remainingPayment)}</span></div>
                    </div>

                    <h4 className="text-base font-semibold text-gradient border-b border-brand-border pb-2 pt-4">Lainnya (Opsional)</h4>
                    <div className="input-group"><textarea id="notes" name="notes" value={formData.notes} onChange={handleFormChange} className="input-field" placeholder=" "></textarea><label htmlFor="notes" className="input-label">Catatan Tambahan</label></div>
                </div>
            </div>

            <div className="flex justify-end items-center gap-3 pt-8 mt-8 border-t border-brand-border">
                <button type="button" onClick={handleCloseModal} className="button-secondary">Batal</button>
                <button type="submit" disabled={isSubmitting} className="button-primary">{isSubmitting ? 'Menyimpan...' : (modalMode === 'add' ? 'Simpan Pengantin & Acara Pernikahan' : 'Update Pengantin & Acara Pernikahan')}</button>
            </div>
        </form>
    );
};


export default ClientForm;
