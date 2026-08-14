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
  const { success, info } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'DOCUMENTS' | 'HISTORY'>('OVERVIEW');
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

  if (!project) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200 max-w-xl mx-auto shadow-2xs my-8 text-xs">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Mã đề tài không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <Link
          href="/projects"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A6EBD] text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-[#085896] transition cursor-pointer"
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
  const isExecutionStage = ['WAITING_ASSIGNMENT', 'IN_PROGRESS', 'WAITING_ACCEPTANCE', 'ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(project.status);

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
      ['WAITING_ASSIGNMENT', 'IN_PROGRESS'].includes(project.status)
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
      info('Chỉ Chủ nhiệm đề tài được nộp hồ sơ đăng ký.');
      return;
    }

    if (project.status !== 'DRAFT' || project.proposalStatus !== 'DRAFT') {
      info('Hồ sơ không ở trạng thái cho phép nộp.');
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
    <div className="space-y-4 w-full text-slate-800 text-xs pb-16">
      {/* ── QUAY LẠI ── */}
      <div className="flex items-center">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-[#0A6EBD] transition select-none cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Hồ sơ & đề tài
        </Link>
      </div>

      {/* ── HEADER CARD TẬP TRUNG ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col md:flex-row justify-between items-start gap-5">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-xs bg-slate-100 text-[#0A6EBD] px-2.5 py-0.5 rounded border border-slate-200 shrink-0">
              {project.projectCode || project.proposalCode}
            </span>
            <StatusBadge status={displayStatus} type={displayStatusType} />
          </div>

          <h1 className="text-base md:text-lg font-bold text-slate-900 leading-snug break-words">
            {project.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs pt-0.5 font-medium text-slate-600">
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
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500">{project.approvedBudget ? 'Kinh phí duyệt:' : 'Kinh phí đề xuất:'}</span>
              <strong className="font-bold text-emerald-700 font-mono">{formatVND(project.approvedBudget || project.estimatedBudget)}</strong>
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
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                  </Link>
                  <button
                    onClick={handleSubmitProposal}
                    className="px-3.5 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Nộp hồ sơ
                  </button>
                </div>
              )}

              {/* 2. Đã qua thẩm định hành chính -> Hoàn thiện & nộp đề cương */}
              {project.proposalStatus === 'ADMIN_VALIDATED' && (
                <Link
                  href={`/projects/${project.id}/outline-update`}
                  className="px-3.5 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Hoàn thiện & nộp đề cương
                </Link>
              )}

              {/* 3. Bị yêu cầu sửa đổi -> Bổ sung & Nộp lại */}
              {(project.proposalStatus === 'REVISION_REQUIRED' || project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED') && (
                <Link
                  href={`/projects/${project.id}/resubmit`}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Bổ sung & Nộp lại
                </Link>
              )}

              {/* 4. Hồ sơ nghiệm thu */}
              {project.status === 'IN_PROGRESS' && !project.acceptanceDossier && (
                <Link
                  href={`/projects/${project.id}/acceptance`}
                  className="px-3.5 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Lập hồ sơ nghiệm thu
                </Link>
              )}

              {project.status === 'WAITING_ACCEPTANCE' &&
                project.acceptanceDossier?.status === 'REVISION_REQUIRED' && (
                  <Link
                    href={`/projects/${project.id}/acceptance`}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
              <span>Thao tác / Báo cáo</span>
            </button>

            {showMoreActions && (
              <div className="absolute right-0 top-8 z-50 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-left text-xs font-semibold text-slate-700 animate-in fade-in duration-100 space-y-0.5">
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
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tải chứng nhận IRB
                  </button>
                )}

                {recognitionDecision && (
                  <button
                    onClick={() => {
                      setShowMoreActions(false);
                      info(`Đang tải Quyết định công nhận số ${recognitionDecision.decisionNumber}...`);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-[#0A6EBD]" /> Tải Quyết định công nhận
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

      {/* ── TABS NỘI DUNG ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/75 px-3 font-bold text-slate-600 overflow-x-auto select-none">
          {[
            { id: 'OVERVIEW', label: 'Tổng quan' },
            { id: 'MEMBERS', label: 'Thành viên', count: project.members?.length || 0 },
            { id: 'DOCUMENTS', label: 'Tài liệu & Phiên bản', count: project.documents?.length || 0 },
            { id: 'HISTORY', label: 'Lịch sử xử lý', count: project.statusHistory?.length || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded-full font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 select-none">
                    Thông tin hồ sơ / đề tài
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 font-semibold">
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500 font-medium">Lĩnh vực nghiên cứu:</span>
                        <span className="text-slate-900">{project.researchField}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500 font-medium">Loại nghiên cứu:</span>
                        <span className="text-slate-900">{getProjectTypeDisplayName(project.projectType)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500 font-medium">Cấp quản lý:</span>
                        <span className="text-slate-900">{getManagementLevelDisplayName(project.managementLevel)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500 font-medium">Nguồn kinh phí:</span>
                        <span className="text-slate-900">{getFundingSourceDisplayName(project.fundingSource || 'NGÂN_SÁCH_BỆNH_VIỆN')}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500 font-medium">Kinh phí đề xuất:</span>
                        <span className="text-slate-900 font-mono">{formatVND(project.estimatedBudget)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-slate-500 font-medium">Kinh phí phê duyệt:</span>
                        <span className="text-emerald-700 font-mono font-bold">{project.approvedBudget ? formatVND(project.approvedBudget) : 'Chờ phê duyệt'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {projectCouncils.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="border-b border-slate-100 pb-2 font-bold uppercase tracking-wider text-slate-900 select-none">
                      Hội đồng liên quan ({projectCouncils.length})
                    </h3>
                    <div className="space-y-2">
                      {projectCouncils.map((item) => (
                        <Link
                          key={item.id}
                          href={`/councils/${item.id}`}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 transition hover:border-sky-200 hover:bg-sky-50/30"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-slate-500">{item.code}</p>
                          </div>
                          <StatusBadge status={item.status} type="COUNCIL" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3.5 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-[#0B2A63] uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5 select-none">
                    <FileText className="w-4 h-4 text-[#0A6EBD]" />
                    <span>Nội dung thuyết minh đề xuất</span>
                  </h3>
                  <div className="space-y-3 font-semibold leading-relaxed">
                    {project.urgencyExplanation && (
                      <div>
                        <strong className="text-slate-900 font-bold block mb-1">1. Tính cấp thiết của đề tài:</strong>
                        <p className="bg-white p-3 rounded-lg border border-slate-200/80 font-medium whitespace-pre-wrap">{project.urgencyExplanation}</p>
                      </div>
                    )}

                    <div>
                      <strong className="text-slate-900 font-bold block mb-1">2. Mục tiêu nghiên cứu:</strong>
                      <p className="bg-white p-3 rounded-lg border border-slate-200/80 font-medium whitespace-pre-wrap">{project.expectedObjectives || project.summary}</p>
                    </div>

                    {project.researchDesign && (
                      <div className="space-y-1.5">
                        <strong className="text-slate-900 font-bold block">3. Thiết kế & Đối tượng nghiên cứu:</strong>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-3 border-l-2 border-slate-300 font-medium">
                          <div>
                            <span className="text-slate-500 block font-bold mb-0.5">3.1. Thiết kế nghiên cứu:</span>
                            <span className="text-slate-900 font-bold">{project.researchDesign}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-bold mb-0.5">3.2. Đối tượng nghiên cứu:</span>
                            <span className="text-slate-900 font-bold">{project.researchSubjects}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <strong className="text-slate-900 font-bold block mb-1">4. Sản phẩm / Kết quả đầu ra cam kết:</strong>
                      <p className="bg-white p-3 rounded-lg border border-slate-200/80 font-medium">{project.expectedProducts || project.acceptanceDossier?.productsCommitted || 'Báo cáo tổng kết nghiệm thu đề tài khoa học cấp cơ sở.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: NHIỆM VỤ & CẢNH BÁO */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <h3 className="font-bold text-[#0B2A63] uppercase tracking-wider select-none">Trạng thái xử lý hiện tại</h3>
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={displayStatus} type={displayStatusType} />
                    <span className="text-[11px] font-semibold text-slate-500">Bước {workflowState.currentStepNumber}</span>
                  </div>
                </div>

                <div className="bg-sky-50/50 border border-sky-200/70 rounded-xl p-4 space-y-2">
                  <h3 className="font-bold text-[#0B2A63] uppercase tracking-wider flex items-center gap-1.5 select-none">
                    <Activity className="w-4 h-4 text-[#0A6EBD] shrink-0" />
                    <span>Nhiệm vụ cần thực hiện</span>
                  </h3>
                  <div className="font-bold leading-relaxed bg-white p-3 rounded-lg border border-sky-100 shadow-2xs text-slate-800">
                    {getActionableTaskForUser()}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <h3 className="font-bold text-[#0B2A63] uppercase tracking-wider select-none">
                    Hồ sơ giai đoạn hiện tại
                  </h3>
                  <div className="space-y-2">
                    {getRequiredDocumentsForStep().map((doc, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200 font-semibold shadow-2xs">
                        <div className="space-y-0.5 flex-1">
                          <span className="text-slate-800 font-bold block">{doc.name}</span>
                          <span className="text-slate-500 font-medium block">Trạng thái: {doc.status}</span>
                        </div>
                        {doc.required && (
                          <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded shrink-0 select-none">Bắt buộc</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {getWarnings().length > 0 && (
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 select-none">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Cảnh báo hồ sơ</span>
                    </h3>
                    <div className="space-y-1.5 font-semibold text-amber-900 leading-snug">
                      {getWarnings().map((w, idx) => (
                        <p key={idx} className="flex items-start gap-1">
                          <span className="text-amber-500 font-bold select-none">•</span>
                          <span>{w}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === 'MEMBERS' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                Danh sách Thành viên Nghiên cứu ({project.members?.length || 0} thành viên)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#0B2A63] text-white font-bold uppercase select-none text-[11px]">
                    <tr>
                      <th className="p-3">Họ và tên</th>
                      <th className="p-3">Học hàm / Học vị</th>
                      <th className="p-3">Đơn vị công tác</th>
                      <th className="p-3">Vai trò trong đề tài</th>
                      <th className="p-3 text-right">Tỷ lệ đóng góp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {(!project.members || project.members.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-semibold">Chưa thiết lập danh sách thành viên.</td>
                      </tr>
                    ) : (
                      project.members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-bold text-slate-950">{m.fullName}</td>
                          <td className="p-3 text-slate-600">{m.academicRank}</td>
                          <td className="p-3 text-slate-600">{m.unit}</td>
                          <td className="p-3 font-semibold text-[#0A6EBD]">{m.roleInProject}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">{m.contributionPercentage}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS (CÓ MỞ RỘNG XEM LỊCH SỬ PHIÊN BẢN) */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                Tài liệu hồ sơ & phiên bản ({project.documents?.length || 0} tài liệu)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#0B2A63] text-white font-bold uppercase select-none text-[11px]">
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
                              <td className="p-3 font-mono font-bold text-[#0A6EBD] text-center">v{doc.currentVersion}.0</td>
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
                                    className="text-[#0A6EBD] hover:underline font-bold inline-flex items-center gap-1"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Tải về
                                  </a>
                                ) : (
                                  <span className="text-slate-400 font-normal">Chưa có tệp</span>
                                )}
                              </td>
                            </tr>

                            {/* Lịch sử phiên bản bung ra */}
                            {isExpanded && (
                              <tr className="bg-slate-50/80">
                                <td colSpan={6} className="p-3 pl-8">
                                  <div className="space-y-1.5 border-l-2 border-[#0A6EBD] pl-3">
                                    <p className="font-bold text-[11px] text-slate-800 uppercase">Lịch sử các phiên bản tải lên:</p>
                                    {doc.versions?.map((v) => (
                                      <div key={v.id} className="flex items-center justify-between text-[11px] bg-white p-2 rounded border border-slate-200 font-medium">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-[#0A6EBD]">v{v.version}.0</span>
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

          {/* TAB 4: HISTORY */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                Lịch sử trạng thái & nhật ký xử lý ({project.statusHistory?.length || 0} bản ghi)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#0B2A63] text-white font-bold uppercase select-none text-[11px]">
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
                          <td className="p-3 text-slate-600 font-semibold uppercase text-[10px]">{h.userRole}</td>
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