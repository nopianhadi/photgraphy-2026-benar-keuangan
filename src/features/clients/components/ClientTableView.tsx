import React from 'react';
import { EyeIcon, PencilIcon, Trash2Icon, PlusIcon } from '../../../constants';
import { Client, Project, ClientStatus } from '../../../types';
import { ClientWithSummary } from '../hooks/useClients';
import { formatCurrency, getPaymentStatusClass } from '../utils/clientHelpers';

export type ClientTabType = 'active' | 'inactive' | 'all';

interface ClientTableViewProps {
    clientTab: ClientTabType;
    setClientTab: React.Dispatch<React.SetStateAction<ClientTabType>>;
    filteredClientData: ClientWithSummary[];
    onViewDetail: (client: Client) => void;
    onEditClient: (client: Client, project?: Project) => void;
    onDeleteClient: (clientId: string) => void;
    onAddProject: (client: Client) => void;
}

export const ClientTableView: React.FC<ClientTableViewProps> = ({
    clientTab,
    setClientTab,
    filteredClientData,
    onViewDetail,
    onEditClient,
    onDeleteClient,
    onAddProject,
}) => {
    const activeClients = filteredClientData.filter(c => c.status === ClientStatus.ACTIVE);
    const inactiveClients = filteredClientData.filter(c => c.status !== ClientStatus.ACTIVE);

    const displayedClients =
        clientTab === 'active'
            ? activeClients
            : clientTab === 'inactive'
            ? inactiveClients
            : filteredClientData;

    return (
        <div className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border overflow-hidden">
            <div className="p-3 md:p-4 border-b border-brand-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Segmented View Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-brand-bg/80 rounded-xl border border-brand-border/60">
                    <button
                        type="button"
                        onClick={() => setClientTab('active')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            clientTab === 'active'
                                ? 'bg-brand-accent text-brand-surface shadow-sm'
                                : 'text-brand-text-secondary hover:text-brand-text-light'
                        }`}
                    >
                        Pengantin Aktif ({activeClients.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setClientTab('inactive')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            clientTab === 'inactive'
                                ? 'bg-brand-accent text-brand-surface shadow-sm'
                                : 'text-brand-text-secondary hover:text-brand-text-light'
                        }`}
                    >
                        Selesai / Non-Aktif ({inactiveClients.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setClientTab('all')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            clientTab === 'all'
                                ? 'bg-brand-accent text-brand-surface shadow-sm'
                                : 'text-brand-text-secondary hover:text-brand-text-light'
                        }`}
                    >
                        Semua ({filteredClientData.length})
                    </button>
                </div>
                <div className="text-xs text-brand-text-secondary text-right">
                    Menampilkan <span className="font-bold text-brand-text-light">{displayedClients.length}</span> pengantin
                </div>
            </div>

            {/* Mobile Cards for Selected Tab */}
            <div className="md:hidden p-3 space-y-2">
                {displayedClients.map(client => (
                    <div
                        key={client.id}
                        className={`rounded-xl bg-white/5 border border-brand-border p-3 shadow-sm hover:shadow-md transition-all ${
                            client.status !== ClientStatus.ACTIVE ? 'opacity-75' : ''
                        }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-brand-text-light leading-tight truncate">{client.name}</p>
                                <p className="text-[10px] text-brand-text-secondary mt-0.5 truncate">{client.email || client.phone}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {client.status !== ClientStatus.ACTIVE && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-gray-700 text-gray-300">
                                        {client.status}
                                    </span>
                                )}
                                {client.overallPaymentStatus && (
                                    <span
                                        className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${getPaymentStatusClass(
                                            client.overallPaymentStatus
                                        )}`}
                                    >
                                        {client.overallPaymentStatus}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-xs">
                            <span className="text-brand-text-secondary text-[10px]">Total Nilai</span>
                            <span className="text-right font-semibold text-xs">{formatCurrency(client.totalProjectValue)}</span>
                            <span className="text-brand-text-secondary text-[10px]">Sisa Tagihan</span>
                            <span className="text-right font-bold text-xs text-brand-danger">{formatCurrency(client.balanceDue)}</span>
                            <span className="text-brand-text-secondary text-[10px]">Acara Pernikahan Terbaru</span>
                            <span className="text-right text-xs truncate">{client.mostRecentProject?.projectName || '-'}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-brand-border/50 flex justify-end gap-2">
                            <button
                                onClick={() => onViewDetail(client)}
                                className="btn-box-read w-8 h-8 rounded-lg"
                                title="Detail"
                            >
                                <EyeIcon className="w-4 h-4 flex-shrink-0 text-white" />
                            </button>
                            <button
                                onClick={() => onEditClient(client, client.mostRecentProject || undefined)}
                                className="btn-box-edit w-8 h-8 rounded-lg"
                                title="Edit"
                            >
                                <PencilIcon className="w-4 h-4 flex-shrink-0" />
                            </button>
                            <button
                                onClick={() => onDeleteClient(client.id)}
                                className="btn-box-delete w-8 h-8 rounded-lg"
                                title="Hapus"
                            >
                                <Trash2Icon className="w-4 h-4 flex-shrink-0 text-white" />
                            </button>
                            <button
                                onClick={() => onAddProject(client)}
                                className="btn-box-add w-8 h-8 rounded-lg"
                                title="Tambah Acara"
                            >
                                <PlusIcon className="w-4 h-4 flex-shrink-0 text-white" />
                            </button>
                        </div>
                    </div>
                ))}
                {displayedClients.length === 0 && (
                    <p className="text-center py-8 text-xs text-brand-text-secondary">Tidak ada data pengantin yang sesuai.</p>
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-brand-text-secondary uppercase">
                        <tr>
                            <th className="px-4 py-4 font-medium tracking-wider text-center w-12">No</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Pengantin</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Total Package</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Sisa Tagihan</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Acara Pernikahan Terbaru</th>
                            <th className="px-6 py-4 font-medium tracking-wider text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {displayedClients.map((client, index) => (
                            <tr
                                key={client.id}
                                className={`hover:bg-brand-bg transition-colors ${
                                    client.status !== ClientStatus.ACTIVE ? 'opacity-75' : ''
                                }`}
                            >
                                <td className="px-4 py-4 text-center font-medium text-brand-text-secondary">{index + 1}</td>
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-brand-text-light">{client.name}</p>
                                    <p className="text-xs text-brand-text-secondary">{client.email || client.phone || '-'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                            client.status === ClientStatus.ACTIVE
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-gray-700 text-gray-300'
                                        }`}
                                    >
                                        {client.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-semibold">{formatCurrency(client.totalProjectValue)}</td>
                                <td className="px-6 py-4 font-semibold text-red-800">{formatCurrency(client.balanceDue)}</td>
                                <td className="px-6 py-4">
                                    <p>{client.mostRecentProject?.projectName || '-'}</p>
                                    {client.overallPaymentStatus && (
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusClass(
                                                client.overallPaymentStatus
                                            )}`}
                                        >
                                            {client.overallPaymentStatus}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center space-x-1.5">
                                        <button
                                            onClick={() => onViewDetail(client)}
                                            className="btn-box-read w-8 h-8 rounded-lg"
                                            title="Detail Pengantin"
                                        >
                                            <EyeIcon className="w-4 h-4 text-white flex-shrink-0" />
                                        </button>
                                        <button
                                            onClick={() => onEditClient(client, client.mostRecentProject || undefined)}
                                            className="btn-box-edit w-8 h-8 rounded-lg"
                                            title="Edit Pengantin"
                                        >
                                            <PencilIcon className="w-4 h-4 flex-shrink-0" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteClient(client.id)}
                                            className="btn-box-delete w-8 h-8 rounded-lg"
                                            title="Hapus Pengantin"
                                        >
                                            <Trash2Icon className="w-4 h-4 text-white flex-shrink-0" />
                                        </button>
                                        <button
                                            onClick={() => onAddProject(client)}
                                            className="btn-box-add w-8 h-8 rounded-lg"
                                            title="Tambah Acara Pernikahan Baru"
                                        >
                                            <PlusIcon className="w-4 h-4 text-white flex-shrink-0" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {displayedClients.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-xs text-brand-text-secondary">
                                    Tidak ada data pengantin yang sesuai dengan filter yang dipilih.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClientTableView;
