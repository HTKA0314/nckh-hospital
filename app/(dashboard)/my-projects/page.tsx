'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Edit,
  Eye,
  FileText,
  Filter,
  GitPullRequest,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Printer,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { ResearchProject } from '@/lib/types';
import {
  SubmitOutlineModal,
  type SubmitOutlinePayload,
} from './SubmitOutlineModal';

type ActiveTab =
  | 'all'
  | 'action_needed'
  | 'processing'
  | 'in_progress'
  | 'completed';

type ViewMode = 'table' | 'grid';
type SortBy = 'NEWEST' | 'DEADLINE';

type ProjectRow = ResearchProject & {
  displayCode: string;
  roundLabel: string;
  displayStatus: string;
  displayStatusType: 'PROJECT' | 'PROPOSAL';
  isActionNeeded: boolean;
  nextStepText: string;
  registrationDate: string;
  executionPeriod: string;
};

function monthToStartDate(month: string) {
  return `${month}-01`;
}

function monthToEndDate(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, '0')}`;
}

function getDisplayStatus(project: ResearchProject) {
  const isProposalStage =
    project.status === 'DRAFT' || project.status === 'SUBMITTED';

  return {
    status: isProposalStage ? project.proposalStatus : project.status,
    type: isProposalStage ? ('PROPOSAL' as const) : ('PROJECT' as const),
  };
}

function getNextStepText(project: ResearchProject, isPI: boolean): string {
  if (!isPI) return 'Theo dõi và phối hợp thực hiện';

  if (project.status === 'DRAFT' && project.proposalStatus === 'DRAFT') {
    return 'Hoàn thiện hồ sơ đăng ký';
  }

  switch (project.proposalStatus) {
    case 'SUBMITTED':
      return 'Chờ Phòng NCKH tiếp nhận';
    case 'UNDER_ADMIN_REVIEW':
      return 'Phòng NCKH đang kiểm tra hồ sơ';
    case 'REVISION_REQUIRED':
      return 'Bổ sung hồ sơ theo yêu cầu';
    case 'RESUBMITTED':
      return 'Chờ kiểm tra lại hồ sơ';
    case 'ADMIN_VALIDATED':
      return 'Đính kèm và nộp đề cương';
    case 'OUTLINE_SUBMITTED':
      return 'Chờ tổ chức xét duyệt đề cương';
    case 'UNDER_PROPOSAL_REVIEW':
      return 'Hội đồng đang xét duyệt đề cương';
    case 'PROPOSAL_REVISION_REQUIRED':
      return 'Chỉnh sửa đề cương theo kết luận Hội đồng';
    case 'PROPOSAL_RESUBMITTED':
      return 'Chờ tiếp nhận bản đề cương chỉnh sửa';
    case 'UNDER_PROPOSAL_REVISION_REVIEW':
      return 'Đang xét lại đề cương';
    case 'PROPOSAL_APPROVED':
      break;
  }

  if (project.ethicsStatus === 'ETHICS_REVISION_REQUIRED') {
    return 'Bổ sung hồ sơ đạo đức';
  }

  switch (project.status) {
    case 'WAITING_ASSIGNMENT':
      return 'Chờ quyết định giao thực hiện';
    case 'IN_PROGRESS':
      return project.acceptanceDossier
        ? 'Tiếp tục thực hiện và báo cáo tiến độ'
        : 'Thực hiện đề tài; có thể lập hồ sơ nghiệm thu khi đủ điều kiện';
    case 'WAITING_ACCEPTANCE':
      if (project.acceptanceDossier?.status === 'REVISION_REQUIRED') {
        return 'Bổ sung hồ sơ nghiệm thu';
      }
      if (project.acceptanceDossier?.status === 'FORWARDED_TO_COUNCIL') {
        return 'Chờ Hội đồng nghiệm thu';
      }
      return 'Theo dõi xử lý hồ sơ nghiệm thu';
    case 'ACCEPTED':
      return 'Chờ quyết định công nhận kết quả';
    case 'RECOGNIZED':
      return 'Kết quả đã được công nhận';
    case 'CLOSED':
      return 'Hồ sơ đã đóng';
    case 'ARCHIVED':
      return 'Hồ sơ đã lưu trữ';
    case 'SUSPENDED':
      return 'Đề tài đang tạm dừng';
    case 'TERMINATED':
      return 'Đề tài đã chấm dứt';
    case 'REJECTED':
      return 'Đề tài không được tiếp tục';
    default:
      return 'Theo dõi tiến trình xử lý';
  }
}

function isActionRequired(project: ResearchProject, isPI: boolean): boolean {
  if (!isPI) return false;

  if (project.status === 'DRAFT' && project.proposalStatus === 'DRAFT') {
    return true;
  }

  if (
    project.proposalStatus === 'REVISION_REQUIRED' ||
    project.proposalStatus === 'ADMIN_VALIDATED' ||
    project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED' ||
    project.ethicsStatus === 'ETHICS_REVISION_REQUIRED'
  ) {
    return true;
  }

  if (
    project.status === 'WAITING_ACCEPTANCE' &&
    project.acceptanceDossier?.status === 'REVISION_REQUIRED'
  ) {
    return true;
  }

  return false;
}

function PrimaryAction({
  project,
  isPI,
  onUploadOutline,
}: {
  project: ResearchProject;
  isPI: boolean;
  onUploadOutline: () => void;
}) {
  if (!isPI) return null;

  if (project.status === 'DRAFT' && project.proposalStatus === 'DRAFT') {
    return (
      <Link
        href={`/projects/register?draftId=${project.id}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-[#0A6EBD] transition hover:bg-sky-100"
        title="Chỉnh sửa hồ sơ"
        aria-label="Chỉnh sửa hồ sơ"
      >
        <Edit className="h-4 w-4" />
      </Link>
    );
  }

  if (project.proposalStatus === 'REVISION_REQUIRED') {
    return (
      <Link
        href={`/projects/${project.id}/resubmit`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
        title="Bổ sung hồ sơ"
        aria-label="Bổ sung hồ sơ"
      >
        <Edit className="h-4 w-4" />
      </Link>
    );
  }

  if (project.proposalStatus === 'ADMIN_VALIDATED') {
    return (
      <button
        type="button"
        onClick={onUploadOutline}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-[#0A6EBD] transition hover:bg-sky-100"
        title="Đính kèm / nộp đề cương"
        aria-label="Đính kèm / nộp đề cương"
      >
        <Upload className="h-4 w-4" />
      </button>
    );
  }

  if (project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
    return (
      <Link
        href={`/projects/${project.id}/resubmit`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
        title="Chỉnh sửa đề cương theo Hội đồng"
        aria-label="Chỉnh sửa đề cương theo Hội đồng"
      >
        <Edit className="h-4 w-4" />
      </Link>
    );
  }

  if (project.ethicsStatus === 'ETHICS_REVISION_REQUIRED') {
    return (
      <Link
        href={`/projects/${project.id}/ethics`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
        title="Bổ sung hồ sơ đạo đức"
        aria-label="Bổ sung hồ sơ đạo đức"
      >
        <FileText className="h-4 w-4" />
      </Link>
    );
  }

  if (
    project.status === 'WAITING_ACCEPTANCE' &&
    project.acceptanceDossier?.status === 'REVISION_REQUIRED'
  ) {
    return (
      <Link
        href={`/projects/${project.id}/acceptance`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
        title="Bổ sung hồ sơ nghiệm thu"
        aria-label="Bổ sung hồ sơ nghiệm thu"
      >
        <Edit className="h-4 w-4" />
      </Link>
    );
  }

  if (project.status === 'IN_PROGRESS') {
    return (
      <Link
        href={`/projects/${project.id}/progress`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
        title="Báo cáo tiến độ"
        aria-label="Báo cáo tiến độ"
      >
        <TrendingUp className="h-4 w-4" />
      </Link>
    );
  }

  return null;
}

function MoreActions({
  project,
  isPI,
  isOpen,
  onToggle,
  onClose,
  onDelete,
}: {
  project: ResearchProject;
  isPI: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
        title="Thao tác khác"
        aria-label="Thao tác khác"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-9 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 text-left shadow-xl">
          <Link
            href={`/projects/${project.id}`}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4 text-slate-400" />
            Xem chi tiết hồ sơ
          </Link>

          {isPI && ['IN_PROGRESS', 'SUSPENDED'].includes(project.status) && (
            <Link
              href={`/projects/${project.id}/change-requests`}
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <GitPullRequest className="h-4 w-4 text-slate-400" />
              Gia hạn / Điều chỉnh
            </Link>
          )}

          {isPI &&
            project.status === 'IN_PROGRESS' &&
            (!project.acceptanceDossier ||
              project.acceptanceDossier.status === 'NOT_SUBMITTED' ||
              project.acceptanceDossier.status === 'DRAFT') && (
              <Link
                href={`/projects/${project.id}/acceptance`}
                onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                {project.acceptanceDossier?.status === 'DRAFT'
                  ? 'Tiếp tục hồ sơ nghiệm thu'
                  : 'Lập hồ sơ nghiệm thu'}
              </Link>
            )}

          {isPI &&
            project.status === 'DRAFT' &&
            project.proposalStatus === 'DRAFT' && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa bản nháp
                </button>
              </>
            )}
        </div>
      )}
    </div>
  );
}

export default function MyProjectsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { success, error, confirm } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRound, setSelectedRound] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataVersion, setDataVersion] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [outlineProject, setOutlineProject] = useState<ResearchProject | null>(
    null
  );

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  const rounds = useMemo(() => repo.getRounds(), [dataVersion]);

  const rawProjects = useMemo(
    () =>
      repo.getProjects().filter(
        (project) =>
          project.principalInvestigatorId === currentUser.id ||
          project.members?.some(
            (member) => member.userId === currentUser.id
          )
      ),
    [currentUser.id, dataVersion]
  );

  const rows = useMemo<ProjectRow[]>(() => {
    return rawProjects.map((project) => {
      const isPI =
        currentUser.role === 'RESEARCHER' &&
        project.principalInvestigatorId === currentUser.id;

      const { status, type } = getDisplayStatus(project);

      let roundLabel = project.registrationRoundName || '—';
      roundLabel = roundLabel
        .replace(/Đợt đăng ký Đề tài NCKH Cấp cơ sở\s*/gi, '')
        .replace(/Kế hoạch đăng ký đề tài NCKH\s*/gi, '')
        .trim();

      const registrationDate = formatDate(
        project.submittedAt || project.createdAt
      );

      const executionPeriod =
        project.startDate && project.endDate
          ? `${formatDate(project.startDate)} – ${formatDate(
              project.endDate
            )}`
          : '—';

      return {
        ...project,
        displayCode:
          project.projectCode || project.proposalCode || '—',
        roundLabel,
        displayStatus: String(status || ''),
        displayStatusType: type,
        isActionNeeded: isActionRequired(project, isPI),
        nextStepText: getNextStepText(project, isPI),
        registrationDate,
        executionPeriod,
      };
    });
  }, [rawProjects, currentUser.id, currentUser.role]);

  const tabCounts = useMemo(
    () => ({
      all: rows.length,
      action_needed: rows.filter((row) => row.isActionNeeded).length,
      processing: rows.filter(
        (row) =>
          row.status === 'SUBMITTED' ||
          row.status === 'WAITING_ASSIGNMENT' ||
          row.status === 'WAITING_ACCEPTANCE'
      ).length,
      in_progress: rows.filter(
        (row) => row.status === 'IN_PROGRESS'
      ).length,
      completed: rows.filter((row) =>
        ['RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(row.status)
      ).length,
    }),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return [...rows]
      .filter((project) => {
        if (activeTab === 'action_needed' && !project.isActionNeeded) {
          return false;
        }

        if (
          activeTab === 'processing' &&
          ![
            'SUBMITTED',
            'WAITING_ASSIGNMENT',
            'WAITING_ACCEPTANCE',
          ].includes(project.status)
        ) {
          return false;
        }

        if (
          activeTab === 'in_progress' &&
          project.status !== 'IN_PROGRESS'
        ) {
          return false;
        }

        if (
          activeTab === 'completed' &&
          !['RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(project.status)
        ) {
          return false;
        }

        if (
          selectedRound !== 'ALL' &&
          project.registrationRoundId !== selectedRound
        ) {
          return false;
        }

        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;

        return [
          project.proposalCode,
          project.projectCode,
          project.title,
          project.principalInvestigatorName,
          project.researchField,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
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

        return (
          new Date(
            b.updatedAt || b.submittedAt || b.createdAt
          ).getTime() -
          new Date(
            a.updatedAt || a.submittedAt || a.createdAt
          ).getTime()
        );
      });
  }, [rows, activeTab, selectedRound, searchTerm, sortBy]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const deleteDraft = (project: ResearchProject) => {
    confirm({
      title: 'Xóa bản nháp',
      message: `Xóa bản nháp "${project.title}"?`,
      confirmLabel: 'Xóa',
      type: 'danger',
      onConfirm: () => {
        if (!repo.deleteProject(project.id)) {
          error('Không thể xóa bản nháp.');
          return;
        }

        success('Đã xóa bản nháp.');
        setDataVersion((value) => value + 1);
      },
    });
  };

  const submitOutline = async (payload: SubmitOutlinePayload) => {
    const project = repo.getProjectById(payload.projectId);
    if (!project) throw new Error('PROJECT_NOT_FOUND');

    if (
      currentUser.role !== 'RESEARCHER' ||
      currentUser.id !== project.principalInvestigatorId ||
      project.proposalStatus !== 'ADMIN_VALIDATED'
    ) {
      throw new Error('OUTLINE_SUBMISSION_NOT_ALLOWED');
    }

    const now = new Date().toISOString();
    const existingDocument = project.documents?.find(
      (document) => document.documentType === 'DETAILED_OUTLINE'
    );

    if (existingDocument) {
      repo.addDocumentVersion(project.id, existingDocument.id, {
        id: `${existingDocument.id}-v-${Date.now()}`,
        documentId: existingDocument.id,
        version: existingDocument.currentVersion + 1,
        fileName: payload.file.name,
        fileSize: `${(
          payload.file.size /
          1024 /
          1024
        ).toFixed(2)} MB`,
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.fullName,
        uploadedAt: now,
        downloadUrl: '',
        isCurrent: true,
      });
    } else {
      const documentId = `outline-${project.id}-${Date.now()}`;
      const versionId = `${documentId}-v1`;

      repo.addProjectDocument(project.id, {
        id: documentId,
        projectId: project.id,
        documentType: 'DETAILED_OUTLINE',
        title: 'Thuyết minh đề cương chi tiết',
        currentVersion: 1,
        currentVersionId: versionId,
        versions: [
          {
            id: versionId,
            documentId,
            version: 1,
            fileName: payload.file.name,
            fileSize: `${(
              payload.file.size /
              1024 /
              1024
            ).toFixed(2)} MB`,
            uploadedBy: currentUser.id,
            uploadedByName: currentUser.fullName,
            uploadedAt: now,
            downloadUrl: '',
            isCurrent: true,
          },
        ],
      });
    }

    const updated = repo.updateProject(project.id, {
      proposalStatus: 'OUTLINE_SUBMITTED',
      startDate: monthToStartDate(payload.fromMonth),
      endDate: monthToEndDate(payload.toMonth),
      updatedAt: now,
    });

    if (!updated) throw new Error('UPDATE_PROJECT_FAILED');

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      entityType: 'PROJECT',
      entityId: project.id,
      actionCode: 'SUBMIT_OUTLINE',
      fromStatus: 'ADMIN_VALIDATED',
      toStatus: 'OUTLINE_SUBMITTED',
      notes: `Nộp Thuyết minh đề cương chi tiết: ${payload.file.name}.`,
    });

    success('Đã nộp đề cương.');
    setOutlineProject(null);
    setDataVersion((value) => value + 1);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 pb-10 text-xs text-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            Đề tài của tôi
          </h1>
          <p className="mt-0.5 text-slate-500">
            Theo dõi trạng thái và thực hiện đúng tác vụ tại từng giai đoạn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            In danh sách
          </button>

          {currentUser.role === 'RESEARCHER' && (
            <Link
              href="/projects/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-1.5 font-bold text-white hover:bg-[#085896]"
            >
              <Plus className="h-4 w-4" />
              Đăng ký đề tài
            </Link>
          )}
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-3 py-2">
          <Filter className="mr-1 h-4 w-4 text-slate-400" />

          {[
            { id: 'all', label: 'Tất cả', count: tabCounts.all },
            {
              id: 'action_needed',
              label: 'Cần xử lý',
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
              label: 'Hoàn thành',
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
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition ${
                activeTab === tab.id
                  ? 'border-sky-200 bg-sky-50 text-[#0A6EBD]'
                  : 'border-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              <span className="rounded-full bg-white px-1.5 py-0.5 font-mono text-[10px]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm mã đề tài, tên đề tài..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-8 outline-none focus:border-[#0A6EBD]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedRound}
            onChange={(event) => {
              setSelectedRound(event.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium outline-none"
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
            onChange={(event) =>
              setSortBy(event.target.value as SortBy)
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium outline-none"
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
                  ? 'bg-white text-[#0A6EBD] shadow-2xs'
                  : 'text-slate-500'
              }`}
              title="Dạng bảng"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0A6EBD] shadow-2xs'
                  : 'text-slate-500'
              }`}
              title="Dạng thẻ"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {viewMode === 'table' && (
        <section className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#0B2A63] text-[11px] font-bold uppercase tracking-wide text-white">
                <tr>
                  <th className="w-32 px-4 py-3">Mã đề xuất</th>
                  <th className="w-32 px-4 py-3">Mã đề tài</th>
                  <th className="min-w-[320px] px-4 py-3">Tên đề tài</th>
                  <th className="min-w-[180px] px-4 py-3">Chủ nhiệm</th>
                  <th className="w-32 px-4 py-3 text-center">Ngày đăng ký</th>
                  <th className="w-24 px-4 py-3 text-center">Gia hạn</th>
                  <th className="w-24 px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      Không có đề tài phù hợp.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((project) => {
                    const isPI =
                      currentUser.role === 'RESEARCHER' &&
                      currentUser.id ===
                        project.principalInvestigatorId;

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3 align-top font-mono font-bold text-slate-600">
                          {project.proposalCode || '—'}
                        </td>

                        <td className="px-4 py-3 align-top font-mono font-bold text-[#0A6EBD]">
                          {project.projectCode ? (
                            <Link href={`/projects/${project.id}`} className="hover:underline">
                              {project.projectCode}
                            </Link>
                          ) : (
                            <span className="font-normal text-slate-300">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-top">
                          <Link
                            href={`/projects/${project.id}`}
                            className="line-clamp-2 font-semibold leading-snug text-slate-900 hover:text-[#0A6EBD]"
                            title={project.title}
                          >
                            {project.title}
                          </Link>
                        </td>

                        <td className="px-4 py-3 align-top text-[11px] font-semibold text-slate-700">
                          {project.principalInvestigatorName}
                        </td>

                        <td className="px-4 py-3 text-center align-top font-mono text-[11px] text-slate-500">
                          {project.registrationDate}
                        </td>

                        <td className="px-4 py-3 text-center align-top">
                          {project.changeRequests?.filter(
                            (request) =>
                              request.type === 'EXTENSION' &&
                              request.status === 'APPROVED'
                          ).length ? (
                            <span className="inline-flex min-w-6 justify-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-700">
                              {
                                project.changeRequests.filter(
                                  (request) =>
                                    request.type === 'EXTENSION' &&
                                    request.status === 'APPROVED'
                                ).length
                              }
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] text-slate-400">0</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center align-top">
                          <div
                            className="inline-flex items-center gap-1.5"
                            ref={openMenuId === project.id ? menuRef : null}
                          >
                            <PrimaryAction
                              project={project}
                              isPI={isPI}
                              onUploadOutline={() => setOutlineProject(project)}
                            />
                            <MoreActions
                              project={project}
                              isPI={isPI}
                              isOpen={openMenuId === project.id}
                              onToggle={() =>
                                setOpenMenuId(
                                  openMenuId === project.id ? null : project.id
                                )
                              }
                              onClose={() => setOpenMenuId(null)}
                              onDelete={() => deleteDraft(project)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {viewMode === 'grid' && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pagedRows.map((project) => {
            const isPI =
              currentUser.role === 'RESEARCHER' &&
              currentUser.id === project.principalInvestigatorId;

            return (
              <article
                key={project.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-mono text-[11px] font-bold text-[#0A6EBD] hover:underline"
                    >
                      {project.displayCode}
                    </Link>
                    <Link
                      href={`/projects/${project.id}`}
                      className="mt-1.5 block font-bold leading-snug text-slate-900 hover:text-[#0A6EBD]"
                    >
                      {project.title}
                    </Link>
                  </div>

                  <StatusBadge
                    status={project.displayStatus}
                    type={project.displayStatusType}
                  />
                </div>

                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Bước tiếp theo
                  </p>
                  <p className="mt-1 font-medium text-slate-700">
                    {project.nextStepText}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="text-[11px] text-slate-500">
                    <span>{project.roundLabel}</span>
                    {project.executionPeriod !== '—' && (
                      <span> · {project.executionPeriod}</span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1.5"
                    ref={
                      openMenuId === project.id ? menuRef : null
                    }
                  >
                    <PrimaryAction
                      project={project}
                      isPI={isPI}
                      onUploadOutline={() =>
                        setOutlineProject(project)
                      }
                    />
                    <MoreActions
                      project={project}
                      isPI={isPI}
                      isOpen={openMenuId === project.id}
                      onToggle={() =>
                        setOpenMenuId(
                          openMenuId === project.id
                            ? null
                            : project.id
                        )
                      }
                      onClose={() => setOpenMenuId(null)}
                      onDelete={() => deleteDraft(project)}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <Pagination
        currentPage={currentPage}
        totalItems={filteredRows.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="đề tài"
      />

      <SubmitOutlineModal
        isOpen={Boolean(outlineProject)}
        projectId={outlineProject?.id ?? ''}
        displayCode={
          outlineProject?.projectCode ||
          outlineProject?.proposalCode ||
          ''
        }
        defaultFromMonth={
          outlineProject?.startDate?.slice(0, 7) ?? ''
        }
        defaultToMonth={outlineProject?.endDate?.slice(0, 7) ?? ''}
        onClose={() => setOutlineProject(null)}
        onSubmit={submitOutline}
      />
    </div>
  );
}