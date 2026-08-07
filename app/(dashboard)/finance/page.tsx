'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { formatVND } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Search,
  CreditCard,
  Building2,
  Eye,
  X,
  Filter,
} from 'lucide-react';

export default function FinanceWorkspacePage() {
  const { currentUser } = useAuth();
  const projects = repo.getProjects();
  const departments = repo.getDepartments();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = projects.filter((p) => {
    if (selectedDept !== 'ALL' && p.departmentId !== selectedDept) return false;
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'COMPLETED' && p.status !== 'ACCEPTED') return false;
      if (selectedStatus === 'IN_PROGRESS' && p.status !== 'IN_PROGRESS') return false;
      if (selectedStatus === 'PLANNING' && (p.status === 'IN_PROGRESS' || p.status === 'ACCEPTED')) return false;
    }
    if (
      search.trim() &&
      !p.title.toLowerCase().includes(search.toLowerCase()) &&
      !p.proposalCode.toLowerCase().includes(search.toLowerCase()) &&
      !(p.projectCode && p.projectCode.toLowerCase().includes(search.toLowerCase())) &&
      !p.principalInvestigatorName.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const pagedProjects = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalApproved = filtered.reduce((acc, curr) => acc + (curr.approvedBudget || curr.estimatedBudget), 0);
  const totalAllocated = filtered.reduce((acc, curr) => {
    const b = curr.approvedBudget || curr.estimatedBudget;
    return acc + (curr.status === 'IN_PROGRESS' ? b * 0.5 : curr.status === 'ACCEPTED' ? b * 1.0 : 0);
  }, 0);
  const totalDisbursed = filtered.reduce((acc, curr) => {
    const b = curr.approvedBudget || curr.estimatedBudget;
    return acc + (curr.status === 'IN_PROGRESS' ? b * 0.35 : curr.status === 'ACCEPTED' ? b * 0.95 : 0);
  }, 0);

  const hasFilters = selectedDept !== 'ALL' || selectedStatus !== 'ALL' || search.trim();

  return (
    <div className="space-y-3 text-slate-800">
      {/* ── Toolbar: Search + Actions trên 1 hàng ── */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đề tài, tên đề tài, chủ nhiệm..."
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
          <Printer className="w-3.5 h-3.5" /> In Báo cáo Quyết toán
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
          <option value="ALL">Tất cả trạng thái thanh toán</option>
          <option value="COMPLETED">Đã quyết toán 100%</option>
          <option value="IN_PROGRESS">Đang giải ngân / Tạm ứng</option>
          <option value="PLANNING">Chưa giải ngân</option>
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
          <strong className="text-slate-700 font-mono font-bold">{filtered.length}</strong> / {projects.length} đề tài
        </span>
      </div>

      {/* ── Top Finance KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tổng Ngân sách BV Duyệt</span>
          <p className="text-lg font-bold font-mono text-[#0A6EBD] mt-1">{formatVND(totalApproved)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Đã Tạm ứng (Giải ngân)</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">{formatVND(totalAllocated)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Đã Quyết toán Hoàn tất</span>
          <p className="text-lg font-bold font-mono text-emerald-700 mt-1">{formatVND(totalDisbursed)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tỷ lệ Giải ngân Toàn viện</span>
          <p className="text-lg font-bold font-mono text-indigo-700 mt-1">
            {totalApproved > 0 ? Math.round((totalAllocated / totalApproved) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 w-28 whitespace-nowrap">MÃ ĐỀ TÀI</th>
                <th className="px-4 py-3 min-w-[280px]">TÊN ĐỀ TÀI & CHỦ NHIỆM</th>
                <th className="px-4 py-3 text-right w-36 whitespace-nowrap">DỰ TOÁN DUYỆT</th>
                <th className="px-4 py-3 text-right w-36 whitespace-nowrap">ĐÃ TẠM ỨNG</th>
                <th className="px-4 py-3 text-right w-36 whitespace-nowrap">ĐÃ THỰC CHI</th>
                <th className="px-4 py-3 w-36 text-center whitespace-nowrap">TRẠNG THÁI TT</th>
                <th className="px-4 py-3 text-center w-20 whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Không tìm thấy dữ liệu tài chính phù hợp.
                  </td>
                </tr>
              ) : (
                pagedProjects.map((p) => {
                  const budget = p.approvedBudget || p.estimatedBudget;
                  const allocated = budget * (p.status === 'IN_PROGRESS' ? 0.5 : p.status === 'ACCEPTED' ? 1.0 : 0);
                  const disbursed = budget * (p.status === 'IN_PROGRESS' ? 0.35 : p.status === 'ACCEPTED' ? 0.95 : 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0A6EBD] whitespace-nowrap align-middle">
                        <Link href={`/projects/${p.id}`} className="hover:underline">
                          {p.projectCode || p.proposalCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <Link href={`/projects/${p.id}`} className="font-semibold text-slate-900 hover:text-[#0A6EBD] line-clamp-1">
                          {p.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {p.principalInvestigatorName} • {p.departmentName}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-right whitespace-nowrap align-middle">
                        {formatVND(budget)}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-[#0A6EBD] text-right whitespace-nowrap align-middle">
                        {formatVND(allocated)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700 text-right whitespace-nowrap align-middle">
                        {formatVND(disbursed)}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap align-middle">
                        <span
                          className={`font-mono font-bold text-[11px] px-2.5 py-1 rounded-full border ${
                            p.status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : p.status === 'IN_PROGRESS'
                              ? 'bg-[#EBF4FC] text-[#0A6EBD] border-[#B8D7F5]'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {p.status === 'ACCEPTED'
                            ? 'Quyết toán 100%'
                            : p.status === 'IN_PROGRESS'
                            ? 'Tạm ứng Đợt 1'
                            : 'Chưa giải ngân'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap align-middle">
                        <Link
                          href={`/projects/${p.id}`}
                          className="p-1.5 bg-[#EBF4FC] hover:bg-[#D8ECF9] text-[#0A6EBD] rounded-lg border border-[#B8D7F5] transition inline-flex"
                          title="Xem chi tiết dự toán"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
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
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="đề tài"
      />
    </div>
  );
}
