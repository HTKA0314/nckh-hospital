'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { RegistrationRound } from '@/lib/types';
import { formatVND, formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { MEDICAL_TEMPLATES_DATA } from '@/lib/mock-data/templates-data';
import {
  Plus,
  Search,
  Eye,
  X,
  MoreVertical,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  Calendar,
  Edit,
  Trash2,
  Download,
  CalendarClock,
  Lock,
  Users,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Settings,
  History,
  FileSpreadsheet,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   HELPER: Status badge
   ───────────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  if (status === 'OPEN') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Đang mở
      </span>
    );
  }
  if (status === 'DRAFT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Bản nháp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 select-none">
      Đã đóng
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   HELPER: Days remaining
   ───────────────────────────────────────────────────────────────── */
function daysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/* ─────────────────────────────────────────────────────────────────
   COMPONENT: Row Action Menu (3-dot)
   ───────────────────────────────────────────────────────────────── */
function RoundActionMenu({
  round,
  canManage,
  onView,
  onViewApplications,
  onEdit,
  onOpen,
  onExtend,
  onClose,
  onDelete,
  onExport,
  onAddProject,
}: {
  round: RegistrationRound;
  canManage: boolean;
  onView: () => void;
  onViewApplications: () => void;
  onEdit: () => void;
  onOpen: () => void;
  onExtend: () => void;
  onClose: () => void;
  onDelete: () => void;
  onExport: () => void;
  onAddProject: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const item = (icon: React.ReactNode, label: string, onClick: () => void, danger = false) => (
    <button
      onClick={() => {
        onClick();
        setOpen(false);
      }}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition text-left rounded-md ${
        danger
          ? 'text-rose-600 hover:bg-rose-50'
          : 'text-slate-700 hover:bg-slate-50 hover:text-[#0A6EBD]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-30 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
          {/* DRAFT */}
          {round.status === 'DRAFT' && (
            <>
              {item(<Edit className="w-3.5 h-3.5" />, 'Chỉnh sửa', onEdit)}
              {canManage && item(<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />, 'Mở đợt', onOpen)}
              <div className="border-t border-slate-100 my-1" />
              {canManage && item(<Trash2 className="w-3.5 h-3.5" />, 'Xóa', onDelete, true)}
            </>
          )}
          {/* OPEN */}
          {round.status === 'OPEN' && (
            <>
              {item(<Plus className="w-3.5 h-3.5 text-[#0A6EBD]" />, 'Thêm đề tài', onAddProject)}
              {item(<Eye className="w-3.5 h-3.5" />, 'Xem hồ sơ', onViewApplications)}
              {canManage && item(<CalendarClock className="w-3.5 h-3.5 text-amber-600" />, 'Gia hạn', onExtend)}
              {canManage && (
                <>
                  <div className="border-t border-slate-100 my-1" />
                  {item(<Lock className="w-3.5 h-3.5" />, 'Đóng đợt', onClose, true)}
                </>
              )}
            </>
          )}
          {/* CLOSED */}
          {round.status === 'CLOSED' && (
            <>
              {item(<Eye className="w-3.5 h-3.5" />, 'Xem chi tiết', onView)}
              {item(<FileText className="w-3.5 h-3.5" />, 'Xem hồ sơ', onViewApplications)}
              {item(<Download className="w-3.5 h-3.5" />, 'Xuất danh sách', onExport)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROUND DETAIL PAGE
   ───────────────────────────────────────────────────────────────── */
interface RoundDetailViewProps {
  round: RegistrationRound;
  activeTab: 'OVERVIEW' | 'APPLICATIONS' | 'TEMPLATES' | 'HISTORY';
  setActiveTab: (tab: 'OVERVIEW' | 'APPLICATIONS' | 'TEMPLATES' | 'HISTORY') => void;
  onBack: () => void;
  onClose: () => void;
  onExtend: () => void;
  onEdit: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onExport: () => void;
  canManage: boolean;
}

function RoundDetailView({
  round,
  activeTab,
  setActiveTab,
  onBack,
  onClose,
  onExtend,
  onEdit,
  onOpen,
  onDelete,
  onExport,
  canManage,
}: RoundDetailViewProps) {
  const projects = useMemo(() => {
    return repo.getProjects().filter((p) => p.registrationRoundId === round.id);
  }, [round.id]);

  const days = daysRemaining(round.endDate);

  const TABS: { id: 'OVERVIEW' | 'APPLICATIONS' | 'TEMPLATES' | 'HISTORY'; label: string; count?: number }[] = [
    { id: 'OVERVIEW', label: 'Tổng quan' },
    { id: 'APPLICATIONS', label: 'Hồ sơ đăng ký', count: projects.length },
    { id: 'TEMPLATES', label: 'Biểu mẫu' },
    { id: 'HISTORY', label: 'Lịch sử xử lý' },
  ];

  // Filter templates from updated templates-data
  const templatesList = useMemo(() => {
    return MEDICAL_TEMPLATES_DATA.filter((t) => ['PROPOSAL', 'COUNCIL'].includes(t.category));
  }, []);

  const historyList = useMemo(() => {
    return [
      {
        timestamp: round.startDate + ' 08:30',
        user: 'Phòng Quản lý NCKH',
        action: 'Khởi tạo đợt đăng ký',
        oldStatus: '–',
        newStatus: 'DRAFT',
        notes: 'Cấu hình đợt tiếp nhận hồ sơ đăng ký nghiên cứu y sinh học cấp cơ sở.',
      },
      ...(round.status !== 'DRAFT'
        ? [
            {
              timestamp: round.startDate + ' 09:00',
              user: 'Ban Giám đốc',
              action: 'Kích hoạt mở đợt đăng ký',
              oldStatus: 'DRAFT',
              newStatus: 'OPEN',
              notes: 'Bắt đầu tiếp nhận đề xuất và thuyết minh đề tài trực tuyến.',
            },
          ]
        : []),
      ...(round.status === 'CLOSED'
        ? [
            {
              timestamp: round.endDate + ' 17:00',
              user: 'Phòng Quản lý NCKH',
              action: 'Đóng đợt đăng ký',
              oldStatus: 'OPEN',
              newStatus: 'CLOSED',
              notes: 'Hết hạn tiếp nhận hồ sơ theo cấu hình đợt.',
            },
          ]
        : []),
    ];
  }, [round]);

  const stats = useMemo(() => {
    const submitted = projects.filter((p) => !['DRAFT'].includes(p.proposalStatus || p.status));
    const drafts = projects.filter((p) => p.status === 'DRAFT');
    const needRevision = projects.filter((p) => p.proposalStatus === 'REVISION_REQUIRED');
    const valid = projects.filter((p) => p.proposalStatus === 'VALID' || (p.status as any) === 'APPROVED');
    const transferred = projects.filter((p) =>
      ['UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS', 'ACCEPTED', 'RECOGNIZED'].includes(p.status)
    );
    return {
      total: projects.length,
      drafts: drafts.length,
      submitted: submitted.length,
      needRevision: needRevision.length,
      valid: valid.length,
      transferred: transferred.length,
    };
  }, [projects]);

  return (
    <div className="space-y-4 text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Back to list */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0A6EBD] transition select-none"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Danh sách đợt đăng ký
      </button>

      {/* Header card */}
      <header className="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap justify-between items-start gap-4">
        <div className="space-y-1.5 flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-xs bg-sky-50 text-[#0A6EBD] px-2.5 py-0.5 rounded border border-sky-100 select-none">
              {round.code}
            </span>
            <StatusBadge status={round.status} />
            {round.status === 'OPEN' && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full select-none ${
                days >= 0 ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-rose-700 bg-rose-50 border border-rose-200'
              }`}>
                {days >= 0 ? `Còn ${days} ngày` : 'Đã quá hạn'}
              </span>
            )}
          </div>
          <h1 className="text-base font-bold text-slate-900 leading-snug">{round.name}</h1>
          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 select-none">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Thời gian tiếp nhận: {formatDisplayDate(round.startDate)} – {formatDisplayDate(round.endDate)}
          </p>
        </div>

        {/* Header Action Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {round.status === 'DRAFT' && canManage && (
            <>
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition shadow-2xs"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" /> Chỉnh sửa
              </button>
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mở đợt
              </button>
            </>
          )}
          {round.status === 'OPEN' && canManage && (
            <>
              <button
                onClick={onExtend}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition shadow-2xs"
              >
                <CalendarClock className="w-3.5 h-3.5" /> Gia hạn đợt
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100 transition shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5" /> Đóng đợt
              </button>
            </>
          )}
          {round.status === 'CLOSED' && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 text-[#0A6EBD] text-xs font-bold rounded-lg hover:bg-sky-100 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> Xuất danh sách
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/75 px-3 text-xs font-bold text-slate-500 select-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === t.id
                  ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === t.id ? 'bg-[#0A6EBD] text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── TAB 1: TỔNG QUAN ── */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Info */}
              <div className="space-y-4 text-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 select-none">
                  Thông tin đợt đăng ký
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Năm kế hoạch', value: String(round.year) },
                    { label: 'Ngày bắt đầu', value: formatDisplayDate(round.startDate) },
                    { label: 'Ngày kết thúc', value: formatDisplayDate(round.endDate) },
                    {
                      label: 'Hạn bổ sung đề cương',
                      value: round.deadlineForAmendment
                        ? formatDisplayDate(round.deadlineForAmendment)
                        : 'Không cấu hình',
                    },
                    { label: 'Đối tượng đăng ký', value: round.targetAudience },
                    {
                      label: 'Lĩnh vực ưu tiên',
                      value: round.priorityFields ? round.priorityFields.join(', ') : 'Tất cả lĩnh vực y sinh',
                    },
                    ...(round.maxBudget
                      ? [{ label: 'Giới hạn kinh phí tối đa', value: formatVND(round.maxBudget) + ' / đề tài' }]
                      : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">{row.label}</span>
                      <span className="font-bold text-slate-800 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
                {round.description && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">
                      Hướng dẫn nộp hồ sơ
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-semibold">
                      {round.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Statistics */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 select-none">
                  Thống kê hồ sơ đăng ký
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Tổng số hồ sơ', value: stats.total, color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
                    { label: 'Hồ sơ bản nháp', value: stats.drafts, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
                    { label: 'Đã nộp hành chính', value: stats.submitted, color: 'text-[#0A6EBD]', bg: 'bg-sky-50 border-sky-200' },
                    { label: 'Yêu cầu sửa đổi', value: stats.needRevision, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
                    { label: 'Đủ điều kiện hợp lệ', value: stats.valid, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                    { label: 'Đã chuyển Hội đồng', value: stats.transferred, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
                  ].map((stat) => (
                    <div key={stat.label} className={`p-4 rounded-xl border flex flex-col justify-between gap-1.5 ${stat.bg}`}>
                      <span className="text-xs font-bold text-slate-500 select-none">{stat.label}</span>
                      <span className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: HỒ SƠ ĐĂNG KÝ ── */}
          {activeTab === 'APPLICATIONS' && (
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-14 text-slate-400 select-none">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-semibold">Chưa có hồ sơ đăng ký nào trong đợt này</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 select-none">
                        <tr>
                          <th className="px-4 py-3.5 w-28 whitespace-nowrap">Mã hồ sơ</th>
                          <th className="px-4 py-3.5 min-w-[280px]">Tên đề tài</th>
                          <th className="px-4 py-3.5 w-40">Chủ nhiệm đề tài</th>
                          <th className="px-4 py-3.5 w-40">Khoa/Phòng</th>
                          <th className="px-4 py-3.5 w-28 text-center whitespace-nowrap">Ngày nộp</th>
                          <th className="px-4 py-3.5 w-32">Trạng thái</th>
                          <th className="px-4 py-3.5 w-48">Công việc tiếp theo</th>
                          <th className="px-4 py-3.5 w-20 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {projects.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3">
                              <Link
                                href={`/projects/${p.id}`}
                                className="font-mono font-bold text-xs text-[#0A6EBD] hover:underline"
                              >
                                {p.projectCode || p.proposalCode || 'BẢN NHÁP'}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/projects/${p.id}`}
                                className="font-bold text-slate-900 hover:text-[#0A6EBD] transition line-clamp-2 leading-snug"
                              >
                                {p.title}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-slate-700 text-xs">{p.principalInvestigatorName}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{p.departmentName}</td>
                            <td className="px-4 py-3 text-center font-mono text-xs text-slate-500">
                              {p.submittedAt ? formatDisplayDate(p.submittedAt) : '–'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                                  p.status === 'IN_PROGRESS'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : (p.status as any) === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : p.status === 'DRAFT'
                                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {p.status === 'DRAFT'
                                  ? 'Bản nháp'
                                  : (p.status as any) === 'UNDER_REVIEW'
                                  ? 'Đang xét duyệt'
                                  : (p.status as any) === 'APPROVED'
                                  ? 'Đã duyệt'
                                  : p.status === 'IN_PROGRESS'
                                  ? 'Đang thực hiện'
                                  : p.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 font-semibold leading-relaxed">
                              {p.status === 'DRAFT' ? (
                                'Chờ nộp hồ sơ đăng ký'
                              ) : p.proposalStatus === 'REVISION_REQUIRED' ? (
                                <span className="text-amber-700 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                                  Chờ sửa đổi thuyết minh (BM7)
                                </span>
                              ) : (p.status as any) === 'UNDER_REVIEW' ? (
                                'Chờ thẩm định cấp Viện'
                              ) : (
                                '–'
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Link
                                href={`/projects/${p.id}`}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#0A6EBD] transition inline-flex"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: BIỂU MẪU ── */}
          {activeTab === 'TEMPLATES' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 select-none">
                  <tr>
                    <th className="px-4 py-3.5">Tên biểu mẫu</th>
                    <th className="px-4 py-3.5 w-32 text-center">Loại tài liệu</th>
                    <th className="px-4 py-3.5 w-24 text-center">Phiên bản</th>
                    <th className="px-4 py-3.5 w-32 text-center">Ngày hiệu lực</th>
                    <th className="px-4 py-3.5 w-24 text-right">Tải về</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {templatesList.map((t) => {
                    const isRequired = t.category === 'PROPOSAL';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <span className="font-mono text-xs bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-bold mr-2">
                                {t.code}
                              </span>
                              <span className="font-bold text-slate-800">{t.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isRequired
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {isRequired ? 'Bắt buộc' : 'Nội bộ'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-[#0A6EBD] font-bold">{t.templateVersion}</td>
                        <td className="px-4 py-3 text-center text-slate-500 font-mono text-xs">{t.updatedAt}</td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-[#0A6EBD] hover:text-[#085896] hover:underline inline-flex items-center gap-1 font-bold">
                            <Download className="w-3.5 h-3.5" /> Tải về
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TAB 4: LỊCH SỬ XỬ LÝ ── */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3.5 max-w-2xl">
              {historyList.map((h, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-7 h-7 flex items-center justify-center rounded-full bg-sky-50 text-[#0A6EBD] font-bold border border-sky-100 shrink-0 text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 bg-slate-50 border border-slate-150/60 rounded-xl p-4 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-800 text-sm">{h.action}</span>
                      <span className="font-mono text-xs text-slate-400 whitespace-nowrap">{h.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="text-slate-500">Người thực hiện: <strong className="text-slate-700">{h.user}</strong></span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-400">Trạng thái: {h.oldStatus} → {h.newStatus}</span>
                    </div>
                    {h.notes && <p className="text-xs text-slate-500 italic font-semibold">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT: REGISTRATION ROUNDS PAGE
   ───────────────────────────────────────────────────────────────── */
export default function RegistrationRoundsPage() {
  const router = useRouter();
  const { currentUser, switchRole } = useAuth();
  const { success, warning, error, confirm } = useToast();
  const [rounds, setRounds] = useState<RegistrationRound[]>(repo.getRounds());

  // Navigation and dynamic tabs inside detail view
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'APPLICATIONS' | 'TEMPLATES' | 'HISTORY'>('OVERVIEW');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editRound, setEditRound] = useState<RegistrationRound | null>(null);
  const [showExtendModal, setShowExtendModal] = useState<RegistrationRound | null>(null);

  // Filter and search states
  type TabFilter = 'ALL' | 'OPEN' | 'UPCOMING' | 'CLOSED';
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Form states
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState(today);
  const [formEndDate, setFormEndDate] = useState(today);
  const [formDeadlineForAmendment, setFormDeadlineForAmendment] = useState('');
  const [formTargetAudience, setFormTargetAudience] = useState('');
  const [formPriorityFields, setFormPriorityFields] = useState('');
  const [formMaxBudget, setFormMaxBudget] = useState('150000000');
  const [formDescription, setFormDescription] = useState('');

  // Extend form date
  const [extendDate, setExtendDate] = useState('');

  const canManage = useMemo(() => {
    return ['RESEARCH_OFFICE', 'ADMIN', 'DIRECTOR'].includes(currentUser.role);
  }, [currentUser.role]);

  const yearOptions = useMemo(() => {
    return Array.from(new Set(rounds.map((r) => r.year))).sort((a, b) => b - a);
  }, [rounds]);

  // Sync edit round states
  useEffect(() => {
    if (editRound) {
      setFormName(editRound.name);
      setFormStartDate(editRound.startDate);
      setFormEndDate(editRound.endDate);
      setFormDeadlineForAmendment(editRound.deadlineForAmendment || '');
      setFormTargetAudience(editRound.targetAudience);
      setFormPriorityFields(editRound.priorityFields ? editRound.priorityFields.join(', ') : '');
      setFormMaxBudget(String(editRound.maxBudget || 150000000));
      setFormDescription(editRound.description);
    }
  }, [editRound]);

  const tabCounts = useMemo(() => {
    return {
      ALL: rounds.length,
      OPEN: rounds.filter((r) => r.status === 'OPEN').length,
      UPCOMING: rounds.filter((r) => r.status === 'DRAFT').length,
      CLOSED: rounds.filter((r) => r.status === 'CLOSED').length,
    };
  }, [rounds]);

  const filteredRounds = useMemo(() => {
    return rounds.filter((r) => {
      if (activeTab === 'OPEN' && r.status !== 'OPEN') return false;
      if (activeTab === 'UPCOMING' && r.status !== 'DRAFT') return false;
      if (activeTab === 'CLOSED' && r.status !== 'CLOSED') return false;
      if (filterYear !== 'ALL' && r.year !== Number(filterYear)) return false;
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rounds, activeTab, filterYear, searchKeyword]);

  const pagedRounds = useMemo(() => {
    return filteredRounds.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRounds, currentPage, pageSize]);

  // Find currently open round
  const openRound = useMemo(() => {
    return rounds.find((r) => r.status === 'OPEN');
  }, [rounds]);

  // Calculate projects and statistics for the open round
  const openRoundStats = useMemo(() => {
    if (!openRound) return null;
    const openProjects = repo.getProjects().filter((p) => p.registrationRoundId === openRound.id);
    const submitted = openProjects.filter((p) => !['DRAFT'].includes(p.proposalStatus || p.status)).length;
    const needRevision = openProjects.filter((p) => p.proposalStatus === 'REVISION_REQUIRED').length;
    return {
      submitted,
      needRevision,
    };
  }, [openRound]);

  /* ── Event Handlers ── */
  const handleToggleClose = (round: RegistrationRound) => {
    confirm({
      title: 'Xác nhận đóng đợt đăng ký',
      message: `Đóng đợt "${round.name}" sẽ ngừng tiếp nhận hồ sơ đăng ký mới của cán bộ y tế. Bạn có chắc chắn muốn thực hiện?`,
      confirmLabel: 'Đóng đợt đăng ký',
      type: 'danger',
      onConfirm: () => {
        const updated = repo.updateRound(round.id, { status: 'CLOSED' });
        if (updated) {
          setRounds(repo.getRounds());
          success(`Đã đóng đợt đăng ký đề tài ${round.code} thành công.`);
        } else {
          error('Đã xảy ra lỗi khi đóng đợt đăng ký.');
        }
      },
    });
  };

  const handleOpenDraft = (round: RegistrationRound) => {
    confirm({
      title: 'Xác nhận mở đợt đăng ký',
      message: `Bắt đầu mở đợt tiếp nhận hồ sơ "${round.name}" trực tuyến?`,
      confirmLabel: 'Mở đợt đăng ký',
      type: 'info',
      onConfirm: () => {
        const updated = repo.updateRound(round.id, { status: 'OPEN' });
        if (updated) {
          setRounds(repo.getRounds());
          success(`Đã mở đợt đăng ký đề tài ${round.code} thành công!`);
        } else {
          error('Không thể mở đợt đăng ký.');
        }
      },
    });
  };

  const handleDelete = (round: RegistrationRound) => {
    const projects = repo.getProjects().filter((p) => p.registrationRoundId === round.id);
    if (projects.length > 0) {
      warning(`Không thể xóa đợt này. Đã phát sinh ${projects.length} hồ sơ đã nộp.`);
      return;
    }
    confirm({
      title: 'Xác nhận xóa đợt đăng ký',
      message: `Xóa vĩnh viễn đợt đăng ký "${round.name}" ra khỏi hệ thống? Thao tác này không thể hoàn tác.`,
      confirmLabel: 'Xóa vĩnh viễn',
      type: 'danger',
      onConfirm: () => {
        const updated = repo.updateRound(round.id, { status: 'CLOSED' }); // or simulated local filter out
        setRounds((prev) => prev.filter((r) => r.id !== round.id));
        success(`Đã xóa thành công đợt đăng ký ${round.code}.`);
      },
    });
  };

  const handleExtend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendDate || !showExtendModal) return;
    const updated = repo.updateRound(showExtendModal.id, { endDate: extendDate });
    if (updated) {
      setRounds(repo.getRounds());
      success(`Gia hạn đợt đăng ký ${showExtendModal.code} thành công đến ngày ${formatDisplayDate(extendDate)}.`);
    } else {
      error('Không thể thực hiện gia hạn.');
    }
    setShowExtendModal(null);
    setExtendDate('');
  };

  const handleExport = (round: RegistrationRound) => {
    success(`Đang xuất bảng dữ liệu danh sách hồ sơ đợt ${round.code} dạng Excel...`);
  };

  const openCreateModal = () => {
    setFormName('');
    setFormStartDate(today);
    setFormEndDate(today);
    setFormDeadlineForAmendment('');
    setFormTargetAudience('Toàn thể Bác sĩ, Dược sĩ, Điều dưỡng và Cán bộ y tế bệnh viện');
    setFormPriorityFields('Nhi khoa, Sản khoa, Y học lâm sàng trẻ em, Dịch tễ học nhi khoa');
    setFormMaxBudget('150000000');
    setFormDescription('');
    setShowCreateModal(true);
  };

  const handleCreateRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      warning('Vui lòng nhập tên đợt đăng ký.');
      return;
    }
    if (!formStartDate || !formEndDate) {
      warning('Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc.');
      return;
    }
    if (new Date(formEndDate) <= new Date(formStartDate)) {
      warning('Ngày kết thúc tiếp nhận phải lớn hơn ngày bắt đầu.');
      return;
    }

    const yr = new Date(formEndDate).getFullYear();
    const mo = String(new Date(formEndDate).getMonth() + 1).padStart(2, '0');
    const autoCode = `DOT-${yr}-${mo}`;

    const newRound: RegistrationRound = {
      id: `round-${Date.now()}`,
      code: autoCode,
      name: formName.trim(),
      year: yr,
      startDate: formStartDate,
      endDate: formEndDate,
      deadlineForAmendment: formDeadlineForAmendment || undefined,
      targetAudience: formTargetAudience.trim(),
      priorityFields: formPriorityFields
        ? formPriorityFields
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      maxBudget: Number(formMaxBudget) || 150000000,
      status: 'OPEN', // Auto open
      description: formDescription.trim(),
      totalSubmissions: 0,
    };

    repo.createRound(newRound);
    setRounds(repo.getRounds());
    success(`Đã tạo và mở đợt đăng ký "${newRound.name}" thành công!`);
    setShowCreateModal(false);
  };

  const handleUpdateRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRound || !formName.trim()) {
      warning('Vui lòng nhập tên đợt đăng ký.');
      return;
    }
    if (!formStartDate || !formEndDate) {
      warning('Vui lòng chọn ngày bắt đầu và kết thúc.');
      return;
    }
    if (new Date(formEndDate) <= new Date(formStartDate)) {
      warning('Ngày kết thúc tiếp nhận phải lớn hơn ngày bắt đầu.');
      return;
    }

    const yr = new Date(formEndDate).getFullYear();
    const updated = repo.updateRound(editRound.id, {
      name: formName.trim(),
      year: yr,
      startDate: formStartDate,
      endDate: formEndDate,
      deadlineForAmendment: formDeadlineForAmendment || undefined,
      targetAudience: formTargetAudience.trim(),
      priorityFields: formPriorityFields
        ? formPriorityFields
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      maxBudget: Number(formMaxBudget) || 150000000,
      description: formDescription.trim(),
    });

    if (updated) {
      setRounds(repo.getRounds());
      success(`Đã cập nhật thông tin đợt đăng ký ${editRound.code} thành công!`);
    } else {
      error('Lỗi khi cập nhật đợt đăng ký.');
    }
    setEditRound(null);
  };

  const detailRound = useMemo(() => {
    return detailId ? rounds.find((r) => r.id === detailId) : null;
  }, [detailId, rounds]);

  // Render detail view if selected
  if (detailRound) {
    return (
      <RoundDetailView
        round={detailRound}
        activeTab={detailTab}
        setActiveTab={setDetailTab}
        onBack={() => setDetailId(null)}
        onClose={() => handleToggleClose(detailRound)}
        onExtend={() => {
          setShowExtendModal(detailRound);
          setExtendDate(detailRound.endDate);
        }}
        onEdit={() => setEditRound(detailRound)}
        onOpen={() => handleOpenDraft(detailRound)}
        onDelete={() => handleDelete(detailRound)}
        onExport={() => handleExport(detailRound)}
        canManage={canManage}
      />
    );
  }

  return (
    <div className="space-y-4 text-slate-800 animate-in fade-in duration-200">
      {/* ── PAGE HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Đợt đăng ký đề tài</h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
            Quản lý thời gian tiếp nhận và hồ sơ đăng ký đề tài NCKH cấp cơ sở
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!canManage && (
            <button
              onClick={() => switchRole('RESEARCH_OFFICE')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 text-[#0A6EBD] text-xs font-bold rounded-lg hover:bg-sky-100 transition shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Quản trị đợt
            </button>
          )}
          {canManage && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo đợt đăng ký
            </button>
          )}
        </div>
      </div>

      {/* ── ACTIVE ROUND HIGHLIGHT (ONE COMPACT OPEN ROUND) ── */}
      {openRound && openRoundStats && (
        <section
          aria-labelledby="active-round-title"
          className="bg-gradient-to-r from-emerald-50/70 to-sky-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs select-none"
        >
          <div className="flex items-start gap-3 flex-1 min-w-[280px]">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span
                id="active-round-title"
                className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block"
              >
                Đợt đang tiếp nhận
              </span>
              <h2 className="text-sm font-bold text-slate-900 leading-snug">{openRound.name}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-semibold mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDisplayDate(openRound.startDate)} – {formatDisplayDate(openRound.endDate)}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-amber-700 font-bold">Còn {daysRemaining(openRound.endDate)} ngày</span>
                <span className="text-slate-300">·</span>
                <span className="text-[#0A6EBD] font-bold">{openRoundStats.submitted} hồ sơ đã nộp</span>
                {openRoundStats.needRevision > 0 && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-amber-700 font-bold">{openRoundStats.needRevision} yêu cầu chỉnh sửa</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setDetailId(openRound.id);
                setDetailTab('APPLICATIONS');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" /> Xem hồ sơ
            </button>
            {canManage && (
              <>
                <button
                  onClick={() => {
                    setShowExtendModal(openRound);
                    setExtendDate(openRound.endDate);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition shadow-2xs"
                >
                  <CalendarClock className="w-3.5 h-3.5" /> Gia hạn
                </button>
                <button
                  onClick={() => handleToggleClose(openRound)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100 transition shadow-2xs"
                >
                  <Lock className="w-3.5 h-3.5" /> Đóng
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── STATUS TABS ── */}
      <div className="flex items-center gap-1 border-b border-slate-200 select-none">
        {(
          [
            { id: 'ALL', label: 'Tất cả' },
            { id: 'OPEN', label: 'Đang mở' },
            { id: 'UPCOMING', label: 'Sắp mở' },
            { id: 'CLOSED', label: 'Đã đóng' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap -mb-px ${
              activeTab === t.id
                ? 'border-[#0A6EBD] text-[#0A6EBD]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === t.id ? 'bg-[#0A6EBD] text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tabCounts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search by Round name/code */}
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã đợt..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] text-xs font-medium outline-none bg-white transition"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter by Year */}
          <select
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value);
              setCurrentPage(1);
            }}
            className={`py-1.5 px-3 rounded-lg border text-xs font-semibold outline-none transition cursor-pointer ${
              filterYear !== 'ALL'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <option value="ALL">Năm: Tất cả</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-semibold">
          Hiển thị <strong className="text-slate-700 font-mono">{filteredRounds.length}</strong> đợt đăng ký
        </span>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 select-none">
              <tr>
                <th className="px-5 py-3.5 w-32 whitespace-nowrap">Mã đợt</th>
                <th className="px-5 py-3.5 min-w-[320px]">Tên đợt đăng ký</th>
                <th className="px-5 py-3.5 w-44 whitespace-nowrap">Thời gian tiếp nhận</th>
                <th className="px-5 py-3.5 w-32 text-center whitespace-nowrap">Hồ sơ</th>
                <th className="px-5 py-3.5 w-32 whitespace-nowrap">Trạng thái</th>
                <th className="px-5 py-3.5 w-16 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {pagedRounds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center select-none">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Calendar className="w-9 h-9 opacity-25" />
                      <p className="text-sm font-semibold text-slate-500">Không tìm thấy đợt đăng ký nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRounds.map((r) => {
                  const projectsCount = repo.getProjects().filter((p) => p.registrationRoundId === r.id).length;
                  const days = daysRemaining(r.endDate);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                      {/* Mã đợt */}
                      <td className="px-5 py-4 align-middle">
                        <button
                          onClick={() => {
                            setDetailId(r.id);
                            setDetailTab('OVERVIEW');
                          }}
                          className="font-mono font-bold text-xs text-[#0A6EBD] hover:underline"
                        >
                          {r.code}
                        </button>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5 select-none">{r.year}</p>
                      </td>

                      {/* Tên đợt đăng ký */}
                      <td className="px-5 py-4 align-middle">
                        <button
                          onClick={() => {
                            setDetailId(r.id);
                            setDetailTab('OVERVIEW');
                          }}
                          className="font-bold text-slate-900 hover:text-[#0A6EBD] transition text-left leading-snug line-clamp-2"
                        >
                          {r.name}
                        </button>
                      </td>

                      {/* Thời gian tiếp nhận */}
                      <td className="px-5 py-4 align-middle whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-700">
                          {formatDisplayDate(r.startDate)} – {formatDisplayDate(r.endDate)}
                        </p>
                        {r.status === 'OPEN' && (
                          <p className={`text-[10px] font-bold mt-0.5 select-none ${
                            days >= 0 ? 'text-amber-700' : 'text-rose-500'
                          }`}>
                            {days >= 0 ? `Còn ${days} ngày` : 'Đã quá hạn'}
                          </p>
                        )}
                      </td>

                      {/* Hồ sơ (Clickable) */}
                      <td className="px-5 py-4 align-middle text-center">
                        <button
                          onClick={() => {
                            setDetailId(r.id);
                            setDetailTab('APPLICATIONS');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A6EBD] hover:underline bg-[#EBF4FC]/70 hover:bg-[#EBF4FC] px-2.5 py-1 rounded-full border border-sky-100 transition"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{projectsCount} hồ sơ</span>
                        </button>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 align-middle">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Thao tác */}
                      <td className="px-5 py-4 align-middle text-center">
                        <RoundActionMenu
                          round={r}
                          canManage={canManage}
                          onView={() => {
                            setDetailId(r.id);
                            setDetailTab('OVERVIEW');
                          }}
                          onViewApplications={() => {
                            setDetailId(r.id);
                            setDetailTab('APPLICATIONS');
                          }}
                          onEdit={() => setEditRound(r)}
                          onOpen={() => handleOpenDraft(r)}
                          onExtend={() => {
                            setShowExtendModal(r);
                            setExtendDate(r.endDate);
                          }}
                          onClose={() => handleToggleClose(r)}
                          onDelete={() => handleDelete(r)}
                          onExport={() => handleExport(r)}
                          onAddProject={() => router.push(`/projects/register?round=${r.id}`)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredRounds.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="đợt đăng ký"
      />

      {/* ═══ MODAL TẠO ĐỢT ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleCreateRound}>
              <div className="px-6 py-4 border-b border-slate-100 bg-[#0B2A63] text-white flex justify-between items-center select-none">
                <h3 className="font-bold text-sm">Tạo đợt đăng ký đề tài</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/70 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Tên đợt đăng ký <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ví dụ: Đợt đăng ký đề tài NCKH cấp cơ sở – Đợt 2 năm 2026"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                      Ngày bắt đầu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                      Ngày kết thúc <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Hạn nộp bổ sung đề cương
                  </label>
                  <input
                    type="date"
                    value={formDeadlineForAmendment}
                    onChange={(e) => setFormDeadlineForAmendment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Đối tượng đăng ký
                  </label>
                  <input
                    type="text"
                    value={formTargetAudience}
                    onChange={(e) => setFormTargetAudience(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Lĩnh vực ưu tiên (Ngăn cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={formPriorityFields}
                    placeholder="Nhi khoa, Sản khoa, Y học lâm sàng..."
                    onChange={(e) => setFormPriorityFields(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Giới hạn kinh phí tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formMaxBudget}
                    onChange={(e) => setFormMaxBudget(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Hướng dẫn / Ghi chú bổ sung
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ghi chú chi tiết điều kiện hoặc tài liệu đính kèm..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 select-none">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-xl shadow-2xs transition"
                >
                  Tạo và mở đợt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL CHỈNH SỬA ĐỢT ═══ */}
      {editRound && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleUpdateRound}>
              <div className="px-6 py-4 border-b border-slate-100 bg-[#0B2A63] text-white flex justify-between items-center select-none">
                <h3 className="font-bold text-sm">Chỉnh sửa đợt đăng ký đề tài</h3>
                <button
                  type="button"
                  onClick={() => setEditRound(null)}
                  className="text-white/70 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="bg-sky-50 border border-sky-100 p-3 rounded-lg text-xs font-semibold text-slate-600 flex justify-between items-center select-none">
                  <span>Mã đợt đăng ký (Cố định):</span>
                  <span className="font-mono font-bold text-[#0A6EBD] text-sm">{editRound.code}</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Tên đợt đăng ký <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ví dụ: Đợt đăng ký đề tài NCKH cấp cơ sở – Đợt 2 năm 2026"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                      Ngày bắt đầu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                      Ngày kết thúc <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Hạn nộp bổ sung đề cương
                  </label>
                  <input
                    type="date"
                    value={formDeadlineForAmendment}
                    onChange={(e) => setFormDeadlineForAmendment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Đối tượng đăng ký
                  </label>
                  <input
                    type="text"
                    value={formTargetAudience}
                    onChange={(e) => setFormTargetAudience(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Lĩnh vực ưu tiên (Ngăn cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={formPriorityFields}
                    placeholder="Nhi khoa, Sản khoa, Y học lâm sàng..."
                    onChange={(e) => setFormPriorityFields(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Giới hạn kinh phí tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formMaxBudget}
                    onChange={(e) => setFormMaxBudget(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Hướng dẫn / Ghi chú bổ sung
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ghi chú chi tiết điều kiện hoặc tài liệu đính kèm..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 select-none">
                <button
                  type="button"
                  onClick={() => setEditRound(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-xl shadow-2xs transition"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL GIA HẠN ═══ */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleExtend}>
              <div className="px-5 py-4 border-b border-slate-100 bg-amber-600 text-white flex justify-between items-center select-none">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" /> Gia hạn đợt đăng ký
                </h3>
                <button
                  type="button"
                  onClick={() => setShowExtendModal(null)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="text-xs font-semibold text-slate-600 space-y-1 select-none">
                  <p>
                    Đợt: <strong className="text-slate-800">{showExtendModal.name}</strong>
                  </p>
                  <p>
                    Hạn kết thúc cũ:{' '}
                    <strong className="text-slate-800 font-mono">
                      {formatDisplayDate(showExtendModal.endDate)}
                    </strong>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 select-none">
                    Hạn kết thúc mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={extendDate}
                    min={showExtendModal.endDate}
                    onChange={(e) => setExtendDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 select-none">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(null)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-2xs transition"
                >
                  Gia hạn đợt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
