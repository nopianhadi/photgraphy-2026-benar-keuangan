import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TeamProjectPayment,
  TeamPaymentRecord,
  Profile,
  Notification,
  PromoCode,
  Contract,
  ClientFeedback,
} from "../types";
import { listContracts } from "../services/contracts";
import { listPromoCodes } from "../services/promoCodes";
import { getProfile as getProfileFromDb } from "../services/profile";
import { listAllTeamPayments } from "../services/teamProjectPayments";
import {
  listTeamPaymentRecords as listTeamPaymentRecordsFromDb,
  createTeamPaymentRecord,
} from "../services/teamPaymentRecords";
import { createNotification as createNotificationRow } from "../services/notifications";

export interface UseAuxiliaryDataProps {
  appDataClientFeedback?: ClientFeedback[];
  appDataLoadedClientFeedback?: boolean;
  setClientFeedback?: React.Dispatch<React.SetStateAction<ClientFeedback[]>>;
}

export interface UseAuxiliaryDataReturn {
  teamProjectPayments: TeamProjectPayment[];
  setTeamProjectPayments: React.Dispatch<React.SetStateAction<TeamProjectPayment[]>>;
  teamPaymentsLoaded: boolean;
  setTeamPaymentsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  teamPaymentRecords: TeamPaymentRecord[];
  setTeamPaymentRecords: React.Dispatch<React.SetStateAction<TeamPaymentRecord[]>>;
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  handleSetProfile: (value: React.SetStateAction<Profile>) => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  promoCodes: PromoCode[];
  setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
  contracts: Contract[];
  setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
  notification: string;
  showNotification: (message: string, duration?: number) => void;
  addNotification: (
    newNotificationData: Omit<Notification, "id" | "timestamp" | "isRead">,
  ) => Promise<void>;
  handleMarkAsRead: (notificationId: string) => void;
  handleMarkAllAsRead: () => void;
}

