'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { ResearchProject, ProposalStatus } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatVND } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Search,
  Eye,
  Send,
  RotateCcw,
  Check,
  X,
  Printer,
  MessageSquare,
  Filter,
} from 'lucide-react';

export default function ReviewWorkspacePage() {
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();
  const [projects, setProjects] = useState<ResearchProject[]>(repo.getProjects());
  const departments = repo.getDepartments();
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Review modal / form state
  const [reviewAction, setReviewAction] = useState<'VALID' | 'REVISION_REQUIRED' | 'REJECTED' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [checklist, setChecklist] = useState({
    validTarget: true,
    fullDocs: true,
    budgetCompliant: true,
    ethicsDeclared: true,
  });

  const canReview = ['RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN'].includes(currentUser.role);

  // Lọc các hồ sơ đang trong giai đoạn thẩm định
  const pendingProjects = projects.filter((p) => {
    const isUnderReview = ['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'RESUBMITTED', 'REVISION_REQUIRED'].includes(p.proposalStatus);
    if (!isUnderReview) return false;
    if (selectedDept !== 'ALL' && p.departmentId !== selectedDept) return false;
    if (selectedStatus !== 'ALL' && p.proposalStatus !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.proposalCode.toLowerCase().includes(q) ||
        p.principalInvestigatorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allReviewCount = projects.filter((p) =>
    ['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'RESUBMITTED', 'REVISION_REQUIRED'].includes(p.proposalStatus)
  ).length;

  const pagedProjects = pendingProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasFilters = selectedDept !== 'ALL' || selectedStatus !== 'ALL' || search.trim();

  const handleOpenReview = (p: ResearchProject) => {
    setSelectedProject(p);
    setReviewAction(null);
    setReviewComment('');
    setChecklist({
      validTarget: true,
      fullDocs: true,
      budgetCompliant: true,
      ethicsDeclared: true,
    });
  };

  const executeSubmitReview = () => {
    if (!selectedProject || !reviewAction) return;

    const nextProposalStatus: ProposalStatus = reviewAction;
    const isApproved = reviewAction === 'VALID';

    const updated = repo.updateProject(selectedProject.id, {
      proposalStatus: nextProposalStatus,
      status: isApproved ? 'PROPOSAL_APPROVED' : selectedProject.status,
      statusHistory: [
        ...selectedProject.statusHistory,
        {
          id: `h-${Date.now()}`,
          projectId: selectedProject.id,
          fromStatus: selectedProject.proposalStatus,
          toStatus: nextProposalStatus,
          changedBy: currentUser.id,
          changedByName: currentUser.fullName,
          userRole: currentUser.role,
          changedAt: new Date().toLocaleString('vi-VN'),
          action:
            reviewAction === 'VALID'
              ? 'Thẩm định hồ sơ HỢP LỆ (Chuyển HĐ xét duyệt)'
              : reviewAction === 'REVISION_REQUIRED'
              ? 'Yêu cầu Bổ sung hồ sơ'
              : 'Từ chối hồ sơ đề xuất',
          comment: reviewComment,
        },
      ],
    });

    if (updated) {
      repo.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: `REVIEW_PROPOSAL_${reviewAction}`,
        entityType: 'ResearchProject',
        entityId: selectedProject.id,
        details: `Phòng NCKH thẩm định hồ sơ đề tài ${selectedProject.proposalCode}: ${reviewAction}. Ý kiến: ${reviewComment}`,
      });

      // Tạo thông báo cho Chủ nhiệm đề tài
      repo.addNotification({
        userId: selectedProject.principalInvestigatorId,
        title: `Kết quả thẩm định hồ sơ đề tài ${selectedProject.proposalCode}`,
        content:
          reviewAction === 'VALID'
            ? `Hồ sơ đề tài "${selectedProject.title}" đã được Phòng NCKH thẩm định HỢP LỆ và chuyển Hội đồng.`
            : reviewAction === 'REVISION_REQUIRED'
            ? `Hồ sơ đề tài "${selectedProject.title}" cần bổ sung theo ý kiến thẩm định: ${reviewComment}`
            : `Hồ sơ đề tài "${selectedProject.title}" đã bị từ chối tiếp nhận.`,
        type: reviewAction === 'VALID' ? 'SUCCESS' : reviewAction === 'REVISION_REQUIRED' ? 'WARNING' : 'ERROR',
        link: `/projects/${selectedProject.id}`,
      });

      if (reviewAction === 'VALID') {
        success(`Đã phê duyệt hồ sơ ${selectedProject.proposalCode} hợp lệ & chuyển Hội đồng xét duyệt!`, 'Thẩm định thành công');
      } else if (reviewAction === 'REVISION_REQUIRED') {
        warning(`Đã gửi yêu cầu bổ sung hồ sơ cho đề tài ${selectedProject.proposalCode}`, 'Yêu cầu bổ sung');
      } else {
        error(`Đã từ chối tiếp nhận hồ sơ đề tài ${selectedProject.proposalCode}`, 'Từ chối hồ sơ');
      }

      setProjects(repo.getProjects());
      setSelectedProject(null);
    }
  };

  const handleSubmitReview = () => {
    if (!selectedProject || !reviewAction) return;
    if (!reviewComment.trim()) {
      warning('Vui lòng nhập ý kiến / kết luận thẩm định hồ sơ', 'Thiếu ý kiến kết luận');
      return;
    }

    const actionText =
      reviewAction === 'VALID'
        ? 'Phê duyệt HỢP LỆ và chuyển Hội đồng xét duyệt'
        : reviewAction === 'REVISION_REQUIRED'
        ? 'Yêu cầu BỔ SUNG hồ sơ'
        : 'TỪ CHỐI tiếp nhận hồ sơ';

    confirm({
      title: `Xác nhận kết luận thẩm định hồ sơ`,
      message: `Bạn có chắc chắn muốn xác nhận kết luận "${actionText}" cho đề tài ${selectedProject.proposalCode} - "${selectedProject.title}"?`,
      confirmLabel: 'Xác nhận kết luận',
      type: reviewAction === 'REJECTED' ? 'danger' : reviewAction === 'REVISION_REQUIRED' ? 'warning' : 'info',
      onConfirm: () => executeSubmitReview(),
    });
  };

  if (!canReview) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
        <h3 className="text-sm font-bold text-amber-900">Giới hạn Quyền truy cập</h3>
        <p className="text-xs text-amber-700">
          Chức năng Workspace Thẩm định hồ sơ chỉ dành cho Chuyên viên Phòng NCKH, Ban Giám đốc và Quản trị hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-slate-800">
      {/* ── Toolbar: Search + Actions trên 1 hàng ── */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đề xuất, tên đề tài, chủ nhiệm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] text-[13px] outline-none bg-white shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
        >
          <Printer className="w-3.5 h-3.5" /> In danh mục
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-2.5">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className={`py-1.5 px-3 rounded-lg border text-[13px] font-medium outline-none transition ${
            selectedDept !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả Khoa / Phòng</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={`py-1.5 px-3 rounded-lg border text-[13px] font-medium outline-none transition ${
            selectedStatus !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả trạng thái thẩm định</option>
          <option value="SUBMITTED">Mới nộp đề xuất</option>
          <option value="UNDER_ADMIN_REVIEW">Đang thẩm định tính hợp lệ</option>
          <option value="REVISION_REQUIRED">Yêu cầu bổ sung</option>
          <option value="RESUBMITTED">Đã nộp lại bổ sung</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSelectedDept('ALL'); setSelectedStatus('ALL'); setSearch(''); }}
            className="text-[12px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 transition"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400 font-medium">
          <strong className="text-slate-700 font-mono font-bold">{pendingProjects.length}</strong> / {allReviewCount} hồ sơ chờ thẩm định
        </span>
      </div>

      {/* ── Main Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 w-28 whitespace-nowrap">MÃ ĐỀ XUẤT</th>
                <th className="px-4 py-3 min-w-[280px]">TÊN ĐỀ TÀI NGHIÊN CỨU</th>
                <th className="px-4 py-3 w-44 whitespace-nowrap">CHỦ NHIỆM ĐỀ TÀI</th>
                <th className="px-4 py-3 w-40 whitespace-nowrap">KHOA/PHÒNG</th>
                <th className="px-4 py-3 text-right w-36 whitespace-nowrap">DỰ TOÁN</th>
                <th className="px-4 py-3 w-36 text-center whitespace-nowrap">TRẠNG THÁI HỒ SƠ</th>
                <th className="px-4 py-3 text-center w-28 whitespace-nowrap">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Hiện không có hồ sơ nào đang chờ thẩm định
                  </td>
                </tr>
              ) : (
                pagedProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-[#0A6EBD] whitespace-nowrap align-middle">
                      <Link href={`/projects/${p.id}`} className="hover:underline">
                        {p.proposalCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Link href={`/projects/${p.id}`} className="font-semibold text-slate-900 hover:text-[#0A6EBD] line-clamp-1">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap align-middle">{p.principalInvestigatorName}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap align-middle">{p.departmentName}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 text-right whitespace-nowrap align-middle">
                      {formatVND(p.estimatedBudget)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap align-middle">
                      <StatusBadge status={p.proposalStatus} />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap align-middle">
                      <button
                        onClick={() => handleOpenReview(p)}
                        className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow-xs"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Thẩm định
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalItems={pendingProjects.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="hồ sơ"
      />

      {/* Thẩm định Drawer / Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="font-mono text-xs font-bold text-[#0A6EBD] bg-[#EBF4FC] px-2.5 py-0.5 rounded-md border border-[#B8D7F5]">
                  {selectedProject.proposalCode}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1 leading-snug">
                  {selectedProject.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Checklist thẩm định tiêu chuẩn Thông tư 09/2024 */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                Biên bản Kiểm tra Tính Hợp lệ của Hồ sơ
              </span>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={checklist.validTarget}
                  onChange={(e) => setChecklist({ ...checklist, validTarget: e.target.checked })}
                  className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD]"
                />
                <span>1. Đúng đối tượng và tiêu chuẩn Chủ nhiệm đề tài theo quy chế</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={checklist.fullDocs}
                  onChange={(e) => setChecklist({ ...checklist, fullDocs: e.target.checked })}
                  className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD]"
                />
                <span>2. Đầy đủ các tài liệu theo danh mục (Đơn, Đề cương chi tiết, CV, Dự toán)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={checklist.budgetCompliant}
                  onChange={(e) => setChecklist({ ...checklist, budgetCompliant: e.target.checked })}
                  className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD]"
                />
                <span>3. Dự toán kinh phí tuân thủ đúng định mức tài chính hiện hành</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={checklist.ethicsDeclared}
                  onChange={(e) => setChecklist({ ...checklist, ethicsDeclared: e.target.checked })}
                  className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD]"
                />
                <span>4. Đã sàng lọc và khai báo hồ sơ Đạo đức y sinh (Thông tư 43/2024)</span>
              </label>
            </div>

            {/* Tài liệu đính kèm để xem */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800">Tài liệu đã nộp ({selectedProject.documents.length}):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedProject.documents.map((d) => (
                  <div key={d.id} className="p-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <span className="font-medium text-slate-800 truncate max-w-[180px]">{d.title}</span>
                    <button
                      onClick={() => alert(`Xem file ${d.title}`)}
                      className="text-[#0A6EBD] hover:underline font-bold text-[11px]"
                    >
                      Xem tài liệu
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quyết định thẩm định */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-800 block">Kết luận Thẩm định:</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setReviewAction('VALID')}
                  className={`p-2.5 rounded-lg border font-bold flex flex-col items-center gap-1 transition ${
                    reviewAction === 'VALID'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>HỢP LỆ (ĐẠT)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction('REVISION_REQUIRED')}
                  className={`p-2.5 rounded-lg border font-bold flex flex-col items-center gap-1 transition ${
                    reviewAction === 'REVISION_REQUIRED'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  <span>YÊU CẦU BỔ SUNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction('REJECTED')}
                  className={`p-2.5 rounded-lg border font-bold flex flex-col items-center gap-1 transition ${
                    reviewAction === 'REJECTED'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>TỪ CHỐI TIẾP NHẬN</span>
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Ý kiến thẩm định & Yêu cầu chỉnh sửa chi tiết (*):
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ghi rõ nội dung đề xuất đạt chuẩn hoặc các điểm cần chỉnh sửa bổ sung..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Đóng lại
              </button>
              <button
                type="button"
                disabled={!reviewAction}
                onClick={handleSubmitReview}
                className="px-4 py-1.5 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold disabled:opacity-40 transition shadow-xs"
              >
                Lưu & Xác nhận Thẩm định
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
