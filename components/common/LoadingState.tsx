'use client';

import React from 'react';

interface LoadingStateProps {
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ rows = 4 }) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      {/* Header placeholder */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="h-5 bg-slate-200/80 rounded w-1/4 animate-pulse"></div>
        <div className="h-5 bg-slate-200/80 rounded w-12 animate-pulse"></div>
      </div>
      {/* Table rows placeholder */}
      <div className="space-y-3.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-2">
            <div className="h-4 bg-slate-200/70 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-slate-200/70 rounded flex-1 animate-pulse"></div>
            <div className="h-4 bg-slate-200/70 rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-slate-200/70 rounded w-20 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
