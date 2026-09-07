import { ViewType } from "../types";

export const LAST_ROUTE_STORAGE_KEY = "vena-lastRoute";

export const ROUTE_PATH_MAP: Partial<Record<ViewType, string>> = {
  [ViewType.HOMEPAGE]: "home",
  [ViewType.DASHBOARD]: "dashboard",
  [ViewType["Calon Pengantin"]]: "prospek",
  [ViewType.BOOKING]: "booking",
  [ViewType.CLIENTS]: "clients",
  [ViewType.PROJECTS]: "projects",
  [ViewType.TEAM]: "team",
  [ViewType.FINANCE]: "finance",
  [ViewType.CALENDAR]: "calendar",
  [ViewType.PACKAGES]: "packages",
  [ViewType.PROMO_CODES]: "promo-codes",
  [ViewType.CLIENT_REPORTS]: "client-reports",
  [ViewType.SETTINGS]: "settings",
  [ViewType.VENDOR_PROFILE]: "vendor-profile",
  [ViewType.INVOICES]: "invoices",
};

export const ROUTE_TO_VIEW_MAP: Record<string, ViewType> = {
  home: ViewType.HOMEPAGE,
  dashboard: ViewType.DASHBOARD,
  "calon pengantin": ViewType["Calon Pengantin"],
  prospek: ViewType["Calon Pengantin"],
  booking: ViewType.BOOKING,
  clients: ViewType.CLIENTS,
  projects: ViewType.PROJECTS,
  team: ViewType.TEAM,
  finance: ViewType.FINANCE,
  calendar: ViewType.CALENDAR,
  packages: ViewType.PACKAGES,
  "promo-codes": ViewType.PROMO_CODES,
  kontrak: ViewType.CONTRACTS,
  gallery: ViewType.GALLERY,
  "client-reports": ViewType.CLIENT_REPORTS,
  settings: ViewType.SETTINGS,
  invoices: ViewType.INVOICES,
};

export const resolveViewFromPath = (path: string): ViewType => {
  const normalizedPath = path.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(ROUTE_TO_VIEW_MAP, normalizedPath)) {
    return ROUTE_TO_VIEW_MAP[normalizedPath];
  }

  const matchedView = Object.values(ViewType).find(
    (v) => v.toLowerCase().replace(/ /g, "-") === normalizedPath,
  );

  if (matchedView) {
    return matchedView;
  }

  if (normalizedPath === "team") {
    return ViewType.TEAM;
  }

  return ViewType.HOMEPAGE;
};
