import React, { useState, useEffect } from 'react';
import { Client, Project, Profile } from '../../../types';
import { WhatsappIcon, DEFAULT_BILLING_TEMPLATES } from '../../../constants';
import ShareMessageModal from '../../communication/components/ShareMessageModal';
import { formatCurrency } from '../utils/clientHelpers';

export interface BillingChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    projects: Project[];
    userProfile: Profile;
    showNotification: (message: string) => void;
}

export const BillingChatModal: React.FC<BillingChatModalProps> = ({
    isOpen,
    onClose,
    client,
    projects,
    userProfile,
    showNotification
}) => {
    const [message, setMessage] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [sharePreview, setSharePreview] = useState<{ title: string; message: string; phone?: string | null } | null>(null);

    // Use profile billing templates if available, otherwise use defaults
    const BILLING_CHAT_TEMPLATES = (userProfile.billingTemplates && userProfile.billingTemplates.length > 0)
        ? userProfile.billingTemplates
        : DEFAULT_BILLING_TEMPLATES;

    useEffect(() => {
        if (!client) return;

        const projectsWithBalance = projects.filter(p => p.clientId === client.id && (p.totalCost - p.amountPaid) > 0);
        if (projectsWithBalance.length === 0) return;

        const totalDue = projectsWithBalance.reduce((sum, p) => sum + (p.totalCost - p.amountPaid), 0);

        const projectDetails = projectsWithBalance.map(p =>
            `- Acara Pernikahan: *${p.projectName}*\n  Sisa Tagihan: ${formatCurrency(p.totalCost - p.amountPaid)}`
        ).join('\n');

        const path = window.location.pathname.replace(/index\.html$/, '');
        const portalLink = `${window.location.origin}${path}#/portal/${client.portalAccessId}`;

        const template = BILLING_CHAT_TEMPLATES.find(t => t.id === selectedTemplateId)?.template || BILLING_CHAT_TEMPLATES[0].template;

        const processedMessage = template
            .replace('{clientName}', client.name)
            .replace('{projectDetails}', projectDetails)
            .replace('{totalDue}', formatCurrency(totalDue))
            .replace('{portalLink}', portalLink)
            .replace('{bankAccount}', userProfile.bankAccount || 'N/A')
            .replace(/{companyName}/g, userProfile.companyName || 'Tim Kami');

        setMessage(processedMessage);

    }, [client, projects, userProfile, selectedTemplateId, BILLING_CHAT_TEMPLATES]);

    const handleShareToWhatsApp = () => {
        if (!client || (!client.phone && !client.whatsapp)) {
            showNotification('Nomor telepon pengantin tidak tersedia.');
            return;
        }
        if (!message.trim()) {
            showNotification('Pesan tidak boleh kosong.');
            return;
        }

        setSharePreview({
            title: `Kirim Tagihan ke ${client.name}`,
            message,
            phone: client.whatsapp || client.phone,
        });
    };

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in">
                <div className="p-4 md:p-6 border-b border-brand-border flex justify-between items-center">
                    <h3 className="text-lg font-bold text-brand-text-light">Kirim Tagihan ke {client.name}</h3>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-light">✕</button>
                </div>
                <div className="p-4 md:p-6 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-brand-text-secondary">Gunakan Template Pesan:</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {BILLING_CHAT_TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => setSelectedTemplateId(template.id)}
                                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${selectedTemplateId === template.id ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-bg text-brand-text-secondary border-brand-border hover:border-brand-accent'}`}
                                >
                                    {template.title}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-brand-text-secondary">Isi Pesan</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={12} className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white/5 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all"></textarea>
                    </div>
                    <div className="flex justify-end items-center pt-4 border-t border-brand-border">
                        <button onClick={handleShareToWhatsApp} className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all">
                            <WhatsappIcon className="w-5 h-5" /> Kirim via WhatsApp
                        </button>
                    </div>
                </div>
            </div>
            {sharePreview && (
                <ShareMessageModal
                    isOpen={!!sharePreview}
                    onClose={() => {
                        setSharePreview(null);
                        onClose();
                    }}
                    title={sharePreview.title}
                    initialMessage={sharePreview.message}
                    phone={sharePreview.phone}
                    showNotification={showNotification}
                />
            )}
        </div>
    );
};

export default BillingChatModal;
