'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Eye,
  Filter,
  MapPin,
  PenTool,
  Plus,
  Search,
  Video,
  X,
  Printer,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Award,
  Check,
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
type CouncilStatusFilter =
  | 'ALL'
  | 'DRAFT'
  | 'ESTABLISHED'
  | 'EVALUATING'
  | 'MINUTES_DRAFTED'
  | 'CONCLUDED'
  | 'DISSOLVED';
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
  establishmentDecisionDate: string;
  establishmentDecisionStatus: 'DRAFT' | 'SUBMITTED' | 'ISSUED';
  establishmentSignatoryName: string;
  establishmentSignatoryRole: string;
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
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-[#0A6EBD] focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500 font-medium';

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

function formatCouncilDate(value?: string) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function createEmptyForm(councilCount: number): CouncilForm {
  return {
    code: `HĐ-${new Date().getFullYear()}-${String(councilCount + 1).padStart(3, '0')}`,
    name: '',
    type: 'PROPOSAL_REVIEW',
    specialtyCluster: SPECIALTY_CLUSTERS[0],
    establishmentDecisionNumber: '',
    establishmentDecisionDate: getToday(),
    establishmentDecisionStatus: 'DRAFT',
    establishmentSignatoryName: '',
    establishmentSignatoryRole: 'Giám đốc Bệnh viện',
    meetingDate: getToday(),
    meetingTime: '08:30',
    meetingFormat: 'OFFLINE',
    location: 'Phòng họp Hội đồng Khoa học',
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
  const router = useRouter();
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();
  const searchParams = useSearchParams();

  const queryType = searchParams.get('type');
  const initialFilter: CouncilFilter =
    queryType === 'PROPOSAL_REVIEW' || queryType === 'ACCEPTANCE'
      ? queryType
      : 'ALL';

  const [councils, setCouncils] = useState<Council[]>(repo.getCouncils());
  const [filterType, setFilterType] = useState<CouncilFilter>(initialFilter);
  const [filterStatus, setFilterStatus] = useState<CouncilStatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Trạng thái modal tạo/chỉnh sửa Hội đồng.
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>(1);
  const [editingCouncilId, setEditingCouncilId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CouncilForm>(() =>
    createEmptyForm(councils.length)
  );

  // Phòng Quản lý NCKH chịu trách nhiệm chuẩn bị và quản lý hồ sơ Hội đồng.
  // Quyết định thành lập được nhập theo văn bản đã ban hành; Giám đốc không thao tác nghiệp vụ trực tiếp tại màn này.
  const canPrepareCouncil = ['RESEARCH_OFFICE', 'ADMIN'].includes(currentUser.role);

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

      // Xét duyệt đề cương chỉ nhận hồ sơ đã nộp đề cương và sẵn sàng đưa ra Hội đồng.
      if (formData.type === 'PROPOSAL_REVIEW') {
        return project.proposalStatus === 'OUTLINE_SUBMITTED' ||
          (Boolean(editingCouncilId) && formData.selectedProjectIds.includes(project.id));
      }

      // Nghiệm thu chỉ nhận đề tài đã được Phòng NCKH xác nhận đủ điều kiện nghiệm thu.
      return (
        project.status === 'WAITING_ACCEPTANCE' &&
        (project.acceptanceDossier?.status === 'ELIGIBLE_FOR_ACCEPTANCE' ||
          (Boolean(editingCouncilId) && formData.selectedProjectIds.includes(project.id)))
      );
    });
  }, [councils, editingCouncilId, formData.type, formData.selectedProjectIds, projects]);

  const selectedProjects = useMemo(
    () =>
      formData.selectedProjectIds
        .map((id) => repo.getProjectById(id))
        .filter((project): project is ResearchProject => Boolean(project)),
    [formData.selectedProjectIds]
  );


  const conflictedUserIds = useMemo(() => {
    const ids = new Set<string>();
    selectedProjects.forEach((project) => {
      if (project.principalInvestigatorId) ids.add(project.principalInvestigatorId);
      project.members?.forEach((member) => {
        if (member.userId) ids.add(member.userId);
      });
    });
    return ids;
  }, [selectedProjects]);

  const eligibleCandidateUsers = useMemo(
    () => candidateUsers.filter((user) => !conflictedUserIds.has(user.id)),
    [candidateUsers, conflictedUserIds]
  );

  const selectedCouncilUserIds = [
    formData.chairId,
    formData.secretaryId,
    ...formData.memberIds,
  ].filter(Boolean);

  const totalMembersCount = new Set(selectedCouncilUserIds).size;
  const hasDuplicateCouncilMember = selectedCouncilUserIds.length !== totalMembersCount;

  // Thống kê Metrics cho Header Dashboard
  const metrics = useMemo(() => {
    return {
      total: councils.length,
      draft: councils.filter((c) => c.status === 'DRAFT').length,
      active: councils.filter((c) => c.status === 'ESTABLISHED' || c.status === 'EVALUATING').length,
      minutes: councils.filter((c) => c.status === 'MINUTES_DRAFTED').length,
      concluded: councils.filter((c) => c.status === 'CONCLUDED').length,
    };
  }, [councils]);

  const filteredCouncils = useMemo(() => {
    const q = search.trim().toLowerCase();

    return councils.filter((council) => {
      if (filterType !== 'ALL' && council.type !== filterType) return false;
      if (filterStatus !== 'ALL' && council.status !== filterStatus) return false;
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
  }, [councils, filterStatus, filterType, search]);

  const pagedCouncils = filteredCouncils.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getUser = (id: string) => candidateUsers.find((user) => user.id === id);

  const getDepartmentName = (userId: string) =>
    repo.getDepartmentNameByUserId(userId) || 'Chưa xác định';

  const handleEditCouncil = (council: Council) => {
    const chair = council.members.find((member) => member.roleInCouncil === 'CHỦ_TỊCH');
    const secretary = council.members.find((member) => member.roleInCouncil === 'THƯ_KÝ');
    const otherMembers = council.members.filter(
      (member) => member.roleInCouncil !== 'CHỦ_TỊCH' && member.roleInCouncil !== 'THƯ_KÝ'
    );

    const projectAssignments = (council.projectAssignments || []).reduce<Record<string, ProjectAssignmentDraft>>(
      (acc, assignment) => {
        acc[assignment.projectId] = {
          reviewerAssignments: assignment.reviewerAssignments || [],
          notes: assignment.notes || '',
        };
        return acc;
      },
      {}
    );

    setEditingCouncilId(council.id);
    setFormData({
      code: council.code,
      name: council.name,
      type: council.type,
      specialtyCluster: council.specialtyCluster || SPECIALTY_CLUSTERS[0],
      establishmentDecisionNumber: council.establishmentDecisionNumber || '',
      establishmentDecisionDate: council.establishmentDecisionDate || getToday(),
      establishmentDecisionStatus: council.establishmentDecisionStatus || 'DRAFT',
      establishmentSignatoryName: council.establishmentSignatoryName || '',
      establishmentSignatoryRole: council.establishmentSignatoryRole || 'Giám đốc Bệnh viện',
      meetingDate: council.meetingDate || getToday(),
      meetingTime: council.meetingTime || '',
      meetingFormat: council.meetingFormat || 'OFFLINE',
      location: council.location || '',
      onlineMeetingUrl: council.onlineMeetingUrl || '',
      sendInvitationNotification: council.sendInvitationNotification ?? true,
      chairId: chair?.userId || '',
      secretaryId: secretary?.userId || '',
      memberIds: otherMembers.map((member) => member.userId),
      selectedProjectIds: [...council.projectIds],
      projectAssignments,
    });
    setModalStep(1);
    setShowCreateModal(true);
  };

  const handleDeleteCouncil = (id: string, name: string) => {
    confirm({
      title: 'Xóa dự thảo Hội đồng',
      message: `Bạn có chắc chắn muốn xóa Hội đồng "${name}"? Chỉ dự thảo chưa ban hành quyết định mới được xóa.`,
      confirmLabel: 'Xóa dự thảo',
      type: 'danger',
      onConfirm: () => {
        const deleted = repo.deleteCouncil(id);
        if (!deleted) {
          error('Không thể xóa dự thảo Hội đồng.');
          return;
        }
        setCouncils(repo.getCouncils());
        success(`Đã xóa dự thảo Hội đồng "${name}".`);
      },
    });
  };

  const handleSaveCouncil = (targetStatus: 'DRAFT' | 'ESTABLISHED') => {
    if (!canPrepareCouncil) {
      warning('Bạn không có quyền tạo hoặc cập nhật Hội đồng.');
      return;
    }
    if (!formData.name.trim()) {
      warning('Vui lòng nhập Tên Hội đồng.');
      setModalStep(1);
      return;
    }
    if (formData.selectedProjectIds.length === 0) {
      warning('Vui lòng chọn ít nhất 1 đề tài cần thẩm định.');
      setModalStep(2);
      return;
    }
    if (!formData.chairId || !formData.secretaryId) {
      warning('Vui lòng chọn Chủ tịch và Thư ký Hội đồng.');
      setModalStep(3);
      return;
    }
    if (hasDuplicateCouncilMember) {
      warning('Một thành viên không được đảm nhận trùng nhiều vai trò trong cùng 1 Hội đồng.');
      setModalStep(3);
      return;
    }

    if (targetStatus === 'ESTABLISHED' && !formData.establishmentDecisionNumber.trim()) {
      warning('Cần nhập số Quyết định thành lập trước khi xác nhận Hội đồng đã được thành lập.');
      setModalStep(1);
      return;
    }

    const selectedPeople = [formData.chairId, formData.secretaryId, ...formData.memberIds];
    if (selectedPeople.some((id) => conflictedUserIds.has(id))) {
      warning('Chủ nhiệm hoặc thành viên nhóm nghiên cứu của đề tài không được phân công vào Hội đồng đánh giá chính đề tài đó.');
      setModalStep(3);
      return;
    }

    const councilId = editingCouncilId || `council-${Date.now()}`;
    const councilPolicy = repo.getCommonCouncilPolicy(formData.selectedProjectIds);
    const secretaryCanEvaluate = councilPolicy?.secretaryCanEvaluate ?? false;
    const secretaryCanVote = councilPolicy?.secretaryCanVote ?? false;

    const members: CouncilMember[] = [
      {
        id: `cm-${Date.now()}-1`,
        councilId,
        userId: formData.chairId,
        userFullName: getUser(formData.chairId)?.fullName || '',
        academicTitle: getUser(formData.chairId)?.academicTitle || '',
        departmentName: getDepartmentName(formData.chairId),
        roleInCouncil: 'CHỦ_TỊCH',
        hasConflictOfInterest: false,
        canEvaluate: true,
        canVote: true,
      },
      {
        id: `cm-${Date.now()}-2`,
        councilId,
        userId: formData.secretaryId,
        userFullName: getUser(formData.secretaryId)?.fullName || '',
        academicTitle: getUser(formData.secretaryId)?.academicTitle || '',
        departmentName: getDepartmentName(formData.secretaryId),
        roleInCouncil: 'THƯ_KÝ',
        hasConflictOfInterest: false,
        canEvaluate: secretaryCanEvaluate,
        canVote: secretaryCanVote,
      },
      ...formData.memberIds.map((mId, index) => ({
        id: `cm-${Date.now()}-${index + 3}`,
        councilId,
        userId: mId,
        userFullName: getUser(mId)?.fullName || '',
        academicTitle: getUser(mId)?.academicTitle || '',
        departmentName: getDepartmentName(mId),
        roleInCouncil: (Object.values(formData.projectAssignments).some((assignment) =>
          assignment.reviewerAssignments.some((reviewer) => reviewer.reviewerId === mId)
        ) ? 'PHẢN_BIỆN' : 'ỦY_VIÊN') as CouncilRole,
        hasConflictOfInterest: false,
        canEvaluate: true,
        canVote: true,
      })),
    ];

    const projectAssignments: CouncilProjectAssignment[] = formData.selectedProjectIds.map((pId) => ({
      projectId: pId,
      reviewerAssignments: formData.projectAssignments[pId]?.reviewerAssignments || [],
      notes: formData.projectAssignments[pId]?.notes || '',
    }));

    const newCouncil: Council = {
      id: councilId,
      code: formData.code,
      name: formData.name,
      type: formData.type,
      specialtyCluster: formData.specialtyCluster,
      projectIds: formData.selectedProjectIds,
      projectAssignments,
      establishmentDecisionNumber: formData.establishmentDecisionNumber,
      establishmentDecisionDate: formData.establishmentDecisionDate,
      establishmentDecisionStatus: targetStatus === 'ESTABLISHED' ? 'ISSUED' : formData.establishmentDecisionStatus,
      establishmentSignatoryName: formData.establishmentSignatoryName || undefined,
      establishmentSignatoryRole: formData.establishmentSignatoryRole || undefined,
      meetingDate: formData.meetingDate,
      meetingTime: formData.meetingTime,
      meetingFormat: formData.meetingFormat,
      location: formData.location,
      onlineMeetingUrl: formData.onlineMeetingUrl,
      minMembers: councilPolicy?.minMembers,
      maxMembers: councilPolicy?.maxMembers,
      requiredReviewerCount: councilPolicy?.requiredReviewerCount,
      minPassRatio: councilPolicy?.minPassRatio ?? 0,
      status: targetStatus,
      members,
      evaluationResults: editingCouncilId ? repo.getCouncilById(editingCouncilId)?.evaluationResults || [] : [],
      minutes: editingCouncilId ? repo.getCouncilById(editingCouncilId)?.minutes || [] : [],
    };

    const persisted = editingCouncilId
      ? Boolean(repo.updateCouncil(editingCouncilId, newCouncil))
      : Boolean(repo.createCouncil(newCouncil));

    if (!persisted) {
      warning('Repository chưa có hàm createCouncil/updateCouncil phù hợp; không ghi dữ liệu giả chỉ ở state giao diện.');
      return;
    }

    if (targetStatus === 'ESTABLISHED') {
      formData.selectedProjectIds.forEach((projectId) => {
        const selectedProject = repo.getProjectById(projectId);
        if (!selectedProject) return;
        if (formData.type === 'PROPOSAL_REVIEW') {
          repo.updateProject(projectId, { proposalStatus: 'UNDER_PROPOSAL_REVIEW' });
        } else if (selectedProject.acceptanceDossier) {
          repo.updateProject(projectId, {
            acceptanceDossier: {
              ...selectedProject.acceptanceDossier,
              status: 'FORWARDED_TO_COUNCIL',
            },
          });
        }
      });
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: editingCouncilId ? 'UPDATE_COUNCIL' : targetStatus === 'DRAFT' ? 'SAVE_COUNCIL_DRAFT' : 'CREATE_COUNCIL',
      entityType: 'COUNCIL',
      entityId: newCouncil.id,
      notes: `${targetStatus === 'DRAFT' ? 'Lưu dự thảo' : 'Thành lập'} Hội đồng ${newCouncil.code}: ${newCouncil.name}`,
    });

    setCouncils(repo.getCouncils());
    success(targetStatus === 'DRAFT' ? 'Đã lưu dự thảo Hội đồng.' : `Đã thành lập Hội đồng "${newCouncil.name}".`);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-4 text-slate-800 text-xs">
      {/* ── HEADER & THAO TÁC RỘNG ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">Hội đồng khoa học & công nghệ</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Tạo Hội đồng, tổ chức đánh giá, hoàn thiện biên bản và theo dõi kết luận
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" /> In danh mục
          </button>
          <button
            onClick={() => success('Đã xuất danh sách Hội đồng thành file Excel (.xlsx) thành công!')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-2xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Xuất Excel
          </button>
          {canPrepareCouncil && (
            <button
              type="button"
              onClick={() => {
                setEditingCouncilId(null);
                setModalStep(1);
                setFormData(createEmptyForm(councils.length));
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tạo Hội đồng
            </button>
          )}
        </div>
      </div>

      {/* ── BẢNG METRIC STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Hội đồng</span>
            <strong className="text-lg font-mono font-bold text-slate-900">{metrics.total}</strong>
            <span className="block text-[10px] text-emerald-600 font-semibold">{metrics.concluded} hoàn tất</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Dự thảo</span>
            <strong className="text-lg font-mono font-bold text-amber-700">{metrics.draft}</strong>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-[#0A6EBD] rounded-lg shrink-0">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Đang đánh giá</span>
            <strong className="text-lg font-mono font-bold text-[#0A6EBD]">{metrics.active}</strong>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Hoàn thiện biên bản</span>
            <strong className="text-lg font-mono font-bold text-emerald-700">{metrics.minutes}</strong>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR BỘ LỌC ── */}
      <section className="rounded-xl border border-slate-200/80 bg-white shadow-2xs p-3 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã, tên Hội đồng, số quyết định..."
            className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] text-xs outline-none bg-white font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as CouncilFilter)}
          className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-semibold outline-none bg-white cursor-pointer"
        >
          <option value="ALL">Tất cả loại Hội đồng</option>
          <option value="PROPOSAL_REVIEW">Xét duyệt đề cương</option>
          <option value="ACCEPTANCE">Nghiệm thu kết quả</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as CouncilStatusFilter)}
          className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-semibold outline-none bg-white cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Dự thảo</option>
          <option value="ESTABLISHED">Đã thành lập / Chờ đánh giá</option>
          <option value="EVALUATING">Đang đánh giá</option>
          <option value="MINUTES_DRAFTED">Đang hoàn thiện biên bản</option>
          <option value="CONCLUDED">Hoàn tất</option>
        </select>
      </section>

      {/* ── BẢNG DANH SÁCH HỘI ĐỒNG ENTERPRISE ── */}
      <section className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#0B2A63] text-white font-bold uppercase tracking-wider text-[11px] select-none">
              <tr>
                <th className="px-4 py-3.5 w-32 whitespace-nowrap">MÃ HỘI ĐỒNG</th>
                <th className="px-4 py-3.5 min-w-[280px]">TÊN HỘI ĐỒNG & KHỐI CHUYÊN MÔN</th>
                <th className="px-4 py-3.5 w-44 whitespace-nowrap">HÌNH THỨC & LỊCH HỌP</th>
                <th className="px-4 py-3.5 w-44 whitespace-nowrap">CHỦ TỊCH / THƯ KÝ</th>
                <th className="px-4 py-3.5 w-32 text-center whitespace-nowrap">TIẾN ĐỘ CHẤM</th>
                <th className="px-4 py-3.5 w-32 text-center whitespace-nowrap">TRẠNG THÁI</th>
                <th className="px-4 py-3.5 w-36 text-center whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {pagedCouncils.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Không tìm thấy hội đồng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                pagedCouncils.map((council) => {
                  const chair = council.members.find((m) => m.roleInCouncil === 'CHỦ_TỊCH');
                  const secretary = council.members.find((m) => m.roleInCouncil === 'THƯ_KÝ');

                  // Thống kê tiến độ nộp phiếu chấm của Hội đồng
                  const evaluatingMembers = council.members.filter((member) => member.canEvaluate !== false);
                  const expectedVotes = evaluatingMembers.length * Math.max(council.projectIds.length, 1);
                  const submittedCount = (council.evaluationResults || []).filter((result) =>
                    result.status === 'SUBMITTED' || result.status === 'SIGNED'
                  ).length;
                  const progressRatio = expectedVotes > 0 ? Math.min(100, Math.round((submittedCount / expectedVotes) * 100)) : 0;

                  return (
                    <tr key={council.id} className="hover:bg-slate-50 transition">
                      {/* Mã Hội đồng */}
                      <td className="px-4 py-3.5 font-mono font-bold text-[#0A6EBD] align-middle whitespace-nowrap">
                        <Link href={`/councils/${council.id}`} className="hover:underline">
                          {council.code}
                        </Link>
                      </td>

                      {/* Tên Hội đồng */}
                      <td className="px-4 py-3.5 align-middle">
                        <Link
                          href={`/councils/${council.id}`}
                          className="font-bold text-slate-900 hover:text-[#0A6EBD] transition block leading-snug line-clamp-2"
                        >
                          {council.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold border border-slate-200">
                            {council.type === 'PROPOSAL_REVIEW' ? 'Xét duyệt đề cương' : 'Nghiệm thu'}
                          </span>
                          {council.specialtyCluster && (
                            <span className="text-[#0A6EBD] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 font-semibold">
                              {council.specialtyCluster}
                            </span>
                          )}
                          <span>• {council.projectIds.length} đề tài</span>
                        </div>
                      </td>

                      {/* Lịch họp */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <p className="font-bold text-slate-800 font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#0A6EBD]" />
                          {formatCouncilDate(council.meetingDate)}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1 font-medium">
                          {council.meetingFormat === 'ONLINE' ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              <Video className="w-3 h-3" /> Online
                            </span>
                          ) : (
                            <span className="text-slate-600 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" /> {council.location || 'Tại phòng họp'}
                            </span>
                          )}
                        </p>
                      </td>

                      {/* Chủ tịch / Thư ký */}
                      <td className="px-4 py-3.5 align-middle text-[11px]">
                        <p className="font-bold text-slate-900">{chair?.userFullName || 'Chưa chọn'}</p>
                        <p className="text-slate-500 mt-0.5 font-medium">Thư ký: {secretary?.userFullName || 'Chưa chọn'}</p>
                      </td>

                      {/* Tiến độ nộp phiếu chấm */}
                      <td className="px-4 py-3.5 align-middle text-center">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-[11px] text-slate-700">
                            {submittedCount}/{expectedVotes} phiếu ({progressRatio}%)
                          </span>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                progressRatio === 100 ? 'bg-emerald-500' : 'bg-[#0A6EBD]'
                              }`}
                              style={{ width: `${progressRatio}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3.5 align-middle text-center">
                        <StatusBadge status={council.status} />
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3.5 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={
                              council.status === 'MINUTES_DRAFTED' || council.status === 'CONCLUDED'
                                ? `/councils/${council.id}?tab=minutes`
                                : `/councils/${council.id}`
                            }
                            title={
                              council.status === 'CONCLUDED'
                                ? 'Xem kết quả'
                                : council.status === 'DRAFT'
                                  ? 'Xem thông tin Hội đồng'
                                  : 'Mở Hội đồng'
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0A6EBD] transition hover:border-sky-300 hover:bg-sky-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {canPrepareCouncil && council.status === 'DRAFT' && (
                            <button
                              type="button"
                              title="Chỉnh sửa Hội đồng"
                              onClick={() => handleEditCouncil(council)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                            >
                              <PenTool className="h-4 w-4" />
                            </button>
                          )}

                          {(council.status === 'MINUTES_DRAFTED' || council.status === 'CONCLUDED') && (
                            <Link
                              href={`/councils/${council.id}?tab=minutes`}
                              title={council.status === 'CONCLUDED' ? 'Xem biên bản' : 'Hoàn thiện biên bản'}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <FileText className="h-4 w-4" />
                            </Link>
                          )}

                          {canPrepareCouncil && council.status === 'DRAFT' && (
                            <button
                              type="button"
                              title="Xóa dự thảo"
                              onClick={() => handleDeleteCouncil(council.id, council.name)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

      {/* Phân trang */}
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

      {/* ── MODAL 3 BƯỚC THÀNH LẬP HỘI ĐỒNG MỚI ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0 select-none">
              <div>
                <span className="px-2 py-0.5 bg-sky-50 text-[#0A6EBD] border border-sky-200 rounded text-[10px] font-bold font-mono">
                  BƯỚC {modalStep} / 3
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {editingCouncilId ? 'Chỉnh sửa Hội đồng' : 'Tạo Hội đồng'}
                </h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Wizard Bar */}
            <div className="grid grid-cols-3 gap-2 shrink-0 select-none">
              {[
                { step: 1, label: '1. Thông tin chung' },
                { step: 2, label: '2. Chọn đề tài' },
                { step: 3, label: '3. Thành viên & Phản biện' },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`p-2 rounded-lg border text-center font-bold text-[11px] transition ${
                    modalStep === item.step
                      ? 'bg-sky-50 border-[#0A6EBD] text-[#0A6EBD]'
                      : modalStep > item.step
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </div>

            {/* Body Wizard Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* BƯỚC 1: THÔNG TIN CHUNG */}
              {modalStep === 1 && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mã Hội đồng *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Loại Hội đồng *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as CouncilType, selectedProjectIds: [] })}
                        className={INPUT_CLASS}
                      >
                        <option value="PROPOSAL_REVIEW">Hội đồng Xét duyệt Đề cương</option>
                        <option value="ACCEPTANCE">Hội đồng Nghiệm thu Kết quả</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tên Hội đồng *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Hội đồng Xét duyệt Đề cương NCKH Đợt 1 năm 2026 - Khối Ngoại"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Khối chuyên môn</label>
                      <select
                        value={formData.specialtyCluster}
                        onChange={(e) => setFormData({ ...formData, specialtyCluster: e.target.value })}
                        className={INPUT_CLASS}
                      >
                        {SPECIALTY_CLUSTERS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Số Quyết định thành lập</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 125/QĐ-BV"
                        value={formData.establishmentDecisionNumber}
                        onChange={(e) => setFormData({ ...formData, establishmentDecisionNumber: e.target.value })}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ngày quyết định</label>
                      <input type="date" value={formData.establishmentDecisionDate} onChange={(e) => setFormData({ ...formData, establishmentDecisionDate: e.target.value })} className={INPUT_CLASS} />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Người ký quyết định</label>
                      <input type="text" value={formData.establishmentSignatoryName} onChange={(e) => setFormData({ ...formData, establishmentSignatoryName: e.target.value })} className={INPUT_CLASS} placeholder="Họ tên người ký" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ngày họp *</label>
                      <input
                        type="date"
                        value={formData.meetingDate}
                        onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Giờ họp</label>
                      <input
                        type="time"
                        value={formData.meetingTime}
                        onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hình thức họp</label>
                      <select
                        value={formData.meetingFormat}
                        onChange={(e) => setFormData({ ...formData, meetingFormat: e.target.value as CouncilForm['meetingFormat'] })}
                        className={INPUT_CLASS}
                      >
                        <option value="OFFLINE">Trực tiếp (Tại phòng họp)</option>
                        <option value="ONLINE">Trực tuyến (Online)</option>
                        <option value="HYBRID">Kết hợp (Hybrid)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* BƯỚC 2: CHỌN ĐỀ TÀI */}
              {modalStep === 2 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800">
                      Đề tài đủ điều kiện đưa ra Hội đồng ({availableProjects.length})
                    </span>
                    <span className="font-mono text-xs font-bold text-[#0A6EBD]">
                      Đã chọn: {formData.selectedProjectIds.length} đề tài
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {availableProjects.length === 0 ? (
                      <p className="text-center py-8 text-slate-400">Không có đề tài nào đủ điều kiện đưa ra Hội đồng ở giai đoạn này.</p>
                    ) : (
                      availableProjects.map((p) => {
                        const isSelected = formData.selectedProjectIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                              isSelected ? 'bg-sky-50/60 border-[#0A6EBD]' : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newIds = checked
                                  ? [...formData.selectedProjectIds, p.id]
                                  : formData.selectedProjectIds.filter((id) => id !== p.id);
                                setFormData({ ...formData, selectedProjectIds: newIds });
                              }}
                              className="mt-1 text-[#0A6EBD] focus:ring-[#0A6EBD]"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-mono font-bold text-xs text-[#0A6EBD] block">
                                {p.projectCode || p.proposalCode}
                              </span>
                              <p className="font-bold text-slate-900 leading-snug">{p.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Chủ nhiệm: <strong>{p.principalInvestigatorName}</strong> • {p.departmentName}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* BƯỚC 3: THÀNH VIÊN HỘI ĐỒNG */}
              {modalStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Chủ tịch Hội đồng *</label>
                      <select
                        value={formData.chairId}
                        onChange={(e) => setFormData({ ...formData, chairId: e.target.value })}
                        className={INPUT_CLASS}
                      >
                        <option value="">-- Chọn Chủ tịch --</option>
                        {eligibleCandidateUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} ({u.academicTitle || u.degree || 'Bác sĩ'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Thư ký Hội đồng *</label>
                      <select
                        value={formData.secretaryId}
                        onChange={(e) => setFormData({ ...formData, secretaryId: e.target.value })}
                        className={INPUT_CLASS}
                      >
                        <option value="">-- Chọn Thư ký --</option>
                        {eligibleCandidateUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} ({u.academicTitle || u.degree || 'Chuyên viên'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                      Hệ thống đã loại Chủ nhiệm và thành viên nhóm nghiên cứu của các đề tài đang chọn khỏi danh sách nhân sự Hội đồng để hạn chế xung đột lợi ích.
                    </div>
                    <label className="block font-bold text-slate-700 mb-1">Ủy viên / Phản biện</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {eligibleCandidateUsers
                        .filter((u) => u.id !== formData.chairId && u.id !== formData.secretaryId)
                        .map((u) => {
                          const isChecked = formData.memberIds.includes(u.id);
                          return (
                            <label key={u.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const newMembers = checked
                                    ? [...formData.memberIds, u.id]
                                    : formData.memberIds.filter((id) => id !== u.id);
                                  setFormData({ ...formData, memberIds: newMembers });
                                }}
                                className="text-[#0A6EBD]"
                              />
                              <span className="font-semibold text-slate-800 text-xs truncate">
                                {u.fullName}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between shrink-0 select-none">
              <button
                type="button"
                onClick={() => {
                  if (modalStep > 1) setModalStep((modalStep - 1) as ModalStep);
                  else setShowCreateModal(false);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition cursor-pointer"
              >
                {modalStep === 1 ? 'Hủy bỏ' : '← Quay lại'}
              </button>

              <div className="flex items-center gap-2">
                {modalStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalStep === 1 && !formData.name.trim()) {
                        warning('Vui lòng nhập Tên Hội đồng');
                        return;
                      }
                      if (modalStep === 2 && formData.selectedProjectIds.length === 0) {
                        warning('Vui lòng chọn ít nhất 1 đề tài');
                        return;
                      }
                      setModalStep((modalStep + 1) as ModalStep);
                    }}
                    className="px-4 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    Tiếp tục →
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveCouncil('DRAFT')}
                      className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold transition cursor-pointer"
                    >
                      Lưu dự thảo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveCouncil('ESTABLISHED')}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Xác nhận thành lập
                    </button>
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

export default function CouncilsListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu Hội đồng...</div>}>
      <CouncilsContent />
    </Suspense>
  );
}