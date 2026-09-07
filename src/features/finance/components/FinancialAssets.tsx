import React from 'react';
import { Card, CardType, FinancialPocket, PocketType } from '../../../types';
import { PencilIcon, Trash2Icon, ArrowUpIcon, PiggyBankIcon, LockIcon, UsersIcon, ClipboardListIcon, StarIcon } from '../../../constants';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const pocketIcons: Record<string, React.ReactNode> = {
    'piggy-bank': <PiggyBankIcon className="w-6 h-6" />,
    'lock': <LockIcon className="w-6 h-6" />,
    'users': <UsersIcon className="w-6 h-6" />,
    'clipboard-list': <ClipboardListIcon className="w-6 h-6" />,
    'star': <StarIcon className="w-6 h-6" />
};

export const CardWidget: React.FC<{ card: Card, onEdit: () => void, onDelete: () => void, onClick: () => void, connectedPockets: FinancialPocket[] }> = ({ card, onEdit, onDelete, onClick, connectedPockets }) => {
    const gradient = card.colorGradient || 'from-slate-200 to-slate-400';
    const isLight = gradient.includes('slate-100');
    const textColor = isLight ? 'text-gray-800' : 'text-white';

    return (
        <div className="group relative w-full cursor-pointer" onClick={onClick}>
            <div className={`relative w-full h-48 px-6 py-6 rounded-3xl ${textColor} shadow-xl flex flex-col justify-between bg-gradient-to-br ${gradient} transition-all duration-300 hover:scale-[1.02] overflow-hidden`}>
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="font-bold text-lg mb-0.5">{card.bankName}</p>
                        <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold">{card.cardType}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"><PencilIcon className="w-4 h-4" /></button>
                        {card.cardType !== CardType.TUNAI && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"><Trash2Icon className="w-4 h-4" /></button>}
                    </div>
                </div>
                <div className="relative z-10">
                    <p className="text-xs opacity-60 mb-1">Available Balance</p>
                    <p className="text-2xl font-black tracking-tight">{formatCurrency(card.balance)}</p>
                </div>
                <div className="relative z-10 flex justify-between items-end">
                    <p className="font-mono text-sm tracking-wider">**** **** **** {card.lastFourDigits}</p>
                    <p className="font-bold text-xs uppercase">{card.cardHolderName}</p>
                </div>
            </div>
        </div>
    );
};

export const PocketStatCard: React.FC<{
    pocket: FinancialPocket;
    amount: number;
    onClick: () => void;
    onWithdraw: () => void;
    onDeposit: () => void;
}> = ({ pocket, amount, onClick, onWithdraw, onDeposit }) => {
    const gradient = pocket.type === PocketType.SAVING ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-pink-500';
    const progress = pocket.goalAmount ? Math.min((amount / pocket.goalAmount) * 100, 100) : 0;

    return (
        <div className="group relative w-full cursor-pointer" onClick={onClick}>
            <div className={`relative w-full p-5 rounded-3xl shadow-xl bg-gradient-to-br ${gradient} text-white overflow-hidden transition-all duration-300 hover:scale-[1.01]`}>
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        {pocketIcons[pocket.icon] || <PiggyBankIcon className="w-6 h-6" />}
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-base">{pocket.name}</p>
                        <p className="text-[10px] opacity-80 uppercase font-bold tracking-wider">{pocket.type}</p>
                    </div>
                </div>
                <div className="relative z-10 mb-4">
                    <p className="text-2xl font-black">{formatCurrency(amount)}</p>
                    {pocket.goalAmount && (
                        <div className="mt-2">
                            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-[10px] mt-1 text-right font-bold">Goal: {formatCurrency(pocket.goalAmount)}</p>
                        </div>
                    )}
                </div>
                <div className="relative z-10 grid grid-cols-2 gap-2 pt-4 border-t border-white/10">
                    <button onClick={(e) => { e.stopPropagation(); onWithdraw(); }} className="py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all">TARIK</button>
                    <button onClick={(e) => { e.stopPropagation(); onDeposit(); }} className="py-2 rounded-xl bg-white text-slate-900 hover:bg-white/90 text-xs font-bold transition-all">SETOR</button>
                </div>
            </div>
        </div>
    );
};
