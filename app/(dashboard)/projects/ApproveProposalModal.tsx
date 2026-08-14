'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';

interface ApproveProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectCode?: string;
  projectTitle?: string;
  onSuccess?: () => void;
}

export function ApproveProposalModal({
  isOpen,
  onClose,
  projectId,
  projectCode,
  projectTitle,
  onSuccess,
}: ApproveProposalModalProps) {
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();

  const [code, setCode] = useState(
    projectCode || `DT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectCode) {
      setCode(projectCode);
    } else {
      setCode(`DT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    }
  }, [projectCode, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!code.trim()) {
      warning('Vui lòng nhập Mã đề tài nghiên cứu chính thức.');
      return;
    }

    if (!currentUser) {
      warning('Phiên đăng nhập không hợp lệ.');
      return;
    }

    try {
      setIsSubmitting(true);
      const now = new Date().toISOString();

      if (projectId) {
        const project = repo.getProjectById(projectId);

        // Cập nhật trạng thái đề tài sau khi duyệt đề cương
        repo.updateProject(projectId, {
          projectCode: code.trim(),
          proposalStatus: 'PROPOSAL_APPROVED',
          status: project?.ethicsRequired && project?.ethicsStatus !== 'ETHICS_APPROVED'
            ? project.status
            : 'WAITING_ASSIGNMENT', // Sẵn sàng để lập Quyết định giao thực hiện
          updatedAt: now,
        });

        // Ghi vết Audit Log
        repo.addAuditLog({
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          entityType: 'PROJECT',
          entityId: projectId,
          actionCode: 'APPROVE_PROPOSAL',
          notes: `Phê duyệt thuyết minh đề cương và cấp mã đề tài chính thức: ${code.trim()}`,
        });
      }

      success(`Đã phê duyệt đề cương và cấp mã đề tài ${code.trim()} thành công!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      error('Không thể phê duyệt đề cương. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 text-xs">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-[#0B2A63] text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Phê duyệt thuyết minh đề cương
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-5 space-y-4">
          {projectTitle && (
            <div className="bg-sky-50/60 p-3 rounded-lg border border-sky-100">
              <span className="font-bold text-slate-700 block mb-0.5">Tên đề tài:</span>
              <p className="text-slate-900 font-semibold leading-snug line-clamp-2">
                {projectTitle}
              </p>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mã đề tài chính thức (Cấp theo quy định) *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ví dụ: DT-2026-001"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0A6EBD]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tệp thuyết minh đề cương đã phê duyệt (Có chữ ký/con dấu)
            </label>
            <div className="flex items-center gap-2.5">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-200 transition font-bold text-slate-700 whitespace-nowrap shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Chọn tệp
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                />
              </label>
              <span className="text-[11px] text-slate-500 truncate flex-1 font-medium">
                {fileName ? fileName : 'Chưa chọn tệp đính kèm'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition cursor-pointer"
          >
            {isSubmitting ? 'Đang lưu...' : 'Xác nhận phê duyệt'}
          </button>
        </div>
      </div>
    </div>
  );
}