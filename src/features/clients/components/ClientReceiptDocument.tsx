import React from 'react';
import { Transaction, Project, Profile, Client, TransactionType } from '../../../types';
import { formatCurrency } from '../utils/clientHelpers';

export interface ClientReceiptDocumentProps {
    transaction: Transaction;
    project: Project | null;
    profile: Profile;
    client: Client;
}

export const ClientReceiptDocument: React.FC<ClientReceiptDocumentProps> = ({
    transaction,
    project,
    profile,
    client
}) => {
    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    const isExpense = transaction.type === TransactionType.EXPENSE;
    const documentTitle = isExpense ? 'Bukti Pengeluaran' : 'Tanda Terima';
    const statusText = isExpense ? 'Telah Dibayarkan Secara Sah' : 'Telah Diterima Secara Sah';
    const statusColor = isExpense ? 'text-blue-600' : 'text-green-600';

    let targetName = client.name;
    if (isExpense) {
        if (transaction.category === 'Gaji Tim / Vendor') {
            const match = transaction.description?.match(/Gaji Freelance - (.+?) \(/);
            if (match && match[1]) {
                targetName = match[1];
            } else {
                targetName = 'Vendor / Tim';
            }
        } else {
            targetName = 'Pihak Lain';
        }
    }

    return (
        <div id="receipt-document" className="p-4 sm:p-8 bg-white border border-slate-200 shadow-xl mx-auto max-w-2xl font-sans text-slate-900 print:shadow-none print:border-none print:bg-white print:max-w-none">
            <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-brand-accent print:mb-6 print:pb-4">
                <div>
                    {profile.logoBase64 ? (
                        <img src={profile.logoBase64} alt="Company Logo" className="h-16 object-contain mb-3" />
                    ) : (
                        <h2 className="text-xl font-bold text-brand-accent mb-1">{profile.companyName}</h2>
                    )}
                    <p className="text-[11px] text-slate-500">{profile.address}</p>
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-black text-slate-400 uppercase tracking-widest leading-none">{documentTitle}</h1>
                    <p className="text-xs font-mono text-slate-500 mt-2">#{transaction.id.slice(0, 8).toUpperCase()}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg mb-8 border border-slate-100 print:bg-white print:border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Pembayaran</p>
                <p className={`text-xs font-bold ${statusColor} uppercase mb-3`}>{statusText}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(transaction.amount)}</p>
                <p className="text-xs text-slate-500 mt-2">Tanggal: <span className="font-bold text-slate-700">{formatDate(transaction.date)}</span></p>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-10">
                <div className="space-y-4">
                    <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                        <span className="text-slate-500">{isExpense ? 'Dibayarkan Kepada' : 'Diterima Dari'}</span>
                        <span className="font-bold text-slate-800">{targetName}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                        <span className="text-slate-500">Metode Pembayaran</span>
                        <span className="font-bold text-slate-800">{transaction.method}</span>
                    </div>
                    <div className="py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tujuan Pembayaran</p>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed bg-white p-3 rounded">{transaction.description}</p>
                    </div>
                    {project && (
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-[12px] text-blue-700">
                            <p className="font-bold mb-1">Progres Acara Pernikahan Pengantin: {project.projectName}</p>
                            <div className="flex justify-between">
                                <span>Total Tagihan: {formatCurrency(project.totalCost)}</span>
                                <span className="font-bold">Sisa: {formatCurrency(project.totalCost - project.amountPaid)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-end pt-8 border-t border-slate-100">
                <div className="text-[10px] text-slate-400 italic">
                    Dicetak otomatis oleh {profile.companyName}
                </div>
                <div className="text-center w-48 shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Penerima,</p>
                    <div className="h-20 flex items-center justify-center mb-2">
                        {transaction.vendorSignature ? (
                            <img src={transaction.vendorSignature} alt="Tanda Tangan" className="max-h-full object-contain" />
                        ) : (
                            <div className="h-px w-24 bg-slate-200 mx-auto mt-10" />
                        )}
                    </div>
                    <p className="text-sm font-bold text-slate-800 underline underline-offset-4 decoration-slate-300">({profile.authorizedSigner || profile.companyName})</p>
                </div>
            </div>
        </div>
    );
};

export default ClientReceiptDocument;
