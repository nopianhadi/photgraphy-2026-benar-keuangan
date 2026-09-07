import React, { useState, useMemo } from 'react';
import { Package, AddOn, Project, PhysicalItem, Profile, REGIONS, Region, DurationOption } from '../../types';
import Modal from '../../shared/ui/Modal';
import { PencilIcon, Trash2Icon, PlusIcon, Share2Icon, FileTextIcon, CameraIcon, ChevronDownIcon, PackageIcon } from '../../constants';
import RupiahInput from '../../shared/form/RupiahInput';
import { createPackage as createPackageRow, updatePackage as updatePackageRow, deletePackage as deletePackageRow } from '../../services/packages';
import { createAddOn as createAddOnRow, updateAddOn as updateAddOnRow, deleteAddOn as deleteAddOnRow } from '../../services/addOns';

// Inline Copy/Duplicate icon
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

const emptyPackageForm = {
    name: '',
    price: '',
    category: '',
    region: '' as '' | Region,
    processingTime: '',
    photographers: '',
    videographers: '',
    physicalItems: [{ name: '', price: '' as string | number }],
    digitalItems: [''],
    coverImage: '',
    durationOptions: [{ label: '', price: '' as string | number, default: true }],
};
const emptyAddOnForm = { name: '', price: '', region: '' };

