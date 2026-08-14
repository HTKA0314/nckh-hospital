'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Send, Upload, X, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export type SubmitOutlinePayload = {
  projectId: string;
  fromMonth: string;
  toMonth: string;
  file: File;
};

interface SubmitOutlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  displayCode: string;
  defaultFromMonth?: string;
  defaultToMonth?: string;
  onSubmit: (payload: SubmitOutlinePayload) => Promise<void>;
}

const ALLOWED_EXTENSIONS = ['doc', 'docx', 'pdf'];
const MAX_FILE_SIZE_MB = 20;

export function SubmitOutlineModal({
  isOpen,
  onClose,
  projectId,
  displayCode,
  defaultFromMonth = '',
  defaultToMonth = '',
  onSubmit,
}: SubmitOutlineModalProps) {
  const { warning, error } = useToast();

  const [fromMonth, setFromMonth] = useState(defaultFromMonth);
  const [toMonth, setToMonth] = useState(defaultToMonth);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFromMonth(defaultFromMonth);
    setToMonth(defaultToMonth);
    setFile(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setFromMonth(defaultFromMonth);
      setToMonth(defaultToMonth);
      setFile(null);
    }
  }, [isOpen, defaultFromMonth, defaultToMonth]);

  if (!isOpen) return null;

  const validateFile = (selectedFile: File): string | null => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return 'Tệp đề cương chỉ hỗ trợ định dạng .doc, .docx hoặc .pdf';
    }

    if (selectedFile.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
      return `Dung lượng tệp vượt quá giới hạn ${MAX_FILE_SIZE_MB} MB.`;
    }

    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationMessage = validateFile(selectedFile);
    if (validationMessage) {
      warning(validationMessage);
      event.target.value = '';
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!projectId) {
      error('Không xác định được đề tài cần nộp đề cương.');
      return;
    }

    if (!fromMonth || !toMonth) {
      warning('Vui lòng chọn đầy đủ thời gian thực hiện dự kiến.');
      return;
    }

    if (toMonth < fromMonth) {
      warning('Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu.');
      return;
    }

    if (!file) {
      warning('Vui lòng chọn tệp đề cương chi tiết trước khi nộp.');
      return;
    }

    const fileValidationMessage = validateFile(file);
    if (fileValidationMessage) {
      warning(fileValidationMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({ projectId, fromMonth, toMonth, file });
      resetForm();
    } catch {
      error('Không thể nộp đề cương. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-outline-title"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER MODAL */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-[#0B2A63] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="submit-outline-title"
                className="text-sm font-bold text-white"
              >
                Đính kèm Thuyết minh đề cương
              </h2>
              <p className="text-[11px] text-white/80 font-mono mt-0.5">
                Mã đề xuất: {displayCode || '—'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* BODY MODAL */}
        <div className="space-y-5 px-6 py-5">
          {/* Thời gian dự kiến */}
          <section className="space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                1. Thời gian thực hiện dự kiến
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                Thời gian dự kiến được lưu cùng hồ sơ đề cương.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  Từ tháng <span className="text-rose-500">*</span>
                </span>
                <input
                  type="month"
                  value={fromMonth}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFromMonth(value);
                    if (toMonth && toMonth < value) setToMonth('');
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-[#0A6EBD] disabled:bg-slate-100 font-medium"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  Đến tháng <span className="text-rose-500">*</span>
                </span>
                <input
                  type="month"
                  value={toMonth}
                  min={fromMonth || undefined}
                  disabled={isSubmitting}
                  onChange={(event) => setToMonth(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-[#0A6EBD] disabled:bg-slate-100 font-medium"
                />
              </label>
            </div>
          </section>

          {/* Tải tệp đề cương */}
          <section className="space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                2. Tệp Thuyết minh Đề cương chi tiết (BM2)
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                Định dạng hỗ trợ: .doc, .docx, .pdf (Dung lượng tối đa {MAX_FILE_SIZE_MB} MB).
              </p>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3.5 transition hover:border-[#0A6EBD] hover:bg-sky-50/30">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-2xs">
                  <Upload className="h-4 w-4 text-[#0A6EBD]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {file ? file.name : 'Nhấp để chọn tệp từ máy tính'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400 font-mono">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                      : 'Chưa có tệp nào được chọn'}
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                {file ? 'Thay tệp khác' : 'Chọn tệp'}
              </span>

              <input
                type="file"
                accept=".doc,.docx,.pdf"
                disabled={isSubmitting}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </section>

          {/* Ghi chú Y tế Chuyên nghiệp */}
          <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/50 p-3 text-[11px] leading-relaxed text-sky-900">
            <ShieldCheck className="h-4 w-4 text-[#0A6EBD] shrink-0 mt-0.5" />
            <span>
              Đề cương sau khi nộp được chuyển sang bước tổ chức xét duyệt khoa học theo quy trình.
            </span>
          </div>
        </div>

        {/* FOOTER BẤM MẠNH TỰ TIN */}
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] px-4 py-2 text-xs font-bold text-white transition shadow-2xs cursor-pointer disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            {isSubmitting ? 'Đang nộp...' : 'Nộp đề cương'}
          </button>
        </footer>
      </div>
    </div>
  );
}