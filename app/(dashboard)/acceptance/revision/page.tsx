'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { Pagination } from '@/components/ui/Pagination';
import {
  FileCheck2,
  Search,
  Filter,
  Eye,
  Printer,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { formatDate, formatVND } from '@/lib/utils';

export default function PostAcceptanceRevisionPage() {
  const { currentUser } = useAuth();
  const allProjects = repo.getProjects();
  
  // Filter projects accepted but needing revisions
  const baseProjects = allProjects.filter((p) => {
    const isAccepted = p.status === 'ACCEPTED';
    const hasRevisions = p.acceptanceDossier?.postAcceptanceRevisions?.some(r => r.status !== 'CONFIRMED');
    if (!isAccepted || !hasRevisions) return false;
    
    // If researcher, only show their own projects
    if (currentUser.role === 'RESEARCHER') {
      return p.principalInvestigatorId === currentUser.id;
    }
    return true;
  });

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredProjects = baseProjects.filter((p) => {
    if (selectedDept !== 'ALL' && p.departmentName !== selectedDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.proposalCode.toLowerCase().includes(q) ||
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
  const departments = Array.from(new Set(baseProjects.map((p) => p.departmentName)));

  return (
    <div className="space-y-3 text-slate-800">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-800">Hoàn thiện sau nghiệm thu</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Danh sách đề tài cần sửa đổi, bổ sung hồ sơ theo kết luận của Hội đồng nghiệm thu</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" /> In danh mục
          </button>
        </div>
      </div>

      {/* ── Toolbar: Search ── */}
      <div className="flex items-center gap-2.5">
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
          <option value="ALL">Tất cả khoa / phòng</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
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
          <strong className="text-slate-700 font-mono font-bold">{filteredProjects.length}</strong> / {baseProjects.length} đề tài cần sửa đổi
        </span>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 w-28 whitespace-nowrap">MÃ ĐỀ TÀI</th>
                <th className="px-4 py-3 min-w-[320px]">TÊN ĐỀ TÀI NGHIÊN CỨU</th>
                <th className="px-4 py-3 w-44 whitespace-nowrap">CHỦ NHIỆM & ĐƠN VỊ</th>
                <th className="px-4 py-3">YÊU CẦU CẦN HOÀN THIỆN TỪ HỘI ĐỒNG</th>
                <th className="px-4 py-3 w-32 text-center whitespace-nowrap">TRẠNG THÁI</th>
                <th className="px-4 py-3 text-center w-24 whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Không có đề tài nào cần hoàn thiện sau nghiệm thu.
                  </td>
                </tr>
              ) : (
                pagedProjects.map((p) => {
                  const pendingRevisions = p.acceptanceDossier?.postAcceptanceRevisions?.filter(r => r.status !== 'CONFIRMED');
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition border-l-4 border-l-transparent hover:border-l-rose-500"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[#0A6EBD] whitespace-nowrap">
                        {p.projectCode || p.proposalCode}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 line-clamp-1 leading-snug">{p.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{p.researchField}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{p.principalInvestigatorName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.departmentName}</p>
                      </td>
                      <td className="px-4 py-3 text-rose-800 text-xs">
                        <div className="space-y-1">
                          {pendingRevisions?.map((rev, idx) => (
                            <p key={idx} className="line-clamp-1">
                              • {rev.councilFeedback}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                          Chờ hoàn thiện
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Link
                          href={`/projects/${p.id}/acceptance`}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition inline-flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                          title="Sửa đổi tài liệu sau nghiệm thu"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chỉnh sửa
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
        totalItems={filteredProjects.length}
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
