'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { repo } from '@/lib/repository';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { formatVND, formatDate } from '@/lib/utils';
import { DocxExportService } from '@/lib/services/docx-export-service';
import {
  Search,
  Plus,
  Printer,
  Eye,
  Edit,
  Activity,
  Users,
  FileCheck2,
  Award,
  X,
  DollarSign,
  TrendingUp,
  Filter,
  FileText,
  GitPullRequest,
  Building2,
  CheckCircle2,
  Calendar,
  Paperclip,
  CreditCard,
  MoreVertical,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  HelpCircle,
  UserCheck,
  UserX,
  PenTool,
  MoreHorizontal,
} from 'lucide-react';
import { ApproveProposalModal } from './ApproveProposalModal';
import { CreateMeetingMinutesModal } from './CreateMeetingMinutesModal';
import { useAuth } from '@/lib/auth-context';

/* ─────────────────────────────────────────────────────────────
   Quick-view Drawer – Hiển thị chi tiết, không thao tác nghiệp vụ
   ───────────────────────────────────────────────────────────── */
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

  const fundingLabel: Record<string, string> = {
    'NGÂN_SÁCH_BỆNH_VIỆN': 'Ngân sách Bệnh viện (Quỹ phát triển)',
    'TÀI_TRỢ_NGOÀI': 'Nhà tài trợ bên ngoài',
    'HỖN_HỢP': 'Hỗn hợp (Nhiều nguồn)',
    'TỰ_TÚC': 'Tự túc (Không nhận kinh phí)',
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-slate-900/30 backdrop-blur-xs" onClick={onClose} />
      <div className="w-[520px] max-w-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs font-bold text-[#0A6EBD] bg-[#EBF4FC] px-2 py-0.5 rounded border border-[#B8D7F5]">
              {p.projectCode || p.proposalCode}
            </span>
            <h2 className="text-[17px] font-bold text-slate-900 mt-2 leading-snug line-clamp-3">
              {p.title}
            </h2>
            <p className="text-[13px] text-slate-500 mt-1">
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status + Progress */}
          <div className="flex items-center gap-3">
            <StatusBadge status={p.status} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-[13px] font-bold mb-1">
                <span className="text-slate-500">Tiến độ thực hiện</span>
                <span className="text-[#0A6EBD]">{p.progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
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
            </div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { icon: Users, label: 'Chủ nhiệm', value: p.principalInvestigatorName },
              { icon: Building2, label: 'Khoa / Phòng', value: p.departmentName },
              { icon: Calendar, label: 'Thời gian', value: `${formatDate(p.startDate)} → ${formatDate(p.endDate)}` },
              {
                icon: DollarSign,
                label: p.approvedBudget ? 'Kinh phí được duyệt' : 'Kinh phí đề xuất',
                value: p.approvedBudget
                  ? formatVND(p.approvedBudget)
                  : p.estimatedBudget > 0
                  ? formatVND(p.estimatedBudget)
                  : 'Tự túc',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <item.icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{item.label}</p>
                  <p className="text-[13px] font-semibold text-slate-800 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Nguồn kinh phí */}
          <div className="bg-sky-50/40 border border-sky-100 rounded-xl p-3 text-[13px] flex justify-between items-center font-medium">
            <span className="text-slate-500">Nguồn kinh phí:</span>
            <span className="font-bold text-[#0A6EBD]">
              {fundingLabel[p.fundingSource] ?? 'Chưa xác định'}
            </span>
          </div>

          {/* Tóm tắt */}
          {p.summary && (
            <div>
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tóm tắt nghiên cứu</p>
              <p className="text-[14px] text-slate-700 leading-relaxed">{p.summary}</p>
            </div>
          )}

          {/* Thành viên */}
          {p.members && p.members.length > 0 && (
            <div>
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                Nhóm nghiên cứu ({p.members.length} người)
              </p>
              <div className="space-y-1.5">
                {p.members.slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[13px] px-2.5 py-1.5 bg-slate-50 rounded border border-slate-100">
                    <span className="font-semibold text-slate-800">{m.fullName}</span>
                    <span className="text-[12px] text-slate-400">{m.roleInProject.replace(/_/g, ' ')}</span>
                  </div>
                ))}
                {p.members.length > 4 && (
                  <p className="text-[12px] text-slate-400 text-center">+{p.members.length - 4} thành viên khác</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2 bg-[#F8FAFC]">
          <button
            onClick={() => router.push(`/projects/${p.id}`)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white text-[13px] font-semibold rounded-lg shadow-xs transition"
          >
            <Eye className="w-3.5 h-3.5" /> Xem toàn bộ hồ sơ
          </button>
          <button
            onClick={() => router.push(`/progress`)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[13px] font-semibold rounded-lg transition"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Tiến độ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Row Action Menu – Chỉ navigate + thao tác hành chính nhẹ
   Nguyên tắc: Không thực hiện Hội đồng/biên bản/phiếu tại đây.
   ───────────────────────────────────────────────────────────── */
function RowActionMenu({
  projectId,
  status,
  proposalStatus,
  role,
  onAdminReview,
  onRevisionRequest,
  onApproveProposal,
  onCreateMinutes,
  onExportDoc,
  onViewAttachments,
}: {
  projectId: string;
  status: string;
  proposalStatus: string;
  role: string;
  onAdminReview?: () => void;
  onRevisionRequest?: () => void;
  onApproveProposal?: () => void;
  onCreateMinutes?: () => void;
  onExportDoc?: () => void;
  onViewAttachments?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isResearcher = role === 'RESEARCHER';
  const isReviewStaff = ['RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN'].includes(role);

  type Action =
    | { kind: 'link'; icon: React.ElementType; label: string; href: string; color?: string }
    | { kind: 'btn'; icon: React.ElementType; label: string; color?: string; onClick: () => void }
    | { kind: 'divider' };

  const getActions = (): Action[] => {
    const viewDetail: Action = { kind: 'link', icon: Eye, label: 'Xem chi tiết hồ sơ', href: `/projects/${projectId}` };
    const exportDoc: Action | null = onExportDoc ? { kind: 'btn', icon: FileText, label: 'Xuất hồ sơ (BM-02)', onClick: onExportDoc } : null;
    const viewAttach: Action | null = onViewAttachments ? { kind: 'btn', icon: Paperclip, label: 'Xem tài liệu đính kèm', onClick: onViewAttachments } : null;

    // Helper để thêm các actions chung
    const withCommon = (actions: Action[]) => {
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);
      return actions;
    };

    /* ── 1. DRAFT ── */
    if (status === 'DRAFT') {
      if (isResearcher || role === 'ADMIN') {
        return withCommon([
          { kind: 'link', icon: Edit, label: 'Tiếp tục chỉnh sửa', href: `/projects/register?draftId=${projectId}` },
          { kind: 'link', icon: Eye, label: 'Xem trước hồ sơ', href: `/projects/${projectId}` },
          { kind: 'divider' }
        ]);
      }
      return withCommon([viewDetail, { kind: 'divider' }]);
    }

    /* ── 2. UNDER_REVIEW – Phân nhánh theo proposalStatus ── */
    if (status === 'UNDER_REVIEW') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      if (proposalStatus === 'SUBMITTED') {
        // Chờ kiểm tra hành chính
        if (isReviewStaff && onAdminReview) {
          actions.push({ kind: 'divider' });
          actions.push({ kind: 'btn', icon: ClipboardList, label: 'Kiểm tra & xử lý hồ sơ', color: 'text-[#0A6EBD]', onClick: onAdminReview });
        }
      } else if (proposalStatus === 'UNDER_ADMIN_REVIEW') {
        if (isReviewStaff && onAdminReview) {
          actions.push({ kind: 'divider' });
          actions.push({ kind: 'btn', icon: ClipboardList, label: 'Tiếp tục xử lý hồ sơ', color: 'text-amber-700', onClick: onAdminReview });
          if (onApproveProposal) {
            actions.push({ kind: 'btn', icon: FileCheck2, label: 'Duyệt đề xuất (Legacy)', color: 'text-[#0A6EBD]', onClick: onApproveProposal });
          }
        }
      } else if (proposalStatus === 'ADMIN_VALIDATED') {
        // Hồ sơ hợp lệ → Chờ Hội đồng xét duyệt
        if (isReviewStaff) {
          actions.push({ kind: 'divider' });
          actions.push({ kind: 'link', icon: Users, label: 'Xem Hội đồng xét duyệt', href: `/councils`, color: 'text-[#0A6EBD]' });
          if (onCreateMinutes) {
            actions.push({ kind: 'btn', icon: FileText, label: 'Tạo biên bản họp HĐKH', color: 'text-emerald-700', onClick: onCreateMinutes });
          }
        }
      } else if (proposalStatus === 'REVISION_REQUIRED' || proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
        // Chủ nhiệm cần bổ sung
        if (isResearcher || role === 'ADMIN') {
          actions.push({ kind: 'divider' });
          actions.push({ kind: 'link', icon: Edit, label: 'Bổ sung hồ sơ', href: `/projects/${projectId}/resubmit`, color: 'text-amber-700' });
        }
      } else if (proposalStatus === 'PROPOSAL_APPROVED') {
        // Đề cương đã được HĐ thông qua
        if (isReviewStaff) {
          actions.push({ kind: 'divider' });
          actions.push({ kind: 'link', icon: FileText, label: 'Lập Quyết định giao thực hiện', href: `/decisions/new?type=ASSIGNMENT&projectId=${projectId}`, color: 'text-emerald-700' });
        }
      }

      return actions;
    }

    /* ── 3. Cần bổ sung hồ sơ (general) ── */
    if (proposalStatus === 'REVISION_REQUIRED' || proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      if (isResearcher || role === 'ADMIN') {
        actions.push({ kind: 'divider' });
        actions.push({ kind: 'link', icon: Edit, label: 'Bổ sung / Nộp lại hồ sơ', href: `/projects/${projectId}/resubmit`, color: 'text-amber-700' });
      }
      return actions;
    }

    /* ── 4. Chờ ban hành Quyết định (APPROVED / WAITING_ASSIGNMENT / PROPOSAL_APPROVED) ── */
    if (status === 'PROPOSAL_APPROVED' || status === 'WAITING_ASSIGNMENT' || status === 'APPROVED') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      if (isReviewStaff) {
        actions.push({ kind: 'divider' });
        actions.push({
          kind: 'link',
          icon: FileText,
          label: 'Lập Quyết định giao thực hiện',
          href: `/decisions/new?type=ASSIGNMENT&projectId=${projectId}`,
          color: 'text-amber-700',
        });
      }
      return actions;
    }

    /* ── 5. Đang thực hiện ── */
    if (status === 'IN_PROGRESS' || status === 'ASSIGNED') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      if (isResearcher || role === 'ADMIN') {
        actions.push({ kind: 'divider' });
        actions.push({ kind: 'link', icon: GitPullRequest, label: 'Tạo yêu cầu điều chỉnh', href: `/projects/${projectId}/change-requests` });
      }
      if (isReviewStaff) {
        actions.push({ kind: 'divider' });
        actions.push({ kind: 'link', icon: GitPullRequest, label: 'Xem yêu cầu điều chỉnh', href: `/projects/${projectId}/change-requests` });
      }
      return actions;
    }

    /* ── 6. Chờ nghiệm thu ── */
    if (status === 'WAITING_ACCEPTANCE') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      actions.push({ kind: 'divider' });
      actions.push({ kind: 'link', icon: FileCheck2, label: 'Hồ sơ nghiệm thu', href: `/projects/${projectId}/acceptance` });
      if (isReviewStaff) {
        actions.push({ kind: 'link', icon: Users, label: 'Xem Hội đồng nghiệm thu', href: `/councils` });
      }
      return actions;
    }

    /* ── 7a. Đã nghiệm thu (ACCEPTED) → Bước tiếp: Lập QĐ công nhận kết quả ── */
    if (status === 'ACCEPTED') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      actions.push({ kind: 'divider' });
      actions.push({ kind: 'link', icon: FileCheck2, label: 'Xem biên bản nghiệm thu', href: `/projects/${projectId}/acceptance` });
      if (isReviewStaff) {
        actions.push({
          kind: 'link',
          icon: Award,
          label: 'Lập QĐ công nhận kết quả',
          href: `/decisions/new?type=RECOGNITION&projectId=${projectId}`,
          color: 'text-emerald-700',
        });
      }
      if (isResearcher || role === 'ADMIN') {
        actions.push({ kind: 'link', icon: FileText, label: 'Xem báo cáo tổng kết', href: `/projects/${projectId}/final-report` });
      }
      return actions;
    }

    /* ── 7b. Đã công nhận (RECOGNIZED) → Bước tiếp: Nộp lưu / Đóng hồ sơ ── */
    if (status === 'RECOGNIZED') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      actions.push({ kind: 'divider' });
      actions.push({ kind: 'link', icon: Award, label: 'Xem Quyết định công nhận', href: `/projects/${projectId}/acceptance` });
      actions.push({ kind: 'link', icon: FileText, label: 'Xem báo cáo tổng kết', href: `/projects/${projectId}/final-report` });
      if (isReviewStaff) {
        actions.push({ kind: 'divider' });
        actions.push({
          kind: 'link',
          icon: ClipboardList,
          label: 'Nộp lưu & Đóng hồ sơ',
          href: `/projects/${projectId}/archive`,
          color: 'text-slate-600',
        });
      }
      return actions;
    }

    /* ── 7c. Đã đóng / Lưu trữ (CLOSED / ARCHIVED) → Chỉ xem ── */
    if (status === 'CLOSED' || status === 'ARCHIVED') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      actions.push({ kind: 'divider' });
      actions.push({ kind: 'link', icon: Award, label: 'Hồ sơ nghiệm thu & KQ', href: `/projects/${projectId}/acceptance` });
      actions.push({ kind: 'link', icon: FileText, label: 'Báo cáo tổng kết', href: `/projects/${projectId}/final-report` });
      return actions;
    }

    /* ── 8. Bị từ chối / Kết thúc ── */
    if (status === 'REJECTED' || status === 'TERMINATED' || status === 'SUSPENDED') {
      return withCommon([viewDetail, { kind: 'divider' }]);
    }

    return withCommon([viewDetail, { kind: 'divider' }]);
  };

  const actions = getActions();
  if (actions.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs"
        title="Thao tác"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-[100] animate-in fade-in slide-in-from-top-2">
          {actions.map((a, i) => {
            if (a.kind === 'divider') {
              return <div key={`div-${i}`} className="h-px bg-slate-100 my-1.5 mx-2" />;
            }
            
            if (a.kind === 'link') {
              return (
                <Link
                  key={i}
                  href={a.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition hover:bg-slate-50 ${
                    a.color || 'text-slate-700'
                  }`}
                >
                  <a.icon className="w-4 h-4" />
                  {a.label}
                </Link>
              );
            }

            return (
              <button
                key={i}
                onClick={() => {
                  setIsOpen(false);
                  (a as any).onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition hover:bg-slate-50 ${
                  (a as any).color || 'text-slate-700'
                }`}
              >
                <a.icon className="w-4 h-4" />
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AdminReviewDialog – Xử lý hành chính nhẹ: Xác nhận hợp lệ /
   Yêu cầu bổ sung / Từ chối tiếp nhận (với lý do & chế độ)
   ───────────────────────────────────────────────────────────── */
function AdminReviewDialog({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'confirm' | 'revision' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [saved, setSaved] = useState(false);

  const project = repo.getProjectById(projectId);
  if (!project) return null;

  const handleConfirmValid = () => {
    repo.updateProject(projectId, { proposalStatus: 'VALID' });
    setSaved(true);
    setTimeout(onClose, 1800);
  };

  const handleRevision = () => {
    if (!reason.trim()) return;
    repo.updateProject(projectId, { proposalStatus: 'REVISION_REQUIRED' });
    setSaved(true);
    setTimeout(onClose, 1800);
  };

  const handleReject = () => {
    if (!reason.trim()) return;
    // Từ chối tiếp nhận → REJECTED, giữ lịch sử, KHÔNG về DRAFT
    repo.updateProject(projectId, { status: 'REJECTED', proposalStatus: 'REJECTED' });
    setSaved(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Kiểm tra hồ sơ hành chính</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{project.proposalCode}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {saved ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[12px] text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {mode === 'confirm' && 'Hồ sơ đã được xác nhận hợp lệ. Phòng NCKH có thể tiếp tục bố trí Hội đồng xét duyệt.'}
              {mode === 'revision' && 'Đã gửi yêu cầu bổ sung đến chủ nhiệm đề tài.'}
              {mode === 'reject' && 'Đã từ chối tiếp nhận hồ sơ. Hồ sơ đã được lưu lịch sử.'}
            </div>
          ) : mode === null ? (
            /* Chọn hành động */
            <div className="space-y-2.5">
              <p className="text-[12px] text-slate-500 font-medium">Chọn kết quả kiểm tra hồ sơ hành chính:</p>
              <button
                onClick={() => setMode('confirm')}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition text-left"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-emerald-800">Xác nhận hồ sơ hợp lệ</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Hồ sơ đủ thành phần, đúng biểu mẫu → chuyển xét duyệt chuyên môn</p>
                </div>
              </button>
              <button
                onClick={() => setMode('revision')}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition text-left"
              >
                <Edit className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-amber-800">Yêu cầu bổ sung hồ sơ</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">Hồ sơ thiếu/sai thành phần → trả về chủ nhiệm để chỉnh sửa</p>
                </div>
              </button>
              <button
                onClick={() => setMode('reject')}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 transition text-left"
              >
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-rose-800">Từ chối tiếp nhận</p>
                  <p className="text-[11px] text-rose-600 mt-0.5">Hồ sơ không đủ điều kiện tham dự → kết thúc xử lý</p>
                </div>
              </button>
            </div>
          ) : mode === 'confirm' ? (
            <div className="space-y-3">
              <button onClick={() => setMode(null)} className="text-[12px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
                ← Quay lại
              </button>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[12px] text-emerald-800 font-medium">
                Xác nhận hồ sơ <strong>{project.proposalCode}</strong> đủ điều kiện. Hồ sơ sẽ chuyển sang trạng thái <strong>Hồ sơ hợp lệ</strong>.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button onClick={() => setMode(null)} className="text-[12px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
                ← Quay lại
              </button>
              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1.5">
                  {mode === 'revision' ? 'Nội dung yêu cầu bổ sung' : 'Lý do từ chối tiếp nhận'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    mode === 'revision'
                      ? 'Mô tả cụ thể những thành phần hồ sơ cần bổ sung, biểu mẫu cần chỉnh sửa...'
                      : 'Nêu rõ lý do từ chối tiếp nhận hồ sơ này...'
                  }
                  className="w-full px-3 py-2.5 text-[12px] text-slate-800 border border-slate-300 rounded-lg outline-none focus:border-[#0A6EBD] bg-white resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!saved && (
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
            <button onClick={onClose} className="h-8 px-4 text-[12px] font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
              Hủy
            </button>
            {mode === 'confirm' && (
              <button onClick={handleConfirmValid} className="h-8 px-4 text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs">
                Xác nhận hợp lệ
              </button>
            )}
            {mode === 'revision' && (
              <button
                onClick={handleRevision}
                disabled={!reason.trim()}
                className="h-8 px-4 text-[12px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-xs disabled:opacity-40"
              >
                Gửi yêu cầu bổ sung
              </button>
            )}
            {mode === 'reject' && (
              <button
                onClick={handleReject}
                disabled={!reason.trim()}
                className="h-8 px-4 text-[12px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs disabled:opacity-40"
              >
                Từ chối tiếp nhận
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Page
   ───────────────────────────────────────────────────────────── */
export default function ProjectListPage() {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRound, setSelectedRound] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedField, setSelectedField] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerProjectId, setDrawerProjectId] = useState<string | null>(null);
  
  // Legacy Modals State
  const [approveModalProjectId, setApproveModalProjectId] = useState<string | null>(null);
  const [minutesModalProject, setMinutesModalProject] = useState<{id: string, title: string, pi: string} | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { currentUser } = useAuth();

  // ── Modal: Kiểm tra hồ sơ hành chính ──
  const [adminReviewModal, setAdminReviewModal] = useState<{ open: boolean; projectId: string | null }>({ open: false, projectId: null });

  // ── Unified filter reset ──
  const resetFilters = () => {
    setSelectedDept('ALL');
    setSelectedRound('ALL');
    setSelectedStatus('ALL');
    setSelectedYear('ALL');
    setSelectedField('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExportDoc = (project: any) => {
    DocxExportService.exportProposalDocx(project);
  };

  const handleViewAttachments = (project: any) => {
    if (!project.documents || project.documents.length === 0) {
      alert('Đề tài này hiện chưa có tài liệu đính kèm nào.');
      return;
    }
    // Navigate to project detail document tab
    window.open(`/projects/${project.id}#documents`, '_blank');
  };

  const projects = repo.getProjects();
  const departments = repo.getDepartments();
  const rounds = repo.getRounds();
  const years = Array.from(new Set(rounds.map((r) => r.year))).sort((a, b) => b - a);
  const researchFields = Array.from(new Set(projects.map((p) => p.researchField).filter(Boolean))).sort();

  // ── Filtering (P1 fix: selectedField now active) ──
  const filtered = projects.filter((p) => {
    if (selectedDept !== 'ALL' && p.departmentId !== selectedDept) return false;
    if (selectedRound !== 'ALL' && p.registrationRoundId !== selectedRound) return false;
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    if (selectedYear !== 'ALL') {
      const round = rounds.find((r) => r.id === p.registrationRoundId);
      if (!round || String(round.year) !== selectedYear) return false;
    }
    if (selectedField !== 'ALL' && p.researchField !== selectedField) return false;
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

  const hasFilters =
    selectedDept !== 'ALL' ||
    selectedRound !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedYear !== 'ALL' ||
    selectedField !== 'ALL' ||
    !!searchQuery.trim();

  // Tổng kinh phí: tách đề xuất vs được duyệt
  const totalEstimated = filtered.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);
  const totalApproved = filtered.reduce((acc, p) => acc + (p.approvedBudget || 0), 0);

  const displayStatus = (p: any): string => {
    if (p.status === 'UNDER_REVIEW') {
      if (p.proposalStatus === 'SUBMITTED') return 'SUBMITTED_PROPOSAL';
      if (p.proposalStatus === 'REVISION_REQUIRED') return 'REVISION_REQUIRED';
      if (p.proposalStatus === 'ADMIN_VALIDATED' || p.proposalStatus === 'VALID') return 'ADMIN_VALIDATED';
    }
    return p.status;
  };

  return (
    <div className="space-y-3 text-slate-800">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 select-none">
        <div>
          <h1 className="text-base font-bold text-slate-800">Danh sách đề tài</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Tra cứu toàn viện · Biết trạng thái · Đi tới đúng workspace xử lý</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã, tên đề tài, chủ nhiệm..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" /> In danh mục
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        {[
          { label: 'Năm', value: selectedYear, onChange: setSelectedYear, options: years.map((y) => ({ value: String(y), label: String(y) })) },
          {
            label: 'Khoa/Phòng', value: selectedDept, onChange: setSelectedDept,
            options: departments.map((d) => ({ value: d.id, label: d.name })),
          },
          {
            label: 'Đợt', value: selectedRound, onChange: setSelectedRound,
            options: rounds.map((r) => ({ value: r.id, label: `${r.code} – ${r.year}` })),
          },
          {
            label: 'Trạng thái', value: selectedStatus, onChange: setSelectedStatus,
            options: [
              { value: 'DRAFT', label: 'Tạo nháp' },
              { value: 'UNDER_REVIEW', label: 'Đang thẩm định' },
              { value: 'APPROVED', label: 'Đã duyệt đề cương' },
              { value: 'WAITING_ASSIGNMENT', label: 'Chờ giao nhiệm vụ' },
              { value: 'ASSIGNED', label: 'Đã giao nhiệm vụ' },
              { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
              { value: 'WAITING_ACCEPTANCE', label: 'Chờ nghiệm thu' },
              { value: 'ACCEPTED', label: 'Đã nghiệm thu' },
              { value: 'RECOGNIZED', label: 'Công nhận kết quả' },
              { value: 'CLOSED', label: 'Đã đóng' },
              { value: 'REJECTED', label: 'Bị từ chối' },
            ],
          },
          {
            label: 'Lĩnh vực', value: selectedField, onChange: setSelectedField,
            options: researchFields.map((f) => ({ value: f, label: f })),
          },
        ].map(({ label, value, onChange, options }) => (
          <div key={label} className="flex items-center gap-1.5">
            <label className="text-[12px] font-semibold text-slate-500 whitespace-nowrap">{label}</label>
            <select
              value={value}
              onChange={(e) => { onChange(e.target.value); setCurrentPage(1); }}
              className={`py-1.5 px-2.5 rounded-lg border text-[13px] font-medium outline-none transition max-w-[180px] ${
                value !== 'ALL' ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]' : 'border-slate-300 bg-white text-slate-600'
              }`}
            >
              <option value="ALL">Tất cả</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-100 transition-all shadow-2xs cursor-pointer animate-in fade-in"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400 font-medium whitespace-nowrap">
          {hasFilters ? (
            <><strong className="text-slate-700 font-mono font-bold">{filtered.length}</strong> / {projects.length} đề tài</>
          ) : (
            <><strong className="text-slate-700 font-mono font-bold">{projects.length}</strong> đề tài</>
          )}
        </span>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-visible">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse text-[13px] text-slate-750">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700 select-none">
              <tr className="border-l-4 border-l-transparent">
                <th className="px-4 py-3.5 whitespace-nowrap">Mã đề xuất</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Mã đề tài</th>
                <th className="px-4 py-3.5 min-w-[200px]">Tên đề tài</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Chủ nhiệm</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Ngày đăng ký</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Thời gian</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-center w-28 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 text-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search className="w-8 h-8 opacity-30" />
                      <p className="text-[13px] font-medium">Không tìm thấy đề tài nào phù hợp</p>
                      <button
                        onClick={resetFilters}
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
                    className={`border-l-4 transition-all duration-150 cursor-pointer hover:bg-sky-50/45 hover:border-l-[#0A6EBD] ${
                      drawerProjectId === p.id
                        ? 'bg-[#EBF4FC] border-l-[#0A6EBD]'
                        : 'border-l-transparent'
                    }`}
                  >
                    {/* Mã đề xuất */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <span className="font-mono font-bold text-[13px] text-slate-600">
                        {p.proposalCode || '-'}
                      </span>
                    </td>

                    {/* Mã đề tài – chỉ hiển thị khi đã được phê duyệt chính thức */}
                    <td
                      className="px-4 py-3 align-middle whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.projectCode ? (
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-mono font-bold text-[13px] text-[#0A6EBD] hover:underline"
                        >
                          {p.projectCode}
                        </Link>
                      ) : (
                        <span className="text-slate-300 text-[12px]">—</span>
                      )}
                    </td>

                    {/* Tên đề tài */}
                    <td className="px-4 py-3 align-middle">
                      <p className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2">
                        {p.title}
                      </p>
                    </td>

                    {/* Chủ nhiệm */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <p className="text-[13px] font-medium text-slate-900">
                        {p.principalInvestigatorName}
                      </p>
                    </td>

                    {/* Ngày đăng ký */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <span className="text-[13px] text-slate-600">
                        {formatDate(p.createdAt)}
                      </span>
                    </td>

                    {/* Thời gian thực hiện */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <span className="text-[13px] text-slate-600">
                        {p.durationMonths ? `${p.durationMonths} tháng` : '—'}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                      <StatusBadge status={displayStatus(p)} />
                    </td>

                    {/* Thao tác */}
                    <td
                      className="px-4 py-3 align-middle text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <RowActionMenu
                          projectId={p.id}
                          status={p.status}
                          proposalStatus={p.proposalStatus}
                          role={currentUser.role}
                          onAdminReview={() => setAdminReviewModal({ open: true, projectId: p.id })}
                          onApproveProposal={() => setApproveModalProjectId(p.proposalCode || p.id)}
                          onCreateMinutes={() => setMinutesModalProject({ id: p.id, title: p.title, pi: p.principalInvestigatorName })}
                          onExportDoc={() => handleExportDoc(p)}
                          onViewAttachments={() => handleViewAttachments(p)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer – tách KP đề xuất vs được duyệt */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-slate-100 text-[12px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span>
              KP đề xuất:{' '}
              <strong className="text-slate-700 font-mono font-bold">{formatVND(totalEstimated)}</strong>
            </span>
            {totalApproved > 0 && (
              <span>
                KP được duyệt:{' '}
                <strong className="text-emerald-700 font-mono font-bold">{formatVND(totalApproved)}</strong>
              </span>
            )}
          </div>
          <span>
            Tổng: <strong className="text-slate-700 font-mono font-bold">{filtered.length}</strong> đề tài
          </span>
        </div>
      </div>

      {/* ── Pagination ── */}
      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        itemLabel="đề tài"
      />

      {/* ── Quick-view Drawer ── */}
      {drawerProjectId && (
        <ProjectDrawer
          projectId={drawerProjectId}
          onClose={() => setDrawerProjectId(null)}
        />
      )}

      {/* ── Modal: Kiểm tra hồ sơ hành chính ── */}
      {adminReviewModal.open && adminReviewModal.projectId && (
        <AdminReviewDialog
          projectId={adminReviewModal.projectId}
          onClose={() => setAdminReviewModal({ open: false, projectId: null })}
        />
      )}

      {/* ── Modal: Duyệt đề xuất (Legacy UX) ── */}
      <ApproveProposalModal 
        isOpen={!!approveModalProjectId} 
        onClose={() => setApproveModalProjectId(null)} 
        projectCode={approveModalProjectId || ''} 
      />

      {/* ── Modal: Tạo biên bản họp (Legacy UX) ── */}
      <CreateMeetingMinutesModal 
        isOpen={!!minutesModalProject} 
        onClose={() => setMinutesModalProject(null)} 
        projectTitle={minutesModalProject?.title || ''} 
        piName={minutesModalProject?.pi || ''}
      />
    </div>
  );
}
