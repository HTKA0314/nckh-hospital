'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DocxExportService } from '@/lib/services/docx-export-service';
import {
  formatVND,
  formatDate,
  getProjectTypeDisplayName,
  getFundingSourceDisplayName,
  getManagementLevelDisplayName,
  getDocumentTypeDisplayName,
} from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  FileText,
  Activity,
  Award,
  Download,
  Printer,
  Edit,
  Send,
  MoreVertical,
  Upload,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getFlowchartStepInfo } from '@/lib/utils/flowchart-helper';
import { getProjectWorkflowState } from '@/lib/utils/workflow-engine';
import { useToast } from '@/components/ui/Toast';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { currentUser } = useAuth();
  const { success, warning } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'INFO' | 'OUTLINE' | 'FINANCE' | 'COUNCILS' | 'HISTORY'>('INFO');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowMoreActions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500 text-xs font-medium">Đang tải hồ sơ đề tài...</div>;
  }

  const project = repo.getProjectById(params.id);
  const projectCouncils = project
    ? repo.getCouncils().filter((item) => item.projectIds.includes(project.id))
    : [];

  const scientificCouncil = projectCouncils.find((c) => c.type === 'PROPOSAL_REVIEW' || c.type === 'ACCEPTANCE') || projectCouncils[0];
  const councilEvaluations = scientificCouncil
    ? (scientificCouncil.evaluationResults || []).filter((r) => r.projectId === project?.id)
    : [];
  const councilMinutes = scientificCouncil
    ? repo.getCouncilMeetingMinutes(scientificCouncil.id)
    : undefined;
  const projectMinuteResult = councilMinutes?.projectResults.find((r) => r.projectId === project?.id);

  if (!project) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200 max-w-xl mx-auto shadow-sm my-8 text-xs">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Mã đề tài không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <Link
          href="/projects"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục
        </Link>
      </div>
    );
  }

  const policy = repo.getPolicyById(project.workflowPolicyId) || repo.getPolicies()[0];
  const workflowState = getProjectWorkflowState(project, policy);

  const isProposalStage =
    project.status === 'DRAFT' ||
    project.status === 'SUBMITTED';

  const displayStatus = isProposalStage
    ? project.proposalStatus
    : project.status;

  const displayStatusType = isProposalStage ? 'PROPOSAL' : 'PROJECT';
  const isExecutionStage = ['APPROVED_PENDING_CONTRACT', 'IN_PROGRESS', 'CLOSING_SUBMITTED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED'].includes(project.status);

  const recognitionDecision = repo
    .getDecisions({ projectId: project.id, type: 'RECOGNITION' })
    .find((decision) => decision.status === 'ISSUED');

  const getActionableTaskForUser = () => {
    if (!currentUser) return 'Vui lòng đăng nhập để xem nhiệm vụ.';
    const step = workflowState.currentStepNumber;
    const isPI = project.principalInvestigatorId === currentUser.id;
    const stepInfo = getFlowchartStepInfo(step);

    if (currentUser.role === 'RESEARCHER') {
      if (!isPI) {
        return 'Bạn tham gia với tư cách là thành viên nghiên cứu. Vui lòng phối hợp hỗ trợ Chủ nhiệm thực hiện các nội dung chuyên môn.';
      }
      return stepInfo.researcherTasks.join(' ') || 'Theo dõi tiến trình xử lý từ Phòng Quản lý NCKH.';
    }

    if (currentUser.role === 'RESEARCH_OFFICE') {
      return stepInfo.officeTasks.join(' ') || 'Theo dõi và giám sát tiến độ thực hiện đề tài khoa học.';
    }

    if (currentUser.role === 'DIRECTOR') {
      if (step === 7) {
        return 'Ban Giám đốc cần xem xét phê duyệt Tờ trình và ký ban hành Quyết định giao thực hiện đề tài.';
      }
      if (step === 13) {
        return 'Ban Giám đốc cần xem xét ký ban hành Quyết định công nhận kết quả nghiên cứu khoa học.';
      }
      return 'Theo dõi các hoạt động nghiên cứu khoa học và kết quả nghiệm thu của bệnh viện.';
    }

    return 'Theo dõi hồ sơ đề tài trên hệ thống.';
  };

  const getRequiredDocumentsForStep = () => {
    const step = workflowState.currentStepNumber;
    const currentStepState = workflowState.steps.find((s) => s.stepNumber === step);
    if (!currentStepState || !currentStepState.requiredDocuments || currentStepState.requiredDocuments.length === 0) {
      return [
        { name: 'Không yêu cầu hồ sơ đính kèm bắt buộc ở bước này.', status: 'N/A', required: false }
      ];
    }
    return currentStepState.requiredDocuments.map((doc) => ({
      name: doc.label,
      status: doc.uploaded ? 'Đã tải lên' : 'Chưa tải lên',
      required: doc.required
    }));
  };

  const getWarnings = () => {
    const warnings: string[] = [];
    if (
      project.ethicsRequired &&
      project.ethicsStatus !== 'ETHICS_APPROVED' &&
      project.ethicsStatus !== 'NOT_REQUIRED' &&
      ['APPROVED_PENDING_CONTRACT', 'IN_PROGRESS'].includes(project.status)
    ) {
      warnings.push('Điều kiện đạo đức chưa hoàn tất; cần kiểm tra trước khi chuyển sang/tiếp tục giai đoạn thực hiện.');
    }
    if (
      project.status === 'IN_PROGRESS' &&
      project.endDate &&
      new Date(project.endDate).getTime() < Date.now()
    ) {
      warnings.push('Đề tài đã quá thời gian thực hiện dự kiến; cần kiểm tra yêu cầu gia hạn/điều chỉnh.');
    }
    return warnings;
  };

  const handleSubmitProposal = () => {
    if (currentUser.id !== project.principalInvestigatorId) {
      warning('Chỉ Chủ nhiệm đề tài được nộp hồ sơ đăng ký.');
      return;
    }

    if (project.status !== 'DRAFT' || project.proposalStatus !== 'DRAFT') {
      warning('Hồ sơ không ở trạng thái cho phép nộp.');
      return;
    }

    const submittedAt = new Date().toISOString();
    const updated = repo.updateProject(project.id, {
      status: 'SUBMITTED',
      proposalStatus: 'SUBMITTED',
      submittedAt,
      updatedAt: submittedAt,
    });

    if (updated) {
      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        actionCode: 'SUBMIT_PROPOSAL',
        entityType: 'PROJECT',
        entityId: project.id,
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED',
        notes: 'Chủ nhiệm nộp hồ sơ đăng ký đề tài.',
      });
      success('Đã nộp hồ sơ đăng ký đề tài thành công.');
    }
  };

  return (
    <div className="space-y-4 w-full text-slate-800 pb-16">
      {/* ── QUAY LẠI ── */}
      <div className="flex items-center">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition select-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Hồ sơ & đề tài
        </Link>
      </div>

      {/* ── HEADER CARD TẬP TRUNG ── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col md:flex-row justify-between items-start gap-5">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200 shrink-0">
              {project.projectCode || project.proposalCode}
            </span>
            <StatusBadge status={displayStatus} type={displayStatusType} />
          </div>

          <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-snug break-words">
            {project.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm pt-1 font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Chủ nhiệm: <strong className="text-slate-800">{project.principalInvestigatorName}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{project.departmentName}</span>
            </span>
            {isExecutionStage && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
                </span>
              </>
            )}
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">{project.approvedBudget ? 'Kinh phí duyệt:' : 'Kinh phí đề xuất:'}</span>
              <strong className="font-bold text-slate-800 font-mono">{formatVND(project.approvedBudget || project.estimatedBudget)}</strong>
            </span>
          </div>
        </div>

        {/* NÚT THAO TÁC NGHIỆP VỤ CHÍNH */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          {currentUser && (currentUser.id === project.principalInvestigatorId) && (
            <>
              {/* 1. Đề tài Bản nháp */}
              {project.status === 'DRAFT' && project.proposalStatus === 'DRAFT' && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/projects/register?draftId=${project.id}`}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                  </Link>
                  <button
                    onClick={handleSubmitProposal}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Nộp hồ sơ
                  </button>
                </div>
              )}

              {/* 2. Đã qua thẩm định hành chính -> Hoàn thiện & nộp đề cương */}
              {project.proposalStatus === 'ADMIN_VALIDATED' && (
                <Link
                  href={`/projects/${project.id}/outline-update`}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Hoàn thiện & nộp đề cương
                </Link>
              )}

              {/* 3. Bị yêu cầu sửa đổi -> Bổ sung & Nộp lại */}
              {(project.proposalStatus === 'REVISION_REQUIRED' || project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED') && (
                <Link
                  href={`/projects/${project.id}/resubmit`}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Bổ sung & Nộp lại
                </Link>
              )}

              {/* 4. Hồ sơ nghiệm thu */}
              {project.status === 'IN_PROGRESS' && !project.acceptanceDossier && (
                <Link
                  href={`/projects/${project.id}/acceptance`}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Lập hồ sơ nghiệm thu
                </Link>
              )}

              {project.status === 'CLOSING_SUBMITTED' &&
                project.acceptanceDossier?.status === 'REVISION_REQUIRED' && (
                  <Link
                    href={`/projects/${project.id}/acceptance`}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Bổ sung hồ sơ nghiệm thu
                  </Link>
                )}
            </>
          )}

          {/* MENU CÁC TÁC VỤ PHỤ */}
          <div className="relative inline-block text-left" ref={actionsMenuRef}>
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
              <span>Thao tác / Báo cáo</span>
            </button>

            {showMoreActions && (
              <div className="absolute right-0 top-8 z-50 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-left text-sm font-semibold text-slate-700 animate-in fade-in duration-100 space-y-0.5">
                <button
                  onClick={() => {
                    setShowMoreActions(false);
                    DocxExportService.exportProposalDocx(project);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-400" /> Xuất Thuyết minh (.docx)
                </button>

                {project.ethicsRequired && project.ethicsStatus === 'ETHICS_APPROVED' && (
                  <button
                    onClick={() => {
                      setShowMoreActions(false);
                      DocxExportService.exportEthicsCertificatePdf(project);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-500" /> Tải chứng nhận IRB
                  </button>
                )}

                {recognitionDecision && (
                  <button
                    onClick={() => {
                      setShowMoreActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-slate-700" /> Tải Quyết định công nhận
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMoreActions(false);
                    window.print();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-400" /> In trang thông tin đề tài
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TABS NỘI DUNG TƯƠNG TỰ HỆ THỐNG MẪU ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 px-2 font-bold text-slate-600 overflow-x-auto select-none">
          {[
            { id: 'INFO', label: 'Thông tin & Đề xuất' },
            { id: 'OUTLINE', label: 'Hồ sơ & Tài liệu đính kèm', count: project.documents?.length || 0 },
            { id: 'FINANCE', label: 'Tài chính' },
            { id: 'COUNCILS', label: 'Hội đồng & Đánh giá' },
            { id: 'DECISIONS', label: 'Quyết định', count: project.decisions?.length || 0 },
            { id: 'HISTORY', label: 'Lịch sử xử lý', count: project.statusHistory?.length || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3.5 border-b-2 text-sm transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${activeTab === tab.id
                  ? 'border-slate-800 text-slate-700 bg-white font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 font-semibold'
                }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="text-xs bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 text-sm">
          {/* TAB 1: THÔNG TIN CHI TIẾT (INFO & MEMBERS) */}
          {activeTab === 'INFO' && (
            <div className="space-y-6">

              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 select-none">
                  1. Thông tin chung của đề tài
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-3 font-semibold text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Lĩnh vực nghiên cứu:</span>
                    <span className="text-slate-900 font-bold">{project.researchField}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Loại hình nghiên cứu:</span>
                    <span className="text-slate-900 font-bold">{getProjectTypeDisplayName(project.projectType)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Cấp quản lý đề tài:</span>
                    <span className="text-slate-900 font-bold">{getManagementLevelDisplayName(project.managementLevel)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Nguồn kinh phí:</span>
                    <span className="text-slate-900 font-bold">{getFundingSourceDisplayName(project.fundingSource || 'NGÂN_SÁCH_BỆNH_VIỆN')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Kinh phí đề xuất:</span>
                    <span className="text-slate-900 font-mono font-bold">{formatVND(project.estimatedBudget)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Kinh phí phê duyệt:</span>
                    <span className="text-slate-800 font-mono font-bold">{project.approvedBudget ? formatVND(project.approvedBudget) : 'Chờ duyệt'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 select-none flex items-center justify-between">
                  <span>2. Danh sách thành viên nhóm nghiên cứu ({project.members?.length || 0})</span>
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-[#0B2A63] text-white font-bold uppercase select-none text-xs tracking-wider">
                      <tr>
                        <th className="p-3">Họ và tên</th>
                        <th className="p-3">Học hàm / Học vị</th>
                        <th className="p-3">Đơn vị công tác</th>
                        <th className="p-3">Vai trò</th>
                        <th className="p-3 text-right">Đóng góp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {(!project.members || project.members.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 font-semibold">Chưa thiết lập danh sách thành viên.</td>
                        </tr>
                      ) : (
                        project.members.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/60">
                            <td className="p-3 font-bold text-slate-900">{m.fullName}</td>
                            <td className="p-3 text-slate-600">{m.academicRank}</td>
                            <td className="p-3 text-slate-600">{m.unit}</td>
                            <td className="p-3 font-semibold text-slate-700">{m.roleInProject}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">{m.contributionPercentage}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                  3. Tính cấp thiết của đề tài
                </h3>
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 text-sm leading-relaxed font-medium text-slate-800 whitespace-pre-wrap">
                  {project.urgencyExplanation || 'Chưa có mô tả tính cấp thiết.'}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                  4. Mục tiêu nghiên cứu
                </h3>
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 text-sm leading-relaxed font-medium text-slate-800 whitespace-pre-wrap">
                  {project.expectedObjectives || project.summary || 'Chưa mô tả chi tiết mục tiêu.'}
                </div>
              </div>

              {project.researchDesign && (
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                    5. Thiết kế & Đối tượng nghiên cứu
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-slate-500 text-xs uppercase font-bold block">5.1. Thiết kế nghiên cứu:</strong>
                      <p className="font-bold text-slate-900">{project.researchDesign}</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-slate-500 text-xs uppercase font-bold block">5.2. Đối tượng nghiên cứu:</strong>
                      <p className="font-bold text-slate-900">{project.researchSubjects}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-200 pb-1.5">
                  6. Sản phẩm / Kết quả đầu ra cam kết
                </h3>
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 text-sm leading-relaxed font-medium text-slate-800">
                  {project.expectedProducts || project.acceptanceDossier?.productsCommitted || 'Báo cáo khoa học tổng kết và bài báo đăng tạp chí chuyên ngành.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THÔNG TIN ĐỀ CƯƠNG & TÀI LIỆU (OUTLINE & DOCUMENTS) */}
          {activeTab === 'OUTLINE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  Hồ sơ Đề cương & Tài liệu đính kèm ({project.documents?.length || 0} tài liệu)
                </h3>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-[#0B2A63] text-white font-bold uppercase select-none text-xs tracking-wider">
                    <tr>
                      <th className="p-3">Loại văn bản</th>
                      <th className="p-3">Tên tài liệu</th>
                      <th className="p-3 w-24 text-center">Phiên bản</th>
                      <th className="p-3">Người tải</th>
                      <th className="p-3 w-32">Ngày cập nhật</th>
                      <th className="p-3 text-right w-44">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {(!project.documents || project.documents.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 font-semibold">Chưa đính kèm tài liệu nào.</td>
                      </tr>
                    ) : (
                      project.documents.map((doc) => {
                        const curVerObj = doc.versions?.find((v) => v.version === doc.currentVersion) || doc.versions?.[0];
                        const isExpanded = expandedDocId === doc.id;

                        return (
                          <React.Fragment key={doc.id}>
                            <tr className="hover:bg-slate-50 transition">
                              <td className="p-3 font-bold text-slate-950">{getDocumentTypeDisplayName(doc.documentType)}</td>
                              <td className="p-3 text-slate-800 font-bold">{doc.title}</td>
                              <td className="p-3 font-mono font-bold text-slate-700 text-center">v{doc.currentVersion}.0</td>
                              <td className="p-3 text-slate-600">{curVerObj?.uploadedByName || 'Chủ nhiệm'}</td>
                              <td className="p-3 font-mono text-slate-500">{formatDate(curVerObj?.uploadedAt || project.createdAt)}</td>
                              <td className="p-3 text-right space-x-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                                  className="text-slate-600 hover:text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-0.5"
                                >
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  <span>Phiên bản ({doc.versions?.length || 1})</span>
                                </button>
                                {curVerObj?.downloadUrl && curVerObj.downloadUrl !== '#' ? (
                                  <a
                                    href={curVerObj.downloadUrl}
                                    className="text-slate-700 hover:underline font-bold inline-flex items-center gap-1"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Tải về
                                  </a>
                                ) : (
                                  <span className="text-slate-400 font-normal">Chưa có tệp</span>
                                )}
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/80">
                                <td colSpan={6} className="p-3 pl-8">
                                  <div className="space-y-1.5 border-l-2 border-slate-800 pl-3">
                                    <p className="font-bold text-xs text-slate-800 uppercase">Lịch sử các phiên bản tải lên:</p>
                                    {doc.versions?.map((v) => (
                                      <div key={v.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-200 font-medium">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-slate-700">v{v.version}.0</span>
                                          <span className="text-slate-700">{v.fileName}</span>
                                          <span className="text-slate-400 font-mono">({v.fileSize})</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-500 font-mono">
                                          <span>{v.uploadedByName} • {formatDate(v.uploadedAt)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB HỘI ĐỒNG & ĐÁNH GIÁ (COUNCILS) */}
          {activeTab === 'COUNCILS' && (
            <div className="space-y-8">
              {/* Hội đồng Khoa học */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                  1. Hội đồng Khoa học & Công nghệ
                </h3>
                {!scientificCouncil ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 font-medium">
                    Chưa phân công Hội đồng Khoa học cho đề tài này.
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono">{scientificCouncil.code}</span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{scientificCouncil.name}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Hình thức: {scientificCouncil.type === 'ACCEPTANCE' ? 'Hội đồng nghiệm thu đề tài' : 'Hội đồng xét duyệt đề cương'} • {scientificCouncil.location}
                        </p>
                      </div>
                      <StatusBadge status={scientificCouncil.status} type="COUNCIL" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        A. Kết quả đánh giá từng thành viên ({councilEvaluations.length} phiếu)
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead className="bg-[#0B2A63] text-white font-bold uppercase select-none text-xs tracking-wider">
                            <tr>
                              <th className="p-3">Họ và tên thành viên</th>
                              <th className="p-3 text-center">Vai trò HĐ</th>
                              <th className="p-3 text-center">Điểm đánh giá</th>
                              <th className="p-3 text-center">Kết luận phiếu</th>
                              <th className="p-3">Nhận xét chuyên môn</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {councilEvaluations.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-slate-400 font-semibold">Chưa ghi nhận phiếu đánh giá từ các thành viên.</td>
                              </tr>
                            ) : (
                              councilEvaluations.map((evalItem) => (
                                <tr key={evalItem.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-bold text-slate-900">{evalItem.councilMemberName}</td>
                                  <td className="p-3 text-center font-bold text-slate-700">{evalItem.roleInCouncil}</td>
                                  <td className="p-3 text-center font-mono font-bold text-slate-900">{evalItem.totalScore}/100</td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${evalItem.voteResult === 'APPROVE'
                                        ? 'bg-slate-50 text-slate-800 border border-slate-200'
                                        : evalItem.voteResult === 'APPROVE_WITH_REVISION'
                                          ? 'bg-slate-50 text-slate-700 border border-slate-200'
                                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                                      }`}>
                                      {evalItem.voteResult === 'APPROVE' ? 'Thông qua' : evalItem.voteResult === 'APPROVE_WITH_REVISION' ? 'Thông qua có sửa' : 'Không thông qua'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-700 italic">{evalItem.comments || 'Không có nhận xét bổ sung.'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        B. Trích xuất Biên bản họp Hội đồng HĐKH
                      </h4>
                      {!councilMinutes ? (
                        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 font-medium">
                          Chưa lập Biên bản họp Hội đồng chính thức.
                        </div>
                      ) : (
                        <div className="bg-slate-100 p-4 sm:p-6 border border-slate-200 overflow-x-auto rounded-xl">
                          <div className="bg-white max-w-[800px] mx-auto p-10 border border-slate-400 text-black text-[13.5px] leading-relaxed space-y-4" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                            <div className="flex justify-between items-start border-b border-black pb-3">
                              <div className="text-center w-[45%] font-bold">
                                <p className="uppercase text-[12px]">BỘ Y TẾ</p>
                                <p className="uppercase text-[12px]">BỆNH VIỆN ĐA KHOA TRUNG TÂM</p>
                                <p className="text-xs leading-none mt-0.5">——————</p>
                              </div>
                              <div className="text-center w-[50%]">
                                <p className="font-bold uppercase text-[12px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                <p className="font-bold text-[12px]">Độc lập - Tự do - Hạnh phúc</p>
                                <p className="text-xs leading-none mt-0.5">————————————</p>
                              </div>
                            </div>

                            <div className="text-center py-2">
                              <h4 className="text-[15px] font-bold uppercase">TRÍCH XUẤT BIÊN BẢN HỌP HỘI ĐỒNG NCKH</h4>
                              <p className="font-bold mt-1">Đề tài: &quot;{project.title}&quot;</p>
                            </div>

                            <div className="space-y-3 pl-4">
                              <p>- Điểm trung bình Hội đồng: <strong>{projectMinuteResult?.averageScore?.toFixed(1) || '—'}</strong> / 100 điểm.</p>
                              <p>- Kết luận thống nhất: <span>{projectMinuteResult?.summaryOpinion || 'Hội đồng thông qua đề cương và yêu cầu chỉnh sửa hoàn thiện.'}</span></p>
                              {projectMinuteResult?.revisionRequirements && (
                                <div className="pl-4 mt-2">
                                  <p className="font-bold">- Các nội dung yêu cầu chỉnh sửa, bổ sung hoàn thiện:</p>
                                  <p className="pl-2 italic text-sm">{projectMinuteResult.revisionRequirements}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Hội đồng Đạo đức */}
              <div className="space-y-4 pt-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                  2. Hội đồng Đạo đức trong Nghiên cứu Y sinh (IRB)
                </h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      Trạng thái thẩm định đạo đức
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${project.ethicsStatus === 'ETHICS_APPROVED'
                        ? 'bg-slate-100 text-slate-800 border border-slate-300'
                        : project.ethicsStatus === 'NOT_REQUIRED'
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}>
                      {project.ethicsStatus === 'ETHICS_APPROVED' ? 'Đã cấp chứng nhận IRB' : project.ethicsStatus === 'NOT_REQUIRED' ? 'Không yêu cầu IRB' : 'Chờ thẩm định đạo đức'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    Yêu cầu thẩm định đạo đức: <strong>{project.ethicsRequired ? 'Có bắt buộc' : 'Không bắt buộc'}</strong>
                  </p>
                </div>

                {project.ethicsRequired ? (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Kết luận của Hội đồng Đạo đức</h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      Hồ sơ đề tài đã qua thẩm định về khía cạnh bảo vệ đối tượng nghiên cứu, tính chấp thuận thông tin (Informed Consent) và độ an toàn trong quy trình can thiệp lâm sàng.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 font-semibold bg-slate-50 rounded-xl border border-slate-200">
                    Đề tài thuộc nhóm nghiên cứu mô tả/hồ sơ bệnh án không thuộc diện thẩm định đạo đức y sinh bắt buộc.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB TÀI CHÍNH */}
          {activeTab === 'FINANCE' && (
            <div className="space-y-6">

              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 select-none">
                  1. Tổng quan ngân sách
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-3 font-semibold text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Kinh phí đề xuất:</span>
                    <span className="text-slate-900 font-mono font-bold">{formatVND(project.estimatedBudget)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Kinh phí được duyệt:</span>
                    <span className="text-slate-900 font-mono font-bold">{project.approvedBudget ? formatVND(project.approvedBudget) : 'Chờ duyệt'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium text-emerald-700">Đã cấp (Tạm ứng):</span>
                    <span className="text-emerald-700 font-mono font-bold">
                      {project.approvedBudget ? formatVND(project.approvedBudget * 0.5) : '0 đ'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium text-[#0A6EBD]">Đã quyết toán:</span>
                    <span className="text-[#0A6EBD] font-mono font-bold">
                      {project.status === 'COMPLETED' ? formatVND(project.approvedBudget || 0) : '0 đ'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Trạng thái giải ngân:</span>
                    <span className="text-slate-800 font-bold">{project.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Đang thực hiện'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Trạng thái quyết toán:</span>
                    <span className="text-slate-600 font-medium">{project.status === 'COMPLETED' ? 'Đã quyết toán hoàn tất' : 'Chưa quyết toán hoàn tất'}</span>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Lưu ý về nguồn kinh phí:</strong> Đối với các đề tài cấp cơ sở, kinh phí được trích từ Quỹ phát triển hoạt động sự nghiệp của Bệnh viện. Chi phí cho đề tài (ví dụ: hóa chất, vật tư, xét nghiệm phục vụ riêng cho NCKH) không được trùng lắp với chi phí do BHYT hoặc người bệnh tự chi trả.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2 select-none flex items-center justify-between">
                  <span>2. Hồ sơ & Chứng từ tài chính</span>
                </h3>

                <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm mb-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Chưa có hồ sơ tài chính</h4>
                  <p className="text-xs text-slate-500 mb-4 max-w-sm">Tải lên các tài liệu như Bản dự toán kinh phí chi tiết, Báo giá, hoặc Chứng từ hóa đơn thanh toán (không bắt buộc).</p>

                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-bold transition shadow-sm">
                    <Upload className="w-4 h-4" /> Tải tệp lên
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB: DECISIONS */}
          {activeTab === 'DECISIONS' as any && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider select-none">
                  Danh sách quyết định
                </h3>
              </div>
              
              {!project.decisions || project.decisions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                  <p className="text-sm font-semibold text-slate-500">Chưa có quyết định nào được tạo cho đề tài này.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {project.decisions.map((decision) => (
                    <div key={decision.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-white shadow-2xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${decision.type === 'ASSIGNMENT' ? 'bg-sky-50 text-[#0A6EBD] border border-sky-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            {decision.type === 'ASSIGNMENT' ? 'Giao thực hiện' : 'Công nhận kết quả'}
                          </span>
                          <span className="font-mono text-sm font-bold text-slate-900">{decision.decisionNumber || '(Chưa cấp số)'}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Người tạo: {decision.history?.[0]?.actorName || '—'} • Ngày tạo: {formatDate(decision.createdAt)}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          decision.status === 'ISSUED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                          decision.status === 'SIGNED' ? 'bg-sky-50 text-[#0A6EBD] border border-sky-200' : 
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {decision.status === 'ISSUED' ? 'Đã ban hành' : 
                           decision.status === 'SIGNED' ? 'Đã ký' : 
                           decision.status === 'PENDING_SIGNATURE' ? 'Chờ ký' : 
                           decision.status === 'RETURNED' ? 'Trả lại' : 'Dự thảo'}
                        </span>
                        <Link href={`/decisions/${decision.id}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs">
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: LỊCH SỬ XỬ LÝ (HISTORY) */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                Nhật ký xử lý & Lịch sử trạng thái ({project.statusHistory?.length || 0} bản ghi)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-[#0B2A63] text-white font-bold uppercase select-none text-xs tracking-wider">
                    <tr>
                      <th className="p-3 w-36">Thời gian</th>
                      <th className="p-3 w-40">Người thực hiện</th>
                      <th className="p-3 w-28">Vai trò</th>
                      <th className="p-3">Hành động & Góp ý</th>
                      <th className="p-3 w-36 text-center">Trạng thái đích</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {(!project.statusHistory || project.statusHistory.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-semibold">Chưa ghi nhận lịch sử xử lý.</td>
                      </tr>
                    ) : (
                      project.statusHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-mono text-slate-500">{formatDate(h.changedAt)}</td>
                          <td className="p-3 font-bold text-slate-950">{h.changedByName}</td>
                          <td className="p-3 text-slate-600 font-semibold uppercase text-xs tracking-wider">{h.userRole}</td>
                          <td className="p-3 text-slate-800">
                            <p className="font-bold text-slate-900 leading-snug">{h.action}</p>
                            {h.comment && <p className="text-slate-500 italic mt-0.5">&ldquo;{h.comment}&rdquo;</p>}
                          </td>
                          <td className="p-3 text-center">
                            <StatusBadge
                              status={h.toStatus}
                              type={
                                [
                                  'UNDER_ADMIN_REVIEW',
                                  'REVISION_REQUIRED',
                                  'RESUBMITTED',
                                  'ADMIN_VALIDATED',
                                  'OUTLINE_SUBMITTED',
                                  'UNDER_PROPOSAL_REVIEW',
                                  'PROPOSAL_REVISION_REQUIRED',
                                  'PROPOSAL_RESUBMITTED',
                                  'UNDER_PROPOSAL_REVISION_REVIEW',
                                  'PROPOSAL_APPROVED',
                                ].includes(String(h.toStatus))
                                  ? 'PROPOSAL'
                                  : 'PROJECT'
                              }
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}