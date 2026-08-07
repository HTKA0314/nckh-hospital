'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { formatVND, formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import {
  Plus,
  Search,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Eye,
  FileText,
  Upload,
  AlertCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  Printer,
  Edit,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function MyProjectsPage() {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'action_needed' | 'review' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRound, setSelectedRound] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'DEADLINE' | 'BUDGET' | 'PROGRESS'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rounds = repo.getRounds();

  // Lấy dữ liệu đề tài gắn với người dùng hiện tại
  const isManager = ['ADMIN', 'DIRECTOR', 'RESEARCH_OFFICE'].includes(currentUser.role);
  const rawProjects = useMemo(() => {
    let list = repo.getProjects();
    if (!isManager) {
      const userProjects = list.filter(
        (p) =>
          p.principalInvestigatorId === currentUser.id ||
          p.principalInvestigatorName === currentUser.fullName ||
          p.members?.some((m) => m.fullName.toLowerCase().includes(currentUser.fullName.toLowerCase()))
      );
      // Nếu user chưa có đề tài riêng trong mock, hiển thị 4 đề tài tiêu biểu để trải nghiệm
      if (userProjects.length > 0) {
        list = userProjects;
      }
    }
    return list;
  }, [currentUser, isManager]);

  // Chuẩn hóa và bổ sung dữ liệu hiển thị (Badge, ActionLink, NextAction)
  const myProjects = useMemo(() => {
    return rawProjects.map((p) => {
      let statusText = 'Đang thực hiện';
      let statusColor = 'bg-[#0A6EBD]/10 text-[#0A6EBD] border-[#0A6EBD]/30';
      let nextAction = 'Nộp báo cáo tiến độ';
      let actionLink = `/projects/${p.id}`;
      let actionLabel = 'Chi tiết';
      let isActionNeeded = false;

      if (p.status === 'ACCEPTED' || p.status === 'CLOSED' || p.status === 'ARCHIVED') {
        statusText = 'Đã nghiệm thu';
        statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        nextAction = 'Xem hồ sơ lưu trữ';
        actionLink = `/projects/${p.id}`;
        actionLabel = 'Lưu trữ';
      } else if (p.proposalStatus === 'REVISION_REQUIRED') {
        statusText = 'Cần bổ sung hồ sơ';
        statusColor = 'bg-rose-50 text-rose-700 border-rose-200';
        nextAction = 'Giải trình & Nộp bổ sung v2.0';
        actionLink = `/projects/${p.id}/resubmit`;
        actionLabel = 'Nộp bổ sung';
        isActionNeeded = true;
      } else if (p.proposalStatus === 'SUBMITTED' || p.proposalStatus === 'UNDER_ADMIN_REVIEW') {
        statusText = 'Chờ thẩm định Hội đồng';
        statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
        nextAction = 'Theo dõi tiến trình xét duyệt';
        actionLink = `/projects/${p.id}`;
        actionLabel = 'Theo dõi';
      } else if (p.status === 'IN_PROGRESS' || p.status === 'PROPOSAL_APPROVED') {
        statusText = 'Đang thực hiện';
        statusColor = 'bg-sky-50 text-[#0A6EBD] border-sky-200';
        nextAction = 'Nộp báo cáo tiến độ 6 tháng';
        actionLink = `/progress`;
        actionLabel = 'Báo cáo';
      } else if (p.status === 'DRAFT') {
        statusText = 'Bản nháp';
        statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
        nextAction = 'Hoàn thiện hồ sơ để nộp';
        actionLink = `/projects/register`;
        actionLabel = 'Chỉnh sửa';
        isActionNeeded = true;
      }

      // Chuẩn hóa tên đợt đăng ký ngắn gọn, tránh làm dài bảng
      let shortRound = p.registrationRoundName || 'Đợt 1/2026';
      shortRound = shortRound
        .replace(/Đợt đăng ký Đề tài NCKH Cấp cơ sở\s*/gi, '')
        .replace(/Kế hoạch đăng ký đề tài NCKH\s*/gi, '')
        .replace(/Đề tài NCKH Cấp cơ sở\s*/gi, '')
        .replace(/Năm /gi, '')
        .trim();
      if (!shortRound.toLowerCase().startsWith('đợt')) {
        shortRound = `Đợt ${shortRound}`;
      }

      return {
        ...p,
        code: p.projectCode || p.proposalCode || `DX-2026-${p.id}`,
        category: p.researchField || 'Y Dược học',
        round: shortRound,
        statusText,
        statusColor,
        progress: p.progressPercentage || (p.status === 'ACCEPTED' ? 100 : 25),
        budgetFormatted: formatVND(p.approvedBudget || p.estimatedBudget || 85000000),
        budgetValue: p.approvedBudget || p.estimatedBudget || 85000000,
        deadline: formatDate(p.endDate || '2026-12-31'),
        nextAction,
        actionLink,
        actionLabel,
        isActionNeeded,
      };
    });
  }, [rawProjects]);

  // Thống kê số lượng cho các tab
  const tabCounts = useMemo(() => {
    return {
      all: myProjects.length,
      in_progress: myProjects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PROPOSAL_APPROVED').length,
      action_needed: myProjects.filter((p) => p.isActionNeeded).length,
      review: myProjects.filter(
        (p) => p.proposalStatus === 'SUBMITTED' || p.proposalStatus === 'UNDER_ADMIN_REVIEW'
      ).length,
      completed: myProjects.filter((p) => p.status === 'ACCEPTED' || p.status === 'CLOSED' || p.status === 'ARCHIVED').length,
    };
  }, [myProjects]);

  // Bộ lọc dữ liệu
  const filteredProjects = useMemo(() => {
    return myProjects
      .filter((p) => {
        // Tab lọc
        if (activeTab === 'in_progress') {
          if (p.status !== 'IN_PROGRESS' && p.status !== 'PROPOSAL_APPROVED') return false;
        } else if (activeTab === 'action_needed') {
          if (!p.isActionNeeded) return false;
        } else if (activeTab === 'review') {
          if (p.proposalStatus !== 'SUBMITTED' && p.proposalStatus !== 'UNDER_ADMIN_REVIEW')
            return false;
        } else if (activeTab === 'completed') {
          if (p.status !== 'ACCEPTED' && p.status !== 'CLOSED' && p.status !== 'ARCHIVED') return false;
        }

        // Đợt đăng ký
        if (selectedRound !== 'ALL' && p.registrationRoundId !== selectedRound) {
          return false;
        }

        // Tìm kiếm
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchCode = p.code.toLowerCase().includes(q);
          const matchCategory = p.category.toLowerCase().includes(q);
          if (!matchTitle && !matchCode && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') return b.id.localeCompare(a.id);
        if (sortBy === 'BUDGET') return b.budgetValue - a.budgetValue;
        if (sortBy === 'PROGRESS') return b.progress - a.progress;
        if (sortBy === 'DEADLINE') return a.deadline.localeCompare(b.deadline);
        return 0;
      });
  }, [myProjects, activeTab, selectedRound, searchTerm, sortBy]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pagedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto text-slate-800">
      {/* THANH THAO TÁC & TABS BỘ LỌC TỐI ƯU GỌN GÀNG (SINGLE WORKSPACE CARD) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 space-y-3">
        {/* Dòng 1: Tabs Trạng thái bên trái - Nút Action bên phải */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Quick Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Tất cả đề tài', count: tabCounts.all },
              { id: 'in_progress', label: 'Đang thực hiện', count: tabCounts.in_progress },
              { id: 'action_needed', label: 'Cần xử lý ngay', count: tabCounts.action_needed },
              { id: 'review', label: 'Chờ xét duyệt', count: tabCounts.review },
              { id: 'completed', label: 'Đã hoàn thành', count: tabCounts.completed },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-sky-50 text-[#0A6EBD] border border-sky-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === tab.id ? 'bg-[#0A6EBD] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Cụm Nút Action đẩy sang góc phải */}
          <div className="flex items-center gap-2 shrink-0 justify-end">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition inline-flex items-center gap-1.5 shadow-2xs"
              title="In danh sách đề tài"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In danh sách</span>
            </button>
            <button
              onClick={() => alert('Xuất danh sách đề tài thành file Excel (.xlsx) thành công!')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition inline-flex items-center gap-1.5 shadow-2xs"
              title="Xuất dữ liệu Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
            <Link
              href="/projects/register"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A6EBD] hover:bg-[#085999] rounded-lg transition inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Đăng ký đề tài mới</span>
            </Link>
          </div>
        </div>

        {/* Dòng 2: Ô tìm kiếm + Filter + Chế độ xem */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đề tài, tên nghiên cứu..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0A6EBD] focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedRound}
              onChange={(e) => {
                setSelectedRound(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">Tất cả đợt đăng ký</option>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="NEWEST">Sắp xếp: Mới nhất</option>
              <option value="DEADLINE">Sắp xếp: Đến hạn hoàn thành</option>
              <option value="BUDGET">Sắp xếp: Kinh phí cao nhất</option>
              <option value="PROGRESS">Sắp xếp: Tiến độ cao nhất</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'table' ? 'bg-white text-[#0A6EBD] shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Chế độ Bảng (Table View)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'grid' ? 'bg-white text-[#0A6EBD] shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Chế độ Thẻ (Grid View)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DẠNG HIỂN THỊ 1: BẢNG DỮ LIỆU (TABLE VIEW) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 w-32 whitespace-nowrap">MÃ ĐỀ TÀI</th>
                  <th className="px-5 py-3.5 min-w-[360px] max-w-[480px]">TÊN ĐỀ TÀI & CHUYÊN NGÀNH</th>
                  <th className="px-5 py-3.5 w-44 whitespace-nowrap">TRẠNG THÁI HỒ SƠ</th>
                  <th className="px-5 py-3.5 w-36 whitespace-nowrap">TIẾN ĐỘ</th>
                  <th className="px-5 py-3.5 w-32 whitespace-nowrap">KINH PHÍ BV</th>
                  <th className="px-5 py-3.5 w-32 whitespace-nowrap">HẠN HOÀN THÀNH</th>
                  <th className="px-5 py-3.5 w-44 text-center whitespace-nowrap">THAO TÁC XỬ LÝ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      Không tìm thấy đề tài nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  pagedProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Mã đề tài */}
                      <td className="px-5 py-4 font-mono font-bold text-xs text-[#0A6EBD] align-top whitespace-nowrap">
                        <Link href={`/projects/${p.id}`} className="hover:underline">
                          {p.code}
                        </Link>
                        <span className="block text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                          {p.round}
                        </span>
                      </td>

                      {/* Tên đề tài & Chuyên ngành */}
                      <td className="px-5 py-4 align-top">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-semibold text-slate-900 hover:text-[#0A6EBD] leading-snug block break-words"
                        >
                          {p.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-block text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {p.category}
                          </span>
                          {p.isActionNeeded && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              <AlertCircle className="w-3 h-3" /> Cần xử lý
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap shrink-0 ${p.statusColor}`}>
                          {p.statusText}
                        </span>
                      </td>

                      {/* Tiến độ */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-[#0A6EBD]">{p.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                p.progress === 100 ? 'bg-emerald-500' : 'bg-[#0A6EBD]'
                              }`}
                              style={{ width: `${p.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Kinh phí */}
                      <td className="px-5 py-4 font-mono font-bold text-xs text-slate-800 align-top whitespace-nowrap">
                        {p.budgetFormatted}
                      </td>

                      {/* Hạn hoàn thành */}
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 align-top whitespace-nowrap">
                        {p.deadline}
                      </td>

                      {/* Thao tác hành động chính */}
                      <td className="px-5 py-4 text-center align-top whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={p.actionLink}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A6EBD] hover:bg-[#085999] rounded-lg transition shadow-2xs whitespace-nowrap shrink-0 inline-flex items-center gap-1"
                          >
                            {p.actionLabel}
                          </Link>
                          <Link
                            href={`/projects/${p.id}`}
                            className="p-1.5 text-slate-500 hover:text-[#0A6EBD] hover:bg-sky-50 rounded-lg transition border border-transparent hover:border-sky-200 shrink-0 inline-flex items-center justify-center"
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DẠNG HIỂN THỊ 2: LƯỚI THẺ (GRID CARD VIEW) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pagedProjects.length === 0 ? (
            <div className="col-span-2 bg-white p-12 text-center rounded-xl border border-slate-200/80 text-slate-400">
              Không tìm thấy đề tài nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            pagedProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono font-bold text-xs text-[#0A6EBD] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      {p.code}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${p.statusColor}`}>
                      {p.statusText}
                    </span>
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-bold text-slate-900 group-hover:text-[#0A6EBD] text-sm leading-snug line-clamp-2 transition-colors"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600">{p.category}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500 text-[11px]">{p.round}</span>
                  </p>
                </div>

                {/* Progress & Info */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Tiến độ thực hiện</span>
                    <span className="font-mono font-bold text-[#0A6EBD]">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        p.progress === 100 ? 'bg-emerald-500' : 'bg-[#0A6EBD]'
                      }`}
                      style={{ width: `${p.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Kinh phí: <strong className="text-slate-800 font-mono">{p.budgetFormatted}</strong>
                    </span>
                    <span>
                      Hạn: <strong className="text-slate-800 font-mono">{p.deadline}</strong>
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 italic truncate max-w-[260px]">
                    Hành động kế tiếp: {p.nextAction}
                  </span>
                  <Link
                    href={p.actionLink}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#0A6EBD] bg-sky-50 hover:bg-[#0A6EBD] hover:text-white rounded-lg transition border border-sky-200 shrink-0 shadow-2xs"
                  >
                    Xử lý ngay
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. THANH PHÂN TRANG TỔNG THỂ (PAGINATION FOOTER) */}
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
