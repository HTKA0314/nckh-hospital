'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function ChangeRequestsPage() {
  const { currentUser } = useAuth();
  const { success } = useToast();
  const projects = repo.getProjects().filter((p) => p.status === 'IN_PROGRESS');
  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Danh sách các yêu cầu điều chỉnh mẫu
  const allRequests = [
    {
      id: 'CR-001',
      code: 'DT-2025-001',
      title: 'Đánh giá hiệu quả can thiệp động mạch vành qua da ở bệnh nhân nhồi máu cơ tim',
      type: 'Gia hạn thời gian thực hiện',
      reason: 'Thời gian thu thập mẫu bệnh án bị kéo dài do số lượng ca cấp cứu can thiệp phân tán',
      requestDate: '15/03/2026',
      status: 'APPROVED',
      statusLabel: 'Đã phê duyệt',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    },
    {
      id: 'CR-002',
      code: 'DT-2025-007',
      title: 'Ứng dụng thang điểm NEWS2 trong cảnh báo sớm suy hô hấp ở bệnh nhân thở máy',
      type: 'Bổ sung thành viên nhóm nghiên cứu',
      reason: 'Bổ sung 02 Bác sĩ hồi sức hỗ trợ ca trực đêm ghi nhận thông số NEWS2',
      requestDate: '02/04/2026',
      status: 'PENDING',
      statusLabel: 'Chờ thẩm định',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-300',
    },
  ];

  const filteredRequests = allRequests.filter((r) => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (filterType !== 'ALL' && r.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pagedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasFilters = filterStatus !== 'ALL' || filterType !== 'ALL' || search.trim();

  return (
    <div className="space-y-3 text-slate-800">
      {/* ── HEADER: Tiêu đề trang + Actions ── */}
      <PageHeader
        title="Yêu cầu điều chỉnh đề tài"
        description="Quản lý các đề xuất gia hạn, thay đổi thành viên hoặc điều chỉnh kinh phí thực hiện"
        actions={
          <>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" /> In danh mục
            </button>
            {currentUser.role === 'RESEARCHER' && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold px-3.5 py-2 rounded-lg text-[13px] shadow-xs transition whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo yêu cầu điều chỉnh mới
              </button>
            )}
          </>
        }
      />

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-2.5">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã yêu cầu, tên đề tài..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] text-xs outline-none bg-white transition"
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
          onChange={(e) => setFilterType(e.target.value)}
          className={`py-1.5 px-3 rounded-lg border text-xs font-medium outline-none transition cursor-pointer ${
            filterType !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả loại điều chỉnh</option>
          <option value="Gia hạn thời gian thực hiện">Gia hạn thời gian</option>
          <option value="Bổ sung thành viên nhóm nghiên cứu">Thay đổi / Bổ sung thành viên</option>
          <option value="Điều chỉnh dự toán kinh phí">Điều chỉnh dự toán kinh phí</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`py-1.5 px-3 rounded-lg border text-xs font-medium outline-none transition cursor-pointer ${
            filterStatus !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ thẩm định</option>
          <option value="APPROVED">Đã phê duyệt</option>
          <option value="REJECTED">Từ chối</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => { setFilterType('ALL'); setFilterStatus('ALL'); setSearch(''); }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-100 transition-all shadow-2xs cursor-pointer animate-in fade-in"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400 font-medium">
          <strong className="text-slate-700 font-mono font-bold">{filteredRequests.length}</strong> / {allRequests.length} yêu cầu
        </span>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 w-28 whitespace-nowrap">MÃ YÊU CẦU</th>
                <th className="px-4 py-3 min-w-[280px]">ĐỀ TÀI NGHIÊN CỨU</th>
                <th className="px-4 py-3 w-48 whitespace-nowrap">LOẠI ĐIỀU CHỈNH</th>
                <th className="px-4 py-3 min-w-[320px]">LÝ DO ĐIỀU CHỈNH</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap">NGÀY GỬI</th>
                <th className="px-4 py-3 w-32 text-center whitespace-nowrap">TRẠNG THÁI</th>
                <th className="px-4 py-3 text-center w-20 whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <TableEmptyState
                  colSpan={7}
                  title="Không tìm thấy yêu cầu điều chỉnh"
                  description="Không tìm thấy yêu cầu điều chỉnh nào phù hợp với bộ lọc."
                />
              ) : (
                pagedRequests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 transition border-l-4 border-l-transparent hover:border-l-[#0A6EBD]"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-[#0A6EBD] whitespace-nowrap">{r.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#0A6EBD] font-bold block">{r.code}</span>
                      <p className="font-semibold text-slate-900 line-clamp-1 mt-0.5">{r.title}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.type}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs break-words max-w-md">{r.reason}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{r.requestDate}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${r.statusColor}`}>
                        {r.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => alert(`Xem chi tiết yêu cầu ${r.id}`)}
                        className="p-1.5 bg-[#EBF4FC] hover:bg-[#D8ECF9] text-[#0A6EBD] rounded-lg border border-[#B8D7F5] transition inline-flex"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
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
        totalItems={filteredRequests.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="yêu cầu"
      />

      {/* Modal Tạo Yêu cầu */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Gửi đơn yêu cầu điều chỉnh đề tài</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chọn đề tài cần điều chỉnh:</label>
                <select className="w-full p-2 border border-slate-300 rounded-lg outline-none">
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode || p.proposalCode}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nội dung đề nghị điều chỉnh:</label>
                <select className="w-full p-2 border border-slate-300 rounded-lg outline-none">
                  <option>Gia hạn thời gian thực hiện (Tối đa 6 tháng)</option>
                  <option>Thay đổi / Bổ sung thành viên nhóm nghiên cứu</option>
                  <option>Điều chỉnh dự toán kinh phí giữa các mục</option>
                  <option>Điều chỉnh phạm vi / cỡ mẫu nghiên cứu</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lý do & căn cứ đề nghị điều chỉnh:</label>
                <textarea
                  rows={3}
                  placeholder="Trình bày rõ khó khăn thực tế và giải pháp khắc phục..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  success('Đã gửi đơn yêu cầu điều chỉnh lên Phòng Quản lý NCKH!');
                  setModalOpen(false);
                }}
                className="px-4 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg text-xs font-semibold shadow-2xs"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
