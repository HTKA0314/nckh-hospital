'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = 'mục',
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Tạo danh sách trang thông minh (có dấu ...)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (safeCurrentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (safeCurrentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-xs px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 ${className}`}
    >
      {/* Hiển thị số lượng & Chọn kích thước trang */}
      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0A6EBD]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
        <span>
          {totalItems > 0 ? (
            <>
              từ <strong className="text-slate-900 font-mono">{startItem}</strong> -{' '}
              <strong className="text-slate-900 font-mono">{endItem}</strong> trên tổng số{' '}
              <strong className="text-slate-900 font-mono">{totalItems}</strong> {itemLabel}
            </>
          ) : (
            <>
              Tổng số <strong className="text-slate-900 font-mono">0</strong> {itemLabel}
            </>
          )}
        </span>
      </div>

      {/* Điều hướng trang */}
      <div className="flex items-center gap-1">
        {/* Về trang đầu */}
        <button
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Lùi 1 trang */}
        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Các số trang */}
        {getPageNumbers().map((pageNum, index) =>
          typeof pageNum === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1 rounded-lg font-bold font-mono text-xs transition ${
                safeCurrentPage === pageNum
                  ? 'bg-[#0A6EBD] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {pageNum}
            </button>
          ) : (
            <span key={index} className="px-2 py-1 text-slate-400 font-mono">
              ...
            </span>
          )
        )}

        {/* Tiến 1 trang */}
        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Trang tiếp"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Đến trang cuối */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Trang cuối"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
