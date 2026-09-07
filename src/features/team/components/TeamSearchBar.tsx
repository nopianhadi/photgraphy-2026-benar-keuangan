import React from 'react';

interface TeamSearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  resultLabel?: string;
}

const SearchIcon = () => (
  <svg
    className="w-4 h-4 text-brand-text-secondary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const TeamSearchBar: React.FC<TeamSearchBarProps> = ({
  placeholder,
  value,
  onChange,
  resultCount,
  resultLabel = 'anggota',
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-brand-surface border border-brand-border rounded-2xl px-4 py-3">
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-brand-border bg-brand-bg/60 text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/60 transition-all"
        />
      </div>

      {/* Count */}
      <p className="text-xs text-brand-text-secondary shrink-0">
        Menampilkan{' '}
        <span className="font-semibold text-brand-text-primary">{resultCount}</span>{' '}
        {resultLabel}
      </p>
    </div>
  );
};

export default TeamSearchBar;
