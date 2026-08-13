'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Calendar,
  Eye,
  Filter,
  MapPin,
  MoreVertical,
  PenTool,
  Plus,
  Search,
  Video,
  X,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import {
  Council,
  CouncilMember,
  CouncilProjectAssignment,
  CouncilRole,
  CouncilType,
  ResearchProject,
  User,
} from '@/lib/types';

type CouncilFilter = 'ALL' | CouncilType;
type ModalStep = 1 | 2 | 3;

type ReviewerAssignmentDraft = {
  reviewerId: string;
  reviewerName: string;
  reviewerOrder: number;
};

type ProjectAssignmentDraft = {
  reviewerAssignments: ReviewerAssignmentDraft[];
  notes: string;
};

type CouncilForm = {
  code: string;
  name: string;
  type: CouncilType;
  specialtyCluster: string;
  establishmentDecisionNumber: string;
  decisionDate: string;
  decisionStatus: 'DRAFT' | 'SUBMITTED' | 'ISSUED';
  signatoryName: string;
  signatoryRole: string;
  meetingDate: string;
  meetingTime: string;
  meetingFormat: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  location: string;
  onlineMeetingUrl: string;
  sendInvitationNotification: boolean;
  chairId: string;
  secretaryId: string;
  memberIds: string[];
  selectedProjectIds: string[];
  projectAssignments: Record<string, ProjectAssignmentDraft>;
};

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0A6EBD] focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500';

