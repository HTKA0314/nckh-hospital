'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  type = 'info',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3.5 mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                type === 'danger'
                  ? 'bg-rose-100 text-rose-600'
                  : type === 'warning'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-blue-100 text-[#0A6EBD]'
              }`}
            >
              {type === 'danger' ? (
                <AlertCircle className="w-6 h-6" />
              ) : type === 'warning' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <HelpCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900">{title}</h3>
              <span className="text-xs text-slate-500 font-medium">Yêu cầu xác nhận hành động</span>
            </div>
          </div>

          <p className="text-[14px] text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            {message}
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-[13px] font-bold text-white rounded-xl transition shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50 ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[#0A6EBD] hover:bg-[#085896]'
            }`}
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
