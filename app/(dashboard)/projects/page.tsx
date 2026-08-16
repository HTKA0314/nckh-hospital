'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { repo } from '@/lib/repository';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { formatVND, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { AdminReviewModal } from './_components/AdminReviewModal';
import { ApproveProposalModal } from './ApproveProposalModal';
import { DocxExportService } from '@/lib/services/docx-export-service';
import {
  Search,
  Printer,
  Eye,
  Edit,
  Users,
  FileCheck2,
  Award,
  X,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Filter,
  FileText,
  GitPullRequest,
  Building2,
  Calendar,
  Paperclip,
  ClipboardList,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ResearchProject } from '@/lib/types';

const isProposalStage = (project: ResearchProject): boolean =>
  project.status === 'DRAFT' || project.status === 'SUBMITTED';

const getDisplayStatus = (project: ResearchProject): string =>
  isProposalStage(project) ? project.proposalStatus : project.status;

const getDisplayStatusType = (
  project: ResearchProject
): 'PROJECT' | 'PROPOSAL' =>
  isProposalStage(project) ? 'PROPOSAL' : 'PROJECT';

const PROGRESS_STATUSES = new Set([
  'IN_PROGRESS',
  'CLOSING_SUBMITTED',
  'COMPLETED',
  'COMPLETED',
  'COMPLETED',
  'COMPLETED',
]);

