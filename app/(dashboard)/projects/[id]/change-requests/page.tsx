'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { ChangeRequest, ChangeRequestStatus, ChangeRequestType } from '@/lib/types';
import { formatVND, formatDate } from '@/lib/utils';
import { 
  ArrowLeft, 
  GitPullRequest, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ArrowRight,
  User,
  Settings,
  ShieldCheck,
  Eye,
  FileCheck2
} from 'lucide-react';

export default function ProjectChangeRequestsPage({ params }: { params: { id: string } }) {
  const project = repo.getProjectById(params.id);
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();

  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(() => project?.changeRequests || []);
  const [selectedCr, setSelectedCr] = useState<ChangeRequest | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'EXTENSION' as ChangeRequestType,
    title: 'Đề xuất điều chỉnh gia hạn tiến độ',
    fieldName: 'Ngày kết thúc',
    currentValue: project?.endDate || '',
    proposedValue: '',
    reason: '',
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

  const handleCreateChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.proposedValue || !formData.reason) {
      warning('Vui lòng nhập giá trị đề nghị thay đổi và lý do.');
      return;
    }

    const cr: ChangeRequest = {
      id: `cr-${Date.now()}`,
      projectId: project.id,
      type: formData.type,
      title: formData.title,
      diffs: [
        {
          fieldName: formData.fieldName,
          currentValue: formData.currentValue,
          proposedValue: formData.proposedValue,
          reason: formData.reason,
        }
      ],
      reason: formData.reason,
      status: 'SUBMITTED',
      submittedAt: new Date().toLocaleDateString('vi-VN'),
      submittedBy: currentUser.id,
      submittedByName: currentUser.fullName,
    };

    const updatedCrs = [...changeRequests, cr];
    repo.updateProject(project.id, { changeRequests: updatedCrs });
    setChangeRequests(updatedCrs);
    setShowAddModal(false);
    success('Đã gửi đề xuất điều chỉnh đề tài thành công! Chờ Phòng NCKH xem xét.');

    // Add Audit Log
    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'SUBMIT_CHANGE_REQUEST',
      entityType: 'CHANGE_REQUEST',
      entityId: cr.id,
      notes: `Đề xuất điều chỉnh: ${cr.title}. Loại: ${cr.type}`,
    });
  };

  const handleReviewChangeRequest = (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedCr) return;

    confirm({
      title: status === 'APPROVED' ? 'Phê duyệt điều chỉnh' : 'Từ chối điều chỉnh',
      message: `Bạn chắc chắn muốn duyệt điều chỉnh này? Hành động này sẽ cập nhật dữ liệu gốc của đề tài nếu được phê duyệt.`,
      confirmLabel: 'Xác nhận',
      onConfirm: () => {
        const updatedCrs = changeRequests.map((cr) => {
          if (cr.id === selectedCr.id) {
            return {
              ...cr,
              status: status as ChangeRequestStatus,
              approvedAt: new Date().toLocaleDateString('vi-VN'),
              approvedBy: currentUser.id,
              approvedByName: currentUser.fullName,
            };
          }
          return cr;
        });

        // CRITICAL BUSINESS RULE: Update project core data ONLY when CR is APPROVED
        const projectUpdates: any = { changeRequests: updatedCrs };
        
        if (status === 'APPROVED') {
          selectedCr.diffs.forEach((diff) => {
            if (diff.fieldName === 'Ngày kết thúc') {
              projectUpdates.endDate = diff.proposedValue;
            } else if (diff.fieldName === 'Chủ nhiệm đề tài') {
              projectUpdates.principalInvestigatorName = diff.proposedValue;
            } else if (diff.fieldName === 'Kinh phí') {
              projectUpdates.approvedBudget = Number(diff.proposedValue);
            }
          });
        }

        repo.updateProject(project.id, projectUpdates);
        setChangeRequests(updatedCrs);
        setSelectedCr(null);
        success(`Đã cập nhật quyết định điều chỉnh thành ${status} thành công!`);

        // Add Audit Log
        repo.addAuditLog({
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          actionCode: `CHANGE_REQUEST_${status}`,
          entityType: 'CHANGE_REQUEST',
          entityId: selectedCr.id,
          notes: `Quyết định điều chỉnh đề tài: ${status}`,
        });
      }
    });
  };

  const getCrTypeLabel = (type: ChangeRequestType) => {
    switch (type) {
      case 'EXTENSION': return 'Gia hạn thời gian';
      case 'CHANGE_PI': return 'Thay đổi Chủ nhiệm';
      case 'CHANGE_MEMBER': return 'Thay đổi thành viên';
      case 'ADJUST_BUDGET': return 'Điều chỉnh kinh phí';
      default: return 'Điều chỉnh khác';
    }
  };

  const getStatusBadge = (status: ChangeRequestStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="bg-slate-100 text-slate-800 border-slate-200 border text-xs px-2.5 py-0.5 rounded font-bold">Dự thảo</span>;
      case 'SUBMITTED':
        return <span className="bg-amber-50 text-amber-800 border-amber-200 border text-xs px-2.5 py-0.5 rounded font-bold">Chờ duyệt</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-blue-50 text-blue-800 border-blue-200 border text-xs px-2.5 py-0.5 rounded font-bold">Đang xem xét</span>;
      case 'APPROVED':
        return <span className="bg-emerald-50 text-emerald-800 border-emerald-200 border text-xs px-2.5 py-0.5 rounded font-bold">Đã phê duyệt</span>;
      case 'REJECTED':
        return <span className="bg-rose-50 text-rose-800 border-rose-200 border text-xs px-2.5 py-0.5 rounded font-bold">Từ chối</span>;
      default:
        return null;
    }
  };

  const columns: ColumnDef<ChangeRequest>[] = [
    {
      key: 'type',
      header: 'Loại điều chỉnh',
      render: (row) => <span className="font-bold text-slate-900">{getCrTypeLabel(row.type)}</span>,
    },
    {
      key: 'submittedAt',
      header: 'Ngày nộp',
      render: (row) => <span className="font-mono text-slate-500">{row.submittedAt}</span>,
    },
    {
      key: 'submittedByName',
      header: 'Người đề xuất',
      render: (row) => <span className="text-slate-800 font-semibold">{row.submittedByName}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => getStatusBadge(row.status),
    },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        title="Yêu cầu điều chỉnh đề tài"
        description={`Đề tài: ${project.title}`}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Chi tiết
            </Link>
            {currentUser.role === 'RESEARCHER' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Đề xuất điều chỉnh
              </button>
            )}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={changeRequests}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelectedCr(row)}
        emptyTitle="Không có yêu cầu điều chỉnh"
        emptyDescription="Đề tài đang được thực hiện theo đúng đề cương phê duyệt ban đầu."
      />

      {/* Detail side drawer */}
      {selectedCr && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelectedCr(null)} />
          <div className="relative ml-auto w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-[#0B2A63] text-white">
              <h3 className="font-bold text-sm">Chi tiết Đề xuất điều chỉnh</h3>
              <button onClick={() => setSelectedCr(null)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Comparative diff block */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Bảng so sánh thay đổi</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="p-3">Hạng mục</th>
                        <th className="p-3">Hiện tại</th>
                        <th className="p-3">Đề nghị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {selectedCr.diffs.map((diff, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-bold text-slate-950">{diff.fieldName}</td>
                          <td className="p-3 text-slate-500 line-through bg-rose-50/20">{diff.currentValue}</td>
                          <td className="p-3 text-emerald-700 font-bold bg-emerald-50/20">{diff.proposedValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Lý do điều chỉnh</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/50 leading-relaxed font-semibold">
                  &quot;{selectedCr.reason}&quot;
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Người đề xuất:</span>
                  <strong className="text-slate-800">{selectedCr.submittedByName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Ngày gửi:</span>
                  <strong className="text-slate-800 font-mono">{selectedCr.submittedAt}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Trạng thái:</span>
                  {getStatusBadge(selectedCr.status)}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setSelectedCr(null)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl">Đóng</button>
              {selectedCr.status === 'SUBMITTED' && currentUser.role === 'RESEARCH_OFFICE' && (
                <>
                  <button
                    onClick={() => handleReviewChangeRequest('REJECTED')}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleReviewChangeRequest('APPROVED')}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-xl transition shadow-sm"
                  >
                    Phê duyệt điều chỉnh
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add CR Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <form onSubmit={handleCreateChangeRequest}>
              <div className="px-5 py-4 border-b border-slate-100 bg-[#0B2A63] text-white flex justify-between items-center">
                <h3 className="font-bold text-sm">Tạo đề xuất điều chỉnh đề tài</h3>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Loại điều chỉnh *</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none cursor-pointer"
                    value={formData.type}
                    onChange={(e) => {
                      const type = e.target.value as ChangeRequestType;
                      let fieldName = 'Ngày kết thúc';
                      let currentValue = project.endDate;
                      let title = 'Đề xuất điều chỉnh gia hạn tiến độ';
                      if (type === 'CHANGE_PI') {
                        fieldName = 'Chủ nhiệm đề tài';
                        currentValue = project.principalInvestigatorName;
                        title = 'Đề xuất điều chỉnh Chủ nhiệm đề tài';
                      } else if (type === 'ADJUST_BUDGET') {
                        fieldName = 'Kinh phí';
                        currentValue = String(project.approvedBudget);
                        title = 'Đề xuất điều chỉnh kinh phí đề tài';
                      }
                      setFormData({ ...formData, type, fieldName, currentValue, title });
                    }}
                  >
                    <option value="EXTENSION">Gia hạn thời gian (EXTENSION)</option>
                    <option value="CHANGE_PI">Thay đổi Chủ nhiệm (CHANGE_PI)</option>
                    <option value="ADJUST_BUDGET">Điều chỉnh kinh phí (ADJUST_BUDGET)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Hạng mục điều chỉnh</label>
                  <input
                    type="text"
                    disabled
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 text-slate-500 font-semibold"
                    value={formData.fieldName}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Giá trị hiện tại</label>
                    <input
                      type="text"
                      disabled
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 text-slate-500 font-mono"
                      value={formData.currentValue}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Giá trị đề xuất *</label>
                    <input
                      type="text"
                      required
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none font-mono"
                      placeholder="Nhập giá trị thay đổi..."
                      value={formData.proposedValue}
                      onChange={(e) => setFormData({ ...formData, proposedValue: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Lý do điều chỉnh *</label>
                  <textarea
                    rows={3}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none"
                    placeholder="Giải trình chi tiết lý do đề xuất điều chỉnh..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100">Hủy</button>
                <button type="submit" className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-xl shadow-xs">Gửi đề xuất</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
