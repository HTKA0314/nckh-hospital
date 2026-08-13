'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { ResearchProject, ProposalStatus, AcceptanceDossierStatus } from '@/lib/types';
import { canReviewProposal } from '@/lib/utils/permissions';
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
  FileBox,
  Award
} from 'lucide-react';

function ReviewWorkspaceContent() {
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();
  const [projects, setProjects] = useState<ResearchProject[]>(repo.getProjects());
  const departments = repo.getDepartments();
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);

  const searchParams = useSearchParams();
  const urlId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<'PROPOSAL' | 'ACCEPTANCE'>('PROPOSAL');

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Review modal / form state
  const [reviewAction, setReviewAction] = useState<any>(null); // 'ADMIN_VALIDATED' / 'ELIGIBLE' / 'REVISION_REQUIRED' / 'REJECTED'
  const [reviewComment, setReviewComment] = useState('');
  const [checklist, setChecklist] = useState({
    validTarget: true,
    fullDocs: true,
    budgetCompliant: true,
    ethicsDeclared: true,
  });

  const canReview = canReviewProposal(currentUser);

  // Proposal pending
  const proposalProjects = projects.filter((p) => {
    return ['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'RESUBMITTED', 'REVISION_REQUIRED'].includes(p.proposalStatus);
  });
  
  // Acceptance pending
  const acceptanceProjects = projects.filter((p) => {
    return p.acceptanceDossier && ['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'RESUBMITTED', 'REVISION_REQUIRED'].includes(p.acceptanceDossier.status);
  });

  const activeProjectsList = activeTab === 'PROPOSAL' ? proposalProjects : acceptanceProjects;

  // Lọc
  const pendingProjects = activeProjectsList.filter((p) => {
    if (selectedDept !== 'ALL' && p.departmentId !== selectedDept) return false;
    
    if (selectedStatus !== 'ALL') {
      const statusCheck = activeTab === 'PROPOSAL' ? p.proposalStatus : p.acceptanceDossier?.status;
      if (statusCheck !== selectedStatus) return false;
    }
    
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

  const pagedProjects = pendingProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasFilters = selectedDept !== 'ALL' || selectedStatus !== 'ALL' || search.trim();

  useEffect(() => {
    if (urlId) {
      const p = projects.find(proj => proj.id === urlId);
      if (p) {
        setSelectedProject(p);
        setReviewAction(null);
        setReviewComment('');
        setChecklist({
          validTarget: true,
          fullDocs: true,
          budgetCompliant: true,
          ethicsDeclared: true,
        });
      }
    }
  }, [urlId, projects]);

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

    if (activeTab === 'PROPOSAL') {
        const nextProposalStatus: ProposalStatus = reviewAction;
        const isApproved = reviewAction === 'ADMIN_VALIDATED';
    
        const updated = repo.updateProject(selectedProject.id, {
          proposalStatus: nextProposalStatus,
        });
        
        if (updated) {
          repo.addAuditLog({
            userId: currentUser.id,
            userFullName: currentUser.fullName,
            userRole: currentUser.role,
            actionCode: `REVIEW_PROPOSAL_${reviewAction}`,
            entityType: 'PROJECT',
            entityId: selectedProject.id,
            notes: `Phòng NCKH thẩm định hồ sơ đề tài ${selectedProject.proposalCode}: ${reviewAction}. Ý kiến: ${reviewComment}`,
          });
          
          if (reviewAction === 'ADMIN_VALIDATED') {
            success(`Đã phê duyệt hồ sơ ${selectedProject.proposalCode} hợp lệ & chuyển HĐ xét duyệt!`, 'Thành công');
          } else {
            warning(`Đã xử lý hồ sơ đề tài ${selectedProject.proposalCode}`, 'Thành công');
          }
        }
    } else {
        // Acceptance
        const updated = repo.updateProject(selectedProject.id, {
            acceptanceDossier: {
                ...selectedProject.acceptanceDossier!,
                status: reviewAction // ELIGIBLE, REVISION_REQUIRED
            }
        });
        
        if (updated) {
          repo.addAuditLog({
            userId: currentUser.id,
            userFullName: currentUser.fullName,
            userRole: currentUser.role,
            actionCode: `REVIEW_ACCEPTANCE_${reviewAction}`,
            entityType: 'PROJECT',
            entityId: selectedProject.id,
            notes: `Phòng NCKH thẩm định hồ sơ nghiệm thu ${selectedProject.proposalCode}: ${reviewAction}. Ý kiến: ${reviewComment}`,
          });
          
          if (reviewAction === 'ELIGIBLE') {
            success(`Đã phê duyệt hồ sơ NT ${selectedProject.proposalCode} hợp lệ & chuyển HĐ nghiệm thu!`, 'Thành công');
          } else {
            warning(`Đã xử lý hồ sơ NT đề tài ${selectedProject.proposalCode}`, 'Thành công');
          }
        }
    }

    setProjects(repo.getProjects());
    setSelectedProject(null);
  };

  const handleSubmitReview = () => {
    if (!selectedProject || !reviewAction) return;
    if (!reviewComment.trim()) {
      warning('Vui lòng nhập ý kiến / kết luận thẩm định hồ sơ', 'Thiếu ý kiến kết luận');
      return;
    }

    let actionText = '';
    if (activeTab === 'PROPOSAL') {
      actionText = reviewAction === 'ADMIN_VALIDATED' ? 'Phê duyệt HỢP LỆ' : reviewAction === 'REVISION_REQUIRED' ? 'Yêu cầu BỔ SUNG' : 'TỪ CHỐI tiếp nhận';
    } else {
      actionText = reviewAction === 'ELIGIBLE' ? 'Xác nhận ĐỦ ĐIỀU KIỆN' : 'Yêu cầu BỔ SUNG';
    }

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
    <section aria-labelledby="workspace-heading" className="space-y-3 text-slate-800">
      <h2 id="workspace-heading" className="sr-only">Phân hệ Thẩm định hồ sơ</h2>

      {/* TABS */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 mt-2">
        <button
          onClick={() => { setActiveTab('PROPOSAL'); setCurrentPage(1); setSelectedStatus('ALL'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'PROPOSAL' 
              ? 'text-[#0A6EBD] border-[#0A6EBD] bg-sky-50/50' 
              : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileBox className="w-4 h-4" />
          Thẩm định Đề xuất
          <span className="ml-1.5 bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{proposalProjects.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('ACCEPTANCE'); setCurrentPage(1); setSelectedStatus('ALL'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'ACCEPTANCE' 
              ? 'text-[#0A6EBD] border-[#0A6EBD] bg-sky-50/50' 
              : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          Thẩm định Nghiệm thu
          <span className="ml-1.5 bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{acceptanceProjects.length}</span>
        </button>
      </div>

      {/* ── Single Workspace Header Card: Search + Filters + Actions ── */}
      <header className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-3 flex flex-wrap items-center justify-between gap-3 select-none mt-2">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Tìm kiếm hồ sơ"
              placeholder="Tìm theo mã đề xuất, tên đề tài, chủ nhiệm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] text-[13px] outline-none bg-white shadow-2xs"
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

          {/* Department Select */}
          <select
            aria-label="Khoa phòng công tác"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className={`py-2 px-3 rounded-lg border text-[13px] font-semibold outline-none transition cursor-pointer ${
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

          {/* Status Select */}
          <select
            aria-label="Trạng thái thẩm định"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`py-2 px-3 rounded-lg border text-[13px] font-semibold outline-none transition cursor-pointer ${
              selectedStatus !== 'ALL'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
                : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            <option value="ALL">Tất cả trạng thái thẩm định</option>
            <option value="SUBMITTED">Mới nộp</option>
            <option value="UNDER_ADMIN_REVIEW">Đang thẩm định tính hợp lệ</option>
            <option value="REVISION_REQUIRED">Yêu cầu bổ sung</option>
            <option value="RESUBMITTED">Đã nộp lại bổ sung</option>
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSelectedDept('ALL'); setSelectedStatus('ALL'); setSearch(''); }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-100 transition-all shadow-2xs cursor-pointer animate-in fade-in"
            >
              <X className="w-3 h-3 stroke-[2.5]" /> Xóa bộ lọc
            </button>
          )}
        </div>
      </header>

      {/* ── Main Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px] text-slate-750">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700 select-none">
              <tr className="border-l-4 border-l-transparent">
                <th className="px-4 py-3.5 w-28 whitespace-nowrap">MÃ ĐỀ XUẤT</th>
                <th className="px-4 py-3.5 min-w-[280px]">TÊN ĐỀ TÀI NGHIÊN CỨU</th>
                <th className="px-4 py-3.5 w-44 whitespace-nowrap">CHỦ NHIỆM ĐỀ TÀI</th>
                <th className="px-4 py-3.5 w-40 whitespace-nowrap">KHOA/PHÒNG</th>
                <th className="px-4 py-3.5 text-center w-36 whitespace-nowrap">TRẠNG THÁI</th>
                <th className="px-4 py-3.5 text-center w-28 whitespace-nowrap">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 text-slate-800">
              {pendingProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Hiện không có hồ sơ nào đang chờ thẩm định
                  </td>
                </tr>
              ) : (
                pagedProjects.map((p) => (
                  <tr key={p.id} className="border-l-4 border-l-transparent hover:border-l-[#0A6EBD] hover:bg-sky-50/45 transition-all duration-150 cursor-pointer">
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
                    <td className="px-4 py-3 text-center whitespace-nowrap align-middle">
                      <StatusBadge status={activeTab === 'PROPOSAL' ? p.proposalStatus : p.acceptanceDossier?.status || p.status} />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap align-middle">
                      <button
                        onClick={() => handleOpenReview(p)}
                        className="inline-flex items-center gap-1 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition shadow-2xs"
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

      {/* Thẩm định Modal */}
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

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                Biên bản Kiểm tra Tính Hợp lệ của Hồ sơ {activeTab === 'PROPOSAL' ? 'Đề Xuất' : 'Nghiệm Thu'}
              </span>
              
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input type="checkbox" checked={checklist.validTarget} onChange={(e) => setChecklist({ ...checklist, validTarget: e.target.checked })} className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD]" />
                <span>1. {activeTab === 'PROPOSAL' ? 'Đúng đối tượng và tiêu chuẩn Chủ nhiệm đề tài theo quy chế' : 'Đã nộp báo cáo tổng kết hoàn chỉnh đúng form'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input type="checkbox" checked={checklist.fullDocs} onChange={(e) => setChecklist({ ...checklist, fullDocs: e.target.checked })} className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD]" />
                <span>2. {activeTab === 'PROPOSAL' ? 'Đầy đủ các tài liệu theo danh mục (Đơn, Đề cương chi tiết, CV, Dự toán)' : 'Đầy đủ các minh chứng kết quả nghiên cứu (Bài báo, Quyết định...)'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input type="checkbox" checked={checklist.budgetCompliant} onChange={(e) => setChecklist({ ...checklist, budgetCompliant: e.target.checked })} className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD]" />
                <span>3. {activeTab === 'PROPOSAL' ? 'Dự toán kinh phí tuân thủ đúng định mức tài chính hiện hành' : 'Báo cáo quyết toán kinh phí đầy đủ và hợp lệ'}</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-800">Tài liệu đã nộp:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedProject.documents.map((d) => (
                  <div key={d.id} className="p-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <span className="font-medium text-slate-800 truncate max-w-[180px]">{d.title}</span>
                    <button className="text-[#0A6EBD] hover:underline font-bold text-[11px]">Xem tài liệu</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-800 block">Kết luận Thẩm định:</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setReviewAction(activeTab === 'PROPOSAL' ? 'ADMIN_VALIDATED' : 'ELIGIBLE')}
                  className={`p-2.5 rounded-lg border font-bold flex flex-col items-center gap-1 transition ${
                    reviewAction === (activeTab === 'PROPOSAL' ? 'ADMIN_VALIDATED' : 'ELIGIBLE')
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

                {activeTab === 'PROPOSAL' && (
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
                )}
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
                  placeholder="Ghi rõ nội dung đạt chuẩn hoặc các điểm cần chỉnh sửa bổ sung..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] outline-none"
                />
              </div>
            </div>

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
    </section>
  );
}

export default function ReviewWorkspacePage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-slate-350 border-t-[#0A6EBD] rounded-full animate-spin mx-auto mb-2"></div>
        Đang tải không gian thẩm định...
      </div>
    }>
      <ReviewWorkspaceContent />
    </Suspense>
  );
}
