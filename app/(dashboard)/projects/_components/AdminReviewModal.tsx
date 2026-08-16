'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ResearchProject, ProposalStatus } from '@/lib/types';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';

interface Props {
  project: ResearchProject;
  onClose: () => void;
  onSuccess: () => void;
}

type ReviewDecision = 'ADMIN_VALIDATED' | 'REVISION_REQUIRED' | 'SCREENING_FAILED';

export function AdminReviewModal({ project, onClose, onSuccess }: Props) {
  const { currentUser } = useAuth();
  const [decision, setDecision] = useState<ReviewDecision>('ADMIN_VALIDATED');
  const [comment, setComment] = useState('');
  const [checklist, setChecklist] = useState({
    investigator: false,
    department: false,
    forms: false,
    signatures: false,
    outline: false,
    budget: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Ngăn scroll body khi mở modal
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const allPassed = Object.values(checklist).every(Boolean);

    if (decision === 'ADMIN_VALIDATED' && !allPassed) {
      alert('Vui lòng đánh dấu hoàn thành tất cả tiêu chí kiểm tra bắt buộc trước khi xác nhận hồ sơ hợp lệ.');
      return;
    }

    if ((decision === 'REVISION_REQUIRED' || decision === 'SCREENING_FAILED') && !comment.trim()) {
      alert(decision === 'REVISION_REQUIRED' ? 'Vui lòng nhập nội dung yêu cầu bổ sung.' : 'Vui lòng nhập lý do từ chối hồ sơ.');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      repo.updateProject(project.id, {
        proposalStatus: decision as ProposalStatus,
        updatedAt: now,
      });

      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        actionCode: `REVIEW_PROPOSAL_${decision}`,
        entityType: 'PROJECT',
        entityId: project.id,
        fromStatus: project.proposalStatus,
        toStatus: decision,
        notes: comment.trim() || 'Hoàn tất kiểm tra hồ sơ (Hợp lệ).',
      });

      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi lưu kết quả thẩm định.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Thẩm định hồ sơ</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Mã hồ sơ: {project.proposalCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-800 line-clamp-2">{project.title}</h3>
            <div className="mt-2 text-xs text-slate-600 font-medium space-y-1">
              <p><span className="text-slate-400">Chủ nhiệm:</span> {project.principalInvestigatorName}</p>
              <p><span className="text-slate-400">Đơn vị:</span> {project.departmentName}</p>
            </div>
          </div>

          <form id="admin-review-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Checklist */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2">1. Kiểm tra thành phần hồ sơ</h4>
              <div className="space-y-2.5">
                {[
                  { key: 'investigator', label: 'Tính hợp lệ của chủ nhiệm đề tài (Không quá hạn, không bị cấm)' },
                  { key: 'department', label: 'Sự đồng ý của Lãnh đạo Khoa/Phòng' },
                  { key: 'forms', label: 'Sử dụng đúng biểu mẫu quy định' },
                  { key: 'signatures', label: 'Đầy đủ chữ ký các thành viên nghiên cứu' },
                  { key: 'outline', label: 'Đề cương chi tiết đính kèm' },
                  { key: 'budget', label: 'Dự toán kinh phí hợp lệ' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-[#0A6EBD] hover:bg-sky-50/30 transition">
                    <input
                      type="checkbox"
                      checked={checklist[key as keyof typeof checklist]}
                      onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0A6EBD] focus:ring-[#0A6EBD]"
                    />
                    <span className="font-medium text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quyết định */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2">2. Kết luận kiểm tra</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition ${decision === 'ADMIN_VALIDATED' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="decision" value="ADMIN_VALIDATED" checked={decision === 'ADMIN_VALIDATED'} onChange={() => setDecision('ADMIN_VALIDATED')} className="sr-only" />
                  <CheckCircle2 className={`w-6 h-6 ${decision === 'ADMIN_VALIDATED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className={`font-bold text-center ${decision === 'ADMIN_VALIDATED' ? 'text-emerald-700' : 'text-slate-600'}`}>Hợp lệ</span>
                </label>

                <label className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition ${decision === 'REVISION_REQUIRED' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="decision" value="REVISION_REQUIRED" checked={decision === 'REVISION_REQUIRED'} onChange={() => setDecision('REVISION_REQUIRED')} className="sr-only" />
                  <AlertCircle className={`w-6 h-6 ${decision === 'REVISION_REQUIRED' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className={`font-bold text-center ${decision === 'REVISION_REQUIRED' ? 'text-amber-700' : 'text-slate-600'}`}>Yêu cầu bổ sung</span>
                </label>

                <label className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition ${decision === 'SCREENING_FAILED' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="decision" value="SCREENING_FAILED" checked={decision === 'SCREENING_FAILED'} onChange={() => setDecision('SCREENING_FAILED')} className="sr-only" />
                  <XCircle className={`w-6 h-6 ${decision === 'SCREENING_FAILED' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className={`font-bold text-center ${decision === 'SCREENING_FAILED' ? 'text-rose-700' : 'text-slate-600'}`}>Từ chối hồ sơ</span>
                </label>
              </div>
            </div>

            {/* Ghi chú */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800">
                Ghi chú / Ý kiến phản hồi {decision !== 'ADMIN_VALIDATED' && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={decision === 'ADMIN_VALIDATED' ? 'Nhập ghi chú thêm (nếu có)...' : 'Nhập chi tiết các nội dung cần bổ sung hoặc lý do từ chối...'}
                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] resize-none h-24"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="admin-review-form"
            disabled={isSubmitting}
            className="px-6 py-2 font-bold text-white bg-[#0A6EBD] rounded-lg hover:bg-[#085896] transition disabled:opacity-50"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
