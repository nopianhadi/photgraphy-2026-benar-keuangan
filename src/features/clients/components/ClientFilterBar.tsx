import React from 'react';
import { XIcon, DownloadIcon } from '../../../constants';
import { PaymentStatus } from '../../../types';

interface ClientFilterBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    monthFilter: string;
    setMonthFilter: (month: string) => void;
    dateFrom: string;
    setDateFrom: (date: string) => void;
    dateTo: string;
    setDateTo: (date: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    onDownloadCSV: () => void;
}

export const ClientFilterBar: React.FC<ClientFilterBarProps> = ({
    searchTerm,
    setSearchTerm,
    monthFilter,
    setMonthFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    statusFilter,
    setStatusFilter,
    onDownloadCSV,
}) => {
    return (
        <div className="bg-brand-surface p-3 md:p-4 rounded-xl shadow-lg border border-brand-border flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 md:gap-4 mobile-filter-section">
            <div className="input-group flex-grow !mt-0 w-full lg:w-auto">
                <input
                    type="search"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="input-field !rounded-lg !border !bg-brand-bg p-2 md:p-2.5 text-sm"
                    placeholder=" "
                />
                <label className="input-label text-sm">Cari pengantin (nama, email, telepon)...</label>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto search-filter-row">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={e => setMonthFilter(e.target.value)}
                        className="input-field !rounded-lg !border !bg-brand-bg p-2 text-sm w-full sm:w-auto"
                        title="Filter per Bulan"
                    />
                    {monthFilter && (
                        <button
                            onClick={() => setMonthFilter('')}
                            className="p-2 text-brand-danger hover:bg-brand-danger/10 rounded-lg min-h-[40px] flex items-center justify-center flex-shrink-0"
                            title="Hapus filter bulan"
                        >
                            <XIcon className="w-4 h-4 flex-shrink-0" />
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="input-field !rounded-lg !border !bg-brand-bg p-2 text-sm w-full sm:w-36"
                        title="Dari Tanggal"
                    />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="input-field !rounded-lg !border !bg-brand-bg p-2 text-sm w-full sm:w-36"
                        title="Sampai Tanggal"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="input-field !rounded-lg !border !bg-brand-bg p-2 text-sm w-full sm:w-40"
                >
                    <option value="Semua Status">Semua Status</option>
                    {Object.values(PaymentStatus).map(s => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <button
                    onClick={onDownloadCSV}
                    className="button-secondary min-h-[40px] px-3.5 py-2 inline-flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm font-semibold flex-shrink-0"
                    title="Unduh data pengantin"
                >
                    <DownloadIcon className="w-4 h-4 flex-shrink-0" />
                    <span>Unduh Data</span>
                </button>
            </div>
        </div>
    );
};

export default ClientFilterBar;
