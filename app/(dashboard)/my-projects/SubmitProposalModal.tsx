'use client';

import React, { useEffect, useState } from 'react';
import { Send, Upload, X } from 'lucide-react';
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
  onSubmit: (payload: SubmitOutlinePayload) => Promise<void>;
}

const ALLOWED_EXTENSIONS = ['doc', 'docx', 'pdf'];
const MAX_FILE_SIZE_MB = 20;

export function SubmitOutlineModal({
  isOpen,
  onClose,
  projectId,
  displayCode,
  onSubmit,
}: SubmitOutlineModalProps) {
  const { warning, error } = useToast();

  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFromMonth('');
    setToMonth('');
    setFile(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  if (!isOpen) return null;

  const validateFile = (selectedFile: File): string | null => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return 'Tệp đề cương chỉ hỗ trợ định dạng DOC, DOCX hoặc PDF.';
    }

    const fileSizeMb = selectedFile.size / 1024 / 1024;

    if (fileSizeMb > MAX_FILE_SIZE_MB) {
      return `Dung lượng tệp không được vượt quá ${MAX_FILE_SIZE_MB} MB.`;
    }

    return null;
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      warning('Vui lòng chọn tệp đề cương trước khi nộp.');
      return;
    }

    const fileValidationMessage = validateFile(file);

    if (fileValidationMessage) {
      warning(fileValidationMessage);
      return;
    }

    try {
      setIsSubmitting(true);

      await onSubmit({
        projectId,
        fromMonth,
        toMonth,
        file,
      });

      resetForm();
      onClose();
    } catch {
      error('Không thể nộp đề cương. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-outline-title"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2
              id="submit-outline-title"
              className="text-base font-semibold text-slate-900"
            >
              Nộp đề cương chi tiết
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hồ sơ: {displayCode || '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Thời gian thực hiện dự kiến
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="outline-from-month"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Từ tháng <span className="text-rose-500">*</span>
                </label>
                <input
                  id="outline-from-month"
                  type="month"
                  value={fromMonth}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFromMonth(value);

                    if (toMonth && toMonth < value) {
                      setToMonth('');
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0A6EBD] focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="outline-to-month"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Đến tháng <span className="text-rose-500">*</span>
                </label>
                <input
                  id="outline-to-month"
                  type="month"
                  value={toMonth}
                  min={fromMonth || undefined}
                  disabled={isSubmitting}
                  onChange={(e) => setToMonth(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0A6EBD] focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Tệp đề cương
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Hỗ trợ DOC, DOCX hoặc PDF. Dung lượng tối đa{' '}
                {MAX_FILE_SIZE_MB} MB.
              </p>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-sky-300 hover:bg-sky-50/40">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                  <Upload className="h-4 w-4 text-[#0A6EBD]" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {file ? file.name : 'Chọn tệp đề cương'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                      : 'Nhấn để chọn tệp từ máy tính'}
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                {file ? 'Thay tệp' : 'Chọn tệp'}
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
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0A6EBD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085896] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Đang nộp...' : 'Nộp đề cương'}
          </button>
        </div>
      </div>
    </div>
  );
}