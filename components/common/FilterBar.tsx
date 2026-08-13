'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterField {
  key: string;
  placeholder: string;
  options: FilterOption[];
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  fields?: FilterField[];
  selectedFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  fields = [],
  selectedFilters = {},
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters = 
    searchQuery !== '' || 
    Object.values(selectedFilters).some((val) => val !== '' && val !== 'ALL');

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] transition"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dynamic Filters */}
        {fields.length > 0 && onFilterChange && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Bộ lọc:</span>
            </div>
            {fields.map((field) => (
              <select
                key={field.key}
                className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] transition cursor-pointer"
                value={selectedFilters[field.key] || 'ALL'}
                onChange={(e) => onFilterChange(field.key, e.target.value)}
              >
                <option value="ALL">{field.placeholder}</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}

            {hasActiveFilters && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="text-xs font-semibold text-[#0A6EBD] hover:text-[#0A6EBD]/80 transition flex items-center gap-1 py-2 px-1"
              >
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
