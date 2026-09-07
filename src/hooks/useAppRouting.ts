import React, { useState, useEffect, useRef, useCallback } from "react";
import { ViewType, NavigationAction, Profile, TeamProjectPayment } from "../types";
import { resolveCanonicalRoute, isPublicRoute } from "../utils/publicRouting";
import { darkenColor, hexToHsl } from "../constants";
import {
  LAST_ROUTE_STORAGE_KEY,
  ROUTE_PATH_MAP,
  resolveViewFromPath,
} from "../routes/routesConfig";
import { listAllTeamPayments } from "../services/teamProjectPayments";

export interface UseAppRoutingProps {
  isAuthenticated: boolean;
  profile: Profile;
  teamPaymentsLoaded: boolean;
  setTeamProjectPayments: React.Dispatch<React.SetStateAction<TeamProjectPayment[]>>;
  setTeamPaymentsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  onMarkNotificationRead?: (id: string) => void;
  appDataLoader?: {
    loadClients: () => void;
    loadProjects: () => void;
    loadTransactions: () => void;
    loadTeamMembers: () => void;
  };
}

export interface UseAppRoutingReturn {
  route: string;
  setRoute: React.Dispatch<React.SetStateAction<string>>;
  activeView: ViewType;
  setActiveView: React.Dispatch<React.SetStateAction<ViewType>>;
  initialAction: NavigationAction | null;
  setInitialAction: React.Dispatch<React.SetStateAction<NavigationAction | null>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleNavigation: (
    view: ViewType,
    action?: NavigationAction,
    notificationId?: string,
  ) => void;
}

