import React, { useState } from 'react';
import {
    Client,
    Project,
    Package,
    AddOn,
    Transaction,
    TransactionType,
    Card,
    Profile,
    PromoCode,
    PaymentStatus,
    ClientStatus
} from '../../../types';
import { createClient as createClientRow, updateClient as updateClientRow } from '../../../services/clients';
import { createProject as createProjectRow, updateProject as updateProjectRow } from '../../../services/projects';
import { createTransaction as createTransactionRow, updateTransaction as updateTransactionRow, updateCardBalance } from '../../../services/transactions';
import { findCardIdByMeta } from '../../../services/cards';
import { ensureOnlineOrNotify, initialFormState, ClientFormData } from '../utils/clientHelpers';
import { DocumentToView } from './useClientDocumentActions';

interface UseClientFormHandlerParams {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    packages: Package[];
    addOns: AddOn[];
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    promoCodes: PromoCode[];
    setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
    userProfile: Profile;
    showNotification: (msg: string) => void;
    clientForDetail: Client | null;
    setClientForDetail: React.Dispatch<React.SetStateAction<Client | null>>;
    documentToView: DocumentToView | null;
    setDocumentToView: React.Dispatch<React.SetStateAction<DocumentToView | null>>;
    setIsSignatureModalOpen: (isOpen: boolean) => void;
}

