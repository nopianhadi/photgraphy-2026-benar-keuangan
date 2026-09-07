import React, { useState } from 'react';
import { Client, Project, Transaction, Profile } from '../../../types';
import {
    generateInvoiceWhatsAppMessage,
    generateReceiptWhatsAppMessage
} from '../utils/clientWhatsAppTemplates';

export type DocumentToView =
    | { type: 'invoice'; project: Project }
    | { type: 'receipt'; transaction: Transaction };

interface UseClientDocumentActionsParams {
    documentToView: DocumentToView | null;
    clientForDetail: Client | null;
    userProfile: Profile;
    projects: Project[];
    showNotification: (msg: string) => void;
    onSignInvoice: (projectId: string, signatureDataUrl: string) => void;
    onSignTransaction: (transactionId: string, signatureDataUrl: string) => void;
    setSharePreview: (val: { title: string; message: string; phone?: string } | null) => void;
}

export const useClientDocumentActions = ({
    documentToView,
    clientForDetail,
    userProfile,
    projects,
    showNotification,
    onSignInvoice,
    onSignTransaction,
    setSharePreview,
}: UseClientDocumentActionsParams) => {
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    const handleSaveSignature = (signatureDataUrl: string) => {
        if (documentToView?.type === 'invoice' && documentToView.project) {
            onSignInvoice(documentToView.project.id, signatureDataUrl);
        } else if (documentToView?.type === 'receipt' && documentToView.transaction) {
            onSignTransaction(documentToView.transaction.id, signatureDataUrl);
        }
        setIsSignatureModalOpen(false);
    };

    const handleShareDocumentWA = async () => {
        if (!documentToView || !clientForDetail) return;

        const phone = clientForDetail.whatsapp || clientForDetail.phone;
        const companyName = userProfile?.companyName || 'Weddfinter';

        if (documentToView.type === 'invoice') {
            const proj = documentToView.project;

            // 1. Auto-generate & download PDF in background
            const elementId = 'invoice-document';
            const element = document.getElementById(elementId);
            if (element) {
                const opt = {
                    margin: 10,
                    filename: `Invoice-${proj.projectName.replace(/\s+/g, '_')}.pdf`,
                    image: { type: 'jpeg' as const, quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        windowWidth: 1200,
                        onclone: (clonedDoc: any) => {
                            const el = clonedDoc.getElementById(elementId);
                            if (el) el.classList.add('force-desktop');
                        }
                    },
                    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
                };
                const html2pdf = (await import('html2pdf.js')).default;
                html2pdf().from(element).set(opt).save();
            }

            // 2. Build public invoice link
            const basePath = window.location.pathname.replace(/index\.html$/, '');
            const publicInvoiceUrl = `${window.location.origin}${basePath}#/portal/invoice/${proj.id}`;

            // 3. Build WhatsApp template with PDF link
            const text = generateInvoiceWhatsAppMessage(clientForDetail.name, companyName, proj, publicInvoiceUrl);

            setSharePreview({
                title: `Bagikan Invoice - ${proj.projectName}`,
                message: text,
                phone,
            });
        } else if (documentToView.type === 'receipt') {
            const tx = documentToView.transaction;

            // 1. Auto-generate & download PDF in background
            const elementId = 'receipt-document';
            const element = document.getElementById(elementId);
            if (element) {
                const opt = {
                    margin: 10,
                    filename: `Tanda_Terima-${tx.id.slice(0, 8)}.pdf`,
                    image: { type: 'jpeg' as const, quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        windowWidth: 1200,
                        onclone: (clonedDoc: any) => {
                            const el = clonedDoc.getElementById(elementId);
                            if (el) el.classList.add('force-desktop');
                        }
                    },
                    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
                };
                const html2pdf = (await import('html2pdf.js')).default;
                html2pdf().from(element).set(opt).save();
            }

            // 2. Build public receipt link
            const basePath = window.location.pathname.replace(/index\.html$/, '');
            const publicReceiptUrl = `${window.location.origin}${basePath}#/portal/receipt/${tx.id}`;

            const projName = tx.projectId ? projects.find(p => p.id === tx.projectId)?.projectName || '' : '';
            const text = generateReceiptWhatsAppMessage(clientForDetail.name, companyName, tx, projName, publicReceiptUrl);

            setSharePreview({
                title: `Bagikan Tanda Terima - ${tx.id.slice(0, 8).toUpperCase()}`,
                message: text,
                phone,
            });
        }
    };

    const handleDownloadPDF = async () => {
        if (!documentToView) return;

        const elementId = documentToView.type === 'invoice' ? 'invoice-document' : 'receipt-document';
        const element = document.getElementById(elementId);

        if (!element) {
            showNotification('Gagal menemukan elemen dokumen untuk diunduh.');
            return;
        }

        const opt = {
            margin: 10,
            filename:
                documentToView.type === 'invoice'
                    ? `Invoice-${documentToView.project.projectName.replace(/\s+/g, '_')}.pdf`
                    : `Tanda_Terima-${documentToView.transaction.id.slice(0, 8)}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 1200,
                onclone: (clonedDoc: any) => {
                    const el = clonedDoc.getElementById(elementId);
                    if (el) el.classList.add('force-desktop');
                }
            },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        const html2pdf = (await import('html2pdf.js')).default;
        html2pdf().from(element).set(opt).save();
    };

    return {
        isSignatureModalOpen,
        setIsSignatureModalOpen,
        handleSaveSignature,
        handleShareDocumentWA,
        handleDownloadPDF,
    };
};
