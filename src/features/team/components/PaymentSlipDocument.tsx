import React from 'react';
import { TeamPaymentRecord, TeamMember, TeamProjectPayment, Project, Profile } from '../../../types';

export interface PaymentSlipDocumentProps {
    record: TeamPaymentRecord;
    teamMembers: TeamMember[];
    teamProjectPayments: TeamProjectPayment[];
    projects: Project[];
    userProfile: Profile;
}

export const PaymentSlipDocument: React.FC<PaymentSlipDocumentProps> = ({
    record,
    teamMembers,
    teamProjectPayments,
    projects,
    userProfile,
}) => {
    const member = teamMembers.find(m => m.id === record.teamMemberId);
    if (!member) return null;
    const projectsBeingPaid = teamProjectPayments.filter(p => record.projectPaymentIds.includes(p.id));

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div id={`payment-slip-content-${record.id}`} className="printable-content bg-white font-sans text-slate-900 printable-area avoid-break shadow-2xl border border-slate-200">
            {/* Accent Border Top */}
            <div className="h-2 bg-brand-accent w-full"></div>

            <div className="p-8 sm:p-12">
                {/* Header Section */}
                <header className="flex justify-between items-start mb-12 pb-8 border-b border-slate-100">
                    <div className="flex flex-col gap-4">
                        {userProfile.logoBase64 ? (
                            <img src={userProfile.logoBase64} alt="Company Logo" className="h-16 sm:h-20 object-contain self-start" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-brand-accent flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">{userProfile.companyName?.charAt(0) || 'V'}</span>
                                </div>
                                <h1 className="text-xl font-bold text-slate-800">{userProfile.companyName}</h1>
                            </div>
                        )}
                        <div className="text-[11px] leading-relaxed text-slate-500 max-w-[250px]">
                            <p className="font-bold text-slate-700">{userProfile.companyName}</p>
                            <p>{userProfile.address}</p>
                            <p>{userProfile.phone} • {userProfile.email}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black text-brand-accent tracking-tighter mb-2">SLIP GAJI</h2>
                        <div className="inline-block bg-white px-3 py-1 rounded-sm text-[12px] font-bold text-slate-600 mb-3">
                            #{record.recordNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            <p>Tanggal Bayar: <span className="font-bold text-slate-700">{formatDate(record.date)}</span></p>
                            <p className="mt-1">Metode: <span className="font-bold text-slate-700 uppercase">Transfer Bank</span></p>
                        </div>
                    </div>
                </header>

                {/* Recipient & Payer Info */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div className="bg-white p-6 rounded-xl border border-slate-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Penerima (Vendor/Tim)</h4>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-slate-800">{member.name}</p>
                            <div className="text-[12px] text-slate-600 space-y-0.5">
                                <p className="font-medium text-brand-accent">{member.role}</p>
                                <p>No. Rek: <span className="font-bold">{member.noRek || '-'}</span></p>
                                <p className="text-[10px] italic">{member.bankName || ''}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Sumber Dana</h4>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-slate-800">{userProfile.companyName}</p>
                            <div className="text-[12px] text-slate-600 space-y-0.5">
                                <p>Rekening Bisnis: <span className="font-bold">{userProfile.bankAccount || '-'}</span></p>
                                <p className="text-[10px] italic">Verified Business Payment</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Items Table */}
                <div className="mb-12">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Rincian Pekerjaan & Honor</h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b-2 border-slate-200">
                                <th className="px-5 py-4 text-[11px] font-black text-slate-600 uppercase tracking-widest text-center w-[10%]">No</th>
                                <th className="px-5 py-4 text-[11px] font-black text-slate-600 uppercase tracking-widest w-[50%]">Deskripsi Acara Pernikahan / Tugas</th>
                                <th className="px-5 py-4 text-[11px] font-black text-slate-600 uppercase tracking-widest text-center w-[15%]">Peran</th>
                                <th className="px-5 py-4 text-[11px] font-black text-slate-600 uppercase tracking-widest text-right w-[25%]">Jumlah Fee</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projectsBeingPaid.map((p, index) => {
                                const project = projects.find(proj => proj.id === p.projectId);
                                return (
                                    <tr key={p.id} className="hover:bg-white transition-colors">
                                        <td className="px-5 py-5 text-center text-slate-500 font-medium">{index + 1}</td>
                                        <td className="px-5 py-5">
                                            <p className="font-bold text-slate-800">{project?.projectName || 'Acara Pernikahan Selesai'}</p>
                                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                                                ID Sesi: {p.id.slice(-8).toUpperCase()} • Selesai: {formatDate(project?.date)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-5 text-center">
                                            <span className="inline-block px-2 py-1 bg-white rounded text-[10px] font-bold text-slate-600 uppercase">
                                                {project?.team.find(t => t.memberId === member.id)?.role || member.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 text-right font-bold text-slate-800">{formatCurrency(p.fee)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-white border-t-2 border-slate-200">
                                <td colSpan={2} className="px-5 py-5 text-right">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Honor Bersih</span>
                                </td>
                                <td className="px-5 py-5 text-right">
                                    <p className="text-2xl font-black text-brand-accent tracking-tighter">{formatCurrency(record.totalAmount)}</p>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer / Signatures */}
                <div className="flex justify-between items-end pt-12 border-t border-slate-100">
                    <div className="flex-1 max-w-[350px]">
                        <div className="bg-brand-accent/5 border border-brand-accent/10 p-4 rounded-lg mb-4">
                            <p className="text-[10px] text-brand-accent font-bold mb-1 uppercase tracking-tight">Catatan Transaksi:</p>
                            <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                Pembayaran ini bersifat final untuk rincian pekerjaan yang tertera di atas. Jika terdapat ketidaksesuaian, silakan hubungi tim administrasi dalam 2x24 jam.
                            </p>
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                            Dicetak Otomatis oleh Sistem {userProfile.companyName}
                        </p>
                    </div>

                    <div className="text-center min-w-[180px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verifikator,</p>
                        <div className="h-20 flex items-center justify-center mb-1">
                            {record.vendorSignature ? (
                                <img src={record.vendorSignature} alt="Tanda Tangan" className="max-h-full object-contain" />
                            ) : userProfile.signatureBase64 ? (
                                <img src={userProfile.signatureBase64} alt="Tanda Tangan" className="max-h-full object-contain" />
                            ) : (
                                <div className="h-px w-24 bg-slate-200 mx-auto mt-10" />
                            )}
                        </div>
                        <p className="text-sm font-bold text-slate-800 underline underline-offset-4 decoration-slate-300">
                            ({userProfile.authorizedSigner || userProfile.companyName})
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-tighter">
                            {userProfile.companyName}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSlipDocument;
