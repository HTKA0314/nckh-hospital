'use client';

import React, { useMemo, useState } from 'react';
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
  SUBMITTED: 'border-amber-200 bg-amber-50 text-amber-700',
  UNDER_REVIEW: 'border-sky-200 bg-sky-50 text-[#0A6EBD]',
  REVISION_REQUIRED: 'border-rose-200 bg-rose-50 text-rose-700',
  RESUBMITTED: 'border-amber-200 bg-amber-50 text-amber-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-slate-300 bg-slate-100 text-slate-700',
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
  fieldName: '',
  currentValue: '',
  proposedValue: '',
  reason: '',
};

export default function ChangeRequestsPage() {
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | ChangeRequestType>('ALL');
  const [filterStatus, setFilterStatus] =
    useState<'ALL' | ChangeRequestStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RequestForm>(EMPTY_FORM);
  const [dataVersion, setDataVersion] = useState(0);

  void dataVersion;

  const allProjects = repo.getProjects();
  const allRequests = repo.getChangeRequests();

  const canCreate = currentUser.role === 'RESEARCHER';
  const canReview = currentUser.role === 'RESEARCH_OFFICE';

  const eligibleProjects = useMemo(() => {
    return allProjects.filter((project) => {
      if (project.status !== 'IN_PROGRESS' && project.status !== 'SUSPENDED') {
        return false;
      }

      return project.principalInvestigatorId === currentUser.id;
    });
  }, [allProjects, currentUser.id]);

  const requestRows = useMemo(() => {
    return allRequests
      .map((request) => {
        const project = repo.getProjectById(request.projectId);
        return { request, project };
      })
      .filter(
        (
          item
        ): item is {
          request: ChangeRequest;
          project: ResearchProject;
        } => Boolean(item.project)
      );
  }, [allRequests]);

  const visibleRows = useMemo(() => {
    return requestRows.filter(({ request, project }) => {
      if (currentUser.role === 'RESEARCHER') {
        const isOwner =
          project.principalInvestigatorId === currentUser.id;
        if (!isOwner) return false;
      }

      if (filterType !== 'ALL' && request.type !== filterType) {
        return false;
      }

      if (
        filterStatus !== 'ALL' &&
        request.status !== filterStatus
      ) {
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
  }, [
    requestRows,
    currentUser.role,
    currentUser.id,
    filterType,
    filterStatus,
    search,
  ]);

  const pagedRows = visibleRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectedRow =
    requestRows.find(
      ({ request }) => request.id === selectedRequestId
    ) || null;

  const hasFilters =
    filterStatus !== 'ALL' ||
    filterType !== 'ALL' ||
    Boolean(search.trim());

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterStatus('ALL');
    setSearch('');
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    if (!canCreate) return;

    if (eligibleProjects.length === 0) {
      warning(
        'Bạn không có đề tài đang thực hiện hoặc tạm dừng đủ điều kiện để tạo yêu cầu điều chỉnh.'
      );
      return;
    }

    setFormData({
      ...EMPTY_FORM,
      projectId: eligibleProjects[0].id,
    });
    setModalOpen(true);
  };

  const handleCreateRequest = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canCreate) {
      warning('Chỉ Chủ nhiệm đề tài được tạo yêu cầu điều chỉnh.');
      return;
    }

    const project = repo.getProjectById(formData.projectId);

    if (
      !project ||
      project.principalInvestigatorId !== currentUser.id
    ) {
      warning('Bạn không phải Chủ nhiệm của đề tài đã chọn.');
      return;
    }

    if (
      project.status !== 'IN_PROGRESS' &&
      project.status !== 'SUSPENDED'
    ) {
      warning(
        'Chỉ đề tài đang thực hiện hoặc tạm dừng mới được tạo yêu cầu điều chỉnh.'
      );
      return;
    }

    if (
      !formData.title.trim() ||
      !formData.fieldName.trim() ||
      !formData.proposedValue.trim() ||
      !formData.reason.trim()
    ) {
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
          fieldName: formData.fieldName.trim(),
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
      changeRequests: [
        ...(project.changeRequests || []),
        request,
      ],
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
      notes: `Gửi yêu cầu ${TYPE_LABELS[request.type]} cho đề tài ${
        project.projectCode || project.proposalCode
      }.`,
    });

    setModalOpen(false);
    setFormData(EMPTY_FORM);
    setDataVersion((value) => value + 1);
    success('Đã gửi yêu cầu điều chỉnh.');
  };

  const updateRequestStatus = (
    request: ChangeRequest,
    nextStatus: ChangeRequestStatus,
    responseComment?: string
  ) => {
    if (!canReview) {
      warning('Bạn không có quyền xử lý yêu cầu điều chỉnh.');
      return;
    }

    const allowedTransitions: Partial<
      Record<ChangeRequestStatus, ChangeRequestStatus[]>
    > = {
      SUBMITTED: ['UNDER_REVIEW'],
      RESUBMITTED: ['UNDER_REVIEW'],
      UNDER_REVIEW: [
        'REVISION_REQUIRED',
        'APPROVED',
        'REJECTED',
      ],
    };

    if (
      !allowedTransitions[request.status]?.includes(nextStatus)
    ) {
      warning('Chuyển trạng thái không hợp lệ.');
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

    setDataVersion((value) => value + 1);
    success(`Đã chuyển yêu cầu sang "${STATUS_LABELS[nextStatus]}".`);
  };

  const applyApprovedChangeRequest = (
    request: ChangeRequest
  ) => {
    const project = repo.getProjectById(request.projectId);
    if (!project) return;

    /*
     * Chỉ tự động áp dụng các thay đổi có mapping rõ ràng.
     * Các thay đổi phức tạp (thành viên, kinh phí, nội dung chuyên môn...)
     * cần service/domain handler riêng để không cập nhật sai master data.
     */
    if (request.type === 'EXTENSION') {
      const endDateDiff = request.diffs.find(
        (diff) => diff.fieldName === 'endDate'
      );

      if (endDateDiff?.proposedValue) {
        repo.updateProject(project.id, {
          endDate: endDateDiff.proposedValue,
        });
      }
    }

    if (request.type === 'SUSPENSION') {
      repo.updateProject(project.id, {
        status: 'SUSPENDED',
      });
    }

    if (request.type === 'RESUME') {
      repo.updateProject(project.id, {
        status: 'IN_PROGRESS',
      });
    }

    if (request.type === 'TERMINATION') {
      repo.updateProject(project.id, {
        status: 'TERMINATED',
      });
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      <PageHeader
        title="Gia hạn / Điều chỉnh"
        description="Theo dõi và xử lý các yêu cầu thay đổi trong quá trình thực hiện đề tài."
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#085896]"
            >
              <Plus className="h-3.5 w-3.5" />
              Tạo yêu cầu
            </button>
          ) : undefined
        }
      />

      <section className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Filter className="h-4 w-4 shrink-0 text-slate-400" />

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã yêu cầu, đề tài, lý do..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-xs outline-none focus:border-[#0A6EBD]"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={filterType}
          onChange={(event) => {
            setFilterType(
              event.target.value as 'ALL' | ChangeRequestType
            );
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none"
        >
          <option value="ALL">Tất cả loại</option>
          {Object.entries(TYPE_LABELS).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>

        <select
          value={filterStatus}
          onChange={(event) => {
            setFilterStatus(
              event.target.value as
                | 'ALL'
                | ChangeRequestStatus
            );
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
          >
            <X className="h-3 w-3" />
            Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400">
          <strong className="font-mono text-slate-700">
            {visibleRows.length}
          </strong>{' '}
          yêu cầu
        </span>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-32 px-4 py-3">Mã yêu cầu</th>
                <th className="min-w-[300px] px-4 py-3">Đề tài</th>
                <th className="w-48 px-4 py-3">Loại điều chỉnh</th>
                <th className="w-32 px-4 py-3">Ngày gửi</th>
                <th className="w-36 px-4 py-3 text-center">Trạng thái</th>
                <th className="w-20 px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visibleRows.length === 0 ? (
                <TableEmptyState
                  colSpan={6}
                  title="Không có yêu cầu điều chỉnh"
                  description="Không tìm thấy yêu cầu phù hợp với điều kiện lọc."
                />
              ) : (
                pagedRows.map(({ request, project }) => (
                  <tr
                    key={request.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#0A6EBD]">
                      {request.id}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-mono text-xs font-bold text-[#0A6EBD] hover:underline"
                      >
                        {project.projectCode ||
                          project.proposalCode}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 font-semibold text-slate-900">
                        {project.title}
                      </p>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {TYPE_LABELS[request.type]}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {request.submittedAt}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[request.status]}`}
                      >
                        {STATUS_LABELS[request.status]}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === request.id
                                ? null
                                : request.id
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-500 hover:bg-slate-50"
                          aria-label="Thao tác"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openMenuId === request.id && (
                          <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequestId(request.id);
                                setOpenMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Xem chi tiết
                            </button>

                            {canReview &&
                              (request.status === 'SUBMITTED' ||
                                request.status === 'RESUBMITTED') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateRequestStatus(
                                      request,
                                      'UNDER_REVIEW'
                                    );
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[#0A6EBD] hover:bg-sky-50"
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                  Tiếp nhận thẩm định
                                </button>
                              )}

                            {canReview &&
                              request.status === 'UNDER_REVIEW' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateRequestStatus(
                                        request,
                                        'APPROVED',
                                        'Yêu cầu được phê duyệt.'
                                      );
                                      setOpenMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Phê duyệt
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateRequestStatus(
                                        request,
                                        'REVISION_REQUIRED',
                                        'Yêu cầu bổ sung thông tin.'
                                      );
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs font-medium text-amber-700 hover:bg-amber-50"
                                  >
                                    Yêu cầu bổ sung
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateRequestStatus(
                                        request,
                                        'REJECTED',
                                        'Yêu cầu không được chấp thuận.'
                                      );
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs font-medium text-rose-700 hover:bg-rose-50"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              )}
                          </div>
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

      {modalOpen && (
        <RequestModal
          formData={formData}
          projects={eligibleProjects}
          onChange={setFormData}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateRequest}
        />
      )}

      {selectedRow && (
        <RequestDetailModal
          request={selectedRow.request}
          project={selectedRow.project}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tạo yêu cầu điều chỉnh
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Ghi rõ giá trị hiện tại và giá trị đề nghị thay đổi.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 text-xs">
          <FieldLabel label="Đề tài">
            <select
              required
              value={formData.projectId}
              onChange={(event) =>
                onChange({
                  ...formData,
                  projectId: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2.5 outline-none"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  [{project.projectCode || project.proposalCode}]{' '}
                  {project.title}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="Loại điều chỉnh">
            <select
              value={formData.type}
              onChange={(event) =>
                onChange({
                  ...formData,
                  type: event.target.value as ChangeRequestType,
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2.5 outline-none"
            >
              {Object.entries(TYPE_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </FieldLabel>

          <FieldLabel label="Tiêu đề yêu cầu">
            <input
              required
              value={formData.title}
              onChange={(event) =>
                onChange({
                  ...formData,
                  title: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2.5 outline-none"
              placeholder="Ví dụ: Xin gia hạn thời gian thực hiện đến 31/12/2026"
            />
          </FieldLabel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FieldLabel label="Trường thay đổi">
              <input
                required
                value={formData.fieldName}
                onChange={(event) =>
                  onChange({
                    ...formData,
                    fieldName: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none"
                placeholder="endDate"
              />
            </FieldLabel>

            <FieldLabel label="Giá trị hiện tại">
              <input
                value={formData.currentValue}
                onChange={(event) =>
                  onChange({
                    ...formData,
                    currentValue: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none"
              />
            </FieldLabel>

            <FieldLabel label="Giá trị đề nghị">
              <input
                required
                value={formData.proposedValue}
                onChange={(event) =>
                  onChange({
                    ...formData,
                    proposedValue: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 outline-none"
              />
            </FieldLabel>
          </div>

          <FieldLabel label="Lý do và căn cứ">
            <textarea
              required
              rows={4}
              value={formData.reason}
              onChange={(event) =>
                onChange({
                  ...formData,
                  reason: event.target.value,
                })
              }
              className="w-full resize-none rounded-lg border border-slate-300 p-2.5 outline-none"
              placeholder="Trình bày lý do, căn cứ và ảnh hưởng của thay đổi..."
            />
          </FieldLabel>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
          >
            Hủy
          </button>

          <button
            type="submit"
            className="rounded-lg bg-[#0A6EBD] px-4 py-2 text-xs font-bold text-white hover:bg-[#085896]"
          >
            Gửi yêu cầu
          </button>
        </footer>
      </form>
    </div>
  );
}

function RequestDetailModal({
  request,
  project,
  onClose,
}: {
  request: ChangeRequest;
  project: ResearchProject;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-[#0A6EBD]" />
              <h3 className="text-sm font-bold text-slate-900">
                {request.title}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {project.projectCode || project.proposalCode} ·{' '}
              {TYPE_LABELS[request.type]}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 p-5 text-xs">
          <div>
            <p className="font-semibold text-slate-500">Lý do</p>
            <p className="mt-1 leading-relaxed text-slate-800">
              {request.reason}
            </p>
          </div>

          <div>
            <p className="mb-2 font-semibold text-slate-500">
              Nội dung thay đổi
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Trường</th>
                    <th className="px-3 py-2">Hiện tại</th>
                    <th className="px-3 py-2">Đề nghị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {request.diffs.map((diff, index) => (
                    <tr key={`${diff.fieldName}-${index}`}>
                      <td className="px-3 py-2 font-semibold">
                        {diff.fieldName}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {diff.currentValue || '—'}
                      </td>
                      <td className="px-3 py-2 font-semibold text-[#0A6EBD]">
                        {diff.proposedValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {request.responseComment && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-500">
                Phản hồi xử lý
              </p>
              <p className="mt-1 text-slate-800">
                {request.responseComment}
              </p>
            </div>
          )}
        </div>
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
      <span className="mb-1 block font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}