'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { useSearchParams } from 'next/navigation';
import { Council, CouncilRole, CouncilProjectAssignment } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import {
  Award,
  Calendar,
  Users,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  X,
  FileCheck2,
  CheckCircle2,
  Eye,
  Printer,
  Filter,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Video,
  MapPin,
  Send,
  FileText,
  HelpCircle,
  UserCheck,
  UserX,
} from 'lucide-react';

const SPECIALTY_CLUSTERS = [
  { id: 'ALL_SPECIALTIES', name: 'Đa chuyên khoa / Toàn viện' },
  { id: 'INTERNAL_ICU', name: 'Khối Tim mạch & Hồi sức cấp cứu' },
  { id: 'SURGERY_OB', name: 'Khối Ngoại khoa - Phẫu thuật - Sản khoa' },
  { id: 'ONCOLOGY', name: 'Khối Ung bướu & Xạ trị' },
  { id: 'LAB_PHARMA', name: 'Khối Dược lâm sàng & Cận lâm sàng' },
  { id: 'NURSING_PH', name: 'Khối Điều dưỡng & Y tế công cộng' },
];

function CouncilsContent() {
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as any) || 'ALL';

  const [councils, setCouncils] = useState<Council[]>(repo.getCouncils());
  const [filterType, setFilterType] = useState<'ALL' | 'PROPOSAL_REVIEW' | 'ACCEPTANCE_REVIEW'>(
    ['PROPOSAL_REVIEW', 'ACCEPTANCE_REVIEW'].includes(initialType) ? initialType : 'ALL'
  );
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Tự động cập nhật khi đổi URL query param
  React.useEffect(() => {
    const qType = searchParams.get('type');
    if (qType && ['PROPOSAL_REVIEW', 'ACCEPTANCE_REVIEW'].includes(qType)) {
      setFilterType(qType as any);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Danh sách Bác sĩ / Cán bộ có thể bổ nhiệm vào Hội đồng
  const doctorsList = repo.getUsers().filter((u) =>
    ['DIRECTOR', 'COUNCIL_MEMBER', 'COUNCIL_SECRETARY', 'ETHICS_OFFICE', 'RESEARCHER'].includes(u.role)
  );

  const availableProjects = repo.getProjects().filter((p) =>
    ['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'RESUBMITTED', 'VALID'].includes(p.proposalStatus) ||
    ['IN_PROGRESS', 'PROPOSAL_APPROVED'].includes(p.status)
  );

  // State Modal Thành lập Hội đồng Mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);

  const [formData, setFormData] = useState({
    code: `HĐ-${new Date().getFullYear()}-${String(councils.length + 1).padStart(3, '0')}`,
    name: 'Hội đồng Đánh giá & Xét duyệt Đề cương NCKH Đợt 1',
    type: 'PROPOSAL_REVIEW' as 'PROPOSAL_REVIEW' | 'ACCEPTANCE_REVIEW',
    specialtyCluster: 'Khối Tim mạch & Hồi sức cấp cứu',
    establishmentDecisionNumber: '142/QĐ-BV-NCKH',
    decisionDate: '01/03/2026',
    decisionStatus: 'DRAFT' as 'DRAFT' | 'ISSUED',
    signatoryName: 'GS.TS.BS. Vũ Đình Khoa (Giám đốc Bệnh viện)',
    signatoryRole: 'Giám đốc Bệnh viện',
    meetingDate: '15/03/2026',
    meetingTime: '08:30',
    meetingFormat: 'HYBRID' as 'OFFLINE' | 'ONLINE' | 'HYBRID',
    location: 'Phòng họp Giao ban Khoa học (Tầng 3 Nhà A)',
    onlineMeetingUrl: 'https://meet.hospital.gov.vn/hoi-dong-nckh-01',
    sendInvitationNotification: true,
    // Cơ cấu thành viên thường trực
    chairId: 'user-10', // GS.TS.BS Vũ Đình Khoa
    chairName: 'GS.TS.BS. Vũ Đình Khoa',
    secretaryId: 'user-07', // BS.CKI Đỗ Bích Ngọc
    secretaryName: 'BS.CKI. Đỗ Bích Ngọc',
    member1Id: 'user-06', // TS.BS Hoàng Minh Tuấn
    member1Name: 'TS.BS. Hoàng Minh Tuấn',
    member2Id: 'user-08', // TS.BS Vũ Thị Hồng Hạnh
    member2Name: 'TS.BS. Vũ Thị Hồng Hạnh',
    member3Id: 'user-13', // TS.BS Phan Quỳnh Nga
    member3Name: 'TS.BS. Phan Quỳnh Nga',
    memberAbsentWithWrittenReview: false,
    // Danh sách đề tài & phân công phản biện riêng
    selectedProjectIds: ['proj-01', 'proj-02'] as string[],
    projectAssignments: {
      'proj-01': {
        reviewer1Id: 'user-05',
        reviewer1Name: 'PGS.TS.BS. Phạm Đức Dũng',
        reviewer2Id: 'user-06',
        reviewer2Name: 'TS.BS. Hoàng Minh Tuấn',
        notes: 'Thẩm định kỹ phương pháp can thiệp và cỡ mẫu',
      },
      'proj-02': {
        reviewer1Id: 'user-08',
        reviewer1Name: 'TS.BS. Vũ Thị Hồng Hạnh',
        reviewer2Id: 'user-13',
        reviewer2Name: 'TS.BS. Phan Quỳnh Nga',
        notes: 'Kiểm tra hồ sơ chấp thuận Đạo đức Y sinh',
      },
    } as Record<string, { reviewer1Id: string; reviewer1Name: string; reviewer2Id: string; reviewer2Name: string; notes: string }>,
  });

  const filteredCouncils = councils.filter((c) => {
    if (filterType !== 'ALL' && c.type !== filterType) return false;
    if (
      search.trim() &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !c.code.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const pagedCouncils = filteredCouncils.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Toggle chọn đề tài và khởi tạo phản biện mặc định nếu chưa có
  const handleToggleProject = (project: any) => {
    const isSelected = formData.selectedProjectIds.includes(project.id);
    if (isSelected) {
      const newSelected = formData.selectedProjectIds.filter((pId) => pId !== project.id);
      const newAssignments = { ...formData.projectAssignments };
      delete newAssignments[project.id];
      setFormData({
        ...formData,
        selectedProjectIds: newSelected,
        projectAssignments: newAssignments,
      });
    } else {
      // Tìm 2 bác sĩ không bị trùng với Chủ nhiệm đề tài
      const validDoctors = doctorsList.filter((d) => d.id !== project.principalInvestigatorId);
      const rev1 = validDoctors[0] || doctorsList[0];
      const rev2 = validDoctors[1] || doctorsList[1];

      setFormData({
        ...formData,
        selectedProjectIds: [...formData.selectedProjectIds, project.id],
        projectAssignments: {
          ...formData.projectAssignments,
          [project.id]: {
            reviewer1Id: rev1?.id || '',
            reviewer1Name: rev1?.fullName || '',
            reviewer2Id: rev2?.id || '',
            reviewer2Name: rev2?.fullName || '',
            notes: '',
          },
        },
      });
    }
  };

  // Cập nhật phản biện riêng cho từng đề tài
  const handleUpdateProjectReviewer = (
    projectId: string,
    field: 'reviewer1' | 'reviewer2' | 'notes',
    value: string
  ) => {
    const curr = formData.projectAssignments[projectId] || {
      reviewer1Id: '',
      reviewer1Name: '',
      reviewer2Id: '',
      reviewer2Name: '',
      notes: '',
    };

    if (field === 'reviewer1') {
      const doc = doctorsList.find((d) => d.id === value);
      setFormData({
        ...formData,
        projectAssignments: {
          ...formData.projectAssignments,
          [projectId]: {
            ...curr,
            reviewer1Id: value,
            reviewer1Name: doc?.fullName || value,
          },
        },
      });
    } else if (field === 'reviewer2') {
      const doc = doctorsList.find((d) => d.id === value);
      setFormData({
        ...formData,
        projectAssignments: {
          ...formData.projectAssignments,
          [projectId]: {
            ...curr,
            reviewer2Id: value,
            reviewer2Name: doc?.fullName || value,
          },
        },
      });
    } else {
      setFormData({
        ...formData,
        projectAssignments: {
          ...formData.projectAssignments,
          [projectId]: {
            ...curr,
            notes: value,
          },
        },
      });
    }
  };

  // Kiểm tra xung đột lợi ích (Conflict of Interest)
  const checkConflictOfInterest = (projectId: string, reviewerId: string) => {
    if (!reviewerId) return false;
    const project = repo.getProjectById(projectId);
    if (!project) return false;
    // Trùng chủ nhiệm đề tài
    if (project.principalInvestigatorId === reviewerId) return true;
    // Trùng thành viên nghiên cứu
    if (project.members?.some((m) => m.id === reviewerId || m.fullName === reviewerId)) return true;
    return false;
  };

  // Kiểm tra toàn bộ có lỗi xung đột nào chưa giải quyết không
  const hasAnyConflict = formData.selectedProjectIds.some((pId) => {
    const assign = formData.projectAssignments[pId];
    if (!assign) return false;
    return (
      checkConflictOfInterest(pId, assign.reviewer1Id) ||
      checkConflictOfInterest(pId, assign.reviewer2Id)
    );
  });

  const handleSaveCouncil = (isOfficialIssuance: boolean) => {
    if (!formData.name.trim()) {
      warning('Vui lòng nhập tên Hội đồng khoa học', 'Thiếu thông tin');
      return;
    }

    if (formData.selectedProjectIds.length === 0) {
      warning('Vui lòng chọn ít nhất 01 đề tài cho Hội đồng đánh giá', 'Chưa có đề tài');
      return;
    }

    if (hasAnyConflict) {
      error(
        'Phát hiện xung đột lợi ích: Có Bác sĩ phản biện trùng với Chủ nhiệm hoặc thành viên nhóm nghiên cứu. Vui lòng chọn lại phản biện độc lập!',
        'Vi phạm quy chế Đạo đức & NCKH'
      );
      return;
    }

    const actionTitle = isOfficialIssuance
      ? 'Xác nhận Ban hành Quyết định & Gửi Giấy mời họp'
      : 'Lưu Dự thảo Quyết định Thành lập Hội đồng';

    const actionMsg = isOfficialIssuance
      ? `Hội đồng "${formData.name}" sẽ chính thức có hiệu lực theo Quyết định số ${formData.establishmentDecisionNumber}. Hệ thống sẽ tự động gửi Giấy mời họp kèm hồ sơ đề cương cho tất cả các thành viên qua Email/Zalo.`
      : `Hệ thống sẽ lưu hồ sơ Quyết định thành lập Hội đồng ở trạng thái DỰ THẢO để trình Trưởng phòng NCKH và Ban Giám đốc Bệnh viện phê duyệt.`;

    confirm({
      title: actionTitle,
      message: actionMsg,
      confirmLabel: isOfficialIssuance ? 'Ban hành & Gửi Giấy mời' : 'Lưu Dự thảo',
      type: isOfficialIssuance ? 'info' : 'warning',
      onConfirm: () => {
        const projectAssignmentsList: CouncilProjectAssignment[] = formData.selectedProjectIds.map((pId) => {
          const assign = formData.projectAssignments[pId] || {
            reviewer1Id: '',
            reviewer1Name: '',
            reviewer2Id: '',
            reviewer2Name: '',
            notes: '',
          };
          return {
            projectId: pId,
            reviewer1Id: assign.reviewer1Id,
            reviewer1Name: assign.reviewer1Name,
            reviewer2Id: assign.reviewer2Id,
            reviewer2Name: assign.reviewer2Name,
            notes: assign.notes,
          };
        });

        const newCouncil: Council = {
          id: `council-${Date.now()}`,
          code: formData.code,
          name: formData.name,
          type: formData.type,
          specialtyCluster: formData.specialtyCluster,
          establishmentDecisionNumber: isOfficialIssuance
            ? formData.establishmentDecisionNumber || `QĐ-${new Date().getFullYear()}/QĐ-BV`
            : `(Dự thảo trình duyệt)`,
          decisionDate: formData.decisionDate,
          decisionStatus: isOfficialIssuance ? 'ISSUED' : 'DRAFT',
          signatoryName: formData.signatoryName,
          signatoryRole: formData.signatoryRole,
          meetingDate: formData.meetingDate,
          meetingTime: formData.meetingTime,
          meetingFormat: formData.meetingFormat,
          location: formData.location,
          onlineMeetingUrl: formData.meetingFormat !== 'OFFLINE' ? formData.onlineMeetingUrl : undefined,
          sendInvitationNotification: formData.sendInvitationNotification,
          minPassRatio: 0.6,
          status: isOfficialIssuance ? 'ESTABLISHED' : 'ESTABLISHED',
          members: [
            {
              id: `m-${Date.now()}-1`,
              councilId: `council-${Date.now()}`,
              userId: formData.chairId,
              userFullName: formData.chairName,
              academicTitle: 'Chủ tịch Hội đồng',
              departmentName: 'Ban Giám đốc Bệnh viện',
              roleInCouncil: 'CHỦ_TỊCH',
              hasConflictOfInterest: false,
              evaluationSubmitted: false,
            },
            {
              id: `m-${Date.now()}-2`,
              councilId: `council-${Date.now()}`,
              userId: formData.secretaryId,
              userFullName: formData.secretaryName,
              academicTitle: 'Thư ký khoa học',
              departmentName: 'Phòng Quản lý NCKH',
              roleInCouncil: 'THƯ_KÝ',
              hasConflictOfInterest: false,
              evaluationSubmitted: false,
            },
            {
              id: `m-${Date.now()}-3`,
              councilId: `council-${Date.now()}`,
              userId: formData.member1Id,
              userFullName: formData.member1Name,
              academicTitle: 'Ủy viên thường trực',
              departmentName: 'Khoa Hồi sức tích cực',
              roleInCouncil: 'ỦY_VIÊN',
              hasConflictOfInterest: false,
              evaluationSubmitted: false,
            },
            {
              id: `m-${Date.now()}-4`,
              councilId: `council-${Date.now()}`,
              userId: formData.member2Id,
              userFullName: formData.member2Name,
              academicTitle: 'Ủy viên thường trực',
              departmentName: 'Hội đồng Đạo đức Y sinh',
              roleInCouncil: 'ỦY_VIÊN',
              hasConflictOfInterest: false,
              evaluationSubmitted: false,
            },
            {
              id: `m-${Date.now()}-5`,
              councilId: `council-${Date.now()}`,
              userId: formData.member3Id,
              userFullName: formData.member3Name,
              academicTitle: 'Ủy viên thường trực',
              departmentName: 'Khoa Xét nghiệm',
              roleInCouncil: 'ỦY_VIÊN',
              hasConflictOfInterest: false,
              evaluationSubmitted: false,
            },
          ],
          projectIds: formData.selectedProjectIds,
          projectAssignments: projectAssignmentsList,
          scoringCriteriaSet: [
            { id: 'crit-1', name: 'Tính cấp thiết và tính mới của nghiên cứu', maxScore: 20 },
            { id: 'crit-2', name: 'Mục tiêu, đối tượng và phương pháp nghiên cứu', maxScore: 30 },
            { id: 'crit-3', name: 'Tính khả thi và năng lực tổ chức triển khai', maxScore: 20 },
            { id: 'crit-4', name: 'Hiệu quả khoa học, thực tiễn & khả năng ứng dụng lâm sàng', maxScore: 20 },
            { id: 'crit-5', name: 'Dự toán kinh phí hợp lý, đúng quy định', maxScore: 10 },
          ],
          evaluationResults: [],
        };

        repo.createCouncil(newCouncil);
        setCouncils(repo.getCouncils());
        setShowCreateModal(false);
        setModalStep(1);

        if (isOfficialIssuance) {
          success(`Đã ban hành Quyết định & Thành lập Hội đồng ${newCouncil.code} thành công! Đã gửi giấy mời họp.`);
        } else {
          success(`Đã lưu Dự thảo Quyết định thành lập Hội đồng ${newCouncil.code}.`);
        }
      },
    });
  };

  const hasFilters = filterType !== 'ALL' || search.trim();

  return (
    <div className="space-y-3 text-slate-800">
      {/* ── Toolbar: Search + Actions trên 1 hàng ── */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên hội đồng, số quyết định..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] text-[13px] outline-none bg-white shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
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

        {['DIRECTOR', 'RESEARCH_OFFICE', 'ADMIN'].includes(currentUser.role) && (
          <button
            onClick={() => {
              setModalStep(1);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold px-3.5 py-2 rounded-lg text-[13px] shadow-xs transition whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Thành lập hội đồng mới
          </button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-2.5">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className={`py-1.5 px-3 rounded-lg border text-[13px] font-medium outline-none transition ${
            filterType !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả loại hội đồng</option>
          <option value="PROPOSAL_REVIEW">Hội đồng xét duyệt đề cương</option>
          <option value="ACCEPTANCE_REVIEW">Hội đồng nghiệm thu</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              setFilterType('ALL');
              setSearch('');
            }}
            className="text-[12px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 transition"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400 font-medium">
          <strong className="text-slate-700 font-mono font-bold">{filteredCouncils.length}</strong> / {councils.length} hội đồng
        </span>
      </div>

      {/* 3. Modern Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 w-32 whitespace-nowrap">MÃ HỘI ĐỒNG</th>
                <th className="px-5 py-3 min-w-[280px]">TÊN HỘI ĐỒNG & KHỐI CHUYÊN MÔN</th>
                <th className="px-5 py-3 w-48 whitespace-nowrap">HÌNH THỨC & LỊCH HỌP</th>
                <th className="px-5 py-3 w-44 whitespace-nowrap">CHỦ TỊCH / THƯ KÝ</th>
                <th className="px-5 py-3 w-36 whitespace-nowrap">QUYẾT ĐỊNH & TT</th>
                <th className="px-5 py-3 text-center w-28 whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCouncils.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Không tìm thấy hội đồng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                pagedCouncils.map((c) => {
                  const chair = c.members.find((m) => m.roleInCouncil === 'CHỦ_TỊCH');
                  const secretary = c.members.find((m) => m.roleInCouncil === 'THƯ_KÝ');

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#0A6EBD] whitespace-nowrap align-middle">
                        <Link href={`/councils/${c.id}`} className="hover:underline">
                          {c.code}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <Link
                          href={`/councils/${c.id}`}
                          className="font-semibold text-slate-900 hover:text-[#0A6EBD] transition block leading-snug"
                        >
                          {c.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {c.type === 'PROPOSAL_REVIEW' ? 'Xét duyệt đề cương' : 'Nghiệm thu kết quả'}
                          </span>
                          {c.specialtyCluster && (
                            <span className="text-[#0A6EBD] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 font-medium">
                              {c.specialtyCluster}
                            </span>
                          )}
                          <span>• {c.projectIds.length} đề tài</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-700 align-middle">
                        <p className="font-semibold text-slate-800 font-mono flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#0A6EBD]" />
                          {c.meetingDate} {c.meetingTime && `(${c.meetingTime})`}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                          {c.meetingFormat === 'ONLINE' ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                              <Video className="w-3 h-3" /> Trực tuyến
                            </span>
                          ) : c.meetingFormat === 'HYBRID' ? (
                            <span className="text-indigo-700 font-medium flex items-center gap-0.5">
                              <Building2 className="w-3 h-3" /> Kết hợp Hybrid
                            </span>
                          ) : (
                            <span className="text-slate-600 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" /> Trực tiếp
                            </span>
                          )}
                          <span className="truncate max-w-[150px]">• {c.location}</span>
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] align-middle">
                        <p className="font-semibold text-slate-900">{chair?.userFullName || 'Chưa chỉ định'}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Thư ký: {secretary?.userFullName || 'Chưa chỉ định'}</p>
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        {c.establishmentDecisionNumber ? (
                          <div className="space-y-1">
                            <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded block truncate max-w-[140px]">
                              {c.establishmentDecisionNumber}
                            </span>
                            <StatusBadge status={c.status} />
                          </div>
                        ) : (
                          <StatusBadge status={c.status} />
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/councils/${c.id}`}
                            title="Workspace Chấm điểm & Lập Biên bản"
                            className="px-2 py-1 bg-[#EBF4FC] hover:bg-[#D8ECF9] text-[#0A6EBD] rounded-lg border border-[#B8D7F5] font-semibold text-[11px] inline-flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> Workspace
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
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

      {/* ========================================================================= */}
      {/* MODAL THÀNH LẬP HỘI ĐỒNG CHUẨN NGHIỆP VỤ BỆNH VIỆN (3 BƯỚC) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in my-8 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-sky-50 text-[#0A6EBD] border border-sky-200 rounded text-[11px] font-bold font-mono">
                    TT 09/2024 & TT 43/2024/TT-BYT
                  </span>
                  <h2 className="text-[17px] font-bold text-slate-900">
                    Thành lập Hội đồng Khoa học & Công nghệ Bệnh viện
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lập quyết định thành lập, cơ cấu 05–07 thành viên và phân công phản biện độc lập chống xung đột lợi ích
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Wizard Bar */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                  modalStep === 1
                    ? 'bg-white text-[#0A6EBD] shadow-xs border border-sky-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#0A6EBD] text-white flex items-center justify-center text-[11px] font-bold">
                  1
                </span>
                <span>Thông tin & Pháp lý</span>
              </button>

              <button
                type="button"
                onClick={() => setModalStep(2)}
                className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                  modalStep === 2
                    ? 'bg-white text-[#0A6EBD] shadow-xs border border-sky-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#0A6EBD] text-white flex items-center justify-center text-[11px] font-bold">
                  2
                </span>
                <span>Cơ cấu Thường trực</span>
              </button>

              <button
                type="button"
                onClick={() => setModalStep(3)}
                className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                  modalStep === 3
                    ? 'bg-white text-[#0A6EBD] shadow-xs border border-sky-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#0A6EBD] text-white flex items-center justify-center text-[11px] font-bold">
                  3
                </span>
                <span>Đề tài & Phản biện (COI)</span>
                {hasAnyConflict && (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                )}
              </button>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* ========================================================================= */}
              {/* BƯỚC 1: THÔNG TIN CHUNG & QUYẾT ĐỊNH PHÁP LÝ */}
              {/* ========================================================================= */}
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-sky-50/70 border border-sky-200 p-3 rounded-xl flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-[#0A6EBD] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#0A6EBD]">Quy chế Pháp lý & Ban hành Quyết định</p>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        Theo Thông tư 09/2024/TT-BYT, Hội đồng chỉ có thẩm quyền chấm điểm khi có Quyết định thành lập do Giám đốc Bệnh viện ký ban hành và cấp số văn thư chính thức.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mã Hội đồng *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[13px] bg-slate-50 font-bold text-[#0A6EBD]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Loại Hội đồng *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-[13px] bg-white font-medium"
                      >
                        <option value="PROPOSAL_REVIEW">Hội đồng Xét duyệt & Thẩm định Đề cương</option>
                        <option value="ACCEPTANCE_REVIEW">Hội đồng Đánh giá & Nghiệm thu Kết quả</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tên Hội đồng Khoa học *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="VD: Hội đồng Đánh giá Đề cương Đợt 1 Năm 2026"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-[13px]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Khối Chuyên môn / Chuyên ngành</label>
                      <select
                        value={formData.specialtyCluster}
                        onChange={(e) => setFormData({ ...formData, specialtyCluster: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-[13px] bg-white font-medium text-[#0A6EBD]"
                      >
                        {SPECIALTY_CLUSTERS.map((sc) => (
                          <option key={sc.id} value={sc.name}>
                            {sc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      Quyết định thành lập (Do Giám đốc Bệnh viện ký)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Số Quyết định (Dự thảo / Ban hành)</label>
                        <input
                          type="text"
                          value={formData.establishmentDecisionNumber}
                          onChange={(e) => setFormData({ ...formData, establishmentDecisionNumber: e.target.value })}
                          placeholder="VD: 142/QĐ-BV-NCKH"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-[13px] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Ngày ký Quyết định</label>
                        <input
                          type="text"
                          value={formData.decisionDate}
                          onChange={(e) => setFormData({ ...formData, decisionDate: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[13px] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Thẩm quyền ký duyệt</label>
                        <input
                          type="text"
                          value={formData.signatoryName}
                          disabled
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-[13px] bg-slate-100 text-slate-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hình thức họp</label>
                      <select
                        value={formData.meetingFormat}
                        onChange={(e) => setFormData({ ...formData, meetingFormat: e.target.value as any })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[13px] bg-white font-medium"
                      >
                        <option value="OFFLINE">Trực tiếp (Offline)</option>
                        <option value="ONLINE">Trực tuyến (Online)</option>
                        <option value="HYBRID">Kết hợp (Hybrid)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ngày họp *</label>
                      <input
                        type="text"
                        value={formData.meetingDate}
                        onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[13px]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Giờ họp *</label>
                      <input
                        type="text"
                        value={formData.meetingTime}
                        onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[13px]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Địa điểm phòng họp *</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[13px]"
                        required
                      />
                    </div>
                  </div>

                  {formData.meetingFormat !== 'OFFLINE' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-[#0A6EBD]" /> Đường dẫn họp trực tuyến (MS Teams / Zoom)
                      </label>
                      <input
                        type="url"
                        value={formData.onlineMeetingUrl}
                        onChange={(e) => setFormData({ ...formData, onlineMeetingUrl: e.target.value })}
                        placeholder="https://meet.hospital.gov.vn/hoi-dong-nckh"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-[13px] font-mono text-[#0A6EBD]"
                      />
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendInviteNotification"
                      checked={formData.sendInvitationNotification}
                      onChange={(e) => setFormData({ ...formData, sendInvitationNotification: e.target.checked })}
                      className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD] w-4 h-4"
                    />
                    <label htmlFor="sendInviteNotification" className="text-slate-800 font-medium cursor-pointer text-xs">
                      Tự động xuất <strong>Giấy mời họp (BM-HĐ-00)</strong> và gửi email/Zalo đính kèm file Đề cương nghiên cứu (PDF) cho các thành viên Hội đồng trước 3–5 ngày theo quy chế.
                    </label>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* BƯỚC 2: CƠ CẤU THƯỜNG TRỰC HỘI ĐỒNG (5 THÀNH VIÊN SỐ LẺ) */}
              {/* ========================================================================= */}
              {modalStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-[#0A6EBD] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#0A6EBD]">Cơ cấu Hội đồng thường trực (Toàn phiên họp)</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Chủ tịch, Thư ký khoa học và các Ủy viên thường trực điều hành và chấm điểm chung cho toàn phiên họp. Phản biện 1 và 2 sẽ được phân công chuyên sâu theo từng đề tài ở Bước 3.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Chủ tịch */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="block font-bold text-slate-800 text-[13px] flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600" />
                        Chủ tịch Hội đồng *
                      </label>
                      <select
                        value={formData.chairId}
                        onChange={(e) => {
                          const doc = doctorsList.find((d) => d.id === e.target.value);
                          setFormData({
                            ...formData,
                            chairId: e.target.value,
                            chairName: doc?.fullName || '',
                          });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-[13px] bg-white font-semibold"
                      >
                        {doctorsList.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.fullName} ({d.academicTitle} - {d.departmentId})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500">Ban Giám đốc hoặc Trưởng khoa đầu ngành điều hành phiên họp</p>
                    </div>

                    {/* Thư ký */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="block font-bold text-slate-800 text-[13px] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#0A6EBD]" />
                        Ủy viên Thư ký khoa học *
                      </label>
                      <select
                        value={formData.secretaryId}
                        onChange={(e) => {
                          const doc = doctorsList.find((d) => d.id === e.target.value);
                          setFormData({
                            ...formData,
                            secretaryId: e.target.value,
                            secretaryName: doc?.fullName || '',
                          });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-[13px] bg-white font-semibold"
                      >
                        {doctorsList.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.fullName} ({d.academicTitle})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500">Phụ trách tổng hợp điểm số và lập Biên bản họp (BM-HĐ-02)</p>
                    </div>
                  </div>

                  {/* Các Ủy viên thường trực */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        Các Ủy viên Hội đồng thường trực (03 thành viên)
                      </h4>
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        Tổng số thành viên: 05 (Số lẻ)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Ủy viên 1 *</label>
                        <select
                          value={formData.member1Id}
                          onChange={(e) => {
                            const doc = doctorsList.find((d) => d.id === e.target.value);
                            setFormData({
                              ...formData,
                              member1Id: e.target.value,
                              member1Name: doc?.fullName || '',
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[13px] bg-white"
                        >
                          {doctorsList.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.fullName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Ủy viên 2 (Đạo đức/Dược) *</label>
                        <select
                          value={formData.member2Id}
                          onChange={(e) => {
                            const doc = doctorsList.find((d) => d.id === e.target.value);
                            setFormData({
                              ...formData,
                              member2Id: e.target.value,
                              member2Name: doc?.fullName || '',
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[13px] bg-white"
                        >
                          {doctorsList.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.fullName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Ủy viên 3 (Cận lâm sàng) *</label>
                        <select
                          value={formData.member3Id}
                          onChange={(e) => {
                            const doc = doctorsList.find((d) => d.id === e.target.value);
                            setFormData({
                              ...formData,
                              member3Id: e.target.value,
                              member3Name: doc?.fullName || '',
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[13px] bg-white"
                        >
                          {doctorsList.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="absentCheck"
                        checked={formData.memberAbsentWithWrittenReview}
                        onChange={(e) => setFormData({ ...formData, memberAbsentWithWrittenReview: e.target.checked })}
                        className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD]"
                      />
                      <label htmlFor="absentCheck" className="text-slate-600 text-[11px] cursor-pointer">
                        Ủy viên có trường hợp bận phẫu thuật/cấp cứu đột xuất được phép gửi <strong>Phiếu nhận xét trước bằng văn bản</strong> (Vắng mặt có lý do hợp lệ).
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* BƯỚC 3: GÁN ĐỀ TÀI & PHÂN CÔNG PHẢN BIỆN CHUYÊN SÂU (COI REALTIME) */}
              {/* ========================================================================= */}
              {modalStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">
                        Phân công Phản biện chuyên sâu & Chống Xung đột Lợi ích (Conflict of Interest)
                      </p>
                      <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                        Mỗi đề tài được phân công <strong>02 Bác sĩ / Chuyên gia phản biện độc lập</strong> theo đúng chuyên khoa. Hệ thống tự động kiểm tra và ngăn chặn các bác sĩ trùng với Chủ nhiệm đề tài hoặc thành viên nhóm nghiên cứu.
                      </p>
                    </div>
                  </div>

                  {/* Danh sách đề tài */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-[13px] flex items-center justify-between">
                      <span>Chọn đề tài thẩm định & Phân công Phản biện ({formData.selectedProjectIds.length} đã chọn):</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Click chọn checkbox để gán đề tài vào Hội đồng
                      </span>
                    </h4>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {availableProjects.map((p) => {
                        const isSelected = formData.selectedProjectIds.includes(p.id);
                        const assignment = formData.projectAssignments[p.id] || {
                          reviewer1Id: '',
                          reviewer1Name: '',
                          reviewer2Id: '',
                          reviewer2Name: '',
                          notes: '',
                        };

                        const isRev1Conflict = checkConflictOfInterest(p.id, assignment.reviewer1Id);
                        const isRev2Conflict = checkConflictOfInterest(p.id, assignment.reviewer2Id);

                        return (
                          <div
                            key={p.id}
                            className={`rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-white border-[#0A6EBD] shadow-sm'
                                : 'bg-slate-50/70 border-slate-200 opacity-80 hover:opacity-100'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="p-3 flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleProject(p)}
                                className="mt-1 w-4 h-4 rounded text-[#0A6EBD] focus:ring-[#0A6EBD] cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-[#0A6EBD]">
                                    [{p.projectCode || p.proposalCode}]
                                  </span>
                                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                    {p.departmentName}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    Chủ nhiệm: <strong className="text-slate-800">{p.principalInvestigatorName}</strong>
                                  </span>
                                </div>
                                <h5 className="font-bold text-slate-900 text-[13px] mt-1 leading-snug">
                                  {p.title}
                                </h5>
                              </div>
                            </div>

                            {/* Expanded Reviewer Assignment Panel */}
                            {isSelected && (
                              <div className="p-3.5 bg-[#F8FAFC] border-t border-slate-100 rounded-b-xl space-y-3 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Phản biện 1 */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="font-bold text-slate-700 flex items-center gap-1">
                                        <span>Phản biện 1 *</span>
                                      </label>
                                      {isRev1Conflict && (
                                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                          ⚠️ Xung đột lợi ích!
                                        </span>
                                      )}
                                    </div>
                                    <select
                                      value={assignment.reviewer1Id}
                                      onChange={(e) =>
                                        handleUpdateProjectReviewer(p.id, 'reviewer1', e.target.value)
                                      }
                                      className={`w-full px-3 py-1.5 rounded-lg border text-[12px] bg-white font-medium ${
                                        isRev1Conflict
                                          ? 'border-rose-400 text-rose-700 bg-rose-50/50'
                                          : 'border-slate-300 text-slate-800'
                                      }`}
                                    >
                                      <option value="">-- Chọn Bác sĩ Phản biện 1 --</option>
                                      {doctorsList.map((d) => {
                                        const isConflict = checkConflictOfInterest(p.id, d.id);
                                        return (
                                          <option
                                            key={d.id}
                                            value={d.id}
                                            disabled={isConflict}
                                            className={isConflict ? 'text-rose-500 bg-rose-50 font-bold' : ''}
                                          >
                                            {d.fullName} ({d.academicTitle}) {isConflict ? '[Trùng nhóm NC - Cấm]' : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    {isRev1Conflict && (
                                      <p className="text-[10px] text-rose-600 mt-1 font-semibold">
                                        Bác sĩ là Chủ nhiệm hoặc thành viên đề tài này, không được phản biện!
                                      </p>
                                    )}
                                  </div>

                                  {/* Phản biện 2 */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="font-bold text-slate-700 flex items-center gap-1">
                                        <span>Phản biện 2 *</span>
                                      </label>
                                      {isRev2Conflict && (
                                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                          ⚠️ Xung đột lợi ích!
                                        </span>
                                      )}
                                    </div>
                                    <select
                                      value={assignment.reviewer2Id}
                                      onChange={(e) =>
                                        handleUpdateProjectReviewer(p.id, 'reviewer2', e.target.value)
                                      }
                                      className={`w-full px-3 py-1.5 rounded-lg border text-[12px] bg-white font-medium ${
                                        isRev2Conflict
                                          ? 'border-rose-400 text-rose-700 bg-rose-50/50'
                                          : 'border-slate-300 text-slate-800'
                                      }`}
                                    >
                                      <option value="">-- Chọn Bác sĩ Phản biện 2 --</option>
                                      {doctorsList.map((d) => {
                                        const isConflict = checkConflictOfInterest(p.id, d.id);
                                        return (
                                          <option
                                            key={d.id}
                                            value={d.id}
                                            disabled={isConflict}
                                            className={isConflict ? 'text-rose-500 bg-rose-50 font-bold' : ''}
                                          >
                                            {d.fullName} ({d.academicTitle}) {isConflict ? '[Trùng nhóm NC - Cấm]' : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    {isRev2Conflict && (
                                      <p className="text-[10px] text-rose-600 mt-1 font-semibold">
                                        Bác sĩ là Chủ nhiệm hoặc thành viên đề tài này, không được phản biện!
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    placeholder="Ghi chú yêu cầu thẩm định riêng cho đề tài này (nếu có)..."
                                    value={assignment.notes}
                                    onChange={(e) =>
                                      handleUpdateProjectReviewer(p.id, 'notes', e.target.value)
                                    }
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] bg-white text-slate-700"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="border-t border-slate-200 pt-3.5 flex items-center justify-between shrink-0">
              <div>
                {modalStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setModalStep((prev) => (prev - 1) as any)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
                  >
                    ← Quay lại
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
                >
                  Hủy bỏ
                </button>

                {modalStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setModalStep((prev) => (prev + 1) as any)}
                    className="px-4 py-1.5 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition"
                  >
                    Tiếp tục Bước {modalStep + 1} →
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveCouncil(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-[#0A6EBD] text-[#0A6EBD] hover:bg-[#EBF4FC] font-bold text-xs shadow-xs transition flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Lưu Dự thảo Quyết định
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveCouncil(true)}
                      disabled={hasAnyConflict}
                      className={`px-4 py-1.5 rounded-lg text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition ${
                        hasAnyConflict
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" /> Ban hành QĐ & Gửi Giấy mời
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
    <Suspense
      fallback={<div className="p-8 text-center text-slate-500">Đang tải dữ liệu hội đồng...</div>}
    >
      <CouncilsContent />
    </Suspense>
  );
}