export const useClientFormHandler = ({
    clients,
    setClients,
    projects,
    setProjects,
    packages,
    addOns,
    transactions,
    setTransactions,
    cards,
    setCards,
    promoCodes,
    setPromoCodes,
    userProfile,
    showNotification,
    clientForDetail,
    setClientForDetail,
    documentToView,
    setDocumentToView,
    setIsSignatureModalOpen,
}: UseClientFormHandlerParams) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState<ClientFormData>(initialFormState);

    const handleOpenModal = (mode: 'add' | 'edit', client?: Client, project?: Project) => {
        setModalMode(mode);
        if (mode === 'edit' && client) {
            setSelectedClient(client);
            const targetProject =
                project ||
                projects.find(p => p.clientId === client.id) ||
                client.mostRecentProject ||
                null;
            setSelectedProject(targetProject);
            setFormData({
                clientId: client.id,
                clientName: client.name,
                email: client.email,
                phone: client.phone,
                whatsapp: client.whatsapp || '',
                instagram: client.instagram || '',
                clientType: client.clientType,
                projectId: targetProject?.id || '',
                projectName: targetProject?.projectName || '',
                projectType: targetProject?.projectType || userProfile.projectTypes[0] || '',
                location: targetProject?.location || '',
                date: targetProject?.date || '',
                packageId: targetProject?.packageId || packages[0]?.id || '',
                selectedAddOnIds: targetProject?.addOns ? targetProject.addOns.map(a => a.id) : [],
                durationSelection: (targetProject as any)?.durationSelection || '',
                unitPrice: (targetProject as any)?.unitPrice,
                address: targetProject?.address || client.address || '',
                dp: String(targetProject?.amountPaid || ''),
                dpDestinationCardId: '',
                notes: targetProject?.notes || '',
                accommodation: targetProject?.accommodation || '',
                driveLink: targetProject?.driveLink || '',
                promoCodeId: targetProject?.promoCodeId || '',
            });

            // Auto-infer duration from notes if empty (helper for user pattern)
            if (
                targetProject &&
                !(targetProject as any).durationSelection &&
                targetProject.notes?.toLowerCase().includes('durasi')
            ) {
                const match = targetProject.notes.match(/durasi\s*(?:dipilih)?:\s*([^|,\n]+)/i);
                if (match) {
                    setFormData(prev => ({ ...prev, durationSelection: match[1].trim() }));
                }
            }
        } else if (mode === 'add' && client) {
            // Adding new project for existing client
            setSelectedClient(client);
            setFormData({
                ...initialFormState,
                clientId: client.id,
                clientName: client.name,
                email: client.email,
                phone: client.phone,
                whatsapp: client.whatsapp || '',
                instagram: client.instagram || '',
                clientType: client.clientType,
                address: client.address || '',
            });
        } else {
            // Adding new client
            setSelectedClient(null);
            setSelectedProject(null);
            setFormData({
                ...initialFormState,
                projectType: userProfile.projectTypes[0] || '',
            });
        }

        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsSignatureModalOpen(false);
    };

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { id, checked } = e.target as HTMLInputElement;
            setFormData(prev => ({
                ...prev,
                selectedAddOnIds: checked
                    ? [...prev.selectedAddOnIds, id]
                    : prev.selectedAddOnIds.filter(addOnId => addOnId !== id),
            }));
        } else {
            setFormData(prev => {
                // If package changed, attempt to apply default duration option
                if (name === 'packageId') {
                    const pkg = packages.find(p => p.id === value);
                    if (pkg && Array.isArray(pkg.durationOptions) && pkg.durationOptions.length > 0) {
                        const defaultOpt = pkg.durationOptions.find(o => o.default) || pkg.durationOptions[0];
                        return {
                            ...prev,
                            [name]: value,
                            durationSelection: defaultOpt.label,
                            unitPrice: Number(defaultOpt.price),
                        };
                    }
                    return {
                        ...prev,
                        [name]: value,
                        durationSelection: '',
                        unitPrice: pkg ? pkg.price : undefined,
                    };
                }

                // If durationSelection changed, compute unitPrice from selected package
                if (name === 'durationSelection') {
                    const pkg = packages.find(p => p.id === prev.packageId);
                    if (pkg && Array.isArray(pkg.durationOptions)) {
                        const opt = pkg.durationOptions.find(o => o.label === value);
                        if (opt) return { ...prev, durationSelection: value, unitPrice: Number(opt.price) };
                    }
                    return { ...prev, durationSelection: value };
                }

                return { ...prev, [name]: value };
            });
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!ensureOnlineOrNotify(showNotification)) return;

        const selectedPackage = packages.find(p => p.id === formData.packageId);
        if (!selectedPackage) {
            alert('Harap pilih Package layanan.');
            return;
        }

        const selectedAddOns = addOns.filter(addon => formData.selectedAddOnIds.includes(addon.id));
        const packagePriceChosen =
            formData.unitPrice !== undefined && !isNaN(Number(formData.unitPrice))
                ? Number(formData.unitPrice)
                : selectedPackage.price || 0;
        const totalBeforeDiscount =
            packagePriceChosen + selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
        let finalDiscountAmount = 0;
        const promoCode = promoCodes.find(p => p.id === formData.promoCodeId);
        if (promoCode) {
            if (promoCode.discountType === 'percentage') {
                finalDiscountAmount = (totalBeforeDiscount * promoCode.discountValue) / 100;
            } else {
                finalDiscountAmount = promoCode.discountValue;
            }
        }
        const totalProject = totalBeforeDiscount - finalDiscountAmount;

        if (modalMode === 'add') {
            let clientId = selectedClient?.id;
            if (!selectedClient) {
                // New client
                try {
                    const created = await createClientRow({
                        name: formData.clientName,
                        email: formData.email,
                        phone: formData.phone,
                        whatsapp: formData.whatsapp || formData.phone,
                        instagram: formData.instagram || undefined,
                        clientType: formData.clientType,
                        since: new Date().toISOString().split('T')[0],
                        status: ClientStatus.ACTIVE,
                        lastContact: new Date().toISOString(),
                        portalAccessId: crypto.randomUUID(),
                        address: formData.address || undefined,
                    } as Omit<Client, 'id'>);
                    clientId = created.id;
                    setClients(prev => [created, ...prev]);
                } catch (err) {
                    showNotification(
                        !navigator.onLine
                            ? 'Harus online untuk melakukan perubahan'
                            : 'Gagal menyimpan pengantin ke database. Coba lagi.'
                    );
                    return;
                }
            }

            const dpAmount = Number(formData.dp) || 0;
            const remainingPayment = totalProject - dpAmount;

            // Create project in Supabase
            try {
                const createdProject = await createProjectRow({
                    projectName: formData.projectName,
                    clientName: formData.clientName,
                    clientId: clientId!,
                    projectType: formData.projectType,
                    packageName: selectedPackage.name,
                    date: formData.date,
                    location: formData.location,
                    status: 'Dikonfirmasi',
                    totalCost: totalProject,
                    amountPaid: dpAmount,
                    paymentStatus:
                        dpAmount > 0
                            ? remainingPayment <= 0
                                ? PaymentStatus.LUNAS
                                : PaymentStatus.DP_TERBAYAR
                            : PaymentStatus.BELUM_BAYAR,
                    durationSelection: formData.durationSelection || undefined,
                    unitPrice: formData.unitPrice !== undefined ? Number(formData.unitPrice) : undefined,
                    notes: formData.notes || undefined,
                    accommodation: formData.accommodation || undefined,
                    driveLink: formData.driveLink || undefined,
                    promoCodeId: formData.promoCodeId || undefined,
                    discountAmount: finalDiscountAmount > 0 ? finalDiscountAmount : undefined,
                    address: formData.address || undefined,
                    printingCost: undefined,
                    transportCost: undefined,
                    completedDigitalItems: [],
                    addOns: selectedAddOns.map(a => ({ id: a.id, name: a.name, price: a.price })),
                });
                const mergedProject: Project = { ...createdProject, addOns: selectedAddOns };
                setProjects(prev => [mergedProject, ...prev]);

                // Create DP transaction (persist to Supabase) if any
                if (mergedProject.amountPaid > 0) {
                    const selectedCard = cards.find(c => c.id === formData.dpDestinationCardId);
                    const supaCardId = selectedCard
                        ? await findCardIdByMeta(selectedCard.bankName, selectedCard.lastFourDigits)
                        : null;
                    try {
                        const createdTx = await createTransactionRow({
                            date: new Date().toISOString().split('T')[0],
                            description: `DP Acara Pernikahan ${mergedProject.projectName}`,
                            amount: mergedProject.amountPaid,
                            type: TransactionType.INCOME,
                            projectId: mergedProject.id,
                            category: 'DP Acara Pernikahan',
                            method: 'Transfer Bank',
                            cardId: supaCardId || undefined,
                        } as Omit<Transaction, 'id' | 'vendorSignature'>);
                        setTransactions(prev =>
                            [...prev, createdTx].sort(
                                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                            )
                        );
                        if (supaCardId && formData.dpDestinationCardId) {
                            setCards(prev =>
                                prev.map(c =>
                                    c.id === formData.dpDestinationCardId
                                        ? { ...c, balance: c.balance + mergedProject.amountPaid }
                                        : c
                                )
                            );
                        }
                    } catch (err) {
                        console.warn('[Supabase] Gagal mencatat transaksi DP, gunakan fallback lokal.', err);
                        const newTransaction: Transaction = {
                            id: `TRN-DP-${mergedProject.id}`,
                            date: new Date().toISOString().split('T')[0],
                            description: `DP Acara Pernikahan ${mergedProject.projectName}`,
                            amount: mergedProject.amountPaid,
                            type: TransactionType.INCOME,
                            projectId: mergedProject.id,
                            category: 'DP Acara Pernikahan',
                            method: 'Transfer Bank',
                            cardId: formData.dpDestinationCardId,
                        };
                        setTransactions(prev =>
                            [...prev, newTransaction].sort(
                                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                            )
                        );
                        setCards(prev =>
                            prev.map(c =>
                                c.id === formData.dpDestinationCardId
                                    ? { ...c, balance: c.balance + mergedProject.amountPaid }
                                    : c
                            )
                        );
                    }
                }
            } catch (err) {
                showNotification(
                    !navigator.onLine
                        ? 'Harus online untuk melakukan perubahan'
                        : 'Gagal membuat Acara Pernikahan di database. Coba lagi.'
                );
                return;
            }

            if (promoCode) {
                setPromoCodes(prev =>
                    prev.map(p => (p.id === promoCode.id ? { ...p, usageCount: p.usageCount + 1 } : p))
                );
            }
            showNotification(
                `Pengantin ${formData.clientName} dan Acara Pernikahan baru berhasil ditambahkan.`
            );
            handleCloseModal();
            setFormData(initialFormState);
            setSelectedClient(null);
            setSelectedProject(null);
        } else if (modalMode === 'edit') {
            if (!selectedClient) {
                alert('Data pengantin tidak ditemukan untuk mode edit.');
                return;
            }

            // Update Client first
            try {
                const updatedClient = await updateClientRow(selectedClient.id, {
                    name: formData.clientName,
                    email: formData.email,
                    phone: formData.phone,
                    whatsapp: formData.whatsapp || undefined,
                    instagram: formData.instagram || undefined,
                    clientType: formData.clientType,
                    lastContact: new Date().toISOString(),
                    address: formData.address || undefined,
                });
                setClients(prev => prev.map(c => (c.id === updatedClient.id ? updatedClient : c)));
                if (clientForDetail?.id === updatedClient.id) {
                    setClientForDetail(updatedClient);
                }
            } catch (err) {
                console.warn('Gagal update data pengantin:', err);
                showNotification(
                    !navigator.onLine
                        ? 'Harus online untuk melakukan perubahan'
                        : 'Gagal mengupdate data pengantin. Coba lagi.'
                );
                return;
            }

            if (!selectedProject) {
                showNotification('Data pengantin berhasil diperbarui.');
                handleCloseModal();
                setFormData(initialFormState);
                setSelectedClient(null);
                setSelectedProject(null);
                return;
            }

            // Recalculate project totals
            const selectedPackage = packages.find(p => p.id === formData.packageId);
            if (!selectedPackage) {
                alert('Harap pilih Package layanan.');
                return;
            }
            const selectedAddOns = addOns.filter(addon => formData.selectedAddOnIds.includes(addon.id));
            const packagePriceChosen =
                formData.unitPrice !== undefined && !isNaN(Number(formData.unitPrice))
                    ? Number(formData.unitPrice)
                    : selectedPackage.price || 0;
            const totalBeforeDiscount =
                packagePriceChosen + selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
            let finalDiscountAmount = 0;
            const promoCode = promoCodes.find(p => p.id === formData.promoCodeId);
            if (promoCode) {
                if (promoCode.discountType === 'percentage') {
                    finalDiscountAmount = (totalBeforeDiscount * promoCode.discountValue) / 100;
                } else {
                    finalDiscountAmount = promoCode.discountValue;
                }
            }
            const totalProject = totalBeforeDiscount - finalDiscountAmount;

            const oldAmountPaid = selectedProject.amountPaid;
            const newAmountPaid = Number(formData.dp) || 0;
            let newPaymentStatus: PaymentStatus = PaymentStatus.BELUM_BAYAR;
            if (newAmountPaid <= 0) newPaymentStatus = PaymentStatus.BELUM_BAYAR;
            else if (newAmountPaid >= totalProject) newPaymentStatus = PaymentStatus.LUNAS;
            else newPaymentStatus = PaymentStatus.DP_TERBAYAR;

            // If amount paid changed, sync DP transaction
            if (newAmountPaid !== oldAmountPaid) {
                const diff = newAmountPaid - oldAmountPaid;

                const dpTransaction = transactions.find(
                    t =>
                        t.projectId === selectedProject.id &&
                        (t.category === 'DP Acara Pernikahan' ||
                            t.category === 'DP Acara' ||
                            t.category === 'DP Proyek' ||
                            t.category === 'Booking Fee' ||
                            t.category === 'Pendaftaran' ||
                            (t.description && t.description.toLowerCase().includes('dp ')))
                );

                if (dpTransaction) {
                    try {
                        const updatedTx = await updateTransactionRow(dpTransaction.id, {
                            amount: newAmountPaid,
                        });
                        setTransactions(prev => prev.map(t => (t.id === updatedTx.id ? updatedTx : t)));
                        if (dpTransaction.cardId) {
                            await updateCardBalance(dpTransaction.cardId, diff);
                            setCards(prev =>
                                prev.map(c =>
                                    c.id === dpTransaction.cardId ? { ...c, balance: c.balance + diff } : c
                                )
                            );
                        }
                    } catch (e) {
                        console.warn('Gagal update transaksi DP asli:', e);
                        showNotification(
                            'Gagal memperbarui riwayat tanda terima, tapi data Acara Pernikahan telah disimpan.'
                        );
                    }
                } else if (newAmountPaid > 0 && formData.dpDestinationCardId) {
                    try {
                        const selectedCard = cards.find(c => c.id === formData.dpDestinationCardId);
                        const supaCardId = selectedCard
                            ? await findCardIdByMeta(selectedCard.bankName, selectedCard.lastFourDigits)
                            : null;

                        const newTx = await createTransactionRow({
                            date: new Date().toISOString().split('T')[0],
                            description: `DP Acara Pernikahan ${formData.projectName}`,
                            amount: newAmountPaid,
                            type: TransactionType.INCOME,
                            projectId: selectedProject.id,
                            category: 'DP Acara Pernikahan',
                            method: 'Transfer Bank',
                            cardId: supaCardId || undefined,
                        } as any);

                        setTransactions(prev =>
                            [newTx, ...prev].sort(
                                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                            )
                        );
                        if (supaCardId) {
                            setCards(prev =>
                                prev.map(c =>
                                    c.id === formData.dpDestinationCardId
                                        ? { ...c, balance: c.balance + newAmountPaid }
                                        : c
                                )
                            );
                        }
                    } catch (e) {
                        console.warn('Gagal membuat transaksi DP baru:', e);
                    }
                }
            }

            try {
                const updatedProject = await updateProjectRow(selectedProject.id, {
                    projectName: formData.projectName,
                    clientName: formData.clientName,
                    clientId: selectedClient.id,
                    projectType: formData.projectType,
                    packageName: selectedPackage.name,
                    date: formData.date,
                    location: formData.location,
                    status: selectedProject.status,
                    totalCost: totalProject,
                    amountPaid: newAmountPaid,
                    paymentStatus: newPaymentStatus,
                    durationSelection: formData.durationSelection || undefined,
                    unitPrice: formData.unitPrice !== undefined ? Number(formData.unitPrice) : undefined,
                    notes: formData.notes || undefined,
                    accommodation: formData.accommodation || undefined,
                    driveLink: formData.driveLink || undefined,
                    promoCodeId: formData.promoCodeId || undefined,
                    discountAmount: finalDiscountAmount > 0 ? finalDiscountAmount : undefined,
                    address: formData.address || undefined,
                    addOns: selectedAddOns.map(a => ({ id: a.id, name: a.name, price: a.price })),
                });

                const merged: Project = { ...updatedProject, addOns: selectedAddOns } as Project;
                setProjects(prev => prev.map(p => (p.id === merged.id ? merged : p)));

                if (documentToView?.type === 'invoice' && documentToView.project.id === merged.id) {
                    setDocumentToView({ type: 'invoice', project: merged });
                }
            } catch (err) {
                console.warn('Gagal update Acara Pernikahan:', err);
                showNotification(
                    !navigator.onLine
                        ? 'Harus online untuk melakukan perubahan'
                        : 'Gagal mengupdate Acara Pernikahan. Coba lagi.'
                );
                return;
            }

            showNotification(`Data pengantin dan Acara Pernikahan berhasil diperbarui.`);
            handleCloseModal();
            setFormData(initialFormState);
            setSelectedClient(null);
            setSelectedProject(null);
        }
    };

    return {
        isModalOpen,
        setIsModalOpen,
        modalMode,
        selectedClient,
        selectedProject,
        formData,
        setFormData,
        handleOpenModal,
        handleCloseModal,
        handleFormChange,
        handleFormSubmit,
    };
};
