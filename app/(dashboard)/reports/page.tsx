'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatVND } from '@/lib/utils';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  Building2,
  PieChart,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  Filter,
} from 'lucide-react';

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const projects = repo.getProjects();
  const [selectedYear, setSelectedYear] = useState('2026');

  // Thống kê phân bổ theo khoa phòng
  const deptStats = [
    { name: 'Khoa Nội', total: 6, inProgress: 2, delayed: 1, budget: 350000000 },
    { name: 'Khoa Ngoại', total: 5, inProgress: 2, delayed: 0, budget: 320000000 },
    { name: 'Khoa Dược', total: 3, inProgress: 1, delayed: 1, budget: 180000000 },
    { name: 'Khoa Hồi sức tích cực (HSTC)', total: 2, inProgress: 1, delayed: 0, budget: 200000000 },
    { name: 'Khoa Chẩn đoán hình ảnh', total: 2, inProgress: 1, delayed: 0, budget: 120000000 },
    { name: 'Khối Điều dưỡng & Khác', total: 2, inProgress: 0, delayed: 0, budget: 80000000 },
  ];

  return (
    <div className="space-y-3 text-slate-800">
      {/* ── Toolbar: Actions trên 1 hàng ── */}
      <div className="flex items-center gap-2.5">
        <div className="text-[13px] text-slate-500 font-medium">
          Dữ liệu thống kê tổng hợp hoạt động nghiên cứu khoa học & công nghệ
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
        >
          <Printer className="w-3.5 h-3.5" /> In báo cáo
        </button>

        <button
          onClick={() => alert('Xuất file Excel thành công!')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] text-white text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-2.5">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="py-1.5 px-3 rounded-lg border border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC] text-[13px] font-medium outline-none transition"
        >
          <option value="2026">Năm 2026 (Kế hoạch hiện tại)</option>
          <option value="2025">Năm 2025 (Đã tổng kết)</option>
          <option value="2024">Năm 2024</option>
        </select>

        <span className="ml-auto text-[12px] text-slate-400 font-medium">
          Đơn vị tổng hợp: <strong className="text-slate-700 font-semibold">Phòng Quản lý NCKH</strong>
        </span>
      </div>

      {/* ── Top Summary KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Tổng số đề tài đăng ký</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">20</p>
          <span className="text-[11px] text-emerald-600 font-semibold">↑ 15% so với cùng kỳ 2025</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Tỷ lệ nghiệm thu đúng hạn</span>
          <p className="text-xl font-bold font-mono text-[#0A6EBD] mt-1">88.5%</p>
          <span className="text-[11px] text-slate-500 font-medium">Đạt chỉ tiêu kế hoạch năm</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Tổng kinh phí phê duyệt</span>
          <p className="text-xl font-bold font-mono text-purple-700 mt-1">1.25 Tỷ đ</p>
          <span className="text-[11px] text-slate-500 font-medium">Quỹ phát triển sự nghiệp</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Tỷ lệ giải ngân kinh phí</span>
          <p className="text-xl font-bold font-mono text-amber-600 mt-1">45.0%</p>
          <span className="text-[11px] text-slate-500 font-medium">Tạm ứng giai đoạn 1 & 2</span>
        </div>
      </div>

      {/* ── Bảng Phân bổ theo Khoa / Phòng ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">KHOA / PHÒNG / TRUNG TÂM</th>
                <th className="px-4 py-3 text-center w-32 whitespace-nowrap">TỔNG SỐ ĐỀ TÀI</th>
                <th className="px-4 py-3 text-center w-36 whitespace-nowrap">ĐANG TRIỂN KHAI</th>
                <th className="px-4 py-3 text-center w-32 whitespace-nowrap">CHẬM TIẾN ĐỘ</th>
                <th className="px-4 py-3 text-right w-44 whitespace-nowrap">KINH PHÍ BV DUYỆT</th>
                <th className="px-4 py-3 text-center w-32 whitespace-nowrap">TỶ LỆ HOÀN THÀNH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptStats.map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-semibold text-slate-900">{d.name}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold">{d.total}</td>
                  <td className="px-4 py-3 text-center font-mono font-semibold text-[#0A6EBD]">{d.inProgress}</td>
                  <td className="px-4 py-3 text-center font-mono text-rose-600 font-bold">
                    {d.delayed > 0 ? d.delayed : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                    {formatVND(d.budget)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {Math.round(((d.total - d.delayed) / d.total) * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 font-bold text-slate-900 bg-[#F8FAFC]">
              <tr>
                <td className="px-4 py-3">Tổng toàn viện</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-[#0A6EBD]">20</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600">7</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">2</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatVND(1250000000)}</td>
                <td className="px-4 py-3 text-center font-mono font-bold">90.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
