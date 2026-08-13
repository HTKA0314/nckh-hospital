'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { repo } from '@/lib/repository';
import {
  FileText,
  Clock,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  MoreVertical,
  RotateCw,
  ArrowUpRight,
  ChevronRight,
  Bell,
  Building2,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const stats = repo.getStats(currentUser.role, currentUser.id);

  // Danh sách công việc cần xử lý
  const pendingTasks = [
    {
      id: 'task-1',
      code: 'DX-2026-002',
      title: 'Đánh giá tính an toàn phẫu thuật nội soi tán sỏi thận qua da dưới hướng dẫn siêu âm',
      pi: 'ThS.BS Trần Thị Mai',
      dept: 'Khoa Ngoại Tiết niệu',
      action: 'Thẩm định tính hợp lệ hồ sơ đề cương',
      deadline: '10/04/2026',
      level: 'Cao',
      levelColor: 'bg-rose-50 text-rose-700 border-rose-200',
      link: '/projects/proj-02',
    },
    {
      id: 'task-2',
      code: 'DX-2026-003',
      title: 'Khảo sát tỷ lệ đề kháng kháng sinh Carbapenem tại Khoa Hồi sức tích cực',
      pi: 'DSCKII. Bùi Thanh Tùng',
      dept: 'Khoa Dược lâm sàng',
      action: 'Yêu cầu hoàn thiện dự toán chi tiết v2.0',
      deadline: '05/04/2026',
      level: 'Cao',
      levelColor: 'bg-rose-50 text-rose-700 border-rose-200',
      link: '/projects/proj-03',
    },
    {
      id: 'task-3',
      code: 'DT-2025-007',
      title: 'Ứng dụng thang điểm NEWS2 trong cảnh báo sớm suy hô hấp ở bệnh nhân thở máy',
      pi: 'ThS. Lê Hoàng Long',
      dept: 'Khoa Hồi sức tích cực',
      action: 'Kiểm tra biên bản tự đánh giá nghiệm thu cơ sở',
      deadline: '15/04/2026',
      level: 'Trung bình',
      levelColor: 'bg-amber-50 text-amber-800 border-amber-200',
      link: '/projects/proj-07',
    },
    {
      id: 'task-4',
      code: 'DT-2025-001',
      title: 'Đánh giá hiệu quả can thiệp động mạch vành qua da ở bệnh nhân nhồi máu cơ tim',
      pi: 'BS.CKII Nguyễn Văn An',
      dept: 'Khoa Tim mạch Can thiệp',
      action: 'Nộp báo cáo tiến độ định kỳ 6 tháng',
      deadline: '20/04/2026',
      level: 'Trung bình',
      levelColor: 'bg-amber-50 text-amber-800 border-amber-200',
      link: '/projects/proj-01',
    },
  ];

    return (
    <div className="space-y-5 max-w-[1600px] mx-auto text-slate-800">
      {/* 1. TOP 5 THẺ KPI CARD TỐI ƯU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 - Tổng số đề tài */}
        <div className="bg-gradient-to-br from-white via-white to-sky-50/20 p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-sky-400/50 hover:shadow-md hover:shadow-sky-100/50 hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold tracking-wide">Tổng số đề tài</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-sans text-slate-800 tracking-tight">{stats.totalProjects}</div>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/40">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5">Tất cả đề tài đăng ký</span>
        </div>

        {/* KPI 2 - Hồ sơ chờ xử lý */}
        <div className="bg-gradient-to-br from-white via-white to-amber-50/20 p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-400/50 hover:shadow-md hover:shadow-amber-100/50 hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold tracking-wide">Hồ sơ chờ xử lý</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-sans text-slate-800 tracking-tight">{stats.underReviewProposals}</div>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/40">
              Cần ưu tiên
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5">Cần thẩm định & duyệt</span>
        </div>

        {/* KPI 3 - Đang thực hiện */}
        <div className="bg-gradient-to-br from-white via-white to-emerald-50/20 p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-400/50 hover:shadow-md hover:shadow-emerald-100/50 hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold tracking-wide">Đang thực hiện</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-sans text-slate-800 tracking-tight">{stats.inProgressProjects}</div>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100/40">
              Đúng tiến độ
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5">Đang nghiên cứu thực địa</span>
        </div>

        {/* KPI 4 - Chậm tiến độ */}
        <div className="bg-gradient-to-br from-white via-white to-rose-50/20 p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-rose-400/50 hover:shadow-md hover:shadow-rose-100/50 hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold tracking-wide">Chậm tiến độ</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-sans text-rose-600 tracking-tight">{stats.delayedProjects}</div>
            <span className="inline-flex items-center text-[10.5px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100/40">
              Cảnh báo
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5">Quá hạn nộp báo cáo</span>
        </div>

        {/* KPI 5 - Kinh phí cấp BV */}
        <div className="bg-gradient-to-br from-white via-white to-purple-50/20 p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-purple-400/50 hover:shadow-md hover:shadow-purple-100/50 hover:-translate-y-1 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold tracking-wide">Kinh phí cấp BV</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-sans text-slate-800 tracking-tight">
              1.25 <span className="text-lg font-medium text-slate-500">Tỷ</span>
            </div>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100/40">VND</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5">Đã giải ngân 65%</span>
        </div>
      </div>

      {/* 2. BẢNG CÔNG VIỆC CẦN XỬ LÝ (TỐI ƯU CỘT VÀ TÊN ĐỀ TÀI KHÔNG BỊ CẮT) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 bg-[#0A6EBD] rounded-full"></div>
            <h3 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
              Công việc cần xử lý
            </h3>
          </div>
          <Link href="/projects" className="text-xs font-semibold text-[#0A6EBD] hover:underline flex items-center gap-1">
            Xem tất cả ({pendingTasks.length}) <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold text-[12px]">
              <tr>
                <th className="px-5 py-3 w-32">Mã hồ sơ</th>
                <th className="px-5 py-3 min-w-[360px] max-w-[500px]">Tên đề tài nghiên cứu</th>
                <th className="px-5 py-3 w-64">Công việc cần xử lý</th>
                <th className="px-5 py-3 w-32">Hạn xử lý</th>
                <th className="px-5 py-3 w-28 text-center">Mức độ</th>
                <th className="px-5 py-3 w-32 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-xs text-[#0A6EBD] whitespace-nowrap align-top">
                    {t.code}
                  </td>
                  {/* Tên đề tài cho phép xuống dòng đầy đủ */}
                  <td className="px-5 py-4 align-top">
                    <Link href={t.link} className="font-semibold text-slate-900 hover:text-[#0A6EBD] leading-snug block break-words">
                      {t.title}
                    </Link>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <span>{t.pi}</span>
                      <span>•</span>
                      <span className="text-slate-400">{t.dept}</span>
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-700 text-xs font-medium align-top leading-relaxed">
                    {t.action}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600 whitespace-nowrap align-top">
                    {t.deadline}
                  </td>
                  <td className="px-5 py-4 text-center align-top">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${t.levelColor}`}>
                      {t.level}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center align-top">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={t.link}
                        className="px-3 py-1 text-xs font-semibold text-[#0A6EBD] bg-sky-50 hover:bg-sky-100 rounded-md transition border border-sky-200 shrink-0"
                      >
                        Mở hồ sơ
                      </Link>
                      <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 3 BLOCKS THỐNG KÊ BỔ SUNG */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Donut Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <h3 className="font-bold text-[13px] text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0A6EBD]" />
              Đề tài theo trạng thái
            </h3>
          </div>

          <div className="flex items-center justify-around py-2">
            <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-teal-500" strokeDasharray="40, 100" strokeDashoffset="0" strokeWidth="4.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-amber-500" strokeDasharray="35, 100" strokeDashoffset="-40" strokeWidth="4.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-[#0A6EBD]" strokeDasharray="15, 100" strokeDashoffset="-75" strokeWidth="4.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-purple-600" strokeDasharray="5, 100" strokeDashoffset="-90" strokeWidth="4.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Chờ thẩm định</span>
                <span className="font-mono font-bold text-slate-800 ml-auto">3</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                <span className="text-slate-600">Đang thực hiện</span>
                <span className="font-mono font-bold text-slate-800 ml-auto">7</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <span className="text-slate-600">Chờ nghiệm thu</span>
                <span className="font-mono font-bold text-slate-800 ml-auto">1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0A6EBD]"></span>
                <span className="text-slate-600">Hoàn thành</span>
                <span className="font-mono font-bold text-slate-800 ml-auto">8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông báo mới */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-[13px] text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0A6EBD]" />
              Thông báo hệ thống
            </h3>
            <Link href="/reports" className="text-xs font-semibold text-[#0A6EBD] hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-2.5">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <p className="font-semibold text-xs text-slate-900 leading-snug">
                Hạn chót đăng ký Đề tài Cấp cơ sở Đợt 1/2026 sắp kết thúc (còn 2 ngày).
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">2 giờ trước</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <p className="font-semibold text-xs text-slate-900 leading-snug">
                Hồ sơ DX-2026-002 đã được Hội đồng thẩm định yêu cầu bổ sung v2.0.
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">3 giờ trước</span>
            </div>
          </div>
        </div>

        {/* Thống kê Khoa/Phòng */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-[13px] text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0A6EBD]" />
              Thống kê Khoa/Phòng
            </h3>
            <Link href="/reports" className="text-xs font-semibold text-[#0A6EBD] hover:underline">
              Chi tiết
            </Link>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="pb-2">Khoa/Phòng</th>
                <th className="pb-2 text-center">Tổng</th>
                <th className="pb-2 text-center">Đang làm</th>
                <th className="pb-2 text-center">Chậm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              <tr>
                <td className="py-2">Khoa Ngoại Tiết niệu</td>
                <td className="py-2 text-center font-mono font-bold">6</td>
                <td className="py-2 text-center font-mono">2</td>
                <td className="py-2 text-center font-mono text-rose-600 font-bold">1</td>
              </tr>
              <tr>
                <td className="py-2">Khoa Dược lâm sàng</td>
                <td className="py-2 text-center font-mono font-bold">5</td>
                <td className="py-2 text-center font-mono">2</td>
                <td className="py-2 text-center font-mono">0</td>
              </tr>
              <tr>
                <td className="py-2">Khoa Hồi sức tích cực</td>
                <td className="py-2 text-center font-mono font-bold">4</td>
                <td className="py-2 text-center font-mono">3</td>
                <td className="py-2 text-center font-mono text-rose-600 font-bold">1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2">
        <span className="flex items-center gap-1.5 font-mono">
          <RotateCw className="w-3 h-3 text-slate-400" /> Hệ thống cập nhật dữ liệu tự động lúc 08:30
        </span>
      </div>
    </div>
  );
}
