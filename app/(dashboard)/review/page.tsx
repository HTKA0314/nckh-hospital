'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileBox,
  FileText,
  Filter,
  RotateCcw,
  Search,
  X,
  XCircle,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import {
  AcceptanceDossier,
  AcceptanceDossierStatus,
  ProposalStatus,
  ResearchProject,
} from '@/lib/types';

type WorkspaceTab = 'PROPOSAL' | 'ACCEPTANCE';

type ProposalReviewAction =
  | 'ADMIN_VALIDATED'
  | 'REVISION_REQUIRED'
  | 'REJECTED';

type AcceptanceReviewAction =
  | 'ELIGIBLE_FOR_ACCEPTANCE'
  | 'REVISION_REQUIRED';

type ReviewAction =
  | ProposalReviewAction
  | AcceptanceReviewAction
  | null;

type ProposalChecklist = {
  eligibleApplicant: boolean;
  requiredDocuments: boolean;
  budgetDeclared: boolean;
  ethicsDeclared: boolean;
};

type AcceptanceChecklist = NonNullable<
  AcceptanceDossier['checklistResults']
>;

const EMPTY_PROPOSAL_CHECKLIST: ProposalChecklist = {
  eligibleApplicant: false,
  requiredDocuments: false,
  budgetDeclared: false,
  ethicsDeclared: false,
};

const EMPTY_ACCEPTANCE_CHECKLIST: AcceptanceChecklist = {
  finalReportSubmitted: false,
  productsCompleted: false,
  evidenceValid: false,
  progressReportsCompleted: false,
  noPendingChangeRequests: false,
  ethicsValid: false,
  financeConditionMet: false,
  publicationsIfRequired: false,
};

const PROPOSAL_CHECKLIST_ITEMS: Array<{
  key: keyof ProposalChecklist;
  label: string;
}> = [
  {
    key: 'eligibleApplicant',
    label: 'Đúng đối tượng/chủ thể đăng ký theo policy áp dụng',
  },
  {
    key: 'requiredDocuments',
    label: 'Đã có đủ tài liệu bắt buộc của hồ sơ đăng ký',
  },
  {
    key: 'budgetDeclared',
    label: 'Thông tin dự toán/nguồn kinh phí đã được khai báo đầy đủ',
  },
  {
    key: 'ethicsDeclared',
    label: 'Đã khai báo thông tin sàng lọc đạo đức nghiên cứu',
  },
];

const ACCEPTANCE_CHECKLIST_ITEMS: Array<{
  key: keyof AcceptanceChecklist;
  label: string;
}> = [
  {
    key: 'finalReportSubmitted',
    label: 'Đã nộp báo cáo tổng kết',
  },
  {
    key: 'productsCompleted',
    label: 'Đã bàn giao các sản phẩm cam kết',
  },
  {
    key: 'evidenceValid',
    label: 'Minh chứng kết quả đầy đủ và hợp lệ',
  },
  {
    key: 'progressReportsCompleted',
    label: 'Đã hoàn thành các báo cáo tiến độ bắt buộc',
  },
  {
    key: 'noPendingChangeRequests',
    label: 'Không còn yêu cầu điều chỉnh đang xử lý',
  },
  {
    key: 'ethicsValid',
    label: 'Điều kiện đạo đức phù hợp/không áp dụng',
  },
  {
    key: 'financeConditionMet',
    label: 'Đáp ứng điều kiện tài chính theo policy',
  },
  {
    key: 'publicationsIfRequired',
    label: 'Đáp ứng yêu cầu công bố nếu policy bắt buộc',
  },
];

