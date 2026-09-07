import React from 'react';
import { 
    Transaction, 
    TransactionType, 
    Card, 
    CardType, 
    FinancialPocket, 
    PocketType, 
    Project 
} from '../../../types';
import { 
    PiggyBankIcon, 
    LockIcon, 
    UsersIcon, 
    ClipboardListIcon, 
    StarIcon 
} from '../../../constants';

export const emptyTransaction = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: TransactionType.EXPENSE,
    category: '',
    method: 'Kartu',
    cardId: '',
    sourceId: '', // 'card-ID' or 'pocket-ID'
};

export const emptyPocket: Omit<FinancialPocket, 'id' | 'amount'> = {
    name: '',
    description: '',
    type: PocketType.SAVING,
    icon: 'piggy-bank'
};

export const emptyCard: Omit<Card, 'id' | 'balance'> = {
    cardHolderName: 'Nama Pengguna',
    bankName: 'WBank',
    cardType: CardType.DEBIT,
    lastFourDigits: '',
    expiryDate: '',
    colorGradient: 'from-blue-600 to-cyan-500'
};

export const pocketIcons: { [key in FinancialPocket['icon']]: React.ReactNode } = {
    'piggy-bank': <PiggyBankIcon className="w-8 h-8" />,
    'lock': <LockIcon className="w-8 h-8" />,
    'users': <UsersIcon className="w-8 h-8" />,
    'clipboard-list': <ClipboardListIcon className="w-8 h-8" />,
    'star': <StarIcon className="w-8 h-8" />
};

export const getMonthDateRange = (date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
        from: startOfMonth.toISOString().split('T')[0],
        to: endOfMonth.toISOString().split('T')[0]
    };
};

export const getTransactionSubDescription = (
    transaction: Transaction,
    cards: Card[],
    pockets: FinancialPocket[],
    projects: Project[]
): string => {
    const isInternal = transaction.category === 'Transfer Internal' || transaction.category === 'Penutupan Anggaran' || transaction.method === 'Sistem';

    const project = transaction.projectId ? projects.find(p => p.id === transaction.projectId) : null;
    const projectText = project ? project.projectName : null;

    if (isInternal) {
        return projectText ? `Acara Pernikahan: ${projectText}` : '';
    }

    let sourceDestText = '';
    if (transaction.type === TransactionType.INCOME) {
        const card = cards.find(c => c.id === transaction.cardId);
        if (card) {
            sourceDestText = card.cardType === CardType.TUNAI
                ? 'Masuk ke Tunai'
                : `Masuk ke ${card.bankName} ${card.lastFourDigits !== 'CASH' ? `**** ${card.lastFourDigits}` : ''}`;
        }
    } else { // EXPENSE
        if (transaction.pocketId) {
            const pocket = pockets.find(p => p.id === transaction.pocketId);
            if (pocket) {
                sourceDestText = `Dibayar dari kantong "${pocket.name}"`;
            }
        } else if (transaction.cardId) {
            const card = cards.find(c => c.id === transaction.cardId);
            if (card) {
                sourceDestText = card.cardType === CardType.TUNAI
                    ? 'Dibayar dari Tunai'
                    : `Dibayar dari ${card.bankName} ${card.lastFourDigits !== 'CASH' ? `**** ${card.lastFourDigits}` : ''}`;
            }
        } else {
            sourceDestText = `Metode: ${transaction.method}`;
        }
    }

    if (sourceDestText && projectText) {
        return `${sourceDestText} • ${projectText}`;
    }

    return sourceDestText || projectText || '';
};