/* ─────────────────────────────────────────────────────────────
   Quick-view Drawer – Hiển thị chi tiết bên phải màn hình
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
    <div className="fixed inset-0 z-50 flex select-none">
      <div className="flex-1 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="w-[520px] max-w-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-xs text-slate-800">
        {/* Header Drawer */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-[#0B2A63] text-white">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[11px] font-bold text-sky-200 bg-white/10 px-2 py-0.5 rounded border border-white/20">
              {p.projectCode || p.proposalCode}
            </span>
            <h2 className="text-sm md:text-base font-bold text-white mt-2 leading-snug line-clamp-2">
              {p.title}
            </h2>
            <p className="text-[11px] text-white/80 mt-1">
              {p.researchField} • {p.registrationRoundName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Drawer */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status + Progress */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <StatusBadge status={getDisplayStatus(p)} type={getDisplayStatusType(p)} />
            {['IN_PROGRESS', 'CLOSING_SUBMITTED'].includes(p.status) && (
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-500">Tiến độ thực hiện</span>
                  <span className="text-[#0A6EBD] font-mono">{p.reportedProgressPercentage || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${p.reportedProgressPercentage || 0}%`,
                      background:
                        (p.reportedProgressPercentage ?? 0) >= 75
                          ? '#059669'
                          : (p.reportedProgressPercentage ?? 0) >= 40
                          ? '#0A6EBD'
                          : '#F59E0B',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Users, label: 'Chủ nhiệm', value: p.principalInvestigatorName },
              { icon: Building2, label: 'Khoa / Phòng', value: p.departmentName },
              { icon: Calendar, label: 'Thời gian', value: `${formatDate(p.startDate)} → ${formatDate(p.endDate)}` },
              {
                icon: DollarSign,
                label: p.approvedBudget ? 'Kinh phí duyệt' : 'Kinh phí đề xuất',
                value: p.approvedBudget
                  ? formatVND(p.approvedBudget)
                  : p.estimatedBudget > 0
                  ? formatVND(p.estimatedBudget)
                  : 'Tự túc',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <item.icon className="w-3.5 h-3.5 text-[#0A6EBD] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Nguồn kinh phí */}
          <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3 flex justify-between items-center font-medium">
            <span className="text-slate-500">Nguồn kinh phí:</span>
            <span className="font-bold text-[#0A6EBD]">
              {fundingLabel[p.fundingSource] ?? 'Chưa xác định'}
            </span>
          </div>

          {/* Tóm tắt */}
          {p.summary && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tóm tắt nghiên cứu</p>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {p.summary}
              </p>
            </div>
          )}

          {/* Thành viên */}
          {p.members && p.members.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Nhóm nghiên cứu ({p.members.length} người)
              </p>
              <div className="space-y-1.5">
                {p.members.slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-200 font-medium">
                    <span className="font-bold text-slate-800">{m.fullName}</span>
                    <span className="text-[11px] text-slate-500">{m.roleInProject.replace(/_/g, ' ')}</span>
                  </div>
                ))}
                {p.members.length > 4 && (
                  <p className="text-[11px] text-slate-400 text-center font-medium">+{p.members.length - 4} thành viên khác</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Drawer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center gap-2 bg-slate-50">
          <button
            type="button"
            onClick={() => router.push(`/projects/${p.id}`)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> Xem toàn bộ hồ sơ
          </button>
          {PROGRESS_STATUSES.has(p.status) && (
            <button
              type="button"
              onClick={() => router.push(`/projects/${p.id}/progress`)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Tiến độ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Row Action Menu – Thao tác nhanh cho từng dòng
   ───────────────────────────────────────────────────────────── */
function RowActionMenu({
  projectId,
  status,
  proposalStatus,
  role,
  onAdminReview,
  onReceiveProject,
  onExportDoc,
  onViewAttachments,
  onApproveProposal,
}: {
  projectId: string;
  status: string;
  proposalStatus: string;
  role: string;
  onAdminReview?: () => void;
  onReceiveProject?: () => void;
  onExportDoc?: () => void;
  onViewAttachments?: () => void;
  onApproveProposal?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  const isReviewStaff = role === 'RESEARCH_OFFICE' || role === 'ADMIN';

  type Action =
    | { kind: 'link'; icon: React.ElementType; label: string; href: string; color?: string }
    | { kind: 'btn'; icon: React.ElementType; label: string; color?: string; onClick: () => void }
    | { kind: 'divider' };

  const getActions = (): Action[] => {
    const viewDetail: Action = { kind: 'link', icon: Eye, label: 'Xem chi tiết đề tài', href: `/projects/${projectId}` };
    const exportDoc: Action | null = onExportDoc ? { kind: 'btn', icon: FileText, label: 'Xuất Word (.docx)', onClick: onExportDoc } : null;
    const viewAttach: Action | null = onViewAttachments ? { kind: 'btn', icon: Paperclip, label: 'Xem tài liệu đính kèm', onClick: onViewAttachments } : null;

    const withCommon = (actions: Action[]) => {
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);
      return actions;
    };

    if (status === 'DRAFT') {
      if (isResearcher) {
        return withCommon([
          { kind: 'link', icon: Edit, label: 'Tiếp tục chỉnh sửa', href: `/projects/register?draftId=${projectId}` },
          { kind: 'link', icon: Eye, label: 'Xem trước hồ sơ', href: `/projects/${projectId}` },
          { kind: 'divider' }
        ]);
      }
      return withCommon([viewDetail, { kind: 'divider' }]);
    }

    if (status === 'SUBMITTED') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      if (proposalStatus === 'SUBMITTED' || proposalStatus === 'RESUBMITTED') {
        if (isReviewStaff && onReceiveProject) {
          actions.push({ kind: 'divider' });
          actions.push({ kind: 'btn', icon: CheckCircle2, label: 'Tiếp nhận hồ sơ', color: 'text-emerald-600', onClick: onReceiveProject });
        }
      }
      
      if (proposalStatus === 'UNDER_ADMIN_REVIEW') {
        if (isReviewStaff && onAdminReview) {
          actions.push({ kind: 'divider' });
          actions.push({ kind: 'btn', icon: ClipboardList, label: 'Thẩm định hồ sơ', color: 'text-[#0A6EBD]', onClick: onAdminReview });
        }
      } else if (proposalStatus === 'ADMIN_VALIDATED') {
        // Chủ nhiệm hoàn thiện đề cương ở màn chi tiết; Phòng NCKH chỉ theo dõi.
      } else if (
        proposalStatus === 'OUTLINE_SUBMITTED' ||
        proposalStatus === 'UNDER_PROPOSAL_REVIEW' ||
        proposalStatus === 'PROPOSAL_RESUBMITTED' ||
        proposalStatus === 'UNDER_PROPOSAL_REVISION_REVIEW'
      ) {
        if (isReviewStaff) {
          actions.push({ kind: 'divider' });
          if (onApproveProposal) {
            actions.push({
              kind: 'btn',
              icon: CheckCircle2,
              label: 'Duyệt đề cương',
              color: 'text-emerald-700 font-bold',
              onClick: onApproveProposal,
            });
          }
          actions.push({ kind: 'link', icon: Users, label: 'Xem bước Hội đồng', href: `/councils`, color: 'text-[#0A6EBD]' });
        }
      } else if (proposalStatus === 'REVISION_REQUIRED' || proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
        if (isResearcher) {
          actions.push({ kind: 'divider' });
          actions.push({ kind: 'link', icon: Edit, label: 'Bổ sung hồ sơ', href: `/projects/${projectId}/resubmit`, color: 'text-rose-700' });
        }
      } else if (proposalStatus === 'PROPOSAL_APPROVED') {
        if (isReviewStaff) {
          actions.push({ kind: 'divider' });
          actions.push({ kind: 'link', icon: FileText, label: 'Lập QĐ giao thực hiện', href: `/decisions`, color: 'text-emerald-700' });
        }
      }
      return actions;
    }

    if (status === 'APPROVED_PENDING_CONTRACT') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      if (isReviewStaff) {
        actions.push({ kind: 'divider' });
        actions.push({
          kind: 'link',
          icon: FileText,
          label: 'Quản lý QĐ giao thực hiện',
          href: `/decisions`,
          color: 'text-emerald-700',
        });
      }
      return actions;
    }

    if (status === 'IN_PROGRESS') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      actions.push({ kind: 'divider' });
      actions.push({ kind: 'link', icon: TrendingUp, label: 'Tiến độ & báo cáo', href: `/projects/${projectId}/progress` });
      if (isResearcher) {
        actions.push({ kind: 'link', icon: GitPullRequest, label: 'Yêu cầu điều chỉnh', href: `/change-requests` });
        actions.push({ kind: 'link', icon: FileCheck2, label: 'Hồ sơ nghiệm thu', href: `/projects/${projectId}/acceptance` });
      }
      return actions;
    }

    if (status === 'CLOSING_SUBMITTED') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      actions.push({ kind: 'divider' });
      actions.push({ kind: 'link', icon: FileCheck2, label: 'Hồ sơ nghiệm thu', href: `/projects/${projectId}/acceptance` });
      return actions;
    }

    if (status === 'COMPLETED') {
      const actions: Action[] = [viewDetail, { kind: 'divider' }];
      if (exportDoc) actions.push(exportDoc);
      if (viewAttach) actions.push(viewAttach);

      if (isReviewStaff) {
        actions.push({ kind: 'divider' });
        actions.push({ kind: 'link', icon: Award, label: 'Lập QĐ công nhận kết quả', href: `/decisions`, color: 'text-emerald-700' });
      }
      return actions;
    }

    return withCommon([viewDetail, { kind: 'divider' }]);
  };

  const actions = getActions();
  if (actions.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
        title="Thao tác"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in duration-100 text-xs">
          {actions.map((a, i) => {
            if (a.kind === 'divider') {
              return <div key={`div-${i}`} className="h-px bg-slate-100 my-1 mx-2" />;
            }
            
            if (a.kind === 'link') {
              return (
                <Link
                  key={i}
                  href={a.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-1.5 font-medium transition hover:bg-slate-50 ${
                    a.color || 'text-slate-700'
                  }`}
                >
                  <a.icon className="w-3.5 h-3.5" />
                  {a.label}
                </Link>
              );
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  a.onClick();
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 font-medium transition hover:bg-slate-50 cursor-pointer ${
                  a.color || 'text-slate-700'
                }`}
              >
                <a.icon className="w-3.5 h-3.5" />
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
   Main Page
   ───────────────────────────────────────────────────────────── */
export default function ProjectListPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { success } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [reviewProjectId, setReviewProjectId] = useState<string | null>(null);
  const [approveProjectId, setApproveProjectId] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRound, setSelectedRound] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedField, setSelectedField] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerProjectId, setDrawerProjectId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resetFilters = () => {
    setSelectedDept('ALL');
    setSelectedRound('ALL');
    setSelectedStatus('ALL');
    setSelectedYear('ALL');
    setSelectedField('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExportDoc = (project: ResearchProject) => {
    DocxExportService.exportProposalDocx(project);
  };

  const handleViewAttachments = (project: ResearchProject) => {
    router.push(`/projects/${project.id}`);
  };

  const projects = useMemo(() => repo.getProjects(), [dataVersion]);
  const departments = useMemo(() => repo.getDepartments(), []);
  const rounds = useMemo(() => repo.getRounds(), []);
  
  const handleReceiveProject = (projectId: string) => {
    if (!currentUser) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const now = new Date().toISOString();
    repo.updateProject(projectId, {
      proposalStatus: 'UNDER_ADMIN_REVIEW',
      updatedAt: now,
    });

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'RECEIVE_PROPOSAL_DOSSIER',
      entityType: 'PROJECT',
      entityId: projectId,
      fromStatus: project.proposalStatus,
      toStatus: 'UNDER_ADMIN_REVIEW',
      notes: `Tiếp nhận hồ sơ ${project.proposalCode || project.projectCode}.`,
    });

    setDataVersion(v => v + 1);
    success('Đã tiếp nhận hồ sơ thành công.');
  };
  const years = useMemo(() => Array.from(new Set(rounds.map((r) => r.year))).sort((a, b) => b - a), [rounds]);
  const researchFields = useMemo(() => Array.from(new Set(projects.map((p) => p.researchField).filter(Boolean))).sort(), [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (selectedDept !== 'ALL' && p.departmentId !== selectedDept) return false;
      if (selectedRound !== 'ALL' && p.registrationRoundId !== selectedRound) return false;
      if (selectedStatus !== 'ALL' && getDisplayStatus(p) !== selectedStatus) return false;
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
  }, [projects, selectedDept, selectedRound, selectedStatus, selectedYear, selectedField, searchQuery, rounds]);

  const pagedProjects = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasFilters =
    selectedDept !== 'ALL' ||
    selectedRound !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedYear !== 'ALL' ||
    selectedField !== 'ALL' ||
    Boolean(searchQuery.trim());

  const totalEstimated = filtered.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0);
  const totalApproved = filtered.reduce((acc, p) => acc + (p.approvedBudget || 0), 0);

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500 text-xs font-medium">Đang tải danh mục đề tài...</div>;
  }

  return (
    <div className="space-y-4 text-slate-800 text-xs pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3 select-none">
        <div>
          <h1 className="text-base font-bold text-slate-900">Danh mục Hồ sơ & Đề tài NCKH</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Tra cứu hồ sơ, theo dõi trạng thái và đi tới đúng bước xử lý</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã, tên đề tài, chủ nhiệm..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] text-xs outline-none bg-white font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-2xs transition whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" /> In danh mục
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs px-4 py-2.5 flex flex-wrap items-center gap-2.5">
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
              { value: 'SUBMITTED', label: 'Chờ kiểm tra hồ sơ' },
              { value: 'UNDER_ADMIN_REVIEW', label: 'Đang kiểm tra hồ sơ' },
              { value: 'REVISION_REQUIRED', label: 'Yêu cầu bổ sung hồ sơ' },
              { value: 'RESUBMITTED', label: 'Đã nộp lại hồ sơ' },
              { value: 'ADMIN_VALIDATED', label: 'Hồ sơ hợp lệ' },
              { value: 'OUTLINE_SUBMITTED', label: 'Chờ xét duyệt đề cương' },
              { value: 'UNDER_PROPOSAL_REVIEW', label: 'Đang xét duyệt đề cương' },
              { value: 'PROPOSAL_REVISION_REQUIRED', label: 'Yêu cầu chỉnh sửa đề cương' },
              { value: 'PROPOSAL_RESUBMITTED', label: 'Đã nộp lại đề cương' },
              { value: 'UNDER_PROPOSAL_REVISION_REVIEW', label: 'Đang xét lại đề cương' },
              { value: 'PROPOSAL_APPROVED', label: 'Đề cương được thông qua' },
              { value: 'APPROVED_PENDING_CONTRACT', label: 'Chờ giao thực hiện' },
              { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
              { value: 'CLOSING_SUBMITTED', label: 'Chờ nghiệm thu' },
              { value: 'COMPLETED', label: 'Đã nghiệm thu' },
              { value: 'COMPLETED', label: 'Đã công nhận kết quả' },
              { value: 'COMPLETED', label: 'Đã đóng' },
              { value: 'COMPLETED', label: 'Đã lưu trữ' },
              { value: 'EXTENSION_REQUESTED', label: 'Tạm dừng' },
              { value: 'TERMINATED', label: 'Đã chấm dứt' },
              { value: 'SCREENING_FAILED', label: 'Bị từ chối' },
            ],
          },
          {
            label: 'Lĩnh vực', value: selectedField, onChange: setSelectedField,
            options: researchFields.map((f) => ({ value: f, label: f })),
          },
        ].map(({ label, value, onChange, options }) => (
          <div key={label} className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{label}:</label>
            <select
              value={value}
              onChange={(e) => { onChange(e.target.value); setCurrentPage(1); }}
              className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold outline-none transition max-w-[160px] cursor-pointer ${
                value !== 'ALL' ? 'border-[#0A6EBD] text-[#0A6EBD] bg-sky-50' : 'border-slate-300 bg-white text-slate-700'
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
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition shadow-2xs cursor-pointer"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400 font-medium whitespace-nowrap">
          Hiển thị <strong className="text-slate-700 font-mono font-bold">{filtered.length}</strong> / {projects.length} đề tài
        </span>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#0B2A63] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-white select-none">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">MÃ ĐỀ XUẤT</th>
                <th className="px-4 py-3 whitespace-nowrap">MÃ ĐỀ TÀI</th>
                <th className="px-4 py-3 min-w-[240px]">TÊN ĐỀ TÀI NGHIÊN CỨU</th>
                <th className="px-4 py-3 whitespace-nowrap">CHỦ NHIỆM / ĐƠN VỊ</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">NGÀY ĐĂNG KÝ</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">THỜI GIAN</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">TRẠNG THÁI</th>
                <th className="px-4 py-3 text-center w-24 whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    Không tìm thấy đề tài nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                pagedProjects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setDrawerProjectId(p.id)}
                    className={`transition duration-150 cursor-pointer hover:bg-slate-50 border-l-[3px] ${
                      drawerProjectId === p.id
                        ? 'bg-sky-50/70 border-l-[#0A6EBD]'
                        : 'border-l-transparent'
                    }`}
                  >
                    {/* Mã đề xuất */}
                    <td className="px-4 py-3 align-middle font-mono font-bold text-slate-600 whitespace-nowrap">
                      {p.proposalCode || '—'}
                    </td>

                    {/* Mã đề tài */}
                    <td
                      className="px-4 py-3 align-middle whitespace-nowrap font-mono font-bold text-[#0A6EBD]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.projectCode ? (
                        <Link href={`/projects/${p.id}`} className="hover:underline">
                          {p.projectCode}
                        </Link>
                      ) : (
                        <span className="text-slate-300 font-normal">—</span>
                      )}
                    </td>

                    {/* Tên đề tài */}
                    <td className="px-4 py-3 align-middle leading-snug">
                      <p className="font-bold text-slate-900 line-clamp-2">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.researchField}</p>
                    </td>

                    {/* Chủ nhiệm */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <p className="font-bold text-slate-900">{p.principalInvestigatorName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.departmentName}</p>
                    </td>

                    {/* Ngày đăng ký */}
                    <td className="px-4 py-3 align-middle text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </td>

                    {/* Thời gian */}
                    <td className="px-4 py-3 align-middle text-center text-slate-600 whitespace-nowrap font-semibold">
                      {p.startDate && p.endDate ? `${formatDate(p.startDate)} → ${formatDate(p.endDate)}` : '12 tháng'}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                      <StatusBadge status={getDisplayStatus(p)} type={getDisplayStatusType(p)} />
                    </td>

                    {/* Thao tác */}
                    <td
                      className="px-4 py-3 align-middle text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RowActionMenu
                        projectId={p.id}
                        status={p.status}
                        proposalStatus={p.proposalStatus}
                        role={currentUser?.role || 'RESEARCHER'}
                        onAdminReview={() => setReviewProjectId(p.id)}
                        onReceiveProject={() => handleReceiveProject(p.id)}
                        onExportDoc={() => handleExportDoc(p)}
                        onViewAttachments={() => handleViewAttachments(p)}
                        onApproveProposal={() => setApproveProjectId(p.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 font-medium">
          <div className="flex items-center gap-4">
            <span>
              KP đề xuất:{' '}
              <strong className="text-slate-800 font-mono font-bold">{formatVND(totalEstimated)}</strong>
            </span>
            {totalApproved > 0 && (
              <span>
                KP phê duyệt:{' '}
                <strong className="text-emerald-700 font-mono font-bold">{formatVND(totalApproved)}</strong>
              </span>
            )}
          </div>
          <span>
            Tổng số: <strong className="text-slate-800 font-mono font-bold">{filtered.length}</strong> đề tài
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

      {/* Review Modal */}
      {reviewProjectId && (
        <AdminReviewModal
          project={projects.find(p => p.id === reviewProjectId)!}
          onClose={() => setReviewProjectId(null)}
          onSuccess={() => {
            setReviewProjectId(null);
            setDataVersion(v => v + 1);
            success('Đã lưu kết quả thẩm định hồ sơ.');
          }}
        />
      )}

      {/* Approve Proposal Modal */}
      {approveProjectId && (
        <ApproveProposalModal
          isOpen={true}
          onClose={() => setApproveProjectId(null)}
          projectId={approveProjectId}
          projectCode={projects.find(p => p.id === approveProjectId)?.projectCode}
          projectTitle={projects.find(p => p.id === approveProjectId)?.title}
          onSuccess={() => {
            setApproveProjectId(null);
            setDataVersion(v => v + 1);
          }}
        />
      )}
    </div>
  );
}