export function useAuxiliaryData({
  appDataClientFeedback,
  appDataLoadedClientFeedback,
  setClientFeedback,
}: UseAuxiliaryDataProps = {}): UseAuxiliaryDataReturn {
  const [teamProjectPayments, setTeamProjectPayments] = useState<TeamProjectPayment[]>([]);
  const [teamPaymentsLoaded, setTeamPaymentsLoaded] = useState(false);
  const [teamPaymentRecords, setTeamPaymentRecords] = useState<TeamPaymentRecord[]>([]);
  const [profile, setProfile] = useState<Profile>({
    projectTypes: [],
    projectStatusConfig: [],
    eventTypes: [],
  } as unknown as Profile);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [notification, setNotification] = useState<string>("");

  const showNotification = useCallback((message: string, duration: number = 3000) => {
    setNotification(message);
    setTimeout(() => {
      setNotification("");
    }, duration);
  }, []);

  const handleSetProfile = useCallback((value: React.SetStateAction<Profile>) => {
    setProfile(value);
  }, []);

  // Load contracts from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    listContracts()
      .then((data) => {
        if (isMounted) setContracts(data);
      })
      .catch((err) => console.warn("[Contracts] Failed to load:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Load promo codes from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    listPromoCodes()
      .then((data) => {
        if (isMounted) setPromoCodes(data);
      })
      .catch((err) => console.warn("[PromoCodes] Failed to load:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Centralized notification creation handler
  const addNotification = useCallback(
    async (newNotificationData: Omit<Notification, "id" | "timestamp" | "isRead">) => {
      const payload: Omit<Notification, "id"> = {
        ...newNotificationData,
        timestamp: new Date().toISOString(),
        isRead: false,
      } as any;
      try {
        const created = await createNotificationRow(payload);
        setNotifications((prev) => [created, ...prev]);
      } catch (e) {
        console.warn("[Notifications] Failed to create notification in Supabase:", e);
        const fallback: Notification = {
          id: crypto.randomUUID(),
          ...payload,
        } as Notification;
        setNotifications((prev) => [fallback, ...prev]);
      }
    },
    [],
  );

  // One-time migration: clients from localStorage to Supabase
  useEffect(() => {
    const KEY = "vena-clients";
    const FLAG = "vena-clients-migrated";
    if ((window as any)[FLAG] || window.localStorage.getItem(FLAG) === "yes") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const parsedData = JSON.parse(raw);
      if (!Array.isArray(parsedData) || parsedData.length === 0) return;
      (async () => {
        try {
          const mod = await import("../services/clients");
          for (const c of parsedData) {
            try {
              await mod.createClient({
                id: c.id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                whatsapp: c.whatsapp ?? undefined,
                since: c.since,
                instagram: c.instagram ?? undefined,
                status: c.status,
                clientType: c.clientType,
                lastContact: c.lastContact,
                portalAccessId: c.portalAccessId,
              } as any);
            } catch (e) {
              console.warn("[Migration] Failed to migrate client:", c.id, e);
            }
          }
          window.localStorage.setItem(FLAG, "yes");
          console.info("[Migration] clients migrated to Supabase.");
        } catch (err) {
          console.warn("[Migration] clients migration failed.", err);
        }
      })();
    } catch (error) {
      console.warn("[Migration] Failed to parse localStorage data:", error);
    }
  }, []);

  // Sync client feedback from lazy loading hook
  const prevClientFeedbackRef = useRef<string>("");
  useEffect(() => {
    if (appDataLoadedClientFeedback && appDataClientFeedback && setClientFeedback) {
      const serialized = JSON.stringify(appDataClientFeedback);
      if (serialized !== prevClientFeedbackRef.current) {
        prevClientFeedbackRef.current = serialized;
        setClientFeedback(appDataClientFeedback);
      }
    }
  }, [appDataClientFeedback, appDataLoadedClientFeedback, setClientFeedback]);

  // One-time migration: teamPaymentRecords from localStorage to Supabase
  useEffect(() => {
    const KEY = "vena-teamPaymentRecords";
    const FLAG = "vena-teamPaymentRecords-migrated";
    if ((window as any)[FLAG] || window.localStorage.getItem(FLAG) === "yes") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const parsedData = JSON.parse(raw);
      if (!Array.isArray(parsedData) || parsedData.length === 0) return;
      (async () => {
        try {
          for (const rec of parsedData) {
            try {
              await createTeamPaymentRecord({
                recordNumber: rec.recordNumber,
                teamMemberId: rec.teamMemberId,
                date: rec.date,
                projectPaymentIds: rec.projectPaymentIds || [],
                totalAmount: rec.totalAmount || 0,
                vendorSignature: rec.vendorSignature || null,
              } as any);
            } catch {}
          }
          window.localStorage.setItem(FLAG, "yes");
          window.localStorage.removeItem(KEY);
          console.info("[Migration] teamPaymentRecords migrated to Supabase.");
        } catch (err) {
          console.warn("[Migration] teamPaymentRecords migration failed.", err);
        }
      })();
    } catch {}
  }, []);

  // Load team payment records from Supabase on init and clear legacy localStorage
  useEffect(() => {
    try {
      window.localStorage.removeItem("vena-teamPaymentRecords");
    } catch {}
    let isMounted = true;
    (async () => {
      try {
        const remote = await listTeamPaymentRecordsFromDb();
        if (!isMounted) return;
        setTeamPaymentRecords(Array.isArray(remote) ? remote : []);
      } catch (e) {
        console.warn("[Supabase] Failed to fetch team payment records.", e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load profile from Supabase on init and clear legacy localStorage
  useEffect(() => {
    try {
      window.localStorage.removeItem("vena-profile");
    } catch {}
    let isMounted = true;
    (async () => {
      try {
        const remote = await getProfileFromDb();
        if (!isMounted) return;
        if (remote) setProfile(remote);
      } catch (e) {
        console.warn("[Supabase] Failed to fetch profile, using defaults.", e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure teamProjectPayments sourced only from Supabase
  useEffect(() => {
    try {
      window.localStorage.removeItem("vena-teamProjectPayments");
    } catch {}
    let isMounted = true;
    (async () => {
      try {
        const remote = await listAllTeamPayments();
        if (!isMounted) return;
        setTeamProjectPayments(Array.isArray(remote) ? remote : []);
      } catch (e) {
        console.warn("[Supabase] Failed to fetch team project payments.", e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure projects are sourced only from Supabase (clear legacy localStorage key)
  useEffect(() => {
    try {
      window.localStorage.removeItem("vena-projects");
    } catch {}
  }, []);

  const handleMarkAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
    );
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  return {
    teamProjectPayments,
    setTeamProjectPayments,
    teamPaymentsLoaded,
    setTeamPaymentsLoaded,
    teamPaymentRecords,
    setTeamPaymentRecords,
    profile,
    setProfile,
    handleSetProfile,
    notifications,
    setNotifications,
    promoCodes,
    setPromoCodes,
    contracts,
    setContracts,
    notification,
    showNotification,
    addNotification,
    handleMarkAsRead,
    handleMarkAllAsRead,
  };
}

export default useAuxiliaryData;
