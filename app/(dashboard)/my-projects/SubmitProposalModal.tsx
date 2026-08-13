'use client';

import React, { useState } from 'react';
import { X, Upload, File } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface SubmitProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
}

export function SubmitProposalModal({ isOpen, onClose, projectCode }: SubmitProposalModalProps) {
  const [fromDate, setFromDate] = useState('March 2025');
  const [toDate, setToDate] = useState('April 2025');
  const [fileName, setFileName] = useState('');
  const { success } = useToast();

  if (!isOpen) return null;

  const handleSave = () => {
    success('Đã tải lên đề cương thành công! Trạng thái chuyển thành "Chờ duyệt đề xuất".');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-[15px] font-bold text-[#0A6EBD] uppercase tracking-wide">TẢI LÊN ĐỀ CƯƠNG</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Thực hiện từ tháng</label>
              <input 
                type="text" 
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A6EBD]" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Thực hiện đến tháng</label>
              <input 
                type="text" 
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0A6EBD]" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Chọn file</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center justify-center px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors text-sm font-medium text-slate-700">
                <Upload className="w-4 h-4 mr-2 text-slate-500" />
                Choose File
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                />
              </label>
              <span className="text-sm text-slate-500 truncate">
                {fileName ? fileName : 'Quy trình quản lý vật tư, thuốc_v99.22.05 (1).docx'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-center gap-3">
          <button 
            onClick={handleSave}
            className="px-8 py-2 bg-[#0A6EBD] text-white rounded-lg font-bold text-sm hover:bg-[#085a9c] transition-colors shadow-sm"
          >
            Lưu
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-slate-500 text-white rounded-lg font-bold text-sm hover:bg-slate-600 transition-colors shadow-sm"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
