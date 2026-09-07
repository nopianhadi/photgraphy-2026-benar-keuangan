/**
 * TeamAnalyticsTab
 *
 * Tab 4: Analitik & Performa
 * Three widgets: Komposisi, Performa Kerja, Tren Pembayaran.
 * Identical markup and inline calculation logic to original.
 */

import React from 'react';
import { TeamMember, TeamPaymentRecord } from '../../../types';
import { formatCurrency } from '../utils/teamUtils';
import { UsersIcon, HistoryIcon, DollarSignIcon, StarIcon } from '../../../constants';

interface OverallStats {
    totalPayout: string;
    totalProjectsHandled: number;
    avgRating: string;
}

interface TeamAnalyticsTabProps {
    teamMembers: TeamMember[];
    teamPaymentRecords: TeamPaymentRecord[];
    teamStats: OverallStats;
}

const TeamAnalyticsTab: React.FC<TeamAnalyticsTabProps> = ({
    teamMembers,
    teamPaymentRecords,
    teamStats,
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Widget 1: Komposisi */}
            <div className="bg-brand-surface/80 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-white/10 flex flex-col justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gradient mb-5 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-blue-800" /> Komposisi Tim & Mitra
                    </h3>
                    <div className="space-y-4">
                        {(() => {
                            const timCount = teamMembers.filter(m => m.category !== 'Vendor').length;
                            const vendorCount = teamMembers.filter(m => m.category === 'Vendor').length;
                            const total = timCount + vendorCount || 1;
                            return (
                                <>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-brand-text-secondary text-[10px] font-bold uppercase tracking-widest">
                                                Internal Tim
                                            </span>
                                            <span className="text-lg font-black text-blue-800">{timCount}</span>
                                        </div>
                                        <div className="w-full bg-slate-900/50 h-2.5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                style={{
                                                    width: `${(timCount / total) * 100}%`,
                                                    backgroundColor: '#3b82f6',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-brand-text-secondary text-[10px] font-bold uppercase tracking-widest">
                                                Vendor Eksternal
                                            </span>
                                            <span className="text-lg font-black text-orange-800">{vendorCount}</span>
                                        </div>
                                        <div className="w-full bg-slate-900/50 h-2.5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                                style={{
                                                    width: `${(vendorCount / total) * 100}%`,
                                                    backgroundColor: '#f97316',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Widget 2: Performa Kerja */}
            <div className="bg-brand-surface/80 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-white/10">
                <h3 className="text-sm font-bold text-gradient mb-5 flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-brand-accent" /> Performa Kerja
                </h3>
                <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group">
                        <div>
                            <p className="text-[9px] text-brand-text-secondary font-bold uppercase tracking-tighter">
                                Total Payout Keseluruhan
                            </p>
                            <p className="text-lg font-black text-brand-text-light">
                                {teamStats.totalPayout}
                            </p>
                        </div>
                        <DollarSignIcon className="w-6 h-6 text-brand-text-secondary/20 group-hover:text-brand-accent/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[9px] text-brand-text-secondary font-bold uppercase tracking-tighter">
                                Proyek Selesai
                            </p>
                            <p className="text-lg font-black text-brand-text-light">
                                {teamStats.totalProjectsHandled}
                            </p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[9px] text-brand-text-secondary font-bold uppercase tracking-tighter">
                                Rating Rata-rata
                            </p>
                            <div className="flex items-center gap-1.5">
                                <p className="text-lg font-black text-yellow-800">{teamStats.avgRating}</p>
                                <StarIcon className="w-3.5 h-3.5 text-yellow-800 fill-current" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Widget 3: Tren Pembayaran */}
            <div className="bg-brand-surface/80 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-white/10">
                <div className="flex justify-between items-start mb-5">
                    <h3 className="text-sm font-bold text-gradient flex items-center gap-2">
                        <DollarSignIcon className="w-5 h-5" /> Tren Pembayaran
                    </h3>
                    <div className="text-right">
                        <p className="text-[9px] text-brand-text-secondary font-bold uppercase">
                            6 Bulan Terakhir
                        </p>
                        <p className="text-sm font-black text-brand-accent">
                            {(() => {
                                const now = new Date();
                                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                                const total = teamPaymentRecords
                                    .filter(r => new Date(r.date) >= sixMonthsAgo)
                                    .reduce((sum, r) => sum + r.totalAmount, 0);
                                return formatCurrency(total);
                            })()}
                        </p>
                    </div>
                </div>
                <div className="h-24 flex items-end gap-2 px-1">
                    {(() => {
                        const now = new Date();
                        const months: {
                            name: string;
                            year: number;
                            month: number;
                            total: number;
                        }[] = [];
                        for (let i = 5; i >= 0; i--) {
                            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                            months.push({
                                name: d.toLocaleString('id-ID', { month: 'short' }),
                                year: d.getFullYear(),
                                month: d.getMonth(),
                                total: 0,
                            });
                        }
                        teamPaymentRecords.forEach(r => {
                            const rd = new Date(r.date);
                            const m = months.find(
                                mo => mo.month === rd.getMonth() && mo.year === rd.getFullYear(),
                            );
                            if (m) m.total += r.totalAmount;
                        });
                        const maxVal = Math.max(...months.map(m => m.total), 1);
                        return months.map((m, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-accent text-white text-[9px] py-1 px-2 rounded-lg shadow-2xl z-20 whitespace-nowrap font-bold">
                                    {formatCurrency(m.total)}
                                </div>
                                <div
                                    className="w-full rounded-t-lg transition-all duration-300"
                                    style={{
                                        height: `${(m.total / maxVal) * 100}%`,
                                        minHeight: '4px',
                                        background:
                                            m.total > 0
                                                ? 'linear-gradient(to top, #6366f1, #818cf8)'
                                                : '#1e293b',
                                        boxShadow:
                                            m.total > 0 ? '0 0 10px rgba(99,102,241,0.3)' : 'none',
                                    }}
                                />
                                <span className="text-[9px] font-bold text-brand-text-secondary mt-2">
                                    {m.name}
                                </span>
                            </div>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
};

export default TeamAnalyticsTab;
