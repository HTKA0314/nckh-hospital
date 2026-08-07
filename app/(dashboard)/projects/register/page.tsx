'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Layers,
  Save,
  FileText,
  Users,
  ShieldCheck,
  Building2,
  Sparkles,
  Info,
  X,
} from 'lucide-react';

export default function RegisterProjectPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();
  const departments = repo.getDepartments();
  const rounds = repo.getRounds().filter((r) => r.status === 'OPEN');

  // I. Thông tin chung
  const [roundId, setRoundId] = useState(rounds[0]?.id || 'round-2026-01');
  const [title, setTitle] = useState('');
  const [researchField, setResearchField] = useState('Khoa học Y Dược');
  const [managementLevel, setManagementLevel] = useState<'CẤP_CƠ_SỞ' | 'CẤP_BỘ' | 'CẤP_TỈNH' | 'CẤP_QUỐC_GIA'>('CẤP_CƠ_SỞ');
  const [projectType, setProjectType] = useState<'NGHIÊN_CỨU_LÂM_SÀNG' | 'CAN_THIỆP_CỘNG_ĐỒNG' | 'DỊCH_TỄ_HỌC' | 'QUẢN_LÝ_Y_TẾ' | 'CẢI_TIẾN_KỸ_THUẬT'>('NGHIÊN_CỨU_LÂM_SÀNG');
  const [summary, setSummary] = useState('');

  // II. Thông tin nhân sự & Tiến độ
  const [piName, setPiName] = useState(currentUser.fullName);
  const [departmentId, setDepartmentId] = useState(currentUser.departmentId || departments[0]?.id || '');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2027-03-31');
  const [estimatedBudget, setEstimatedBudget] = useState(250000000);
  const [fundingSource, setFundingSource] = useState<'NGÂN_SÁCH_BỆNH_VIỆN' | 'TỰ_TÚC' | 'TÀI_TRỢ_NGOÀI' | 'HỖN_HỢP'>('NGÂN_SÁCH_BỆNH_VIỆN');

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

  // IV. Hồ sơ đính kèm (File upload checklist)
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; type: DocumentType; name: string; size: string }[]
  >([
    {
      id: 'f-1',
      type: 'PROPOSAL_FORM',
      name: 'Phieu_dang_ky_de_tai_NCKH_2026.pdf',
      size: '1.2 MB',
    },
    {
      id: 'f-2',
      type: 'DETAILED_OUTLINE',
      name: 'Thuyet_minh_de_cuong_chi_tiet.docx',
      size: '2.5 MB',
    },
    {
      id: 'f-3',
      type: 'BUDGET_ESTIMATE',
      name: 'Bang_du_toan_kinh_phi_chi_tiet.xlsx',
      size: '450 KB',
    },
  ]);

  // V. Tiêu chí sàng lọc Đạo đức Y sinh (Thông tư 43/2024/TT-BYT)
  const [involvesHumanSubjects, setInvolvesHumanSubjects] = useState(true);
  const [involvesIdentifiableData, setInvolvesIdentifiableData] = useState(false);
  const [involvesBiologicalSamples, setInvolvesBiologicalSamples] = useState(true);
  const [involvesNewInterventions, setInvolvesNewInterventions] = useState(true);

  const isEthicsRequired =
    involvesHumanSubjects ||
    involvesIdentifiableData ||
    involvesBiologicalSamples ||
    involvesNewInterventions;

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
        type: 'OTHER',
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      },
    ]);
    success(`Đã tải lên tệp tin: ${file.name}`);
  };

  const handleSaveOrSubmit = (action: 'DRAFT' | 'SUBMIT') => {
    const selectedRound = rounds.find((r) => r.id === roundId) || rounds[0] || {
      id: 'round-2026-01',
      name: 'Đợt đăng ký Đề tài NCKH Cấp cơ sở Đợt 1 Năm 2026',
    };
    const selectedDept = departments.find((d) => d.id === departmentId) || departments[0];

    const proposalCode = `DX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newProject: ResearchProject = {
      id: `proj-${Date.now()}`,
      proposalCode,
      title,
      summary: summary || 'Tóm tắt nội dung đề cương nghiên cứu khoa học cơ sở...',
      researchField,
      managementLevel,
      projectType,
      principalInvestigatorId: currentUser.id,
      principalInvestigatorName: piName || currentUser.fullName,
      departmentId: selectedDept?.id || 'dept-01',
      departmentName: selectedDept?.name || 'Khoa Tim mạch Can thiệp',
      startDate,
      endDate,
      estimatedBudget,
      approvedBudget: estimatedBudget,
      fundingSource,
      progressPercentage: 0,
      status: 'DRAFT',
      proposalStatus: action === 'SUBMIT' ? 'SUBMITTED' : 'DRAFT',
      ethicsRequired: isEthicsRequired,
      ethicsStatus: isEthicsRequired ? 'DOSSIER_SUBMITTED' : 'NOT_REQUIRED',
      registrationRoundId: selectedRound.id,
      registrationRoundName: selectedRound.name,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      submittedAt: action === 'SUBMIT' ? new Date().toLocaleDateString('vi-VN') : undefined,
      members: members.map((m) => ({ ...m, projectId: `proj-${Date.now()}` })),
      documents: uploadedFiles.map((f, i) => ({
        id: `doc-${i + 1}`,
        projectId: `proj-${Date.now()}`,
        documentType: f.type,
        title: f.name,
        currentVersion: 1,
        currentVersionId: `ver-1`,
        versions: [
          {
            id: `ver-1`,
            documentId: `doc-${i + 1}`,
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
      milestones: [],
      progressReports: [],
      changeRequests: [],
      decisions: [],
      statusHistory: [
        {
          id: `h-${Date.now()}`,
          projectId: `proj-${Date.now()}`,
          fromStatus: 'NONE',
          toStatus: action === 'SUBMIT' ? 'SUBMITTED' : 'DRAFT',
          changedBy: currentUser.id,
          changedByName: currentUser.fullName,
          userRole: currentUser.role,
          changedAt: new Date().toLocaleString('vi-VN'),
          action: action === 'SUBMIT' ? 'Nộp hồ sơ đề xuất mới' : 'Lưu nháp hồ sơ',
        },
      ],
    };

    repo.createProject(newProject);
    repo.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      action: action === 'SUBMIT' ? 'SUBMIT_PROPOSAL' : 'CREATE_DRAFT_PROPOSAL',
      entityType: 'ResearchProject',
      entityId: newProject.id,
      details: `${action === 'SUBMIT' ? 'Nộp chính thức' : 'Lưu nháp'} hồ sơ đề tài mã ${newProject.proposalCode}: ${newProject.title}`,
    });

    if (action === 'SUBMIT') {
      success(`Đã nộp hồ sơ đề tài ${newProject.proposalCode} thành công! Hồ sơ đã được chuyển đến Phòng Quản lý NCKH.`, 'Nộp hồ sơ thành công');
    } else {
      success('Đã lưu bản nháp đề tài thành công!', 'Lưu nháp');
    }
    router.push('/my-projects');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Back & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Đăng ký đề tài nghiên cứu mới
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vui lòng hoàn thành đầy đủ thông tin biểu mẫu đăng ký bên dưới để gửi lên Hội đồng xét duyệt.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveOrSubmit('DRAFT')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition"
          >
            <Save className="w-4 h-4 text-slate-500" /> Lưu bản nháp
          </button>
          <button
            type="button"
            onClick={() => handleSaveOrSubmit('SUBMIT')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold text-xs shadow-sm transition"
          >
            <CheckCircle2 className="w-4 h-4 text-white" /> Gửi duyệt hồ sơ
          </button>
        </div>
      </div>

      {/* SECTION I: THÔNG TIN CHUNG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            I. Thông tin chung
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
              className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-medium"
            >
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Hạn nộp: {r.endDate})
                </option>
              ))}
            </select>
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
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  Cấp Cơ sở
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="radio"
                    name="mgmtLevel"
                    checked={managementLevel === 'CẤP_BỘ'}
                    onChange={() => setManagementLevel('CẤP_BỘ')}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  Cấp Bộ
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="radio"
                    name="mgmtLevel"
                    checked={managementLevel === 'CẤP_QUỐC_GIA'}
                    onChange={() => setManagementLevel('CẤP_QUỐC_GIA')}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  Cấp Quốc gia / Nhà nước
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
              className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* SECTION II: THÔNG TIN NHÂN SỰ & TIẾN ĐỘ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            II. Thông tin nhân sự & Tiến độ
          </h2>
        </div>

        <div className="p-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Chủ nhiệm đề tài <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={piName}
                onChange={(e) => setPiName(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Khoa/Phòng công tác <span className="text-rose-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-medium"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Thời gian thực hiện - Từ ngày <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Thời gian thực hiện - Đến ngày <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Kinh phí dự kiến (VND) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000000"
                  required
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                  className="w-full p-3 pr-14 rounded-xl border border-slate-300 font-black text-slate-900 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  VND
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION III: THÀNH VIÊN THAM GIA NGHIÊN CỨU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            III. Thành viên tham gia nghiên cứu
          </h2>
          <button
            type="button"
            onClick={() => setShowMemberModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm thành viên
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 border-b border-slate-200 font-bold text-slate-600">
              <tr>
                <th className="px-6 py-3">Họ tên thành viên</th>
                <th className="px-6 py-3">Học vị / Học hàm</th>
                <th className="px-6 py-3">Khoa / Phòng công tác</th>
                <th className="px-6 py-3">Vai trò tham gia</th>
                <th className="px-6 py-3 text-center">Đóng góp %</th>
                <th className="px-6 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{m.fullName}</td>
                  <td className="px-6 py-3.5 text-slate-600">{m.academicRank}</td>
                  <td className="px-6 py-3.5 text-slate-600">{m.unit}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        m.roleInProject === 'CHỦ_NHIỆM'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : m.roleInProject === 'THƯ_KÝ_KH'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.roleInProject === 'CHỦ_NHIỆM'
                        ? 'Chủ nhiệm đề tài'
                        : m.roleInProject === 'THƯ_KÝ_KH'
                        ? 'Thư ký đề tài'
                        : 'Thành viên nghiên cứu'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center font-bold text-slate-800">
                    {m.contributionPercentage}%
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {m.roleInProject !== 'CHỦ_NHIỆM' ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Xóa thành viên"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Chủ nhiệm</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION IV: SÀNG LỌC ĐẠO ĐỨC Y SINH */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            IV. Sàng lọc Đạo đức Y sinh học (Thông tư 43/2024/TT-BYT)
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isEthicsRequired
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            {isEthicsRequired ? 'Bắt buộc Hội đồng Đạo đức thẩm định' : 'Không thuộc diện thẩm định đạo đức'}
          </span>
        </div>

        <div className="p-6 space-y-3 text-xs">
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={involvesHumanSubjects}
              onChange={(e) => setInvolvesHumanSubjects(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 mt-0.5"
            />
            <div>
              <p className="font-bold text-slate-900">
                1. Nghiên cứu có can thiệp hoặc thu thập thông tin trực tiếp trên người bệnh / người tình nguyện?
              </p>
              <p className="text-slate-500 mt-0.5">
                Bao gồm hỏi bệnh, khám lâm sàng, phỏng vấn, khảo sát sức khỏe người bệnh.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={involvesIdentifiableData}
              onChange={(e) => setInvolvesIdentifiableData(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 mt-0.5"
            />
            <div>
              <p className="font-bold text-slate-900">
                2. Nghiên cứu có thu thập hoặc trích xuất hồ sơ bệnh án chứa dữ liệu định danh người bệnh?
              </p>
              <p className="text-slate-500 mt-0.5">
                Hồ sơ bệnh án điện tử, mã số bệnh nhân, họ tên, địa chỉ, số điện thoại người bệnh.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={involvesBiologicalSamples}
              onChange={(e) => setInvolvesBiologicalSamples(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 mt-0.5"
            />
            <div>
              <p className="font-bold text-slate-900">
                3. Nghiên cứu có lấy mẫu bệnh phẩm sinh học (máu, mô, dịch sinh học) từ người bệnh?
              </p>
              <p className="text-slate-500 mt-0.5">
                Lấy mẫu mới hoặc sử dụng mẫu lưu trữ tại ngân hàng mô/xét nghiệm.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={involvesNewInterventions}
              onChange={(e) => setInvolvesNewInterventions(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 mt-0.5"
            />
            <div>
              <p className="font-bold text-slate-900">
                4. Nghiên cứu có thử nghiệm thuốc mới, thiết bị y tế mới hoặc kỹ thuật can thiệp mới?
              </p>
              <p className="text-slate-500 mt-0.5">
                Thử nghiệm lâm sàng kỹ thuật điều trị mới chưa nằm trong danh mục thường quy.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* SECTION V: HỒ SƠ, TÀI LIỆU KÈM THEO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            V. Hồ sơ, tài liệu kèm theo
          </h2>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Dropzone Upload */}
          <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUploadSimulate}
            />
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-teal-600 group-hover:scale-110 transition">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm mt-3">
              Kéo thả hồ sơ đính kèm vào đây hoặc <span className="text-teal-600">click để duyệt file</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Hỗ trợ định dạng: PDF, Word, Excel. Dung lượng tối đa: 25MB
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
                    <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">{file.name}</p>
                      <span className="text-[10px] text-slate-400">{file.size}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Học hàm / Học vị</label>
                  <input
                    type="text"
                    value={newMemberRank}
                    onChange={(e) => setNewMemberRank(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khoa / Phòng</label>
                  <input
                    type="text"
                    value={newMemberUnit}
                    onChange={(e) => setNewMemberUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vai trò tham gia</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
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
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-900/20"
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
