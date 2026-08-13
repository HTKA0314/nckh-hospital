'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { canReviewAcceptanceDossier, canSubmitAcceptanceDossier } from '@/lib/utils/permissions';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/common/PageHeader';
import { AcceptanceDossier, AcceptanceDossierStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { 
  ArrowLeft, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  FileText,
  FileCheck2,
  ListChecks,
  Check,
  X
} from 'lucide-react';

export default function ProjectAcceptancePage({ params }: { params: { id: string } }) {
  const project = repo.getProjectById(params.id);
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();

  const [dossier, setDossier] = useState<AcceptanceDossier | undefined>(() => project?.acceptanceDossier);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    productsSummary: 'Báo cáo tổng kết đề tài và bài báo tạp chí chuyên ngành đã đăng.',
    productsCommitted: '01 báo cáo khoa học tổng kết, 01 bài báo tạp chí chuyên ngành.',
    productsActual: '01 báo cáo tổng kết hoàn chỉnh, 01 bài báo đã đăng Tạp chí Y học.',
    completionPercentage: 100,
  });

  if (!project) {
    return (
      <div className="text-center py-16 bg-white rounded border border-slate-200 max-w-xl mx-auto">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</h2>
        <Link href="/projects" className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A6EBD] text-white rounded text-xs font-bold shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục đề tài
        </Link>
      </div>
    );
  }

  const handleCreateDossier = (e: React.FormEvent) => {
    e.preventDefault();
    const newDossier: AcceptanceDossier = {
      id: `acc-${Date.now()}`,
      projectId: project.id,
      submissionDate: new Date().toLocaleDateString('vi-VN'),
      productsSummary: formData.productsSummary,
      productsCommitted: formData.productsCommitted,
      productsActual: formData.productsActual,
      completionPercentage: Number(formData.completionPercentage),
      evidenceUrls: [{ name: 'Minh_chung_nghiem_thu.pdf', url: '#' }],
      status: 'SUBMITTED',
      checklistResults: {
        finalReportSubmitted: true,
        productsCompleted: true,
        evidenceValid: true,
        progressReportsCompleted: true,
        noPendingChangeRequests: true,
        ethicsValid: true,
        financeConditionMet: true,
        publicationsIfRequired: true,
      }
    };

    repo.updateProject(project.id, { 
      acceptanceDossier: newDossier,
      status: 'WAITING_ACCEPTANCE'
    });
    setDossier(newDossier);
    setShowAddModal(false);
    success('Đã nộp Hồ sơ Nghiệm thu đề tài thành công! Chờ Phòng NCKH thẩm định.');

    // Add Audit Log
    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'SUBMIT_ACCEPTANCE_DOSSIER',
      entityType: 'ACCEPTANCE',
      entityId: newDossier.id,
      notes: `Chủ nhiệm nộp hồ sơ nghiệm thu đề tài. Số lượng sản phẩm bàn giao thực tế: ${formData.productsActual}`,
    });
  };

  const handleVerifyChecklist = (status: 'ELIGIBLE_FOR_ACCEPTANCE' | 'REVISION_REQUIRED') => {
    if (!dossier) return;

    confirm({
      title: status === 'ELIGIBLE_FOR_ACCEPTANCE' ? 'Xác nhận Đủ điều kiện nghiệm thu' : 'Yêu cầu sửa đổi hồ sơ',
      message: `Bạn chắc chắn muốn đánh giá hồ sơ nghiệm thu này là "${status === 'ELIGIBLE_FOR_ACCEPTANCE' ? 'Đạt' : 'Cần sửa đổi'}"?`,
      confirmLabel: 'Xác nhận',
      onConfirm: () => {
        const updatedDossier: AcceptanceDossier = {
          ...dossier,
          status: status as any,
        };

        repo.updateProject(project.id, { acceptanceDossier: updatedDossier });
        setDossier(updatedDossier);
        success('Đã cập nhật kết quả thẩm định hồ sơ nghiệm thu!');

        // Add Audit Log
        repo.addAuditLog({
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          actionCode: `VERIFY_ACCEPTANCE_${status}`,
          entityType: 'ACCEPTANCE',
          entityId: dossier.id,
          notes: `Đánh giá hồ sơ nghiệm thu: ${status}`,
        });
      }
    });
  };

  const handleApproveAcceptance = () => {
    if (!dossier) return;

    confirm({
      title: 'Xác nhận thông qua Nghiệm thu đề tài',
      message: `Bạn chắc chắn muốn duyệt thông qua nghiệm thu đề tài này? Điều này sẽ chuyển trạng thái đề tài thành ACCEPTED.`,
      confirmLabel: 'Xác nhận',
      onConfirm: () => {
        const updatedDossier: AcceptanceDossier = {
          ...dossier,
          status: 'FORWARDED_TO_COUNCIL', // Chuyển trạng thái hội đồng nghiệm thu thành công
        };

        repo.updateProject(project.id, { 
          acceptanceDossier: updatedDossier,
          status: 'ACCEPTED',
          statusHistory: [
            ...project.statusHistory,
            {
              id: `h-${Date.now()}`,
              projectId: project.id,
              fromStatus: project.status,
              toStatus: 'ACCEPTED',
              changedBy: currentUser.id,
              changedByName: currentUser.fullName,
              userRole: currentUser.role,
              changedAt: new Date().toLocaleString('vi-VN'),
              action: 'Thông qua nghiệm thu chuyên môn của Hội đồng',
            }
          ]
        });
        setDossier(updatedDossier);
        success('Đã duyệt nghiệm thu đề tài thành công!');

        // Add Audit Log
        repo.addAuditLog({
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          actionCode: 'ACCEPTANCE_APPROVED',
          entityType: 'ACCEPTANCE',
          entityId: dossier.id,
          notes: 'Duyệt thông qua nghiệm thu chuyên môn cấp cơ sở',
        });
      }
    });
  };

  const getDossierStatusBadge = (status?: AcceptanceDossierStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="bg-slate-100 text-slate-800 border-slate-200 border text-xs px-2.5 py-0.5 rounded-full font-bold">Dự thảo</span>;
      case 'SUBMITTED':
        return <span className="bg-amber-50 text-amber-850 border-amber-200 border text-xs px-2.5 py-0.5 rounded-full font-bold">Chờ thẩm định</span>;
      case 'UNDER_ADMIN_REVIEW':
        return <span className="bg-blue-50 text-blue-800 border-blue-200 border text-xs px-2.5 py-0.5 rounded-full font-bold">Đang thẩm định hành chính</span>;
      case 'REVISION_REQUIRED':
        return <span className="bg-orange-50 text-orange-850 border-orange-200 border text-xs px-2.5 py-0.5 rounded-full font-bold">Yêu cầu sửa đổi</span>;
      case 'ELIGIBLE_FOR_ACCEPTANCE':
        return <span className="bg-sky-50 text-sky-850 border-sky-200 border text-xs px-2.5 py-0.5 rounded-full font-bold">Đủ điều kiện Nghiệm thu</span>;
      case 'FORWARDED_TO_COUNCIL':
        return <span className="bg-emerald-50 text-emerald-800 border-emerald-200 border text-xs px-2.5 py-0.5 rounded-full font-bold">Đã nghiệm thu (ACCEPTED)</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs px-2.5 py-0.5 rounded-full font-bold">Chưa nộp</span>;
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        title="Hồ sơ Nghiệm thu Đề tài"
        description={`Đề tài: ${project.title}`}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Chi tiết
            </Link>
            {canSubmitAcceptanceDossier(currentUser) && !dossier && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Nộp hồ sơ nghiệm thu
              </button>
            )}
            {canReviewAcceptanceDossier(currentUser) && dossier?.status === 'SUBMITTED' && (
              <>
                <button
                  onClick={() => handleVerifyChecklist('REVISION_REQUIRED')}
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
                >
                  <X className="w-4 h-4" /> Từ chối hành chính
                </button>
                <button
                  onClick={() => handleVerifyChecklist('ELIGIBLE_FOR_ACCEPTANCE')}
                  className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
                >
                  <Check className="w-4 h-4" /> Xác nhận Hợp lệ
                </button>
              </>
            )}
            {canReviewAcceptanceDossier(currentUser) && dossier?.status === 'ELIGIBLE_FOR_ACCEPTANCE' && (
              <button
                onClick={handleApproveAcceptance}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" /> Thông qua Nghiệm thu
              </button>
            )}
          </div>
        }
      />

      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Trạng thái hồ sơ nghiệm thu</span>
          {getDossierStatusBadge(dossier?.status)}
        </div>
        <div className="flex flex-col items-start md:items-end">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mức độ hoàn thành sản phẩm</span>
          {dossier ? (
            <strong className="text-2xl font-mono font-extrabold text-[#0A6EBD]">
              {dossier.completionPercentage}%
            </strong>
          ) : (
            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs px-2.5 py-0.5 rounded-full font-bold mt-0.5">
              Chưa đánh giá
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products comparison */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-500" />
            <span>Đối chiếu sản phẩm khoa học bàn giao</span>
          </h3>

          {dossier ? (
            <div className="space-y-4 text-xs font-medium">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-semibold block mb-1">Sản phẩm cam kết trong Đề cương:</span>
                <p className="text-slate-900 font-bold leading-relaxed">{dossier.productsCommitted}</p>
              </div>

              <div className="bg-emerald-50/20 p-3.5 rounded-xl border border-emerald-100">
                <span className="text-emerald-700 font-bold block mb-1">Sản phẩm thực tế bàn giao:</span>
                <p className="text-slate-900 font-bold leading-relaxed">{dossier.productsActual}</p>
              </div>

              {dossier.productsSummary && (
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Tóm tắt kết quả nghiệm thu:</span>
                  <p className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-slate-600 leading-relaxed font-semibold">
                    {dossier.productsSummary}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl mb-3 text-slate-400">
                <FileCheck2 className="w-8 h-8" />
              </div>
              <h4 className="text-slate-800 font-bold text-[13px] mb-1">Chưa nộp Hồ sơ Nghiệm thu</h4>
              <p className="text-slate-500 text-xs max-w-xs leading-relaxed mb-4">
                Chủ nhiệm đề tài cần khởi tạo và nộp hồ sơ nghiệm thu báo cáo kết quả cùng các sản phẩm nghiên cứu thực tế.
              </p>
              {currentUser.role === 'RESEARCHER' && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white text-[11px] font-bold rounded-lg transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Nộp hồ sơ nghiệm thu
                </button>
              )}
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-slate-500" />
            <span>Checklist điều kiện Nghiệm thu</span>
          </h3>

          <div className="space-y-3.5">
            {[
              { label: 'Nộp báo cáo tổng kết đề tài', val: dossier?.checklistResults?.finalReportSubmitted },
              { label: 'Bàn giao đầy đủ sản phẩm cam kết', val: dossier?.checklistResults?.productsCompleted },
              { label: 'Đầy đủ minh chứng khoa học', val: dossier?.checklistResults?.evidenceValid },
              { label: 'Hoàn thành các mốc báo cáo tiến độ', val: dossier?.checklistResults?.progressReportsCompleted },
              { label: 'Không có yêu cầu điều chỉnh nào đang treo', val: dossier?.checklistResults?.noPendingChangeRequests },
              { label: 'Thời hạn hiệu lực chấp thuận IRB hợp lệ', val: dossier?.checklistResults?.ethicsValid },
              { label: 'Đủ điều kiện thanh quyết toán tài chính', val: dossier?.checklistResults?.financeConditionMet },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 text-xs font-semibold">
                <span className="text-slate-600 leading-snug">{item.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  item.val 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                }`}>
                  {item.val ? 'ĐẠT' : 'CHƯA'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Dossier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleCreateDossier}>
              <div className="px-5 py-4 border-b border-slate-100 bg-[#0B2A63] text-white flex justify-between items-center">
                <h3 className="font-bold text-sm">Nộp Hồ sơ Nghiệm thu đề tài</h3>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Sản phẩm cam kết (theo đề cương) *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none"
                    value={formData.productsCommitted}
                    onChange={(e) => setFormData({ ...formData, productsCommitted: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Sản phẩm thực tế bàn giao *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none"
                    value={formData.productsActual}
                    onChange={(e) => setFormData({ ...formData, productsActual: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">% Hoàn thành thực tế *</label>
                  <input
                    type="number"
                    max={100}
                    min={0}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none font-mono"
                    value={formData.completionPercentage}
                    onChange={(e) => setFormData({ ...formData, completionPercentage: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Tóm tắt kết quả khoa học đạt được</label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none"
                    placeholder="Mô tả tóm tắt các sản phẩm và đóng góp mới của đề tài..."
                    value={formData.productsSummary}
                    onChange={(e) => setFormData({ ...formData, productsSummary: e.target.value })}
                  />
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100">Hủy</button>
                <button type="submit" className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-xl shadow-xs">Nộp hồ sơ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
