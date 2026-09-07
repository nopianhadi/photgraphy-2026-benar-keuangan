import React from 'react';
import { FinancialPocket, PocketType } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import { PiggyBankIcon, LockIcon, UsersIcon, ClipboardListIcon, StarIcon } from '../../../constants';

const pocketIcons: { [key in FinancialPocket['icon']]: React.ReactNode } = {
    'piggy-bank': <PiggyBankIcon className="w-8 h-8" />, 
    'lock': <LockIcon className="w-8 h-8" />,
    'users': <UsersIcon className="w-8 h-8" />, 
    'clipboard-list': <ClipboardListIcon className="w-8 h-8" />,
    'star': <StarIcon className="w-8 h-8" />
};

interface PocketStatCardProps {
    pocket: FinancialPocket;
    amount: number;
    sourceCardName?: string | null;
    progressPercent: number;
    onClick: () => void;
    onWithdraw: () => void;
    onDeposit: () => void;
    headerActions?: React.ReactNode;
}

export const PocketStatCard: React.FC<PocketStatCardProps> = ({ 
    pocket, amount, sourceCardName, progressPercent, onClick, onWithdraw, onDeposit, headerActions 
}) => {
    const gradientByType: Record<string, string> = {
        [PocketType.SAVING]: 'from-emerald-500 to-teal-500',
        [PocketType.EXPENSE]: 'from-rose-500 to-pink-500',
    };
    const gradient = gradientByType[pocket.type] || 'from-blue-500 to-cyan-500';
    const progress = Math.max(0, Math.min(progressPercent, 100));

    return (
        <div className="group relative w-full cursor-pointer" onClick={onClick}>
            <div className={
                `relative w-full h-full p-5 rounded-3xl shadow-xl border border-white/10 bg-gradient-to-br ${gradient} overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.01]`
            }>
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-black/10 blur-2xl"></div>

                <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-bold text-lg text-white truncate">{pocket.name}</p>
                        {pocket.description && <p className="text-xs text-white/80 mt-0.5 line-clamp-2">{pocket.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {headerActions}
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
                            {pocketIcons[pocket.icon]}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-4">
                    <p className="text-3xl font-black tracking-tight text-white">{formatCurrency(amount)}</p>
                    {pocket.goalAmount ? (
                        <div className="mt-3">
                            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                <div className="bg-white h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-[11px] text-white/80 mt-1 text-right">Target: {formatCurrency(pocket.goalAmount)}</p>
                        </div>
                    ) : null}
                    {sourceCardName ? <p className="text-[11px] text-white/85 mt-2">Disimpan di: {sourceCardName}</p> : null}
                </div>

                <div className="relative z-10 flex gap-2 mt-4 pt-4 border-t border-white/15 non-printable">
                    <button
                        onClick={(e) => { e.stopPropagation(); onWithdraw(); }}
                        className="flex-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold py-2.5 transition-colors"
                    >
                        Tarik Dana
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeposit(); }}
                        className="flex-1 rounded-xl bg-white text-slate-900 hover:bg-white/90 text-sm font-semibold py-2.5 transition-colors"
                    >
                        Setor Dana
                    </button>
                </div>
            </div>
        </div>
    );
};
