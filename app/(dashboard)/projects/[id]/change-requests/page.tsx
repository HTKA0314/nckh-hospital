'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  GitPullRequest,
  MoreVertical,
  Plus,
  Search,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/common/PageHeader';
import { TableEmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { Pagination } from '@/components/ui/Pagination';
import {
  ChangeRequest,
  ChangeRequestStatus,
  ChangeRequestType,
  ResearchProject,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';

const TYPE_LABELS: Record<ChangeRequestType, string> = {
  EXTENSION: 'Gia hạn thời gian',
  CHANGE_PI: 'Thay đổi Chủ nhiệm',
  CHANGE_MEMBER: 'Thay đổi thành viên',
  CHANGE_CONTENT: 'Điều chỉnh nội dung nghiên cứu',
  CHANGE_OBJECTIVE: 'Điều chỉnh mục tiêu nghiên cứu',
  CHANGE_PRODUCT: 'Điều chỉnh sản phẩm cam kết',
  ADJUST_BUDGET: 'Điều chỉnh kinh phí',
  CHANGE_PARTNER: 'Thay đổi đơn vị phối hợp',
  SUSPENSION: 'Tạm dừng đề tài',
  RESUME: 'Tiếp tục đề tài',
  TERMINATION: 'Chấm dứt đề tài',
  OTHER: 'Điều chỉnh khác',
};

const STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  DRAFT: 'Dự thảo',
  SUBMITTED: 'Đã gửi',
  UNDER_REVIEW: 'Đang thẩm định',
  REVISION_REQUIRED: 'Cần bổ sung',
  RESUBMITTED: 'Đã nộp lại',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Từ chối',
};

const STATUS_CLASS: Record<ChangeRequestStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-600',
  SUBMITTED: 'border-amber-200 bg-amber-50 text-amber-800 font-bold',
  UNDER_REVIEW: 'border-sky-200 bg-sky-50 text-[#0A6EBD] font-bold',
  REVISION_REQUIRED: 'border-rose-200 bg-rose-50 text-rose-700 font-bold',
  RESUBMITTED: 'border-amber-200 bg-amber-50 text-amber-800 font-bold',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-800 font-bold',
  REJECTED: 'border-slate-300 bg-slate-100 text-slate-700 font-medium',
};

type RequestForm = {
  projectId: string;
  type: ChangeRequestType;
  title: string;
  fieldName: string;
  currentValue: string;
  proposedValue: string;
  reason: string;
};

const EMPTY_FORM: RequestForm = {
  projectId: '',
  type: 'EXTENSION',
  title: '',
  fieldName: 'endDate',
  currentValue: '',
  proposedValue: '',
  reason: '',
};


const MAJOR_CHANGE_TYPES: ChangeRequestType[] = [
  'CHANGE_PI',
  'CHANGE_OBJECTIVE',
  'CHANGE_PRODUCT',
  'ADJUST_BUDGET',
  'SUSPENSION',
  'TERMINATION',
];

function requiresDirectorApproval(type: ChangeRequestType) {
  return MAJOR_CHANGE_TYPES.includes(type);
}

function isProjectEligibleForRequest(project: ResearchProject, type: ChangeRequestType) {
  if (type === 'RESUME') return project.status === 'SUSPENDED';
  if (type === 'TERMINATION') return project.status === 'IN_PROGRESS' || project.status === 'SUSPENDED';
  return project.status === 'IN_PROGRESS';
}

