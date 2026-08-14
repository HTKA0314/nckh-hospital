'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { ResearchProject, DocumentType, FundingSource, ProjectType, ResearchMemberRole, ProjectStatusHistory } from '@/lib/types';
import { formatVND } from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  DollarSign,
  Save,
  FileText,
  Users,
  X,
} from 'lucide-react';

export default function RegisterProjectPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const backLink = '/my-projects';

  const departments = repo.getDepartments();
  const rounds = repo.getRounds().filter((r) => r.status === 'OPEN');
  const policies = repo.getPolicies();

  // I. Thông tin chung
  const [roundId, setRoundId] = useState(rounds[0]?.id || 'round-2026-01');
  const [title, setTitle] = useState('');
  const [researchField, setResearchField] = useState('Khoa học Y Dược');
  const [managementLevel, setManagementLevel] = useState<'CẤP_CƠ_SỞ' | 'CẤP_BỘ' | 'CẤP_TỈNH' | 'CẤP_QUỐC_GIA'>('CẤP_CƠ_SỞ');
  const [projectType, setProjectType] = useState<ProjectType>('NGHIÊN_CỨU_LÂM_SÀNG');
  const [summary, setSummary] = useState('');

  // II. Thông tin nhân sự & Tiến độ
  const [piName, setPiName] = useState(currentUser?.fullName || '');
  const [departmentId, setDepartmentId] = useState(currentUser?.departmentId || departments[0]?.id || '');
  const [estimatedBudget, setEstimatedBudget] = useState(250000000);
  const [fundingSource, setFundingSource] = useState<FundingSource>('NGÂN_SÁCH_BỆNH_VIỆN');
  const [hasFunding, setHasFunding] = useState(true);

  // III. Thành viên tham gia nghiên cứu
  const [members, setMembers] = useState<
    {
      id: string;
      fullName: string;
      academicRank: string;
      unit: string;
      roleInProject: ResearchMemberRole;
      contributionPercentage: number;
    }[]
  >([]);

  // Member Modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRank, setNewMemberRank] = useState('BS');
  const [newMemberUnit, setNewMemberUnit] = useState('Khoa Khám bệnh');
  const [newMemberRole, setNewMemberRole] = useState<ResearchMemberRole>('THÀNH_VIÊN_CHÍNH');
  const [newMemberPercent, setNewMemberPercent] = useState(20);

  // IV. Cấu hình Quy trình & Hồ sơ
  const [selectedPolicyId, setSelectedPolicyId] = useState(policies[0]?.id || 'policy-a');
  const activePolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0];

  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; type: DocumentType; name: string; size: string }[]
  >([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
    if (!currentUser) return;

    setPiName(currentUser.fullName);
    setDepartmentId(currentUser.departmentId || departments[0]?.id || '');

    setMembers([
      {
        id: 'm-1',
        fullName: currentUser.fullName,
        academicRank: currentUser.academicTitle || 'ThS.BS',
        unit: departments.find((d) => d.id === (currentUser.departmentId || departments[0]?.id))?.name || 'Khoa Nội',
        roleInProject: 'CHỦ_NHIỆM',
        contributionPercentage: 50,
      },
    ]);

    const editId = searchParams.get('draftId') || searchParams.get('projectId');
    if (!editId) return;

    const projectToEdit = repo.getProjectById(editId);
    if (!projectToEdit) return;

    setEditingProjectId(editId);
    setEditingProject(projectToEdit);
    setRoundId(projectToEdit.registrationRoundId || rounds[0]?.id || 'round-2026-01');
    setTitle(projectToEdit.title || '');
    setResearchField(projectToEdit.researchField || 'Khoa học Y Dược');
    setManagementLevel(projectToEdit.managementLevel || 'CẤP_CƠ_SỞ');
    setProjectType(projectToEdit.projectType || 'NGHIÊN_CỨU_LÂM_SÀNG');
    setSummary(projectToEdit.summary || '');
    setPiName(projectToEdit.principalInvestigatorName || currentUser.fullName);
    setDepartmentId(projectToEdit.departmentId || currentUser.departmentId || departments[0]?.id || '');
    setEstimatedBudget(projectToEdit.estimatedBudget || 250000000);
    setFundingSource(projectToEdit.fundingSource || 'NGÂN_SÁCH_BỆNH_VIỆN');
    setHasFunding((projectToEdit.estimatedBudget ?? 0) > 0);
    setSelectedPolicyId(projectToEdit.workflowPolicyId || policies[0]?.id || 'policy-a');
    setUploadedFiles(
      (projectToEdit.documents || []).map((doc) => ({
        id: doc.id,
        type: doc.documentType,
        name: doc.title,
        size: doc.versions?.[0]?.fileSize || '1.0 MB',
      }))
    );
    if (projectToEdit.members && projectToEdit.members.length > 0) {
      setMembers(projectToEdit.members);
    }
  }, [searchParams, currentUser]);

  const editingRound = editingProject?.registrationRoundId ? repo.getRoundById(editingProject.registrationRoundId) : undefined;
  const selectableRounds = editingRound && !rounds.some((round) => round.id === editingRound.id) ? [editingRound, ...rounds] : rounds;

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      warning('Vui lòng nhập họ tên thành viên tham gia nghiên cứu.');
      return;
    }
    if (newMemberPercent < 0 || newMemberPercent > 100) {
      warning('Tỷ lệ đóng góp phải nằm trong khoảng 0–100%.');
      return;
    }
    if (newMemberRole === 'CHỦ_NHIỆM' && members.some((member) => member.roleInProject === 'CHỦ_NHIỆM')) {
      warning('Mỗi đề tài chỉ được có 01 Chủ nhiệm đề tài.');
      return;
    }

    setMembers([
      ...members,
      {
        id: `m-${Date.now()}`,
        fullName: newMemberName.trim(),
        academicRank: newMemberRank,
        unit: newMemberUnit,
        roleInProject: newMemberRole,
        contributionPercentage: Number(newMemberPercent),
      },
    ]);
    success(`Đã thêm thành viên ${newMemberName.trim()} vào danh sách nghiên cứu`);
    setNewMemberName('');
    setShowMemberModal(false);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) {
      warning('Đề tài phải có ít nhất Chủ nhiệm đề tài.');
      return;
    }
    setMembers(members.filter((m) => m.id !== id));
    success('Đã xóa thành viên khỏi nhóm nghiên cứu');
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
    success('Đã xóa tệp đính kèm');
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>, documentType: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > 25) {
      warning('Dung lượng tệp không được vượt quá 25 MB.');
      e.target.value = '';
      return;
    }

    setUploadedFiles((current) => [
      ...current,
      {
        id: `f-${Date.now()}`,
        type: documentType,
        name: file.name,
        size: `${fileSizeMb.toFixed(1)} MB`,
      },
    ]);

    e.target.value = '';
    success(`Đã chọn tệp: ${file.name}`);
  };

  const handleSaveOrSubmit = (action: 'DRAFT' | 'SUBMIT') => {
    if (action === 'SUBMIT') {
      if (!title.trim()) {
        error('Vui lòng điền Tên đề tài nghiên cứu ở Bước 1.');
        setCurrentStep(1);
        return;
      }
      if (!roundId) {
        error('Vui lòng chọn đợt đăng ký đang mở.');
        setCurrentStep(1);
        return;
      }
      if (members.filter((member) => member.roleInProject === 'CHỦ_NHIỆM').length !== 1) {
        error('Đề tài phải có đúng 01 Chủ nhiệm.');
        setCurrentStep(2);
        return;
      }
      const contributionTotal = members.reduce((sum, member) => sum + Number(member.contributionPercentage || 0), 0);
      if (contributionTotal !== 100) {
        error(`Tổng tỷ lệ đóng góp của nhóm nghiên cứu phải bằng 100% (hiện tại ${contributionTotal}%).`);
        setCurrentStep(2);
        return;
      }
    }

    const selectedRound = repo.getRoundById(roundId) || rounds.find((round) => round.id === roundId);
    if (!selectedRound) {
      error('Đợt đăng ký không hợp lệ hoặc không còn mở.');
      return;
    }
    const selectedDept = departments.find((d) => d.id === departmentId) || departments[0];

    const proposalCode = editingProject?.proposalCode || `DX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const projectId = editingProjectId || `proj-${Date.now()}`;
    const now = new Date().toISOString();

    const targetStatus = action === 'SUBMIT' ? 'SUBMITTED' : 'DRAFT';
    const proposalStatus = action === 'SUBMIT'
      ? editingProject?.proposalStatus === 'REVISION_REQUIRED'
        ? 'RESUBMITTED'
        : 'SUBMITTED'
      : editingProject?.proposalStatus || 'DRAFT';

    const historyEntry: ProjectStatusHistory = {
      id: `h-${Date.now()}`,
      projectId,
      fromStatus: editingProject?.status || 'NONE',
      toStatus: targetStatus,
      changedBy: currentUser?.id || '',
      changedByName: currentUser?.fullName || '',
      userRole: currentUser?.role || 'RESEARCHER',
      changedAt: now,
      action: action === 'SUBMIT' ? (editingProjectId ? 'Nộp lại đề xuất' : 'Nộp đề xuất đề tài') : 'Lưu nháp đề tài',
    };

    const updatedProject: ResearchProject = {
      ...(editingProject || {}),
      id: projectId,
      workflowPolicyId: selectedPolicyId,
      projectCategory: editingProject?.projectCategory || 'CAP_CO_SO',
      acceptanceAuthority: editingProject?.acceptanceAuthority || 'BENH_VIEN',
      scientificReviewStatus: editingProject?.scientificReviewStatus || 'REQUIRED',
      proposalCode,
      title,
      summary: summary || 'Tóm tắt nội dung đề xuất nghiên cứu khoa học cơ sở...',
      researchField,
      managementLevel,
      projectType,
      principalInvestigatorId: currentUser?.id || '',
      principalInvestigatorName: piName || currentUser?.fullName || '',
      departmentId: selectedDept?.id || '',
      departmentName: selectedDept?.name || '',
      startDate: editingProject?.startDate || '',
      endDate: editingProject?.endDate || '',
      estimatedBudget: hasFunding ? estimatedBudget : 0,
      approvedBudget: editingProject?.approvedBudget ?? 0,
      fundingSource: hasFunding ? fundingSource : 'TỰ_TÚC',
      reportedProgressPercentage: editingProject?.reportedProgressPercentage ?? 0,
      status: targetStatus,
      proposalStatus,
      ethicsRequired: editingProject?.ethicsRequired ?? false,
      ethicsStatus: editingProject?.ethicsStatus || 'NOT_REQUIRED',
      registrationRoundId: selectedRound.id,
      registrationRoundName: selectedRound.name,
      createdAt: editingProject?.createdAt || now,
      submittedAt: action === 'SUBMIT' ? now : editingProject?.submittedAt,
      members: members.map((m) => ({ ...m, projectId })),
      documents: uploadedFiles.map((file, index) => {
        const documentId = file.id || `doc-${index + 1}`;
        return {
          id: documentId,
          projectId,
          documentType: file.type,
          title: file.name,
          currentVersion: 1,
          currentVersionId: `${documentId}-v1`,
          versions: [
            {
              id: `${documentId}-v1`,
              documentId,
              version: 1,
              fileName: file.name,
              fileSize: file.size,
              uploadedBy: currentUser?.id || '',
              uploadedByName: currentUser?.fullName || '',
              uploadedAt: now,
              downloadUrl: '',
              isCurrent: true,
            },
          ],
        };
      }),
      milestones: editingProject?.milestones || [],
      progressReports: editingProject?.progressReports || [],
      changeRequests: editingProject?.changeRequests || [],
      financeStatus: editingProject?.financeStatus ?? 'PENDING',
      decisions: editingProject?.decisions || [],
      statusHistory: [...(editingProject?.statusHistory || []), historyEntry],
    };

    if (editingProjectId) {
      repo.updateProject(editingProjectId, updatedProject);
    } else {
      if (typeof repo.createProject === 'function') {
        repo.createProject(updatedProject);
      } else if (typeof (repo as any).addProject === 'function') {
        (repo as any).addProject(updatedProject);
      }
    }

    repo.addAuditLog({
      userId: currentUser?.id || '',
      userFullName: currentUser?.fullName || '',
      userRole: currentUser?.role || 'RESEARCHER',
      actionCode: action === 'SUBMIT' ? 'SUBMIT_PROPOSAL' : 'CREATE_DRAFT_PROPOSAL',
      entityType: 'PROJECT',
      entityId: projectId,
      notes: `${action === 'SUBMIT' ? 'Gửi đề xuất' : 'Lưu nháp'} đề tài: ${title}`,
    });

    if (action === 'SUBMIT') {
      success('Gửi đề xuất đề tài thành công! Hồ sơ đã được chuyển sang danh sách Đề tài của tôi.');
    } else {
      success('Đã lưu bản nháp đề xuất đề tài thành công.');
    }

    // Chuyển hướng ngay sang màn hình Đề tài của tôi
    router.push('/my-projects');
  };

  const stepsList = [
    { number: 1, label: 'Thông tin chung', icon: FileText },
    { number: 2, label: 'Nhân sự & Phiếu đề xuất', icon: Users },
    { number: 3, label: 'Kinh phí dự kiến', icon: DollarSign },
  ];

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500 text-xs">Đang tải biểu mẫu đăng ký...</div>;
  }

  if (currentUser?.role !== 'RESEARCHER') {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <h1 className="text-base font-bold text-slate-900">Không có quyền đăng ký đề tài</h1>
        <p className="mt-2 text-xs text-slate-500">Chức năng này chỉ dành cho tài khoản Nghiên cứu viên / Chủ nhiệm đề tài.</p>
        <Link
          href="/projects"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0A6EBD] px-4 py-2 text-xs font-bold text-white hover:bg-[#085896]"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách đề tài
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-24 text-slate-800 text-xs">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3.5 border-b border-slate-200 pb-3 select-none">
        <Link
          href={backLink}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#0A6EBD] flex items-center justify-center shrink-0 transition shadow-2xs cursor-pointer"
          title="Quay lại Đề tài của tôi"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-base font-bold text-slate-900">
            {editingProjectId ? 'Chỉnh sửa đề xuất đề tài' : 'Đăng ký đề xuất đề tài mới'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Điền phiếu đề xuất trực tuyến (BM1) để gửi thẩm định đợt NCKH
          </p>
        </div>
      </div>

      {/* ── STEPPER WIZARD ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col md:flex-row justify-between items-stretch gap-3 select-none">
        {stepsList.map((stepItem, idx) => {
          const isActive = currentStep === stepItem.number;
          const isCompleted = currentStep > stepItem.number;

          return (
            <React.Fragment key={stepItem.number}>
              <button
                type="button"
                onClick={() => setCurrentStep(stepItem.number)}
                className="flex items-center gap-3 text-left focus:outline-none transition group cursor-pointer flex-1"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border transition shrink-0 ${
                  isActive
                    ? 'bg-sky-50 text-[#0A6EBD] border-[#0A6EBD] shadow-2xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {isCompleted ? '✓' : stepItem.number}
                </div>
                <div>
                  <span className={`text-[10px] block font-bold uppercase tracking-wider ${
                    isActive ? 'text-[#0A6EBD]' : 'text-slate-400'
                  }`}>
                    Bước {stepItem.number}
                  </span>
                  <span className={`text-xs font-bold block ${
                    isActive ? 'text-slate-900' : 'text-slate-600'
                  }`}>
                    {stepItem.label}
                  </span>
                </div>
              </button>

              {idx < stepsList.length - 1 && (
                <div className="hidden md:block w-px bg-slate-200 my-1 self-stretch" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── STEP 1: THÔNG TIN CHUNG ── */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              I. Thông tin chung & Đợt đăng ký
            </h2>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Đợt đăng ký áp dụng <span className="text-rose-500">*</span>
              </label>
              <select
                value={roundId}
                onChange={(e) => setRoundId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 outline-none focus:border-[#0A6EBD]"
              >
                {selectableRounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Hạn nộp: {r.endDate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tên đề tài nghiên cứu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nhập đầy đủ tên đề tài bằng tiếng Việt có dấu..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-slate-900 outline-none focus:border-[#0A6EBD]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Loại hình nghiên cứu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium outline-none focus:border-[#0A6EBD]"
                >
                  <option value="NGHIÊN_CỨU_LÂM_SÀNG">Nghiên cứu lâm sàng</option>
                  <option value="DỊCH_TỄ_HỌC">Dịch tễ học</option>
                  <option value="QUẢN_LÝ_Y_TẾ">Quản lý y tế</option>
                  <option value="CẢI_TIẾN_KỸ_THUẬT">CẢI TIẾN KỸ THUẬT</option>
                  <option value="CAN_THIỆP_CỘNG_ĐỒNG">Can thiệp cộng đồng</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Lĩnh vực nghiên cứu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={researchField}
                  onChange={(e) => setResearchField(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium outline-none focus:border-[#0A6EBD]"
                >
                  <option value="Khoa học Y Dược">Khoa học Y Dược (Lâm sàng & Cận lâm sàng)</option>
                  <option value="Tim mạch can thiệp">Tim mạch can thiệp</option>
                  <option value="Hồi sức cấp cứu & Chống độc">Hồi sức cấp cứu & Chống độc</option>
                  <option value="Ung bướu & Xạ trị">Ung bướu & Xạ trị</option>
                  <option value="Dược lâm sàng & Dược lý">Dược lâm sàng & Dược lý</option>
                  <option value="Quản lý chất lượng & Cải tiến kỹ thuật">Quản lý chất lượng & Cải tiến kỹ thuật</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tóm tắt mục tiêu & Phương pháp nghiên cứu
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Tóm tắt tính cấp thiết, mục tiêu nghiên cứu và phương pháp thu thập số liệu..."
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 outline-none focus:border-[#0A6EBD]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: NHÂN SỰ & HỒ SƠ ── */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                II. Thông tin Chủ nhiệm & Nhóm nghiên cứu
              </h2>
              <button
                type="button"
                onClick={() => setShowMemberModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#0A6EBD] bg-sky-50 border border-sky-200 rounded-lg hover:bg-[#0A6EBD] hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm thành viên
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Chủ nhiệm đề tài <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={piName}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-slate-50 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Khoa / Phòng chủ trì <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-slate-800 outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bảng thành viên */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B2A63] text-white font-bold uppercase text-[11px]">
                    <tr>
                      <th className="px-3 py-2.5">Họ và tên</th>
                      <th className="px-3 py-2.5 text-center">Vai trò</th>
                      <th className="px-3 py-2.5 text-center">% Đóng góp</th>
                      <th className="px-3 py-2.5 text-center w-14">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-slate-900">{m.fullName}</div>
                          <div className="text-[10px] text-slate-500">{m.academicRank} • {m.unit}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.roleInProject === 'CHỦ_NHIỆM'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {m.roleInProject.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold font-mono text-slate-700">
                          {m.contributionPercentage}%
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {m.roleInProject !== 'CHỦ_NHIỆM' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Upload Phiếu đề xuất */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              III. Tải lên Phiếu đề xuất (Mẫu BM1)
            </h2>
            <label className="border-2 border-dashed border-slate-300 hover:border-[#0A6EBD] bg-slate-50/50 hover:bg-sky-50/10 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleFileSelected(e, 'PROPOSAL_FORM')}
              />
              <Upload className="w-6 h-6 text-[#0A6EBD]" />
              <p className="font-bold text-slate-800 mt-2">
                Kéo thả file Phiếu đề xuất vào đây hoặc <span className="text-[#0A6EBD]">chọn file</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Định dạng PDF, Word (Tối đa 25MB)</p>
            </label>

            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#0A6EBD] shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveFile(file.id)} className="text-slate-400 hover:text-rose-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 3: KINH PHÍ DỰ KIẾN ── */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              IV. Dự toán kinh phí đề xuất
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="hasFunding"
                  checked={hasFunding}
                  onChange={() => setHasFunding(true)}
                  className="w-4 h-4 text-[#0A6EBD]"
                />
                Có cấp kinh phí hỗ trợ
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600">
                <input
                  type="radio"
                  name="hasFunding"
                  checked={!hasFunding}
                  onChange={() => setHasFunding(false)}
                  className="w-4 h-4 text-[#0A6EBD]"
                />
                Tự túc kinh phí
              </label>
            </div>

            {hasFunding && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nguồn kinh phí chủ yếu *</label>
                  <select
                    value={fundingSource}
                    onChange={(e) => setFundingSource(e.target.value as FundingSource)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 outline-none"
                  >
                    <option value="NGÂN_SÁCH_BỆNH_VIỆN">Ngân sách Bệnh viện</option>
                    <option value="TÀI_TRỢ_NGOÀI">Nhà tài trợ bên ngoài</option>
                    <option value="HỖN_HỢP">Nguồn hỗn hợp</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kinh phí đề xuất (VND) *</label>
                  <input
                    type="number"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 outline-none focus:border-[#0A6EBD]"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Bằng chữ: <strong>{formatVND(estimatedBudget)}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER ACTIONS ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex items-center justify-between select-none">
        <button
          type="button"
          onClick={() => handleSaveOrSubmit('DRAFT')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition shadow-2xs cursor-pointer"
        >
          <Save className="w-4 h-4 text-slate-500" /> Lưu bản nháp
        </button>

        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer"
            >
              Quay lại
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-5 py-2 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold shadow-2xs transition cursor-pointer"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSaveOrSubmit('SUBMIT')}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Gửi đề xuất đề tài
            </button>
          )}
        </div>
      </div>

      {/* ── MODAL THÊM THÀNH VIÊN ── */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Thêm thành viên nhóm nghiên cứu</h3>
              <button onClick={() => setShowMemberModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: ThS.BS. Nguyễn Văn B"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Học vị / Chức danh</label>
                  <input
                    type="text"
                    value={newMemberRank}
                    onChange={(e) => setNewMemberRank(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khoa / Phòng</label>
                  <input
                    type="text"
                    value={newMemberUnit}
                    onChange={(e) => setNewMemberUnit(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vai trò</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as ResearchMemberRole)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold bg-white"
                  >
                    <option value="THƯ_KÝ_KH">Thư ký đề tài</option>
                    <option value="THÀNH_VIÊN_CHÍNH">Thành viên chính</option>
                    <option value="KỸ_THUẬT_VIÊN">Kỹ thuật viên</option>
                    <option value="CỘNG_TÁC_VIÊN">Cộng tác viên</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">% Đóng góp</label>
                  <input
                    type="number"
                    value={newMemberPercent}
                    onChange={(e) => setNewMemberPercent(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-4 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold rounded-lg shadow-2xs cursor-pointer"
                >
                  Thêm vào danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}