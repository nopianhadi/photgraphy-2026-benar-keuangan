import { create } from 'zustand';
import { ViewType, User, NavigationAction } from '../types';

interface AppState {
    isAuthenticated: boolean;
    currentUser: User | null;
    activeView: ViewType;
    notification: string;
    initialAction: NavigationAction | null;
    isSidebarOpen: boolean;
    isSearchOpen: boolean;

    // Actions
    setIsAuthenticated: (auth: boolean) => void;
    setCurrentUser: (user: User | null) => void;
    setActiveView: (view: ViewType) => void;
    setNotification: (msg: string) => void;
    showNotification: (msg: string) => void;
    setInitialAction: (action: NavigationAction | null) => void;
    setIsSidebarOpen: (isOpen: boolean) => void;
    setIsSearchOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    isAuthenticated: (() => {
        try {
            const storedValue = window.localStorage.getItem("vena-isAuthenticated");
            return storedValue ? JSON.parse(storedValue) : false;
        } catch {
            return false;
        }
    })(),
    currentUser: (() => {
        try {
            const storedValue = window.localStorage.getItem("vena-currentUser");
            return storedValue ? JSON.parse(storedValue) : null;
        } catch {
            return null;
        }
    })(),
    activeView: ViewType.HOMEPAGE as ViewType, // Default, assuming HOMEPAGE is in ViewType
    notification: "",
    initialAction: null,
    isSidebarOpen: false,
    isSearchOpen: false,

    setIsAuthenticated: (auth) => {
        window.localStorage.setItem("vena-isAuthenticated", JSON.stringify(auth));
        set({ isAuthenticated: auth });
    },
    setCurrentUser: (user) => {
        window.localStorage.setItem("vena-currentUser", JSON.stringify(user));
        set({ currentUser: user });
    },
    setActiveView: (view) => set({ activeView: view }),
    setNotification: (msg) => set({ notification: msg }),
    showNotification: (msg) => {
        set({ notification: msg });
        setTimeout(() => {
            set((state) => (state.notification === msg ? { notification: "" } : state));
        }, 3000);
    },
    setInitialAction: (action) => set({ initialAction: action }),
    setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    setIsSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
}));
