'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle,
  emptyDescription,
  rowKey,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl">
        <Loader2 className="w-8 h-8 text-[#0A6EBD] animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px] text-slate-700">
          <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider select-none">
            <tr className="border-l-4 border-l-transparent">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 font-bold ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 text-slate-800">
            {data.map((row, index) => {
              const key = rowKey(row);
              const customClass = rowClassName ? rowClassName(row) : '';
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-l-4 border-l-transparent hover:border-l-[#0A6EBD] hover:bg-sky-50/45 transition-all duration-150 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${customClass}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-3.5 align-middle font-medium ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row, index) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
