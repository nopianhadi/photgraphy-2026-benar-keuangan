/**
 * TeamPageHeader
 *
 * Top action bar: date range filters, reset, download CSV, add member button.
 * Identical markup to original.
 */

import React from 'react';
import { CalendarIcon, DownloadIcon, PlusIcon } from '../../../constants';

interface TeamPageHeaderProps {
    dateFrom: string;
    dateTo: string;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onResetDateRange: () => void;
    onDownload: () => void;
    onAddMember: () => void;
}

const TeamPageHeader: React.FC<TeamPageHeaderProps> = ({
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    onResetDateRange,
    onDownload,
    onAddMember,
}) => {
    return (
        <div className="flex flex-col sm:flex-row flex-wrap w-full sm:w-auto items-stretch sm:items-center gap-2 sm:gap-3 mt-4 sm:mt-0 justify-end">
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto items-center">
                <div className="flex items-center gap-1.5 w-full overflow-hidden">
                    <CalendarIcon className="w-4 h-4 text-brand-text-secondary flex-shrink-0" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => onDateFromChange(e.target.value)}
                        className="input-field !rounded-lg !border !bg-brand-bg p-2 text-sm w-full sm:w-36"
                        title="Dari tanggal"
                    />
                </div>
                <input
                    type="date"
                    value={dateTo}
                    onChange={e => onDateToChange(e.target.value)}
                    className="input-field !rounded-lg !border !bg-brand-bg p-2 text-sm w-full sm:w-36"
                    title="Sampai tanggal"
                />
            </div>

            {(dateFrom || dateTo) && (
                <button
                    onClick={onResetDateRange}
                    className="text-xs sm:text-sm text-brand-danger hover:underline text-center py-1"
                >
                    Reset
                </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                    onClick={onDownload}
                    className="button-secondary inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm py-2 min-h-[40px]"
                >
                    <DownloadIcon className="w-4 h-4 flex-shrink-0" /> Unduh
                </button>
                <button
                    onClick={onAddMember}
                    className="button-primary inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm py-2 min-h-[40px]"
                >
                    <PlusIcon className="w-4 h-4 flex-shrink-0" />
                    <span>Tambah</span>
                </button>
            </div>
        </div>
    );
};

export default TeamPageHeader;
