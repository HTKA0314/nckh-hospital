'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { ResearchProject, DocumentType } from '@/lib/types';
import { formatVND } from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  Calendar,
  DollarSign,
  Save,
  FileText,
  Users,
  Building2,
  Sparkles,
  X,
} from 'lucide-react';

export default function RegisterProjectPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();
  const departments = repo.getDepartments();
  const rounds = repo.getRounds().filter((r) => r.status === 'OPEN');

  // Form Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);

  const isManager = ['ADMIN', 'DIRECTOR', 'RESEARCH_OFFICE'].includes(currentUser.role);
  const backLink = isManager ? '/projects' : '/my-projects';

  // I. Thông tin chung
  const [roundId, setRoundId] = useState(rounds[0]?.id || 'round-2026-01');
  const [title, setTitle] = useState('');
  const [researchField, setResearchField] = useState('Khoa học Y Dược');
  const [managementLevel, setManagementLevel] = useState<'CẤP_CƠ_SỞ' | 'CẤP_BỘ' | 'CẤP_TỈNH' | 'CẤP_QUỐC_GIA'>('CẤP_CƠ_SỞ');
  const [projectType, setProjectType] = useState<'NGHIÊN_CỨU_LÂM_SÀNG' | 'CAN_THIỆP_CỘNG_ĐỒNG' | 'DỊCH_TỄ_HỌC' | 'QUẢN_LÝ_Y_TẾ' | 'CẢI_TIẾN_KỸ_THUẬT'>('NGHIÊN_CỨU_LÂM_SÀNG');
  const [summary, setSummary] = useState('');

  // 10 Trường giải trình Phiếu đề xuất đề tài cấp cơ sở (sẽ chuyển sang trang Bổ sung đề cương)
  // Đã gỡ bỏ khỏi màn hình Đăng ký


  // II. Thông tin nhân sự & Tiến độ
  const [piName, setPiName] = useState(currentUser.fullName);
  const [departmentId, setDepartmentId] = useState(currentUser.departmentId || departments[0]?.id || '');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2027-03-31');
  const [estimatedBudget, setEstimatedBudget] = useState(250000000);
  const [fundingSource, setFundingSource] = useState<'NGÂN_SÁCH_BỆNH_VIỆN' | 'TỰ_TÚC' | 'TÀI_TRỢ_NGOÀI' | 'HỖN_HỢP'>('NGÂN_SÁCH_BỆNH_VIỆN');
  const [hasFunding, setHasFunding] = useState(true);

  // III. Thành viên tham gia nghiên cứu
  const [members, setMembers] = useState<
    {
      id: string;
      fullName: string;
      academicRank: string;
      unit: string;
      roleInProject: 'CHỦ_NHIỆM' | 'THƯ_KÝ_KH' | 'THÀNH_VIÊN_CHÍNH' | 'KỸ_THUẬT_VIÊN' | 'CỘNG_TÁC_VIÊN';
      contributionPercentage: number;
    }[]
  >([
    {
      id: 'm-1',
      fullName: currentUser.fullName,
      academicRank: currentUser.academicTitle || 'ThS.BS',
      unit: 'Khoa Tim mạch Can thiệp',
      roleInProject: 'CHỦ_NHIỆM',
      contributionPercentage: 50,
    },
  ]);

  // Member Modal / Add Row State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRank, setNewMemberRank] = useState('BS');
  const [newMemberUnit, setNewMemberUnit] = useState('Khoa Khám bệnh');
  const [newMemberRole, setNewMemberRole] = useState<'CHỦ_NHIỆM' | 'THƯ_KÝ_KH' | 'THÀNH_VIÊN_CHÍNH' | 'KỸ_THUẬT_VIÊN' | 'CỘNG_TÁC_VIÊN'>('THÀNH_VIÊN_CHÍNH');
  const [newMemberPercent, setNewMemberPercent] = useState(20);

  // IV. Cấu hình Quy trình & Chính sách (Workflow Policy Settings)
  const policies = repo.getPolicies();
  const [selectedPolicyId, setSelectedPolicyId] = useState(policies[0]?.id || 'policy-a');
  const activePolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0];

  // Bỏ qua xét duyệt chuyên môn (Nếu có phê duyệt ngoài viện)
  const [hasExternalApproval, setHasExternalApproval] = useState(false);
  const [scientificReviewSkipReason, setScientificReviewSkipReason] = useState('');

  // IV. Hồ sơ đính kèm (File upload checklist)
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; type: DocumentType; name: string; size: string }[]
  >([
    {
      id: 'f-1',
      type: 'PROPOSAL_FORM',
      name: 'Phieu_de_xuat_de_tai_NCKH_BM1.pdf',
      size: '1.2 MB',
    },
  ]);
  const [selectedUploadDocType, setSelectedUploadDocType] = useState<DocumentType>('PROPOSAL_FORM');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
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
    setStartDate(projectToEdit.startDate?.slice(0, 10) || '2026-04-01');
    setEndDate(projectToEdit.endDate?.slice(0, 10) || '2027-03-31');
    setEstimatedBudget(projectToEdit.estimatedBudget || 250000000);
    setFundingSource(projectToEdit.fundingSource || 'NGÂN_SÁCH_BỆNH_VIỆN');
    setHasFunding((projectToEdit.estimatedBudget ?? 0) > 0);
    setHasExternalApproval(projectToEdit.scientificReviewStatus === 'SKIPPED');
    setScientificReviewSkipReason(projectToEdit.scientificReviewSkipReason || '');
    setSelectedPolicyId(projectToEdit.workflowPolicyId || policies[0]?.id || 'policy-a');
    setUploadedFiles(
      (projectToEdit.documents || []).map((doc) => ({
        id: doc.id,
        type: doc.documentType,
        name: doc.title,
        size: doc.versions?.[0]?.fileSize || '1.0 MB',
      }))
    );
    setMembers(projectToEdit.members || []);
  }, [searchParams, currentUser.fullName, currentUser.departmentId, departments, policies, rounds]);

  // V. Bỏ qua Tiêu chí sàng lọc Đạo đức Y sinh (chuyển sang bước Bổ sung đề cương)


  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      warning('Vui lòng nhập họ tên thành viên tham gia nghiên cứu', 'Thiếu thông tin');
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
      warning('Đề tài phải có ít nhất Chủ nhiệm đề tài', 'Ràng buộc nhân sự');
      return;
    }
    setMembers(members.filter((m) => m.id !== id));
    success('Đã xóa thành viên khỏi nhóm nghiên cứu');
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
    success('Đã xóa tệp đính kèm');
  };

  const handleFileUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFiles([
      ...uploadedFiles,
      {
        id: `f-${Date.now()}`,
        type: selectedUploadDocType,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      },
    ]);
    success(`Đã tải lên tệp tin: ${file.name}`);
  };

  const handleSaveOrSubmit = (action: 'DRAFT' | 'SUBMIT') => {
    if (action === 'SUBMIT') {
      if (!title.trim()) {
        error('Vui lòng điền Tên đề tài nghiên cứu ở Bước 1.', 'Lỗi dữ liệu');
        setCurrentStep(1);
        return;
      }
      if (!uploadedFiles.some((f) => f.type === 'DETAILED_OUTLINE')) {
        error('Vui lòng tải lên Bản thuyết minh đề cương chi tiết ở Bước 3.', 'Lỗi tài liệu');
        setCurrentStep(3);
        return;
      }
    }

    const selectedRound = repo.getRoundById(roundId) || rounds.find((r) => r.id === roundId) || rounds[0] || {
      id: 'round-2026-01',
      name: 'Đợt đăng ký Đề tài NCKH Cấp cơ sở Đợt 1 Năm 2026',
    };
    const selectedDept = departments.find((d) => d.id === departmentId) || departments[0];

    const proposalCode = editingProject?.proposalCode || `DX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const projectId = editingProjectId || `proj-${Date.now()}`;
    const proposalStatus = action === 'SUBMIT' ? 'SUBMITTED' : editingProject?.proposalStatus || 'DRAFT';
    const submittedAt = action === 'SUBMIT' ? new Date().toLocaleDateString('vi-VN') : editingProject?.submittedAt;
    const projectCategory: ResearchProject['projectCategory'] = selectedPolicyId === 'policy-b' ? 'CAO_HOC' : selectedPolicyId === 'policy-c' ? 'NHA_NUOC' : 'CAP_CO_SO';
    const acceptanceAuthority: ResearchProject['acceptanceAuthority'] = selectedPolicyId === 'policy-b' ? 'CO_SO_DAO_TAO' : 'BENH_VIEN';
    const scientificReviewStatus: ResearchProject['scientificReviewStatus'] = hasExternalApproval ? 'SKIPPED' : 'REQUIRED';
    const historyEntry = {
      id: `h-${Date.now()}`,
      projectId,
      fromStatus: editingProject?.proposalStatus || 'NONE',
      toStatus: proposalStatus,
      changedBy: currentUser.id,
      changedByName: currentUser.fullName,
      userRole: currentUser.role,
      changedAt: new Date().toLocaleDateString('vi-VN'),
      action: editingProjectId
        ? action === 'SUBMIT'
          ? 'Cập nhật và nộp lại hồ sơ đề xuất'
          : 'Cập nhật hồ sơ đề xuất'
        : action === 'SUBMIT'
        ? 'Nộp hồ sơ đề xuất mới'
        : 'Lưu nháp hồ sơ',
    };

    const updatedProject = {
      ...(editingProject || {}),
      id: projectId,
      workflowPolicyId: selectedPolicyId,
      projectCategory,
      acceptanceAuthority,
      scientificReviewStatus,
      scientificReviewSkipReason: hasExternalApproval ? scientificReviewSkipReason : undefined,
      proposalCode,
      title,
      summary: summary || editingProject?.summary || 'Tóm tắt nội dung đề cương nghiên cứu khoa học cơ sở...',
      researchField,
      managementLevel,
      projectType,
      principalInvestigatorId: currentUser.id,
      principalInvestigatorName: piName || currentUser.fullName,
      departmentId: selectedDept?.id || editingProject?.departmentId || 'dept-01',
      departmentName: selectedDept?.name || editingProject?.departmentName || 'Khoa Tim mạch Can thiệp',
      startDate,
      endDate,
      estimatedBudget: hasFunding ? estimatedBudget : 0,
      approvedBudget: hasFunding ? estimatedBudget : 0,
      fundingSource: hasFunding ? fundingSource : 'TỰ_TÚC',
      progressPercentage: editingProject?.progressPercentage ?? 0,
      urgencyExplanation: editingProject?.urgencyExplanation || '',
      expectedObjectives: editingProject?.expectedObjectives || '',
      researchDesign: editingProject?.researchDesign || '',
      researchSubjects: editingProject?.researchSubjects || '',
      researchLocation: editingProject?.researchLocation || '',
      selectionCriteria: editingProject?.selectionCriteria || '',
      exclusionCriteria: editingProject?.exclusionCriteria || '',
      recruitmentAndSampleCollection: editingProject?.recruitmentAndSampleCollection || '',
      researchVariables: editingProject?.researchVariables || '',
      sampleSizeEstimation: editingProject?.sampleSizeEstimation || '',
      studyTimeEstimation: editingProject?.studyTimeEstimation || '',
      expectedProducts: editingProject?.expectedProducts || '',
      hospitalApplication: editingProject?.hospitalApplication || '',
      otherInfo: editingProject?.otherInfo || '',
      status: editingProject?.status || 'DRAFT',
      proposalStatus,
      ethicsRequired: editingProject?.ethicsRequired ?? false,
      ethicsStatus: editingProject?.ethicsStatus || 'NOT_REQUIRED',
      registrationRoundId: selectedRound.id,
      registrationRoundName: selectedRound.name,
      createdAt: editingProject?.createdAt || new Date().toLocaleDateString('vi-VN'),
      submittedAt,
      members: members.map((m) => ({ ...m, projectId })),
      documents: uploadedFiles.map((f, i) => ({
        id: f.id || `doc-${i + 1}`,
        projectId,
        documentType: f.type,
        title: f.name,
        currentVersion: 1,
        currentVersionId: `ver-1`,
        versions: [
          {
            id: `ver-1`,
            documentId: f.id || `doc-${i + 1}`,
            version: 1,
            fileName: f.name,
            fileSize: f.size,
            uploadedBy: currentUser.id,
            uploadedByName: currentUser.fullName,
            uploadedAt: new Date().toLocaleString('vi-VN'),
            downloadUrl: '#',
            isCurrent: true,
          },
        ],
      })),
      milestones: editingProject?.milestones || [],
      progressReports: editingProject?.progressReports || [],
      changeRequests: editingProject?.changeRequests || [],
      financeStatus: editingProject?.financeStatus ?? 'PENDING',
      decisions: editingProject?.decisions || [],
      statusHistory: [...(editingProject?.statusHistory || []), historyEntry],
    };

    if (editingProjectId) {
      repo.updateProject(editingProjectId, updatedProject);
      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        actionCode: action === 'SUBMIT' ? 'UPDATE_SUBMITTED_PROPOSAL' : 'UPDATE_DRAFT_PROPOSAL',
        entityType: 'PROJECT',
        entityId: editingProjectId,
        notes: `${action === 'SUBMIT' ? 'Cập nhật và nộp lại' : 'Cập nhật'} hồ sơ đề tài mã ${proposalCode}: ${title}`,
      });
    } else {
      repo.createProject(updatedProject);
      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        actionCode: action === 'SUBMIT' ? 'SUBMIT_PROPOSAL' : 'CREATE_DRAFT_PROPOSAL',
        entityType: 'PROJECT',
        entityId: projectId,
        notes: `${action === 'SUBMIT' ? 'Nộp chính thức' : 'Lưu nháp'} hồ sơ đề tài mã ${proposalCode}: ${title}`,
      });
    }

    if (action === 'SUBMIT') {
      success(`Đã ${editingProjectId ? 'cập nhật và nộp lại' : 'nộp'} hồ sơ đề tài ${proposalCode} thành công! Hồ sơ đã được chuyển đến Phòng Quản lý NCKH.`, 'Nộp hồ sơ thành công');
    } else {
      success(editingProjectId ? 'Đã cập nhật hồ sơ nháp đề tài thành công!' : 'Đã lưu bản nháp đề tài thành công!', 'Lưu nháp');
    }
    router.push('/my-projects');
  };

  const stepsList = [
    { number: 1, label: 'Thông tin chung', icon: FileText },
    { number: 2, label: 'Nhân sự & Phiếu đề xuất', icon: Users },
    { number: 3, label: 'Đề cương & Kinh phí', icon: DollarSign },
  ];

  return (
    <div className="w-full space-y-6 pb-24 text-slate-800">
      
      {/* Optimized Header (Inline Quay lại + Title) */}
      <div className="flex items-center gap-3.5 border-b border-slate-200 pb-4 select-none">
        <Link
          href={backLink}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#0A6EBD] flex items-center justify-center shrink-0 transition shadow-2xs cursor-pointer"
          title="Quay lại danh sách đề tài"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-base font-bold text-slate-800">
            {editingProjectId ? 'Chỉnh sửa đề tài nghiên cứu' : 'Đăng ký đề tài nghiên cứu mới'}
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {editingProjectId ? 'Cập nhật hồ sơ đề xuất chờ xét duyệt' : 'Mẫu RICH.QT01.V1.0 • Phiếu đề xuất và đề cương trực tuyến'}
          </p>
        </div>
      </div>

      {/* Stepper Bar (5 bước) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row justify-between items-stretch gap-4 select-none">
        {stepsList.map((stepItem, idx) => {
          const StepIcon = stepItem.icon;
          const isActive = currentStep === stepItem.number;
          const isCompleted = currentStep > stepItem.number;

          return (
            <React.Fragment key={stepItem.number}>
              <button
                type="button"
                onClick={() => setCurrentStep(stepItem.number)}
                className="flex items-center gap-3 text-left focus:outline-none transition group cursor-pointer flex-1"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border transition shrink-0 ${
                  isActive
                    ? 'bg-[#EBF4FC] text-[#0A6EBD] border-[#0A6EBD] shadow-2xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border-slate-250/70 group-hover:border-slate-350'
                }`}>
                  {isCompleted ? '✓' : stepItem.number}
                </div>
                <div>
                  <span className={`text-[10px] block font-bold uppercase tracking-wider leading-none mb-1 ${
                    isActive ? 'text-[#0A6EBD]' : 'text-slate-450'
                  }`}>
                    Bước {stepItem.number}
                  </span>
                  <span className={`text-[13px] font-bold block leading-none ${
                    isActive ? 'text-slate-900 font-extrabold' : 'text-slate-600 group-hover:text-slate-800'
                  }`}>
                    {stepItem.label}
                  </span>
                </div>
              </button>

              {idx < stepsList.length - 1 && (
                <div className="hidden md:block w-px bg-slate-200/80 my-2 self-stretch" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: THÔNG TIN CHUNG */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              I. Thông tin chung & Quy chuẩn áp dụng
            </h2>
          </div>

          <div className="p-6 space-y-5 text-xs">
            {/* Đợt đăng ký */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Đợt đăng ký áp dụng <span className="text-rose-500">*</span>
              </label>
              <select
                value={roundId}
                onChange={(e) => setRoundId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-semibold text-slate-850"
              >
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Hạn nộp: {r.endDate})
                  </option>
                ))}
              </select>
            </div>

            {/* CHÍNH SÁCH QUY TRÌNH ÁP DỤNG (TINTED PREMIUM POLICY SUMMARY CARD) */}
            <div className="bg-sky-50/60 border border-sky-200/80 rounded-2xl p-4 space-y-4">
              <div>
                <label className="font-bold text-[#0B2A63] block mb-1.5 text-[11px] uppercase tracking-wider">
                  Chính sách quản lý quy trình áp dụng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPolicyId}
                  onChange={(e) => {
                    setSelectedPolicyId(e.target.value);
                    const pol = policies.find((p) => p.id === e.target.value);
                    if (pol && pol.requiredDocumentsByStep[1]?.[0]) {
                      setSelectedUploadDocType(pol.requiredDocumentsByStep[1][0].type);
                    }
                  }}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-bold text-slate-800"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.version})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-450 mt-1 block">
                  * Các tham số quy trình và biểu mẫu tài liệu bắt buộc sẽ tự động điều chỉnh theo chính sách này.
                </span>
              </div>

              {/* Read-only policy details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/80 p-4 rounded-xl border border-sky-100/60 shadow-3xs text-xs font-semibold text-slate-700">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block font-bold">Chu kỳ báo cáo:</span>
                  <span className="text-slate-900 font-extrabold text-sm">{activePolicy.reportingIntervalMonths} tháng/lần</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 block font-bold">Thời hạn thực hiện:</span>
                  <span className="text-slate-900 font-extrabold text-sm">{activePolicy.minDurationMonths || 6} - {activePolicy.maxDurationMonths || 12} tháng</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 block font-bold">Hội đồng đạo đức:</span>
                  <span className="text-slate-900 font-extrabold text-sm">
                    {activePolicy.requiresEthicsReview
                      ? activePolicy.ethicsReviewMode === 'INTEGRATED'
                        ? 'Ghép với HĐ đề cương'
                        : 'Hội đồng riêng biệt'
                      : 'Không yêu cầu'}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 block font-bold">Nơi nghiệm thu:</span>
                  <span className="text-slate-900 font-extrabold text-sm">
                    {activePolicy.acceptanceMode === 'INTERNAL' ? 'Nghiệm thu tại bệnh viện' : 'Nghiệm thu ngoài viện'}
                  </span>
                </div>
              </div>

              {/* Bỏ qua hội đồng chuyên môn (Skip outline review) */}
              <div className="border-t border-sky-100/60 pt-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasExternalApproval}
                    onChange={(e) => setHasExternalApproval(e.target.checked)}
                    className="w-4 h-4 text-[#0A6EBD] focus:ring-[#0A6EBD]/30 rounded border-slate-300 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-[11px]">Đề tài đã được Hội đồng chuyên môn ngoài viện xét duyệt</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Tích chọn nếu đề tài đã bảo vệ thành công tại cơ sở đào tạo hoặc đơn vị chủ quản trước đó.</p>
                  </div>
                </label>

                {hasExternalApproval && (
                  <div className="mt-3 space-y-3 animate-in slide-in-from-top-1">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Lý do miễn bảo vệ đề cương & Quyết định liên quan <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Ghi rõ thông tin Hội đồng chuyên môn đã duyệt đề cương (tên Hội đồng, ngày duyệt, số quyết định phê duyệt...)"
                        value={scientificReviewSkipReason}
                        onChange={(e) => setScientificReviewSkipReason(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-850 font-medium focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tên đề tài */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Tên đề tài nghiên cứu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nhập đầy đủ tên đề tài bằng tiếng Việt có dấu..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-semibold text-slate-900"
              />
            </div>

            {/* Lĩnh vực & Cấp quản lý */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Lĩnh vực nghiên cứu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={researchField}
                  onChange={(e) => setResearchField(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-medium"
                >
                  <option value="Khoa học Y Dược">Khoa học Y Dược (Lâm sàng & Cận lâm sàng)</option>
                  <option value="Tim mạch can thiệp">Tim mạch can thiệp</option>
                  <option value="Hồi sức cấp cứu & Chống độc">Hồi sức cấp cứu & Chống độc</option>
                  <option value="Ung bướu & Xạ trị">Ung bướu & Xạ trị</option>
                  <option value="Dược lâm sàng & Dược lý">Dược lâm sàng & Dược lý</option>
                  <option value="Dịch tễ học & Y tế công cộng">Dịch tễ học & Y tế công cộng</option>
                  <option value="Quản lý chất lượng & Cải tiến kỹ thuật">Quản lý chất lượng & Cải tiến kỹ thuật</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-3">
                  Cấp quản lý <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="mgmtLevel"
                      checked={managementLevel === 'CẤP_CƠ_SỞ'}
                      onChange={() => setManagementLevel('CẤP_CƠ_SỞ')}
                      className="w-4 h-4 text-[#0A6EBD] focus:ring-[#0A6EBD]/30"
                    />
                    Cấp Cơ sở
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-650 font-semibold">
                    <input
                      type="radio"
                      name="mgmtLevel"
                      checked={managementLevel === 'CẤP_BỘ'}
                      onChange={() => setManagementLevel('CẤP_BỘ')}
                      className="w-4 h-4 text-[#0A6EBD] focus:ring-[#0A6EBD]/30"
                    />
                    Cấp Bộ
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-650 font-semibold">
                    <input
                      type="radio"
                      name="mgmtLevel"
                      checked={managementLevel === 'CẤP_QUỐC_GIA'}
                      onChange={() => setManagementLevel('CẤP_QUỐC_GIA')}
                      className="w-4 h-4 text-[#0A6EBD] focus:ring-[#0A6EBD]/30"
                    />
                    Cấp Quốc gia
                  </label>
                </div>
              </div>
            </div>

            {/* Tóm tắt */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Tóm tắt mục tiêu & Phương pháp nghiên cứu
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Tóm tắt tính cấp thiết, mục tiêu nghiên cứu và phương pháp thu thập số liệu..."
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] leading-relaxed font-semibold text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: NHÓM NGHIÊN CỨU & HỒ SƠ */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Nhóm nghiên cứu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                II. Thông tin Chủ nhiệm & Thành viên tham gia
              </h2>
              <button
                type="button"
                onClick={() => setShowMemberModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0A6EBD] bg-sky-50 border border-sky-100 rounded-lg hover:bg-[#0A6EBD] hover:text-white transition cursor-pointer select-none"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm thành viên
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Họ và tên Chủ nhiệm đề tài <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={piName}
                    onChange={(e) => setPiName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Khoa / Phòng / Đơn vị chủ trì <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-semibold text-slate-850"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bảng thành viên */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">Danh sách thành viên nghiên cứu:</label>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Họ và tên</th>
                        <th className="px-4 py-3 text-center">Vai trò</th>
                        <th className="px-4 py-3 text-center">% Đóng góp</th>
                        <th className="px-4 py-3 text-center w-16">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="font-bold">{m.fullName}</div>
                            <div className="text-[10px] text-slate-500">
                              {m.academicRank} • {m.unit}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.roleInProject === 'CHỦ_NHIỆM'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : m.roleInProject === 'THƯ_KÝ_KH'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {m.roleInProject.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-600">
                            {m.contributionPercentage}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            {m.roleInProject !== 'CHỦ_NHIỆM' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
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
          </div>

          {/* Hồ sơ đính kèm */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                III. Tải lên Phiếu đề xuất (File đính kèm)
              </h2>
            </div>
            <div className="p-6 space-y-5 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-[#0B2A63] block">
                  Checklist hồ sơ bắt buộc của Quy trình:
                </span>
                <div className="space-y-1.5">
                  {(activePolicy.requiredDocumentsByStep[1] || []).filter(req => req.type === 'PROPOSAL_FORM').map((req) => {
                    const isUploaded = uploadedFiles.some((f) => f.type === req.type);
                    return (
                      <div key={req.type} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-150 font-medium">
                        <div className="flex items-center gap-2">
                          {isUploaded ? (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">✗</span>
                          )}
                          <span className={isUploaded ? 'text-slate-650 font-semibold' : 'text-slate-700 font-bold'}>
                            {req.label} {req.required && <span className="text-rose-500">*</span>}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          isUploaded ? 'bg-emerald-50 text-emerald-700 border border-emerald-250/60' : 'bg-rose-50 text-rose-700 border border-rose-250/60'
                        }`}>
                          {isUploaded ? 'Đã đính kèm' : 'Chưa đính kèm'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dropzone Upload */}
              <label className="border-2 border-dashed border-slate-300 hover:border-[#0A6EBD] bg-slate-50/50 hover:bg-sky-50/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                     setSelectedUploadDocType('PROPOSAL_FORM');
                     handleFileUploadSimulate(e);
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-[#0A6EBD] group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-800 text-sm mt-3">
                  Kéo thả Phiếu đề xuất vào đây hoặc <span className="text-[#0A6EBD]">click để duyệt file</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hỗ trợ định dạng: PDF, Word. Dung lượng tối đa: 25MB
                </p>
              </label>

              {/* Danh sách file đính kèm */}
              <div>
                <span className="font-bold text-slate-700 block mb-2">
                  Danh sách tài liệu đã tải lên:
                </span>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/60 transition"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#0A6EBD] shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">{file.name}</p>
                          <span className="text-[10px] text-slate-400">{file.size}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: ĐỀ CƯƠNG & KINH PHÍ */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Tải lên đề cương chi tiết */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                III. Đề cương chi tiết (File đính kèm)
              </h2>
            </div>
            <div className="p-6 space-y-5 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-[#0B2A63] block">
                  Tài liệu đề cương thuyết minh bắt buộc:
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-150 font-medium">
                    <div className="flex items-center gap-2">
                      {uploadedFiles.some((f) => f.type === 'DETAILED_OUTLINE') ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">✗</span>
                      )}
                      <span className="text-slate-700 font-bold">Thuyết minh đề cương chi tiết *</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      uploadedFiles.some((f) => f.type === 'DETAILED_OUTLINE') ? 'bg-emerald-50 text-emerald-700 border border-emerald-250/60' : 'bg-rose-50 text-rose-700 border border-rose-250/60'
                    }`}>
                      {uploadedFiles.some((f) => f.type === 'DETAILED_OUTLINE') ? 'Đã đính kèm' : 'Chưa đính kèm'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dropzone Upload */}
              <label className="border-2 border-dashed border-slate-300 hover:border-[#0A6EBD] bg-slate-50/50 hover:bg-sky-50/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                     setSelectedUploadDocType('DETAILED_OUTLINE');
                     handleFileUploadSimulate(e);
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-[#0A6EBD] group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-800 text-sm mt-3">
                  Kéo thả bản Đề cương chi tiết vào đây hoặc <span className="text-[#0A6EBD]">click để duyệt file</span>
                </p>
              </label>
            </div>
          </div>

          {/* Quản lý Kinh phí */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                IV. Dự toán kinh phí đề xuất
              </h2>
            </div>
            <div className="p-6 space-y-5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-3">Đề tài có được cấp kinh phí hỗ trợ từ bệnh viện / nguồn ngoài không?</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="hasFunding"
                      checked={hasFunding}
                      onChange={() => setHasFunding(true)}
                      className="w-4 h-4 text-[#0A6EBD] focus:ring-[#0A6EBD]/30"
                    />
                    Có cấp kinh phí
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-650 font-semibold">
                    <input
                      type="radio"
                      name="hasFunding"
                      checked={!hasFunding}
                      onChange={() => setHasFunding(false)}
                      className="w-4 h-4 text-[#0A6EBD] focus:ring-[#0A6EBD]/30"
                    />
                    Tự túc (Không nhận kinh phí hỗ trợ)
                  </label>
                </div>
              </div>

              {hasFunding && (
                <div className="space-y-4 pt-3 border-t border-slate-100 animate-in slide-in-from-top-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Nguồn kinh phí chủ yếu *</label>
                      <select
                        value={fundingSource}
                        onChange={(e) => setFundingSource(e.target.value as any)}
                        className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-semibold text-slate-800"
                      >
                        <option value="NGÂN_SÁCH_BỆNH_VIỆN">Ngân sách Bệnh viện (Quỹ phát triển hoạt động sự nghiệp)</option>
                        <option value="TÀI_TRỢ_NGOÀI">Nhà tài trợ bên ngoài (Quỹ KHCN, Hãng Dược...)</option>
                        <option value="HỖN_HỢP">Hỗn hợp (Nhiều nguồn)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Kinh phí đề xuất thực hiện (VND) *</label>
                      <input
                        type="number"
                        value={estimatedBudget}
                        onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                        className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-mono font-bold text-slate-800"
                      />
                      <span className="text-[10px] text-slate-450 mt-1 block">
                        Số tiền viết bằng chữ: {formatVND(estimatedBudget)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Tải lên Bản dự toán chi phí chi tiết (Mẫu BM-DT-01)</label>
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#0A6EBD] bg-slate-50/50 hover:bg-sky-50/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                           setSelectedUploadDocType('BUDGET_ESTIMATE');
                           handleFileUploadSimulate(e);
                        }}
                      />
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-[#0A6EBD] group-hover:scale-110 transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-800 text-xs mt-2">
                        Đính kèm bảng excel/pdf dự toán các hạng mục chi phí
                      </p>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between select-none">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSaveOrSubmit('DRAFT')}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-500" /> Lưu bản nháp
            </button>
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                Quay lại
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveOrSubmit('SUBMIT')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-950/15 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" /> Gửi duyệt hồ sơ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL THÊM THÀNH VIÊN */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Thêm thành viên nghiên cứu</h3>
              <button
                onClick={() => setShowMemberModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên (*)</label>
                <input
                  type="text"
                  placeholder="VD: ThS.BS. Nguyễn Văn B"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] text-slate-850 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Học hàm / Học vị</label>
                  <input
                    type="text"
                    value={newMemberRank}
                    onChange={(e) => setNewMemberRank(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khoa / Phòng</label>
                  <input
                    type="text"
                    value={newMemberUnit}
                    onChange={(e) => setNewMemberUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vai trò tham gia</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-850"
                  >
                    <option value="THƯ_KÝ_KH">Thư ký đề tài</option>
                    <option value="THÀNH_VIÊN_CHÍNH">Thành viên nghiên cứu chính</option>
                    <option value="KỸ_THUẬT_VIÊN">Kỹ thuật viên</option>
                    <option value="CỘNG_TÁC_VIÊN">Cộng tác viên</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đóng góp %</label>
                  <input
                    type="number"
                    value={newMemberPercent}
                    onChange={(e) => setNewMemberPercent(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-5 py-2 rounded-xl bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold shadow-md shadow-sky-950/15 cursor-pointer"
                >
                  Thêm thành viên
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
