'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { ProposalStatus, ResearchProject } from '@/lib/types';
import {
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';

type ReviewTab = 'PROPOSALS' | 'ACCEPTANCE';
type ReviewDecision = 'ADMIN_VALIDATED' | 'REVISION_REQUIRED' | 'REJECTED';



export default function ReviewDossierPage() {
  const { currentUser } = useAuth();
  const { success, warning, info } = useToast();

  const [mounted, setMounted] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<ReviewTab>('PROPOSALS');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [receiveProject, setReceiveProject] = useState<ResearchProject | null>(null);
  const [reviewProject, setReviewProject] = useState<ResearchProject | null>(null);
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

  useEffect(() => setMounted(true), []);

  const projects = useMemo(() => repo.getProjects(), [dataVersion]);
  const departments = useMemo(() => repo.getDepartments(), []);
  const canReview = currentUser?.role === 'RESEARCH_OFFICE' || currentUser?.role === 'ADMIN';

  const proposalProjects = useMemo(() => {
    const statuses = new Set([
      'SUBMITTED',
      'UNDER_ADMIN_REVIEW',
      'REVISION_REQUIRED',
      'RESUBMITTED',
      'ADMIN_VALIDATED',
      'OUTLINE_SUBMITTED',
      'PROPOSAL_REVISION_REQUIRED',
      'PROPOSAL_RESUBMITTED',
      'UNDER_PROPOSAL_REVISION_REVIEW',
    ]);

    return projects.filter((project) => statuses.has(String(project.proposalStatus)));
  }, [projects]);

  const acceptanceProjects = useMemo(() => {
    const statuses = new Set([
      'SUBMITTED',
      'RESUBMITTED',
      'UNDER_ADMIN_REVIEW',
      'REVISION_REQUIRED',
      'ELIGIBLE_FOR_ACCEPTANCE',
      'FORWARDED_TO_COUNCIL',
    ]);

    return projects.filter((project) =>
      Boolean(project.acceptanceDossier?.status && statuses.has(String(project.acceptanceDossier.status)))
    );
  }, [projects]);

  const currentList = activeTab === 'PROPOSALS' ? proposalProjects : acceptanceProjects;

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();

    return currentList.filter((project) => {
      if (
        selectedDept !== 'ALL' &&
        project.departmentId !== selectedDept &&
        project.departmentName !== selectedDept
      ) {
        return false;
      }

      const workflowStatus =
        activeTab === 'PROPOSALS'
          ? String(project.proposalStatus || '')
          : String(project.acceptanceDossier?.status || '');

      if (selectedStatus !== 'ALL' && workflowStatus !== selectedStatus) return false;

      if (!q) return true;

      return [
        project.proposalCode,
        project.projectCode,
        project.title,
        project.principalInvestigatorName,
        project.departmentName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [activeTab, currentList, search, selectedDept, selectedStatus]);

  const pagedProjects = filteredProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const proposalCounts = useMemo(
    () => ({
      pending: proposalProjects.filter((p) => ['SUBMITTED', 'RESUBMITTED'].includes(String(p.proposalStatus))).length,
      reviewing: proposalProjects.filter((p) => p.proposalStatus === 'UNDER_ADMIN_REVIEW').length,
      revision: proposalProjects.filter((p) => ['REVISION_REQUIRED', 'PROPOSAL_REVISION_REQUIRED'].includes(String(p.proposalStatus))).length,
      valid: proposalProjects.filter((p) => p.proposalStatus === 'ADMIN_VALIDATED').length,
    }),
    [proposalProjects]
  );

  const acceptanceCounts = useMemo(
    () => ({
      pending: acceptanceProjects.filter((p) =>
        ['SUBMITTED', 'RESUBMITTED'].includes(String(p.acceptanceDossier?.status))
      ).length,
      reviewing: acceptanceProjects.filter((p) => p.acceptanceDossier?.status === 'UNDER_ADMIN_REVIEW').length,
      revision: acceptanceProjects.filter((p) => p.acceptanceDossier?.status === 'REVISION_REQUIRED').length,
      eligible: acceptanceProjects.filter((p) => p.acceptanceDossier?.status === 'ELIGIBLE_FOR_ACCEPTANCE').length,
    }),
    [acceptanceProjects]
  );

  const resetFilters = () => {
    setSearch('');
    setSelectedDept('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
  };

  const openReview = (project: ResearchProject) => {
    setReviewProject(project);
    setDecision('ADMIN_VALIDATED');
    setComment('');
    setChecklist({
      investigator: false,
      department: false,
      forms: false,
      signatures: false,
      outline: false,
      budget: false,
    });
  };

  const handleReceive = () => {
    if (!receiveProject || !currentUser || !canReview) return;

    const now = new Date().toISOString();
    repo.updateProject(receiveProject.id, {
      proposalStatus: 'UNDER_ADMIN_REVIEW',
      updatedAt: now,
    });

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'RECEIVE_PROPOSAL_DOSSIER',
      entityType: 'PROJECT',
      entityId: receiveProject.id,
      fromStatus: receiveProject.proposalStatus,
      toStatus: 'UNDER_ADMIN_REVIEW',
      notes: `Tiếp nhận hồ sơ ${receiveProject.proposalCode}.`,
    });

    setReceiveProject(null);
    setDataVersion((value) => value + 1);
    success('Đã tiếp nhận hồ sơ.');
  };

  const handleSubmitReview = () => {
    if (!reviewProject || !currentUser || !canReview) return;

    const allPassed = Object.values(checklist).every(Boolean);

    if (decision === 'ADMIN_VALIDATED' && !allPassed) {
      warning('Chưa hoàn thành đầy đủ các tiêu chí kiểm tra bắt buộc.');
      return;
    }

    if ((decision === 'REVISION_REQUIRED' || decision === 'REJECTED') && !comment.trim()) {
      warning(decision === 'REVISION_REQUIRED' ? 'Vui lòng nhập nội dung yêu cầu bổ sung.' : 'Vui lòng nhập lý do không đủ điều kiện.');
      return;
    }

    const now = new Date().toISOString();
    repo.updateProject(reviewProject.id, {
      proposalStatus: decision,
      updatedAt: now,
    });

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: `REVIEW_PROPOSAL_${decision}`,
      entityType: 'PROJECT',
      entityId: reviewProject.id,
      fromStatus: reviewProject.proposalStatus,
      toStatus: decision,
      notes: comment.trim() || 'Hoàn tất kiểm tra hồ sơ.',
    });

    setReviewProject(null);
    setComment('');
    setDataVersion((value) => value + 1);

    if (decision === 'ADMIN_VALIDATED') success('Đã xác nhận hồ sơ hợp lệ.');
    else if (decision === 'REVISION_REQUIRED') warning('Đã chuyển hồ sơ về trạng thái chờ bổ sung.');
    else info('Đã cập nhật kết quả kiểm tra hồ sơ.');
  };

  const handleReceiveProposalRevision = (project: ResearchProject) => {
    if (!currentUser || !canReview) return;
    if (project.proposalStatus !== 'PROPOSAL_RESUBMITTED') {
      warning('Đề cương không ở trạng thái chờ tiếp nhận bản chỉnh sửa.');
      return;
    }

    const now = new Date().toISOString();
    const updated = repo.updateProject(project.id, {
      proposalStatus: 'UNDER_PROPOSAL_REVISION_REVIEW',
      updatedAt: now,
    });

    if (!updated) {
      warning('Không thể tiếp nhận bản đề cương chỉnh sửa.');
      return;
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'RECEIVE_PROPOSAL_REVISION',
      entityType: 'PROJECT',
      entityId: project.id,
      fromStatus: 'PROPOSAL_RESUBMITTED',
      toStatus: 'UNDER_PROPOSAL_REVISION_REVIEW',
      notes: 'Phòng NCKH tiếp nhận bản đề cương chỉnh sửa sau kết luận Hội đồng.',
    });

    setDataVersion((value) => value + 1);
    success('Đã tiếp nhận bản đề cương chỉnh sửa để chuyển bước xét lại.');
  };

  const renderProposalAction = (project: ResearchProject) => {
    const status = String(project.proposalStatus || '');

    if (!canReview) {
      return (
        <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50">
          <Eye className="h-3.5 w-3.5" /> Xem hồ sơ
        </Link>
      );
    }

    if (status === 'SUBMITTED') {
      return (
        <button type="button" onClick={() => setReceiveProject(project)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3 py-1.5 font-semibold text-white hover:bg-[#085896]">
          <CheckCircle2 className="h-3.5 w-3.5" /> Tiếp nhận
        </button>
      );
    }

    if (status === 'UNDER_ADMIN_REVIEW') {
      return (
        <button type="button" onClick={() => openReview(project)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3 py-1.5 font-semibold text-white hover:bg-[#085896]">
          <FileCheck2 className="h-3.5 w-3.5" /> Mở kiểm tra
        </button>
      );
    }

    if (status === 'RESUBMITTED') {
      return (
        <button type="button" onClick={() => openReview(project)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 hover:bg-amber-100">
          <RotateCcw className="h-3.5 w-3.5" /> Kiểm tra lại
        </button>
      );
    }

    if (status === 'PROPOSAL_RESUBMITTED') {
      return (
        <button type="button" onClick={() => handleReceiveProposalRevision(project)} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 font-semibold text-violet-800 hover:bg-violet-100">
          <CheckCircle2 className="h-3.5 w-3.5" /> Tiếp nhận bản chỉnh sửa
        </button>
      );
    }

    if (status === 'UNDER_PROPOSAL_REVISION_REVIEW') {
      return (
        <Link href={`/councils?type=PROPOSAL_REVIEW`} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-3 py-1.5 font-semibold text-violet-800 hover:bg-violet-50">
          <Eye className="h-3.5 w-3.5" /> Xem bước xét lại
        </Link>
      );
    }

    return (
      <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50">
        <Eye className="h-3.5 w-3.5" /> Xem hồ sơ
      </Link>
    );
  };

  const renderAcceptanceAction = (project: ResearchProject) => {
    const status = String(project.acceptanceDossier?.status || '');
    const label =
      status === 'SUBMITTED'
        ? 'Tiếp nhận'
        : status === 'UNDER_ADMIN_REVIEW'
          ? 'Mở kiểm tra'
          : status === 'REVISION_REQUIRED'
            ? 'Xem hồ sơ'
            : status === 'ELIGIBLE_FOR_ACCEPTANCE'
              ? 'Xem điều kiện'
              : 'Xem hồ sơ';

    return (
      <Link
        href={`/projects/${project.id}/acceptance`}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold ${
          ['SUBMITTED', 'UNDER_ADMIN_REVIEW'].includes(status) && canReview
            ? 'bg-[#0A6EBD] text-white hover:bg-[#085896]'
            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <FileCheck2 className="h-3.5 w-3.5" /> {label}
      </Link>
    );
  };

  if (!mounted) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải dữ liệu...</div>;
  }

  const counts = activeTab === 'PROPOSALS' ? proposalCounts : acceptanceCounts;

  return (
    <div className="space-y-4 pb-12 text-xs text-slate-800">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">Kiểm tra hồ sơ</h1>
          <p className="mt-0.5 text-slate-500">Tiếp nhận và kiểm tra hồ sơ trước khi chuyển sang bước xử lý tiếp theo.</p>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('PROPOSALS');
              setSelectedStatus('ALL');
              setCurrentPage(1);
            }}
            className={`rounded-md px-3 py-1.5 font-semibold ${activeTab === 'PROPOSALS' ? 'bg-white text-[#0A6EBD] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Hồ sơ đăng ký ({proposalProjects.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ACCEPTANCE');
              setSelectedStatus('ALL');
              setCurrentPage(1);
            }}
            className={`rounded-md px-3 py-1.5 font-semibold ${activeTab === 'ACCEPTANCE' ? 'bg-white text-[#0A6EBD] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Hồ sơ nghiệm thu ({acceptanceProjects.length})
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Chờ tiếp nhận" value={counts.pending} />
        <MetricCard label="Đang kiểm tra" value={counts.reviewing} />
        <MetricCard label="Chờ bổ sung" value={counts.revision} />
        <MetricCard label={activeTab === 'PROPOSALS' ? 'Hồ sơ hợp lệ' : 'Đủ điều kiện'} value={activeTab === 'PROPOSALS' ? proposalCounts.valid : acceptanceCounts.eligible} />
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm mã hồ sơ, tên đề tài, chủ nhiệm..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-8 outline-none focus:border-[#0A6EBD]"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Filter className="h-4 w-4 text-slate-400" />

        <select
          value={selectedDept}
          onChange={(event) => {
            setSelectedDept(event.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium outline-none"
        >
          <option value="ALL">Tất cả Khoa / Phòng</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(event.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {activeTab === 'PROPOSALS' ? (
            <>
              <option value="SUBMITTED">Chờ tiếp nhận</option>
              <option value="UNDER_ADMIN_REVIEW">Đang kiểm tra</option>
              <option value="REVISION_REQUIRED">Chờ bổ sung</option>
              <option value="RESUBMITTED">Chờ kiểm tra lại</option>
              <option value="ADMIN_VALIDATED">Hồ sơ hợp lệ</option>
              <option value="OUTLINE_SUBMITTED">Chờ xét duyệt đề cương</option>
              <option value="PROPOSAL_REVISION_REQUIRED">Chờ chỉnh sửa đề cương</option>
              <option value="PROPOSAL_RESUBMITTED">Chờ tiếp nhận bản chỉnh sửa</option>
              <option value="UNDER_PROPOSAL_REVISION_REVIEW">Đang xét lại đề cương</option>
            </>
          ) : (
            <>
              <option value="SUBMITTED">Chờ tiếp nhận</option>
              <option value="RESUBMITTED">Đã nộp lại</option>
              <option value="UNDER_ADMIN_REVIEW">Đang kiểm tra</option>
              <option value="REVISION_REQUIRED">Chờ bổ sung</option>
              <option value="ELIGIBLE_FOR_ACCEPTANCE">Đủ điều kiện nghiệm thu</option>
              <option value="FORWARDED_TO_COUNCIL">Đã chuyển Hội đồng</option>
            </>
          )}
        </select>

        {(search || selectedDept !== 'ALL' || selectedStatus !== 'ALL') && (
          <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-600 hover:bg-slate-50">
            Xóa lọc
          </button>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#0B2A63] text-[11px] font-bold uppercase tracking-wide text-white">
              <tr>
                <th className="w-32 px-4 py-3">Mã hồ sơ</th>
                <th className="min-w-[300px] px-4 py-3">Đề tài</th>
                <th className="w-44 px-4 py-3">Chủ nhiệm</th>
                <th className="w-44 px-4 py-3">Khoa / Phòng</th>
                <th className="w-28 px-4 py-3 text-center">Ngày nộp</th>
                <th className="w-44 px-4 py-3 text-center">Trạng thái</th>
                <th className="w-36 px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">Không có hồ sơ phù hợp.</td>
                </tr>
              ) : (
                pagedProjects.map((project) => {

                  return (
                    <tr key={project.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-[#0A6EBD]">
                        {project.proposalCode || project.projectCode || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/projects/${project.id}`} className="font-semibold text-slate-900 hover:text-[#0A6EBD]">
                          {project.title}
                        </Link>
                        {project.researchField && <p className="mt-1 text-[11px] text-slate-400">{project.researchField}</p>}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{project.principalInvestigatorName}</td>
                      <td className="px-4 py-3 text-slate-600">{project.departmentName}</td>
                      <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500">
                        {formatDate(activeTab === 'PROPOSALS' ? (project.submittedAt || project.createdAt) : project.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge
                          status={
                            activeTab === 'PROPOSALS'
                              ? project.proposalStatus
                              : project.acceptanceDossier?.status
                          }
                          type={activeTab === 'PROPOSALS' ? 'PROPOSAL' : 'ACCEPTANCE'}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {activeTab === 'PROPOSALS' ? renderProposalAction(project) : renderAcceptanceAction(project)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredProjects.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="hồ sơ"
      />

      {receiveProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Tiếp nhận hồ sơ</h3>
              <button type="button" onClick={() => setReceiveProject(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 py-4">
              <div>
                <p className="font-mono text-xs font-bold text-[#0A6EBD]">{receiveProject.proposalCode}</p>
                <p className="mt-1 font-semibold leading-snug text-slate-900">{receiveProject.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-[11px]">
                <div><span className="block text-slate-400">Chủ nhiệm</span><strong className="text-slate-700">{receiveProject.principalInvestigatorName}</strong></div>
                <div><span className="block text-slate-400">Ngày nộp</span><strong className="text-slate-700">{formatDate(receiveProject.submittedAt || receiveProject.createdAt)}</strong></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setReceiveProject(null)} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Hủy</button>
              <button type="button" onClick={handleReceive} className="rounded-lg bg-[#0A6EBD] px-4 py-2 font-semibold text-white hover:bg-[#085896]">Xác nhận tiếp nhận</button>
            </div>
          </div>
        </div>
      )}

      {reviewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kiểm tra hồ sơ</h3>
                <p className="mt-0.5 font-mono text-[11px] font-semibold text-[#0A6EBD]">{reviewProject.proposalCode}</p>
              </div>
              <button type="button" onClick={() => setReviewProject(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <section>
                <h4 className="mb-2 font-bold text-slate-900">Tài liệu đã nộp</h4>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {(reviewProject.documents || []).length === 0 ? (
                    <div className="px-3 py-4 text-slate-400">Chưa có tài liệu điện tử.</div>
                  ) : (
                    reviewProject.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between px-3 py-2.5">
                        <span className="font-medium text-slate-700">{doc.title}</span>
                        <span className="text-[11px] font-semibold text-emerald-700">Đã nộp</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <h4 className="mb-2 font-bold text-slate-900">Nội dung kiểm tra</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    ['investigator', 'Thông tin Chủ nhiệm và thành viên'],
                    ['department', 'Thông tin Khoa / Phòng'],
                    ['forms', 'Biểu mẫu và trường bắt buộc'],
                    ['signatures', 'Chữ ký / xác nhận'],
                    ['outline', 'Thuyết minh và tài liệu bắt buộc'],
                    ['budget', 'Dự toán kinh phí (nếu áp dụng)'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={checklist[key as keyof typeof checklist]}
                        onChange={(event) => setChecklist((current) => ({ ...current, [key]: event.target.checked }))}
                        className="mt-0.5"
                      />
                      <span className="font-medium text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="mb-2 font-bold text-slate-900">Kết quả xử lý</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <DecisionOption active={decision === 'ADMIN_VALIDATED'} label="Hồ sơ hợp lệ" onClick={() => setDecision('ADMIN_VALIDATED')} />
                  <DecisionOption active={decision === 'REVISION_REQUIRED'} label="Yêu cầu bổ sung" onClick={() => setDecision('REVISION_REQUIRED')} />
                  <DecisionOption active={decision === 'REJECTED'} label="Không đủ điều kiện" onClick={() => setDecision('REJECTED')} />
                </div>
              </section>

              <section>
                <label className="mb-1.5 block font-bold text-slate-700">
                  {decision === 'REVISION_REQUIRED' ? 'Nội dung yêu cầu bổ sung' : decision === 'REJECTED' ? 'Lý do không đủ điều kiện' : 'Ghi chú'}
                  {decision !== 'ADMIN_VALIDATED' && <span className="text-rose-500"> *</span>}
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-300 p-3 outline-none focus:border-[#0A6EBD]"
                />
              </section>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <button type="button" onClick={() => setReviewProject(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100">Hủy</button>
              <button type="button" onClick={handleSubmitReview} className="rounded-lg bg-[#0A6EBD] px-4 py-2 font-semibold text-white hover:bg-[#085896]">Hoàn tất kiểm tra</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <strong className="mt-1 block font-mono text-lg font-bold text-slate-900">{value}</strong>
    </div>
  );
}

function DecisionOption({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2.5 text-left font-semibold transition ${
        active
          ? 'border-[#0A6EBD] bg-sky-50 text-[#0A6EBD]'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}