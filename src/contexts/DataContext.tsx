import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAppData } from '../hooks/useAppData';
import { Client, Project, TeamMember, Transaction, Lead, ClientFeedback, Card, FinancialPocket, Package, AddOn } from '../types';
import { listCards } from '../services/cards';
import { listPockets } from '../services/pockets';
import { listPackages } from '../services/packages';
import { listAddOns } from '../services/addOns';
import {
    useClientsQuery,
    useProjectsQuery,
    useTeamMembersQuery,
    useTransactionsQuery,
    useLeadsQuery,
    useCardsQuery,
    usePocketsQuery,
    usePackagesQuery,
    useAddOnsQuery
} from '../hooks/queries';

interface DataContextType {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    teamMembers: TeamMember[];
    setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    leads: Lead[];
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    pockets: FinancialPocket[];
    setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
    packages: Package[];
    setPackages: React.Dispatch<React.SetStateAction<Package[]>>;
    addOns: AddOn[];
    setAddOns: React.Dispatch<React.SetStateAction<AddOn[]>>;
    clientFeedback: ClientFeedback[];
    setClientFeedback: React.Dispatch<React.SetStateAction<ClientFeedback[]>>;
    totals: any;
    loadAllData: () => void;
    appData: ReturnType<typeof useAppData>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const appData = useAppData();