const SPECIALTY_CLUSTERS = [
  'Đa chuyên khoa / Toàn viện',
  'Khối Tim mạch & Hồi sức cấp cứu',
  'Khối Ngoại khoa - Phẫu thuật - Sản khoa',
  'Khối Ung bướu & Xạ trị',
  'Khối Dược lâm sàng & Cận lâm sàng',
  'Khối Điều dưỡng & Y tế công cộng',
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyForm(councilCount: number): CouncilForm {
  return {
    code: `HD-${new Date().getFullYear()}-${String(councilCount + 1).padStart(3, '0')}`,
    name: '',
    type: 'PROPOSAL_REVIEW',
    specialtyCluster: SPECIALTY_CLUSTERS[0],
    establishmentDecisionNumber: '',
    decisionDate: getToday(),
    decisionStatus: 'DRAFT',
    signatoryName: '',
    signatoryRole: 'Giám đốc Bệnh viện',
    meetingDate: getToday(),
    meetingTime: '08:30',
    meetingFormat: 'OFFLINE',
    location: '',
    onlineMeetingUrl: '',
    sendInvitationNotification: true,
    chairId: '',
    secretaryId: '',
    memberIds: [],
    selectedProjectIds: [],
    projectAssignments: {},
  };
}

function CouncilsContent() {
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();
  const searchParams = useSearchParams();

  const queryType = searchParams.get('type');
  const initialFilter: CouncilFilter =
    queryType === 'PROPOSAL_REVIEW' || queryType === 'ACCEPTANCE'
      ? queryType
      : 'ALL';

  const [councils, setCouncils] = useState<Council[]>(repo.getCouncils());
  const [filterType, setFilterType] = useState<CouncilFilter>(initialFilter);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>(1);
  const [editingCouncilId, setEditingCouncilId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CouncilForm>(() =>
    createEmptyForm(councils.length)
  );

  const canManageCouncil = currentUser.role === 'RESEARCH_OFFICE';
  const canIssueEstablishmentDecision = currentUser.role === 'DIRECTOR';

  const candidateUsers = useMemo(
    () =>
      repo
        .getUsers()
        .filter((user) =>
          ['DIRECTOR', 'COUNCIL_MEMBER', 'RESEARCHER', 'RESEARCH_OFFICE', 'ETHICS_OFFICE'].includes(
            user.role
          )
        ),
    []
  );

  const projects = repo.getProjects();

  const availableProjects = useMemo(() => {
    const alreadyAssignedToOtherCouncil = new Set(
      councils
        .filter((council) => council.id !== editingCouncilId && council.type === formData.type)
        .flatMap((council) => council.projectIds)
    );

    return projects.filter((project) => {
      if (alreadyAssignedToOtherCouncil.has(project.id)) return false;

      if (formData.type === 'PROPOSAL_REVIEW') {
        return (
          project.status === 'SUBMITTED' &&
          (project.proposalStatus === 'OUTLINE_SUBMITTED' ||
            project.proposalStatus === 'UNDER_PROPOSAL_REVIEW')
        );
      }

      return (
        project.status === 'WAITING_ACCEPTANCE' &&
        (project.acceptanceDossier?.status === 'ELIGIBLE_FOR_ACCEPTANCE' ||
          project.acceptanceDossier?.status === 'FORWARDED_TO_COUNCIL')
      );
    });
  }, [councils, editingCouncilId, formData.type, projects]);

  const selectedProjects = useMemo(
    () =>
      formData.selectedProjectIds
        .map((id) => repo.getProjectById(id))
        .filter((project): project is ResearchProject => Boolean(project)),
    [formData.selectedProjectIds]
  );

  const councilRules = useMemo(() => {
    const policies = selectedProjects
      .map((project) => repo.getPolicyById(project.workflowPolicyId))
      .filter(Boolean);

    const minMembers = Math.max(
      3,
      ...policies.map((policy) => policy?.councilPolicy?.minMembers ?? 3)
    );

    const maxMembersCandidates = policies
      .map((policy) => policy?.councilPolicy?.maxMembers)
      .filter((value): value is number => typeof value === 'number');

    const maxMembers =
      maxMembersCandidates.length > 0 ? Math.min(...maxMembersCandidates) : undefined;

    const requiredReviewerCount = Math.max(
      1,
      ...policies.map((policy) => policy?.councilPolicy?.requiredReviewerCount ?? 1)
    );

    const minPassRatio = Math.max(
      0.5,
      ...policies.map((policy) => policy?.councilPolicy?.minPassRatio ?? 0.5)
    );

    return { minMembers, maxMembers, requiredReviewerCount, minPassRatio };
  }, [selectedProjects]);

  const selectedCouncilUserIds = [
    formData.chairId,
    formData.secretaryId,
    ...formData.memberIds,
  ].filter(Boolean);

  const totalMembersCount = new Set(selectedCouncilUserIds).size;
  const hasDuplicateCouncilMember = selectedCouncilUserIds.length !== totalMembersCount;

  const filteredCouncils = useMemo(() => {
    const q = search.trim().toLowerCase();

    return councils.filter((council) => {
      if (filterType !== 'ALL' && council.type !== filterType) return false;
      if (!q) return true;

      return [
        council.code,
        council.name,
        council.establishmentDecisionNumber,
        council.specialtyCluster,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [councils, filterType, search]);

  const pagedCouncils = filteredCouncils.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getUser = (id: string) => candidateUsers.find((user) => user.id === id);

  const getReviewerCountForProject = (project: ResearchProject) => {
    const policy = repo.getPolicyById(project.workflowPolicyId);
    return policy?.councilPolicy?.requiredReviewerCount ?? councilRules.requiredReviewerCount;
  };

  const makeReviewerDraft = (
    project: ResearchProject,
    order: number,
    excludedIds: string[] = []
  ): ReviewerAssignmentDraft => {
    const candidate = candidateUsers.find(
      (user) =>
        !excludedIds.includes(user.id) &&
        !hasConflictOfInterest(project, user.id)
    );

    return {
      reviewerId: candidate?.id ?? '',
      reviewerName: candidate?.fullName ?? '',
      reviewerOrder: order,
    };
  };

  const resetModal = () => {
    setShowCreateModal(false);
    setEditingCouncilId(null);
    setModalStep(1);
    setFormData(createEmptyForm(councils.length));
  };

  const openCreateModal = () => {
    if (!canManageCouncil) return;
    setEditingCouncilId(null);
    setModalStep(1);
    setFormData(createEmptyForm(councils.length));
    setShowCreateModal(true);
  };

  const openEditCouncil = (council: Council) => {
    if (!canManageCouncil && !canIssueEstablishmentDecision) return;

    const chair = council.members.find((member) => member.roleInCouncil === 'CHỦ_TỊCH');
    const secretary = council.members.find((member) => member.roleInCouncil === 'THƯ_KÝ');
    const otherMembers = council.members.filter(
      (member) => member.roleInCouncil !== 'CHỦ_TỊCH' && member.roleInCouncil !== 'THƯ_KÝ'
    );

    const assignments = Object.fromEntries(
      (council.projectAssignments ?? []).map((assignment) => [
        assignment.projectId,
        {
          reviewerAssignments: [...(assignment.reviewerAssignments ?? [])].sort(
            (a, b) => a.reviewerOrder - b.reviewerOrder
          ),
          notes: assignment.notes ?? '',
        },
      ])
    ) as Record<string, ProjectAssignmentDraft>;

    setEditingCouncilId(council.id);
    setFormData({
      code: council.code,
      name: council.name,
      type: council.type,
      specialtyCluster: council.specialtyCluster ?? SPECIALTY_CLUSTERS[0],
      establishmentDecisionNumber: council.establishmentDecisionNumber ?? '',
      decisionDate: council.decisionDate ?? getToday(),
      decisionStatus: council.decisionStatus ?? 'DRAFT',
      signatoryName: council.signatoryName ?? '',
      signatoryRole: council.signatoryRole ?? 'Giám đốc Bệnh viện',
      meetingDate: council.meetingDate,
      meetingTime: council.meetingTime ?? '08:30',
      meetingFormat: council.meetingFormat ?? 'OFFLINE',
      location: council.location,
      onlineMeetingUrl: council.onlineMeetingUrl ?? '',
      sendInvitationNotification: council.sendInvitationNotification ?? true,
      chairId: chair?.userId ?? '',
      secretaryId: secretary?.userId ?? '',
      memberIds: otherMembers.map((member) => member.userId),
      selectedProjectIds: [...council.projectIds],
      projectAssignments: assignments,
    });
    setModalStep(1);
    setShowCreateModal(true);
  };

  const handleCouncilTypeChange = (type: CouncilType) => {
    setFormData((current) => ({
      ...current,
      type,
      selectedProjectIds: [],
      projectAssignments: {},
      name:
        type === 'PROPOSAL_REVIEW'
          ? 'Hội đồng xét duyệt đề cương NCKH'
          : 'Hội đồng nghiệm thu đề tài NCKH',
    }));
  };

  const toggleProject = (project: ResearchProject) => {
    const selected = formData.selectedProjectIds.includes(project.id);

    if (selected) {
      const nextAssignments = { ...formData.projectAssignments };
      delete nextAssignments[project.id];

      setFormData((current) => ({
        ...current,
        selectedProjectIds: current.selectedProjectIds.filter((id) => id !== project.id),
        projectAssignments: nextAssignments,
      }));
      return;
    }

    const reviewerCount = getReviewerCountForProject(project);
    const reviewerAssignments: ReviewerAssignmentDraft[] = [];

    for (let index = 0; index < reviewerCount; index += 1) {
      reviewerAssignments.push(
        makeReviewerDraft(
          project,
          index + 1,
          reviewerAssignments.map((item) => item.reviewerId).filter(Boolean)
        )
      );
    }

    setFormData((current) => ({
      ...current,
      selectedProjectIds: [...current.selectedProjectIds, project.id],
      projectAssignments: {
        ...current.projectAssignments,
        [project.id]: {
          reviewerAssignments,
          notes: '',
        },
      },
    }));
  };

  const updateReviewer = (projectId: string, reviewerOrder: number, reviewerId: string) => {
    const user = getUser(reviewerId);

    setFormData((current) => {
      const assignment = current.projectAssignments[projectId];
      if (!assignment) return current;

      return {
        ...current,
        projectAssignments: {
          ...current.projectAssignments,
          [projectId]: {
            ...assignment,
            reviewerAssignments: assignment.reviewerAssignments.map((reviewer) =>
              reviewer.reviewerOrder === reviewerOrder
                ? {
                    ...reviewer,
                    reviewerId,
                    reviewerName: user?.fullName ?? '',
                  }
                : reviewer
            ),
          },
        },
      };
    });
  };

  const updateAssignmentNotes = (projectId: string, notes: string) => {
    setFormData((current) => {
      const assignment = current.projectAssignments[projectId];
      if (!assignment) return current;

      return {
        ...current,
        projectAssignments: {
          ...current.projectAssignments,
          [projectId]: { ...assignment, notes },
        },
      };
    });
  };

  const hasAnyConflict = formData.selectedProjectIds.some((projectId) => {
    const project = repo.getProjectById(projectId);
    const assignment = formData.projectAssignments[projectId];

    if (!project || !assignment) return false;

    return assignment.reviewerAssignments.some((reviewer) =>
      hasConflictOfInterest(project, reviewer.reviewerId)
    );
  });

  const validateCouncil = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      warning('Vui lòng nhập mã và tên Hội đồng.');
      return false;
    }

    if (!formData.chairId || !formData.secretaryId) {
      warning('Vui lòng chọn Chủ tịch và Thư ký Hội đồng.');
      return false;
    }

    if (hasDuplicateCouncilMember) {
      warning('Một người không thể giữ nhiều vị trí thành viên trong cùng Hội đồng.');
      return false;
    }

    if (totalMembersCount < councilRules.minMembers) {
      warning(`Hội đồng cần tối thiểu ${councilRules.minMembers} thành viên theo cấu hình áp dụng.`);
      return false;
    }

    if (councilRules.maxMembers && totalMembersCount > councilRules.maxMembers) {
      warning(`Hội đồng không được vượt quá ${councilRules.maxMembers} thành viên theo cấu hình áp dụng.`);
      return false;
    }

    if (formData.selectedProjectIds.length === 0) {
      warning('Vui lòng chọn ít nhất một đề tài.');
      return false;
    }

    for (const projectId of formData.selectedProjectIds) {
      const project = repo.getProjectById(projectId);
      const assignment = formData.projectAssignments[projectId];

      if (!project || !assignment) {
        warning('Thiếu thông tin phân công phản biện cho một đề tài.');
        return false;
      }

      const requiredCount = getReviewerCountForProject(project);
      const reviewers = assignment.reviewerAssignments.filter((reviewer) => reviewer.reviewerId);

      if (reviewers.length < requiredCount) {
        warning(`Đề tài ${project.projectCode || project.proposalCode} chưa đủ ${requiredCount} phản biện.`);
        return false;
      }

      if (new Set(reviewers.map((reviewer) => reviewer.reviewerId)).size !== reviewers.length) {
        warning(`Đề tài ${project.projectCode || project.proposalCode} đang phân công trùng phản biện.`);
        return false;
      }

      if (reviewers.some((reviewer) => hasConflictOfInterest(project, reviewer.reviewerId))) {
        warning(`Đề tài ${project.projectCode || project.proposalCode} có phản biện xung đột lợi ích.`);
        return false;
      }
    }

    return true;
  };

  const buildMembers = (councilId: string): CouncilMember[] => {
    const members: Array<{ userId: string; role: CouncilRole }> = [
      { userId: formData.chairId, role: 'CHỦ_TỊCH' },
      { userId: formData.secretaryId, role: 'THƯ_KÝ' },
      ...formData.memberIds.filter(Boolean).map((userId) => ({ userId, role: 'ỦY_VIÊN' as CouncilRole })),
    ];

    return members.map(({ userId, role }, index) => {
      const user = getUser(userId);
      const department = user ? repo.getDepartmentById(user.departmentId) : undefined;

      return {
        id: `${councilId}-member-${index + 1}`,
        councilId,
        userId,
        userFullName: user?.fullName ?? '',
        academicTitle: user?.academicTitle ?? '',
        departmentName: department?.name ?? '',
        roleInCouncil: role,
        hasConflictOfInterest: false,
      };
    });
  };

  const buildAssignments = (): CouncilProjectAssignment[] =>
    formData.selectedProjectIds.map((projectId) => {
      const draft = formData.projectAssignments[projectId];

      return {
        projectId,
        reviewerAssignments: draft.reviewerAssignments.map((reviewer) => ({
          reviewerId: reviewer.reviewerId,
          reviewerName: reviewer.reviewerName,
          reviewerOrder: reviewer.reviewerOrder,
        })),
        notes: draft.notes || undefined,
      };
    });

  const saveCouncil = (issueEstablishmentDecision: boolean) => {
    if (!validateCouncil()) return;

    if (issueEstablishmentDecision && !canIssueEstablishmentDecision) {
      warning('Chỉ người có thẩm quyền mới được xác nhận ban hành quyết định thành lập Hội đồng.');
      return;
    }

    if (!issueEstablishmentDecision && !canManageCouncil) {
      warning('Bạn không có quyền tạo hoặc cập nhật dự thảo Hội đồng.');
      return;
    }

    if (issueEstablishmentDecision && !formData.establishmentDecisionNumber.trim()) {
      warning('Vui lòng nhập số Quyết định thành lập trước khi ban hành.');
      return;
    }

    try {
      const councilId = editingCouncilId ?? `council-${Date.now()}`;
      const signatory = issueEstablishmentDecision ? currentUser : undefined;

      const council: Council = {
        id: councilId,
        code: formData.code.trim(),
        name: formData.name.trim(),
        type: formData.type,
        specialtyCluster: formData.specialtyCluster || undefined,
        projectIds: [...formData.selectedProjectIds],
        projectAssignments: buildAssignments(),
        minMembers: councilRules.minMembers,
        maxMembers: councilRules.maxMembers,
        requiredReviewerCount: councilRules.requiredReviewerCount,
        establishmentDecisionNumber: issueEstablishmentDecision
          ? formData.establishmentDecisionNumber.trim()
          : undefined,
        decisionDate: issueEstablishmentDecision ? formData.decisionDate : undefined,
        decisionStatus: issueEstablishmentDecision ? 'ISSUED' : 'DRAFT',
        signatoryName: issueEstablishmentDecision ? signatory?.fullName : undefined,
        signatoryRole: issueEstablishmentDecision ? 'Giám đốc Bệnh viện' : undefined,
        meetingDate: formData.meetingDate,
        meetingTime: formData.meetingTime || undefined,
        meetingFormat: formData.meetingFormat,
        location: formData.location,
        onlineMeetingUrl:
          formData.meetingFormat === 'OFFLINE' ? undefined : formData.onlineMeetingUrl || undefined,
        sendInvitationNotification:
          issueEstablishmentDecision && formData.sendInvitationNotification,
        minPassRatio: councilRules.minPassRatio,
        status: issueEstablishmentDecision ? 'ESTABLISHED' : 'DRAFT',
        members: buildMembers(councilId),
        evaluationResults: editingCouncilId
          ? repo.getCouncilById(editingCouncilId)?.evaluationResults ?? []
          : [],
        minutes: editingCouncilId ? repo.getCouncilById(editingCouncilId)?.minutes ?? [] : [],
      };

      const saved = editingCouncilId
        ? repo.updateCouncil(editingCouncilId, council)
        : repo.createCouncil(council);

      if (!saved) {
        error('Không thể lưu Hội đồng.');
        return;
      }

      // Khi một Hội đồng được ban hành, cập nhật flow con của đề tài.
      if (issueEstablishmentDecision) {
        for (const projectId of formData.selectedProjectIds) {
          const project = repo.getProjectById(projectId);
          if (!project) continue;

          if (formData.type === 'PROPOSAL_REVIEW') {
            repo.updateProject(projectId, { proposalStatus: 'UNDER_PROPOSAL_REVIEW' });
          } else if (project.acceptanceDossier) {
            repo.updateProject(projectId, {
              acceptanceDossier: {
                ...project.acceptanceDossier,
                status: 'FORWARDED_TO_COUNCIL',
              },
            });
          }
        }
      }

      setCouncils(repo.getCouncils());
      success(
        issueEstablishmentDecision
          ? 'Đã ban hành quyết định thành lập Hội đồng.'
          : editingCouncilId
            ? 'Đã cập nhật dự thảo Hội đồng.'
            : 'Đã lưu dự thảo Hội đồng.'
      );
      resetModal();
    } catch {
      error('Không thể lưu Hội đồng. Vui lòng kiểm tra lại dữ liệu.');
    }
  };

  const isEditingDraft = editingCouncilId
    ? repo.getCouncilById(editingCouncilId)?.status === 'DRAFT'
    : false;

  return (
    <div className="space-y-4 text-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quản lý Hội đồng KH&CN</h1>
          <p className="mt-1 text-sm text-slate-500">
            Thành lập, phân công phản biện và theo dõi Hội đồng xét duyệt đề cương hoặc nghiệm thu.
          </p>
        </div>

        {canManageCouncil && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0A6EBD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085896]"
          >
            <Plus className="h-4 w-4" />
            Thành lập Hội đồng
          </button>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-[260px] flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm mã, tên Hội đồng, số quyết định..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-[#0A6EBD]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(event) => {
                setFilterType(event.target.value as CouncilFilter);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Tất cả loại Hội đồng</option>
              <option value="PROPOSAL_REVIEW">Xét duyệt đề cương</option>
              <option value="ACCEPTANCE">Nghiệm thu</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="w-36 px-5 py-3">Mã Hội đồng</th>
                <th className="min-w-[300px] px-5 py-3">Hội đồng</th>
                <th className="w-52 px-5 py-3">Lịch họp</th>
                <th className="w-56 px-5 py-3">Chủ tịch / Thư ký</th>
                <th className="w-44 px-5 py-3">Trạng thái</th>
                <th className="w-20 px-5 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedCouncils.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Không có Hội đồng phù hợp.
                  </td>
                </tr>
              ) : (
                pagedCouncils.map((council) => {
                  const chair = council.members.find((m) => m.roleInCouncil === 'CHỦ_TỊCH');
                  const secretary = council.members.find((m) => m.roleInCouncil === 'THƯ_KÝ');

                  return (
                    <tr key={council.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 align-top">
                        <Link
                          href={`/councils/${council.id}`}
                          className="font-mono text-xs font-semibold text-[#0A6EBD] hover:underline"
                        >
                          {council.code}
                        </Link>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <Link
                          href={`/councils/${council.id}`}
                          className="font-semibold text-slate-900 hover:text-[#0A6EBD]"
                        >
                          {council.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-500">
                          <span className="rounded bg-slate-100 px-2 py-0.5">
                            {council.type === 'PROPOSAL_REVIEW' ? 'Xét duyệt đề cương' : 'Nghiệm thu'}
                          </span>
                          {council.specialtyCluster && <span>{council.specialtyCluster}</span>}
                          <span>• {council.projectIds.length} đề tài</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Calendar className="h-3.5 w-3.5 text-[#0A6EBD]" />
                          {council.meetingDate}
                          {council.meetingTime ? ` · ${council.meetingTime}` : ''}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          {council.meetingFormat === 'ONLINE' ? (
                            <Video className="h-3.5 w-3.5" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5" />
                          )}
                          <span className="line-clamp-1">{council.location || 'Chưa cập nhật'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-xs">
                        <div className="font-medium text-slate-800">
                          {chair?.userFullName || 'Chưa chỉ định'}
                        </div>
                        <div className="mt-1 text-slate-500">
                          Thư ký: {secretary?.userFullName || 'Chưa chỉ định'}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <StatusBadge status={council.status} />
                        {council.establishmentDecisionNumber && (
                          <div className="mt-1 font-mono text-[11px] text-slate-500">
                            {council.establishmentDecisionNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center align-top">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(openMenuId === council.id ? null : council.id)
                            }
                            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-50"
                            aria-label={`Thao tác với ${council.code}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openMenuId === council.id && (
                            <div className="absolute right-0 top-10 z-30 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 text-left shadow-xl">
                              <Link
                                href={`/councils/${council.id}`}
                                onClick={() => setOpenMenuId(null)}
                                className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="h-4 w-4" /> Xem workspace
                              </Link>

                              {(canManageCouncil || canIssueEstablishmentDecision) &&
                                (council.status === 'DRAFT' || council.decisionStatus !== 'ISSUED') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      openEditCouncil(council);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <PenTool className="h-4 w-4" />
                                    {canIssueEstablishmentDecision && council.decisionStatus !== 'ISSUED'
                                      ? 'Xem / ban hành'
                                      : 'Chỉnh sửa dự thảo'}
                                  </button>
                                )}
                            </div>
                          )}
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

      <Pagination
        currentPage={currentPage}
        totalItems={filteredCouncils.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="hội đồng"
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="my-8 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingCouncilId ? 'Cập nhật Hội đồng' : 'Thành lập Hội đồng'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Dữ liệu được tách thành thông tin Hội đồng, thành viên và phân công đề tài.
                </p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 border-b border-slate-200 bg-slate-50 px-6 py-2">
              {[
                { id: 1 as const, label: 'Thông tin Hội đồng' },
                { id: 2 as const, label: 'Thành viên' },
                { id: 3 as const, label: 'Đề tài & phản biện' },
              ].map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setModalStep(step.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    modalStep === step.id ? 'bg-white text-[#0A6EBD] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {step.id}. {step.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {modalStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Mã Hội đồng *">
                      <input
                        value={formData.code}
                        onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Loại Hội đồng *">
                      <select
                        value={formData.type}
                        disabled={Boolean(editingCouncilId)}
                        onChange={(event) => handleCouncilTypeChange(event.target.value as CouncilType)}
                        className={INPUT_CLASS}
                      >
                        <option value="PROPOSAL_REVIEW">Xét duyệt đề cương</option>
                        <option value="ACCEPTANCE">Nghiệm thu</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Tên Hội đồng *">
                    <input
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <Field label="Khối chuyên môn">
                    <select
                      value={formData.specialtyCluster}
                      onChange={(event) =>
                        setFormData({ ...formData, specialtyCluster: event.target.value })
                      }
                      className={INPUT_CLASS}
                    >
                      {SPECIALTY_CLUSTERS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Field label="Hình thức họp">
                      <select
                        value={formData.meetingFormat}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            meetingFormat: event.target.value as CouncilForm['meetingFormat'],
                          })
                        }
                        className={INPUT_CLASS}
                      >
                        <option value="OFFLINE">Trực tiếp</option>
                        <option value="ONLINE">Trực tuyến</option>
                        <option value="HYBRID">Kết hợp</option>
                      </select>
                    </Field>
                    <Field label="Ngày họp *">
                      <input
                        type="date"
                        value={formData.meetingDate}
                        onChange={(event) =>
                          setFormData({ ...formData, meetingDate: event.target.value })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Giờ họp">
                      <input
                        type="time"
                        value={formData.meetingTime}
                        onChange={(event) =>
                          setFormData({ ...formData, meetingTime: event.target.value })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Địa điểm">
                      <input
                        value={formData.location}
                        onChange={(event) =>
                          setFormData({ ...formData, location: event.target.value })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>

                  {formData.meetingFormat !== 'OFFLINE' && (
                    <Field label="Liên kết họp trực tuyến">
                      <input
                        value={formData.onlineMeetingUrl}
                        onChange={(event) =>
                          setFormData({ ...formData, onlineMeetingUrl: event.target.value })
                        }
                        className={INPUT_CLASS}
                      />
                    </Field>
                  )}

                  {(canIssueEstablishmentDecision || formData.decisionStatus === 'ISSUED') && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Quyết định thành lập Hội đồng
                      </h3>
                      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Số quyết định">
                          <input
                            value={formData.establishmentDecisionNumber}
                            onChange={(event) =>
                              setFormData({
                                ...formData,
                                establishmentDecisionNumber: event.target.value,
                              })
                            }
                            disabled={!canIssueEstablishmentDecision}
                            className={INPUT_CLASS}
                          />
                        </Field>
                        <Field label="Ngày ban hành">
                          <input
                            type="date"
                            value={formData.decisionDate}
                            onChange={(event) =>
                              setFormData({ ...formData, decisionDate: event.target.value })
                            }
                            disabled={!canIssueEstablishmentDecision}
                            className={INPUT_CLASS}
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalStep === 2 && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                    Hội đồng hiện cần tối thiểu <strong>{councilRules.minMembers}</strong> thành viên
                    {councilRules.maxMembers ? ` và tối đa ${councilRules.maxMembers}` : ''} theo cấu hình của các đề tài đã chọn.
                  </div>

                  {hasDuplicateCouncilMember && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      <AlertTriangle className="h-4 w-4" /> Có thành viên đang được chọn trùng vị trí.
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UserSelect
                      label="Chủ tịch Hội đồng *"
                      value={formData.chairId}
                      users={candidateUsers}
                      onChange={(id) => setFormData({ ...formData, chairId: id })}
                    />
                    <UserSelect
                      label="Thư ký Hội đồng *"
                      value={formData.secretaryId}
                      users={candidateUsers}
                      onChange={(id) => setFormData({ ...formData, secretaryId: id })}
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-900">Ủy viên Hội đồng</h3>
                      <span className="text-xs text-slate-500">Tổng: {totalMembersCount} thành viên</span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                      {[0, 1, 2].map((index) => (
                        <UserSelect
                          key={index}
                          label={`Ủy viên ${index + 1}${index === 0 ? ' *' : ''}`}
                          value={formData.memberIds[index] ?? ''}
                          users={candidateUsers}
                          allowEmpty={index > 0}
                          onChange={(id) => {
                            const next = [...formData.memberIds];
                            next[index] = id;
                            setFormData({
                              ...formData,
                              memberIds: next.filter((value, itemIndex) => value || itemIndex <= index),
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {modalStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Đề tài đủ điều kiện</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Chỉ hiển thị đề tài đã tới đúng gate nghiệp vụ của loại Hội đồng này.
                      </p>
                    </div>
                    {hasAnyConflict && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Có xung đột lợi ích
                      </span>
                    )}
                  </div>

                  {availableProjects.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                      Không có đề tài đủ điều kiện để đưa vào Hội đồng này.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableProjects.map((project) => {
                        const selected = formData.selectedProjectIds.includes(project.id);
                        const assignment = formData.projectAssignments[project.id];

                        return (
                          <div
                            key={project.id}
                            className={`rounded-xl border ${
                              selected ? 'border-sky-300 bg-sky-50/30' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <label className="flex cursor-pointer items-start gap-3 p-4">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleProject(project)}
                                className="mt-1 h-4 w-4"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-mono text-xs font-semibold text-[#0A6EBD]">
                                  {project.projectCode || project.proposalCode}
                                </div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">
                                  {project.title}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  Chủ nhiệm: {project.principalInvestigatorName} · {project.departmentName}
                                </div>
                              </div>
                            </label>

                            {selected && assignment && (
                              <div className="border-t border-slate-200 bg-slate-50 p-4">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  {assignment.reviewerAssignments.map((reviewer) => {
                                    const conflict = hasConflictOfInterest(project, reviewer.reviewerId);
                                    return (
                                      <Field
                                        key={reviewer.reviewerOrder}
                                        label={`Phản biện ${reviewer.reviewerOrder} *`}
                                      >
                                        <select
                                          value={reviewer.reviewerId}
                                          onChange={(event) =>
                                            updateReviewer(
                                              project.id,
                                              reviewer.reviewerOrder,
                                              event.target.value
                                            )
                                          }
                                          className={`${INPUT_CLASS} ${conflict ? 'border-rose-400 bg-rose-50' : ''}`}
                                        >
                                          <option value="">-- Chọn phản biện --</option>
                                          {candidateUsers.map((user) => (
                                            <option key={user.id} value={user.id}>
                                              {user.fullName} ({user.academicTitle})
                                            </option>
                                          ))}
                                        </select>
                                        {conflict && (
                                          <p className="mt-1 text-xs text-rose-600">
                                            Người này là Chủ nhiệm/Thành viên của đề tài.
                                          </p>
                                        )}
                                      </Field>
                                    );
                                  })}
                                </div>

                                <Field label="Ghi chú phân công">
                                  <textarea
                                    rows={2}
                                    value={assignment.notes}
                                    onChange={(event) =>
                                      updateAssignmentNotes(project.id, event.target.value)
                                    }
                                    className={`${INPUT_CLASS} resize-none`}
                                  />
                                </Field>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                {modalStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setModalStep((modalStep - 1) as ModalStep)}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Quay lại
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>

                {modalStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setModalStep((modalStep + 1) as ModalStep)}
                    className="rounded-lg bg-[#0A6EBD] px-4 py-2 text-sm font-semibold text-white hover:bg-[#085896]"
                  >
                    Tiếp tục
                  </button>
                ) : (
                  <>
                    {canManageCouncil && (
                      <button
                        type="button"
                        onClick={() => saveCouncil(false)}
                        className="rounded-lg border border-[#0A6EBD] bg-white px-4 py-2 text-sm font-semibold text-[#0A6EBD] hover:bg-sky-50"
                      >
                        {isEditingDraft ? 'Lưu cập nhật' : 'Lưu dự thảo'}
                      </button>
                    )}

                    {canIssueEstablishmentDecision && editingCouncilId && (
                      <button
                        type="button"
                        onClick={() => saveCouncil(true)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Ban hành quyết định thành lập
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function UserSelect({
  label,
  value,
  users,
  allowEmpty = false,
  onChange,
}: {
  label: string;
  value: string;
  users: User[];
  allowEmpty?: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={INPUT_CLASS}>
        {(allowEmpty || !value) && <option value="">-- Chọn người --</option>}
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.fullName} ({user.academicTitle})
          </option>
        ))}
      </select>
    </Field>
  );
}

function hasConflictOfInterest(project: ResearchProject, userId: string) {
  if (!userId) return false;
  if (project.principalInvestigatorId === userId) return true;
  return project.members.some((member) => member.userId === userId);
}

export default function CouncilsListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải dữ liệu Hội đồng...</div>}>
      <CouncilsContent />
    </Suspense>
  );
}