function getRequestFieldConfig(project: ResearchProject, type: ChangeRequestType) {
  switch (type) {
    case 'EXTENSION':
      return { fieldName: 'endDate', currentValue: project.endDate || '', proposedValue: '' };
    case 'CHANGE_PI':
      return { fieldName: 'principalInvestigatorName', currentValue: project.principalInvestigatorName || '', proposedValue: '' };
    case 'CHANGE_MEMBER':
      return {
        fieldName: 'members',
        currentValue: (project.members || []).map((member) => member.fullName).join(', '),
        proposedValue: '',
      };
    case 'CHANGE_CONTENT':
      return { fieldName: 'summary', currentValue: project.summary || '', proposedValue: '' };
    case 'CHANGE_OBJECTIVE':
      return { fieldName: 'expectedObjectives', currentValue: project.expectedObjectives || '', proposedValue: '' };
    case 'CHANGE_PRODUCT':
      return { fieldName: 'expectedProducts', currentValue: project.expectedProducts || '', proposedValue: '' };
    case 'ADJUST_BUDGET':
      return {
        fieldName: 'approvedBudget',
        currentValue: String(project.approvedBudget ?? project.estimatedBudget ?? ''),
        proposedValue: '',
      };
    case 'CHANGE_PARTNER':
      return { fieldName: 'partner', currentValue: '', proposedValue: '' };
    case 'SUSPENSION':
      return { fieldName: 'status', currentValue: project.status, proposedValue: 'SUSPENDED' };
    case 'RESUME':
      return { fieldName: 'status', currentValue: project.status, proposedValue: 'IN_PROGRESS' };
    case 'TERMINATION':
      return { fieldName: 'status', currentValue: project.status, proposedValue: 'TERMINATED' };
    default:
      return { fieldName: 'other', currentValue: '', proposedValue: '' };
  }
}