    // Use React Query hooks (do NOT default to = [] in destructuring to prevent new array allocations every render)
    const { data: qClients } = useClientsQuery();
    const { data: qProjects } = useProjectsQuery();
    const { data: qTeamMembers } = useTeamMembersQuery();
    const { data: qTransactions } = useTransactionsQuery();
    const { data: qLeads } = useLeadsQuery();
    const { data: qCards } = useCardsQuery();
    const { data: qPockets } = usePocketsQuery();
    const { data: qPackages } = usePackagesQuery();
    const { data: qAddOns } = useAddOnsQuery();

    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [pockets, setPockets] = useState<FinancialPocket[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [addOns, setAddOns] = useState<AddOn[]>([]);
    const [clientFeedback, setClientFeedback] = useState<ClientFeedback[]>([]);

    // Fast reference tracking to avoid expensive JSON.stringify on large datasets
    const prevClientsRef = useRef<Client[] | null>(null);
    const prevProjectsRef = useRef<Project[] | null>(null);
    const prevTeamMembersRef = useRef<TeamMember[] | null>(null);
    const prevTransactionsRef = useRef<Transaction[] | null>(null);
    const prevLeadsRef = useRef<Lead[] | null>(null);
    const prevCardsRef = useRef<Card[] | null>(null);
    const prevPocketsRef = useRef<FinancialPocket[] | null>(null);
    const prevPackagesRef = useRef<Package[] | null>(null);
    const prevAddOnsRef = useRef<AddOn[] | null>(null);

    const loadAllData = useCallback(() => {
        appData.loadTotals();
        appData.loadClientFeedback();
    }, [appData.loadTotals, appData.loadClientFeedback]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // Instant zero-copy sync from React Query to local state.
    // React Query uses structural sharing, so references are stable unless data changed.
    useEffect(() => {
        if (qClients && qClients !== prevClientsRef.current) {
            prevClientsRef.current = qClients;
            setClients(qClients);
        }
    }, [qClients]);

    useEffect(() => {
        if (qProjects && qProjects !== prevProjectsRef.current) {
            prevProjectsRef.current = qProjects as any;
            setProjects(qProjects as any);
        }
    }, [qProjects]);

    useEffect(() => {
        if (qTeamMembers && qTeamMembers !== prevTeamMembersRef.current) {
            prevTeamMembersRef.current = qTeamMembers;
            setTeamMembers(qTeamMembers);
        }
    }, [qTeamMembers]);

    useEffect(() => {
        if (qTransactions && qTransactions !== prevTransactionsRef.current) {
            prevTransactionsRef.current = qTransactions;
            setTransactions(qTransactions);
        }
    }, [qTransactions]);

    useEffect(() => {
        if (qLeads && qLeads !== prevLeadsRef.current) {
            prevLeadsRef.current = qLeads;
            setLeads(qLeads);
        }
    }, [qLeads]);

    useEffect(() => {
        if (qCards && qCards !== prevCardsRef.current) {
            prevCardsRef.current = qCards;
            setCards(qCards);
        }
    }, [qCards]);

    useEffect(() => {
        if (qPockets && qPockets !== prevPocketsRef.current) {
            prevPocketsRef.current = qPockets;
            setPockets(qPockets);
        }
    }, [qPockets]);

    useEffect(() => {
        if (qPackages && qPackages !== prevPackagesRef.current) {
            prevPackagesRef.current = qPackages;
            setPackages(qPackages);
        }
    }, [qPackages]);

    useEffect(() => {
        if (qAddOns && qAddOns !== prevAddOnsRef.current) {
            prevAddOnsRef.current = qAddOns;
            setAddOns(qAddOns);
        }
    }, [qAddOns]);

    // Helper for cards
    const mapCardRowToCard = (row: any): Card => ({
        id: row.id,
        cardHolderName: row.card_holder_name,
        bankName: row.bank_name,
        cardType: row.card_type,
        lastFourDigits: row.last_four_digits ?? "",
        expiryDate: row.expiry_date ?? undefined,
        balance: Number(row.balance || 0),
        colorGradient: row.color_gradient || "from-slate-200 to-slate-400",
    });

    // Realtime Subscriptions
    useEffect(() => {
        const setupRealtime = () => {
            const channel = supabase.channel('global-realtime-channel')
                // TRANSACTIONS
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setTransactions(prev => {
                            const exists = prev.some(t => t.id === payload.new.id);
                            return exists ? prev : [payload.new as Transaction, ...prev];
                        });
                    }
                    if (payload.eventType === 'UPDATE') {
                        setTransactions(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } as Transaction : t));
                    }
                    if (payload.eventType === 'DELETE') {
                        setTransactions(prev => prev.filter(t => t.id !== (payload.old as any).id));
                    }
                })
                // CLIENTS
                .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setClients(prev => prev.some(i => i.id === payload.new.id) ? prev : [payload.new as Client, ...prev]);
                    }
                    if (payload.eventType === 'UPDATE') {
                        setClients(prev => prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } as Client : i));
                    }
                    if (payload.eventType === 'DELETE') {
                        setClients(prev => prev.filter(i => i.id !== (payload.old as any).id));
                    }
                })
                // PROJECTS
                .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setProjects(prev => prev.some(i => i.id === payload.new.id) ? prev : [payload.new as Project, ...prev]);
                    }
                    if (payload.eventType === 'UPDATE') {
                        setProjects(prev => prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } as Project : i));
                    }
                    if (payload.eventType === 'DELETE') {
                        setProjects(prev => prev.filter(i => i.id !== (payload.old as any).id));
                    }
                })
                // CARDS
                .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newCard = mapCardRowToCard(payload.new);
                        setCards(prev => {
                            const exists = prev.some(c => c.id === newCard.id);
                            return exists ? prev.map(c => c.id === newCard.id ? newCard : c) : [newCard, ...prev];
                        });
                    }
                    if (payload.eventType === 'DELETE') {
                        setCards(prev => prev.filter(c => c.id !== (payload.old as any).id));
                    }
                })
                // POCKETS
                .on('postgres_changes', { event: '*', schema: 'public', table: 'pockets' }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setPockets(prev => prev.some(i => i.id === payload.new.id) ? prev : [payload.new as any, ...prev]);
                    }
                    if (payload.eventType === 'UPDATE') {
                        setPockets(prev => prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } as any : i));
                    }
                    if (payload.eventType === 'DELETE') {
                        setPockets(prev => prev.filter(i => i.id !== (payload.old as any).id));
                    }
                })
                // LEADS
                .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setLeads(prev => prev.some(i => i.id === payload.new.id) ? prev : [payload.new as Lead, ...prev]);
                    }
                    if (payload.eventType === 'UPDATE') {
                        setLeads(prev => prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } as Lead : i));
                    }
                    if (payload.eventType === 'DELETE') {
                        setLeads(prev => prev.filter(i => i.id !== (payload.old as any).id));
                    }
                })
                .subscribe();

            return channel;
        };

        const channel = setupRealtime();
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <DataContext.Provider value={{
            clients, setClients,
            projects, setProjects,
            teamMembers, setTeamMembers,
            transactions, setTransactions,
            leads, setLeads,
            cards, setCards,
            pockets, setPockets,
            packages, setPackages,
            addOns, setAddOns,
            clientFeedback, setClientFeedback,
            totals: appData.totals,
            loadAllData,
            appData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
