import React, { useMemo, useState, useEffect } from 'react';
import { ViewType, User, Profile } from '../types';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  DollarSignIcon,
  PackageIcon,
  BriefcaseIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronDownIcon,
  TargetIcon,
  ClipboardListIcon,
  FolderKanbanIcon,
  FileTextIcon,
  ChartPieIcon,
  LightbulbIcon,
  ImageIcon,
  UserCircleIcon,
} from '../constants';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentUser: User | null;
  profile: Profile;
  onLogout: () => void;
}

interface NavSubItem {
  view: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  view?: ViewType;
  items?: NavSubItem[];
  section?: string;
}

/**
 * 4 Core Business Pillars Navigation
 * 1. IKHTISAR & AGENDA: Dashboard, Kalender
 * 2. BISNIS & KLIEN: Pengantin (Data, Calon, Booking, Kontrak, Testimoni)
 * 3. PRODUKSI & TIM: Acara Pernikahan (Direct Project Access!), Tim & Vendor
 * 4. KEUANGAN & PENGATURAN: Keuangan, Produk & Layanan, Pengaturan
 */
const NAV_MENUS: NavMenuItem[] = [
  // PILLAR 1: IKHTISAR & AGENDA
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    view: ViewType.DASHBOARD,
    section: 'Ikhtisar & Agenda',
  },
  {
    id: 'kalender',
    label: 'Kalender',
    icon: CalendarIcon,
    view: ViewType.CALENDAR,
  },

  // PILLAR 2: BISNIS & KLIEN
  {
    id: 'pengantin',
    label: 'Pengantin',
    icon: UsersIcon,
    section: 'Bisnis & Klien',
    items: [
      { view: ViewType.CLIENTS, label: 'Data Pengantin', icon: UsersIcon },
      { view: ViewType["Calon Pengantin"], label: 'Calon Pengantin', icon: TargetIcon },
      { view: ViewType.BOOKING, label: 'Booking Jadwal', icon: ClipboardListIcon },
      { view: ViewType.CONTRACTS, label: 'Kontrak Digital', icon: FileTextIcon },
      { view: ViewType.CLIENT_REPORTS, label: 'Testimoni', icon: ChartPieIcon },
    ],
  },

  // PILLAR 3: PRODUKSI & TIM
  {
    id: 'projects',
    label: 'Acara Pernikahan',
    icon: FolderKanbanIcon,
    view: ViewType.PROJECTS,
    section: 'Produksi & Tim',
  },
  {
    id: 'tim',
    label: 'Tim & Vendor',
    icon: BriefcaseIcon,
    view: ViewType.TEAM,
  },

  // PILLAR 4: KEUANGAN & PENGATURAN
  {
    id: 'keuangan',
    label: 'Keuangan',
    icon: DollarSignIcon,
    section: 'Keuangan & Sistem',
    items: [
      { view: ViewType.FINANCE, label: 'Laporan Keuangan', icon: DollarSignIcon },
      { view: ViewType.INVOICES, label: 'Daftar Invoice', icon: FileTextIcon },
    ],
  },
  {
    id: 'produk',
    label: 'Produk & Layanan',
    icon: PackageIcon,
    items: [
      { view: ViewType.PACKAGES, label: 'Layanan & Paket', icon: PackageIcon },
      { view: ViewType.PROMO_CODES, label: 'Voucher & Promo', icon: LightbulbIcon },
      { view: ViewType.GALLERY, label: 'Upload Pricelist Publik', icon: ImageIcon },
    ],
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan',
    icon: SettingsIcon,
    items: [
      { view: ViewType.VENDOR_PROFILE, label: 'Profil Vendor', icon: UserCircleIcon },
      { view: ViewType.SETTINGS, label: 'Pengaturan Sistem', icon: SettingsIcon },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = React.memo(({
  activeView,
  setActiveView,
  isOpen,
  setIsOpen,
  currentUser,
  profile,
  onLogout,
}) => {
  // Find which group currently contains the activeView
  const activeGroupId = useMemo(() => {
    for (const menu of NAV_MENUS) {
      if (menu.view === activeView) {
        return menu.id;
      }
      if (menu.items?.some(sub => sub.view === activeView)) {
        return menu.id;
      }
    }
    return null;
  }, [activeView]);

  // Accordion state: which accordion menu is currently expanded
  const [openGroupId, setOpenGroupId] = useState<string | null>(() => activeGroupId);

  // Automatically expand the accordion when activeView changes to one of its sub-items
  useEffect(() => {
    if (activeGroupId) {
      setOpenGroupId(activeGroupId);
    }
  }, [activeGroupId]);

  // Compute user permissions (Admin gets full access, Member gets configured permissions)
  const userPermissions = useMemo(() => {
    if (!currentUser) return new Set<ViewType>();
    if (currentUser.role === 'Admin') {
      return new Set(Object.values(ViewType));
    }
    return new Set(currentUser.permissions || []);
  }, [currentUser]);

  // Filter menus based on user role & permissions
  const visibleMenus = useMemo(() => {
    return NAV_MENUS.map(menu => {
      if (menu.view) {
        // Standalone menu
        if (!userPermissions.has(menu.view)) return null;
        return menu;
      }
      if (menu.items) {
        // Accordion menu: only keep permitted sub-items
        const visibleSubItems = menu.items.filter(sub => userPermissions.has(sub.view));
        // If no sub-items are permitted, hide the whole category
        if (visibleSubItems.length === 0) return null;
        return {
          ...menu,
          items: visibleSubItems,
        };
      }
      return null;
    }).filter((menu): menu is NavMenuItem => Boolean(menu));
  }, [userPermissions]);

  // Handle standalone menu navigation
  const handleStandaloneClick = (view: ViewType) => {
    React.startTransition(() => {
      setActiveView(view);
    });
    setIsOpen(false); // Auto-close on mobile
  };

  // Handle accordion toggle
  const handleGroupToggle = (groupId: string) => {
    setOpenGroupId(prev => (prev === groupId ? null : groupId));
  };

  // Handle sub-item navigation
  const handleSubItemClick = (view: ViewType) => {
    React.startTransition(() => {
      setActiveView(view);
    });
    setIsOpen(false); // Auto-close on mobile
  };

  // Handle scroll lock when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1280) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`
          fixed inset-0 
          bg-black/50 
          backdrop-blur-sm
          z-30 
          xl:hidden 
          transition-all duration-300 ease-out
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        id="sidebar"
        className={`
          fixed xl:fixed 
          inset-y-0 left-0 
          w-72 sm:w-80 xl:w-64
          bg-brand-surface 
          flex-col flex-shrink-0 flex 
          z-40 
          transform transition-all duration-300 ease-out
          xl:translate-x-0
          border-r border-brand-border/50
          shadow-2xl xl:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          paddingTop: 'var(--safe-area-inset-top, 0px)',
          paddingBottom: 'var(--safe-area-inset-bottom, 0px)',
          paddingLeft: 'var(--safe-area-inset-left, 0px)',
        }}
        aria-label="Navigasi Utama"
      >
        {/* Header with Logo */}
        <div className="
          h-16 sm:h-20 
          flex items-center 
          px-4 sm:px-6 
          border-b border-brand-border/50
          bg-brand-surface
        ">
          <div className="flex items-center gap-3">
            <div className="
              w-10 h-10 
              rounded-xl 
              bg-brand-surface
              flex items-center justify-center
              shadow-sm
              overflow-hidden
            ">
              {profile?.logoBase64 ? (
                <img
                  src={profile.logoBase64}
                  alt={profile.companyName || "Company Logo"}
                  width="40"
                  height="40"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src="/assets/images/logos/logoIcon.svg"
                  alt="Weddfin Logo"
                  width="32"
                  height="32"
                  loading="lazy"
                  decoding="async"
                  className="w-8 h-8 object-contain"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="
                text-lg sm:text-xl 
                font-extrabold 
                text-brand-text-light
                select-none
                tracking-tight
                truncate
                block
              ">
                {profile?.companyName || 'weddfin'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav
          className="
            flex-1 
            px-3 sm:px-4 
            py-4 sm:py-6 
            overflow-y-auto 
            overscroll-contain
          "
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <ul className="space-y-1.5">
            {visibleMenus.map((menu, idx) => {
              const Icon = menu.icon;
              const sectionHeader = menu.section ? (
                <li key={`section-${menu.id}`} className={`${idx === 0 ? 'pt-0' : 'pt-4'} pb-1 px-3`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary/60 select-none">
                    {menu.section}
                  </p>
                </li>
              ) : null;

              // CASE 1: Standalone Single-view Menu (Dashboard, Kalender, Keuangan, Tim & Vendor, Acara Pernikahan)
              if (menu.view) {
                const isActive = activeView === menu.view;

                return (
                  <React.Fragment key={menu.id}>
                    {sectionHeader}
                    <li>
                      <button
                        type="button"
                        onClick={() => handleStandaloneClick(menu.view!)}
                        className={`
                          w-full flex items-center 
                          px-3 sm:px-3.5 
                          py-2.5 sm:py-3 
                          text-sm font-semibold 
                          rounded-xl 
                          transition-all duration-200
                          group
                          relative
                          overflow-hidden
                          min-h-[44px]
                          cursor-pointer
                          text-left
                          ${isActive
                            ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/25'
                            : 'text-brand-text-primary hover:bg-brand-input active:bg-brand-input/80 hover:text-brand-text-light'
                          }
                        `}
                      >
                        {/* Icon */}
                        <div className="w-5 sm:w-6 mr-3 flex-shrink-0 flex items-center justify-center">
                          <Icon className={`
                            w-5 h-5
                            transition-all duration-200
                            ${isActive ? 'text-white' : 'text-brand-text-secondary group-hover:text-brand-text-primary'}
                          `} />
                        </div>

                        {/* Label */}
                        <span className="flex-1 truncate leading-tight">
                          {menu.label}
                        </span>

                        {/* Active Indicator */}
                        {isActive && (
                          <div className="w-1.5 h-5 bg-white/40 rounded-full flex-shrink-0 ml-2" />
                        )}
                      </button>
                    </li>
                  </React.Fragment>
                );
              }

              // CASE 2: Expandable Accordion Menu (Pengantin, Produk & Layanan, Pengaturan)
              const isExpanded = openGroupId === menu.id;
              const isParentActive = Boolean(menu.items?.some(sub => sub.view === activeView));

              return (
                <React.Fragment key={menu.id}>
                  {sectionHeader}
                  <li>
                    {/* Parent Accordion Button */}
                  <button
                    type="button"
                    onClick={() => handleGroupToggle(menu.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`submenu-${menu.id}`}
                    className={`
                      w-full flex items-center 
                      px-3 sm:px-3.5 
                      py-2.5 sm:py-3 
                      text-sm font-semibold 
                      rounded-xl 
                      transition-all duration-200
                      group
                      min-h-[44px]
                      cursor-pointer
                      text-left
                      ${isParentActive
                        ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/25 font-bold shadow-sm'
                        : 'text-brand-text-primary hover:bg-brand-input active:bg-brand-input/80 hover:text-brand-text-light border border-transparent'
                      }
                    `}
                  >
                    {/* Icon */}
                    <div className="w-5 sm:w-6 mr-3 flex-shrink-0 flex items-center justify-center">
                      <Icon className={`
                        w-5 h-5
                        transition-all duration-200
                        ${isParentActive ? 'text-brand-accent' : 'text-brand-text-secondary group-hover:text-brand-text-primary'}
                      `} />
                    </div>

                    {/* Label */}
                    <span className="flex-1 truncate leading-tight">
                      {menu.label}
                    </span>

                    {/* Active Parent Indicator Dot */}
                    {isParentActive && (
                      <span className="w-2 h-2 rounded-full bg-brand-accent flex-shrink-0 mr-2" />
                    )}

                    {/* Expand/Collapse Chevron */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                      <ChevronDownIcon
                        className={`
                          w-4 h-4 
                          transition-transform duration-200
                          ${isExpanded ? 'rotate-180 text-brand-text-light' : 'text-brand-text-secondary'}
                        `}
                      />
                    </div>
                  </button>

                  {/* Submenu Accordion Panel */}
                  {isExpanded && menu.items && (
                    <ul
                      id={`submenu-${menu.id}`}
                      role="region"
                      aria-label={`Submenu ${menu.label}`}
                      className="mt-1 mb-2 ml-4 pl-3.5 border-l-2 border-brand-border/60 space-y-1"
                    >
                      {menu.items.map((subItem) => {
                        const isSubActive = activeView === subItem.view;
                        const SubIcon = subItem.icon;

                        return (
                          <li key={subItem.view}>
                            <button
                              type="button"
                              onClick={() => handleSubItemClick(subItem.view)}
                              className={`
                                w-full flex items-center gap-2.5
                                px-3 py-2 
                                rounded-lg
                                text-xs sm:text-sm font-medium
                                transition-all duration-150
                                min-h-[38px]
                                group
                                cursor-pointer
                                text-left
                                ${isSubActive
                                  ? 'bg-brand-accent text-white shadow-sm font-semibold'
                                  : 'text-brand-text-secondary hover:text-brand-text-light hover:bg-brand-input/70'
                                }
                              `}
                            >
                              <SubIcon className={`
                                w-4 h-4 flex-shrink-0 transition-colors
                                ${isSubActive ? 'text-white' : 'text-brand-text-secondary group-hover:text-brand-text-light'}
                              `} />
                              <span className="truncate flex-1">
                                {subItem.label}
                              </span>
                              {isSubActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              </React.Fragment>
            );
          })}
          </ul>
        </nav>

        {/* Footer Section: User Profile & Logout */}
        <div className="
          px-4 sm:px-6 
          py-4 sm:py-5 
          flex-shrink-0 
          border-t border-brand-border/50
          bg-brand-surface
        ">
          {currentUser && (
            <div className="
              flex items-center 
              gap-3 
              p-2.5 sm:p-3
              rounded-xl
              bg-brand-input/50
              border border-brand-border/30
              mb-2
            ">
              <div className="
                w-9 h-9 sm:w-10 sm:h-10 
                rounded-full 
                bg-gradient-to-br from-brand-accent/20 to-brand-accent/10
                flex items-center justify-center
                border-2 border-brand-accent/20
                flex-shrink-0
              ">
                <UsersIcon className="w-5 h-5 text-brand-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="
                  font-semibold 
                  text-sm 
                  text-brand-text-light
                  truncate
                  leading-tight
                ">
                  {profile?.fullName || currentUser.fullName}
                </p>
                <p className="
                  text-xs 
                  text-brand-text-secondary
                  truncate
                  leading-tight
                  mt-0.5
                ">
                  {currentUser.role}
                </p>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="
              w-full flex items-center gap-3
              px-3 py-2.5 rounded-lg
              text-sm font-semibold
              text-brand-text-primary
              hover:bg-brand-input active:bg-brand-input/80
              transition-colors
              border border-transparent hover:border-brand-border/50
              cursor-pointer
            "
            aria-label="Keluar"
          >
            <LogOutIcon className="w-5 h-5 text-brand-text-secondary" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <style>{`
        /* Enhanced scrollbar for navigation */
        nav::-webkit-scrollbar {
          width: 5px;
        }
        nav::-webkit-scrollbar-track {
          background: transparent;
        }
        nav::-webkit-scrollbar-thumb {
          background: var(--color-border, rgba(150, 150, 150, 0.2));
          border-radius: 3px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-secondary, rgba(150, 150, 150, 0.4));
        }
        
        /* iOS momentum scrolling */
        @supports (-webkit-touch-callout: none) {
          nav {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </>
  );
});

export default Sidebar;
