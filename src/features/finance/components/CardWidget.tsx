import React from 'react';
import { Card, FinancialPocket } from '../../../types';
import { PencilIcon, Trash2Icon } from '../../../constants';
import { formatCurrency } from '../../../utils/currency';

interface CardWidgetProps {
    card: Card;
    onEdit: () => void;
    onDelete: () => void;
    onClick: () => void;
    connectedPockets: FinancialPocket[];
}

export const CardWidget: React.FC<CardWidgetProps> = ({ card, onEdit, onDelete, onClick, connectedPockets }) => {
    const gradient = card.colorGradient || 'from-slate-200 to-slate-400';
    const isLight = gradient.includes('slate-100');
    const textColor = isLight ? 'text-gray-800' : 'text-white';

    const ChipIcon = () => (
        <svg className="w-10 h-8" viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="28" rx="4" fill="#D1D5DB" />
            <rect x="4" y="4" width="32" height="20" rx="2" fill="#FBBF24" />
            <path d="M4 14H18" stroke="#92400E" strokeWidth="2" />
            <path d="M22 14H36" stroke="#92400E" strokeWidth="2" />
            <path d="M20 4V12" stroke="#92400E" strokeWidth="2" />
            <path d="M20 16V24" stroke="#92400E" strokeWidth="2" />
        </svg>
    );
    
    const VisaLogo = () => <svg height="24px" viewBox="0 0 1000 310" className={`${isLight ? 'fill-black/70' : 'fill-white/90'}`}><path d="M783 310h101l-123-310H643l-89 220-22-220H414L291 310h103l23-60h100l15 60zM520 125l31 82 31-82h-62zM389 125l-63 158-20-44-41-114h-100l170 310h124L741 0H638l-49 125z" /></svg>;
    
    const MastercardLogo = () => (
        <svg className="w-12 h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="16" r="10" fill="#EB001B" opacity="0.9" />
            <circle cx="30" cy="16" r="10" fill="#F79E1B" opacity="0.9" />
        </svg>
    );

    return (
        <div
            className="group relative w-full cursor-pointer"
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
            onClick={onClick}
        >
            <div className={`
                relative w-full h-full px-5 py-6 rounded-3xl ${textColor} shadow-xl flex flex-col justify-between 
                bg-gradient-to-br ${gradient} 
                transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02]
                overflow-hidden
                min-h-[200px]
            `}>
                {/* Decorative circles */}
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute -right-4 top-12 w-24 h-24 rounded-full bg-white/5"></div>
                <div className="absolute right-8 top-20 w-16 h-16 rounded-full bg-white/10"></div>

                {/* Card Top */}
                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div>
                        <p className="font-bold text-base mb-0.5">{card.bankName}</p>
                        <p className="text-xs opacity-70">{card.cardType}</p>
                    </div>
                    {card.bankName.toUpperCase() === 'VISA' ? <VisaLogo /> :
                        card.bankName.toLowerCase().includes('master') ? <MastercardLogo /> :
                            <ChipIcon />}
                </div>

                {/* Card Middle - Card Number */}
                <div className="relative z-10 mb-4">
                    <p className="text-xl font-mono tracking-[0.15em] mb-3">
                        {card.lastFourDigits.padStart(4, '0')} •••• •••• {card.lastFourDigits.padStart(4, '0')}
                    </p>
                    <p className="text-3xl font-bold tracking-tight">{formatCurrency(card.balance)}</p>
                </div>

                {/* Card Bottom */}
                <div className="relative z-10 flex justify-between items-end text-sm">
                    <div>
                        <p className="text-xs opacity-60 mb-1">Card Holder</p>
                        <p className="font-semibold text-sm">{card.cardHolderName}</p>
                    </div>
                    {card.expiryDate && (
                        <div className="text-right">
                            <p className="text-xs opacity-60 mb-1">Expiry</p>
                            <p className="font-semibold text-sm">{card.expiryDate}</p>
                        </div>
                    )}
                </div>

                {/* Actions on hover */}
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 non-printable z-20">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-sm"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-sm"><Trash2Icon className="w-4 h-4" /></button>
                </div>
            </div>

            {connectedPockets.length > 0 && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] bg-brand-input p-2 rounded-lg text-xs shadow-md opacity-0 group-hover:opacity-100 group-hover:-bottom-5 transition-all duration-300">
                    <p className="font-semibold text-brand-text-secondary text-center">Terhubung ke: {connectedPockets.map(p => p.name).join(', ')}</p>
                </div>
            )}
        </div>
    );
};
