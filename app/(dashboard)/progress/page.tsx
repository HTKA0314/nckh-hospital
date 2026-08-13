'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatVND } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { TableEmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Plus,
  ArrowRight,
  Filter,
  Search,
  CheckSquare,
  Eye,
  Edit,
  Printer,
  X,
} from 'lucide-react';

export default function ProgressWorkspacePage() {
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();
  const projects = repo.getProjects().filter((p) => p.status === 'IN_PROGRESS' || p.status === 'ACCEPTED');

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [detailProjectModal, setDetailProjectModal] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredProjects = projects.filter((p) => {
    if (selectedDept !== 'ALL' && p.departmentName !== selectedDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.projectCode && p.projectCode.toLowerCase().includes(q)) ||
        p.principalInvestigatorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pagedProjects = filteredProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasFilters = selectedDept !== 'ALL' || search.trim();

  return (
    <div className="space-y-3 text-slate-800">
      {/* ── HEADER: Tiêu đề trang + Actions ── */}
      <PageHeader
        title="Theo dõi Tiến độ & Báo cáo"
        description="Quản lý mốc kiểm tra, tiến độ thực hiện và phê duyệt báo cáo định kỳ các đề tài"
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
                onClick={() => setReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold px-3.5 py-2 rounded-lg text-[13px] shadow-xs transition whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Nộp báo cáo tiến độ kỳ mới
              </button>
            )}
          </>
        }
      />

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-2.5">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã đề tài, tên, chủ nhiệm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] text-xs outline-none bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className={`py-1.5 px-3 rounded-lg border text-xs font-medium outline-none transition cursor-pointer ${
            selectedDept !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả khoa / phòng</option>
          <option value="Khoa Tim mạch">Khoa Tim mạch</option>
          <option value="Khoa Nội tiết">Khoa Nội tiết</option>
          <option value="Khoa Dược">Khoa Dược</option>
          <option value="Khoa Ngoại Tiết niệu">Khoa Ngoại Tiết niệu</option>
          <option value="Khoa Hồi sức tích cực - Chống độc">Khoa Hồi sức tích cực - Chống độc</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSelectedDept('ALL'); setSearch(''); }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-100 transition-all shadow-2xs cursor-pointer animate-in fade-in"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400 font-medium">
          <strong className="text-slate-700 font-mono font-bold">{filteredProjects.length}</strong> / {projects.length} đề tài đang thực hiện
        </span>
      </div>

      {/* 3. BẢNG DỮ LIỆU TIẾN ĐỘ TOÀN MÀN HÌNH (Đồng nhất) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 w-28 whitespace-nowrap">MÃ ĐỀ TÀI</th>
                <th className="px-4 py-3 min-w-[320px]">TÊN ĐỀ TÀI NGHIÊN CỨU</th>
                <th className="px-4 py-3 w-44 whitespace-nowrap">CHỦ NHIỆM & ĐƠN VỊ</th>
                <th className="px-4 py-3 w-32 whitespace-nowrap">KỲ HẠN</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap">TIẾN ĐỘ THỰC HIỆN</th>
                <th className="px-4 py-3 w-32 whitespace-nowrap">BÁO CÁO GẦN NHẤT</th>
                <th className="px-4 py-3 text-center w-24 whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <TableEmptyState
                  colSpan={7}
                  title="Không có đề tài nào"
                  description="Không tìm thấy đề tài nào phù hợp với bộ lọc."
                />
              ) : (
                pagedProjects.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition border-l-4 border-l-transparent hover:border-l-[#0A6EBD]"
                    >
                      {/* Mã đề tài */}
                      <td className="px-4 py-3 font-mono font-bold text-[#0A6EBD] whitespace-nowrap align-middle">
                        <button
                          onClick={() => setDetailProjectModal(p)}
                          className="hover:underline font-mono text-left"
                        >
                          {p.projectCode || p.proposalCode}
                        </button>
                      </td>

                      {/* Tên đề tài */}
                      <td className="px-4 py-3 align-middle">
                        <button
                          onClick={() => setDetailProjectModal(p)}
                          className="font-semibold text-slate-900 hover:text-[#0A6EBD] transition text-left line-clamp-1 leading-snug"
                        >
                          {p.title}
                        </button>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {p.researchField} • {p.departmentName}
                        </p>
                      </td>

                      {/* Chủ nhiệm & Đơn vị */}
                      <td className="px-4 py-3 align-middle">
                        <p className="font-semibold text-slate-900">{p.principalInvestigatorName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.departmentName}</p>
                      </td>

                      {/* Kỳ hạn */}
                      <td className="px-4 py-3 font-mono text-[12px] text-slate-600 whitespace-nowrap align-middle">
                        {p.startDate} → {p.endDate}
                      </td>

                      {/* Tiến độ thực hiện (%) */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all ${
                                p.status === 'ACCEPTED'
                                  ? 'bg-emerald-500'
                                  : 'bg-[#0A6EBD]'
                              }`}
                              style={{ width: `${p.reportedProgressPercentage ?? 0}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs text-slate-700 w-9 text-right">
                            {p.status === 'ACCEPTED' ? '100%' : `${p.reportedProgressPercentage ?? 0}%`}
                          </span>
                        </div>
                      </td>

                      {/* Kỳ báo cáo gần nhất */}
                      <td className="px-4 py-3 whitespace-nowrap align-middle">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Clock className="w-3 h-3 text-[#0A6EBD]" /> 15/01/2026
                        </span>
                      </td>

                      {/* Thao tác (Eye + Text) */}
                      <td className="px-4 py-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setDetailProjectModal(p)}
                            title="Xem mốc tiến độ & lịch sử báo cáo"
                            className="p-1.5 bg-[#EBF4FC] hover:bg-[#D8ECF9] text-[#0A6EBD] rounded-lg border border-[#B8D7F5] transition shadow-2xs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
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
        totalItems={filteredProjects.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="đề tài"
      />

      {/* 4. MODAL CHI TIẾT MỐC TIẾN ĐỘ & BÁO CÁO KỲ CỦA ĐỀ TÀI */}
      {detailProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#D8DEE6] shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-[#D8DEE6] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <span className="font-mono font-bold text-xs bg-[#EBF4FC] text-[#0A6EBD] px-2 py-0.5 rounded border border-[#B8D7F5] mr-2">
                  {detailProjectModal.projectCode}
                </span>
                <span className="font-bold text-slate-800 text-[14px]">Chi tiết tiến độ thực hiện đề tài</span>
              </div>
              <button
                onClick={() => setDetailProjectModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{detailProjectModal.title}</h3>
                <p className="text-slate-500 mt-1">
                  Chủ nhiệm: <strong>{detailProjectModal.principalInvestigatorName}</strong> • Đơn vị: <strong>{detailProjectModal.departmentName}</strong> • Thời hạn: {detailProjectModal.startDate} → {detailProjectModal.endDate}
                </p>
              </div>

              {/* Mốc cốt lõi */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wide">1. Các mốc tiến độ cốt lõi (Milestones)</h4>
                <div className="space-y-1.5">
                  <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-950">Mốc 1: Thu thập 120 mẫu bệnh án nghiên cứu</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-0.5 ml-6">Hạn: 30/06/2025 • Đã hoàn tất 100% mẫu</p>
                    </div>
                    <span className="font-mono font-bold text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                      HOÀN THÀNH
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#EBF4FC] rounded border border-[#B8D7F5] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0A6EBD] shrink-0" />
                        <span className="font-bold text-[#0A6EBD]">Mốc 2: Phân tích số liệu SPSS & Xử lý thống kê</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 ml-6">Hạn: 31/12/2025 • Đang hoàn thiện các biểu đồ so sánh</p>
                    </div>
                    <span className="font-mono font-bold text-[11px] text-[#0A6EBD] bg-white px-2 py-0.5 rounded border border-[#B8D7F5]">
                      ĐANG THỰC HIỆN
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-700">Mốc 3: Hoàn thiện dự thảo Báo cáo tổng kết nghiệm thu</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 ml-6">Hạn: 28/02/2026 • Chuẩn bị hồ sơ nghiệm thu chính thức</p>
                    </div>
                    <span className="font-mono font-bold text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-300">
                      CHƯA BẮT ĐẦU
                    </span>
                  </div>
                </div>
              </div>

              {/* Lịch sử báo cáo định kỳ */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wide">2. Lịch sử báo cáo tiến độ định kỳ</h4>
                <div className="border border-[#D8DEE6] rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="p-2.5">KỲ BÁO CÁO</th>
                        <th className="p-2.5 w-28">NGÀY NỘP</th>
                        <th className="p-2.5 w-24 text-center">% TIẾN ĐỘ</th>
                        <th className="p-2.5">Ý KIẾN THẨM ĐỊNH PHÒNG NCKH</th>
                        <th className="p-2.5 w-28 text-center">TRẠNG THÁI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      <tr>
                        <td className="p-2 font-semibold text-slate-900">Báo cáo 6 tháng Đợt 1 (2025)</td>
                        <td className="p-2 font-mono text-slate-600">30/06/2025</td>
                        <td className="p-2 font-mono font-bold text-[#0A6EBD] text-center">35%</td>
                        <td className="p-2 text-slate-700">Đã kiểm tra minh chứng bệnh án, tiến độ đúng hạn.</td>
                        <td className="p-2 text-center">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            ĐÃ DUYỆT
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold text-slate-900">Báo cáo 12 tháng Định kỳ (2025)</td>
                        <td className="p-2 font-mono text-slate-600">15/01/2026</td>
                        <td className="p-2 font-mono font-bold text-[#0A6EBD] text-center">65%</td>
                        <td className="p-2 text-slate-700">Đề nghị đẩy nhanh phân tích kết quả can thiệp stent.</td>
                        <td className="p-2 text-center">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            ĐÃ DUYỆT
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 border-t border-[#D8DEE6] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setDetailProjectModal(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL NỘP BÁO CÁO TIẾN ĐỘ KỲ MỚI */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#D8DEE6] shadow-xl max-w-lg w-full p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#D8DEE6] pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Nộp báo cáo tiến độ định kỳ</h3>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chọn đề tài nộp báo cáo:</label>
                <select className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-[#0A6EBD]">
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kỳ báo cáo:</label>
                <input
                  type="text"
                  defaultValue="Báo cáo tiến độ định kỳ 6 tháng tiếp theo"
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">% Tiến độ hoàn thành thực tế:</label>
                <input
                  type="number"
                  defaultValue={75}
                  min={0}
                  max={100}
                  className="w-full p-2 border border-slate-300 rounded outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tóm tắt kết quả đạt được & khó khăn:</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả số lượng bệnh nhân đã thu thập, các mốc đã hoàn thành..."
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D8DEE6]">
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  confirm({
                    title: 'Xác nhận nộp báo cáo tiến độ',
                    message: 'Bạn có chắc chắn muốn nộp báo cáo tiến độ định kỳ lên Phòng Quản lý NCKH? Báo cáo sẽ được chuyển đến chuyên viên phụ trách để ghi nhận kết quả.',
                    confirmLabel: 'Nộp báo cáo ngay',
                    type: 'info',
                    onConfirm: () => {
                      setReportModalOpen(false);
                      success('Đã gửi báo cáo tiến độ định kỳ lên Phòng Quản lý NCKH thành công!');
                    },
                  });
                }}
                className="px-4 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded text-xs font-semibold shadow-sm"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
