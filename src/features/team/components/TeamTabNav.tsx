import React from 'react';
import { UsersIcon, UserCheckIcon, AlertCircleIcon, HistoryIcon } from '../../../constants';

export type MainTab = 'team' | 'vendor' | 'unpaid' | 'analytics';

interface TabConfig {
  id: MainTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
  badgeVariant?: 'default' | 'danger';
}

interface TeamTabNavProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  teamCount: number;
  vendorCount: number;
  unpaidCount: number;
}

const TeamTabNav: React.FC<TeamTabNavProps> = ({
  activeTab,
  onTabChange,
  teamCount,
  vendorCount,
  unpaidCount,
}) => {
  const tabs: TabConfig[] = [
    {
      id: 'team',
      label: 'Tim Internal',
      icon: UsersIcon,
      badge: teamCount,
      badgeVariant: 'default',
    },
    {
      id: 'vendor',
      label: 'Vendor Eksternal',
      icon: UserCheckIcon,
      badge: vendorCount,
      badgeVariant: 'default',
    },
    {
      id: 'unpaid',
      label: 'Fee Belum Lunas',
      icon: AlertCircleIcon,
      badge: unpaidCount > 0 ? unpaidCount : undefined,
      badgeVariant: 'danger',
    },
    {
      id: 'analytics',
      label: 'Analitik & Performa',
      icon: HistoryIcon,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-brand-surface border border-brand-border rounded-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold
              transition-all duration-200 whitespace-nowrap
              ${isActive
                ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/25'
                : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg/60'
              }
            `}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">
              {tab.id === 'team' ? 'Tim' : tab.id === 'vendor' ? 'Vendor' : tab.id === 'unpaid' ? 'Lunas' : 'Analitik'}
            </span>
            {tab.badge !== undefined && (
              <span
                className={`
                  text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none
                  ${tab.badgeVariant === 'danger'
                    ? isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-brand-bg text-brand-text-secondary border border-brand-border'
                  }
                `}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TeamTabNav;