export function useAppRouting({
  isAuthenticated,
  profile,
  teamPaymentsLoaded,
  setTeamProjectPayments,
  setTeamPaymentsLoaded,
  onMarkNotificationRead,
  appDataLoader,
}: UseAppRoutingProps): UseAppRoutingReturn {
  const [route, setRoute] = useState<string>(() => resolveCanonicalRoute());
  const [activeView, setActiveView] = useState<ViewType>(() => {
    const initialRoute = resolveCanonicalRoute();
    const path = (initialRoute.split("?")[0].split("/")[1] || "home").toLowerCase();
    return resolveViewFromPath(path);
  });
  const [initialAction, setInitialAction] = useState<NavigationAction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const didRestoreLastRouteRef = useRef(false);

  // Force light mode globally on app load
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try {
      window.localStorage.setItem("theme", "light");
    } catch (error) {
      console.warn("[Theme] Failed to set theme in localStorage:", error);
    }
  }, []);

  // Canonical path-to-hash synchronization on mount without page reload
  useEffect(() => {
    try {
      const canonical = resolveCanonicalRoute();
      if (canonical !== route) {
        setRoute(canonical);
      }
      if (window.location.pathname !== "/" && window.location.pathname !== "/index.html") {
        if (window.location.hash !== canonical) {
          window.location.hash = canonical.startsWith("#") ? canonical : `#${canonical}`;
        }
      }
    } catch (e) {
      console.warn("[Router] Error during canonical route sync:", e);
    }
  }, []);

  // Route listening and authentication protection
  useEffect(() => {
    const handleRouteChange = () => {
      const newRoute = resolveCanonicalRoute();
      setRoute(newRoute);
      const isPublic = isPublicRoute(newRoute);

      if (!isAuthenticated) {
        if (!isPublic) {
          try {
            window.localStorage.setItem(LAST_ROUTE_STORAGE_KEY, newRoute);
          } catch (e) {
            console.warn(
              "[Routing] Failed to persist intended route before login:",
              e,
            );
          }
          window.location.hash = "#/login";
        }
      } else {
        if (!didRestoreLastRouteRef.current) {
          didRestoreLastRouteRef.current = true;
          const isEmptyOrHome =
            newRoute === "#" ||
            newRoute === "" ||
            newRoute.startsWith("#/home");
          if (!isPublic && isEmptyOrHome) {
            try {
              const last = window.localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
              if (
                last &&
                typeof last === "string" &&
                last.startsWith("#/") &&
                !last.startsWith("#/home")
              ) {
                window.location.hash = last;
                return;
              }
            } catch (e) {
              console.warn(
                "[Routing] Failed to restore last route from localStorage:",
                e,
              );
            }
          }
        }

        const shouldRedirectFrom =
          newRoute.startsWith("#/login") || newRoute === "#";
        if (shouldRedirectFrom) {
          window.location.hash = "#/dashboard";
        }

        if (
          !isPublic &&
          newRoute.startsWith("#/") &&
          !newRoute.startsWith("#/login") &&
          !newRoute.startsWith("#/home") &&
          newRoute !== "#"
        ) {
          try {
            window.localStorage.setItem(LAST_ROUTE_STORAGE_KEY, newRoute);
          } catch (e) {
            console.warn(
              "[Routing] Failed to persist last route to localStorage:",
              e,
            );
          }
        }
      }
    };

    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);
    handleRouteChange(); // Initial check

    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [isAuthenticated]);

  // Synchronize route pathname to activeView
  useEffect(() => {
    const path = (route.split("?")[0].split("/")[1] || "home").toLowerCase();
    const resolvedView = resolveViewFromPath(path);
    setActiveView(resolvedView);
  }, [route]);

  // Load view-specific auxiliary data (e.g. teamProjectPayments for Projects)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeView === ViewType.PROJECTS && !teamPaymentsLoaded) {
      (async () => {
        try {
          const items = await listAllTeamPayments();
          setTeamProjectPayments(items);
          setTeamPaymentsLoaded(true);
        } catch (e) {
          console.warn(
            "[TeamPayments] Failed to fetch team project payments:",
            e,
          );
        }
      })();
    }
  }, [activeView, isAuthenticated, teamPaymentsLoaded, setTeamProjectPayments, setTeamPaymentsLoaded]);

  // Idle prefetch of primary pages so tab switching is instant with 0ms delay
  useEffect(() => {
    if (!isAuthenticated) return;
    const prefetchPages = () => {
      import("../pages/projects/ProjectsPage");
      import("../pages/clients/ClientsPage");
      import("../pages/finance/FinancePage");
      import("../pages/team/TeamPage");
      import("../pages/leads/LeadsPage");
    };

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = (window as any).requestIdleCallback(prefetchPages, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(prefetchPages, 1200);
    }

    return () => {
      if (idleId && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated]);

  // Public theme dynamic CSS injection
  useEffect(() => {
    const styleElement = document.getElementById("public-theme-style");
    const isPublic =
      route.startsWith("#/public") ||
      route.startsWith("#/gallery") ||
      route.startsWith("#/portal") ||
      route.startsWith("#/freelancer-portal") ||
      route.startsWith("#/profile") ||
      route.startsWith("#/portfolio");

    document.body.classList.toggle("app-theme", !isPublic);
    document.body.classList.toggle("public-page-body", isPublic);

    if (isPublic) {
      const brandColor = profile.brandColor || "#3b82f6";

      if (styleElement) {
        const hoverColor = darkenColor(brandColor, 10);
        const brandHsl = hexToHsl(brandColor);
        styleElement.innerHTML = `
                    :root {
                        --public-accent: ${brandColor};
                        --public-accent-hover: ${hoverColor};
                        --public-accent-hsl: ${brandHsl};
                    }
                `;
      }
    } else if (styleElement) {
      styleElement.innerHTML = "";
    }
  }, [route, profile.brandColor]);

  // Ensure required data is loaded when visiting public portal routes directly
  useEffect(() => {
    if (!appDataLoader) return;
    if (route.startsWith("#/portal/")) {
      appDataLoader.loadClients();
      appDataLoader.loadProjects();
      appDataLoader.loadTransactions();
    }

    if (route.startsWith("#/freelancer-portal/")) {
      appDataLoader.loadTeamMembers();
      appDataLoader.loadProjects();
      appDataLoader.loadTransactions();
    }
  }, [
    route,
    appDataLoader,
  ]);

  const handleNavigation = useCallback(
    (view: ViewType, action?: NavigationAction, notificationId?: string) => {
      const path = ROUTE_PATH_MAP[view] || view.toLowerCase().replace(/ /g, "-");
      const newRoute = `#/${path}`;

      window.location.hash = newRoute;

      try {
        window.localStorage.setItem(LAST_ROUTE_STORAGE_KEY, newRoute);
      } catch (e) {
        console.warn(
          "[Routing] Failed to persist last route to localStorage:",
          e,
        );
      }

      React.startTransition(() => {
        setActiveView(view);
      });
      setInitialAction(action || null);
      setIsSidebarOpen(false);
      setIsSearchOpen(false);

      if (notificationId && onMarkNotificationRead) {
        onMarkNotificationRead(notificationId);
      }
    },
    [onMarkNotificationRead],
  );

  return {
    route,
    setRoute,
    activeView,
    setActiveView,
    initialAction,
    setInitialAction,
    isSidebarOpen,
    setIsSidebarOpen,
    isSearchOpen,
    setIsSearchOpen,
    handleNavigation,
  };
}

export default useAppRouting;
