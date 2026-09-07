import React from 'react';
import StatCard from '../../../shared/ui/StatCard';
import StatCardModal from '../../../shared/ui/StatCardModal';
import { UsersIcon, TrendingUpIcon, AlertCircleIcon, MapPinIcon } from '../../../constants';
import { Client, Project, ClientStatus } from '../../../types';
import { formatCurrency } from '../utils/clientHelpers';

export type StatModalType = 'total' | 'active' | 'receivables' | 'location' | null;

interface ClientStatsCardsProps {
    clientStats: {
        totalClients: number;
        activeClients: number;
        totalReceivables: string;
        mostFrequentLocation: string;
    };
    activeStatModal: StatModalType;
    setActiveStatModal: React.Dispatch<React.SetStateAction<StatModalType>>;
    clients: Client[];
    projects: Project[];
}

export const ClientStatsCards: React.FC<ClientStatsCardsProps> = ({
    clientStats,
    activeStatModal,
    setActiveStatModal,
    clients,
    projects,
}) => {
    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="transition-transform duration-200 hover:scale-105">
                    <StatCard
                        icon={<UsersIcon className="w-6 h-6" />}
                        title="Total Pengantin"
                        value={clientStats.totalClients.toString()}
                        subtitle="Semua pengantin terdaftar"
                        colorVariant="blue"
                        description={`Total pengantin yang terdaftar dalam sistem Anda.\n\nTotal: ${clientStats.totalClients} pengantin\n\nPengantin adalah aset berharga bisnis Anda. Jaga hubungan baik untuk repeat business dan referral.`}
                        onClick={() => setActiveStatModal('total')}
                    />
                </div>
                <div className="transition-transform duration-200 hover:scale-105">
                    <StatCard
                        icon={<TrendingUpIcon className="w-6 h-6" />}
                        title="Pengantin Aktif"
                        value={clientStats.activeClients.toString()}
                        subtitle="Pengantin dengan Acara Pernikahan berjalan"
                        colorVariant="green"
                        description={`Pengantin yang memiliki Acara Pernikahan aktif saat ini.\n\nAktif: ${clientStats.activeClients} pengantin\n\nFokus pada pengantin aktif untuk memastikan kepuasan dan penyelesaian Acara Pernikahan tepat waktu.`}
                        onClick={() => setActiveStatModal('active')}
                    />
                </div>
                <div className="transition-transform duration-200 hover:scale-105">
                    <StatCard
                        icon={<AlertCircleIcon className="w-6 h-6" />}
                        title="Total Piutang"
                        value={clientStats.totalReceivables}
                        subtitle="Tagihan belum terbayar"
                        colorVariant="orange"
                        description={`Total piutang dari semua pengantin yang belum dibayar.\n\nPiutang: ${clientStats.totalReceivables}\n\nSegera tagih untuk menjaga cash flow bisnis Anda.`}
                        onClick={() => setActiveStatModal('receivables')}
                    />
                </div>
                <div className="transition-transform duration-200 hover:scale-105">
                    <StatCard
                        icon={<MapPinIcon className="w-6 h-6" />}
                        title="Lokasi Teratas"
                        value={clientStats.mostFrequentLocation}
                        subtitle="Lokasi paling sering dipilih"
                        colorVariant="purple"
                        description={`Lokasi yang paling sering dipilih oleh pengantin Anda.\n\nTeratas: ${clientStats.mostFrequentLocation}\n\nInformasi ini membantu Anda memahami area market utama.`}
                        onClick={() => setActiveStatModal('location')}
                    />
                </div>
            </div>

            {/* StatCard Detail Modals */}
            <StatCardModal
                isOpen={activeStatModal === 'total'}
                onClose={() => setActiveStatModal(null)}
                icon={<UsersIcon className="w-6 h-6" />}
                title="Total Pengantin"
                value={clientStats.totalClients.toString()}
                subtitle="Semua pengantin terdaftar"
                colorVariant="blue"
                description={`Total pengantin yang terdaftar dalam sistem Anda.\n\nTotal: ${clientStats.totalClients} pengantin\n\nPengantin adalah aset berharga bisnis Anda. Jaga hubungan baik untuk repeat business dan referral.`}
            >
                <div className="space-y-3">
                    <h4 className="font-semibold text-brand-text-light border-b border-brand-border pb-2">Daftar Pengantin</h4>
                    {clients.slice(0, 10).map(client => {
                        const clientProjects = projects.filter(p => p.clientId === client.id);
                        return (
                            <div key={client.id} className="p-3 bg-brand-bg rounded-lg hover:bg-brand-input transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-semibold text-brand-text-light text-sm">{client.name}</p>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                            client.status === ClientStatus.ACTIVE
                                                ? 'bg-green-100 text-green-800'
                                                : client.status === ClientStatus.INACTIVE
                                                ? 'bg-gray-500/20 text-gray-500'
                                                : 'bg-blue-600/20 text-blue-800'
                                        }`}
                                    >
                                        {client.status}
                                    </span>
                                </div>
                                <p className="text-xs text-brand-text-secondary">{client.email}</p>
                                <p className="text-xs text-brand-text-secondary mt-1">{clientProjects.length} Acara Pernikahan</p>
                            </div>
                        );
                    })}
                    {clients.length > 10 && (
                        <p className="text-xs text-brand-text-secondary text-center pt-2">Dan {clients.length - 10} pengantin lainnya...</p>
                    )}
                </div>
            </StatCardModal>

            <StatCardModal
                isOpen={activeStatModal === 'active'}
                onClose={() => setActiveStatModal(null)}
                icon={<TrendingUpIcon className="w-6 h-6" />}
                title="Pengantin Aktif"
                value={clientStats.activeClients.toString()}
                subtitle="Pengantin dengan Acara Pernikahan berjalan"
                colorVariant="green"
                description={`Pengantin yang memiliki Acara Pernikahan aktif saat ini.\n\nAktif: ${clientStats.activeClients} pengantin\n\nFokus pada pengantin aktif untuk memastikan kepuasan dan penyelesaian Acara Pernikahan tepat waktu.`}
            >
                <div className="space-y-3">
                    <h4 className="font-semibold text-brand-text-light border-b border-brand-border pb-2">Pengantin dengan Acara Pernikahan Aktif</h4>
                    {clients
                        .filter(c => projects.some(p => p.clientId === c.id && p.status !== 'Selesai' && p.status !== 'Dibatalkan'))
                        .map(client => {
                            const activeProjects = projects.filter(
                                p => p.clientId === client.id && p.status !== 'Selesai' && p.status !== 'Dibatalkan'
                            );
                            return (
                                <div key={client.id} className="p-3 bg-brand-bg rounded-lg hover:bg-brand-input transition-colors">
                                    <p className="font-semibold text-brand-text-light text-sm">{client.name}</p>
                                    <p className="text-xs text-brand-text-secondary mt-1">{activeProjects.length} Acara Pernikahan aktif</p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {activeProjects.slice(0, 3).map(p => (
                                            <span key={p.id} className="text-xs px-2 py-0.5 rounded-full bg-brand-accent/20 text-brand-accent">
                                                {p.projectName}
                                            </span>
                                        ))}
                                        {activeProjects.length > 3 && (
                                            <span className="text-xs text-brand-text-secondary">+{activeProjects.length - 3} lagi</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </StatCardModal>

            <StatCardModal
                isOpen={activeStatModal === 'receivables'}
                onClose={() => setActiveStatModal(null)}
                icon={<AlertCircleIcon className="w-6 h-6" />}
                title="Total Piutang"
                value={clientStats.totalReceivables}
                subtitle="Tagihan belum terbayar"
                colorVariant="orange"
                description={`Total piutang dari semua pengantin yang belum dibayar.\n\nPiutang: ${clientStats.totalReceivables}\n\nSegera tagih untuk menjaga cash flow bisnis Anda.`}
            >
                <div className="space-y-3">
                    <h4 className="font-semibold text-brand-text-light border-b border-brand-border pb-2">Pengantin dengan Piutang</h4>
                    {clients
                        .map(client => {
                            const clientProjects = projects.filter(p => p.clientId === client.id);
                            const totalReceivable = clientProjects.reduce((sum, p) => sum + (p.totalCost - p.amountPaid), 0);
                            if (totalReceivable <= 0) return null;
                            return (
                                <div key={client.id} className="p-3 bg-brand-bg rounded-lg hover:bg-brand-input transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-semibold text-brand-text-light text-sm">{client.name}</p>
                                        <span className="text-sm text-orange-800 font-semibold">{formatCurrency(totalReceivable)}</span>
                                    </div>
                                    <p className="text-xs text-brand-text-secondary">
                                        {clientProjects.filter(p => p.totalCost - p.amountPaid > 0).length} Acara Pernikahan dengan piutang
                                    </p>
                                </div>
                            );
                        })
                        .filter(Boolean)}
                </div>
            </StatCardModal>

            <StatCardModal
                isOpen={activeStatModal === 'location'}
                onClose={() => setActiveStatModal(null)}
                icon={<MapPinIcon className="w-6 h-6" />}
                title="Lokasi Teratas"
                value={clientStats.mostFrequentLocation}
                subtitle="Lokasi paling sering dipilih"
                colorVariant="purple"
                description={`Lokasi yang paling sering dipilih oleh pengantin Anda.\n\nTeratas: ${clientStats.mostFrequentLocation}\n\nInformasi ini membantu Anda memahami area market utama.`}
            >
                <div className="space-y-3">
                    <h4 className="font-semibold text-brand-text-light border-b border-brand-border pb-2">Distribusi Lokasi Pengantin</h4>
                    {Object.entries(
                        clients.reduce((acc, c) => {
                            const clientProjects = projects.filter(p => p.clientId === c.id);
                            const loc = clientProjects.length > 0 && clientProjects[0].location ? clientProjects[0].location : 'Tidak Diketahui';
                            acc[loc] = (acc[loc] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>)
                    )
                        .sort(([, a], [, b]) => b - a)
                        .map(([location, count]) => (
                            <div key={location} className="p-3 bg-brand-bg rounded-lg flex justify-between items-center">
                                <p className="font-semibold text-brand-text-light text-sm">{location}</p>
                                <span className="text-sm text-brand-accent font-semibold">{count} pengantin</span>
                            </div>
                        ))}
                </div>
            </StatCardModal>
        </>
    );
};

export default ClientStatsCards;
