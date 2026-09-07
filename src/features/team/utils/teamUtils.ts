/**
 * Team-specific utility functions.
 * Pure functions – no side-effects, no React.
 */

import { formatCurrency } from '../../../utils/currency';
import { downloadCSV } from '../../../utils/export';
import { TeamMember, TeamProjectPayment } from '../../../types';

export { formatCurrency };

export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const getStatusClass = (status: 'Paid' | 'Unpaid'): string =>
    status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

export const filterUniqueMembers = (
    members: TeamMember[],
    query: string,
): TeamMember[] => {
    const seen = new Set<string>();
    const q = query.trim().toLowerCase();
    return members.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        if (!q) return true;
        return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
    });
};

export const downloadTeamCSV = (
    members: TeamMember[],
    teamProjectPayments: TeamProjectPayment[],
): void => {
    const headers = [
        'Nama',
        'Role',
        'Kategori',
        'Email',
        'Telepon',
        'No. Rekening',
        'Fee Belum Dibayar',
        'Rating',
    ];
    const data = members.map(member => {
        const unpaidFee = teamProjectPayments
            .filter(p => p.teamMemberId === member.id && p.status === 'Unpaid')
            .reduce((sum, p) => sum + p.fee, 0);
        return [
            `"${member.name.replace(/"/g, '""')}"`,
            member.role,
            member.category || 'Tim',
            member.email,
            member.phone,
            member.noRek || '-',
            unpaidFee,
            member.rating.toFixed(1),
        ];
    });
    downloadCSV(headers, data, `data-Tim-Vendor-${new Date().toISOString().split('T')[0]}.csv`);
};
