/**
 * useTeamFilters
 *
 * Owns:
 * - Date range filter state (dateFrom, dateTo)
 * - Search query state (teamSearchQuery, vendorSearchQuery, unpaidSearchQuery)
 * - Derived filtered / grouped data consumed by all tabs
 */

import { useState, useMemo } from 'react';
import { TeamMember, TeamProjectPayment, Project } from '../../../types';
import { filterUniqueMembers } from '../utils/teamUtils';

interface UseTeamFiltersParams {
    teamMembers: TeamMember[];
    teamProjectPayments: TeamProjectPayment[];
    projects: Project[];
}

export const useTeamFilters = ({
    teamMembers,
    teamProjectPayments,
    projects,
}: UseTeamFiltersParams) => {
    // ── Date range ───────────────────────────────────────────────────────────
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // ── Search queries ───────────────────────────────────────────────────────
    const [teamSearchQuery, setTeamSearchQuery] = useState('');
    const [vendorSearchQuery, setVendorSearchQuery] = useState('');
    const [unpaidSearchQuery, setUnpaidSearchQuery] = useState('');

    const resetDateRange = () => {
        setDateFrom('');
        setDateTo('');
    };

    // ── Date-filtered projects ───────────────────────────────────────────────
    const projectsInDateRange = useMemo(() => {
        if (!dateFrom && !dateTo) return projects;
        return projects.filter(p => {
            const d = new Date(p.date);
            d.setHours(0, 0, 0, 0);
            if (dateFrom) {
                const from = new Date(dateFrom);
                from.setHours(0, 0, 0, 0);
                if (d < from) return false;
            }
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (d > to) return false;
            }
            return true;
        });
    }, [projects, dateFrom, dateTo]);

    // ── Date-filtered team project payments ──────────────────────────────────
    const teamProjectPaymentsInDateRange = useMemo(() => {
        if (!dateFrom && !dateTo) return teamProjectPayments;
        const projectIdsInRange = new Set(projectsInDateRange.map(p => p.id));
        return teamProjectPayments.filter(p => projectIdsInRange.has(p.projectId));
    }, [teamProjectPayments, projectsInDateRange, dateFrom, dateTo]);

    // ── Member groups (team / vendor split) ──────────────────────────────────
    const memberGroups = useMemo(
        () => ({
            team: teamMembers.filter(m => m.category !== 'Vendor'),
            vendor: teamMembers.filter(m => m.category === 'Vendor'),
        }),
        [teamMembers],
    );

    // ── Filtered member lists ────────────────────────────────────────────────
    const uniqueTeamMembers = useMemo(
        () => filterUniqueMembers(memberGroups.team, teamSearchQuery),
        [memberGroups.team, teamSearchQuery],
    );

    const uniqueVendorMembers = useMemo(
        () => filterUniqueMembers(memberGroups.vendor, vendorSearchQuery),
        [memberGroups.vendor, vendorSearchQuery],
    );

    // ── Unpaid payments with joined member + project data ────────────────────
    const allUnpaidPayments = useMemo(() => {
        return teamProjectPaymentsInDateRange
            .filter(p => p.status === 'Unpaid')
            .map(p => ({
                payment: p,
                member: teamMembers.find(m => m.id === p.teamMemberId),
                project: projectsInDateRange.find(proj => proj.id === p.projectId),
            }));
    }, [teamProjectPaymentsInDateRange, teamMembers, projectsInDateRange]);

    const totalUnpaidAll = useMemo(
        () => allUnpaidPayments.reduce((sum, item) => sum + item.payment.fee, 0),
        [allUnpaidPayments],
    );

    const filteredUnpaidPayments = useMemo(() => {
        if (!unpaidSearchQuery.trim()) return allUnpaidPayments;
        const q = unpaidSearchQuery.trim().toLowerCase();
        return allUnpaidPayments.filter(
            item =>
                (item.member?.name && item.member.name.toLowerCase().includes(q)) ||
                (item.member?.role && item.member.role.toLowerCase().includes(q)) ||
                (item.project?.projectName && item.project.projectName.toLowerCase().includes(q)) ||
                (item.payment.role && item.payment.role.toLowerCase().includes(q)),
        );
    }, [allUnpaidPayments, unpaidSearchQuery]);

    return {
        // Date range
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        resetDateRange,

        // Search queries
        teamSearchQuery,
        setTeamSearchQuery,
        vendorSearchQuery,
        setVendorSearchQuery,
        unpaidSearchQuery,
        setUnpaidSearchQuery,

        // Derived data
        projectsInDateRange,
        teamProjectPaymentsInDateRange,
        memberGroups,
        uniqueTeamMembers,
        uniqueVendorMembers,
        allUnpaidPayments,
        totalUnpaidAll,
        filteredUnpaidPayments,
    };
};