function ReviewWorkspaceContent() {
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();
  const searchParams = useSearchParams();
  const urlId = searchParams.get('id');

  const [projects, setProjects] = useState<ResearchProject[]>(
    repo.getProjects()
  );
  const [selectedProject, setSelectedProject] =
    useState<ResearchProject | null>(null);

  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>('PROPOSAL');

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [reviewAction, setReviewAction] =
    useState<ReviewAction>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [proposalChecklist, setProposalChecklist] =
    useState<ProposalChecklist>(EMPTY_PROPOSAL_CHECKLIST);
  const [acceptanceChecklist, setAcceptanceChecklist] =
    useState<AcceptanceChecklist>(EMPTY_ACCEPTANCE_CHECKLIST);

  const departments = repo.getDepartments();

  /*
   * Workspace này là hàng đợi nghiệp vụ của Phòng NCKH.
   * DIRECTOR/SYSTEM_ADMIN không mặc định có quyền thẩm định hành chính.
   */
  const canReview = currentUser.role === 'RESEARCH_OFFICE';

  const proposalProjects = useMemo(
    () =>
      projects.filter((project) =>
        [
          'SUBMITTED',
          'UNDER_ADMIN_REVIEW',
          'RESUBMITTED',
          'REVISION_REQUIRED',
        ].includes(project.proposalStatus)
      ),
    [projects]
  );

  const acceptanceProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.acceptanceDossier &&
          [
            'SUBMITTED',
            'UNDER_ADMIN_REVIEW',
            'RESUBMITTED',
            'REVISION_REQUIRED',
          ].includes(project.acceptanceDossier.status)
      ),
    [projects]
  );

  const activeProjectsList =
    activeTab === 'PROPOSAL'
      ? proposalProjects
      : acceptanceProjects;

  const pendingProjects = activeProjectsList.filter(
    (project) => {
      if (
        selectedDept !== 'ALL' &&
        project.departmentId !== selectedDept
      ) {
        return false;
      }

      const workflowStatus =
        activeTab === 'PROPOSAL'
          ? project.proposalStatus
          : project.acceptanceDossier?.status;

      if (
        selectedStatus !== 'ALL' &&
        workflowStatus !== selectedStatus
      ) {
        return false;
      }

      const query = search.trim().toLowerCase();
      if (!query) return true;

      return [
        project.title,
        project.proposalCode,
        project.projectCode,
        project.principalInvestigatorName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    }
  );

  const pagedProjects = pendingProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasFilters =
    selectedDept !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    Boolean(search.trim());

  const resetReviewState = (
    project?: ResearchProject | null
  ) => {
    setReviewAction(null);
    setReviewComment('');
    setProposalChecklist(EMPTY_PROPOSAL_CHECKLIST);
    setAcceptanceChecklist(
      project?.acceptanceDossier?.checklistResults || {
        ...EMPTY_ACCEPTANCE_CHECKLIST,
      }
    );
  };

  useEffect(() => {
    if (!urlId) return;

    const project = projects.find(
      (item) => item.id === urlId
    );

    if (!project) return;

    const targetTab: WorkspaceTab =
      project.acceptanceDossier &&
      [
        'SUBMITTED',
        'RESUBMITTED',
        'UNDER_ADMIN_REVIEW',
        'REVISION_REQUIRED',
      ].includes(project.acceptanceDossier.status)
        ? 'ACCEPTANCE'
        : 'PROPOSAL';

    setActiveTab(targetTab);
    setSelectedProject(project);
    resetReviewState(project);
  }, [urlId, projects]);

  const handleOpenReview = (project: ResearchProject) => {
    setSelectedProject(project);
    resetReviewState(project);
  };

  const closeReview = () => {
    setSelectedProject(null);
    resetReviewState(null);
  };

  const refresh = () => {
    setProjects(repo.getProjects());
  };

  const handleReceive = () => {
    if (!selectedProject || !canReview) return;

    if (activeTab === 'PROPOSAL') {
      if (
        selectedProject.proposalStatus !== 'SUBMITTED' &&
        selectedProject.proposalStatus !== 'RESUBMITTED'
      ) {
        warning(
          'Chỉ có thể tiếp nhận hồ sơ vừa nộp hoặc nộp lại.'
        );
        return;
      }

      const fromStatus = selectedProject.proposalStatus;
      const updated = repo.updateProject(selectedProject.id, {
        proposalStatus: 'UNDER_ADMIN_REVIEW',
      });

      if (!updated) {
        error('Không thể tiếp nhận hồ sơ đăng ký.');
        return;
      }

      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        actionCode: 'PROPOSAL_ADMIN_REVIEW_STARTED',
        entityType: 'PROJECT',
        entityId: selectedProject.id,
        fromStatus,
        toStatus: 'UNDER_ADMIN_REVIEW',
        notes:
          'Phòng NCKH tiếp nhận hồ sơ đăng ký và bắt đầu kiểm tra hành chính.',
      });

      refresh();
      setSelectedProject(updated);
      success('Đã tiếp nhận hồ sơ đăng ký.');
      return;
    }

    const dossier = selectedProject.acceptanceDossier;

    if (
      !dossier ||
      (dossier.status !== 'SUBMITTED' &&
        dossier.status !== 'RESUBMITTED')
    ) {
      warning(
        'Chỉ có thể tiếp nhận hồ sơ nghiệm thu vừa nộp hoặc nộp lại.'
      );
      return;
    }

    const previousStatus = dossier.status;

    const updatedDossier: AcceptanceDossier = {
      ...dossier,
      status: 'UNDER_ADMIN_REVIEW',
    };

    const updated = repo.updateProject(selectedProject.id, {
      acceptanceDossier: updatedDossier,
    });

    if (!updated) {
      error('Không thể tiếp nhận hồ sơ nghiệm thu.');
      return;
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'ACCEPTANCE_ADMIN_REVIEW_STARTED',
      entityType: 'ACCEPTANCE',
      entityId: dossier.id,
      fromStatus: previousStatus,
      toStatus: 'UNDER_ADMIN_REVIEW',
      notes:
        'Phòng NCKH tiếp nhận hồ sơ nghiệm thu và bắt đầu kiểm tra điều kiện.',
    });

    refresh();
    setSelectedProject(updated);
    success('Đã tiếp nhận hồ sơ nghiệm thu.');
  };

  const proposalChecklistPassed = Object.values(
    proposalChecklist
  ).every(Boolean);

  const acceptanceChecklistPassed = Object.values(
    acceptanceChecklist
  ).every(Boolean);

  const executeSubmitReview = () => {
    if (!selectedProject || !reviewAction) return;

    if (activeTab === 'PROPOSAL') {
      if (
        selectedProject.proposalStatus !==
        'UNDER_ADMIN_REVIEW'
      ) {
        warning(
          'Hồ sơ phải được tiếp nhận trước khi kết luận thẩm định.'
        );
        return;
      }

      const nextProposalStatus =
        reviewAction as ProposalReviewAction;

      if (
        nextProposalStatus === 'ADMIN_VALIDATED' &&
        !proposalChecklistPassed
      ) {
        warning(
          'Chưa thể xác nhận hồ sơ hợp lệ vì checklist còn mục chưa đạt.'
        );
        return;
      }

      const updated = repo.updateProject(selectedProject.id, {
        proposalStatus: nextProposalStatus,
      });

      if (!updated) {
        error('Không thể cập nhật kết quả thẩm định.');
        return;
      }

      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        actionCode: `REVIEW_PROPOSAL_${nextProposalStatus}`,
        entityType: 'PROJECT',
        entityId: selectedProject.id,
        fromStatus: 'UNDER_ADMIN_REVIEW',
        toStatus: nextProposalStatus,
        notes: reviewComment.trim(),
      });

      if (nextProposalStatus === 'ADMIN_VALIDATED') {
        success(
          'Hồ sơ đăng ký đã hợp lệ. Chủ nhiệm có thể tiếp tục nộp đề cương chi tiết.'
        );
      } else if (
        nextProposalStatus === 'REVISION_REQUIRED'
      ) {
        warning(
          'Đã yêu cầu Chủ nhiệm bổ sung hồ sơ đăng ký.'
        );
      } else {
        warning('Hồ sơ đăng ký đã bị từ chối.');
      }
    } else {
      const dossier = selectedProject.acceptanceDossier;

      if (!dossier) {
        error('Không tìm thấy hồ sơ nghiệm thu.');
        return;
      }

      if (dossier.status !== 'UNDER_ADMIN_REVIEW') {
        warning(
          'Hồ sơ phải được tiếp nhận trước khi kết luận thẩm định.'
        );
        return;
      }

      const nextStatus =
        reviewAction as AcceptanceReviewAction;

      if (
        nextStatus === 'ELIGIBLE_FOR_ACCEPTANCE' &&
        !acceptanceChecklistPassed
      ) {
        warning(
          'Chưa thể xác nhận đủ điều kiện vì checklist còn mục chưa đạt.'
        );
        return;
      }

      const updatedDossier: AcceptanceDossier = {
        ...dossier,
        status: nextStatus,
        checklistResults: {
          ...acceptanceChecklist,
        },
      };

      const updated = repo.updateProject(selectedProject.id, {
        acceptanceDossier: updatedDossier,
      });

      if (!updated) {
        error(
          'Không thể cập nhật kết quả kiểm tra hồ sơ nghiệm thu.'
        );
        return;
      }

      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        actionCode: `REVIEW_ACCEPTANCE_${nextStatus}`,
        entityType: 'ACCEPTANCE',
        entityId: dossier.id,
        fromStatus: 'UNDER_ADMIN_REVIEW',
        toStatus: nextStatus,
        notes: reviewComment.trim(),
      });

      if (nextStatus === 'ELIGIBLE_FOR_ACCEPTANCE') {
        success(
          'Đã xác nhận hồ sơ đủ điều kiện tổ chức nghiệm thu.'
        );
      } else {
        warning(
          'Đã yêu cầu Chủ nhiệm bổ sung hồ sơ nghiệm thu.'
        );
      }
    }

    refresh();
    closeReview();
  };

  const handleSubmitReview = () => {
    if (!selectedProject || !reviewAction) return;

    if (!reviewComment.trim()) {
      warning(
        'Vui lòng nhập ý kiến/kết luận thẩm định.'
      );
      return;
    }

    const actionText =
      activeTab === 'PROPOSAL'
        ? reviewAction === 'ADMIN_VALIDATED'
          ? 'Xác nhận hồ sơ hợp lệ'
          : reviewAction === 'REVISION_REQUIRED'
            ? 'Yêu cầu bổ sung hồ sơ'
            : 'Từ chối hồ sơ'
        : reviewAction === 'ELIGIBLE_FOR_ACCEPTANCE'
          ? 'Xác nhận đủ điều kiện nghiệm thu'
          : 'Yêu cầu bổ sung hồ sơ nghiệm thu';

    confirm({
      title: 'Xác nhận kết luận thẩm định',
      message: `Xác nhận "${actionText}" cho hồ sơ ${
        selectedProject.proposalCode
      }?`,
      confirmLabel: 'Xác nhận',
      type:
        reviewAction === 'REJECTED'
          ? 'danger'
          : reviewAction === 'REVISION_REQUIRED'
            ? 'warning'
            : 'info',
      onConfirm: executeSubmitReview,
    });
  };

  if (!canReview) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <ClipboardCheck className="mx-auto h-8 w-8 text-amber-600" />
        <h3 className="mt-2 text-sm font-bold text-amber-900">
          Không có quyền xử lý hồ sơ
        </h3>
        <p className="mt-1 text-xs text-amber-700">
          Workspace thẩm định hành chính dành cho Phòng NCKH.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="workspace-heading"
      className="space-y-4 text-slate-800"
    >
      <h2 id="workspace-heading" className="sr-only">
        Thẩm định hồ sơ
      </h2>

      <div className="flex items-center gap-1 border-b border-slate-200">
        <TabButton
          active={activeTab === 'PROPOSAL'}
          icon={<FileBox className="h-4 w-4" />}
          label="Hồ sơ đăng ký"
          count={proposalProjects.length}
          onClick={() => {
            setActiveTab('PROPOSAL');
            setCurrentPage(1);
            setSelectedStatus('ALL');
            closeReview();
          }}
        />

        <TabButton
          active={activeTab === 'ACCEPTANCE'}
          icon={<FileText className="h-4 w-4" />}
          label="Hồ sơ nghiệm thu"
          count={acceptanceProjects.length}
          onClick={() => {
            setActiveTab('ACCEPTANCE');
            setCurrentPage(1);
            setSelectedStatus('ALL');
            closeReview();
          }}
        />
      </div>

      <header className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã, tên đề tài, chủ nhiệm..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-[13px] outline-none focus:border-[#0A6EBD]"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-label="Xóa tìm kiếm"
            >
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
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 outline-none"
        >
          <option value="ALL">Tất cả Khoa / Phòng</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(event.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="SUBMITTED">Mới nộp</option>
          <option value="UNDER_ADMIN_REVIEW">
            Đang kiểm tra
          </option>
          <option value="REVISION_REQUIRED">
            Cần bổ sung
          </option>
          <option value="RESUBMITTED">Đã nộp lại</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSelectedDept('ALL');
              setSelectedStatus('ALL');
              setSearch('');
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700"
          >
            <X className="h-3 w-3" />
            Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400">
          <strong className="font-mono text-slate-700">
            {pendingProjects.length}
          </strong>{' '}
          hồ sơ
        </span>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="w-32 px-4 py-3">Mã hồ sơ</th>
                <th className="min-w-[300px] px-4 py-3">
                  Tên đề tài
                </th>
                <th className="w-48 px-4 py-3">Chủ nhiệm</th>
                <th className="w-44 px-4 py-3">Khoa/Phòng</th>
                <th className="w-40 px-4 py-3 text-center">
                  Trạng thái
                </th>
                <th className="w-32 px-4 py-3 text-center">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {pendingProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Không có hồ sơ đang chờ xử lý.
                  </td>
                </tr>
              ) : (
                pagedProjects.map((project) => {
                  const workflowStatus =
                    activeTab === 'PROPOSAL'
                      ? project.proposalStatus
                      : project.acceptanceDossier?.status;

                  const waitingToReceive =
                    workflowStatus === 'SUBMITTED' ||
                    workflowStatus === 'RESUBMITTED';

                  return (
                    <tr
                      key={project.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-mono text-xs font-bold text-[#0A6EBD] hover:underline"
                        >
                          {project.proposalCode}
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="line-clamp-1 font-semibold text-slate-900 hover:text-[#0A6EBD]"
                        >
                          {project.title}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {project.principalInvestigatorName}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {project.departmentName}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StatusBadge
                          status={
                            workflowStatus || project.status
                          }
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenReview(project)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {waitingToReceive ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#0A6EBD]" />
                          ) : (
                            <ClipboardCheck className="h-3.5 w-3.5 text-[#0A6EBD]" />
                          )}
                          {waitingToReceive
                            ? 'Tiếp nhận'
                            : 'Thẩm định'}
                        </button>
                      </td>
                    </tr>
                  );
                })
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

      {selectedProject && (
        <ReviewModal
          project={selectedProject}
          activeTab={activeTab}
          reviewAction={reviewAction}
          reviewComment={reviewComment}
          proposalChecklist={proposalChecklist}
          acceptanceChecklist={acceptanceChecklist}
          onProposalChecklistChange={setProposalChecklist}
          onAcceptanceChecklistChange={setAcceptanceChecklist}
          onReviewActionChange={setReviewAction}
          onReviewCommentChange={setReviewComment}
          onClose={closeReview}
          onReceive={handleReceive}
          onSubmitReview={handleSubmitReview}
        />
      )}
    </section>
  );
}

function ReviewModal({
  project,
  activeTab,
  reviewAction,
  reviewComment,
  proposalChecklist,
  acceptanceChecklist,
  onProposalChecklistChange,
  onAcceptanceChecklistChange,
  onReviewActionChange,
  onReviewCommentChange,
  onClose,
  onReceive,
  onSubmitReview,
}: {
  project: ResearchProject;
  activeTab: WorkspaceTab;
  reviewAction: ReviewAction;
  reviewComment: string;
  proposalChecklist: ProposalChecklist;
  acceptanceChecklist: AcceptanceChecklist;
  onProposalChecklistChange: (
    value: ProposalChecklist
  ) => void;
  onAcceptanceChecklistChange: (
    value: AcceptanceChecklist
  ) => void;
  onReviewActionChange: (value: ReviewAction) => void;
  onReviewCommentChange: (value: string) => void;
  onClose: () => void;
  onReceive: () => void;
  onSubmitReview: () => void;
}) {
  const workflowStatus =
    activeTab === 'PROPOSAL'
      ? project.proposalStatus
      : project.acceptanceDossier?.status;

  const waitingToReceive =
    workflowStatus === 'SUBMITTED' ||
    workflowStatus === 'RESUBMITTED';

  const underReview =
    workflowStatus === 'UNDER_ADMIN_REVIEW';

  const documents =
    activeTab === 'PROPOSAL'
      ? project.documents.filter((document) =>
          [
            'PROPOSAL_FORM',
            'DETAILED_OUTLINE',
            'BUDGET_ESTIMATE',
            'CV',
          ].includes(document.documentType)
        )
      : project.documents.filter((document) =>
          [
            'FINAL_REPORT',
            'PRODUCT_EVIDENCE',
            'PUBLICATION',
            'FINANCIAL_SETTLEMENT',
          ].includes(document.documentType)
        );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0A6EBD]">
                {project.proposalCode}
              </span>
              <StatusBadge
                status={workflowStatus || project.status}
              />
            </div>
            <h3 className="mt-1 text-sm font-bold text-slate-900">
              {project.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 p-5 text-xs">
          <section>
            <h4 className="mb-2 font-bold text-slate-800">
              Tài liệu hồ sơ
            </h4>

            {documents.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-700">
                Chưa có tài liệu phù hợp với giai đoạn này.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {documents.map((document) => {
                  const currentVersion =
                    document.versions.find(
                      (version) => version.isCurrent
                    ) || document.versions[0];

                  return (
                    <div
                      key={document.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {document.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Phiên bản {document.currentVersion}
                        </p>
                      </div>

                      {currentVersion?.downloadUrl &&
                      currentVersion.downloadUrl !== '#' ? (
                        <a
                          href={currentVersion.downloadUrl}
                          className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#0A6EBD] hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Xem
                        </a>
                      ) : (
                        <span className="shrink-0 text-[10px] text-slate-400">
                          Chưa có tệp
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {waitingToReceive && (
            <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <h4 className="font-bold text-sky-900">
                Hồ sơ đang chờ tiếp nhận
              </h4>
              <p className="mt-1 leading-relaxed text-sky-700">
                Tiếp nhận hồ sơ để bắt đầu bước kiểm tra hành chính.
                Chưa kết luận đạt/không đạt ở bước này.
              </p>

              <button
                type="button"
                onClick={onReceive}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-2 font-bold text-white hover:bg-[#085896]"
              >
                <Check className="h-4 w-4" />
                Tiếp nhận hồ sơ
              </button>
            </section>
          )}

          {underReview && (
            <>
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 font-bold uppercase tracking-wide text-slate-700">
                  Checklist kiểm tra
                </h4>

                <div className="space-y-2.5">
                  {activeTab === 'PROPOSAL'
                    ? PROPOSAL_CHECKLIST_ITEMS.map(
                        (item) => (
                          <ChecklistRow
                            key={item.key}
                            label={item.label}
                            checked={
                              proposalChecklist[item.key]
                            }
                            onChange={(checked) =>
                              onProposalChecklistChange({
                                ...proposalChecklist,
                                [item.key]: checked,
                              })
                            }
                          />
                        )
                      )
                    : ACCEPTANCE_CHECKLIST_ITEMS.map(
                        (item) => (
                          <ChecklistRow
                            key={item.key}
                            label={item.label}
                            checked={
                              acceptanceChecklist[item.key]
                            }
                            onChange={(checked) =>
                              onAcceptanceChecklistChange({
                                ...acceptanceChecklist,
                                [item.key]: checked,
                              })
                            }
                          />
                        )
                      )}
                </div>
              </section>

              <section className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-800">
                  Kết luận thẩm định
                </h4>

                <div
                  className={`grid gap-2 ${
                    activeTab === 'PROPOSAL'
                      ? 'grid-cols-1 sm:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  <ActionChoice
                    active={
                      reviewAction ===
                      (activeTab === 'PROPOSAL'
                        ? 'ADMIN_VALIDATED'
                        : 'ELIGIBLE_FOR_ACCEPTANCE')
                    }
                    icon={
                      <CheckCircle2 className="h-5 w-5" />
                    }
                    label={
                      activeTab === 'PROPOSAL'
                        ? 'Hồ sơ hợp lệ'
                        : 'Đủ điều kiện nghiệm thu'
                    }
                    tone="green"
                    onClick={() =>
                      onReviewActionChange(
                        activeTab === 'PROPOSAL'
                          ? 'ADMIN_VALIDATED'
                          : 'ELIGIBLE_FOR_ACCEPTANCE'
                      )
                    }
                  />

                  <ActionChoice
                    active={
                      reviewAction === 'REVISION_REQUIRED'
                    }
                    icon={
                      <RotateCcw className="h-5 w-5" />
                    }
                    label="Yêu cầu bổ sung"
                    tone="amber"
                    onClick={() =>
                      onReviewActionChange(
                        'REVISION_REQUIRED'
                      )
                    }
                  />

                  {activeTab === 'PROPOSAL' && (
                    <ActionChoice
                      active={reviewAction === 'REJECTED'}
                      icon={
                        <XCircle className="h-5 w-5" />
                      }
                      label="Từ chối"
                      tone="rose"
                      onClick={() =>
                        onReviewActionChange('REJECTED')
                      }
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Ý kiến thẩm định
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(event) =>
                      onReviewCommentChange(event.target.value)
                    }
                    placeholder="Nêu rõ kết quả kiểm tra và nội dung cần bổ sung nếu có..."
                    className="w-full resize-none rounded-lg border border-slate-300 p-2.5 outline-none focus:border-[#0A6EBD]"
                  />
                </div>
              </section>
            </>
          )}

          {workflowStatus === 'REVISION_REQUIRED' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-700">
              Hồ sơ đang chờ Chủ nhiệm bổ sung và nộp lại.
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
          >
            Đóng
          </button>

          {underReview && (
            <button
              type="button"
              disabled={!reviewAction}
              onClick={onSubmitReview}
              className="rounded-lg bg-[#0A6EBD] px-4 py-2 font-bold text-white hover:bg-[#085896] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Xác nhận kết luận
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function ChecklistRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-0.5 h-4 w-4 accent-[#0A6EBD]"
      />
      <span className="leading-relaxed">{label}</span>
    </label>
  );
}

function ActionChoice({
  active,
  icon,
  label,
  tone,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  tone: 'green' | 'amber' | 'rose';
  onClick: () => void;
}) {
  const activeClass = {
    green:
      'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20',
    amber:
      'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20',
    rose:
      'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border p-3 font-bold transition ${
        active
          ? activeClass
          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TabButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
        active
          ? 'border-[#0A6EBD] text-[#0A6EBD]'
          : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      {icon}
      {label}
      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
        {count}
      </span>
    </button>
  );
}

export default function ReviewWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">
          Đang tải không gian thẩm định...
        </div>
      }
    >
      <ReviewWorkspaceContent />
    </Suspense>
  );
}