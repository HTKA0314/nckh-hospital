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
  getEthicsStatusDisplayName,
  getDocumentTypeDisplayName,
} from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  DollarSign,
  FileCheck2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  Users,
  Activity,
  Award,
  Download,
  Upload,
  Printer,
  MoreVertical,
  Check,
  AlertTriangle,
  Lock,
  Briefcase,
  FileSpreadsheet,
  History as HistoryIcon,
  X,
  Edit,
  Send
} from 'lucide-react';
import { getFlowchartStepInfo } from '@/lib/utils/flowchart-helper';
import { getProjectWorkflowState } from '@/lib/utils/workflow-engine';
import { isCouncilChair, isCouncilSecretary } from '@/lib/utils/permissions';
import { useToast } from '@/components/ui/Toast';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = repo.getProjectById(params.id);
  const council = project ? repo.getCouncils().find((c) => c.projectIds.includes(project.id)) : null;
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'DOCUMENTS' | 'HISTORY' | 'COUNCIL_MINUTES'>('OVERVIEW');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { success, info } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!project) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200 max-w-xl mx-auto shadow-sm">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</h2>
        <p className="text-xs text-slate-500 mt-1">Mã đề tài không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <Link
          href="/projects"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A6EBD] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#085896] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục
        </Link>
      </div>
    );
  }

  // Cấu hình quy trình dựa trên chính sách áp dụng
  const policy = repo.getPolicyById(project.workflowPolicyId) || repo.getPolicies()[0];
  const workflowState = getProjectWorkflowState(project, policy);

  // Extract decisions and flowchart info (safe to check since project is guaranteed to be defined)
  const recognitionDecision = project.decisions?.find((d) => d.type === 'RECOGNITION');
  const assignmentDecision = project.decisions?.find((d) => d.type === 'ASSIGNMENT');

  const getActionableTaskForUser = () => {
    if (!currentUser) return 'Vui lòng đăng nhập để xem nhiệm vụ.';
    const step = workflowState.currentStepNumber;
    const isPI = project.principalInvestigatorId === currentUser.id || currentUser.role === 'ADMIN';
    const stepInfo = getFlowchartStepInfo(step);

    if (currentUser.role === 'RESEARCHER') {
      if (!isPI) {
        return 'Bạn tham gia với tư cách là thành viên nghiên cứu. Vui lòng phối hợp hỗ trợ Chủ nhiệm thực hiện các nội dung chuyên môn.';
      }
      return stepInfo.researcherTasks.join(' ') || 'Theo dõi tiến trình xử lý từ Phòng Quản lý NCKH.';
    }
    
    if (currentUser.role === 'RESEARCH_OFFICE' || currentUser.role === 'ADMIN') {
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

    if (currentUser.role === 'COUNCIL_MEMBER') {
      if (step === 4) {
        return 'Vui lòng đọc hồ sơ thuyết minh đề cương và chuẩn bị nhận xét trước ngày họp Hội đồng xét duyệt.';
      }
      if (step === 11) {
        return 'Vui lòng thẩm định báo cáo kết quả nghiên cứu, chuẩn bị cho điểm đánh giá nghiệm thu.';
      }
      return 'Không có nhiệm vụ chuyên môn cần xử lý ở bước này.';
    }

    if (currentUser.role === 'ETHICS_OFFICE') {
      if (step === 6) {
        return 'Thẩm định hồ sơ khía cạnh đạo đức y sinh của đề tài (IRB), tổ chức họp và cấp giấy chứng nhận chấp thuận.';
      }
      return 'Không có hồ sơ đạo đức y sinh cần xử lý ở bước này.';
    }

    if (currentUser.role === 'FINANCE_OFFICER') {
      if (step === 14) {
        return 'Kiểm tra và phê duyệt quyết toán kinh phí đề tài trước khi thực hiện đóng hồ sơ lưu trữ.';
      }
      return 'Không có thủ tục tài chính cần phê duyệt ở bước này.';
    }

    return 'Theo dõi hồ sơ đề tài trên hệ thống.';
  };

  const getRequiredDocumentsForStep = () => {
    const step = workflowState.currentStepNumber;
    const currentStepState = workflowState.steps.find((s) => s.stepNumber === step);
    if (!currentStepState || currentStepState.requiredDocuments.length === 0) {
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

  const proposalStatusLabel: Record<string, string> = {
    DRAFT: 'Bản nháp',
    SUBMITTED: 'Đã nộp hồ sơ đề xuất',
    UNDER_ADMIN_REVIEW: 'Đang kiểm tra hành chính',
    REVISION_REQUIRED: 'Yêu cầu bổ sung hồ sơ',
    RESUBMITTED: 'Đã nộp lại sau khi bổ sung',
    VALID: 'Hồ sơ hợp lệ',
    PROPOSAL_REVISION_REQUIRED: 'Hội đồng yêu cầu chỉnh sửa đề cương',
    PROPOSAL_RESUBMITTED: 'Đã nộp lại bản đề cương',
    UNDER_PROPOSAL_REVISION_REVIEW: 'Đang xem lại bản điều chỉnh',
    PROPOSAL_APPROVED: 'Đề cương đã được phê duyệt',
    REJECTED: 'Từ chối tiếp nhận',
  };

  const nextActionLabel = (() => {
    if (project.proposalStatus === 'REVISION_REQUIRED' || project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
      return 'Chủ nhiệm cần nộp lại hồ sơ đã chỉnh sửa theo ý kiến phản hồi.';
    }
    if (project.proposalStatus === 'SUBMITTED' || project.proposalStatus === 'UNDER_ADMIN_REVIEW') {
      return 'Phòng NCKH tiếp tục kiểm tra tính hợp lệ hồ sơ và tài liệu đính kèm.';
    }
    if (project.status === 'IN_PROGRESS' || project.status === 'WAITING_ASSIGNMENT') {
      return 'Đề tài đang triển khai, cần nộp báo cáo tiến độ và theo dõi mốc thực hiện.';
    }
    if (project.status === 'WAITING_ACCEPTANCE') {
      return 'Chủ nhiệm cần hoàn thiện hồ sơ nghiệm thu để chuyển sang Hội đồng.';
    }
    return 'Tiếp tục theo dõi tiến trình xử lý theo từng giai đoạn quy trình.';
  })();

  const getWarnings = () => {
    const warnings = [];
    const step = workflowState.currentStepNumber;

    // Check physical dossiers based on current step
    if (step === 1 && !project.submittedAt) {
      warnings.push('Chưa nhận bản cứng Phiếu đề xuất đề tài (BM1)');
    } else if (step === 3) {
      const hasOutline = project.documents.some((d) => d.documentType === 'DETAILED_OUTLINE');
      if (!hasOutline) {
        warnings.push('Chưa tiếp nhận đủ bản cứng Đề cương thuyết minh chi tiết (BM2)');
      }
    } else if (step === 9 && (project.status === 'IN_PROGRESS' || project.status === 'SUSPENDED')) {
      const hasReports = project.progressReports && project.progressReports.length > 0;
      if (!hasReports) {
        warnings.push(`Chưa nhận báo cáo tiến độ định kỳ (Chính sách: ${policy.reportingIntervalMonths} tháng/lần)`);
      }
    } else if (step === 14 && project.status !== 'CLOSED' && project.status !== 'ARCHIVED') {
      const hasLibReceipt = project.documents.some((d) => d.documentType === 'OTHER' && d.title.toLowerCase().includes('thư viện'));
      if (!hasLibReceipt) {
        warnings.push('Chưa nhận được biên nhận nộp lưu báo cáo từ Thư viện bệnh viện');
      }
    }

    if (project.ethicsRequired && project.ethicsStatus !== 'ETHICS_APPROVED' && step >= 8) {
      warnings.push('Hồ sơ đạo đức y sinh (IRB) chưa được cấp phê duyệt chính thức');
    }

    return warnings;
  };





  return (
    <div className="space-y-4 w-full text-slate-800">
      {/* 1. NÚT QUAY LẠI GỌN GÀNG */}
      <div className="flex items-center">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0A6EBD] transition select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh mục đề tài
        </Link>
      </div>

      {/* 2. CARD HEADER ĐỀ TÀI CHUẨN WORKSPACE (Redesign) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start gap-6">
        
        <div className="space-y-4 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200 shrink-0">
              {project.projectCode || project.proposalCode}
            </span>
            <StatusBadge status={project.status} />
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight break-words pr-2">
            {project.title}
          </h1>

          {/* Dòng Metadata phụ của đề tài */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm pt-1">
            <span className="flex items-center gap-1.5 text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{project.principalInvestigatorName}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{project.departmentName}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>{['DRAFT', 'UNDER_REVIEW', 'REJECTED'].includes(project.status) ? 'Dự kiến' : 'Được duyệt'}:</span>
              <strong className="font-bold text-emerald-700">{formatVND(project.approvedBudget || project.estimatedBudget)}</strong>
            </span>
          </div>
        </div>

        {/* Actions Area */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* PRIMARY ACTIONS - RENDERED AS BUTTONS */}
          {currentUser && (currentUser.id === project.principalInvestigatorId) && (
            <>
              {project.status === 'DRAFT' && (
                <Link href={`/projects/register?draftId=${project.id}`} className="px-4 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs">
                  <Edit className="w-4 h-4" /> Bổ sung hồ sơ
                </Link>
              )}
              {(project.proposalStatus === 'REVISION_REQUIRED' || project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED') && (
                <button 
                  onClick={() => alert('Chức năng "Nộp lại hồ sơ" đang được cập nhật...')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <Send className="w-4 h-4" /> Nộp lại hồ sơ bổ sung
                </button>
              )}
            </>
          )}

          {/* SECONDARY ACTIONS - RENDERED AS OUTLINE BUTTONS */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {currentUser && (currentUser.id === project.principalInvestigatorId) && project.status === 'DRAFT' && (
              <button
                onClick={() => alert('Chức năng "Nộp hồ sơ đề xuất" đang cập nhật...')}
                className="px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" /> Nộp hồ sơ
              </button>
            )}

            <button
              onClick={() => DocxExportService.exportProposalDocx(project)}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
              title="Xuất Thuyết minh Word (.doc)"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" /> Xuất Word
            </button>

            {project.ethicsRequired && (
              <button
                onClick={() => DocxExportService.exportEthicsCertificatePdf(project)}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                title="Tải hồ sơ đạo đức (IRB)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tải IRB
              </button>
            )}

            {recognitionDecision && (
              <button
                onClick={() => info(`Đang tải Quyết định công nhận số ${recognitionDecision.decisionNumber}...`)}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                title="Tải quyết định công nhận"
              >
                <Award className="w-3.5 h-3.5 text-[#0A6EBD]" /> Quyết định
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
              title="In hồ sơ đề tài"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" /> In hồ sơ
            </button>

            {(project.status === 'CLOSED' || project.status === 'ARCHIVED') && (
              <button
                onClick={() => info('Đang trích xuất toàn bộ hồ sơ lưu trữ (.zip)...')}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                title="Xuất hồ sơ lưu trữ (.zip)"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Lưu trữ
              </button>
            )}
          </div>
        </div>
      </div>



      {/* 4. TABS PHÂN HỆ THUẦN VIỆT */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/75 px-3 text-xs font-bold text-slate-600 overflow-x-auto relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Tổng quan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MEMBERS')}
            className={`px-4 py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'MEMBERS'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Thành viên
            <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded-full font-mono">
              {project.members.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`px-4 py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'DOCUMENTS'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Tài liệu
            <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded-full font-mono">
              {project.documents.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Lịch sử xử lý
            <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded-full font-mono">
              {project.statusHistory.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COUNCIL_MINUTES')}
            className={`px-4 py-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'COUNCIL_MINUTES'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Biên bản HĐKH
          </button>
        </div>

        <div className="p-5">
          {/* TAB 1: TỔNG QUAN HỒ SƠ */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* CỘT TRÁI (70%): THÔNG TIN NGHIÊN CỨU & MỤC TIÊU & PHƯƠNG PHÁP & KẾT QUẢ & TIẾN ĐỘ */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. THÔNG TIN ĐỀ TÀI */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 select-none">
                    Thông tin đề tài
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs font-semibold">
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500 font-medium">Lĩnh vực nghiên cứu:</span>
                        <span className="text-slate-900">{project.researchField}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500 font-medium">Loại nghiên cứu:</span>
                        <span className="text-slate-900">{getProjectTypeDisplayName(project.projectType)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500 font-medium">Cấp quản lý:</span>
                        <span className="text-slate-900">{getManagementLevelDisplayName(project.managementLevel)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500 font-medium">Đợt đăng ký:</span>
                        <span className="text-slate-900">{project.registrationRoundName}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500 font-medium">Nguồn kinh phí:</span>
                        <span className="text-slate-900">{getFundingSourceDisplayName(project.fundingSource || 'NGÂN_SÁCH_BỆNH_VIỆN')}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500 font-medium">Kinh phí đề xuất:</span>
                        <span className="text-slate-900 font-mono">{formatVND(project.estimatedBudget)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500 font-medium">Kinh phí phê duyệt:</span>
                        <span className="text-emerald-700 font-mono font-bold">{project.approvedBudget ? formatVND(project.approvedBudget) : 'Chờ phê duyệt'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-500 font-medium">Thời gian thực hiện:</span>
                        <span className="text-slate-900 font-mono">{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NỘI DUNG ĐỀ XUẤT NGHIÊN CỨU CHI TIẾT */}
                <div className="space-y-4 bg-slate-50/50 p-4.5 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-[#0B2A63] uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5 select-none">
                    <FileText className="w-4 h-4 text-[#0A6EBD]" />
                    <span>Nội dung thuyết minh đề xuất</span>
                  </h3>
                  <div className="space-y-3.5 text-xs text-slate-750 font-semibold leading-relaxed">
                    {project.urgencyExplanation && (
                      <div>
                        <strong className="text-slate-900 font-bold block mb-1">1. Tính cấp thiết của đề tài:</strong>
                        <p className="bg-white p-3 rounded-lg border border-slate-200/60 font-medium whitespace-pre-wrap">{project.urgencyExplanation}</p>
                      </div>
                    )}

                    <div>
                      <strong className="text-slate-900 font-bold block mb-1">2. Mục tiêu nghiên cứu:</strong>
                      <p className="bg-white p-3 rounded-lg border border-slate-200/60 font-medium whitespace-pre-wrap">{project.expectedObjectives || project.summary}</p>
                    </div>

                    {project.researchDesign && (
                      <div className="space-y-2">
                        <strong className="text-slate-900 font-bold block">3. Thiết kế & Đối tượng nghiên cứu:</strong>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-3 border-l-2 border-slate-200 font-medium">
                          <div>
                            <span className="text-slate-500 block font-bold mb-0.5">3.1. Thiết kế nghiên cứu:</span>
                            <span className="text-slate-900 font-bold">{project.researchDesign}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-bold mb-0.5">3.2. Đối tượng nghiên cứu:</span>
                            <span className="text-slate-900 font-bold">{project.researchSubjects}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-bold mb-0.5">3.3. Địa điểm nghiên cứu:</span>
                            <span className="text-slate-900 font-bold">{project.researchLocation || 'Bệnh viện'}</span>
                          </div>
                          {project.sampleSizeEstimation && (
                            <div>
                              <span className="text-slate-500 block font-bold mb-0.5">3.4. Cỡ mẫu nghiên cứu:</span>
                              <span className="text-slate-900 font-bold">{project.sampleSizeEstimation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <strong className="text-slate-900 font-bold block mb-1">4. Sản phẩm / Kết quả đầu ra cam kết:</strong>
                      <p className="bg-white p-3 rounded-lg border border-slate-200/60 font-medium">{project.expectedProducts || project.acceptanceDossier?.productsCommitted || 'Báo cáo tổng kết nghiệm thu đề tài khoa học cấp cơ sở và công bố bài báo khoa học.'}</p>
                    </div>
                  </div>
                </div>

                {/* 5. TIẾN ĐỘ THỰC HIỆN HIỆN TẠI (Chỉ hiển thị cho đề tài đang chạy hoặc đã xong) */}
                {['IN_PROGRESS', 'ACCEPTED', 'RECOGNIZED'].includes(project.status) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                    <div className="flex justify-between items-center select-none">
                      <h3 className="text-xs font-bold text-[#0B2A63] uppercase tracking-wider">
                        Tiến độ thực hiện hiện tại
                      </h3>
                      <span className="text-xs font-bold text-[#0A6EBD] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                        Đã hoàn thành {project.progressPercentage || 0}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden select-none">
                      <div
                        className="bg-[#0A6EBD] h-2.5 rounded-full transition-all duration-350"
                        style={{ width: `${project.progressPercentage || 0}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold select-none pt-1">
                      <div>
                        <span className="text-slate-505 block font-bold text-slate-500 mb-0.5">Mốc công việc tiếp theo:</span>
                        <strong className="text-slate-800">
                          {project.milestones?.find((m) => m.status !== 'COMPLETED' && m.status !== 'VERIFIED')?.title || 'Nộp báo cáo tiến độ định kỳ'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-550 block font-bold text-slate-500 mb-0.5">Thời hạn hoàn thành mốc:</span>
                        <strong className="text-slate-800 font-mono">
                          {formatDate(project.milestones?.find((m) => m.status !== 'COMPLETED' && m.status !== 'VERIFIED')?.targetDate || project.endDate)}
                        </strong>
                      </div>
                    </div>
                    <div className="pt-2 text-right select-none">
                      <button
                        onClick={() => setActiveTab('HISTORY')}
                        className="px-4 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                      >
                        Xem lịch sử tiến độ
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* CỘT PHẢI (30%): NHIỆM VỤ CẦN THỰC HIỆN & HỒ SƠ BẮT BUỘC & CẢNH BÁO & HOẠT ĐỘNG GẦN ĐÂY */}
              <div className="space-y-6">
                
                {/* 1. CÔNG VIỆC CẦN THỰC HIỆN (Role-aware actionable task) */}
                <div className="bg-sky-50/40 border border-sky-200/60 rounded-xl p-4.5 space-y-2.5">
                  <h3 className="text-xs font-bold text-[#0B2A63] uppercase tracking-wider flex items-center gap-1.5 select-none">
                    <Activity className="w-4.5 h-4.5 text-[#0A6EBD] shrink-0" />
                    <span>Nhiệm vụ cần thực hiện</span>
                  </h3>
                  <div className="text-xs text-slate-750 font-bold leading-relaxed bg-white p-3.5 rounded-lg border border-sky-100/60 shadow-3xs">
                    {getActionableTaskForUser()}
                  </div>
                </div>

                {/* 2. HỒ SƠ GIAI ĐOẠN HIỆN TẠI (Filtered relevant documents) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3">
                  <h3 className="text-xs font-bold text-[#0B2A63] uppercase tracking-wider select-none">
                    Hồ sơ giai đoạn hiện tại
                  </h3>
                  <div className="space-y-2">
                    {getRequiredDocumentsForStep().map((doc: { name: string; status: string; required: boolean }, idx: number) => (
                      <div key={idx} className="flex justify-between items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-150 text-xs font-semibold shadow-3xs">
                        <div className="space-y-0.5 flex-1">
                          <span className="text-slate-800 font-bold block">{doc.name}</span>
                          <span className="text-slate-500 font-medium block">Trạng thái: {doc.status}</span>
                          
                          {/* Quick action buttons based on user role */}
                          <div className="flex gap-1.5 pt-1">
                            {currentUser && currentUser.role === 'RESEARCHER' && (doc.status.includes('Chưa nộp') || doc.status.includes('Chờ')) && (
                              <button
                                onClick={() => success(`Tải lên tệp tin bổ sung cho ${doc.name} thành công!`)}
                                className="px-2 py-0.5 bg-sky-50 text-[#0A6EBD] border border-sky-200 rounded text-[9px] font-bold hover:bg-sky-100 transition shadow-3xs cursor-pointer flex items-center gap-0.5"
                              >
                                <Upload className="w-2.5 h-2.5" /> Tải lên
                              </button>
                            )}
                            {currentUser && currentUser.role === 'RESEARCH_OFFICE' && (doc.status.includes('Chưa') || doc.status.includes('Chờ') || doc.status.includes('yêu cầu')) && (
                              <button
                                onClick={() => success(`Xác nhận đã nhận đủ bản cứng của ${doc.name} thành công!`)}
                                className="px-2 py-0.5 bg-sky-50 text-[#0A6EBD] border border-sky-200 rounded text-[9px] font-bold hover:bg-sky-100 transition shadow-3xs cursor-pointer flex items-center gap-0.5"
                              >
                                <Check className="w-2.5 h-2.5" /> Nhận bản cứng
                              </button>
                            )}
                          </div>
                        </div>
                        {doc.required && (
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded shrink-0 select-none">Bắt buộc</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. CẢNH BÁO (Show only when attention is required) */}
                {getWarnings().length > 0 && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4.5 space-y-2.5">
                    <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 select-none">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Cảnh báo hồ sơ</span>
                    </h3>
                    <div className="space-y-2 text-xs font-semibold text-amber-900 leading-snug">
                      {getWarnings().map((w: string, idx: number) => (
                        <p key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold select-none">•</span>
                          <span>{w}</span>
                        </p>
                      ))}
                      <div className="pt-1 select-none">
                        <button
                          onClick={() => setActiveTab('DOCUMENTS')}
                          className="text-[#0A6EBD] hover:underline font-bold cursor-pointer"
                        >
                          [Xem hồ sơ bản cứng]
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CẬP NHẬT GẦN ĐÂY */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider select-none">
                    Cập nhật gần đây
                  </h3>
                  <div className="space-y-3 text-xs font-semibold text-slate-650">
                    {project.statusHistory.slice(0, 3).map((h, idx) => (
                      <div key={idx} className="border-l-2 border-slate-300 pl-3 py-0.5 space-y-0.5">
                        <span className="text-slate-500 font-mono text-xs block">{formatDate(h.changedAt)}</span>
                        <strong className="text-slate-850 font-bold block">{h.action}</strong>
                        <span className="text-slate-550 font-medium block">Thực hiện: {h.changedByName} ({h.userRole})</span>
                      </div>
                    ))}
                    {project.statusHistory.length === 0 && (
                      <p className="text-slate-400 italic font-semibold select-none">Chưa có hoạt động cập nhật nào</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: THÀNH VIÊN NGHIÊN CỨU */}
          {activeTab === 'MEMBERS' && (
            <div className="space-y-3.5">
              <h3 className="font-bold text-slate-900 text-sm">
                Danh sách Thành viên Nghiên cứu ({project.members.length} thành viên)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-500 font-bold uppercase select-none">
                    <tr>
                      <th className="p-3">Họ và tên</th>
                      <th className="p-3">Học hàm / Học vị</th>
                      <th className="p-3">Đơn vị công tác</th>
                      <th className="p-3">Vai trò trong đề tài</th>
                      <th className="p-3 text-right">Tỷ lệ đóng góp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {project.members.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-semibold">Chưa thiết lập danh sách thành viên nghiên cứu.</td>
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

          {/* TAB 3: TÀI LIỆU */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3">
                  Tài liệu đề cương & báo cáo điện tử ({project.documents.length} tài liệu)
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-500 font-bold uppercase select-none">
                      <tr>
                        <th className="p-3">Loại văn bản</th>
                        <th className="p-3">Tên tài liệu</th>
                        <th className="p-3 w-24">Phiên bản</th>
                        <th className="p-3">Người tải</th>
                        <th className="p-3 w-32">Ngày cập nhật</th>
                        <th className="p-3 text-right w-48">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {project.documents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 font-semibold">Chưa đính kèm tài liệu nào.</td>
                        </tr>
                      ) : (
                        project.documents.map((doc) => {
                          const curVerObj = doc.versions.find((v) => v.version === doc.currentVersion) || doc.versions[0];
                          return (
                            <React.Fragment key={doc.id}>
                              <tr className="hover:bg-slate-50/50 transition">
                                <td className="p-3 font-bold text-slate-950">{getDocumentTypeDisplayName(doc.documentType)}</td>
                                <td className="p-3 text-slate-700 font-bold">{doc.title}</td>
                                <td className="p-3 font-mono font-bold text-[#0A6EBD]">v{doc.currentVersion}.0</td>
                                <td className="p-3 text-slate-600">{curVerObj?.uploadedByName || 'Chủ nhiệm'}</td>
                                <td className="p-3 font-mono text-slate-500">{formatDate(curVerObj?.uploadedAt || project.createdAt)}</td>
                                <td className="p-3 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setExpandedDocId(expandedDocId === doc.id ? null : doc.id);
                                    }}
                                    className="text-slate-600 hover:text-slate-950 hover:underline font-bold text-xs cursor-pointer"
                                  >
                                    [Lịch sử phiên bản]
                                  </button>
                                  <button
                                    onClick={() => success(`Tải xuống tệp tin ${doc.title} thành công!`)}
                                    className="text-[#0A6EBD] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Tải về
                                  </button>
                                </td>
                              </tr>

                              {/* Collapsible history row */}
                              {expandedDocId === doc.id && (
                                <tr className="bg-slate-50/40">
                                  <td colSpan={6} className="p-3 border-t border-slate-100">
                                    <div className="space-y-2.5 pl-6 select-none animate-in fade-in duration-200">
                                      <h4 className="text-xs font-bold text-slate-700">Lịch sử thay đổi tài liệu:</h4>
                                      <div className="space-y-1.5">
                                        {doc.versions.map((v) => (
                                          <div key={v.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 shadow-3xs">
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-bold text-[#0A6EBD]">Phiên bản v{v.version}.0</span>
                                                {v.version === doc.currentVersion && (
                                                  <span className="bg-sky-50 text-[#0A6EBD] border border-sky-200 px-1.5 py-0.2 rounded text-[9px] font-bold">Hiện tại</span>
                                                )}
                                                {v.version === 1 && (
                                                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[9px] font-bold border border-slate-200">Bản đề xuất ban đầu</span>
                                                )}
                                                {v.version > 1 && doc.documentType === 'DETAILED_OUTLINE' && (
                                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded text-[9px] font-bold">Bản sau xét duyệt đề cương</span>
                                                )}
                                                {v.version === doc.currentVersion && doc.documentType === 'DETAILED_OUTLINE' && ['WAITING_ACCEPTANCE', 'ACCEPTED', 'RECOGNIZED', 'CLOSED'].includes(project.status) && (
                                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded text-[9px] font-bold">Bản nghiệm thu cuối cùng</span>
                                                )}
                                              </div>
                                              <span className="text-[11px] text-slate-450 block font-normal mt-0.5">
                                                Tải lên ngày: <strong className="font-semibold">{formatDate(v.uploadedAt)}</strong> · Người tải: <strong className="font-semibold">{v.uploadedByName}</strong>
                                              </span>
                                              {v.notes && (
                                                <span className="text-[11px] text-slate-500 italic block font-normal mt-1">Ghi chú: &ldquo;{v.notes}&rdquo;</span>
                                              )}
                                            </div>
                                            <button
                                              onClick={() => success(`Tải xuống phiên bản v${v.version}.0 thành công!`)}
                                              className="text-[#0A6EBD] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                                            >
                                              <Download className="w-3.5 h-3.5" /> Tải phiên bản này
                                            </button>
                                          </div>
                                        ))}
                                      </div>
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

              {/* Hồ sơ bản cứng vật lý */}
              <div className="space-y-3.5 pt-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 select-none">
                  <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <span>Hồ sơ bản cứng (Giao nhận vật lý quy chuẩn ISO 6.1)</span>
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-500 font-bold uppercase select-none">
                      <tr>
                        <th className="p-3 w-64">Loại hồ sơ bản cứng</th>
                        <th className="p-3 w-36 text-center">Yêu cầu tối thiểu</th>
                        <th className="p-3 w-36 text-center">Trạng thái nhận</th>
                        <th className="p-3 w-40 text-center">Ngày nhận</th>
                        <th className="p-3">Người tiếp nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-950">Phiếu đề xuất đề tài (BM1)</td>
                        <td className="p-3 text-center text-slate-600 font-mono">01 bản cứng</td>
                        {workflowState.currentStepNumber >= 2 ? (
                          <>
                            <td className="p-3 text-center text-emerald-700 bg-emerald-50 font-bold">Đã nhận</td>
                            <td className="p-3 text-center font-mono text-slate-500">{formatDate(project.submittedAt || project.createdAt)}</td>
                            <td className="p-3 text-slate-600">Phòng Quản lý NCKH</td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 text-center text-slate-400 bg-slate-50 font-bold">Chưa nhận</td>
                            <td className="p-3 text-center font-mono text-slate-400">---</td>
                            <td className="p-3 text-slate-400">---</td>
                          </>
                        )}
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-950">Đề cương chi tiết (BM2)</td>
                        <td className="p-3 text-center text-slate-600 font-mono">06 bản cứng</td>
                        {workflowState.currentStepNumber >= 4 ? (
                          <>
                            <td className="p-3 text-center text-emerald-700 bg-emerald-50 font-bold">Đã nhận</td>
                            <td className="p-3 text-center font-mono text-slate-500">{formatDate(project.approvedAt || project.updatedAt)}</td>
                            <td className="p-3 text-slate-600">Phòng Quản lý NCKH</td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 text-center text-slate-400 bg-slate-50 font-bold">Chưa nhận</td>
                            <td className="p-3 text-center font-mono text-slate-400">---</td>
                            <td className="p-3 text-slate-400">---</td>
                          </>
                        )}
                      </tr>
                      {['WAITING_ACCEPTANCE', 'ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(project.status) ? (
                        <>
                          <tr className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-950">Báo cáo kết quả nghiệm thu (BM11)</td>
                            <td className="p-3 text-center text-slate-600 font-mono">06 bản cứng</td>
                            <td className="p-3 text-center text-emerald-700 bg-emerald-50 font-bold">Đã nhận</td>
                            <td className="p-3 text-center font-mono text-slate-500">{formatDate(project.completedAt || '2026-11-05')}</td>
                            <td className="p-3 text-slate-600">Phòng Quản lý NCKH</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-950">Quyển báo cáo hoàn chỉnh lưu thư viện</td>
                            <td className="p-3 text-center text-slate-600 font-mono">01 quyển cứng</td>
                            <td className="p-3 text-center text-[#0A6EBD] bg-sky-50 font-bold">Đã nhận</td>
                            <td className="p-3 text-center font-mono text-slate-500">{project.completedAt ? formatDate(project.completedAt) : 'Chưa nhận'}</td>
                            <td className="p-3 text-slate-600">Thủ thư Thư viện</td>
                          </tr>
                        </>
                      ) : (
                        <tr className="text-slate-450 italic">
                          <td colSpan={5} className="p-4 text-center">Chưa tới giai đoạn nộp hồ sơ báo cáo nghiệm thu bản cứng</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LỊCH SỬ XỬ LÝ */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3.5">
              <h3 className="font-bold text-slate-900 text-sm">
                Lịch sử phê duyệt & Nhật ký xử lý
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-500 font-bold uppercase select-none">
                    <tr>
                      <th className="p-3 w-36">Thời gian</th>
                      <th className="p-3 w-40">Người thực hiện</th>
                      <th className="p-3 w-36">Vai trò</th>
                      <th className="p-3">Hành động & Góp ý</th>
                      <th className="p-3 w-36">Trạng thái đích</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {project.statusHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-semibold">Chưa ghi nhận lịch sử xử lý.</td>
                      </tr>
                    ) : (
                      project.statusHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-mono text-slate-500">{h.changedAt}</td>
                          <td className="p-3 font-bold text-slate-950">{h.changedByName}</td>
                          <td className="p-3 text-slate-600 font-semibold uppercase text-[10px]">{h.userRole}</td>
                          <td className="p-3 text-slate-800">
                            <p className="font-bold text-slate-900 leading-snug">{h.action}</p>
                            {h.comment && <p className="text-slate-500 italic mt-0.5">&ldquo;{h.comment}&rdquo;</p>}
                            
                            {/* Dynamic download link for decisions during status progression */}
                            {h.action.includes('Quyết định giao thực hiện') && assignmentDecision && (
                              <button
                                onClick={() => info(`Đang tải Quyết định giao thực hiện số ${assignmentDecision.decisionNumber} scan...`)}
                                className="mt-1.5 px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-[#0A6EBD] border border-sky-200 rounded text-[9px] font-bold transition flex items-center gap-0.5 cursor-pointer inline-flex"
                              >
                                <Download className="w-2.5 h-2.5" /> [Tải Quyết định scan]
                              </button>
                            )}
                            {h.action.includes('Hội đồng Khoa học thông qua') && (
                              <button
                                onClick={() => info('Đang tải Biên bản họp Hội đồng xét duyệt đề cương (BM6)...')}
                                className="mt-1.5 px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-bold transition flex items-center gap-0.5 cursor-pointer inline-flex"
                              >
                                <Download className="w-2.5 h-2.5" /> [Tải Biên bản HĐ]
                              </button>
                            )}
                          </td>
                          <td className="p-3">
                            <StatusBadge status={h.toStatus} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: BIÊN BẢN HĐKH (MÔ PHỎNG KÝ) */}
          {activeTab === 'COUNCIL_MINUTES' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">
                  Biên bản họp Hội đồng Đánh giá
                </h3>
                {council && isCouncilSecretary(currentUser, council) && (
                  <button
                    onClick={() => info('Tính năng chỉnh sửa nội dung biên bản đang được cập nhật.')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    Chỉnh sửa nội dung
                  </button>
                )}
              </div>

              {/* A4 Paper Mockup */}
              <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-xl rounded-sm p-10 print:shadow-none print:p-0">
                <div className="flex justify-between items-start text-sm mb-12">
                  <div className="text-center">
                    <p className="font-bold uppercase">SỞ Y TẾ HÀ NỘI</p>
                    <p className="font-bold underline uppercase">BỆNH VIỆN ĐA KHOA SÓC SƠN</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-bold underline">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="text-xs italic mt-2">Sóc Sơn, ngày {formatDate(project.createdAt)}</p>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h1 className="text-lg font-bold uppercase mb-2">
                    BIÊN BẢN HỌP HỘI ĐỒNG ĐÁNH GIÁ
                  </h1>
                  <h2 className="text-sm font-bold uppercase">
                    THUYẾT MINH ĐỀ TÀI KHOA HỌC VÀ CÔNG NGHỆ CẤP CƠ SỞ
                  </h2>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <p><span className="font-bold">1. Tên đề tài:</span> {project.title}</p>
                  <p><span className="font-bold">2. Chủ nhiệm đề tài:</span> {project.principalInvestigatorName}</p>
                  <p><span className="font-bold">3. Quyết định thành lập Hội đồng:</span> Số QĐ-BVDKSS</p>
                  <p><span className="font-bold">4. Cơ quan thực hiện đề tài:</span> Bệnh viện đa khoa Sóc Sơn</p>
                  <p><span className="font-bold">5. Ngày họp:</span> {formatDate(project.createdAt)}</p>
                  <p><span className="font-bold">6. Địa điểm:</span> Phòng họp số 1</p>
                  <p><span className="font-bold">7. Thành viên của hội đồng:</span></p>
                  <p className="pl-4 italic">Tổng số: 5. Có mặt: 5. Vắng mặt: 0</p>
                  <p><span className="font-bold">8. Nhận xét của hội đồng:</span> Đề cương trình bày rõ ràng, tính cấp thiết cao.</p>
                  <p><span className="font-bold">9. Kết luận:</span> Đề nghị thông qua với yêu cầu chỉnh sửa nhỏ.</p>
                </div>

                {/* Chữ ký */}
                <div className="flex justify-between items-start mt-20 text-sm font-bold">
                  <div className="text-center">
                    <p className="mb-20 uppercase">CHỦ TỊCH HỘI ĐỒNG</p>
                    {/* Giả định role Chủ tịch chưa ký */}
                    {(council && isCouncilChair(currentUser, council)) || currentUser.role === 'ADMIN' ? (
                       <button
                         onClick={() => success('Đã ký số biên bản thành công!')}
                         className="px-6 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg transition print:hidden"
                       >
                         Ký
                       </button>
                    ) : (
                       <p className="text-slate-400 font-normal italic">(Chưa ký)</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="mb-20 uppercase">THƯ KÝ</p>
                    {(council && isCouncilSecretary(currentUser, council)) || currentUser.role === 'ADMIN' ? (
                       <button
                         onClick={() => success('Đã ký số biên bản thành công!')}
                         className="px-6 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg transition print:hidden"
                       >
                         Ký
                       </button>
                    ) : (
                       <p className="text-slate-400 font-normal italic">(Chưa ký)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
