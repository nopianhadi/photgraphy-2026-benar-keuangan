import React, { useState, useEffect, useCallback } from "react";
import { User, ViewType } from "../types";
import { listUsers as listUsersFromDb } from "../services/users";
import { LAST_ROUTE_STORAGE_KEY } from "../routes/routesConfig";

export const DEFAULT_DEMO_USERS: User[] = [
  {
    id: "demo-admin-id",
    email: "admin@atter.com",
    password: "hashedpassword",
    fullName: "Admin Attera",
    companyName: "Attera Visual",
    role: "Admin",
    permissions: Object.values(ViewType),
  },
  {
    id: "demo-kasir-id",
    email: "kasir@atter.com",
    password: "hashedpassword",
    fullName: "Kasir Attera",
    companyName: "Attera Visual",
    role: "Kasir",
    permissions: [ViewType.DASHBOARD, ViewType.FINANCE, ViewType.BOOKING],
  },
  {
    id: "demo-member-id",
    email: "member@atter.com",
    password: "hashedpassword",
    fullName: "Member Attera",
    companyName: "Attera Visual",
    role: "Member",
    permissions: [ViewType.DASHBOARD, ViewType.PROJECTS],
  },
];

export interface UseAuthReturn {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  handleLoginSuccess: (user: User) => void;
  handleLogout: () => void;
  hasPermission: (view: ViewType) => boolean;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const storedValue = window.localStorage.getItem("vena-isAuthenticated");
      return storedValue ? JSON.parse(storedValue) : false;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedValue = window.localStorage.getItem("vena-currentUser");
      return storedValue ? JSON.parse(storedValue) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(DEFAULT_DEMO_USERS);

  useEffect(() => {
    window.localStorage.setItem(
      "vena-isAuthenticated",
      JSON.stringify(isAuthenticated),
    );
  }, [isAuthenticated]);

  useEffect(() => {
    window.localStorage.setItem(
      "vena-currentUser",
      JSON.stringify(currentUser),
    );
  }, [currentUser]);

  // Load users from Supabase on init
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const remote = await listUsersFromDb();
        if (!isMounted) return;
        if (Array.isArray(remote) && remote.length > 0) {
          setUsers(remote);
        }
      } catch (e) {
        console.warn("[Supabase] Failed to fetch users.", e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = useCallback((user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    try {
      const last = window.localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
      if (
        last &&
        typeof last === "string" &&
        last.startsWith("#/") &&
        !last.startsWith("#/home") &&
        !last.startsWith("#/login")
      ) {
        window.location.hash = last;
        return;
      }
    } catch (e) {
      console.warn("[Routing] Failed to read last route after login:", e);
    }

    window.location.hash = "#/dashboard";
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      window.localStorage.removeItem(LAST_ROUTE_STORAGE_KEY);
    } catch {}
    window.location.hash = "#/home";
  }, []);

  const hasPermission = useCallback(
    (view: ViewType) => {
      if (!currentUser) return false;
      if (currentUser.role === "Admin") return true;
      return currentUser.permissions?.includes(view) || false;
    },
    [currentUser],
  );

  return {
    isAuthenticated,
    setIsAuthenticated,
    currentUser,
    setCurrentUser,
    users,
    setUsers,
    handleLoginSuccess,
    handleLogout,
    hasPermission,
  };
}

export default useAuth;
