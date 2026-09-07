import React from 'react';
import Modal from '../../../shared/ui/Modal';
import SignaturePad from '../../../shared/ui/SignaturePad';
import InvoiceDocument from '../../finance/components/InvoiceDocument';
import ClientReceiptDocument from './ClientReceiptDocument';
import { PencilIcon, DownloadIcon, WhatsappIcon } from '../../../constants';
import { Client, Project, Package, Profile, Transaction } from '../../../types';
import { DocumentToView } from '../hooks/useClientDocumentActions';

interface ClientDocumentModalProps {
    documentToView: DocumentToView | null;
    onClose: () => void;
    clientForDetail: Client | null;
    userProfile: Profile;
    packages: Package[];
    projects: Project[];
    isSignatureModalOpen: boolean;
    setIsSignatureModalOpen: (isOpen: boolean) => void;
    onSaveSignature: (sig: string) => void;
    onEditDocument: () => void;
    onDownloadPDF: () => void;
    onShareDocumentWA: () => void;
}

export const ClientDocumentModal: React.FC<ClientDocumentModalProps> = ({
    documentToView,
    onClose,
    clientForDetail,
    userProfile,
    packages,
    projects,
    isSignatureModalOpen,
    setIsSignatureModalOpen,
    onSaveSignature,
    onEditDocument,
    onDownloadPDF,
    onShareDocumentWA,
}) => {
    const renderDocumentBody = () => {
        if (!documentToView || !clientForDetail) return null;

        if (documentToView.type === 'invoice') {
            return (
                <InvoiceDocument
                    id="invoice-document"
                    project={documentToView.project}
                    profile={userProfile}
                    packages={packages}
                    client={clientForDetail}
                />
            );
        } else if (documentToView.type === 'receipt') {
            const transaction = documentToView.transaction;
            const project = transaction.projectId ? projects.find(p => p.id === transaction.projectId) : null;

            return (
                <ClientReceiptDocument
                    transaction={transaction}
                    project={project}
                    profile={userProfile}
                    client={clientForDetail}
                />
            );
        }
        return null;
    };

    const hasSignature =
        documentToView &&
        (documentToView.type === 'invoice'
            ? !!documentToView.project?.invoiceSignature
            : !!documentToView.transaction?.vendorSignature);

    return (
        <>
            <Modal
                isOpen={!!documentToView}
                onClose={onClose}
                title={documentToView ? (documentToView.type === 'invoice' ? 'Invoice' : 'Tanda Terima') : ''}
                size="3xl"
            >
                <div id="invoice" className="printable-area overflow-y-auto">
                    {renderDocumentBody()}
                </div>
                <div className="mt-6 flex justify-end items-center non-printable space-x-3 border-t border-brand-border pt-4 px-2">
                    {documentToView && !hasSignature && (
                        <button
                            type="button"
                            onClick={() => {
                                if (userProfile?.signatureBase64) {
                                    onSaveSignature(userProfile.signatureBase64);
                                } else {
                                    setIsSignatureModalOpen(true);
                                }
                            }}
                            className="button-secondary p-2.5"
                        >
                            Tanda Tangani
                        </button>
                    )}
                    <button
                        onClick={onEditDocument}
                        className="button-secondary inline-flex items-center gap-2 p-2.5"
                        title="Edit Dokumen"
                    >
                        <PencilIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                        onClick={onDownloadPDF}
                        className="button-secondary inline-flex items-center gap-2 p-2.5"
                        title="Unduh sebagai PDF"
                    >
                        <DownloadIcon className="w-5 h-5 text-brand-accent" />
                        <span className="hidden sm:inline">Unduh PDF</span>
                    </button>
                    <button
                        onClick={onShareDocumentWA}
                        className="btn-box-wa px-4 py-2 text-xs sm:text-sm"
                        title="Kirim via WhatsApp"
                    >
                        <WhatsappIcon className="w-4 h-4 flex-shrink-0 text-white" />
                        <span>Kirim ke WA</span>
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                title="Bubuhkan Tanda Tangan Anda"
            >
                <SignaturePad onClose={() => setIsSignatureModalOpen(false)} onSave={onSaveSignature} />
            </Modal>
        </>
    );
};

export default ClientDocumentModal;
