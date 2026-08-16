'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/common/PageHeader';
import { TableEmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { Pagination } from '@/components/ui/Pagination';
import {
  GitPullRequest,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Eye,
  Printer,
  X,
  Filter,
  Check,
  XCircle,
} from 'lucide-react';
import type { ChangeRequest, ChangeRequestType, ChangeRequestStatus, ResearchProject } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const TYPE_LABELS: Record<ChangeRequestType, string> = {
  EXTENSION: 'Gia hạn thời gian thực hiện',
  CHANGE_PI: 'Thay đổi Chủ nhiệm đề tài',
  CHANGE_MEMBER: 'Thay đổi thành viên nhóm nghiên cứu',
  CHANGE_CONTENT: 'Thay đổi nội dung nghiên cứu',
  CHANGE_OBJECTIVE: 'Thay đổi mục tiêu nghiên cứu',
  CHANGE_PRODUCT: 'Thay đổi sản phẩm cam kết',
  ADJUST_BUDGET: 'Điều chỉnh dự toán kinh phí',
  CHANGE_PARTNER: 'Thay đổi đơn vị phối hợp',
  SUSPENSION: 'Tạm dừng đề tài',
  RESUME: 'Tiếp tục sau tạm dừng',
  TERMINATION: 'Chấm dứt thực hiện đề tài',
  OTHER: 'Yêu cầu điều chỉnh khác',
};

const STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Chờ thẩm định',
  UNDER_REVIEW: 'Đang thẩm định',
  REVISION_REQUIRED: 'Yêu cầu bổ sung',
  RESUBMITTED: 'Đã nộp lại',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Từ chối',
};

