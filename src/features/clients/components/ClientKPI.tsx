import React, { useMemo, useState } from 'react';
import { Client, Lead, Project, ClientStatus, ContactChannel, ClientFeedback, SatisfactionLevel, LeadStatus } from '../../../types';
import PageHeader from '../../../layouts/PageHeader';
import Modal from '../../../shared/ui/Modal';
import StatCard from '../../../shared/ui/StatCard';
import DonutChart from '../../../shared/ui/DonutChart';
import {
    UsersIcon, TargetIcon, TrendingUpIcon, DollarSignIcon,
    PlusIcon, Share2Icon, StarIcon, SmileIcon, ThumbsUpIcon,
    MehIcon, FrownIcon, EyeIcon, ChevronRightIcon,
    CheckCircleIcon, Trash2Icon, CalendarIcon,
} from '../../../constants';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const StarRatingDisplay: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'md' }) => {
    const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <StarIcon key={star} className={`${sz} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />
            ))}
        </div>
    );
};

const emptyFeedbackForm = { clientName: '', rating: 5, feedback: '' };

interface ClientReportsProps {
    clients: Client[];
    leads: Lead[];
    projects: Project[];
    feedback: ClientFeedback[];
    setFeedback: React.Dispatch<React.SetStateAction<ClientFeedback[]>>;
    showNotification: (message: string) => void;
}

const SatisfactionBadge: React.FC<{ satisfaction: SatisfactionLevel }> = ({ satisfaction }) => {
    const config: Record<SatisfactionLevel, { cls: string; icon: React.ReactNode }> = {
        [SatisfactionLevel.VERY_SATISFIED]: { cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <SmileIcon className="w-3 h-3" /> },
        [SatisfactionLevel.SATISFIED]: { cls: 'bg-sky-500/20 text-sky-400 border-sky-500/30', icon: <ThumbsUpIcon className="w-3 h-3" /> },
        [SatisfactionLevel.NEUTRAL]: { cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <MehIcon className="w-3 h-3" /> },
        [SatisfactionLevel.UNSATISFIED]: { cls: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <FrownIcon className="w-3 h-3" /> },
    };
    const { cls, icon } = config[satisfaction] || { cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: null };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${cls}`}>
            {icon} {satisfaction}
        </span>
    );
};

