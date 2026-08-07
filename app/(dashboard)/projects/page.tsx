'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { repo } from '@/lib/repository';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { formatVND, formatDate } from '@/lib/utils';
import {
  Search,
  Plus,
  Printer,
  Eye,
  Edit,
  MoreVertical,
  Activity,
  Users,
  FileCheck2,
  Award,
  X,
  ChevronRight,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  Filter,
} from 'lucide-react';

/* ─── Quick-view Drawer: hiển thị chi tiết ngay bên phải, không chuyển trang ─── */
function ProjectDrawer({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const p = repo.getProjectById(projectId);
  if (!p) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div
        className="flex-1 bg-slate-900/30 backdrop-blur-xs"
        onClick={onClose}
      />
      {/* Drawer Panel */}
      <div className="w-[520px] max-w-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs font-bold text-[#0A6EBD] bg-[#EBF4FC] px-2 py-0.5 rounded border border-[#B8D7F5]">
              {p.projectCode || p.proposalCode}
            </span>
            <h2 className="text-[15px] font-bold text-slate-900 mt-2 leading-snug line-clamp-3">
              {p.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {p.researchField} • {p.registrationRoundName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition flex-shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status + Progress */}
          <div className="flex items-center gap-3">
            <StatusBadge status={p.status} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-[12px] font-bold mb-1">
                <span className="text-slate-500">Tiến độ thực hiện</span>
                <span className="text-[#0A6EBD]">{p.progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${p.progressPercentage}%`,
                    background: p.progressPercentage >= 75
                      ? '#059669'
                      : p.progressPercentage >= 40
                      ? '#0A6EBD'
                      : '#F59E0B',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { icon: Users, label: 'Chủ nhiệm', value: p.principalInvestigatorName },
              { icon: Building2, label: 'Khoa / Phòng', value: p.departmentName },
              { icon: Calendar, label: 'Thời gian', value: `${formatDate(p.startDate)} → ${formatDate(p.endDate)}` },
              { icon: DollarSign, label: 'Kinh phí được duyệt', value: formatVND(p.approvedBudget || p.estimatedBudget) },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <item.icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{item.label}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tóm tắt */}
          {p.summary && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tóm tắt nghiên cứu</p>
              <p className="text-[13px] text-slate-700 leading-relaxed">{p.summary}</p>
            </div>
          )}

          {/* Thành viên */}
          {p.members && p.members.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                Nhóm nghiên cứu ({p.members.length} người)
              </p>
              <div className="space-y-1.5">
                {p.members.slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-50 rounded border border-slate-100">
                    <span className="font-semibold text-slate-800">{m.fullName}</span>
                    <span className="text-slate-400">{m.roleInProject.replace(/_/g, ' ')}</span>
                  </div>
                ))}
                {p.members.length > 4 && (
                  <p className="text-[11px] text-slate-400 text-center">+{p.members.length - 4} thành viên khác</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2 bg-[#F8FAFC]">
          <button
            onClick={() => router.push(`/projects/${p.id}`)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Eye className="w-3.5 h-3.5" /> Xem toàn bộ hồ sơ
          </button>
          <button
            onClick={() => router.push(`/progress`)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Tiến độ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Row Action Menu (3-dot) ─── */
function RowActionMenu({ projectId, proposalStatus }: { projectId: string; proposalStatus: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isRevision = proposalStatus === 'REVISION_REQUIRED';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    { icon: Eye, label: 'Xem chi tiết hồ sơ', href: `/projects/${projectId}` },
    { icon: Activity, label: 'Theo dõi tiến độ', href: `/progress` },
    { icon: Users, label: 'Hội đồng xét duyệt', href: `/councils` },
    { icon: FileCheck2, label: 'Hồ sơ nghiệm thu', href: `/projects/${projectId}` },
    ...(isRevision
      ? [{ icon: Edit, label: 'Bổ sung hồ sơ (yêu cầu)', href: `/projects/${projectId}/resubmit` }]
      : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        title="Tùy chọn thao tác"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95">
          {actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-700 hover:bg-[#EBF4FC] hover:text-[#0A6EBD] transition"
            >
              <a.icon className="w-4 h-4 flex-shrink-0" />
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function ProjectListPage() {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRound, setSelectedRound] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerProjectId, setDrawerProjectId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const projects = repo.getProjects();
  const departments = repo.getDepartments();
  const rounds = repo.getRounds();

  const filtered = projects.filter((p) => {
    if (selectedDept !== 'ALL' && p.departmentId !== selectedDept) return false;
    if (selectedRound !== 'ALL' && p.registrationRoundId !== selectedRound) return false;
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    if (
      searchQuery.trim() &&
      !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.proposalCode.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(p.projectCode && p.projectCode.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !p.principalInvestigatorName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const pagedProjects = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasFilters = selectedDept !== 'ALL' || selectedRound !== 'ALL' || selectedStatus !== 'ALL' || searchQuery.trim();

  return (
    <div className="space-y-3 text-slate-800">

      {/* ── Toolbar: Search + Actions trên 1 hàng ── */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên đề tài, tên chủ nhiệm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] text-[13px] outline-none bg-white shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
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
        <Link
          href="/projects/register"
          className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold px-3.5 py-2 rounded-lg text-[13px] shadow-xs transition whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" /> Đăng ký đề tài mới
        </Link>
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
          value={selectedRound}
          onChange={(e) => setSelectedRound(e.target.value)}
          className={`py-1.5 px-3 rounded-lg border text-[13px] font-medium outline-none transition ${
            selectedRound !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả đợt tiếp nhận</option>
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>{r.code} – {r.year}</option>
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
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Tạo nháp</option>
          <option value="SUBMITTED">Đã nộp hồ sơ</option>
          <option value="UNDER_ADMIN_REVIEW">Đang thẩm định</option>
          <option value="REVISION_REQUIRED">Yêu cầu bổ sung</option>
          <option value="PROPOSAL_APPROVED">Đã duyệt đề cương</option>
          <option value="IN_PROGRESS">Đang thực hiện</option>
          <option value="ACCEPTED">Đã nghiệm thu</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSelectedDept('ALL'); setSelectedRound('ALL'); setSelectedStatus('ALL'); setSearchQuery(''); }}
            className="text-[12px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 transition"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400 font-medium">
          <strong className="text-slate-700 font-mono font-bold">{filtered.length}</strong> / {projects.length} đề tài
        </span>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 w-28 whitespace-nowrap">MÃ ĐỀ TÀI</th>
                <th className="px-4 py-3 min-w-[300px]">TÊN ĐỀ TÀI</th>
                <th className="px-4 py-3 w-44 whitespace-nowrap">CHỦ NHIỆM</th>
                <th className="px-4 py-3 w-44 whitespace-nowrap">KHOA / PHÒNG</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap">TRẠNG THÁI</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap">TIẾN ĐỘ</th>
                <th className="px-4 py-3 text-right w-32 whitespace-nowrap">KINH PHÍ</th>
                <th className="px-4 py-3 text-center w-28 whitespace-nowrap">HẠN KẾT THÚC</th>
                <th className="px-4 py-3 text-center w-16 whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search className="w-8 h-8 opacity-30" />
                      <p className="text-[13px] font-medium">Không tìm thấy đề tài nào phù hợp với tiêu chí lọc</p>
                      <button
                        onClick={() => { setSelectedDept('ALL'); setSelectedRound('ALL'); setSelectedStatus('ALL'); setSearchQuery(''); }}
                        className="text-[12px] text-[#0A6EBD] font-semibold hover:underline mt-1"
                      >
                        Xóa bộ lọc để xem toàn bộ
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedProjects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setDrawerProjectId(p.id)}
                    className={`transition cursor-pointer border-l-[3px] hover:bg-[#F0F7FF] hover:border-l-[#0A6EBD] ${
                      drawerProjectId === p.id
                        ? 'bg-[#EBF4FC] border-l-[#0A6EBD]'
                        : 'border-l-transparent'
                    }`}
                  >
                    {/* Mã đề tài */}
                    <td
                      className="px-4 py-3 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-mono font-bold text-[13px] text-[#0A6EBD] hover:underline whitespace-nowrap"
                      >
                        {p.projectCode || p.proposalCode}
                      </Link>
                    </td>

                    {/* Tên đề tài */}
                    <td className="px-4 py-3 align-middle">
                      <p className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2">
                        {p.title}
                      </p>
                      <p className="text-[12px] text-slate-400 mt-0.5 font-medium">
                        {p.researchField}
                        {p.registrationRoundName && (
                          <> &nbsp;•&nbsp; {p.registrationRoundName.replace('Đợt đăng ký Đề tài NCKH Cấp cơ sở ', '').replace('Kế hoạch đăng ký đề tài NCKH ', '')}</>
                        )}
                      </p>
                    </td>

                    {/* Chủ nhiệm */}
                    <td className="px-4 py-3 align-middle">
                      <p className="text-[13px] font-semibold text-slate-900 leading-snug">
                        {p.principalInvestigatorName}
                      </p>
                    </td>

                    {/* Khoa / Phòng */}
                    <td className="px-4 py-3 align-middle">
                      <p className="text-[13px] text-slate-600 leading-snug">
                        {p.departmentName}
                      </p>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>

                    {/* Tiến độ */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden min-w-[60px]">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${p.progressPercentage}%`,
                              background:
                                p.progressPercentage >= 75
                                  ? '#059669'
                                  : p.progressPercentage >= 40
                                  ? '#0A6EBD'
                                  : '#F59E0B',
                            }}
                          />
                        </div>
                        <span className="text-[12px] font-bold text-slate-700 w-8 text-right">
                          {p.progressPercentage}%
                        </span>
                      </div>
                    </td>

                    {/* Kinh phí */}
                    <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                      <span className="text-[13px] font-bold font-mono text-slate-800">
                        {formatVND(p.approvedBudget || p.estimatedBudget)}
                      </span>
                    </td>

                    {/* Hạn kết thúc */}
                    <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                      <span className="text-[12px] font-mono text-slate-500">
                        {formatDate(p.endDate)}
                      </span>
                    </td>

                    {/* Action Menu */}
                    <td
                      className="px-4 py-3 align-middle text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RowActionMenu
                        projectId={p.id}
                        proposalStatus={p.proposalStatus}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Summary Footer */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-slate-100 text-[12px] text-slate-500 flex items-center justify-between">
          <span>
            Tổng kinh phí danh mục lọc:{' '}
            <strong className="text-slate-900 font-mono font-bold">
              {formatVND(filtered.reduce((acc, cur) => acc + (cur.approvedBudget || cur.estimatedBudget), 0))}
            </strong>
          </span>
          <span>
            Tổng số: <strong className="text-slate-700 font-mono font-bold">{filtered.length}</strong> đề tài
          </span>
        </div>
      </div>

      {/* ── Pagination ── */}
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

      {/* ── Quick-view Drawer ── */}
      {drawerProjectId && (
        <ProjectDrawer
          projectId={drawerProjectId}
          onClose={() => setDrawerProjectId(null)}
        />
      )}
    </div>
  );
}
