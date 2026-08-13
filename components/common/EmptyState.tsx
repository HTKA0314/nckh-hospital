'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TableEmptyStateProps extends EmptyStateProps {
  colSpan: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không tìm thấy kết quả',
  description = 'Vui lòng thay đổi từ khóa hoặc bộ lọc để thử lại.',
  action,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white border border-slate-200/80 rounded-xl shadow-sm">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  title = 'Không tìm thấy kết quả',
  description = 'Vui lòng thay đổi từ khóa hoặc bộ lọc để thử lại.',
  icon,
  colSpan,
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
          {icon || <Inbox className="w-8 h-8 opacity-30 mb-2" />}
          <h3 className="text-[13px] font-bold text-slate-700">{title}</h3>
          <p className="text-xs text-slate-500 max-w-sm">{description}</p>
        </div>
      </td>
    </tr>
  );
};
