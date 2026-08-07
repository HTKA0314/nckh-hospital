'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  CheckSquare,
  Award,
  Download,
  Printer,
  X,
} from 'lucide-react';

export default function EthicsWorkspacePage() {
  const { currentUser } = useAuth();
  const projects = repo.getProjects().filter((p) => p.ethicsRequired);
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'proj-01');

  const filteredProjects = projects.filter((p) => {
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

  const project = repo.getProjectById(selectedProjectId) || filteredProjects[0];

  return (
    <div className="space-y-3 text-slate-800">
      {/* ── Toolbar: Search + Actions trên 1 hàng ── */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên đề tài thẩm định đạo đức..."
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
          <Printer className="w-3.5 h-3.5" /> In danh mục
        </button>
      </div>

      {/* ── Info Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#0A6EBD] shrink-0" />
        <span className="text-[13px] font-medium text-[#0A6EBD] bg-[#EBF4FC] px-2.5 py-1 rounded-md border border-[#B8D7F5]">
          Áp dụng Hội đồng Đạo đức Y sinh học (IRB) – Thông tư 43/2024/TT-BYT
        </span>

        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-[12px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 transition"
          >
            <X className="w-3 h-3" /> Xóa tìm kiếm
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400 font-medium">
          <strong className="text-slate-700 font-mono font-bold">{filteredProjects.length}</strong> / {projects.length} hồ sơ đạo đức y sinh
        </span>
      </div>

      {/* ── Master - Detail Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Danh sách đề tài cần thẩm định đạo đức (4 / 12 Cột) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-3 bg-[#F8FAFC] border-b border-slate-200/80 font-bold text-[11px] uppercase tracking-wider text-slate-500">
            HỒ SƠ SÀNG LỌC ĐẠO ĐỨC Y SINH ({filteredProjects.length})
          </div>
          <div className="divide-y divide-slate-100 max-h-[650px] overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Không tìm thấy hồ sơ nào phù hợp.
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = (project?.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`p-3.5 cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#EBF4FC]/70 border-l-4 border-l-[#0A6EBD]'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#0A6EBD]">{p.projectCode || p.proposalCode}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                        ĐÃ PHÊ DUYỆT
                      </span>
                    </div>
                    <p className="font-semibold text-[13px] text-slate-900 line-clamp-2 mt-1">{p.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{p.principalInvestigatorName} • {p.departmentName}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Thẩm định chi tiết 4 tiêu chí sàng lọc Thông tư 43 (8 / 12 Cột) */}
        {project ? (
          <div className="lg:col-span-8 space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-mono font-bold text-xs bg-[#EBF4FC] text-[#0A6EBD] px-2.5 py-1 rounded-md border border-[#B8D7F5]">
                  {project.projectCode || project.proposalCode}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                  GIẤY CHẤP THUẬN ĐẠO ĐỨC SỐ: IRB-2025/12
                </span>
              </div>
              <h2 className="text-[15px] font-bold text-slate-900">{project.title}</h2>
              <p className="text-xs text-slate-600">
                Chủ nhiệm: <strong className="text-slate-900">{project.principalInvestigatorName}</strong> • Đơn vị: <strong className="text-slate-900">{project.departmentName}</strong>
              </p>
            </div>

            {/* 4 Câu hỏi sàng lọc Đạo đức Thông tư 43 */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-3 text-[13px]">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                1. Bảng Khảo sát Sàng lọc Đạo đức Y sinh học
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 flex items-center justify-between">
                  <p className="text-slate-800 text-xs">1. Nghiên cứu có thu thập dữ liệu trực tiếp trên người bệnh không?</p>
                  <span className="font-bold text-xs text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">CÓ</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 flex items-center justify-between">
                  <p className="text-slate-800 text-xs">2. Nghiên cứu có can thiệp thuốc, kỹ thuật mới hoặc thủ thuật xâm lấn?</p>
                  <span className="font-bold text-xs text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">CÓ</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 flex items-center justify-between">
                  <p className="text-slate-800 text-xs">3. Nghiên cứu có thu thập mẫu bệnh phẩm sinh học (máu, mô, dịch)?</p>
                  <span className="font-bold text-xs text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">CÓ</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 flex items-center justify-between">
                  <p className="text-slate-800 text-xs">4. Nghiên cứu có chứa thông tin định danh cá nhân nhạy cảm?</p>
                  <span className="font-bold text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">KHÔNG</span>
                </div>
              </div>

              {/* Giấy chứng nhận IRB */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                <div>
                  <span className="font-bold text-emerald-950 block text-[14px]">
                    Giấy Chứng nhận Chấp thuận Đạo đức Y sinh (IRB Certificate)
                  </span>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Hội đồng Đạo đức Bệnh viện đã họp và phê duyệt ngày 20/03/2025 • Có giá trị đến 31/03/2026
                  </p>
                </div>
                <button
                  onClick={() => alert('Tải xuống Giấy chứng nhận đạo đức IRB')}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto transition"
                >
                  <Download className="w-3.5 h-3.5" /> Tải Giấy Chứng Nhận
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
