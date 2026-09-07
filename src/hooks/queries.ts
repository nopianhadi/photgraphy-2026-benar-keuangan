import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listClients } from '../services/clients';
import { listProjectsWithRelations } from '../services/projects';
import { listTransactions } from '../services/transactions';
import { listTeamMembers } from '../services/teamMembers';
import { listLeads } from '../services/leads';
import { listCards } from '../services/cards';
import { listPockets } from '../services/pockets';
import { listPackages } from '../services/packages';
import { listAddOns } from '../services/addOns';

// Limit default fetches to 100 as in the original useAppData
const DEFAULT_LIMIT = 100;

export const useClientsQuery = () => useQuery({
    queryKey: ['clients'],
    queryFn: () => listClients({ limit: DEFAULT_LIMIT }),
    staleTime: 5 * 60 * 1000, // 5 minutes
});

export const useProjectsQuery = () => useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjectsWithRelations({ limit: DEFAULT_LIMIT }),
    staleTime: 5 * 60 * 1000,
});

export const useTransactionsQuery = () => useQuery({
    queryKey: ['transactions'],
    queryFn: () => listTransactions({ limit: DEFAULT_LIMIT }),
    staleTime: 5 * 60 * 1000,
});

export const useTeamMembersQuery = () => useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => listTeamMembers({ limit: DEFAULT_LIMIT }),
    staleTime: 5 * 60 * 1000,
});

export const useLeadsQuery = () => useQuery({
    queryKey: ['leads'],
    queryFn: () => listLeads({ limit: DEFAULT_LIMIT }),
    staleTime: 5 * 60 * 1000,
});

export const useCardsQuery = () => useQuery({
    queryKey: ['cards'],
    queryFn: () => listCards().then(res => res.map((row: any) => ({
        id: row.id,
        cardHolderName: row.card_holder_name,
        bankName: row.bank_name,
        cardType: row.card_type,
        lastFourDigits: row.last_four_digits ?? "",
        expiryDate: row.expiry_date ?? undefined,
        balance: Number(row.balance || 0),
        colorGradient: row.color_gradient || "from-slate-200 to-slate-400",
    }))),
    staleTime: 5 * 60 * 1000,
});

export const usePocketsQuery = () => useQuery({
    queryKey: ['pockets'],
    queryFn: () => listPockets(),
    staleTime: 5 * 60 * 1000,
});

export const usePackagesQuery = () => useQuery({
    queryKey: ['packages'],
    queryFn: () => listPackages(),
    staleTime: 5 * 60 * 1000,
});

export const useAddOnsQuery = () => useQuery({
    queryKey: ['addOns'],
    queryFn: () => listAddOns(),
    staleTime: 5 * 60 * 1000,
});
