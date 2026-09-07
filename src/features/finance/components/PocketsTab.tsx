import React from 'react';
import { Card, FinancialPocket } from '../../../types';
import { PocketStatCard } from './PocketStatCard';
import StatCard from '../../../shared/ui/StatCard';
import { formatCurrency } from '../../../utils/currency';
import { ClipboardListIcon, PlusIcon, PencilIcon, Trash2Icon } from '../../../constants';

interface PocketsTabProps {
    pockets: FinancialPocket[];
    cards: Card[];
    summary: { pocketsTotal: number };
    onOpenModal: (type: 'pocket' | 'transfer', mode: 'add' | 'edit', data?: any) => void;
    onDeletePocket: (id: string) => void;
    onViewHistory: (pocket: FinancialPocket) => void;
}

const PocketsTab: React.FC<PocketsTabProps> = ({
    pockets,
    cards,
    summary,
    onOpenModal,
    onDeletePocket,
    onViewHistory
}) => {
    return (
        <div className="widget-animate">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                    icon={<ClipboardListIcon className="w-6 h-6" />}
                    title="Total Dana di Kantong"
                    value={formatCurrency(summary.pocketsTotal)}
                    subtitle="Total dana yang dialokasikan."
                    colorVariant="blue"
                />
            </div>
            {/* Mobile card list */}
            <div className="md:hidden space-y-3">
                {pockets.map(p => {
                    const sourceCard = p.sourceCardId ? cards.find(c => c.id === p.sourceCardId) : null;
                    const amount = p.amount;
                    const progress = p.goalAmount ? Math.min((amount / (p.goalAmount || 1)) * 100, 100) : 0;
                    return (
                        <div key={p.id}>
                            <PocketStatCard
                                pocket={p}
                                amount={amount}
                                sourceCardName={sourceCard?.bankName || null}
                                progressPercent={progress}
                                onClick={() => onViewHistory(p)}
                                onWithdraw={() => onOpenModal('transfer', 'add', { ...p, transferType: 'withdraw' })}
                                onDeposit={() => onOpenModal('transfer', 'add', { ...p, transferType: 'deposit' })}
                            />
                        </div>
                    );
                })}
                <button
                    onClick={() => onOpenModal('pocket', 'add')}
                    className="w-full border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center text-brand-text-secondary hover:bg-brand-input hover:border-brand-accent hover:text-brand-accent transition-colors min-h-[140px]"
                >
                    <PlusIcon className="w-8 h-8" />
                    <span className="mt-2 font-semibold">Buat Kantong Baru</span>
                </button>
            </div>
            {/* Desktop grid */}
            <div className="hidden md:grid grid-cols-2 gap-6">
                {pockets.map(p => {
                    const sourceCard = p.sourceCardId ? cards.find(c => c.id === p.sourceCardId) : null;
                    const amount = p.amount;
                    return (
                        <div key={p.id}>
                            <PocketStatCard
                                pocket={p}
                                amount={amount}
                                sourceCardName={sourceCard?.bankName || null}
                                progressPercent={p.goalAmount ? Math.min((amount / (p.goalAmount || 1)) * 100, 100) : 0}
                                onClick={() => onViewHistory(p)}
                                onWithdraw={() => onOpenModal('transfer', 'add', { ...p, transferType: 'withdraw' })}
                                onDeposit={() => onOpenModal('transfer', 'add', { ...p, transferType: 'deposit' })}
                                headerActions={(
                                    <div className="flex gap-1 non-printable">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenModal('pocket', 'edit', p); }}
                                            className="bg-white/15 hover:bg-white/25 text-white rounded-full p-2 backdrop-blur-sm"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeletePocket(p.id); }}
                                            className="bg-white/15 hover:bg-white/25 text-white rounded-full p-2 backdrop-blur-sm"
                                        >
                                            <Trash2Icon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            />
                        </div>
                    );
                })}
                <button
                    onClick={() => onOpenModal('pocket', 'add')}
                    className="border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center text-brand-text-secondary hover:bg-brand-input hover:border-brand-accent hover:text-brand-accent transition-colors min-h-[250px]"
                >
                    <PlusIcon className="w-8 h-8" />
                    <span className="mt-2 font-semibold">Buat Kantong Baru</span>
                </button>
            </div>
        </div>
    );
};

export default PocketsTab;