const ClientReports: React.FC<ClientReportsProps> = ({ clients, leads, projects, feedback, setFeedback, showNotification }) => {
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [manualFeedbackForm, setManualFeedbackForm] = useState(emptyFeedbackForm);
    const [activeStatModal, setActiveStatModal] = useState<'total' | 'active' | 'very-satisfied' | 'satisfied' | 'neutral' | 'unsatisfied' | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const applyDateFilter = <T extends { date?: string; since?: string }>(items: T[], dateKey: 'date' | 'since') => {
        if (!dateFrom && !dateTo) return items;
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        if (from) from.setHours(0, 0, 0, 0);
        if (to) to.setHours(23, 59, 59, 999);
        return items.filter(item => {
            const d = new Date((item as any)[dateKey]);
            return (!from || d >= from) && (!to || d <= to);
        });
    };

    const filteredLeads = useMemo(() => applyDateFilter(leads, 'date'), [leads, dateFrom, dateTo]);
    const filteredClients = useMemo(() => applyDateFilter(clients as any[], 'since') as Client[], [clients, dateFrom, dateTo]);
    const filteredProjects = useMemo(() => applyDateFilter(projects, 'date'), [projects, dateFrom, dateTo]);
    const filteredFeedback = useMemo(() => applyDateFilter(feedback, 'date'), [feedback, dateFrom, dateTo]);

    const kpiData = useMemo(() => {
        const totalLeads = filteredLeads.length;
        const convertedLeads = filteredClients.length;
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
        const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.totalCost, 0);
        const avgRevenuePerClient = convertedLeads > 0 ? totalRevenue / convertedLeads : 0;

        const sourceColors: { [key in ContactChannel]?: string } = {
            [ContactChannel.INSTAGRAM]: '#c13584',
            [ContactChannel.WHATSAPP]: '#25D366',
            [ContactChannel.WEBSITE]: '#3b82f6',
            [ContactChannel.REFERRAL]: '#f59e0b',
            [ContactChannel.PHONE]: '#8b5cf6',
            [ContactChannel.SUGGESTION_FORM]: '#14b8a6',
            [ContactChannel.OTHER]: '#64748b',
        };
        const leadSourceDistribution = filteredLeads.reduce((acc, lead) => {
            acc[lead.contactChannel] = (acc[lead.contactChannel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const leadSourceDonutData = Object.entries(leadSourceDistribution)
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .map(([label, value]) => ({ label, value, color: sourceColors[label as ContactChannel] || '#64748b' }));

        return { totalClients: convertedLeads, activeClients: filteredClients.filter(c => c.status === ClientStatus.ACTIVE).length, conversionRate: conversionRate.toFixed(1) + '%', avgRevenuePerClient: formatCurrency(avgRevenuePerClient), leadSourceDonutData };
    }, [filteredClients, filteredLeads, filteredProjects]);

    const feedbackBySatisfaction = useMemo(() => {
        return filteredFeedback.reduce((acc, item) => {
            if (!acc[item.satisfaction]) acc[item.satisfaction] = [];
            acc[item.satisfaction].push(item);
            return acc;
        }, {} as Record<SatisfactionLevel, ClientFeedback[]>);
    }, [filteredFeedback]);

    const satisfactionCounts = useMemo(() => ({
        [SatisfactionLevel.VERY_SATISFIED]: (feedbackBySatisfaction[SatisfactionLevel.VERY_SATISFIED] || []).length,
        [SatisfactionLevel.SATISFIED]: (feedbackBySatisfaction[SatisfactionLevel.SATISFIED] || []).length,
        [SatisfactionLevel.NEUTRAL]: (feedbackBySatisfaction[SatisfactionLevel.NEUTRAL] || []).length,
        [SatisfactionLevel.UNSATISFIED]: (feedbackBySatisfaction[SatisfactionLevel.UNSATISFIED] || []).length,
    }), [feedbackBySatisfaction]);

    const totalFeedback = Object.values(satisfactionCounts).reduce((a, b) => a + b, 0);
    const avgRating = useMemo(() => {
        if (filteredFeedback.length === 0) return 0;
        return filteredFeedback.reduce((sum, f) => sum + f.rating, 0) / filteredFeedback.length;
    }, [filteredFeedback]);

    const actionRecommendations = useMemo(() => {
        const recs = [];
        if (satisfactionCounts[SatisfactionLevel.UNSATISFIED] > 0) recs.push({ id: 'follow-up', icon: <FrownIcon className="w-5 h-5 text-red-400" />, bg: 'bg-red-500/10 border-red-500/20', title: 'Tindak Lanjuti Testimoni Negatif', text: `${satisfactionCounts[SatisfactionLevel.UNSATISFIED]} pengantin tidak puas. Segera hubungi mereka.` });
        if (satisfactionCounts[SatisfactionLevel.VERY_SATISFIED] > 2) recs.push({ id: 'testimonials', icon: <SmileIcon className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Manfaatkan Testimoni Positif', text: 'Banyak ulasan sangat puas. Minta izin untuk dipublikasikan di sosial media.' });
        if (satisfactionCounts[SatisfactionLevel.NEUTRAL] > 0) recs.push({ id: 'analyze', icon: <MehIcon className="w-5 h-5 text-amber-400" />, bg: 'bg-amber-500/10 border-amber-500/20', title: 'Analisis Masukan Netral', text: 'Pelajari masukan netral untuk menemukan area yang bisa ditingkatkan.' });
        return recs;
    }, [satisfactionCounts]);

    const regionDonutData = useMemo(() => {
        const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e', '#a855f7', '#14b8a6'];
        const distribution = filteredLeads.reduce((acc, l) => {
            const key = (l.location || '').trim() ? l.location.trim().charAt(0).toUpperCase() + l.location.trim().slice(1).toLowerCase() : 'Tidak Diketahui';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(distribution).sort(([, a], [, b]) => Number(b) - Number(a)).map(([label, value], idx) => ({ label, value, color: palette[idx % palette.length] }));
    }, [filteredLeads]);

    const leadStatusCounts = useMemo(() => ({
        discussion: filteredLeads.filter(l => l.status === LeadStatus.DISCUSSION).length,
        followUp: filteredLeads.filter(l => l.status === LeadStatus.FOLLOW_UP).length,
        converted: filteredLeads.filter(l => l.status === LeadStatus.CONVERTED).length,
        rejected: filteredLeads.filter(l => l.status === LeadStatus.REJECTED).length,
    }), [filteredLeads]);

    const activeClientsList = useMemo(() => filteredClients.filter(c => c.status === ClientStatus.ACTIVE), [filteredClients]);

    const feedbackFormUrl = useMemo(() => `${window.location.origin}${window.location.pathname}#/feedback`, []);
    const copyToClipboard = () => {
        navigator.clipboard.writeText(feedbackFormUrl).then(() => { showNotification('Tautan berhasil disalin!'); setIsShareModalOpen(false); }, () => alert('Gagal menyalin tautan.'));
    };

    const handleManualFeedbackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setManualFeedbackForm(prev => ({ ...prev, [name]: name === 'rating' ? Number(value) : value }));
    };

    const getSatisfactionFromRating = (rating: number): SatisfactionLevel => {
        if (rating >= 5) return SatisfactionLevel.VERY_SATISFIED;
        if (rating >= 4) return SatisfactionLevel.SATISFIED;
        if (rating >= 3) return SatisfactionLevel.NEUTRAL;
        return SatisfactionLevel.UNSATISFIED;
    };

    const handleManualFeedbackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newFeedback: ClientFeedback = {
            id: crypto.randomUUID(), date: new Date().toISOString(),
            clientName: manualFeedbackForm.clientName, rating: manualFeedbackForm.rating,
            satisfaction: getSatisfactionFromRating(manualFeedbackForm.rating),
            feedback: manualFeedbackForm.feedback,
        };
        setFeedback(prev => [newFeedback, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setIsFeedbackModalOpen(false);
        setManualFeedbackForm(emptyFeedbackForm);
        showNotification('Masukan berhasil ditambahkan.');
    };

    const modalTitles: Record<string, string> = {
        total: 'Daftar Semua Pengantin', active: 'Daftar Pengantin Aktif',
        'very-satisfied': 'Masukan: Sangat Puas', satisfied: 'Masukan: Puas',
        neutral: 'Masukan: Biasa Saja', unsatisfied: 'Masukan: Tidak Puas',
    };

    let modalContent: React.ReactNode = null;
    if (activeStatModal) {
        if (activeStatModal === 'total' || activeStatModal === 'active') {
            const list = activeStatModal === 'total' ? filteredClients : activeClientsList;
            modalContent = (
                <div className="space-y-2">
                    {list.length > 0 ? list.map(client => (
                        <div key={client.id} className="p-3 bg-brand-bg rounded-xl flex justify-between items-center border border-brand-border/50 hover:border-brand-border transition-colors">
                            <div>
                                <p className="font-semibold text-brand-text-light">{client.name}</p>
                                <p className="text-xs text-brand-text-secondary mt-0.5">{client.email}</p>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${client.status === ClientStatus.ACTIVE ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>{client.status}</span>
                        </div>
                    )) : <p className="text-center text-brand-text-secondary py-10">Tidak ada pengantin dalam periode ini.</p>}
                </div>
            );
        } else {
            const lvl = activeStatModal === 'very-satisfied' ? SatisfactionLevel.VERY_SATISFIED : activeStatModal === 'satisfied' ? SatisfactionLevel.SATISFIED : activeStatModal === 'neutral' ? SatisfactionLevel.NEUTRAL : SatisfactionLevel.UNSATISFIED;
            const list = feedbackBySatisfaction[lvl] || [];
            modalContent = (
                <div className="space-y-3">
                    {list.length > 0 ? list.map(fb => (
                        <div key={fb.id} className="p-3 bg-brand-bg rounded-xl border border-brand-border/50">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold text-brand-text-light">{fb.clientName}</p>
                                <StarRatingDisplay rating={fb.rating} size="sm" />
                            </div>
                            <p className="text-sm text-brand-text-primary italic">"{fb.feedback}"</p>
                            <p className="text-right text-xs text-brand-text-secondary mt-2">{new Date(fb.date).toLocaleDateString('id-ID')}</p>
                        </div>
                    )) : <p className="text-center text-brand-text-secondary py-10">Tidak ada masukan dalam kategori ini.</p>}
                </div>
            );
        }
    }

    const satisfactionConfig = [
        { key: 'very-satisfied' as const, level: SatisfactionLevel.VERY_SATISFIED, label: 'Sangat Puas', icon: <SmileIcon className="w-5 h-5" />, colorVariant: 'green' as const, barColor: 'bg-emerald-500', count: satisfactionCounts[SatisfactionLevel.VERY_SATISFIED] },
        { key: 'satisfied' as const, level: SatisfactionLevel.SATISFIED, label: 'Puas', icon: <ThumbsUpIcon className="w-5 h-5" />, colorVariant: 'blue' as const, barColor: 'bg-sky-500', count: satisfactionCounts[SatisfactionLevel.SATISFIED] },
        { key: 'neutral' as const, level: SatisfactionLevel.NEUTRAL, label: 'Biasa Saja', icon: <MehIcon className="w-5 h-5" />, colorVariant: 'orange' as const, barColor: 'bg-amber-500', count: satisfactionCounts[SatisfactionLevel.NEUTRAL] },
        { key: 'unsatisfied' as const, level: SatisfactionLevel.UNSATISFIED, label: 'Tidak Puas', icon: <FrownIcon className="w-5 h-5" />, colorVariant: 'red' as const, barColor: 'bg-red-500', count: satisfactionCounts[SatisfactionLevel.UNSATISFIED] },
    ];

    const leadStatusConfig = [
        { label: 'Sedang Diskusi', count: leadStatusCounts.discussion, color: '#3b82f6', bg: 'bg-blue-500/15', border: 'border-blue-500/25', text: 'text-blue-400', icon: <EyeIcon className="w-4 h-4" /> },
        { label: 'Follow Up', count: leadStatusCounts.followUp, color: '#8b5cf6', bg: 'bg-violet-500/15', border: 'border-violet-500/25', text: 'text-violet-400', icon: <ChevronRightIcon className="w-4 h-4" /> },
        { label: 'Dikonversi', count: leadStatusCounts.converted, color: '#10b981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', text: 'text-emerald-400', icon: <CheckCircleIcon className="w-4 h-4" /> },
        { label: 'Ditolak', count: leadStatusCounts.rejected, color: '#ef4444', bg: 'bg-red-500/15', border: 'border-red-500/25', text: 'text-red-400', icon: <Trash2Icon className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6 pb-8">
            {/* ── Page Header ── */}
            <PageHeader
                title="Laporan Pengantin"
                subtitle="Analisis terpusat untuk performa akuisisi, konversi, dan kepuasan pengantin Anda."
            />

            {/* ── Date Filter ── */}
            <div className="bg-brand-surface rounded-2xl border border-brand-border p-4 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary shrink-0">
                    <CalendarIcon className="w-4 h-4 text-brand-accent" />
                    Filter Periode
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field !rounded-xl !border !bg-brand-bg p-2.5 text-sm flex-1 sm:flex-none" />
                    <span className="text-brand-text-secondary text-sm font-medium">–</span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field !rounded-xl !border !bg-brand-bg p-2.5 text-sm flex-1 sm:flex-none" />
                </div>
                {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="button-secondary text-xs px-3 py-1.5 shrink-0">
                        Reset Filter
                    </button>
                )}
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="widget-animate cursor-pointer" style={{ animationDelay: '50ms' }} onClick={() => setActiveStatModal('total')}>
                    <StatCard icon={<UsersIcon className="w-6 h-6" />} title="Total Pengantin" value={kpiData.totalClients.toString()} colorVariant="blue" subtitle="Klik untuk lihat daftar" />
                </div>
                <div className="widget-animate cursor-pointer" style={{ animationDelay: '100ms' }} onClick={() => setActiveStatModal('active')}>
                    <StatCard icon={<TrendingUpIcon className="w-6 h-6" />} title="Pengantin Aktif" value={kpiData.activeClients.toString()} colorVariant="green" subtitle="Klik untuk lihat daftar" />
                </div>
                <div className="widget-animate" style={{ animationDelay: '150ms' }}>
                    <StatCard icon={<TargetIcon className="w-6 h-6" />} title="Tingkat Konversi" value={kpiData.conversionRate} colorVariant="orange" subtitle="Calon → Pengantin" />
                </div>
                <div className="widget-animate" style={{ animationDelay: '200ms' }}>
                    <StatCard icon={<DollarSignIcon className="w-6 h-6" />} title="Rata-rata Nilai / Pengantin" value={kpiData.avgRevenuePerClient} colorVariant="purple" />
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 widget-animate" style={{ animationDelay: '250ms' }}>
                {/* Regional Distribution */}
                <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 flex flex-col gap-4">
                    <div>
                        <h4 className="text-base font-bold text-gradient">Distribusi per Wilayah</h4>
                        <p className="text-xs text-brand-text-secondary mt-0.5">Asal daerah calon pengantin</p>
                    </div>
                    <DonutChart data={regionDonutData} />
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-border">
                        {leadStatusConfig.map(s => (
                            <div key={s.label} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${s.bg} ${s.border}`}>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
                                    {s.icon} {s.label}
                                </span>
                                <span className={`text-sm font-bold ${s.text}`}>{s.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lead Source */}
                <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 flex flex-col gap-4">
                    <div>
                        <h4 className="text-base font-bold text-gradient">Sumber Calon Pengantin</h4>
                        <p className="text-xs text-brand-text-secondary mt-0.5">Channel yang membawa leads terbanyak</p>
                    </div>
                    <DonutChart data={kpiData.leadSourceDonutData} />
                    <div className="pt-2 border-t border-brand-border">
                        <div className="flex items-center justify-between text-xs text-brand-text-secondary">
                            <span>Total Calon Pengantin</span>
                            <span className="font-semibold text-brand-text-light">{filteredLeads.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Recent Clients Table ── */}
            <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 widget-animate" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="text-base font-bold text-gradient">Daftar Pengantin Terbaru</h4>
                        <p className="text-xs text-brand-text-secondary mt-0.5">10 pengantin terkini berdasarkan tanggal bergabung</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-brand-accent/15 text-brand-accent border border-brand-accent/25">
                        {filteredClients.length} total
                    </span>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                    {filteredClients.slice(0, 10).map(client => {
                        const totalValue = projects.filter(p => p.clientId === client.id).reduce((sum, p) => sum + p.totalCost, 0);
                        return (
                            <div key={client.id} className="bg-brand-bg p-3 rounded-xl border border-brand-border/40">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-sm text-brand-text-light">{client.name}</p>
                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${client.status === ClientStatus.ACTIVE ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>{client.status}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                    <span className="text-brand-text-secondary">Bergabung</span>
                                    <span className="text-right text-brand-text-primary">{new Date(client.since).toLocaleDateString('id-ID')}</span>
                                    <span className="text-brand-text-secondary">Total Nilai</span>
                                    <span className="text-right font-bold text-brand-text-primary">{formatCurrency(totalValue)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-brand-border/50">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-brand-bg/80">
                                <th className="p-3 text-center font-semibold text-brand-text-secondary w-12 text-xs">#</th>
                                <th className="p-3 text-left font-semibold text-brand-text-secondary text-xs">Nama Pengantin</th>
                                <th className="p-3 text-left font-semibold text-brand-text-secondary text-xs">Bergabung</th>
                                <th className="p-3 text-left font-semibold text-brand-text-secondary text-xs">Status</th>
                                <th className="p-3 text-right font-semibold text-brand-text-secondary text-xs">Total Nilai</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/30">
                            {filteredClients.slice(0, 10).map((client, index) => {
                                const totalValue = projects.filter(p => p.clientId === client.id).reduce((sum, p) => sum + p.totalCost, 0);
                                return (
                                    <tr key={client.id} className="hover:bg-brand-bg/40 transition-colors">
                                        <td className="p-3 text-center text-brand-text-secondary text-xs font-medium">{index + 1}</td>
                                        <td className="p-3">
                                            <p className="font-semibold text-brand-text-light">{client.name}</p>
                                            <p className="text-xs text-brand-text-secondary">{client.email}</p>
                                        </td>
                                        <td className="p-3 text-brand-text-secondary text-sm">{new Date(client.since).toLocaleDateString('id-ID')}</td>
                                        <td className="p-3">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${client.status === ClientStatus.ACTIVE ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>{client.status}</span>
                                        </td>
                                        <td className="p-3 text-right font-bold text-brand-text-primary">{formatCurrency(totalValue)}</td>
                                    </tr>
                                );
                            })}
                            {filteredClients.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-brand-text-secondary text-sm">Tidak ada pengantin pada periode ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Satisfaction Section ── */}
            <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 widget-animate" style={{ animationDelay: '350ms' }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                        <h4 className="text-base font-bold text-gradient">Analisis Kepuasan Pengantin</h4>
                        <p className="text-xs text-brand-text-secondary mt-0.5">{totalFeedback} total testimoni dikumpulkan</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setIsShareModalOpen(true)} className="button-secondary inline-flex items-center gap-1.5 text-sm">
                            <Share2Icon className="w-4 h-4" /> Bagikan Form
                        </button>
                        <button onClick={() => setIsFeedbackModalOpen(true)} className="button-primary inline-flex items-center gap-1.5 text-sm">
                            <PlusIcon className="w-4 h-4" /> Tambah Masukan
                        </button>
                    </div>
                </div>

                {/* Rating Summary + Bars */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                    {/* Big rating display */}
                    <div className="flex flex-col items-center justify-center bg-brand-bg rounded-2xl border border-brand-border/40 p-5">
                        <p className="text-5xl font-black text-brand-text-light mb-1">{avgRating.toFixed(1)}</p>
                        <StarRatingDisplay rating={Math.round(avgRating)} />
                        <p className="text-xs text-brand-text-secondary mt-2">{totalFeedback > 0 ? `Dari ${totalFeedback} testimoni` : 'Belum ada testimoni'}</p>
                    </div>

                    {/* Progress bars */}
                    <div className="lg:col-span-2 flex flex-col justify-center gap-3">
                        {satisfactionConfig.map(s => {
                            const pct = totalFeedback > 0 ? (s.count / totalFeedback) * 100 : 0;
                            return (
                                <button key={s.key} onClick={() => setActiveStatModal(s.key)} className="group text-left focus:outline-none">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 w-32 shrink-0">
                                            <span className="text-brand-text-secondary">{s.icon}</span>
                                            <span className="text-xs font-medium text-brand-text-secondary truncate">{s.label}</span>
                                        </div>
                                        <div className="flex-1 h-2.5 bg-brand-bg rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${s.barColor} group-hover:opacity-80`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-brand-text-light w-8 text-right shrink-0">{s.count}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Stat cards row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {satisfactionConfig.map(s => (
                        <div key={s.key} className="cursor-pointer" onClick={() => setActiveStatModal(s.key)}>
                            <StatCard icon={s.icon} title={s.label} value={s.count.toString()} colorVariant={s.colorVariant} subtitle="Klik untuk detail" />
                        </div>
                    ))}
                </div>

                {/* Bottom: recommendations + feed */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 pt-5 border-t border-brand-border">
                    {/* Recommendations */}
                    <div className="lg:col-span-2">
                        <h5 className="text-sm font-bold text-brand-text-light mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-4 rounded-full bg-brand-accent inline-block" />
                            Rekomendasi Aksi
                        </h5>
                        <div className="space-y-2">
                            {actionRecommendations.length > 0 ? actionRecommendations.map(rec => (
                                <div key={rec.id} className={`p-3 rounded-xl border ${rec.bg} flex items-start gap-3`}>
                                    <div className="shrink-0 mt-0.5">{rec.icon}</div>
                                    <div>
                                        <p className="text-xs font-semibold text-brand-text-light">{rec.title}</p>
                                        <p className="text-[11px] text-brand-text-secondary mt-0.5 leading-relaxed">{rec.text}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <CheckCircleIcon className="w-8 h-8 text-emerald-400 mb-2" />
                                    <p className="text-sm font-medium text-brand-text-light">Semua baik-baik saja!</p>
                                    <p className="text-xs text-brand-text-secondary mt-1">Tidak ada rekomendasi khusus saat ini.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Feedback feed */}
                    <div className="lg:col-span-3">
                        <h5 className="text-sm font-bold text-brand-text-light mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-4 rounded-full bg-brand-accent inline-block" />
                            Masukan Terbaru
                        </h5>
                        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                            {filteredFeedback.map(item => (
                                <div key={item.id} className="bg-brand-bg rounded-xl border border-brand-border/40 p-3 hover:border-brand-border transition-colors">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-brand-text-light truncate">{item.clientName}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <SatisfactionBadge satisfaction={item.satisfaction} />
                                                <StarRatingDisplay rating={item.rating} size="sm" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-brand-text-secondary shrink-0 mt-0.5">
                                            {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <p className="text-xs text-brand-text-secondary leading-relaxed border-t border-brand-border/40 pt-2 mt-1 italic">
                                        "{item.feedback}"
                                    </p>
                                </div>
                            ))}
                            {filteredFeedback.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <StarIcon className="w-8 h-8 text-brand-text-secondary mb-2" />
                                    <p className="text-sm font-medium text-brand-text-light">Belum ada masukan</p>
                                    <p className="text-xs text-brand-text-secondary mt-1">Bagikan form ke pengantin untuk mulai mengumpulkan testimoni.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}

            {/* Add Feedback Modal */}
            <Modal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} title="Tambah Masukan Pengantin">
                <form onSubmit={handleManualFeedbackSubmit} className="space-y-4">
                    <div className="input-group">
                        <input type="text" id="clientName" name="clientName" value={manualFeedbackForm.clientName} onChange={handleManualFeedbackChange} className="input-field" placeholder=" " required />
                        <label htmlFor="clientName" className="input-label">Nama Pengantin</label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-2">Rating</label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} type="button" onClick={() => setManualFeedbackForm(p => ({ ...p, rating: star }))}
                                    className={`p-2 rounded-xl transition-all ${manualFeedbackForm.rating >= star ? 'bg-yellow-400/20 scale-110' : 'bg-brand-input hover:bg-brand-input/80'}`}>
                                    <StarIcon className={`w-6 h-6 transition-colors ${manualFeedbackForm.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-500'}`} />
                                </button>
                            ))}
                            <span className="text-xs text-brand-text-secondary ml-1">({manualFeedbackForm.rating}/5)</span>
                        </div>
                    </div>
                    <div className="input-group">
                        <textarea id="feedback" name="feedback" value={manualFeedbackForm.feedback} onChange={handleManualFeedbackChange} className="input-field" placeholder=" " required rows={4} />
                        <label htmlFor="feedback" className="input-label">Saran / Masukan</label>
                    </div>
                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-brand-border">
                        <button type="button" onClick={() => setIsFeedbackModalOpen(false)} className="button-secondary">Batal</button>
                        <button type="submit" className="button-primary">Simpan Masukan</button>
                    </div>
                </form>
            </Modal>

            {/* Share Modal */}
            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Bagikan Formulir Masukan" size="lg">
                <div className="space-y-4">
                    <div className="p-4 bg-brand-accent/10 border border-brand-accent/25 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Share2Icon className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                            <p className="text-sm text-brand-text-secondary leading-relaxed">
                                Bagikan tautan ini kepada pengantin setelah acara selesai. Mereka dapat memberikan peringkat dan masukan yang langsung tampil di dasbor.
                            </p>
                        </div>
                    </div>
                    <div className="input-group">
                        <input type="text" readOnly value={feedbackFormUrl} className="input-field !bg-brand-input cursor-text select-all" />
                        <label className="input-label">Tautan Formulir</label>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setIsShareModalOpen(false)} className="button-secondary">Tutup</button>
                        <button onClick={copyToClipboard} className="button-primary inline-flex items-center gap-2">
                            <Share2Icon className="w-4 h-4" /> Salin Tautan
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Stat detail modal */}
            <Modal isOpen={!!activeStatModal} onClose={() => setActiveStatModal(null)} title={activeStatModal ? (modalTitles[activeStatModal] ?? '') : ''} size="2xl">
                <div className="max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
                    {modalContent}
                </div>
            </Modal>
        </div>
    );
};

export default ClientReports;