const STATUS_COLORS: Record<ChangeRequestStatus, string> = {
  DRAFT: 'bg-slate-50 text-slate-700 border-slate-200',
  SUBMITTED: 'bg-blue-50 text-[#0A6EBD] border-blue-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  REVISION_REQUIRED: 'bg-rose-50 text-rose-700 border-rose-200',
  RESUBMITTED: 'bg-violet-50 text-violet-700 border-violet-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

export default function ChangeRequestsPage() {
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedType, setSelectedType] = useState<ChangeRequestType>('EXTENSION');
  const [reasonText, setReasonText] = useState('');
  const [proposedValue, setProposedValue] = useState('');

  // Filter States
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [responseComment, setResponseComment] = useState('');

  const reloadData = () => {
    setRequests(repo.getChangeRequests());
  };

  useEffect(() => {
    setIsMounted(true);
    reloadData();
  }, [dataVersion]);

  // Các đề tài cho phép đề xuất điều chỉnh (Researcher phải là chủ nhiệm)
  const availableProjects = useMemo(() => {
    const all = repo.getProjects();
    if (currentUser.role === 'RESEARCHER') {
      return all.filter(
        (p) =>
          ['IN_PROGRESS', 'EXTENSION_REQUESTED'].includes(p.status) &&
          p.principalInvestigatorId === currentUser.id
      );
    }
    return all.filter((p) => ['IN_PROGRESS', 'EXTENSION_REQUESTED'].includes(p.status));
  }, [currentUser]);

  // Lọc theo phân quyền vai trò
  const roleFilteredRequests = useMemo(() => {
    if (currentUser.role === 'RESEARCHER') {
      return requests.filter((r) => r.submittedBy === currentUser.id);
    }
    return requests;
  }, [requests, currentUser]);

  const filteredRequests = useMemo(() => {
    return roleFilteredRequests.filter((r) => {
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
      if (filterType !== 'ALL' && r.type !== filterType) return false;
      
      const project = repo.getProjectById(r.projectId);
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          project?.projectCode?.toLowerCase().includes(q) ||
          project?.title?.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [roleFilteredRequests, filterStatus, filterType, search]);

  const pagedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  const hasFilters = filterStatus !== 'ALL' || filterType !== 'ALL' || search.trim();
  const isOfficer = ['RESEARCH_OFFICE', 'ADMIN', 'DIRECTOR'].includes(currentUser.role);

  const handleOpenDetail = (r: ChangeRequest) => {
    setSelectedRequest(r);
    setResponseComment(r.responseComment || '');
    setShowDetailModal(true);
  };

  const handleCreateRequest = () => {
    if (!selectedProjectId) {
      warning('Vui lòng chọn đề tài cần đề xuất điều chỉnh.');
      return;
    }
    if (!reasonText.trim()) {
      warning('Vui lòng nhập lý do và nội dung chi tiết điều chỉnh.');
      return;
    }

    const project = repo.getProjectById(selectedProjectId);
    if (!project) return;

    const newRequest: ChangeRequest = {
      id: `cr-${Date.now()}`,
      projectId: project.id,
      type: selectedType,
      title: `Yêu cầu điều chỉnh: ${TYPE_LABELS[selectedType]}`,
      diffs: proposedValue.trim()
        ? [
            {
              fieldName: selectedType === 'EXTENSION' ? 'Thời gian kết thúc' : 'Thông tin thay đổi',
              currentValue: selectedType === 'EXTENSION' ? (project.endDate || 'Chưa rõ') : 'Cũ',
              proposedValue: proposedValue.trim(),
              reason: reasonText.trim(),
            },
          ]
        : [],
      reason: reasonText.trim(),
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString().slice(0, 10),
      submittedBy: currentUser.id,
      submittedByName: currentUser.fullName,
    };

    const updated = repo.updateProject(project.id, {
      changeRequests: [...(project.changeRequests || []), newRequest],
    });

    if (updated) {
      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        entityType: 'PROJECT',
        entityId: project.id,
        actionCode: 'SUBMIT_CHANGE_REQUEST',
        notes: `Nộp yêu cầu điều chỉnh: ${TYPE_LABELS[selectedType]}.`,
      });

      success('Đã gửi đơn yêu cầu điều chỉnh lên Phòng Quản lý NCKH.');
      setModalOpen(false);
      setSelectedProjectId('');
      setReasonText('');
      setProposedValue('');
      setDataVersion((v) => v + 1);
    } else {
      error('Không thể tạo yêu cầu điều chỉnh.');
    }
  };

  const handleProcessRequest = (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;

    const updated = repo.updateChangeRequest(selectedRequest.id, {
      status,
      responseComment: responseComment.trim() || undefined,
      approvedBy: currentUser.id,
      approvedByName: currentUser.fullName,
      approvedAt: new Date().toISOString().slice(0, 10),
    });

    if (updated) {
      const project = repo.getProjectById(selectedRequest.projectId);
      // Nếu là duyệt gia hạn thời gian, cập nhật luôn ngày kết thúc của đề tài thực tế
      if (status === 'APPROVED' && selectedRequest.type === 'EXTENSION' && project) {
        const proposedDate = selectedRequest.diffs?.[0]?.proposedValue;
        if (proposedDate) {
          repo.updateProject(project.id, {
            endDate: proposedDate,
          });
        }
      }

      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        entityType: 'PROJECT',
        entityId: selectedRequest.projectId,
        actionCode: `CHANGE_REQUEST_${status}`,
        notes: `Thẩm định yêu cầu điều chỉnh ${selectedRequest.id}: ${status === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'}.`,
      });

      success(status === 'APPROVED' ? 'Đã phê duyệt yêu cầu điều chỉnh.' : 'Đã từ chối yêu cầu điều chỉnh.');
      setShowDetailModal(false);
      setDataVersion((v) => v + 1);
    } else {
      error('Không thể cập nhật yêu cầu điều chỉnh.');
    }
  };

  if (!isMounted) {
    return <div className="p-8 text-center text-xs text-slate-500 font-medium">Đang tải trang yêu cầu điều chỉnh...</div>;
  }

  return (
    <div className="space-y-3 text-slate-800 text-xs">
      {/* ── HEADER ── */}
      <PageHeader
        title="Yêu cầu điều chỉnh đề tài"
        description="Quản lý các đề xuất gia hạn, thay đổi thành viên hoặc điều chỉnh kinh phí thực hiện đề tài"
        actions={
          <>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" /> In danh mục
            </button>
            {currentUser.role === 'RESEARCHER' && (
              <button
                onClick={() => {
                  setSelectedProjectId(availableProjects[0]?.id || '');
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-2xs transition whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo yêu cầu điều chỉnh mới
              </button>
            )}
          </>
        }
      />

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex flex-wrap items-center gap-2.5">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã yêu cầu, tên đề tài..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] text-xs outline-none bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className={`py-1.5 px-3 rounded-lg border text-xs font-semibold outline-none transition cursor-pointer ${
            filterType !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả loại điều chỉnh</option>
          <option value="EXTENSION">Gia hạn thời gian thực hiện</option>
          <option value="CHANGE_MEMBER">Thay đổi thành viên</option>
          <option value="ADJUST_BUDGET">Điều chỉnh dự toán kinh phí</option>
          <option value="SUSPENSION">Tạm dừng đề tài</option>
          <option value="TERMINATION">Chấm dứt thực hiện đề tài</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className={`py-1.5 px-3 rounded-lg border text-xs font-semibold outline-none transition cursor-pointer ${
            filterStatus !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="SUBMITTED">Chờ thẩm định</option>
          <option value="APPROVED">Đã phê duyệt</option>
          <option value="REJECTED">Từ chối</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              setFilterType('ALL');
              setFilterStatus('ALL');
              setSearch('');
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-150 transition shadow-2xs cursor-pointer"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-xs text-slate-450 font-medium">
          <strong className="text-slate-700 font-mono font-bold">{filteredRequests.length}</strong> / {requests.length} yêu cầu
        </span>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#0B2A63] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-white select-none">
              <tr>
                <th className="px-4 py-3.5 w-32 whitespace-nowrap">MÃ YÊU CẦU</th>
                <th className="px-4 py-3.5 min-w-[260px]">ĐỀ TÀI NGHIÊN CỨU</th>
                <th className="px-4 py-3.5 w-48 whitespace-nowrap">LOẠI ĐIỀU CHỈNH</th>
                <th className="px-4 py-3.5 min-w-[280px]">NỘI DUNG LÝ DO</th>
                <th className="px-4 py-3.5 w-32 text-center whitespace-nowrap">NGÀY GỬI</th>
                <th className="px-4 py-3.5 w-32 text-center whitespace-nowrap">TRẠNG THÁI</th>
                <th className="px-4 py-3.5 text-center w-28 whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-750">
              {filteredRequests.length === 0 ? (
                <TableEmptyState
                  colSpan={7}
                  title="Không tìm thấy yêu cầu điều chỉnh"
                  description="Không tìm thấy yêu cầu điều chỉnh nào phù hợp với bộ lọc lọc."
                />
              ) : (
                pagedRequests.map((r) => {
                  const project = repo.getProjectById(r.projectId);
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 transition border-l-[3px] border-l-transparent hover:border-l-[#0A6EBD]"
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0A6EBD] whitespace-nowrap align-middle">{r.id}</td>
                      <td className="px-4 py-3.5 align-middle leading-snug">
                        <span className="font-mono text-xs text-[#0A6EBD] font-bold block">
                          {project?.projectCode || project?.proposalCode || '—'}
                        </span>
                        <p className="font-bold text-slate-900 line-clamp-1 mt-0.5">{project?.title || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-900 align-middle">{TYPE_LABELS[r.type]}</td>
                      <td className="px-4 py-3.5 text-slate-650 text-xs max-w-sm align-middle break-words font-medium">
                        <p className="line-clamp-2 leading-relaxed">{r.reason}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-500 whitespace-nowrap align-middle">
                        {formatDate(r.submittedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap align-middle">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_COLORS[r.status]}`}>
                          {STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap align-middle">
                        <button
                          onClick={() => handleOpenDetail(r)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EBF4FC] hover:bg-[#D8ECF9] text-[#0A6EBD] rounded-lg border border-[#B8D7F5] transition shadow-2xs font-bold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> 
                          {isOfficer && r.status === 'SUBMITTED' ? 'Thẩm định' : 'Chi tiết'}
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

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredRequests.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="yêu cầu"
      />

      {/* Modal Tạo Yêu cầu (Dành cho Researcher) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Tạo yêu cầu điều chỉnh đề tài</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {availableProjects.length === 0 ? (
                <div className="text-center p-6 text-slate-500 font-medium bg-slate-50 rounded-lg border border-slate-200">
                  Bạn không có đề tài nào đang thực hiện để gửi đề xuất điều chỉnh.
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-bold text-slate-750 block mb-1.5">Chọn đề tài nghiên cứu *</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full p-2 border border-slate-350 bg-white rounded-lg outline-none focus:border-[#0A6EBD] font-semibold"
                    >
                      <option value="">-- Chọn đề tài đang thực hiện --</option>
                      {availableProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.projectCode || p.proposalCode}] {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-750 block mb-1.5">Nội dung đề xuất điều chỉnh *</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as ChangeRequestType)}
                      className="w-full p-2 border border-slate-350 bg-white rounded-lg outline-none focus:border-[#0A6EBD] font-semibold"
                    >
                      <option value="EXTENSION">Gia hạn thời gian thực hiện đề tài</option>
                      <option value="CHANGE_MEMBER">Thay đổi / bổ sung thành viên tham gia</option>
                      <option value="ADJUST_BUDGET">Điều chỉnh dự toán kinh phí thực hiện</option>
                      <option value="SUSPENSION">Tạm dừng đề tài đột xuất</option>
                      <option value="TERMINATION">Chấm dứt đề tài sớm</option>
                    </select>
                  </div>

                  {selectedType === 'EXTENSION' && (
                    <div>
                      <label className="font-bold text-slate-750 block mb-1.5">Ngày kết thúc đề xuất mới *</label>
                      <input
                        type="date"
                        value={proposedValue}
                        onChange={(e) => setProposedValue(e.target.value)}
                        className="w-full p-2 border border-slate-355 bg-white rounded-lg outline-none focus:border-[#0A6EBD] font-mono font-semibold"
                      />
                    </div>
                  )}

                  {selectedType !== 'EXTENSION' && (
                    <div>
                      <label className="font-bold text-slate-750 block mb-1.5">Nội dung điều chỉnh thay thế *</label>
                      <input
                        type="text"
                        placeholder="Nhập giá trị đề xuất thay thế..."
                        value={proposedValue}
                        onChange={(e) => setProposedValue(e.target.value)}
                        className="w-full p-2 border border-slate-350 bg-white rounded-lg outline-none focus:border-[#0A6EBD] font-semibold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-750 block mb-1.5">Lý do & giải trình căn cứ *</label>
                    <textarea
                      rows={4}
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      placeholder="Nêu rõ khó khăn, tính cần thiết và căn cứ đề xuất..."
                      className="w-full p-2 border border-slate-300 bg-white rounded-lg outline-none focus:border-[#0A6EBD] font-medium resize-none"
                    ></textarea>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
              >
                Hủy bỏ
              </button>
              {availableProjects.length > 0 && (
                <button
                  onClick={handleCreateRequest}
                  className="px-4 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Gửi yêu cầu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết & Thẩm định (Dành cho Office) */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Chi tiết yêu cầu điều chỉnh</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{selectedRequest.id} • Người gửi: {selectedRequest.submittedByName}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <p className="text-slate-550 font-bold uppercase tracking-wider text-[9px]">Đề tài liên quan</p>
                <p className="font-bold text-slate-900 text-xs">
                  {repo.getProjectById(selectedRequest.projectId)?.title || '—'}
                </p>
                <p className="text-slate-500">
                  Mã số: <strong className="text-slate-700 font-mono">{repo.getProjectById(selectedRequest.projectId)?.projectCode || '—'}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-450 block mb-0.5 font-bold">Loại điều chỉnh:</span>
                  <strong className="text-slate-900 text-xs">{TYPE_LABELS[selectedRequest.type]}</strong>
                </div>
                <div>
                  <span className="text-slate-455 block mb-0.5 font-bold">Ngày gửi đề xuất:</span>
                  <strong className="text-slate-900 text-xs font-mono">{formatDate(selectedRequest.submittedAt)}</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-450 block mb-1 font-bold">Chi tiết thay đổi đề xuất:</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-32">Trường thay đổi</th>
                        <th className="p-2 w-36">Giá trị hiện tại</th>
                        <th className="p-2">Giá trị đề xuất</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {selectedRequest.diffs && selectedRequest.diffs.length > 0 ? (
                        selectedRequest.diffs.map((diff, index) => (
                          <tr key={index}>
                            <td className="p-2 text-slate-600">{diff.fieldName}</td>
                            <td className="p-2 text-slate-500 font-mono">{diff.currentValue}</td>
                            <td className="p-2 text-emerald-800 font-bold font-mono bg-emerald-50/20">{diff.proposedValue}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-2 text-center text-slate-400 italic">Chưa có bảng so sánh chi tiết.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <span className="text-slate-450 block mb-1 font-bold">Lý do & giải trình chi tiết:</span>
                <p className="p-3 bg-white border border-slate-200 rounded-lg leading-relaxed text-slate-700 font-medium whitespace-pre-line">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.status === 'SUBMITTED' && isOfficer ? (
                <div>
                  <label className="font-bold text-slate-750 block mb-1.5">Ghi chú phản hồi thẩm định (nếu có):</label>
                  <textarea
                    rows={2.5}
                    value={responseComment}
                    onChange={(e) => setResponseComment(e.target.value)}
                    placeholder="Ý kiến của Phòng NCKH, nội dung đồng ý hoặc lý do từ chối..."
                    className="w-full p-2 border border-slate-350 rounded-lg outline-none focus:border-[#0A6EBD] resize-none"
                  ></textarea>
                </div>
              ) : selectedRequest.responseComment ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-450 block mb-1 font-bold">Ý kiến thẩm định của Phòng NCKH:</span>
                  <p className="text-slate-700 leading-relaxed font-medium italic">&ldquo;{selectedRequest.responseComment}&rdquo;</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Duyệt bởi: {selectedRequest.approvedByName} • {selectedRequest.approvedAt}</p>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
              >
                Đóng
              </button>

              {selectedRequest.status === 'SUBMITTED' && isOfficer && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleProcessRequest('REJECTED')}
                    className="inline-flex items-center gap-1 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ chối
                  </button>
                  <button
                    onClick={() => handleProcessRequest('APPROVED')}
                    className="inline-flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Phê duyệt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
