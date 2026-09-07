/**
 * TeamUnpaidTab
 *
 * Tab 3: Centralized "Fee Belum Lunas" view.
 * Shows summary stats, search bar, and the unpaid list (mobile cards + desktop table).
 * Identical markup to original.
 */

import React from 'react';
import { TeamMember, TeamProjectPayment, Project } from '../../../types';
import StatCard from '../../../shared/ui/StatCard';
import { formatCurrency } from '../utils/teamUtils';
import { AlertCircleIcon, CalendarIcon, UsersIcon, EyeIcon } from '../../../constants';

interface UnpaidPaymentItem {
    payment: TeamProjectPayment;
    member: TeamMember | undefined;
    project: Project | undefined;
}

interface TeamUnpaidTabProps {
    filteredUnpaidPayments: UnpaidPaymentItem[];
    allUnpaidPayments: UnpaidPaymentItem[];
    totalUnpaidAll: number;
    unpaidSearchQuery: string;
    onSearchChange: (query: string) => void;
    onViewDetails: (member: TeamMember) => void;
}

const TeamUnpaidTab: React.FC<TeamUnpaidTabProps> = ({
    filteredUnpaidPayments,
    allUnpaidPayments,
    totalUnpaidAll,
    unpaidSearchQuery,
    onSearchChange,
    onViewDetails,
}) => {
    const uniqueWaitingCount = new Set(
        allUnpaidPayments.map(i => i.member?.id).filter(Boolean),
    ).size;

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <StatCard
                    icon={<AlertCircleIcon className="w-6 h-6" />}
                    title="Total Fee Belum Lunas"
                    value={formatCurrency(totalUnpaidAll)}
                    subtitle="Seluruh Tim & Vendor"
                    colorVariant="pink"
                />
                <StatCard
                    icon={<CalendarIcon className="w-6 h-6" />}
                    title="Tagihan Tertunda"
                    value={allUnpaidPayments.length.toString()}
                    subtitle="Pekerjaan selesai belum dibayar"
                    colorVariant="orange"
                />
                <StatCard
                    icon={<UsersIcon className="w-6 h-6" />}
                    title="Penerima Menunggu"
                    value={uniqueWaitingCount.toString()}
                    subtitle="Orang / Vendor menunggu fee"
                    colorVariant="blue"
                />
            </div>

            {/* Search bar */}
            <div className="bg-brand-surface/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <div className="relative flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="Cari nama penerima, peran, atau nama proyek..."
                        value={unpaidSearchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-accent/50 transition-all pl-10"
                    />
                    <AlertCircleIcon className="w-4 h-4 text-brand-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <div className="text-xs text-brand-text-secondary">
                    Ditemukan{' '}
                    <span className="font-semibold text-brand-text-light">
                        {filteredUnpaidPayments.length}
                    </span>{' '}
                    tagihan tertunda
                </div>
            </div>

            {/* List */}
            <div className="bg-brand-surface/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/10">
                {filteredUnpaidPayments.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 border border-green-600/20 flex items-center justify-center text-green-800">
                            ✓
                        </div>
                        <h3 className="text-base font-semibold text-brand-text-light mb-1">
                            Semua Fee Sudah Lunas!
                        </h3>
                        <p className="text-sm text-brand-text-secondary">
                            Tidak ada tagihan fee Tim atau Vendor yang menunggu pembayaran dalam periode ini.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="md:hidden space-y-3">
                            {filteredUnpaidPayments.map((item, idx) => (
                                <div
                                    key={item.payment.id || idx}
                                    className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-sm space-y-2.5"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-brand-text-light">
                                                {item.member?.name || 'Anggota Tim'}
                                            </p>
                                            <p className="text-xs text-brand-text-secondary">
                                                {item.payment.role || item.member?.role}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                                item.member?.category === 'Vendor'
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-blue-600/20 text-blue-800'
                                            }`}
                                        >
                                            {item.member?.category || 'Tim'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-brand-text-secondary pt-1 border-t border-white/5">
                                        <span className="font-medium text-brand-text-light">
                                            {item.project?.projectName || 'Acara Pernikahan'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <span className="text-base font-bold text-red-800">
                                            {formatCurrency(item.payment.fee)}
                                        </span>
                                        {item.member && (
                                            <button
                                                onClick={() => onViewDetails(item.member!)}
                                                className="button-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
                                            >
                                                <EyeIcon className="w-3.5 h-3.5" /> Kelola Pembayaran
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-brand-text-secondary uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-center w-12">No</th>
                                        <th className="px-4 py-3">Nama Penerima</th>
                                        <th className="px-4 py-3">Kategori</th>
                                        <th className="px-4 py-3">Peran / Tugas</th>
                                        <th className="px-4 py-3">Acara Pernikahan / Proyek</th>
                                        <th className="px-4 py-3 text-right">Nominal Fee</th>
                                        <th className="px-4 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border">
                                    {filteredUnpaidPayments.map((item, idx) => (
                                        <tr
                                            key={item.payment.id || idx}
                                            className="hover:bg-brand-surface/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-center font-medium text-brand-text-secondary">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-brand-text-light">
                                                {item.member?.name || 'Anggota Tim'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                                        item.member?.category === 'Vendor'
                                                            ? 'bg-orange-100 text-orange-800 border border-orange-600/30'
                                                            : 'bg-blue-600/20 text-blue-800 border border-blue-600/30'
                                                    }`}
                                                >
                                                    {item.member?.category || 'Tim'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-brand-text-secondary">
                                                {item.payment.role || item.member?.role || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-brand-text-light font-medium">
                                                {item.project?.projectName || 'Acara'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-red-800">
                                                {formatCurrency(item.payment.fee)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {item.member ? (
                                                    <button
                                                        onClick={() => onViewDetails(item.member!)}
                                                        className="button-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
                                                        title="Buka panel pembayaran anggota ini"
                                                    >
                                                        <EyeIcon className="w-3.5 h-3.5" />
                                                        <span>Bayar / Slip</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-brand-text-secondary">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TeamUnpaidTab;