export default function ChangeRequestsPage() {
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | ChangeRequestType>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | ChangeRequestStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RequestForm>(EMPTY_FORM);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const allProjects = useMemo(() => repo.getProjects(), [dataVersion]);
  const allRequests = useMemo(() => repo.getChangeRequests(), [dataVersion]);

  const canCreate = currentUser?.role === 'RESEARCHER';
  const canIntake = currentUser?.role === 'RESEARCH_OFFICE' || currentUser?.role === 'ADMIN';
  const canApproveMajor = currentUser?.role === 'DIRECTOR' || currentUser?.role === 'ADMIN';
  const canReview = canIntake || canApproveMajor;

  const eligibleProjects = useMemo(() => {
    if (!currentUser) return [];
    return allProjects.filter((project) =>
      ['IN_PROGRESS', 'SUSPENDED'].includes(project.status) &&
      project.principalInvestigatorId === currentUser.id
    );
  }, [allProjects, currentUser]);

  const requestRows = useMemo(() => {
    return allRequests
      .map((request) => {
        const project = repo.getProjectById(request.projectId);
        return { request, project };
      })
      .filter(
        (item): item is { request: ChangeRequest; project: ResearchProject } => Boolean(item.project)
      );
  }, [allRequests]);

  const visibleRows = useMemo(() => {
    return requestRows.filter(({ request, project }) => {
      if (currentUser?.role === 'RESEARCHER') {
        const isOwner = project.principalInvestigatorId === currentUser.id;
        if (!isOwner) return false;
      }

      if (filterType !== 'ALL' && request.type !== filterType) {
        return false;
      }

      if (filterStatus !== 'ALL' && request.status !== filterStatus) {
        return false;
      }

      const query = search.trim().toLowerCase();
      if (!query) return true;

      return [
        request.id,
        request.title,
        request.reason,
        project.projectCode,
        project.proposalCode,
        project.title,
        project.principalInvestigatorName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [requestRows, currentUser, filterType, filterStatus, search]);

  const pagedRows = visibleRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectedRow = requestRows.find(({ request }) => request.id === selectedRequestId) || null;

  const hasFilters = filterStatus !== 'ALL' || filterType !== 'ALL' || Boolean(search.trim());

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterStatus('ALL');
    setSearch('');
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    if (!canCreate) return;

    if (eligibleProjects.length === 0) {
      warning('Bạn không có đề tài đang thực hiện hoặc tạm dừng đủ điều kiện để tạo yêu cầu điều chỉnh.');
      return;
    }

    const firstInProgress = eligibleProjects.find((project) => project.status === 'IN_PROGRESS');
    const firstProject = firstInProgress || eligibleProjects[0];
    const initialType: ChangeRequestType = firstProject.status === 'SUSPENDED' ? 'RESUME' : 'EXTENSION';
    const fieldConfig = getRequestFieldConfig(firstProject, initialType);
    setFormData({
      ...EMPTY_FORM,
      type: initialType,
      projectId: firstProject.id,
      ...fieldConfig,
    });
    setModalOpen(true);
  };

  const handleCreateRequest = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canCreate || !currentUser) {
      warning('Chỉ Chủ nhiệm đề tài được tạo yêu cầu điều chỉnh.');
      return;
    }

    const project = repo.getProjectById(formData.projectId);

    if (!project || project.principalInvestigatorId !== currentUser.id) {
      warning('Bạn không phải Chủ nhiệm của đề tài đã chọn.');
      return;
    }

    if (!isProjectEligibleForRequest(project, formData.type)) {
      warning('Trạng thái hiện tại của đề tài không phù hợp với loại yêu cầu điều chỉnh đã chọn.');
      return;
    }

    const hasActiveDuplicate = allRequests.some((item) =>
      item.projectId === project.id &&
      item.type === formData.type &&
      ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'RESUBMITTED'].includes(item.status)
    );
    if (hasActiveDuplicate) {
      warning('Đề tài đã có một yêu cầu cùng loại đang được xử lý. Vui lòng hoàn tất yêu cầu hiện tại trước khi tạo yêu cầu mới.');
      return;
    }

    if (!formData.title.trim() || !formData.proposedValue.trim() || !formData.reason.trim()) {
      warning('Vui lòng nhập đầy đủ nội dung yêu cầu điều chỉnh.');
      return;
    }

    const now = new Date().toISOString();

    const request: ChangeRequest = {
      id: `cr-${Date.now()}`,
      projectId: project.id,
      type: formData.type,
      title: formData.title.trim(),
      diffs: [
        {
          fieldName: formData.fieldName.trim() || 'ThongTinDieuChinh',
          currentValue: formData.currentValue.trim(),
          proposedValue: formData.proposedValue.trim(),
          reason: formData.reason.trim(),
        },
      ],
      reason: formData.reason.trim(),
      status: 'SUBMITTED',
      submittedAt: now,
      submittedBy: currentUser.id,
      submittedByName: currentUser.fullName,
    };

    const updated = repo.updateProject(project.id, {
      changeRequests: [...(project.changeRequests || []), request],
    });

    if (!updated) {
      error('Không thể tạo yêu cầu điều chỉnh.');
      return;
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'CHANGE_REQUEST_SUBMITTED',
      entityType: 'CHANGE_REQUEST',
      entityId: request.id,
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      notes: `Gửi yêu cầu ${TYPE_LABELS[request.type]} cho đề tài ${project.projectCode || project.proposalCode}.`,
    });

    setModalOpen(false);
    setFormData(EMPTY_FORM);
    setDataVersion((v) => v + 1);
    success('Đã gửi yêu cầu điều chỉnh đến Phòng Quản lý NCKH.');
  };

  const updateRequestStatus = (
    request: ChangeRequest,
    nextStatus: ChangeRequestStatus,
    responseComment?: string
  ) => {
    if (!currentUser) return;

    const major = requiresDirectorApproval(request.type);
    const mayIntake = canIntake && nextStatus === 'UNDER_REVIEW';
    const mayRequestRevision = canReview && nextStatus === 'REVISION_REQUIRED';
    const mayDecide = nextStatus === 'APPROVED' || nextStatus === 'REJECTED';
    const mayApproveOrReject = mayDecide && (major ? canApproveMajor : canReview);

    if (!mayIntake && !mayRequestRevision && !mayApproveOrReject) {
      warning(major
        ? 'Yêu cầu này thuộc nhóm thay đổi quan trọng và cần người có thẩm quyền phê duyệt.'
        : 'Bạn không có quyền thực hiện thao tác này.');
      return;
    }

    if ((nextStatus === 'REVISION_REQUIRED' || nextStatus === 'REJECTED') && !responseComment?.trim()) {
      warning('Vui lòng nhập rõ nội dung yêu cầu bổ sung hoặc lý do từ chối.');
      return;
    }

    const now = new Date().toISOString();

    const updatedRequest = repo.updateChangeRequest(request.id, {
      status: nextStatus,
      responseComment,
      ...(nextStatus === 'APPROVED'
        ? {
            approvedAt: now,
            approvedBy: currentUser.id,
            approvedByName: currentUser.fullName,
          }
        : {}),
    });

    if (!updatedRequest) {
      error('Không thể cập nhật yêu cầu điều chỉnh.');
      return;
    }

    if (nextStatus === 'APPROVED') {
      applyApprovedChangeRequest(updatedRequest);
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'CHANGE_REQUEST_STATUS_UPDATED',
      entityType: 'CHANGE_REQUEST',
      entityId: request.id,
      fromStatus: request.status,
      toStatus: nextStatus,
      notes: responseComment,
    });

    setDataVersion((v) => v + 1);
    const needsStructuredFollowUp = ['CHANGE_PI', 'CHANGE_MEMBER', 'CHANGE_PARTNER'].includes(request.type);
    if (nextStatus === 'APPROVED' && needsStructuredFollowUp) {
      success('Đã phê duyệt yêu cầu. Thay đổi này cần được cập nhật bằng hồ sơ định danh/quyết định tương ứng, hệ thống không tự ghi đè bằng dữ liệu văn bản tự do.');
    } else {
      success(`Đã chuyển yêu cầu sang "${STATUS_LABELS[nextStatus]}".`);
    }
  };

  const handleResubmitRequest = (request: ChangeRequest, supplementNote: string) => {
    if (!currentUser || currentUser.role !== 'RESEARCHER') {
      warning('Chỉ Chủ nhiệm đề tài được nộp lại yêu cầu điều chỉnh.');
      return;
    }

    const project = repo.getProjectById(request.projectId);
    if (!project || project.principalInvestigatorId !== currentUser.id || request.status !== 'REVISION_REQUIRED') {
      warning('Yêu cầu không ở trạng thái cho phép nộp lại.');
      return;
    }

    if (!supplementNote.trim()) {
      warning('Vui lòng nhập nội dung giải trình/bổ sung trước khi nộp lại.');
      return;
    }

    const now = new Date().toISOString();
    const updatedRequest = repo.updateChangeRequest(request.id, {
      status: 'RESUBMITTED',
      submittedAt: now,
      reason: `${request.reason}\n\nBổ sung/giải trình: ${supplementNote.trim()}`,
    });

    if (!updatedRequest) {
      error('Không thể nộp lại yêu cầu điều chỉnh.');
      return;
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'CHANGE_REQUEST_RESUBMITTED',
      entityType: 'CHANGE_REQUEST',
      entityId: request.id,
      fromStatus: 'REVISION_REQUIRED',
      toStatus: 'RESUBMITTED',
      notes: supplementNote.trim(),
    });

    setDataVersion((v) => v + 1);
    success('Đã nộp lại yêu cầu điều chỉnh để tiếp tục xử lý.');
  };

  const applyApprovedChangeRequest = (request: ChangeRequest) => {
    const project = repo.getProjectById(request.projectId);
    if (!project) return;

    const diff = request.diffs?.[0];
    if (!diff) return;

    if (request.type === 'EXTENSION' && diff.proposedValue) {
      repo.updateProject(project.id, { endDate: diff.proposedValue });
      return;
    }

    if (request.type === 'CHANGE_OBJECTIVE') {
      repo.updateProject(project.id, { expectedObjectives: diff.proposedValue });
      return;
    }

    if (request.type === 'CHANGE_PRODUCT') {
      repo.updateProject(project.id, { expectedProducts: diff.proposedValue });
      return;
    }

    if (request.type === 'CHANGE_CONTENT') {
      repo.updateProject(project.id, { summary: diff.proposedValue });
      return;
    }

    if (request.type === 'ADJUST_BUDGET') {
      const amount = Number(String(diff.proposedValue).replace(/[^0-9.-]/g, ''));
      if (Number.isFinite(amount) && amount >= 0) {
        repo.updateProject(project.id, { approvedBudget: amount });
      }
      return;
    }

    if (request.type === 'SUSPENSION') {
      repo.updateProject(project.id, { status: 'SUSPENDED' });
      return;
    }

    if (request.type === 'RESUME') {
      repo.updateProject(project.id, { status: 'IN_PROGRESS' });
      return;
    }

    if (request.type === 'TERMINATION') {
      repo.updateProject(project.id, { status: 'TERMINATED' });
      return;
    }

    // CHANGE_PI / CHANGE_MEMBER / CHANGE_PARTNER cần dữ liệu định danh có cấu trúc
    // và/hoặc quyết định kèm theo; không tự động ghi đè bằng chuỗi tự do tại màn này.
  };

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500 text-xs">Đang tải danh mục yêu cầu điều chỉnh...</div>;
  }

  return (
    <div className="space-y-4 text-slate-800 text-xs pb-16">
      <PageHeader
        title="Gia hạn / Điều chỉnh đề tài"
        description="Theo dõi, nộp tờ trình và phê duyệt các thay đổi phát sinh trong quá trình triển khai nghiên cứu."
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#085896] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Tạo yêu cầu điều chỉnh
            </button>
          ) : undefined
        }
      />

      {/* ── BỘ LỌC ── */}
      <section className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <Filter className="h-4 w-4 shrink-0 text-slate-400" />

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã yêu cầu, tên đề tài, lý do..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-8 text-xs outline-none focus:border-[#0A6EBD] font-medium"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={filterType}
          onChange={(event) => {
            setFilterType(event.target.value as 'ALL' | ChangeRequestType);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả loại điều chỉnh</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(event) => {
            setFilterStatus(event.target.value as 'ALL' | ChangeRequestStatus);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 cursor-pointer shadow-2xs"
          >
            <X className="h-3 w-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400 font-medium">
          <strong className="font-mono font-bold text-slate-700">{visibleRows.length}</strong> yêu cầu
        </span>
      </section>

      {/* ── BẢNG DANH SÁCH ── */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-slate-200 bg-[#0B2A63] text-[11px] font-bold uppercase tracking-wider text-white select-none">
              <tr>
                <th className="w-32 px-4 py-3 whitespace-nowrap">MÃ YÊU CẦU</th>
                <th className="min-w-[300px] px-4 py-3">TÊN ĐỀ TÀI NGHIÊN CỨU</th>
                <th className="w-48 px-4 py-3 whitespace-nowrap">LOẠI ĐIỀU CHỈNH</th>
                <th className="w-32 px-4 py-3 whitespace-nowrap">NGÀY GỬI</th>
                <th className="w-36 px-4 py-3 text-center whitespace-nowrap">TRẠNG THÁI</th>
                <th className="w-24 px-4 py-3 text-center whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {visibleRows.length === 0 ? (
                <TableEmptyState
                  colSpan={6}
                  title="Không có yêu cầu điều chỉnh"
                  description="Không tìm thấy yêu cầu nào phù hợp với bộ lọc."
                />
              ) : (
                pagedRows.map(({ request, project }) => (
                  <tr key={request.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#0A6EBD] whitespace-nowrap">
                      {request.id}
                    </td>

                    <td className="px-4 py-3 leading-snug">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-mono text-xs font-bold text-[#0A6EBD] hover:underline"
                      >
                        {project.projectCode || project.proposalCode}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 font-bold text-slate-900">
                        {project.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Chủ nhiệm: <strong>{project.principalInvestigatorName}</strong>
                      </p>
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-800">
                      {TYPE_LABELS[request.type]}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDate(request.submittedAt)}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_CLASS[request.status]}`}>
                        {STATUS_LABELS[request.status]}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRequestId(request.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> Xem
                        </button>

                        {canIntake && (request.status === 'SUBMITTED' || request.status === 'RESUBMITTED') && (
                          <button
                            type="button"
                            onClick={() => updateRequestStatus(request, 'UNDER_REVIEW', 'Tiếp nhận thẩm định yêu cầu')}
                            className="px-2.5 py-1 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded text-xs font-bold transition cursor-pointer"
                          >
                            Tiếp nhận
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Pagination
        currentPage={currentPage}
        totalItems={visibleRows.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="yêu cầu"
      />

      {/* ── MODAL TẠO YÊU CẦU ĐIỀU CHỈNH ── */}
      {modalOpen && (
        <RequestModal
          formData={formData}
          projects={eligibleProjects}
          onChange={setFormData}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateRequest}
        />
      )}

      {/* ── MODAL CHI TIẾT & THẨM ĐỊNH ── */}
      {selectedRow && (
        <RequestDetailModal
          request={selectedRow.request}
          project={selectedRow.project}
          canReview={canReview}
          canIntake={canIntake}
          canApprove={requiresDirectorApproval(selectedRow.request.type) ? canApproveMajor : canReview}
          canResubmit={currentUser?.role === 'RESEARCHER' && selectedRow.project.principalInvestigatorId === currentUser.id}
          onUpdateStatus={updateRequestStatus}
          onResubmit={handleResubmitRequest}
          onClose={() => setSelectedRequestId(null)}
        />
      )}
    </div>
  );
}

function RequestModal({
  formData,
  projects,
  onChange,
  onClose,
  onSubmit,
}: {
  formData: RequestForm;
  projects: ResearchProject[];
  onChange: (value: RequestForm) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 text-xs"
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-[#0B2A63] text-white px-5 py-3.5">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-sky-300" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Tạo yêu cầu Gia hạn / Điều chỉnh đề tài
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-3.5 overflow-y-auto p-5">
          <FieldLabel label="1. Chọn đề tài cần điều chỉnh *">
            <select
              required
              value={formData.projectId}
              onChange={(event) => {
                const p = projects.find((item) => item.id === event.target.value);
                if (!p) return;
                onChange({
                  ...formData,
                  projectId: event.target.value,
                  ...getRequestFieldConfig(p, formData.type),
                });
              }}
              className="w-full rounded-lg border border-slate-300 p-2.5 outline-none font-bold text-slate-800"
            >
              {projects.filter((project) => isProjectEligibleForRequest(project, formData.type)).map((project) => (
                <option key={project.id} value={project.id}>
                  [{project.projectCode || project.proposalCode}] {project.title}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="2. Loại hình điều chỉnh *">
            <select
              value={formData.type}
              onChange={(event) => {
                const nextType = event.target.value as ChangeRequestType;
                const currentProject = projects.find((item) => item.id === formData.projectId);
                const eligibleForType = projects.filter((item) => isProjectEligibleForRequest(item, nextType));
                const nextProject = currentProject && isProjectEligibleForRequest(currentProject, nextType)
                  ? currentProject
                  : eligibleForType[0];

                onChange({
                  ...formData,
                  type: nextType,
                  projectId: nextProject?.id || '',
                  ...(nextProject ? getRequestFieldConfig(nextProject, nextType) : { fieldName: 'other', currentValue: '', proposedValue: '' }),
                });
              }}
              className="w-full rounded-lg border border-slate-300 p-2.5 outline-none font-bold text-slate-800"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </FieldLabel>

          {requiresDirectorApproval(formData.type) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
              Loại điều chỉnh này thuộc nhóm thay đổi quan trọng; sau khi Phòng NCKH kiểm tra, hồ sơ cần người có thẩm quyền xem xét trước khi áp dụng.
            </div>
          )}

          <FieldLabel label="3. Tiêu đề yêu cầu đề xuất *">
            <input
              required
              value={formData.title}
              onChange={(event) => onChange({ ...formData, title: event.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 font-bold text-slate-900 outline-none focus:border-[#0A6EBD]"
              placeholder="Ví dụ: Đề nghị gia hạn thời gian hoàn thành đề tài thêm 06 tháng"
            />
          </FieldLabel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <FieldLabel label="Giá trị hiện tại">
              <input
                value={formData.currentValue}
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-100 p-2 font-mono text-slate-600"
                placeholder="Ví dụ: 30/06/2026"
              />
            </FieldLabel>

            <FieldLabel label="Giá trị đề nghị mới *">
              <input
                required
                value={formData.proposedValue}
                onChange={(event) => onChange({ ...formData, proposedValue: event.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono font-bold text-[#0A6EBD]"
                placeholder="Ví dụ: 31/12/2026"
              />
            </FieldLabel>
          </div>

          <FieldLabel label="4. Lý do & Căn cứ đề nghị điều chỉnh *">
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(event) => onChange({ ...formData, reason: event.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-[#0A6EBD] leading-relaxed"
              placeholder="Nêu rõ lý do khách quan/chủ quan (ví dụ: tiến độ thu thập mẫu bệnh phẩm kéo dài do dịch bệnh...)"
            />
          </FieldLabel>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#0A6EBD] px-4 py-2 font-bold text-white hover:bg-[#085896] shadow-2xs cursor-pointer"
          >
            Gửi yêu cầu điều chỉnh
          </button>
        </footer>
      </form>
    </div>
  );
}

function RequestDetailModal({
  request,
  project,
  canReview,
  canIntake,
  canApprove,
  canResubmit,
  onUpdateStatus,
  onResubmit,
  onClose,
}: {
  request: ChangeRequest;
  project: ResearchProject;
  canReview: boolean;
  canIntake: boolean;
  canApprove: boolean;
  canResubmit: boolean;
  onUpdateStatus: (req: ChangeRequest, status: ChangeRequestStatus, comment?: string) => void;
  onResubmit: (req: ChangeRequest, supplementNote: string) => void;
  onClose: () => void;
}) {
  const [commentInput, setCommentInput] = useState('');
  const [supplementInput, setSupplementInput] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
        <header className="flex items-center justify-between border-b border-slate-200 bg-[#0B2A63] text-white px-5 py-3.5">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-sky-300" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Chi tiết yêu cầu: {TYPE_LABELS[request.type]}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100">
            <span className="font-mono font-bold text-[#0A6EBD] block">
              [{project.projectCode || project.proposalCode}]
            </span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{project.title}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Chủ nhiệm: <strong>{project.principalInvestigatorName}</strong> • Ngày gửi: <strong>{formatDate(request.submittedAt)}</strong>
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-700 block mb-1">Nội dung thay đổi đề xuất:</span>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Hạng mục</th>
                    <th className="px-3 py-2">Hiện tại</th>
                    <th className="px-3 py-2">Đề nghị mới</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {request.diffs?.map((diff, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2.5 text-slate-800">{diff.fieldName}</td>
                      <td className="px-3 py-2.5 text-slate-500 font-mono">{diff.currentValue || '—'}</td>
                      <td className="px-3 py-2.5 text-[#0A6EBD] font-mono font-bold">{diff.proposedValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-700 block mb-1">Lý do & Căn cứ:</span>
            <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-medium">
              {request.reason}
            </p>
          </div>

          {request.responseComment && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <span className="block font-bold text-amber-900 mb-1">Ý kiến xử lý gần nhất</span>
              <p className="font-medium text-amber-900 leading-relaxed">{request.responseComment}</p>
            </div>
          )}

          {canResubmit && request.status === 'REVISION_REQUIRED' && (
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <label className="block font-bold text-slate-700">Giải trình / Nội dung bổ sung của Chủ nhiệm *</label>
              <textarea
                rows={3}
                value={supplementInput}
                onChange={(e) => setSupplementInput(e.target.value)}
                placeholder="Nêu rõ nội dung đã bổ sung, tài liệu hoặc căn cứ đã cập nhật..."
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#0A6EBD]"
              />
            </div>
          )}

          {canReview && request.status === 'UNDER_REVIEW' && (
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <label className="block font-bold text-slate-700">Ý kiến thẩm định của Phòng NCKH:</label>
              <textarea
                rows={2}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Nhập ý kiến phê duyệt hoặc lý do yêu cầu bổ sung/từ chối..."
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#0A6EBD]"
              />
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Đóng
          </button>

          {canResubmit && request.status === 'REVISION_REQUIRED' && (
            <button
              type="button"
              onClick={() => {
                onResubmit(request, supplementInput);
                if (supplementInput.trim()) onClose();
              }}
              className="px-4 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold rounded-lg shadow-2xs cursor-pointer"
            >
              Nộp lại yêu cầu
            </button>
          )}

          {canReview && request.status === 'UNDER_REVIEW' && (
            <div className="flex items-center gap-2">
              {canApprove && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(request, 'REJECTED', commentInput);
                    if (commentInput.trim()) onClose();
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Từ chối
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(request, 'REVISION_REQUIRED', commentInput);
                  if (commentInput.trim()) onClose();
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Yêu cầu bổ sung
              </button>
              {canApprove && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(request, 'APPROVED', commentInput || 'Chấp thuận điều chỉnh.');
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer"
                >
                  Phê duyệt
                </button>
              )}
              {!canApprove && canIntake && requiresDirectorApproval(request.type) && (
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-bold text-amber-800">
                  Chờ người có thẩm quyền quyết định
                </span>
              )}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}