interface PackagesProps {
    packages: Package[];
    setPackages: React.Dispatch<React.SetStateAction<Package[]>>;
    addOns: AddOn[];
    setAddOns: React.Dispatch<React.SetStateAction<AddOn[]>>;
    projects: Project[];
    profile: Profile;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


const Packages: React.FC<PackagesProps> = ({ packages, setPackages, addOns, setAddOns, projects, profile }) => {
    const [packageFormData, setPackageFormData] = useState<any>(emptyPackageForm);
    const [packageEditMode, setPackageEditMode] = useState<string | null>(null);
    const [regionFilter, setRegionFilter] = useState<'' | Region>('');

    const [addOnFormData, setAddOnFormData] = useState(emptyAddOnForm);
    const [addOnEditMode, setAddOnEditMode] = useState<string | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [expandedDurationIndex, setExpandedDurationIndex] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    // --- Copy/Duplicate Package state ---
    const [copySourcePkg, setCopySourcePkg] = useState<Package | null>(null);
    const [copyTargetRegion, setCopyTargetRegion] = useState<string>('');
    const [copyCustomRegion, setCopyCustomRegion] = useState<string>('');
    const [isCopying, setIsCopying] = useState(false);

    const publicPackagesUrl = useMemo(() => {
        // A more robust solution would involve getting the vendor's unique ID
        const vendorId = 'VEN001'; // Placeholder for the default vendor
        return `${window.location.origin}${window.location.pathname}#/public-packages/${vendorId}`;
    }, []);

    const copyPackagesLinkToClipboard = () => {
        navigator.clipboard.writeText(publicPackagesUrl).then(() => {
            alert('Tautan halaman Package berhasil disalin!');
        });
    };

    // Duration Options Handlers
    const handleDurationOptionChange = (index: number, field: string, value: string | number | boolean | string[] | { name: string; price: number }[]) => {
        const list = [...packageFormData.durationOptions];
        if (field === 'default') {
            list.forEach((opt: any, i: number) => { opt.default = i === index ? Boolean(value) : false; });
        } else {
            (list[index] as any)[field] = value;
        }
        setPackageFormData((prev: any) => ({ ...prev, durationOptions: list }));
    };
    const addDurationOption = () => {
        setPackageFormData((prev: any) => ({ ...prev, durationOptions: [...(prev.durationOptions || []), { label: '', price: '' }] }));
    };
    const removeDurationOption = (index: number) => {
        const list = [...packageFormData.durationOptions];
        list.splice(index, 1);
        const final = list.length > 0 ? list : [{ label: '', price: '' }];
        if (!final.some((o: any) => o.default)) final[0].default = true;
        setPackageFormData((prev: any) => ({ ...prev, durationOptions: final }));
        if (expandedDurationIndex === index) setExpandedDurationIndex(null);
        else if (expandedDurationIndex !== null && expandedDurationIndex > index) setExpandedDurationIndex(expandedDurationIndex - 1);
    };
    const handleDurationDigitalItemChange = (optIndex: number, itemIndex: number, value: string) => {
        const list = [...packageFormData.durationOptions];
        const opt = list[optIndex] as any;
        if (!opt.digitalItems) opt.digitalItems = [''];
        opt.digitalItems = [...opt.digitalItems];
        opt.digitalItems[itemIndex] = value;
        setPackageFormData((prev: any) => ({ ...prev, durationOptions: list }));
    };
    const addDurationDigitalItem = (optIndex: number) => {
        const list = [...packageFormData.durationOptions];
        const opt = list[optIndex] as any;
        if (!opt.digitalItems) opt.digitalItems = [''];
        opt.digitalItems = [...opt.digitalItems, ''];
        setPackageFormData((prev: any) => ({ ...prev, durationOptions: list }));
    };
    const removeDurationDigitalItem = (optIndex: number, itemIndex: number) => {
        const list = [...packageFormData.durationOptions];
        const opt = list[optIndex] as any;
        if (opt.digitalItems && opt.digitalItems.length > 1) {
            opt.digitalItems = opt.digitalItems.filter((_: any, i: number) => i !== itemIndex);
            setPackageFormData((prev: any) => ({ ...prev, durationOptions: list }));
        }
    };
    const handleDurationPhysicalItemChange = (optIndex: number, itemIndex: number, field: 'name' | 'price', value: string | number) => {
        const list = [...packageFormData.durationOptions];
        const opt = list[optIndex] as any;
        if (!opt.physicalItems) opt.physicalItems = [{ name: '', price: 0 }];
        opt.physicalItems = [...opt.physicalItems];
        (opt.physicalItems[itemIndex] as any)[field] = field === 'price' ? Number(value) : value;
        setPackageFormData((prev: any) => ({ ...prev, durationOptions: list }));
    };
    const addDurationPhysicalItem = (optIndex: number) => {
        const list = [...packageFormData.durationOptions];
        const opt = list[optIndex] as any;
        if (!opt.physicalItems) opt.physicalItems = [];
        opt.physicalItems = [...opt.physicalItems, { name: '', price: 0 }];
        setPackageFormData((prev: any) => ({ ...prev, durationOptions: list }));
    };
    const removeDurationPhysicalItem = (optIndex: number, itemIndex: number) => {
        const list = [...packageFormData.durationOptions];
        const opt = list[optIndex] as any;
        if (opt.physicalItems && opt.physicalItems.length > 1) {
            opt.physicalItems = opt.physicalItems.filter((_: any, i: number) => i !== itemIndex);
            setPackageFormData((prev: any) => ({ ...prev, durationOptions: list }));
        }
    };

    const packagesByCategory = useMemo(() => {
        const grouped: Record<string, Package[]> = {};
        const filtered = regionFilter ? packages.filter(p => (p.region ? p.region.toLowerCase() === regionFilter.toLowerCase() : false)) : packages;
        for (const pkg of filtered) {
            const category = pkg.category || 'Tanpa Kategori';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(pkg);
        }
        return grouped;
    }, [packages, regionFilter]);

    const packagesByRegionCategory = useMemo(() => {
        // Only used when no regionFilter applied: show separate boxes per region
        const byRegion: Record<string, Record<string, Package[]>> = {};
        const label = (r?: string | null) => r === 'vendor' ? 'Vendor' : r === 'jabodetabek' ? 'Jabodetabek' : r === 'banten' ? 'Banten' : 'Tanpa Wilayah';
        for (const pkg of packages) {
            const rl = label(pkg.region as any);
            if (!byRegion[rl]) byRegion[rl] = {};
            const cat = pkg.category || 'Tanpa Kategori';
            if (!byRegion[rl][cat]) byRegion[rl][cat] = [];
            byRegion[rl][cat].push(pkg);
        }
        return byRegion;
    }, [packages]);
    // removed combined region view

    const existingRegions = useMemo(() => {
        const set = new Set<string>();
        for (const p of packages) {
            if (p.region && String(p.region).trim() !== '') set.add(String(p.region));
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [packages]);
    const unionRegions = useMemo(() => {
        const baseValues = REGIONS.map(r => r.value.toLowerCase());
        const extra = existingRegions.filter(er => !baseValues.includes(er.toLowerCase()));
        return [
            ...REGIONS.map(r => ({ value: r.value, label: r.label })),
            ...extra.map(er => ({ value: er, label: titleCase(er) })),
        ];
    }, [existingRegions]);


    // --- Package Handlers ---
    const handlePackageInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPackageFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const file = e.target.files[0];
                // Check file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    alert('Ukuran file tidak boleh melebihi 2MB');
                    e.target.value = ''; // Reset the input
                    return;
                }
                // Check file type
                if (!file.type.match('image.*')) {
                    alert('Hanya file gambar yang diperbolehkan');
                    e.target.value = ''; // Reset the input
                    return;
                }
                const base64 = await toBase64(file);
                setPackageFormData((prev: any) => ({ ...prev, coverImage: base64 }));
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Terjadi kesalahan saat mengunggah gambar. Silakan coba lagi.');
                e.target.value = ''; // Reset the input
            }
        }
    };

    const handlePhysicalItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const list = [...packageFormData.physicalItems];
        list[index] = { ...list[index], [name]: value };
        setPackageFormData((prev: any) => ({ ...prev, physicalItems: list }));
    };

    const addPhysicalItem = () => {
        setPackageFormData((prev: any) => ({ ...prev, physicalItems: [...prev.physicalItems, { name: '', price: '' }] }));
    };

    const removePhysicalItem = (index: number) => {
        const list = [...packageFormData.physicalItems];
        list.splice(index, 1);
        setPackageFormData((prev: any) => ({ ...prev, physicalItems: list }));
    };

    const handleDigitalItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const list = [...packageFormData.digitalItems];
        list[index] = value;
        setPackageFormData((prev: any) => ({ ...prev, digitalItems: list }));
    };

    const addDigitalItem = () => {
        setPackageFormData((prev: any) => ({ ...prev, digitalItems: [...prev.digitalItems, ''] }));
    };

    const removeDigitalItem = (index: number) => {
        const list = [...packageFormData.digitalItems];
        list.splice(index, 1);
        setPackageFormData((prev: any) => ({ ...prev, digitalItems: list }));
    };


    const handlePackageCancelEdit = () => {
        setPackageEditMode(null);
        setPackageFormData(emptyPackageForm);
    }

    const handlePackageEdit = (pkg: Package) => {
        setPackageEditMode(pkg.id);
        setPackageFormData({
            name: pkg.name,
            price: pkg.price.toString(),
            category: pkg.category,
            region: (pkg.region || '') as any,
            processingTime: '',
            photographers: pkg.photographers && pkg.videographers
                ? `${pkg.photographers} & ${pkg.videographers}`
                : (pkg.photographers || pkg.videographers || ''),
            videographers: '',
            physicalItems: pkg.physicalItems.length > 0 ? pkg.physicalItems.map(item => ({ ...item, price: item.price.toString() })) : [{ name: '', price: '' }],
            digitalItems: pkg.digitalItems.length > 0 ? pkg.digitalItems : [''],
            coverImage: pkg.coverImage || '',
            durationOptions: (pkg.durationOptions && pkg.durationOptions.length > 0)
                ? pkg.durationOptions.map(o => ({
                    label: o.label,
                    price: o.price.toString(),
                    default: o.default,
                    photographers: o.photographers && o.videographers
                        ? `${o.photographers} & ${o.videographers}`
                        : (o.photographers || o.videographers || ''),
                    videographers: '',
                    processingTime: '',
                    digitalItems: o.digitalItems && o.digitalItems.length > 0 ? o.digitalItems : [''],
                    physicalItems: o.physicalItems && o.physicalItems.length > 0 ? o.physicalItems.map((p: PhysicalItem) => ({ ...p, price: p.price })) : [{ name: '', price: 0 }],
                }))
                : [{ label: '', price: '' as string | number, default: true }],
        });
    }

    // --- Copy/Duplicate Package Handler ---
    const handleOpenCopyModal = (pkg: Package) => {
        setCopySourcePkg(pkg);
        setCopyTargetRegion('');
        setCopyCustomRegion('');
    };

    const handleCloseCopyModal = () => {
        setCopySourcePkg(null);
        setCopyTargetRegion('');
        setCopyCustomRegion('');
        setIsCopying(false);
    };

    const handleDuplicatePackage = async () => {
        if (!copySourcePkg) return;
        const finalRegion = (copyTargetRegion === '__custom__' ? copyCustomRegion : copyTargetRegion).trim().toLowerCase();
        if (!finalRegion) {
            alert('Pilih atau masukkan wilayah tujuan untuk duplikasi package.');
            return;
        }
        setIsCopying(true);
        try {
            const { id, ...rest } = copySourcePkg;
            const newPkg: Omit<Package, 'id'> = {
                ...rest,
                name: `${copySourcePkg.name} (${finalRegion.charAt(0).toUpperCase() + finalRegion.slice(1)})`,
                region: finalRegion as any,
            };
            const created = await createPackageRow(newPkg as any);
            setPackages(prev => [...prev, created]);
            alert(`Package berhasil diduplikasi ke wilayah "${finalRegion}"!`);
            handleCloseCopyModal();
        } catch (err: any) {
            console.error('[Supabase][packages.duplicate] error:', err);
            alert(`Gagal menduplikasi Package. ${err?.message || 'Coba lagi.'}`);
        } finally {
            setIsCopying(false);
        }
    };

    const handlePackageDelete = async (pkgId: string) => {
        const isPackageInUse = projects.some(p => p.packageId === pkgId);
        if (isPackageInUse) {
            alert("Package ini tidak dapat dihapus karena sedang digunakan oleh satu atau lebih Acara Pernikahan. Hapus atau ubah Acara Pernikahan tersebut terlebih dahulu.");
            return;
        }

        if (!window.confirm("Apakah Anda yakin ingin menghapus Package ini?")) return;
        try {
            await deletePackageRow(pkgId);
            setPackages(prev => prev.filter(p => p.id !== pkgId));
        } catch (e) {
            alert('Gagal menghapus Package di database. Coba lagi.');
        }
    }

    const handlePackageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const hasValidOptionsPre = Array.isArray(packageFormData.durationOptions) && packageFormData.durationOptions.some((o: any) => String(o.label || '').trim() !== '' && String(o.price || '') !== '');
        if (!packageFormData.name || (!hasValidOptionsPre && !packageFormData.price)) {
            alert('Nama Package wajib diisi. Jika tidak mengisi Opsi Durasi, maka Harga (IDR) wajib diisi.');
            return;
        }

        // Determine final base price: if duration options exist, base price mirrors the default option
        const hasValidOptions = Array.isArray(packageFormData.durationOptions) && packageFormData.durationOptions.some((o: any) => String(o.label || '').trim() !== '' && String(o.price || '') !== '');
        const defaultOption = hasValidOptions ? (packageFormData.durationOptions.find((o: any) => o.default) || packageFormData.durationOptions.find((o: any) => String(o.label || '').trim() !== '' && String(o.price || '') !== '')) : null;
        const computedBasePrice = defaultOption ? Number(defaultOption.price || 0) : Number(packageFormData.price || 0);

        const packageData: Omit<Package, 'id'> = {
            name: packageFormData.name,
            price: computedBasePrice,
            category: packageFormData.category,
            region: packageFormData.region ? String(packageFormData.region).trim().toLowerCase() : undefined,
            processingTime: '',
            photographers: packageFormData.photographers,
            videographers: '',
            physicalItems: packageFormData.physicalItems
                .filter((item: PhysicalItem) => typeof item.name === 'string' && item.name.trim() !== '')
                .map((item: { name: string, price: string | number }) => ({ ...item, name: item.name, price: Number(item.price || 0) })),
            digitalItems: packageFormData.digitalItems.filter((item: string) => item.trim() !== ''),
            coverImage: packageFormData.coverImage,
            durationOptions: Array.isArray(packageFormData.durationOptions)
                ? packageFormData.durationOptions
                    .filter((opt: any) => String(opt.label || '').trim() !== '' && Number(opt.price) >= 0)
                    .map((opt: any): DurationOption => {
                        const base = { label: String(opt.label).trim(), price: Number(opt.price), default: !!opt.default };
                        const filteredDigital = opt.digitalItems?.filter((d: string) => d?.trim?.()) || [];
                        const filteredPhysical = opt.physicalItems?.filter((p: any) => p?.name?.trim?.()).map((p: any) => ({ name: p.name, price: Number(p.price || 0) })) || [];
                        const hasDetails = opt.photographers?.trim() || filteredDigital.length > 0 || filteredPhysical.length > 0;
                        if (hasDetails) {
                            return {
                                ...base,
                                photographers: opt.photographers?.trim() || undefined,
                                videographers: undefined,
                                processingTime: undefined,
                                digitalItems: filteredDigital.length > 0 ? filteredDigital : undefined,
                                physicalItems: filteredPhysical.length > 0 ? filteredPhysical : undefined,
                            } as DurationOption;
                        }
                        return base as DurationOption;
                    })
                : undefined,
        };

        try {
            if (packageEditMode !== 'new' && packageEditMode) {
                const updated = await updatePackageRow(packageEditMode, packageData);
                setPackages(prev => prev.map(p => p.id === packageEditMode ? updated : p));
            } else {
                const created = await createPackageRow(packageData as any);
                setPackages(prev => [...prev, created]);
            }
        } catch (err: any) {
            console.error('[Supabase][packages.save] error:', err);
            alert(`Gagal menyimpan Package ke database. ${err?.message || 'Coba lagi.'}`);
            return;
        }

        handlePackageCancelEdit();
    };

    // --- AddOn Handlers ---
    const handleAddOnInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddOnFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddOnSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addOnFormData.name || !addOnFormData.price) {
            alert('Nama Add-On dan Harga tidak boleh kosong.');
            return;
        }

        const addOnData: Omit<AddOn, 'id'> = {
            name: addOnFormData.name,
            price: Number(addOnFormData.price),
            region: addOnFormData.region ? String(addOnFormData.region).trim().toLowerCase() : undefined,
        };

        try {
            if (addOnEditMode) {
                const updated = await updateAddOnRow(addOnEditMode, addOnData);
                setAddOns(prev => prev.map(a => a.id === addOnEditMode ? updated : a));
            } else {
                const created = await createAddOnRow(addOnData as any);
                setAddOns(prev => [...prev, created]);
            }
        } catch (err: any) {
            console.error('[Supabase][addOns.save] error:', err);
            alert(`Gagal menyimpan add-on ke database. ${err?.message || 'Coba lagi.'}`);
            return;
        }

        handleAddOnCancelEdit();
    };

    const handleAddOnCancelEdit = () => {
        setAddOnEditMode(null);
        setAddOnFormData(emptyAddOnForm);
    }

    const handleAddOnEdit = (addOn: AddOn) => {
        setAddOnEditMode(addOn.id);
        setAddOnFormData({
            name: addOn.name,
            price: addOn.price.toString(),
            region: (addOn.region || '') as any,
        });
    }

    const handleAddOnDelete = async (addOnId: string) => {
        const isAddOnInUse = projects.some(p => p.addOns.some(a => a.id === addOnId));
        if (isAddOnInUse) {
            alert("Add-on ini tidak dapat dihapus karena sedang digunakan oleh satu atau lebih Acara Pernikahan. Hapus atau ubah Acara Pernikahan tersebut terlebih dahulu.");
            return;
        }

        if (!window.confirm("Apakah Anda yakin ingin menghapus add-on ini?")) return;
        try {
            await deleteAddOnRow(addOnId);
            setAddOns(prev => prev.filter(p => p.id !== addOnId));
        } catch (e) {
            alert('Gagal menghapus add-on di database. Coba lagi.');
        }
    };

    return (
        <div className="space-y-5 animate-fade-in pb-8">
            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center flex-shrink-0">
                        <PackageIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-brand-text-light leading-tight">Package Vendor</h1>
                        <p className="text-xs text-brand-text-secondary hidden sm:block">Kelola portofolio Package, opsi durasi, dan item tambahan.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setIsInfoModalOpen(true)} className="button-secondary !py-2 !px-3 text-xs">Panduan</button>
                    <button onClick={() => setIsShareModalOpen(true)} className="button-secondary !py-2 !px-3 text-xs inline-flex items-center gap-1.5">
                        <Share2Icon className="w-3.5 h-3.5" /> Bagikan
                    </button>
                    <button onClick={() => setPackageEditMode('new')} className="button-primary !py-2 !px-4 text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
                        <PlusIcon className="w-4 h-4" /> Tambah Package
                    </button>
                </div>
            </div>

            {/* ── Stat cards ───────────────────────────────────────────────── */}
            {(() => {
                const filteredPkgs = regionFilter ? packages.filter(p => (p.region ? p.region.toLowerCase() === regionFilter.toLowerCase() : false)) : packages;
                const filteredAddons = regionFilter ? addOns.filter(a => a.region === regionFilter) : addOns;
                const cats = new Set(filteredPkgs.map(p => p.category || 'Tanpa Kategori'));
                const allPrices = filteredPkgs.flatMap(p => p.durationOptions && p.durationOptions.length > 0 ? p.durationOptions.map(o => o.price) : [p.price]);
                const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
                const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gradient-to-br from-purple-500/15 via-violet-500/10 to-fuchsia-400/8 border border-purple-400/40 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/25 flex items-center justify-center flex-shrink-0">
                                <PackageIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-brand-text-secondary">Total Package</p>
                                <p className="text-2xl font-bold text-brand-text-light">{filteredPkgs.length}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-cyan-400/8 border border-blue-400/40 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/25 flex items-center justify-center flex-shrink-0">
                                <PlusIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-brand-text-secondary">Total Add-On</p>
                                <p className="text-2xl font-bold text-brand-text-light">{filteredAddons.length}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/15 via-green-500/10 to-teal-400/8 border border-emerald-400/40 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/25 flex items-center justify-center flex-shrink-0">
                                <FileTextIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-brand-text-secondary">Kategori</p>
                                <p className="text-2xl font-bold text-brand-text-light">{cats.size}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-yellow-400/8 border border-orange-400/40 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/25 flex items-center justify-center flex-shrink-0">
                                <FileTextIcon className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-brand-text-secondary">Harga</p>
                                <p className="text-sm font-bold text-brand-text-light leading-tight">
                                    {allPrices.length > 0
                                        ? `${new Intl.NumberFormat('id-ID', { notation: 'compact', style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(minPrice)}
                                        – ${new Intl.NumberFormat('id-ID', { notation: 'compact', style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(maxPrice)}`
                                        : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Region filter pills + view toggle ────────────────────────── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setRegionFilter('')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${regionFilter === '' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-brand-surface text-brand-text-secondary hover:text-brand-text-light border-brand-border'}`}
                    >Semua</button>
                    {unionRegions.map(r => (
                        <button key={r.value} onClick={() => setRegionFilter(r.value as any)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${regionFilter === (r.value as any) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-brand-surface text-brand-text-secondary hover:text-brand-text-light border-brand-border'}`}
                        >{r.label}</button>
                    ))}
                </div>
                {/* View toggle */}
                <div className="flex rounded-lg border border-brand-border overflow-hidden flex-shrink-0">
                    <button onClick={() => setViewMode('cards')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 ${viewMode === 'cards' ? 'bg-brand-accent text-white' : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-bg'}`}
                        title="Tampilan Kartu">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                        <span className="hidden sm:inline">Kartu</span>
                    </button>
                    <button onClick={() => setViewMode('table')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 ${viewMode === 'table' ? 'bg-brand-accent text-white' : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-bg'}`}
                        title="Tampilan Tabel">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" rx="1"/><line x1="1" y1="5" x2="15" y2="5"/><line x1="1" y1="9" x2="15" y2="9"/><line x1="1" y1="13" x2="15" y2="13"/><line x1="5" y1="1" x2="5" y2="15"/></svg>
                        <span className="hidden sm:inline">Tabel</span>
                    </button>
                </div>
            </div>

            {/* ── Main content ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* ── Left: packages (cards OR table) ── */}
                <div className="lg:col-span-2 space-y-6">

                    {viewMode === 'cards' && (
                        <>
                            {(Object.entries(packagesByCategory) as [string, Package[]][]).length === 0 && (
                                <div className="text-center py-20 bg-brand-surface rounded-2xl border border-brand-border">
                                    <PackageIcon className="mx-auto w-12 h-12 text-brand-text-secondary opacity-30 mb-3" />
                                    <p className="text-brand-text-secondary text-sm">Belum ada package untuk wilayah ini.</p>
                                    <button onClick={() => setPackageEditMode('new')} className="mt-4 button-primary text-sm inline-flex items-center gap-2">
                                        <PlusIcon className="w-4 h-4" /> Tambah Package Pertama
                                    </button>
                                </div>
                            )}
                            {(Object.entries(packagesByCategory) as [string, Package[]][]).map(([category, pkgs]) => (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="text-base font-bold text-brand-text-light">{category}</h3>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">{pkgs.length}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {pkgs.map(pkg => (
                                            <div key={pkg.id} className="bg-brand-surface rounded-2xl flex flex-col overflow-hidden border border-brand-border shadow-sm hover:shadow-md hover:border-brand-accent/30 transition-all group">
                                                {pkg.coverImage ? (
                                                    <div className="h-36 overflow-hidden relative">
                                                        <img src={pkg.coverImage} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
                                                        {pkg.region && (
                                                            <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                                                                {pkg.region}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="h-28 bg-brand-bg flex items-center justify-center relative">
                                                        <CameraIcon className="w-8 h-8 text-brand-text-secondary opacity-30" />
                                                        {pkg.region && (
                                                            <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                                                                {pkg.region}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="p-4 flex-grow flex flex-col gap-3">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-brand-text-light leading-tight">{pkg.name}</h4>
                                                        {pkg.photographers && <p className="text-xs text-brand-text-secondary mt-0.5">Tim: {pkg.photographers}</p>}
                                                    </div>
                                                    {/* Price block */}
                                                    <div className="bg-brand-bg rounded-xl p-3 border border-brand-border/50">
                                                        {pkg.durationOptions && pkg.durationOptions.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {pkg.durationOptions.map((o, i) => (
                                                                    <div key={i} className="flex justify-between items-center text-xs">
                                                                        <span className="text-brand-text-secondary truncate pr-2">{o.label}</span>
                                                                        <span className="font-bold text-brand-accent flex-shrink-0">{formatCurrency(o.price)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-lg font-bold text-brand-accent">{formatCurrency(pkg.price)}</p>
                                                        )}
                                                    </div>
                                                    {/* Digital items / description */}
                                                    {pkg.digitalItems.length > 0 && (
                                                        <ul className="space-y-0.5">
                                                            {pkg.digitalItems.slice(0, 4).map((item, i) => (
                                                                <li key={i} className="text-xs text-brand-text-primary flex items-start gap-1.5">
                                                                    <span className="w-1 h-1 rounded-full bg-brand-accent/50 mt-1.5 flex-shrink-0" />
                                                                    <span className="line-clamp-1">{item}</span>
                                                                </li>
                                                            ))}
                                                            {pkg.digitalItems.length > 4 && (
                                                                <li className="text-xs text-brand-text-secondary pl-2.5">+{pkg.digitalItems.length - 4} lainnya</li>
                                                            )}
                                                        </ul>
                                                    )}
                                                    {/* Physical items */}
                                                    {pkg.physicalItems.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {pkg.physicalItems.map((item, i) => (
                                                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-bg border border-brand-border text-brand-text-secondary">{item.name}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/* Actions */}
                                                    <div className="flex gap-2 pt-2 border-t border-brand-border/50 mt-auto">
                                                        <button onClick={() => handlePackageEdit(pkg)} className="button-secondary flex-1 text-xs py-1.5 gap-1">
                                                            <PencilIcon className="w-3.5 h-3.5" /> Edit
                                                        </button>
                                                        <button onClick={() => handleOpenCopyModal(pkg)} className="button-secondary !p-2 text-brand-text-secondary hover:text-brand-accent" title="Duplikasi">
                                                            <CopyIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handlePackageDelete(pkg.id)} className="button-secondary !p-2 text-brand-text-secondary hover:text-red-600" title="Hapus">
                                                            <Trash2Icon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {viewMode === 'table' && (
                        <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-hidden">
                            {/* Table header bar */}
                            <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-brand-text-light">
                                    {(regionFilter ? packages.filter(p => (p.region ? p.region.toLowerCase() === regionFilter.toLowerCase() : false)) : packages).length} Package
                                </p>
                                <button onClick={() => setPackageEditMode('new')} className="btn-box-add text-xs px-3 py-1.5 inline-flex items-center gap-1">
                                    <PlusIcon className="w-3.5 h-3.5" /> Tambah
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm !border-0">
                                    <thead>
                                        <tr className="bg-brand-bg text-left">
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border w-8">#</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border">Nama Package</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border hidden sm:table-cell">Kategori</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border hidden md:table-cell">Wilayah</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border">Harga</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border hidden lg:table-cell">Tim</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border hidden xl:table-cell">Deskripsi</th>
                                            <th className="px-4 py-3 text-xs font-bold text-brand-text-secondary uppercase tracking-wider !border-0 border-b border-brand-border text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Object.entries(packagesByCategory) as [string, Package[]][]).flatMap(([cat, pkgs]) =>
                                            pkgs.map((pkg, idx) => (
                                                <tr key={pkg.id} className="border-t border-brand-border/40 hover:bg-brand-bg/60 transition-colors">
                                                    <td className="px-4 py-3 text-brand-text-secondary text-xs !border-0">{idx + 1}</td>
                                                    <td className="px-4 py-3 !border-0">
                                                        <div className="flex items-center gap-2.5">
                                                            {pkg.coverImage ? (
                                                                <img src={pkg.coverImage} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-brand-border" />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center flex-shrink-0">
                                                                    <CameraIcon className="w-4 h-4 text-brand-text-secondary opacity-40" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-brand-text-light text-sm leading-tight truncate max-w-[180px]">{pkg.name}</p>
                                                                <p className="text-xs text-brand-text-secondary sm:hidden">{cat}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 hidden sm:table-cell !border-0">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 border border-purple-400/20 font-medium">{cat}</span>
                                                    </td>
                                                    <td className="px-4 py-3 hidden md:table-cell !border-0">
                                                        {pkg.region ? (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-400/20 font-medium">{pkg.region}</span>
                                                        ) : <span className="text-brand-text-secondary text-xs">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 !border-0">
                                                        {pkg.durationOptions && pkg.durationOptions.length > 0 ? (
                                                            <div className="space-y-0.5">
                                                                {pkg.durationOptions.slice(0, 2).map((o, i) => (
                                                                    <div key={i} className="text-xs flex items-center gap-1">
                                                                        <span className="text-brand-text-secondary truncate max-w-[60px]">{o.label}</span>
                                                                        <span className="font-bold text-brand-accent">{formatCurrency(o.price)}</span>
                                                                    </div>
                                                                ))}
                                                                {pkg.durationOptions.length > 2 && <p className="text-[10px] text-brand-text-secondary">+{pkg.durationOptions.length - 2} opsi</p>}
                                                            </div>
                                                        ) : (
                                                            <span className="font-bold text-brand-accent text-sm">{formatCurrency(pkg.price)}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 hidden lg:table-cell !border-0">
                                                        <span className="text-xs text-brand-text-primary">{pkg.photographers || '—'}</span>
                                                    </td>
                                                    <td className="px-4 py-3 hidden xl:table-cell !border-0">
                                                        {pkg.digitalItems.length > 0 ? (
                                                            <p className="text-xs text-brand-text-secondary line-clamp-2 max-w-[200px]">{pkg.digitalItems.join(' • ')}</p>
                                                        ) : <span className="text-brand-text-secondary text-xs">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 !border-0">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button onClick={() => handlePackageEdit(pkg)} className="btn-box-edit w-7 h-7 rounded-md" title="Edit">
                                                                <PencilIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleOpenCopyModal(pkg)} className="button-secondary !p-1.5 text-brand-text-secondary hover:text-brand-accent rounded-md" title="Duplikasi">
                                                                <CopyIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handlePackageDelete(pkg.id)} className="btn-box-delete w-7 h-7 rounded-md" title="Hapus">
                                                                <Trash2Icon className="w-3.5 h-3.5 text-white" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        {(Object.entries(packagesByCategory).length === 0) && (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-brand-text-secondary !border-0">
                                                    <PackageIcon className="mx-auto w-8 h-8 mb-2 opacity-30" />
                                                    <p className="text-sm">Belum ada package.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Add-ons table */}
                            <div className="border-t border-brand-border">
                                <div className="px-4 py-3 bg-brand-bg flex items-center justify-between">
                                    <p className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Add-On Layanan</p>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-400/20">
                                        {(regionFilter ? addOns.filter(a => a.region === regionFilter) : addOns).length} item
                                    </span>
                                </div>
                                <table className="w-full text-sm !border-0">
                                    <thead>
                                        <tr className="bg-brand-bg/50">
                                            <th className="px-4 py-2 text-xs font-bold text-brand-text-secondary text-left !border-0 border-b border-brand-border/50">Nama</th>
                                            <th className="px-4 py-2 text-xs font-bold text-brand-text-secondary !border-0 border-b border-brand-border/50 hidden sm:table-cell">Wilayah</th>
                                            <th className="px-4 py-2 text-xs font-bold text-brand-text-secondary text-right !border-0 border-b border-brand-border/50">Harga</th>
                                            <th className="px-4 py-2 text-xs font-bold text-brand-text-secondary text-right !border-0 border-b border-brand-border/50">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(regionFilter ? addOns.filter(a => a.region === regionFilter) : addOns).map(addon => (
                                            <tr key={addon.id} className="border-t border-brand-border/30 hover:bg-brand-bg/40 transition-colors">
                                                <td className="px-4 py-2.5 font-semibold text-brand-text-light text-sm !border-0">{addon.name}</td>
                                                <td className="px-4 py-2.5 hidden sm:table-cell !border-0">
                                                    {addon.region ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-400/20">{addon.region}</span> : <span className="text-xs text-brand-text-secondary">—</span>}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-bold text-brand-accent !border-0">{formatCurrency(addon.price)}</td>
                                                <td className="px-4 py-2.5 text-right !border-0">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button onClick={() => handleAddOnEdit(addon)} className="btn-box-edit w-7 h-7 rounded-md" title="Edit"><PencilIcon className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleAddOnDelete(addon.id)} className="btn-box-delete w-7 h-7 rounded-md" title="Hapus"><Trash2Icon className="w-3.5 h-3.5 text-white" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(regionFilter ? addOns.filter(a => a.region === regionFilter) : addOns).length === 0 && (
                                            <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-brand-text-secondary !border-0">Belum ada add-on.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right sidebar: Add-On panel (only in card view) ── */}
                {viewMode === 'cards' && (
                    <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
                        <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between bg-brand-bg/50">
                                <div>
                                    <h3 className="font-bold text-sm text-brand-text-light">Layanan Tambahan</h3>
                                    <p className="text-xs text-brand-text-secondary mt-0.5">Add-On yang tersedia</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-400/20">
                                    {(regionFilter ? addOns.filter(a => a.region === regionFilter) : addOns).length}
                                </span>
                            </div>
                            <div className="divide-y divide-brand-border/40 max-h-64 overflow-y-auto">
                                {(regionFilter ? addOns.filter(a => a.region === regionFilter) : addOns).map(addon => (
                                    <div key={addon.id} className="group flex justify-between items-center px-4 py-2.5 hover:bg-brand-bg/50 transition-colors">
                                        <div className="min-w-0 pr-2">
                                            <p className="text-sm font-semibold text-brand-text-light truncate">{addon.name}</p>
                                            <p className="text-xs font-bold text-brand-accent">{formatCurrency(addon.price)}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <button onClick={() => handleAddOnEdit(addon)} className="p-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-600 text-brand-text-secondary transition-colors" title="Edit"><PencilIcon className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleAddOnDelete(addon.id)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-brand-text-secondary transition-colors" title="Hapus"><Trash2Icon className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                ))}
                                {(regionFilter ? addOns.filter(a => a.region === regionFilter) : addOns).length === 0 && (
                                    <p className="text-center py-8 text-xs text-brand-text-secondary">Belum ada add-on.</p>
                                )}
                            </div>

                            {/* Add-on form */}
                            <form onSubmit={handleAddOnSubmit} className="px-4 py-4 border-t border-brand-border space-y-3 bg-brand-bg/30">
                                <p className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">{addOnEditMode ? 'Edit Add-On' : 'Tambah Add-On'}</p>
                                <div className="input-group !mt-0">
                                    <input type="text" id="addOnName" name="name" value={addOnFormData.name} onChange={handleAddOnInputChange} className="input-field" placeholder=" " required />
                                    <label htmlFor="addOnName" className="input-label">Nama</label>
                                </div>
                                <div className="input-group !mt-0">
                                    <RupiahInput id="addOnPrice" value={addOnFormData.price.toString()} onChange={(raw) => setAddOnFormData(prev => ({ ...prev, price: raw }))} className="input-field" placeholder=" " required />
                                    <label htmlFor="addOnPrice" className="input-label">Harga (IDR)</label>
                                </div>
                                <div className="input-group !mt-0">
                                    <input type="text" id="addOnRegion" name="region" list="region-suggestions" value={addOnFormData.region} onChange={handleAddOnInputChange} className="input-field" placeholder=" " />
                                    <label htmlFor="addOnRegion" className="input-label">Wilayah (opsional)</label>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {unionRegions.map(r => (
                                        <button type="button" key={r.value} onClick={() => setAddOnFormData(prev => ({ ...prev, region: r.value }))}
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${addOnFormData.region === r.value ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-surface border-brand-border text-brand-text-secondary hover:border-brand-accent/50'}`}>
                                            {r.label}
                                        </button>
                                    ))}
                                    {addOnFormData.region && (
                                        <button type="button" onClick={() => setAddOnFormData(prev => ({ ...prev, region: '' }))} className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-red-50 border-red-200 text-brand-danger">Hapus</button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {addOnEditMode && <button type="button" onClick={handleAddOnCancelEdit} className="button-secondary flex-1 py-1.5 text-xs">Batal</button>}
                                    <button type="submit" className="button-primary flex-[2] py-1.5 text-xs">{addOnEditMode ? 'Simpan' : 'Tambah'}</button>
                                </div>
                            </form>
                        </div>
                    </aside>
                )}
            </div>

            <Modal isOpen={packageEditMode !== null} onClose={handlePackageCancelEdit} title={packageEditMode === 'new' ? 'Tambah Package Baru' : 'Edit Package'} size="3xl">
                <form onSubmit={handlePackageSubmit} className="space-y-5 md:space-y-6 max-h-[70vh] overflow-y-auto pr-2 pb-4 form-compact form-compact--ios-scale">
                    {/* Section 1: Informasi Dasar */}
                    <section className="bg-white/40 md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 border md:border-0 border-brand-border/40">
                        <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border/40 pb-2 mb-4">Informasi Dasar Package</h4>
                        <p className="text-xs text-brand-text-secondary mb-4">Masukkan nama dan harga Package layanan Anda. Nama harus jelas dan menarik untuk pengantin.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="input-group"><input type="text" name="name" value={packageFormData.name} onChange={handlePackageInputChange} className="input-field" placeholder=" " required /><label className="input-label">Nama Package</label></div>
                            {(() => {
                                const hasValidOptions = Array.isArray(packageFormData.durationOptions) && packageFormData.durationOptions.some((o: any) => String(o.label || '').trim() !== '' && String(o.price || '') !== '');
                                if (hasValidOptions) {
                                    const def = packageFormData.durationOptions.find((o: any) => o.default) || packageFormData.durationOptions.find((o: any) => String(o.label || '').trim() !== '' && String(o.price || '') !== '');
                                    return (
                                        <div className="input-group">
                                            <input type="text" className="input-field" value={def ? `${def.label}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(def.price || 0))}` : 'Mengikuti opsi durasi default'} disabled placeholder=" " />
                                            <label className="input-label">Harga (mengikuti opsi default)</label>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="input-group">
                                        <RupiahInput value={packageFormData.price.toString()} onChange={(raw) => setPackageFormData((prev: any) => ({ ...prev, price: raw }))} className="input-field" placeholder=" " required />
                                        <label className="input-label">Harga (IDR)</label>
                                    </div>
                                );
                            })()}
                        </div>
                    </section>

                    {/* Section 2: Opsi Durasi */}
                    <section className="bg-white/40 md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 border md:border-0 border-brand-border/40">
                        <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border/40 pb-2 mb-4">Opsi Durasi & Harga (Opsional)</h4>
                        <p className="text-xs text-brand-text-secondary mb-3">Tambahkan variasi durasi seperti 2 Jam, 4 Jam, 8 Jam, Full Day dengan harga berbeda. Klik untuk mengisi detail masing-masing opsi.</p>
                        {packageFormData.durationOptions?.map((opt: any, index: number) => (
                            <div key={index} className="mt-2 border border-brand-border/40 bg-white/40 rounded-xl overflow-hidden shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center p-3 border-b border-brand-border/30 bg-brand-surface/40">
                                    <input type="text" value={opt.label} onChange={e => handleDurationOptionChange(index, 'label', e.target.value)} className="input-field md:col-span-2 bg-white/80" placeholder="Label (cth: 8 Jam / Full Day)" />
                                    <RupiahInput value={opt.price.toString()} onChange={(raw) => handleDurationOptionChange(index, 'price', raw)} className="input-field md:col-span-2 bg-white/80" placeholder="Harga" />
                                    <div className="flex items-center justify-end gap-1 md:gap-2">
                                        <label className="flex items-center gap-1 text-sm text-brand-text-secondary"><input type="radio" name="durationDefault" checked={!!opt.default} onChange={() => handleDurationOptionChange(index, 'default', true)} /> Default</label>
                                        <button type="button" onClick={() => setExpandedDurationIndex(expandedDurationIndex === index ? null : index)} className="p-1.5 rounded hover:bg-brand-input text-brand-accent" title="Detail Package">
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedDurationIndex === index ? 'rotate-180' : ''}`} />
                                        </button>
                                        <button type="button" onClick={() => removeDurationOption(index)} className="p-2 text-brand-danger"><Trash2Icon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                {expandedDurationIndex === index && (
                                    <div className="p-3 border-t border-brand-border bg-brand-surface space-y-3">
                                        <p className="text-xs font-semibold text-brand-accent">Detail {opt.label || 'opsi ini'} (ditampilkan saat pengantin memilih)</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="input-group"><input type="text" value={opt.photographers || ''} onChange={e => handleDurationOptionChange(index, 'photographers', e.target.value)} className="input-field" placeholder=" " /><label className="input-label">Jumlah Tim</label></div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-brand-text-secondary mb-1">Deskripsi Package</p>
                                            {(opt.digitalItems || ['']).map((item: string, i: number) => (
                                                <div key={i} className="flex gap-2 mt-1">
                                                    <input type="text" value={item} onChange={e => handleDurationDigitalItemChange(index, i, e.target.value)} className="input-field flex-grow text-sm" placeholder="Deskripsi item..." />
                                                    <button type="button" onClick={() => removeDurationDigitalItem(index, i)} className="p-2 text-brand-danger"><Trash2Icon className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => addDurationDigitalItem(index)} className="text-xs font-semibold text-brand-accent mt-1">+ Tambah Deskripsi</button>
                                        </div>
                                        <div>
                                            <p className="text-xs text-brand-text-secondary mb-1">Vendor (Allpackage)</p>
                                            {(opt.physicalItems || [{ name: '', price: 0 }]).map((item: any, i: number) => (
                                                <div key={i} className="flex gap-2 mt-1">
                                                    <input type="text" value={item.name || ''} onChange={e => handleDurationPhysicalItemChange(index, i, 'name', e.target.value)} className="input-field flex-grow text-sm" placeholder="Nama vendor/item" />
                                                    <button type="button" onClick={() => removeDurationPhysicalItem(index, i)} className="p-2 text-brand-danger"><Trash2Icon className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => addDurationPhysicalItem(index)} className="text-xs font-semibold text-brand-accent mt-1">+ Tambah Vendor</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addDurationOption} className="text-sm font-semibold text-brand-accent mt-3">+ Tambah Opsi Durasi</button>
                    </section>

                    {/* Section 3: Kategori & Wilayah */}
                    <section className="bg-white/40 md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 border md:border-0 border-brand-border/40">
                        <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border/40 pb-2 mb-4">Kategori & Wilayah</h4>
                        <p className="text-xs text-brand-text-secondary mb-4">Pilih kategori Package dan tentukan wilayah layanan. Wilayah membantu pengantin menemukan Package yang sesuai dengan lokasi mereka.</p>
                        <div className="input-group">
                            <select name="category" value={packageFormData.category} onChange={handlePackageInputChange} className="input-field" required>
                                <option value="">Pilih kategori...</option>
                                {(profile?.packageCategories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <label className="input-label">Kategori</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="input-group">
                                <input
                                    type="text"
                                    name="region"
                                    list="region-suggestions"
                                    value={packageFormData.region}
                                    onChange={handlePackageInputChange}
                                    className="input-field"
                                    placeholder=" "
                                />
                                <label className="input-label">Wilayah (opsional)</label>
                                <datalist id="region-suggestions">
                                    {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </datalist>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {[...REGIONS.map(r => r.value), ...existingRegions.filter(er => !REGIONS.some(r => r.value === er))].map(val => (
                                        <button type="button" key={val} onClick={() => setPackageFormData((prev: any) => ({ ...prev, region: val }))} className={`px-2 py-1 rounded-full text-xs border ${packageFormData.region === val ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-bg border-brand-border text-brand-text-secondary hover:text-brand-text-light'}`}>{val.replace(/\b\w/g, c => c.toUpperCase())}</button>
                                    ))}
                                    {packageFormData.region && (
                                        <button type="button" onClick={() => setPackageFormData((prev: any) => ({ ...prev, region: '' }))} className="px-2 py-1 rounded-full text-xs border bg-brand-bg border-brand-border text-brand-danger">Kosongkan</button>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2" />
                        </div>
                    </section>

                    {/* Section 4: Detail Tim */}
                    <section className="bg-white/40 md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 border md:border-0 border-brand-border/40">
                        <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border/40 pb-2 mb-4">Detail Tim</h4>
                        <p className="text-xs text-brand-text-secondary mb-4">Informasi tentang jumlah tim yang akan ditugaskan untuk Package ini.</p>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="input-group"><input type="text" name="photographers" value={packageFormData.photographers} onChange={handlePackageInputChange} className="input-field" placeholder=" " /><label className="input-label">Jumlah Tim</label></div>
                        </div>
                    </section>

                    {/* Section 5: Cover Image */}
                    <section className="bg-white/40 md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 border md:border-0 border-brand-border/40">
                        <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border/40 pb-2 mb-4">Gambar Sampul</h4>
                        <p className="text-xs text-brand-text-secondary mb-4">Upload gambar menarik untuk mempromosikan Package Anda di halaman publik.</p>
                        <div className="input-group"><label className="input-label !static !-top-4 !text-brand-accent">Cover Image</label><input type="file" onChange={handleCoverImageChange} className="input-field" accept="image/*" /></div>
                    </section>

                    {/* Section 6: Deskripsi Package */}
                    <section className="bg-white/40 md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 border md:border-0 border-brand-border/40">
                        <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border/40 pb-2 mb-4">Deskripsi Package</h4>
                        <p className="text-xs text-brand-text-secondary mb-3">Daftar item atau rincian layanan yang akan diterima pengantin.</p>
                        {packageFormData.digitalItems.map((item: string, index: number) => (
                            <div key={index} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mt-2">
                                <input type="text" value={item} onChange={e => handleDigitalItemChange(index, e)} className="input-field flex-grow" placeholder="Contoh: Deskripsi detail layanan atau item" />
                                <button type="button" onClick={() => removeDigitalItem(index)} className="button-secondary !px-3 !py-2 text-brand-danger self-end md:self-center"><Trash2Icon className="w-4 h-4" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={addDigitalItem} className="text-sm font-semibold text-brand-accent mt-3">+ Tambah Item Deskripsi</button>
                    </section>

                    {/* Section 7: Vendor */}
                    <section className="bg-white/40 md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 border md:border-0 border-brand-border/40">
                        <h4 className="text-sm md:text-base font-semibold text-gradient border-b border-brand-border/40 pb-2 mb-4">Vendor (Allpackage)</h4>
                        <p className="text-xs text-brand-text-secondary mb-3">Keterangan allpackage dan daftar vendor eksternal jika ada.</p>
                        {packageFormData.physicalItems.map((item: { name: string, price: string | number }, index: number) => (
                            <div key={index} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mt-2">
                                <input type="text" name="name" value={item.name} onChange={e => handlePhysicalItemChange(index, e)} className="input-field flex-grow" placeholder="Nama Vendor/Item" />
                                <button type="button" onClick={() => removePhysicalItem(index)} className="button-secondary !px-3 !py-2 text-brand-danger self-end md:self-center"><Trash2Icon className="w-4 h-4" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={addPhysicalItem} className="text-sm font-semibold text-brand-accent mt-3">+ Tambah Vendor</button>
                    </section>

                    <div className="flex flex-col md:flex-row justify-end items-stretch md:items-center gap-3 pt-4 mt-6 border-t border-brand-border/40 sticky -bottom-4 md:bottom-0 bg-white/90 md:bg-white/80 backdrop-blur-xl p-4 -mx-4 md:p-3 md:mx-0 z-10 rounded-b-2xl md:rounded-b-none shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                        <button type="button" onClick={handlePackageCancelEdit} className="button-secondary w-full md:w-auto order-2 md:order-1 shadow-sm min-w-[100px] py-2 md:py-2.5">Batal</button>
                        <button type="submit" className="button-primary w-full md:w-auto order-1 md:order-2 shadow-md min-w-[120px] py-2 md:py-2.5">{packageEditMode === 'new' ? 'Simpan Package' : 'Update Package'}</button>
                    </div>
                </form>
            </Modal>

            {/* Copy/Duplicate Package Modal */}
            <Modal isOpen={copySourcePkg !== null} onClose={handleCloseCopyModal} title="Duplikasi Package ke Wilayah Lain">
                {copySourcePkg && (
                    <div className="space-y-5">
                        <div className="glass-card rounded-2xl p-4 border border-brand-border/50 bg-brand-surface/40">
                            <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1">Package Sumber</p>
                            <p className="font-bold text-brand-text-light text-base">{copySourcePkg.name}</p>
                            {copySourcePkg.region && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                                    Wilayah: {copySourcePkg.region}
                                </span>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-brand-text-light mb-3">Pilih Wilayah Tujuan</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {unionRegions.map(r => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => { setCopyTargetRegion(r.value); setCopyCustomRegion(''); }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                            copyTargetRegion === r.value
                                                ? 'bg-brand-accent text-white border-brand-accent shadow-md'
                                                : 'glass-card text-brand-text-secondary hover:text-brand-text-light hover:bg-white/50 border-brand-border/50'
                                        }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => { setCopyTargetRegion('__custom__'); }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                        copyTargetRegion === '__custom__'
                                            ? 'bg-brand-accent text-white border-brand-accent shadow-md'
                                            : 'glass-card text-brand-text-secondary hover:text-brand-text-light hover:bg-white/50 border-brand-border/50'
                                    }`}
                                >
                                    + Wilayah Baru
                                </button>
                            </div>

                            {copyTargetRegion === '__custom__' && (
                                <div className="input-group mt-2">
                                    <input
                                        type="text"
                                        id="copyCustomRegion"
                                        value={copyCustomRegion}
                                        onChange={e => setCopyCustomRegion(e.target.value)}
                                        className="input-field bg-white/80"
                                        placeholder=" "
                                        autoFocus
                                    />
                                    <label htmlFor="copyCustomRegion" className="input-label">Nama Wilayah Baru</label>
                                </div>
                            )}
                        </div>

                        {copyTargetRegion && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                                <strong>Preview nama package baru:</strong><br />
                                <span className="font-semibold">"{copySourcePkg.name} ({copyTargetRegion === '__custom__' ? (copyCustomRegion || '...'): copyTargetRegion})"</span>
                                <br /><span className="text-blue-500 mt-1 block">Anda bisa mengedit nama setelah duplikasi.</span>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={handleCloseCopyModal} className="button-secondary flex-1 py-2.5">
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDuplicatePackage}
                                disabled={isCopying || !copyTargetRegion || (copyTargetRegion === '__custom__' && !copyCustomRegion.trim())}
                                className="button-primary flex-[2] py-2.5 inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isCopying ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                        Menduplikasi...
                                    </>
                                ) : (
                                    <><CopyIcon className="w-4 h-4" /> Duplikasi Package</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Tautan Booking per Wilayah">
                <div className="space-y-4">
                    <p className="text-sm text-brand-text-secondary mb-4">
                        Bagikan tautan booking khusus untuk setiap wilayah. Setiap tautan akan menampilkan Package dan add-ons yang sesuai dengan wilayah tersebut.
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                        {unionRegions.map(r => (
                            <div key={r.value} className="space-y-2">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${window.location.origin}${window.location.pathname}#/public-booking?region=${r.value}`}
                                        className="input-field !bg-brand-input text-xs sm:text-sm"
                                        onClick={(e) => {
                                            e.currentTarget.select();
                                            navigator.clipboard.writeText(e.currentTarget.value);
                                        }}
                                    />
                                    <label className="input-label">Booking - {r.label}</label>
                                </div>
                                <p className="text-xs text-brand-text-secondary pl-1">
                                    Tautan khusus untuk wilayah {r.label}. Klik untuk menyalin.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="Panduan Halaman Package">
                <div className="space-y-4 text-sm text-brand-text-primary">
                    <p>Halaman ini adalah tempat Anda membuat dan mengelola semua penawaran produk Anda.</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>Package:</strong> Kolom utama di kiri menampilkan semua Package layanan Anda, dikelompokkan berdasarkan kategori. Anda dapat menambah, mengedit, atau menghapus Package.</li>
                        <li><strong>Add-Ons:</strong> Kolom di kanan adalah untuk item tambahan yang bisa dipilih pengantin, seperti drone, MUA, dll.</li>
                        <li><strong>Cover Image:</strong> Anda bisa menambahkan gambar sampul untuk setiap Package agar lebih menarik secara visual di halaman publik.</li>
                        <li><strong>Bagikan Halaman Package:</strong> Gunakan tombol di kanan atas untuk mendapatkan tautan ke halaman publik yang menampilkan semua Package Anda, siap untuk dibagikan kepada calon pengantin.</li>
                        <li><strong>Kategori:</strong> Kategori untuk Package dapat dikelola di halaman <strong>Pengaturan &gt; Kustomisasi Kategori</strong>.</li>
                    </ul>
                </div>
            </Modal>
        </div>
    );
};

export default Packages;
