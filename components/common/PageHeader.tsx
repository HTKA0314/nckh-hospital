'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 select-none">
      <div>
        <h1 className="text-base font-bold text-slate-800">{title}</h1>
        {description && (
          <p className="text-[12px] text-slate-500 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};
