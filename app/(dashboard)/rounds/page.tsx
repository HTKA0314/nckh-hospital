'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
  ArrowLeft,
} from 'lucide-react';

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
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition text-left rounded-md cursor-pointer ${
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
        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-30 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 animate-in fade-in duration-100">
          {round.status === 'DRAFT' && (
            <>
              {item(<Edit className="w-3.5 h-3.5" />, 'Chỉnh sửa', onEdit)}
              {canManage && item(<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />, 'Mở đợt', onOpen)}
              <div className="border-t border-slate-100 my-1" />
              {canManage && item(<Trash2 className="w-3.5 h-3.5" />, 'Xóa đợt nháp', onDelete, true)}
            </>
          )}
          {round.status === 'OPEN' && (
            <>
              {item(<Plus className="w-3.5 h-3.5 text-[#0A6EBD]" />, 'Đăng ký đề tài', onAddProject)}
              {item(<Eye className="w-3.5 h-3.5" />, 'Xem danh sách hồ sơ', onViewApplications)}
              {canManage && item(<CalendarClock className="w-3.5 h-3.5 text-amber-600" />, 'Gia hạn đợt', onExtend)}
              {canManage && (
                <>
                  <div className="border-t border-slate-100 my-1" />
                  {item(<Lock className="w-3.5 h-3.5" />, 'Đóng đợt', onClose, true)}
                </>
              )}
            </>
          )}
          {round.status === 'COMPLETED' && (
            <>
              {item(<Eye className="w-3.5 h-3.5" />, 'Xem chi tiết', onView)}
              {item(<FileText className="w-3.5 h-3.5" />, 'Xem hồ sơ đã nộp', onViewApplications)}
              {item(<Download className="w-3.5 h-3.5" />, 'Xuất danh sách Excel', onExport)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ROUND DETAIL VIEW (Sub-tabs)
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
  onExport,
  canManage,
}: RoundDetailViewProps) {
  const { success } = useToast();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [showBatchApproveModal, setShowBatchApproveModal] = useState(false);
  const [approveDecisionNumber, setApproveDecisionNumber] = useState('');
  const [approveDecisionDate, setApproveDecisionDate] = useState(new Date().toISOString().split('T')[0]);

  const projects = useMemo(() => {
    return repo.getProjects().filter((p) => p.registrationRoundId === round.id);
  }, [round.id]);

  const days = daysRemaining(round.endDate);

  const TABS: { id: 'OVERVIEW' | 'APPLICATIONS' | 'TEMPLATES' | 'HISTORY'; label: string; count?: number }[] = [
    { id: 'OVERVIEW', label: 'Tổng quan' },
    { id: 'APPLICATIONS', label: 'Hồ sơ đăng ký', count: projects.length },
    { id: 'TEMPLATES', label: 'Biểu mẫu đính kèm' },
    { id: 'HISTORY', label: 'Lịch sử xử lý' },
  ];

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
      ...(round.status === 'COMPLETED'
        ? [
            {
              timestamp: round.endDate + ' 17:00',
              user: 'Phòng Quản lý NCKH',
              action: 'Đóng đợt đăng ký',
              oldStatus: 'OPEN',
              newStatus: 'COMPLETED',
              notes: 'Hết hạn tiếp nhận hồ sơ theo cấu hình đợt.',
            },
          ]
        : []),
    ];
  }, [round]);

  const toggleSelectProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllProjects = () => {
    if (selectedProjectIds.length === projects.length && projects.length > 0) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map((p) => p.id));
    }
  };

  const handleBatchApprove = (e: React.FormEvent) => {
    e.preventDefault();
    setShowBatchApproveModal(false);
    setSelectedProjectIds([]);
    success(`Đã phê duyệt ${selectedProjectIds.length} đề xuất và ghi nhận Quyết định đính kèm thành công!`);
  };

  return (
    <div className="space-y-4 text-slate-800 animate-in fade-in duration-200">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0A6EBD] transition select-none cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại danh sách đợt
      </button>

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

        <div className="flex items-center gap-2 shrink-0">
          {round.status === 'DRAFT' && canManage && (
            <>
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" /> Chỉnh sửa
              </button>
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mở đợt
              </button>
            </>
          )}
          {round.status === 'OPEN' && canManage && (
            <>
              <button
                onClick={onExtend}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition shadow-2xs cursor-pointer"
              >
                <CalendarClock className="w-3.5 h-3.5" /> Gia hạn đợt
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100 transition shadow-2xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" /> Đóng đợt
              </button>
            </>
          )}
          {round.status === 'COMPLETED' && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 text-[#0A6EBD] text-xs font-bold rounded-lg hover:bg-sky-100 transition shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Xuất danh sách Excel
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
              className={`px-4 py-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
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
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4 text-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 select-none">
                  Thông tin cấu hình đợt
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Năm kế hoạch', value: String(round.year) },
                    { label: 'Ngày bắt đầu', value: formatDisplayDate(round.startDate) },
                    { label: 'Ngày kết thúc', value: formatDisplayDate(round.endDate) },
                    {
                      label: 'Hạn bổ sung đề cương',
                      value: round.deadlineForAmendment ? formatDisplayDate(round.deadlineForAmendment) : 'Không cấu hình',
                    },
                    { label: 'Đối tượng đăng ký', value: round.targetAudience },
                    {
                      label: 'Lĩnh vực ưu tiên',
                      value: round.priorityFields ? round.priorityFields.join(', ') : 'Tất cả lĩnh vực y sinh',
                    },
                    ...(round.maxBudget ? [{ label: 'Kinh phí tối đa / đề tài', value: formatVND(round.maxBudget) }] : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold whitespace-nowrap text-xs">{row.label}</span>
                      <span className="font-bold text-slate-800 text-right text-xs">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 select-none">
                  Thống kê hồ sơ đăng ký
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border bg-slate-50 border-slate-200">
                    <span className="text-xs font-bold text-slate-500 block">Tổng số hồ sơ</span>
                    <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">{projects.length}</span>
                  </div>
                  <div className="p-4 rounded-xl border bg-sky-50 border-sky-200">
                    <span className="text-xs font-bold text-slate-500 block">Đã nộp chính thức</span>
                    <span className="text-2xl font-bold font-mono text-[#0A6EBD] mt-1 block">
                      {projects.filter((p) => p.status !== 'DRAFT').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'APPLICATIONS' && (
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-semibold">Chưa có hồ sơ đăng ký nào trong đợt này</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {canManage && selectedProjectIds.length > 0 && (
                    <div className="bg-sky-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0A6EBD]">
                        Đã chọn {selectedProjectIds.length} đề xuất
                      </span>
                      <button
                        onClick={() => setShowBatchApproveModal(true)}
                        className="px-3 py-1.5 bg-[#0A6EBD] text-white text-xs font-bold rounded hover:bg-[#085a9c] transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Phê duyệt danh sách & Đính kèm QĐ
                      </button>
                    </div>
                  )}
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500 select-none">
                      <tr>
                        {canManage && (
                          <th className="px-4 py-3 w-10 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-[#0A6EBD] rounded border-slate-300 focus:ring-[#0A6EBD] cursor-pointer"
                              checked={selectedProjectIds.length === projects.length && projects.length > 0}
                              onChange={handleSelectAllProjects}
                            />
                          </th>
                        )}
                        <th className="px-4 py-3 w-32">Mã đề tài</th>
                        <th className="px-4 py-3 min-w-[280px]">Tên đề tài</th>
                        <th className="px-4 py-3 w-40">Chủ nhiệm</th>
                        <th className="px-4 py-3 w-32">Trạng thái</th>
                        <th className="px-4 py-3 w-16 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {projects.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          {canManage && (
                            <td className="px-4 py-3 text-center">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-[#0A6EBD] rounded border-slate-300 focus:ring-[#0A6EBD] cursor-pointer"
                                checked={selectedProjectIds.includes(p.id)}
                                onChange={() => toggleSelectProject(p.id)}
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 font-mono font-bold text-[#0A6EBD]">
                            {p.projectCode || p.proposalCode || 'BẢN NHÁP'}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">{p.title}</td>
                          <td className="px-4 py-3 text-slate-700">{p.principalInvestigatorName}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0A6EBD] border border-sky-100">
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={`/projects/${p.id}`} className="text-[#0A6EBD] hover:underline font-bold">
                              Xem
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'TEMPLATES' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 font-bold uppercase text-slate-500 select-none">
                  <tr>
                    <th className="px-4 py-3">Tên biểu mẫu</th>
                    <th className="px-4 py-3 w-32 text-center">Loại tài liệu</th>
                    <th className="px-4 py-3 w-24 text-center">Phiên bản</th>
                    <th className="px-4 py-3 w-24 text-right">Tải về</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {templatesList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-bold text-slate-800">{t.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-bold border">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-[#0A6EBD]">{t.templateVersion}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-[#0A6EBD] hover:underline font-bold cursor-pointer inline-flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> Tải về
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="space-y-3 max-w-2xl">
              {historyList.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-[#0A6EBD] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{h.action}</span>
                      <span className="font-mono text-slate-400 font-medium">{h.timestamp}</span>
                    </div>
                    <p className="text-slate-500 font-medium">Thực hiện bởi: {h.user}</p>
                    {h.notes && <p className="text-slate-400 italic">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Batch Approve Modal */}
      {showBatchApproveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#0A6EBD]" />
                Phê duyệt danh sách đề xuất
              </h3>
              <button
                onClick={() => setShowBatchApproveModal(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleBatchApprove} className="p-6 space-y-5">
              <div className="bg-sky-50 border border-sky-100 p-4 rounded-lg flex gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-[#0A6EBD] shrink-0 mt-0.5" />
                <div className="text-slate-700 leading-relaxed font-medium">
                  Bạn đang thao tác phê duyệt hàng loạt cho <strong className="text-[#0A6EBD]">{selectedProjectIds.length}</strong> đề xuất nghiên cứu khoa học. Vui lòng đính kèm Quyết định/Tờ trình đã được phê duyệt làm minh chứng.
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Số quyết định / Tờ trình <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="VD: 125/QĐ-BV"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A6EBD] focus:border-[#0A6EBD] font-semibold text-slate-800"
                      value={approveDecisionNumber}
                      onChange={(e) => setApproveDecisionNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Ngày ký <span className="text-rose-500">*</span></label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A6EBD] focus:border-[#0A6EBD] font-semibold text-slate-800"
                      value={approveDecisionDate}
                      onChange={(e) => setApproveDecisionDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bản scan đính kèm (có chữ ký) <span className="text-rose-500">*</span></label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/50">
                    <FileText className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Kéo thả file vào đây hoặc <span className="text-[#0A6EBD] cursor-pointer hover:underline">nhấn để tải lên</span></p>
                    <p className="text-xs font-medium text-slate-400 mt-1">Hỗ trợ: PDF, JPG, PNG (Max 5MB)</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchApproveModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-[#0A6EBD] rounded-lg hover:bg-[#085a9c] transition cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Xác nhận phê duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT: REGISTRATION ROUNDS PAGE
   ───────────────────────────────────────────────────────────────── */
export default function RegistrationRoundsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();
  const [rounds, setRounds] = useState<RegistrationRound[]>(repo.getRounds());

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'APPLICATIONS' | 'TEMPLATES' | 'HISTORY'>('OVERVIEW');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editRound, setEditRound] = useState<RegistrationRound | null>(null);
  const [showExtendModal, setShowExtendModal] = useState<RegistrationRound | null>(null);

  type TabFilter = 'ALL' | 'OPEN' | 'UPCOMING' | 'COMPLETED';
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState(today);
  const [formEndDate, setFormEndDate] = useState(today);
  const [formDeadlineForAmendment, setFormDeadlineForAmendment] = useState('');
  const [formTargetAudience, setFormTargetAudience] = useState('');
  const [formPriorityFields, setFormPriorityFields] = useState('');
  const [formMaxBudget, setFormMaxBudget] = useState('150000000');
  const [formDescription, setFormDescription] = useState('');
  const [extendDate, setExtendDate] = useState('');

  const canManage = useMemo(() => {
    return ['RESEARCH_OFFICE', 'ADMIN', 'DIRECTOR'].includes(currentUser.role);
  }, [currentUser.role]);

  const yearOptions = useMemo(() => {
    return Array.from(new Set(rounds.map((r) => r.year))).sort((a, b) => b - a);
  }, [rounds]);

  useEffect(() => {
    if (editRound) {
      setFormCode(editRound.code);
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
      CLOSED: rounds.filter((r) => r.status === 'COMPLETED').length,
    };
  }, [rounds]);

  const filteredRounds = useMemo(() => {
    return rounds.filter((r) => {
      if (activeTab === 'OPEN' && r.status !== 'OPEN') return false;
      if (activeTab === 'UPCOMING' && r.status !== 'DRAFT') return false;
      if (activeTab === 'COMPLETED' && r.status !== 'COMPLETED') return false;
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

  const openRound = useMemo(() => {
    return rounds.find((r) => r.status === 'OPEN');
  }, [rounds]);

  /* ── Event Handlers ── */
  const handleToggleClose = (round: RegistrationRound) => {
    confirm({
      title: 'Xác nhận đóng đợt đăng ký',
      message: `Đóng đợt "${round.name}" sẽ ngừng tiếp nhận hồ sơ đăng ký mới của cán bộ y tế. Bạn có chắc chắn muốn thực hiện?`,
      confirmLabel: 'Đóng đợt đăng ký',
      type: 'danger',
      onConfirm: () => {
        const updated = repo.updateRound(round.id, { status: 'COMPLETED' });
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
      warning(`Không thể xóa đợt này. Đã phát sinh ${projects.length} hồ sơ đăng ký trong đợt.`);
      return;
    }
    confirm({
      title: 'Xác nhận xóa đợt nháp',
      message: `Xóa vĩnh viễn đợt đăng ký nháp "${round.name}"? Thao tác này không thể hoàn tác.`,
      confirmLabel: 'Xóa vĩnh viễn',
      type: 'danger',
      onConfirm: () => {
        setRounds((prev) => prev.filter((r) => r.id !== round.id));
        success(`Đã xóa thành công đợt đăng ký nháp ${round.code}.`);
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
    success(`Đang xuất danh sách hồ sơ đợt ${round.code} dạng file Excel...`);
  };

  const openCreateModal = () => {
    const yr = new Date().getFullYear();
    setFormCode(`DOT-${yr}-01`);
    setFormName('');
    setFormStartDate(today);
    setFormEndDate(today);
    setFormDeadlineForAmendment('');
    setFormTargetAudience('Toàn thể Bác sĩ, Dược sĩ và Cán bộ y tế Bệnh viện');
    setFormPriorityFields('Y học lâm sàng, Nhi khoa, Dịch tễ học');
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
      warning('Vui lòng nhập thời gian bắt đầu và kết thúc.');
      return;
    }
    if (new Date(formEndDate) <= new Date(formStartDate)) {
      warning('Ngày kết thúc phải lớn hơn ngày bắt đầu.');
      return;
    }

    const yr = new Date(formEndDate).getFullYear();
    const newRound: RegistrationRound = {
      id: `round-${Date.now()}`,
      code: formCode.trim() || `DOT-${yr}-01`,
      name: formName.trim(),
      year: yr,
      startDate: formStartDate,
      endDate: formEndDate,
      deadlineForAmendment: formDeadlineForAmendment || undefined,
      targetAudience: formTargetAudience.trim(),
      priorityFields: formPriorityFields
        ? formPriorityFields.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      maxBudget: Number(formMaxBudget) || 150000000,
      status: 'OPEN',
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
    if (!editRound || !formName.trim()) return;

    const yr = new Date(formEndDate).getFullYear();
    const updated = repo.updateRound(editRound.id, {
      code: formCode.trim(),
      name: formName.trim(),
      year: yr,
      startDate: formStartDate,
      endDate: formEndDate,
      deadlineForAmendment: formDeadlineForAmendment || undefined,
      targetAudience: formTargetAudience.trim(),
      priorityFields: formPriorityFields
        ? formPriorityFields.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      maxBudget: Number(formMaxBudget) || 150000000,
      description: formDescription.trim(),
    });

    if (updated) {
      setRounds(repo.getRounds());
      success(`Cập nhật thông tin đợt ${editRound.code} thành công!`);
    } else {
      error('Lỗi khi cập nhật đợt đăng ký.');
    }
    setEditRound(null);
  };

  const detailRound = useMemo(() => {
    return detailId ? rounds.find((r) => r.id === detailId) : null;
  }, [detailId, rounds]);

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
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Đợt đăng ký đề tài</h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Quản lý thời gian tiếp nhận và hồ sơ đăng ký đề tài NCKH cấp cơ sở
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canManage && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo đợt đăng ký
            </button>
          )}
        </div>
      </div>

      {/* ── đợt đang mở highlight ── */}
      {openRound && (
        <section className="bg-gradient-to-r from-emerald-50/70 to-sky-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs select-none">
          <div className="flex items-start gap-3 flex-1 min-w-[280px]">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Đợt đang tiếp nhận
              </span>
              <h2 className="text-sm font-bold text-slate-900 leading-snug">{openRound.name}</h2>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-2">
                <span>
                  Thời gian: {formatDisplayDate(openRound.startDate)} – {formatDisplayDate(openRound.endDate)}
                </span>
                <span>•</span>
                <span className="text-amber-700 font-bold">Còn {daysRemaining(openRound.endDate)} ngày</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push(`/projects/register?roundId=${openRound.id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0A6EBD] text-white hover:bg-[#085896] font-bold text-xs rounded-lg transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Đăng ký đề tài đợt này
            </button>
          </div>
        </section>
      )}

      {/* ── STATUS TABS ── */}
      <div className="flex items-center gap-1 border-b border-slate-200 select-none">
        {[
          { id: 'ALL', label: 'Tất cả' },
          { id: 'OPEN', label: 'Đang mở' },
          { id: 'UPCOMING', label: 'Sắp mở' },
          { id: 'COMPLETED', label: 'Đã đóng' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id as any);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap -mb-px cursor-pointer ${
              activeTab === t.id ? 'border-[#0A6EBD] text-[#0A6EBD]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{t.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === t.id ? 'bg-[#0A6EBD] text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {tabCounts[t.id as keyof typeof tabCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex flex-wrap items-center gap-2 flex-1">
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
              className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none bg-white focus:border-[#0A6EBD]"
            />
            {searchKeyword && (
              <button onClick={() => setSearchKeyword('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value);
              setCurrentPage(1);
            }}
            className="py-1.5 px-3 rounded-lg border text-xs font-semibold outline-none border-slate-200 bg-white text-slate-600 cursor-pointer"
          >
            <option value="ALL">Năm: Tất cả</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>Năm {y}</option>
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
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#0B2A63] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-white select-none">
              <tr>
                <th className="px-5 py-3.5 w-32 whitespace-nowrap">MÃ ĐỢT</th>
                <th className="px-5 py-3.5 min-w-[320px]">TÊN ĐỢT ĐĂNG KÝ</th>
                <th className="px-5 py-3.5 w-44 whitespace-nowrap">THỜI GIAN TIẾP NHẬN</th>
                <th className="px-5 py-3.5 w-32 text-center whitespace-nowrap">HỒ SƠ</th>
                <th className="px-5 py-3.5 w-32 whitespace-nowrap">TRẠNG THÁI</th>
                <th className="px-5 py-3.5 w-16 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {pagedRounds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Không tìm thấy đợt đăng ký nào.
                  </td>
                </tr>
              ) : (
                pagedRounds.map((r) => {
                  const projectsCount = repo.getProjects().filter((p) => p.registrationRoundId === r.id).length;
                  const days = daysRemaining(r.endDate);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4 align-middle">
                        <button
                          onClick={() => {
                            setDetailId(r.id);
                            setDetailTab('OVERVIEW');
                          }}
                          className="font-mono font-bold text-xs text-[#0A6EBD] hover:underline cursor-pointer"
                        >
                          {r.code}
                        </button>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <button
                          onClick={() => {
                            setDetailId(r.id);
                            setDetailTab('OVERVIEW');
                          }}
                          className="font-bold text-slate-900 hover:text-[#0A6EBD] transition text-left leading-snug cursor-pointer"
                        >
                          {r.name}
                        </button>
                      </td>

                      <td className="px-5 py-4 align-middle whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-700">
                          {formatDisplayDate(r.startDate)} – {formatDisplayDate(r.endDate)}
                        </p>
                        {r.status === 'OPEN' && (
                          <p className={`text-[10px] font-bold mt-0.5 ${days >= 0 ? 'text-amber-700' : 'text-rose-500'}`}>
                            {days >= 0 ? `Còn ${days} ngày` : 'Đã quá hạn'}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 align-middle text-center">
                        <button
                          onClick={() => {
                            setDetailId(r.id);
                            setDetailTab('APPLICATIONS');
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0A6EBD] hover:underline bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{projectsCount} hồ sơ</span>
                        </button>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <StatusBadge status={r.status} />
                      </td>

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
                          onAddProject={() => router.push(`/projects/register?roundId=${r.id}`)}
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

      {/* MODAL TẠO ĐỢT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleCreateRound}>
              <div className="px-6 py-4 border-b border-slate-100 bg-[#0B2A63] text-white flex justify-between items-center select-none">
                <h3 className="font-bold text-sm">Tạo đợt đăng ký đề tài</h3>
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-white/70 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã đợt đăng ký <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-mono font-bold text-[#0A6EBD] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên đợt đăng ký <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={2}
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngày bắt đầu <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngày kết thúc <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghi chú hướng dẫn</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-bold text-slate-700 bg-white border rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-xl transition cursor-pointer"
                >
                  Tạo và mở đợt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GIA HẠN */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden text-xs">
            <form onSubmit={handleExtend}>
              <div className="px-5 py-4 border-b bg-amber-600 text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" /> Gia hạn đợt đăng ký
                </h3>
                <button type="button" onClick={() => setShowExtendModal(null)} className="text-white/80 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <p>Gia hạn đợt: <strong>{showExtendModal.name}</strong></p>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày kết thúc mới *</label>
                  <input
                    type="date"
                    required
                    value={extendDate}
                    min={showExtendModal.endDate}
                    onChange={(e) => setExtendDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-semibold outline-none"
                  />
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(null)}
                  className="px-4 py-1.5 font-bold bg-white border rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition cursor-pointer"
                >
                  Gia hạn ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}