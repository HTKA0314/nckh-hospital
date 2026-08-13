'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Award,
  Calendar,
  Edit,
  Eye,
  FileText,
  Filter,
  GitPullRequest,
  History as HistoryIcon,
  LayoutGrid,
  List,
  MoreVertical,
  Plus,
  Search,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { ResearchProject } from '@/lib/types';
import {
  SubmitOutlineModal,
  type SubmitOutlinePayload,
} from './SubmitProposalModal';

interface ActionItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  isDestructive?: boolean;
  onClick?: () => void;
}

type ActiveTab =
  | 'all'
  | 'action_needed'
  | 'processing'
  | 'in_progress'
  | 'completed';

type SortBy = 'NEWEST' | 'DEADLINE';

export default function MyProjectsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRound, setSelectedRound] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataVersion, setDataVersion] = useState(0);

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [outlineSubmissionProject, setOutlineSubmissionProject] =
    useState<ResearchProject | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rounds = repo.getRounds();

  const rawProjects = useMemo(() => {
    const list = repo.getProjects();

    // Đây là "Đề tài của tôi": luôn lọc theo quan hệ của user với đề tài.
    // Không mặc định ADMIN/DIRECTOR/RESEARCH_OFFICE nhìn toàn bộ tại màn này.
    return list.filter(
      (p) =>
        p.principalInvestigatorId === currentUser.id ||
        p.members.some((member) => member.userId === currentUser.id)
    );
  }, [currentUser.id, dataVersion]);

  const handleDeleteDraft = (id: string) => {
    const project = repo.getProjects().find((p) => p.id === id);

    if (
      !project ||
      project.status !== 'DRAFT' ||
      project.proposalStatus !== 'DRAFT'
    ) {
      error('Chỉ được xóa hồ sơ đăng ký chưa nộp.');
      return;
    }

    // Nếu dự án đã có cơ chế ConfirmationDialog dùng chung,
    // thay confirm() tại đây bằng dialog đó.
    const confirmed = window.confirm(
      'Xóa bản nháp này? Hành động này không thể hoàn tác.'
    );

    if (!confirmed) return;

    const isSuccess = repo.deleteProject(id);

    if (!isSuccess) {
      error('Không thể xóa bản nháp.');
      return;
    }

    success('Đã xóa bản nháp.');
    setDataVersion((value) => value + 1);
  };

  const handleSubmitOutline = async (payload: SubmitOutlinePayload) => {
    const project = repo
      .getProjects()
      .find((item) => item.id === payload.projectId);

    if (!project) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    if (project.proposalStatus !== 'ADMIN_VALIDATED') {
      throw new Error('INVALID_PROPOSAL_STATE');
    }

    /*
     * TODO khi repository có Document Service:
     * 1. Upload payload.file.
     * 2. Tạo/cập nhật ProjectDocument với documentType = DETAILED_OUTLINE.
     * 3. Tạo DocumentVersion mới, không ghi đè phiên bản cũ.
     * 4. Chỉ sau khi upload thành công mới transition proposalStatus.
     *
     * Hiện repository được cung cấp chưa có API upload file trong đoạn mã nguồn
     * đã xác minh, vì vậy không giả lập một method không tồn tại.
     */

    repo.updateProject(payload.projectId, {
      proposalStatus: 'OUTLINE_SUBMITTED',
      updatedAt: new Date().toISOString(),
    });

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      entityType: 'PROJECT',
      entityId: payload.projectId,
      actionCode: 'OUTLINE_SUBMITTED',
      notes: `Nộp đề cương chi tiết: ${payload.file.name}; thời gian dự kiến ${payload.fromMonth} - ${payload.toMonth}`,
    });

    success(
      'Đã nộp đề cương. Hồ sơ đang chờ Phòng NCKH tiếp nhận và chuyển xét duyệt đề cương.'
    );

    setDataVersion((value) => value + 1);
    router.refresh();
  };

  const myProjects = useMemo(() => {
    return rawProjects.map((p) => {
      let statusText = 'Đang xử lý';
      let statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
      let isActionNeeded = false;

      let primaryAction: ActionItem = {
        label: 'Xem chi tiết',
        href: `/projects/${p.id}`,
        icon: Eye,
      };
      let secondaryActions: ActionItem[] = [
        {
          label: 'Xem tài liệu',
          href: `/projects/${p.id}?tab=DOCUMENTS`,
          icon: FileText,
        },
        {
          label: 'Lịch sử xử lý',
          href: `/projects/${p.id}?tab=HISTORY`,
          icon: HistoryIcon,
        },
      ];

      if (p.status === 'DRAFT') {
        statusText = 'Bản nháp';
        isActionNeeded = true;
        primaryAction = {
          label: 'Tiếp tục chỉnh sửa',
          href: `/projects/register?draftId=${p.id}`,
          icon: Edit,
        };
        secondaryActions = [
          {
            label: 'Xem chi tiết',
            href: `/projects/${p.id}`,
            icon: Eye,
          },
          {
            label: 'Xóa bản nháp',
            icon: Trash2,
            isDestructive: true,
            onClick: () => handleDeleteDraft(p.id),
          },
        ];
      } else if (
        p.proposalStatus === 'SUBMITTED' ||
        p.proposalStatus === 'UNDER_ADMIN_REVIEW' ||
        p.proposalStatus === 'RESUBMITTED'
      ) {
        statusText = 'Chờ kiểm tra hồ sơ';
        statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
        primaryAction = {
          label: 'Xem hồ sơ',
          href: `/projects/${p.id}`,
          icon: Eye,
        };
      } else if (p.proposalStatus === 'REVISION_REQUIRED') {
        statusText = 'Cần bổ sung';
        statusColor = 'bg-rose-50 text-rose-800 border-rose-200';
        isActionNeeded = true;
        primaryAction = {
          label: 'Bổ sung hồ sơ',
          href: `/projects/${p.id}/resubmit`,
          icon: Edit,
        };
        secondaryActions = [
          {
            label: 'Xem yêu cầu bổ sung',
            href: `/projects/${p.id}?tab=HISTORY`,
            icon: AlertCircle,
          },
          {
            label: 'Xem các phiên bản',
            href: `/projects/${p.id}?tab=DOCUMENTS`,
            icon: HistoryIcon,
          },
        ];
      } else if (p.proposalStatus === 'ADMIN_VALIDATED') {
        statusText = 'Chờ nộp đề cương';
        statusColor = 'bg-sky-50 text-[#0A6EBD] border-sky-200';
        isActionNeeded = true;
        primaryAction = {
          label: 'Nộp đề cương',
          icon: Upload,
          onClick: () => setOutlineSubmissionProject(p),
        };
        secondaryActions = [
          {
            label: 'Xem hồ sơ đã duyệt',
            href: `/projects/${p.id}`,
            icon: Eye,
          },
          {
            label: 'Xem tài liệu',
            href: `/projects/${p.id}?tab=DOCUMENTS`,
            icon: FileText,
          },
        ];
      } else if (
        p.proposalStatus === 'OUTLINE_SUBMITTED' ||
        p.proposalStatus === 'UNDER_PROPOSAL_REVIEW'
      ) {
        statusText = 'Chờ HĐ xét duyệt';
        statusColor = 'bg-sky-50 text-[#0A6EBD] border-sky-200';
        primaryAction = {
          label: 'Xem chi tiết',
          href: `/projects/${p.id}`,
          icon: Eye,
        };
        secondaryActions = [
          {
            label: 'Đề cương đã nộp',
            href: `/projects/${p.id}?tab=DOCUMENTS`,
            icon: FileText,
          },
          {
            label: 'Lịch Hội đồng',
            href: `/projects/${p.id}?tab=COUNCIL`,
            icon: Calendar,
          },
        ];
      } else if (p.proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
        statusText = 'Cần hoàn thiện theo HĐ';
        statusColor = 'bg-rose-50 text-rose-800 border-rose-200';
        isActionNeeded = true;
        primaryAction = {
          label: 'Hoàn thiện đề cương',
          href: `/projects/${p.id}/resubmit`,
          icon: Edit,
        };
        secondaryActions = [
          {
            label: 'Xem ý kiến Hội đồng',
            href: `/projects/${p.id}?tab=COUNCIL_MINUTES`,
            icon: FileText,
          },
          {
            label: 'Xem phiên bản đề cương',
            href: `/projects/${p.id}?tab=DOCUMENTS`,
            icon: HistoryIcon,
          },
        ];
      } else if (
        p.proposalStatus === 'PROPOSAL_RESUBMITTED' ||
        p.proposalStatus === 'UNDER_PROPOSAL_REVISION_REVIEW'
      ) {
        statusText = 'Chờ xác nhận hoàn thiện';
        statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
      } else if (
        p.ethicsStatus === 'UNDER_ETHICS_REVIEW' ||
        p.ethicsStatus === 'ETHICS_REVISION_REQUIRED' ||
        p.ethicsStatus === 'DOSSIER_SUBMITTED' ||
        p.ethicsStatus === 'SCREENING_IN_PROGRESS'
      ) {
        const needsEthicsRevision =
          p.ethicsStatus === 'ETHICS_REVISION_REQUIRED';

        statusText =
          p.ethicsStatus === 'SCREENING_IN_PROGRESS'
            ? 'Đang sàng lọc đạo đức'
            : p.ethicsStatus === 'DOSSIER_SUBMITTED'
              ? 'Chờ tiếp nhận đạo đức'
              : p.ethicsStatus === 'UNDER_ETHICS_REVIEW'
                ? 'Đang thẩm định đạo đức'
                : 'Cần bổ sung đạo đức';
        statusColor = 'bg-purple-50 text-purple-800 border-purple-200';
        isActionNeeded = needsEthicsRevision;

        primaryAction = needsEthicsRevision
          ? {
              label: 'Bổ sung hồ sơ',
              href: `/projects/${p.id}/ethics`,
              icon: Edit,
            }
          : {
              label: 'Xem trạng thái',
              href: `/projects/${p.id}?tab=HISTORY`,
              icon: Shield,
            };
      } else if (
        (p.status === 'WAITING_ASSIGNMENT' ||
          p.proposalStatus === 'PROPOSAL_APPROVED') &&
        (!p.ethicsRequired ||
          p.ethicsStatus === 'NOT_REQUIRED' ||
          p.ethicsStatus === 'ETHICS_APPROVED')
      ) {
        statusText = 'Chờ giao thực hiện';
        statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
        primaryAction = {
          label: 'Xem trạng thái',
          href: `/projects/${p.id}`,
          icon: Eye,
        };
        secondaryActions = [
          {
            label: 'Xem tài liệu',
            href: `/projects/${p.id}?tab=DOCUMENTS`,
            icon: FileText,
          },
          {
            label: 'Lịch sử xử lý',
            href: `/projects/${p.id}?tab=HISTORY`,
            icon: HistoryIcon,
          },
        ];
      } else if (p.status === 'IN_PROGRESS') {
        statusText = 'Đang thực hiện';
        statusColor = 'bg-sky-50 text-[#0A6EBD] border-sky-200';
        primaryAction = {
          label: 'Nộp báo cáo',
          href: `/projects/${p.id}/progress`,
          icon: Upload,
        };
        secondaryActions = [
          {
            label: 'Gia hạn / Điều chỉnh',
            href: `/projects/${p.id}/change-requests`,
            icon: GitPullRequest,
          },
          {
            label: 'Tài liệu đề tài',
            href: `/projects/${p.id}?tab=DOCUMENTS`,
            icon: FileText,
          },
        ];
      } else if (p.status === 'WAITING_ACCEPTANCE') {
        const dossierStatus = p.acceptanceDossier?.status;

        if (
          dossierStatus === 'SUBMITTED' ||
          dossierStatus === 'UNDER_ADMIN_REVIEW' ||
          dossierStatus === 'RESUBMITTED'
        ) {
          statusText = 'Chờ kiểm tra nghiệm thu';
          statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
          primaryAction = {
            label: 'Xem hồ sơ',
            href: `/projects/${p.id}/acceptance`,
            icon: Eye,
          };
        } else if (dossierStatus === 'REVISION_REQUIRED') {
          statusText = 'Cần bổ sung nghiệm thu';
          statusColor = 'bg-rose-50 text-rose-800 border-rose-200';
          isActionNeeded = true;
          primaryAction = {
            label: 'Bổ sung hồ sơ',
            href: `/projects/${p.id}/acceptance`,
            icon: Edit,
          };
        } else if (
          dossierStatus === 'ELIGIBLE_FOR_ACCEPTANCE' ||
          dossierStatus === 'FORWARDED_TO_COUNCIL'
        ) {
          statusText = 'Chờ Hội đồng nghiệm thu';
          statusColor = 'bg-sky-50 text-[#0A6EBD] border-sky-200';
          primaryAction = {
            label: 'Xem lịch Hội đồng',
            href: `/projects/${p.id}?tab=COUNCIL`,
            icon: Calendar,
          };
        } else {
          statusText = 'Chuẩn bị nghiệm thu';
          statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
          isActionNeeded = true;
          primaryAction = {
            label: 'Nộp hồ sơ',
            href: `/projects/${p.id}/acceptance`,
            icon: Upload,
          };
        }
      } else if (p.status === 'ACCEPTED') {
        statusText = 'Đã nghiệm thu';
        statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        primaryAction = {
          label: 'Xem kết quả',
          href: `/projects/${p.id}?tab=COUNCIL_MINUTES`,
          icon: Award,
        };
      } else if (p.status === 'RECOGNIZED') {
        statusText = 'Đã công nhận';
        statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        primaryAction = {
          label: 'Xem quyết định',
          href: `/projects/${p.id}?tab=DECISIONS`,
          icon: FileText,
        };
      } else if (p.status === 'CLOSED' || p.status === 'ARCHIVED') {
        statusText = p.status === 'ARCHIVED' ? 'Đã lưu trữ' : 'Đã đóng';
        statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
        primaryAction = {
          label: 'Xem hồ sơ',
          href: `/projects/${p.id}`,
          icon: Eye,
        };
      } else if (
        p.status === 'SUSPENDED' ||
        p.status === 'TERMINATED' ||
        p.status === 'REJECTED'
      ) {
        statusText =
          p.status === 'SUSPENDED'
            ? 'Tạm dừng'
            : p.status === 'TERMINATED'
              ? 'Đã chấm dứt'
              : 'Không được chấp thuận';
        statusColor = 'bg-rose-50 text-rose-800 border-rose-200';
        primaryAction = {
          label: 'Xem chi tiết',
          href: `/projects/${p.id}`,
          icon: Eye,
        };
      }

      const shortRound = p.registrationRoundName || '—';

      return {
        ...p,
        displayCode: p.projectCode || p.proposalCode || '—',
        round: shortRound,
        statusText,
        statusColor,
        primaryAction,
        secondaryActions,
        isActionNeeded,
      };
    });
  }, [rawProjects]);

  const tabCounts = useMemo(
    () => ({
      all: myProjects.length,
      action_needed: myProjects.filter((p) => p.isActionNeeded).length,
      processing: myProjects.filter(
        (p) =>
          !p.isActionNeeded &&
          !['IN_PROGRESS', 'ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(
            p.status
          )
      ).length,
      in_progress: myProjects.filter((p) => p.status === 'IN_PROGRESS').length,
      completed: myProjects.filter((p) =>
        ['ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(p.status)
      ).length,
    }),
    [myProjects]
  );

  const filteredProjects = useMemo(() => {
    return [...myProjects]
      .filter((p) => {
        if (activeTab === 'action_needed' && !p.isActionNeeded) return false;
        if (
          activeTab === 'processing' &&
          (p.isActionNeeded ||
            ['IN_PROGRESS', 'ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(
              p.status
            ))
        ) {
          return false;
        }
        if (activeTab === 'in_progress' && p.status !== 'IN_PROGRESS') return false;
        if (
          activeTab === 'completed' &&
          !['ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(p.status)
        ) {
          return false;
        }

        if (
          selectedRound !== 'ALL' &&
          p.registrationRoundId !== selectedRound
        ) {
          return false;
        }

        const q = searchTerm.trim().toLowerCase();

        if (q) {
          const haystack = [
            p.title,
            p.proposalCode,
            p.projectCode,
            p.researchField,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (!haystack.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DEADLINE') {
          const aTime = a.endDate
            ? new Date(a.endDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          const bTime = b.endDate
            ? new Date(b.endDate).getTime()
            : Number.MAX_SAFE_INTEGER;

          return aTime - bTime;
        }

        const aTime = new Date(
          a.updatedAt || a.submittedAt || a.createdAt
        ).getTime();
        const bTime = new Date(
          b.updatedAt || b.submittedAt || b.createdAt
        ).getTime();

        return bTime - aTime;
      });
  }, [myProjects, activeTab, selectedRound, searchTerm, sortBy]);

  const pagedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 text-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Đề tài của tôi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi trạng thái và thực hiện các công việc liên quan đến đề tài
            bạn phụ trách hoặc tham gia.
          </p>
        </div>

        <Link
          href="/projects/register"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0A6EBD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085896]"
        >
          <Plus className="h-4 w-4" />
          Đăng ký đề tài mới
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />

          {[
            { id: 'all', label: 'Tất cả', count: tabCounts.all },
            {
              id: 'action_needed',
              label: 'Cần tôi xử lý',
              count: tabCounts.action_needed,
            },
            {
              id: 'processing',
              label: 'Đang xử lý',
              count: tabCounts.processing,
            },
            {
              id: 'in_progress',
              label: 'Đang thực hiện',
              count: tabCounts.in_progress,
            },
            {
              id: 'completed',
              label: 'Đã hoàn thành',
              count: tabCounts.completed,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as ActiveTab);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'border-sky-200 bg-sky-50 text-[#0A6EBD]'
                  : 'border-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-slate-500">
                {tab.count}
              </span>
            </button>
          ))}

          <div className="flex-1" />

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm mã hoặc tên đề tài..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0A6EBD]"
            />
          </div>

          <select
            value={selectedRound}
            onChange={(e) => {
              setSelectedRound(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
          >
            <option value="ALL">Tất cả đợt</option>
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
          >
            <option value="NEWEST">Cập nhật mới nhất</option>
            <option value="DEADLINE">Hạn gần nhất</option>
          </select>

          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md p-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-[#0A6EBD] shadow-sm'
                  : 'text-slate-500'
              }`}
              aria-label="Dạng bảng"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0A6EBD] shadow-sm'
                  : 'text-slate-500'
              }`}
              aria-label="Dạng thẻ"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="w-36 px-5 py-3">Mã</th>
                  <th className="min-w-[300px] px-5 py-3">Đề tài</th>
                  <th className="w-44 px-5 py-3">Trạng thái</th>
                  <th className="w-36 px-5 py-3">Thời hạn</th>
                  <th className="w-20 px-5 py-3 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pagedProjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-slate-400"
                    >
                      Không có đề tài phù hợp.
                    </td>
                  </tr>
                ) : (
                  pagedProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 align-top">
                        <div className="font-mono text-xs font-semibold text-[#0A6EBD]">
                          {p.displayCode}
                        </div>
                        {p.projectCode && p.proposalCode && (
                          <div className="mt-1 font-mono text-[11px] text-slate-400">
                            ĐX: {p.proposalCode}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-semibold leading-5 text-slate-900 hover:text-[#0A6EBD]"
                        >
                          {p.title}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>{p.researchField || '—'}</span>
                          <span>•</span>
                          <span>{p.round}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${p.statusColor}`}
                        >
                          {p.statusText}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-slate-600">
                        {p.endDate ? formatDate(p.endDate) : '—'}
                      </td>

                      <td className="px-5 py-4 align-middle text-center">
                        <div
                          className="relative inline-block text-left"
                          ref={openDropdownId === p.id ? dropdownRef : undefined}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenDropdownId(
                                openDropdownId === p.id ? null : p.id
                              )
                            }
                            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
                            aria-label={`Thao tác với ${p.displayCode}`}
                            title="Thao tác"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openDropdownId === p.id && (
                            <div className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                              {[p.primaryAction, ...p.secondaryActions].map(
                                (action: ActionItem, index: number) =>
                                  action.onClick ? (
                                    <button
                                      key={`${action.label}-${index}`}
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        action.onClick?.();
                                      }}
                                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                                        action.isDestructive
                                          ? 'text-rose-600 hover:bg-rose-50'
                                          : 'text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <action.icon className="h-4 w-4 shrink-0" />
                                      {action.label}
                                    </button>
                                  ) : (
                                    <Link
                                      key={`${action.label}-${index}`}
                                      href={action.href || '#'}
                                      onClick={() => setOpenDropdownId(null)}
                                      className={`flex items-center gap-2 px-3 py-2.5 text-sm transition ${
                                        action.isDestructive
                                          ? 'text-rose-600 hover:bg-rose-50'
                                          : 'text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <action.icon className="h-4 w-4 shrink-0 text-slate-400" />
                                      {action.label}
                                    </Link>
                                  )
                              )}
                            </div>
                          )}
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

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pagedProjects.map((p) => (
            <article
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs font-semibold text-[#0A6EBD]">
                  {p.displayCode}
                </span>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${p.statusColor}`}
                >
                  {p.statusText}
                </span>
              </div>

              <Link
                href={`/projects/${p.id}`}
                className="mt-3 block text-sm font-semibold leading-5 text-slate-900 hover:text-[#0A6EBD]"
              >
                {p.title}
              </Link>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="text-xs text-slate-500">
                  Thời hạn:{' '}
                  <span className="font-medium text-slate-700">
                    {p.endDate ? formatDate(p.endDate) : '—'}
                  </span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdownId(openDropdownId === p.id ? null : p.id)
                    }
                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
                    aria-label={`Thao tác với ${p.displayCode}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openDropdownId === p.id && (
                    <div className="absolute bottom-10 right-0 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                      {[p.primaryAction, ...p.secondaryActions].map(
                        (action: ActionItem, index: number) =>
                          action.onClick ? (
                            <button
                              key={`${action.label}-${index}`}
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                action.onClick?.();
                              }}
                              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                                action.isDestructive
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <action.icon className="h-4 w-4 shrink-0" />
                              {action.label}
                            </button>
                          ) : (
                            <Link
                              key={`${action.label}-${index}`}
                              href={action.href || '#'}
                              onClick={() => setOpenDropdownId(null)}
                              className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                            >
                              <action.icon className="h-4 w-4 shrink-0 text-slate-400" />
                              {action.label}
                            </Link>
                          )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

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

      <SubmitOutlineModal
        isOpen={!!outlineSubmissionProject}
        projectId={outlineSubmissionProject?.id ?? ''}
        displayCode={
          outlineSubmissionProject?.projectCode ||
          outlineSubmissionProject?.proposalCode ||
          ''
        }
        onClose={() => setOutlineSubmissionProject(null)}
        onSubmit={handleSubmitOutline}
      />
    </div>
  );
}