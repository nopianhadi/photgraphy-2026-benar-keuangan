import React from 'react';
import { Card, CardType, FinancialPocket } from '../../../types';
import { CardWidget } from './CardWidget';
import { CashWidget } from './CashWidget';
import StatCard from '../../../shared/ui/StatCard';
import { formatCurrency } from '../../../utils/currency';
import { CreditCardIcon, PlusIcon, DollarSignIcon, TrendingUpIcon, CashIcon } from '../../../constants';

interface CardStats {
    creditDebt: number;
    debitAndCashAssets: number;
    mostUsedCardName: string;
    mostUsedCardTxCount: number;
    cashBalance: number;
}

interface CardsTabProps {
    cards: Card[];
    pockets: FinancialPocket[];
    cardStats: CardStats;
    onOpenModal: (type: 'card' | 'topup-cash', mode: 'add' | 'edit', data?: any) => void;
    onDeleteCard: (id: string) => void;
    onViewHistory: (card: Card) => void;
}

const CardsTab: React.FC<CardsTabProps> = ({
    cards,
    pockets,
    cardStats,
    onOpenModal,
    onDeleteCard,
    onViewHistory
}) => {
    return (
        <div className="widget-animate space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gradient flex items-center gap-2">
                    <CreditCardIcon className="w-6 h-6" /> Kartu Saya
                </h3>
                <button
                    onClick={() => onOpenModal('card', 'add')}
                    className="btn-box-add inline-flex items-center gap-1.5 text-xs px-3 py-2 font-semibold"
                >
                    <PlusIcon className="w-4 h-4 flex-shrink-0" /> Tambah Kartu
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    icon={<CreditCardIcon className="w-6 h-6" />}
                    title="Total Utang Kartu Kredit"
                    value={formatCurrency(Math.abs(cardStats.creditDebt))}
                    subtitle="Saldo negatif kartu kredit"
                    colorVariant="pink"
                />
                <StatCard
                    icon={<DollarSignIcon className="w-6 h-6" />}
                    title="Total Aset (Debit & Tunai)"
                    value={formatCurrency(cardStats.debitAndCashAssets)}
                    subtitle="Saldo kartu debit & kas"
                    colorVariant="green"
                />
                <StatCard
                    icon={<TrendingUpIcon className="w-6 h-6" />}
                    title="Kartu Paling Sering Digunakan"
                    value={cardStats.mostUsedCardName}
                    subtitle={`${cardStats.mostUsedCardTxCount} transaksi`}
                    colorVariant="blue"
                />
                <StatCard
                    icon={<CashIcon className="w-6 h-6" />}
                    title="Total Saldo Tunai"
                    value={formatCurrency(cardStats.cashBalance)}
                    subtitle="Uang kas yang tersedia"
                    colorVariant="orange"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
                {cards.map(card => {
                    const connectedPockets = pockets.filter(p => p.sourceCardId === card.id);
                    return (
                        <div key={card.id}>
                            {card.cardType === CardType.TUNAI ? (
                                <CashWidget
                                    card={card}
                                    onClick={() => onViewHistory(card)}
                                    onTopUp={() => onOpenModal('topup-cash', 'add')}
                                    onEdit={() => onOpenModal('card', 'edit', card)}
                                    connectedPockets={connectedPockets}
                                />
                            ) : (
                                <CardWidget
                                    card={card}
                                    onEdit={() => onOpenModal('card', 'edit', card)}
                                    onDelete={() => onDeleteCard(card.id)}
                                    onClick={() => onViewHistory(card)}
                                    connectedPockets={connectedPockets}
                                />
                            )}
                        </div>
                    );
                })}
                <button
                    onClick={() => onOpenModal('card', 'add')}
                    className="group aspect-[1.586] border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center text-brand-text-secondary hover:bg-brand-input hover:border-brand-accent hover:text-brand-accent transition-all duration-300"
                >
                    <div className="w-16 h-16 rounded-full bg-brand-bg group-hover:bg-brand-accent/10 flex items-center justify-center transition-colors">
                        <PlusIcon className="w-8 h-8 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="mt-4 font-semibold">Tambah Kartu / Akun</span>
                </button>
            </div>
        </div>
    );
};

export default CardsTab;
