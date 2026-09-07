import React from "react";
import { ViewType } from "../types";
import {
  HomeIcon,
  FolderKanbanIcon,
  UsersIcon,
  DollarSignIcon,
  CalendarIcon,
  BriefcaseIcon,
  PackageIcon,
  SettingsIcon,
  FileTextIcon,
  ChartPieIcon,
  StarIcon,
} from "../constants";

// ─── More Menu Icon (dots grid) ────────────────────────────────────────────
export const MoreGridIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="5" r="1.25" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="5" r="1.25" fill="currentColor" stroke="none"/>
    <circle cx="19" cy="5" r="1.25" fill="currentColor" stroke="none"/>
    <circle cx="5" cy="12" r="1.25" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/>
    <circle cx="19" cy="12" r="1.25" fill="currentColor" stroke="none"/>
    <circle cx="5" cy="19" r="1.25" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="19" r="1.25" fill="currentColor" stroke="none"/>
    <circle cx="19" cy="19" r="1.25" fill="currentColor" stroke="none"/>
  </svg>
);

export const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// ─── More Menu Bottom Sheet ─────────────────────────────────────────────────
export const MoreMenuSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeView: ViewType;
  handleNavigation: (view: ViewType) => void;
}> = ({ isOpen, onClose, activeView, handleNavigation }) => {
  const menuGroups = [
    {
      label: "Manajemen",
      items: [
        { view: ViewType["Calon Pengantin"], label: "Calon Pengantin", icon: StarIcon },
        { view: ViewType.BOOKING, label: "Booking", icon: CalendarIcon },
        { view: ViewType.TEAM, label: "Tim / Vendor", icon: BriefcaseIcon },
        { view: ViewType.CONTRACTS, label: "Kontrak", icon: FileTextIcon },
      ],
    },
    {
      label: "Produk & Layanan",
      items: [
        { view: ViewType.PACKAGES, label: "Package", icon: PackageIcon },
        { view: ViewType.CLIENT_REPORTS, label: "Laporan Klien", icon: ChartPieIcon },
        { view: ViewType.INVOICES, label: "Daftar Invoice", icon: FileTextIcon },
        { view: ViewType.CALENDAR, label: "Kalender", icon: CalendarIcon },
      ],
    },
    {
      label: "Pengaturan",
      items: [
        { view: ViewType.SETTINGS, label: "Pengaturan", icon: SettingsIcon },
      ],
    },
  ];

  const navigate = (view: ViewType) => {
    handleNavigation(view);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] xl:hidden transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[46]
          xl:hidden
          bg-brand-surface
          rounded-t-2xl
          border-t-2 border-brand-border
          shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-y-0" : "translate-y-full"}
        `}
        style={{
          paddingBottom: "calc(1rem + var(--safe-area-inset-bottom, 0px))",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-brand-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-brand-border/50">
          <h3 className="font-bold text-base text-brand-text-light">Menu Lainnya</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-brand-input flex items-center justify-center text-brand-text-secondary"
            aria-label="Tutup"
          >
            <ChevronDownIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Groups */}
        <div className="px-4 pt-3 space-y-4">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary/60 px-1 mb-2">
                {group.label}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {group.items.map((item) => {
                  const isActive = activeView === item.view;
                  return (
                    <button
                      key={item.view}
                      onClick={() => navigate(item.view)}
                      className={`
                        flex flex-col items-center justify-center gap-1.5
                        p-3 rounded-xl
                        border transition-all duration-200
                        min-h-[72px]
                        ${isActive
                          ? "bg-brand-accent text-white border-brand-accent shadow-md shadow-brand-accent/20"
                          : "bg-brand-bg border-brand-border text-brand-text-secondary hover:border-brand-accent/40 hover:text-brand-text-light hover:bg-brand-input active:scale-95"
                        }
                      `}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                      <span className={`text-[11px] font-semibold leading-tight text-center ${isActive ? "text-white" : ""}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export interface BottomNavBarProps {
  activeView: ViewType;
  handleNavigation: (view: ViewType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeView,
  handleNavigation,
}) => {
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  const prefetchView = (view: ViewType) => {
    switch (view) {
      case ViewType.DASHBOARD:
        import("../pages/dashboard/DashboardPage");
        break;
      case ViewType["Calon Pengantin"]:
        import("../pages/leads/LeadsPage");
        break;
      case ViewType.BOOKING:
        import("../pages/booking/BookingPage");
        break;
      case ViewType.CLIENTS:
        import("../pages/clients/ClientsPage");
        break;
      case ViewType.PROJECTS:
        import("../pages/projects/ProjectsPage");
        break;
      case ViewType.TEAM:
        import("../pages/team/TeamPage");
        break;
      case ViewType.FINANCE:
        import("../pages/finance/FinancePage");
        break;
      case ViewType.CALENDAR:
        import("../features/projects/components/CalendarView");
        break;
      case ViewType.PACKAGES:
        import("../features/packages/Packages");
        break;
      case ViewType.PROMO_CODES:
        import("../features/promo/PromoCodes");
        break;
      case ViewType.GALLERY:
        import("../features/public/components/GalleryUpload");
        break;
      case ViewType.CLIENT_REPORTS:
        import("../features/clients/components/ClientKPI");
        break;
      case ViewType.SETTINGS:
        import("../pages/settings/SettingsPage");
        break;
      default:
        break;
    }
  };

  // Core 4 nav items (always visible)
  const navItems = [
    { view: ViewType.DASHBOARD, label: "Beranda", icon: HomeIcon },
    { view: ViewType.PROJECTS, label: "Proyek", icon: FolderKanbanIcon },
    { view: ViewType.CLIENTS, label: "Klien", icon: UsersIcon },
    { view: ViewType.FINANCE, label: "Keuangan", icon: DollarSignIcon },
  ];

  // Detect if current active view is one of the "more" views
  const moreViews = [
    ViewType["Calon Pengantin"],
    ViewType.BOOKING,
    ViewType.TEAM,
    ViewType.CONTRACTS,
    ViewType.PACKAGES,
    ViewType.CLIENT_REPORTS,
    ViewType.CALENDAR,
    ViewType.SETTINGS,
  ];
  const isMoreActive = moreViews.includes(activeView);

  return (
    <>
      <MoreMenuSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        activeView={activeView}
        handleNavigation={handleNavigation}
      />

      <nav
        className="
          bottom-nav
          xl:hidden
          bg-brand-surface/95
          backdrop-blur-xl
          border-t border-brand-border/50
        "
      >
        <div
          className="flex justify-around items-center h-16 px-1"
          style={{ paddingBottom: "var(--safe-area-inset-bottom, 0px)" }}
        >
          {/* Core nav items */}
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavigation(item.view)}
              onMouseEnter={() => prefetchView(item.view)}
              className={`
                flex flex-col items-center justify-center
                w-full h-full
                px-1 py-2
                rounded-xl
                transition-all duration-200
                min-w-[52px] sm:min-w-[64px] min-h-[44px]
                relative group overflow-visible
                ${activeView === item.view
                  ? "text-brand-accent bg-brand-accent/10"
                  : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-input/50 active:bg-brand-input"
                }
              `}
              aria-label={item.label}
            >
              <div className="relative mb-1">
                <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${activeView === item.view ? "scale-110" : "group-active:scale-95"}`} />
                {activeView === item.view && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold leading-tight ${activeView === item.view ? "font-bold" : ""}`}>
                {item.label}
              </span>
              <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${activeView === item.view ? "bg-gradient-to-t from-brand-accent/10 to-transparent" : "bg-transparent"}`} />
            </button>
          ))}

          {/* More button */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={`
              flex flex-col items-center justify-center
              w-full h-full
              px-1 py-2
              rounded-xl
              transition-all duration-200
              min-w-[52px] sm:min-w-[64px] min-h-[44px]
              relative group overflow-visible
              ${isMoreActive
                ? "text-brand-accent bg-brand-accent/10"
                : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-input/50 active:bg-brand-input"
              }
            `}
            aria-label="Menu lainnya"
            aria-expanded={isMoreOpen}
          >
            <div className="relative mb-1">
              <MoreGridIcon className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${isMoreActive ? "scale-110" : ""}`} />
              {isMoreActive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
              )}
            </div>
            <span className={`text-[10px] sm:text-xs font-semibold leading-tight ${isMoreActive ? "font-bold" : ""}`}>
              Lainnya
            </span>
            <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${isMoreActive ? "bg-gradient-to-t from-brand-accent/10 to-transparent" : "bg-transparent"}`} />
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomNavBar;
