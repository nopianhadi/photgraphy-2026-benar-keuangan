/**
 * TeamMemberList
 *
 * Renders the member list for a single group (Tim or Vendor).
 * Desktop: table. Mobile: cards. Identical markup to original.
 */

import React from 'react';
import { TeamMember, TeamProjectPayment } from '../../../types';
import { formatCurrency } from '../utils/teamUtils';
import {
    EyeIcon,
    PencilIcon,
    Trash2Icon,
    StarIcon,
    UsersIcon,
} from '../../../constants';

interface TeamMemberListProps {
    members: TeamMember[];
    teamProjectPaymentsInDateRange: TeamProjectPayment[];
    groupLabel: 'team' | 'vendor';
    onViewDetails: (member: TeamMember) => void;
    onEditMember: (member: TeamMember) => void;
    onDeleteMember: (memberId: string) => void;
}

const TeamMemberList: React.FC<TeamMemberListProps> = ({
    members,
    teamProjectPaymentsInDateRange,
    groupLabel,
    onViewDetails,
    onEditMember,
    onDeleteMember,
}) => {
    const emptyMessage =
        groupLabel === 'team'
            ? 'Tidak ada data anggota tim yang cocok.'
            : 'Tidak ada data vendor yang cocok.';

    const emptySearchMessage =
        groupLabel === 'team'
            ? 'Tidak ada data anggota tim yang cocok dengan pencarian.'
            : 'Tidak ada data vendor yang cocok dengan pencarian.';

    const nameHeader = groupLabel === 'vendor' ? 'Nama Vendor' : 'Nama';
    const roleHeader = groupLabel === 'vendor' ? 'Bidang / Layanan' : 'Peran / Posisi';

    return (
        <div className="bg-brand-surface/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/10 transition-all duration-300">
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
                {members.map(member => {
                    const unpaidFee = teamProjectPaymentsInDateRange
                        .filter(p => p.teamMemberId === member.id && p.status === 'Unpaid')
                        .reduce((sum, p) => sum + p.fee, 0);

                    const categoryBadgeClass =
                        groupLabel === 'vendor'
                            ? 'bg-orange-100 text-orange-800 border border-orange-600/30'
                            : 'bg-blue-600/20 text-blue-800 border border-blue-600/30';

                    return (
                        <div
                            key={member.id}
                            className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-5 shadow-lg group hover:border-brand-accent/50 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-brand-text-light leading-tight">
                                        {member.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[11px] text-brand-text-secondary">
                                            {member.role}
                                        </p>
                                        <span
                                            className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${categoryBadgeClass}`}
                                        >
                                            {member.category || (groupLabel === 'vendor' ? 'Vendor' : 'Tim')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right text-xs">
                                    <div className="inline-flex items-center gap-1 bg-brand-bg px-2 py-1 rounded-full">
                                        <StarIcon className="w-3.5 h-3.5 text-yellow-800 fill-current" />
                                        {member.rating.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                                <span className="text-brand-text-secondary">Fee Belum Dibayar</span>
                                <span className="text-right font-semibold text-red-800">
                                    {formatCurrency(unpaidFee)}
                                </span>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                                <button
                                    onClick={() => onViewDetails(member)}
                                    className="btn-box-read text-xs px-3 py-1.5"
                                >
                                    <EyeIcon className="w-3.5 h-3.5 flex-shrink-0 text-white" /> Detail
                                </button>
                                <button
                                    onClick={() => onEditMember(member)}
                                    className="btn-box-edit text-xs px-3 py-1.5"
                                >
                                    <PencilIcon className="w-3.5 h-3.5 flex-shrink-0" /> Edit
                                </button>
                                <button
                                    onClick={() => onDeleteMember(member.id)}
                                    className="btn-box-delete text-xs px-3 py-1.5"
                                >
                                    <Trash2Icon className="w-3.5 h-3.5 flex-shrink-0 text-white" /> Hapus
                                </button>
                            </div>
                        </div>
                    );
                })}
                {members.length === 0 && (
                    <div className="text-center py-8 text-brand-text-secondary">
                        <UsersIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p>{emptyMessage}</p>
                    </div>
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-brand-text-secondary uppercase">
                        <tr>
                            <th className="px-4 py-3 text-center w-12">No</th>
                            <th className="px-4 py-3">{nameHeader}</th>
                            <th className="px-4 py-3">{roleHeader}</th>
                            <th className="px-4 py-3">Fee Belum Dibayar</th>
                            <th className="px-4 py-3 text-center">Rating</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {members.map((member, index) => {
                            const unpaidFee = teamProjectPaymentsInDateRange
                                .filter(p => p.teamMemberId === member.id && p.status === 'Unpaid')
                                .reduce((sum, p) => sum + p.fee, 0);
                            return (
                                <tr
                                    key={member.id}
                                    className="hover:bg-brand-surface/50 transition-colors"
                                >
                                    <td className="px-4 py-3 text-center font-medium text-brand-text-secondary">
                                        {index + 1}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-brand-text-light">
                                        {member.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-brand-text-primary font-medium">
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-red-800">
                                        {formatCurrency(unpaidFee)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center items-center gap-1">
                                            <StarIcon className="w-4 h-4 text-yellow-800 fill-current" />
                                            {member.rating.toFixed(1)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center space-x-1.5">
                                            <button
                                                onClick={() => onViewDetails(member)}
                                                className="btn-box-read w-8 h-8 rounded-lg"
                                                title="Detail"
                                            >
                                                <EyeIcon className="w-4 h-4 text-white flex-shrink-0" />
                                            </button>
                                            <button
                                                onClick={() => onEditMember(member)}
                                                className="btn-box-edit w-8 h-8 rounded-lg"
                                                title="Edit"
                                            >
                                                <PencilIcon className="w-4 h-4 flex-shrink-0" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteMember(member.id)}
                                                className="btn-box-delete w-8 h-8 rounded-lg"
                                                title="Hapus"
                                            >
                                                <Trash2Icon className="w-4 h-4 text-white flex-shrink-0" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {members.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="text-center py-8 text-brand-text-secondary"
                                >
                                    {emptySearchMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamMemberList;
