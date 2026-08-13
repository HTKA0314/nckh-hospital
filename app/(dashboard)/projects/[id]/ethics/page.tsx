'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { canReviewEthics } from '@/lib/utils/permissions';
import { EthicsApproval, EthicsStatus, EthicsReviewType } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Plus,
  XCircle,
  Activity,
  X,
} from 'lucide-react';

/* ─── Mock static data ─── */
const IRB_DOCUMENTS = [
  { id: 'irb-doc-1', label: 'Đề cương nghiên cứu (Protocol)', version: 'v1.0', required: true, description: 'Thiết kế, phương pháp và quy trình nghiên cứu đầy đủ' },
  { id: 'irb-doc-2', label: 'Mẫu ICF (Informed Consent Form)', version: 'v1.0', required: true, description: 'Phiếu chấp thuận tham gia nghiên cứu tự nguyện' },
  { id: 'irb-doc-3', label: 'Phiếu cung cấp thông tin người tham gia (PIS)', version: 'v1.0', required: true, description: 'Participant Information Sheet – giải thích rõ nghiên cứu' },
  { id: 'irb-doc-4', label: 'Tài liệu tuyển người tham gia', version: 'v1.0', required: false, description: 'Poster, thư mời, quảng cáo tuyển tình nguyện viên' },
];

const MOCK_SAES = [
  { id: 'sae-1', date: '2026-05-15', description: 'Phản ứng dị ứng nhẹ với chất nghiên cứu', severity: 'NHẸ', status: 'ĐÃ XỬ LÝ', reporter: 'BS. Nguyễn Thị Mai' },
];

const MOCK_REPORTS = [
  { id: 'rpt-1', title: 'Báo cáo tiến độ IRB – Q1/2026', period: 'Q1/2026', submittedAt: '2026-03-01', status: 'ĐÃ NỘP' },
];

/* ─── Main Component ─── */
export default function ProjectEthicsPage({ params }: { params: { id: string } }) {
  const project = repo.getProjectById(params.id);
  const { currentUser } = useAuth();
  const { success, warning, confirm } = useToast();

  type EthicsTab = 'OVERVIEW' | 'DOCUMENTS' | 'REPORTS' | 'HISTORY';
  const [activeTab, setActiveTab] = useState<EthicsTab>('OVERVIEW');
  const [ethics, setEthics] = useState<EthicsApproval | undefined>(() => project?.ethicsApproval);

  // Decision modal
  type DecisionType = 'APPROVE' | 'CONDITIONAL' | 'REJECT';
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<DecisionType>('APPROVE');
  const [decisionForm, setDecisionForm] = useState({
    reviewType: 'FULL_BOARD' as EthicsReviewType,
    decisionNumber: '',
    approvalDate: '',
    expiryDate: '',
    conditions: '',
    rejectionReason: '',
    notes: '',
  });

  // Renewal modal
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalForm, setRenewalForm] = useState({ newExpiryDate: '', renewalReason: '' });

  // Amendment modal
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [amendmentNote, setAmendmentNote] = useState('');

  if (!project) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200 max-w-xl mx-auto shadow-sm">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</h2>
        <Link href="/projects" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A6EBD] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#085896] transition">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục
        </Link>
      </div>
    );
  }

  /* ── Computed ─────────────────────────────────────── */
  const isEthicsRequired = project.ethicsRequired;
  const isEthicsApproved = ethics?.status === 'ETHICS_APPROVED';
  const isBlockedForProgress = isEthicsRequired && !isEthicsApproved
    && !['DRAFT', 'UNDER_REVIEW', 'REJECTED'].includes(project.status);

  const today = new Date();
  const expiryDate = ethics?.expiryDate ? new Date(ethics.expiryDate) : null;
  const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - today.getTime()) / 86400000) : null;
  const isExpired = daysToExpiry !== null && daysToExpiry < 0;
  const isExpiringSoon = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 30;

  /* ── Handlers ─────────────────────────────────────── */
  const handleUpdateStatus = (nextStatus: EthicsStatus, logText: string) => {
    if (!canReviewEthics(currentUser)) {
      warning('Bạn không có quyền cập nhật trạng thái đạo đức y sinh.');
      return;
    }

    confirm({
      title: 'Xác nhận thay đổi trạng thái',
      message: `Chuyển trạng thái đạo đức y sinh của đề tài này thành "${nextStatus}"?`,
      confirmLabel: 'Xác nhận',
      onConfirm: () => {
        const base: EthicsApproval = ethics || {
          id: `eth-${Date.now()}`,
          projectId: project.id,
          screeningAnswers: { involvesHumanSubjects: true, involvesIdentifiableData: true, involvesBiologicalSamples: true, involvesNewInterventionsOrDrugs: false },
          ethicsRequired: true,
          status: 'SCREENING_IN_PROGRESS',
        };
        const updated: EthicsApproval = { ...base, status: nextStatus };
        repo.updateProject(project.id, { ethicsApproval: updated, ethicsStatus: nextStatus });
        setEthics(updated);
        repo.addAuditLog({ userId: currentUser.id, userFullName: currentUser.fullName, userRole: currentUser.role, actionCode: `ETHICS_${nextStatus}`, entityType: 'ETHICS', entityId: base.id, notes: logText });
        success('Đã cập nhật trạng thái đạo đức thành công!');
      },
    });
  };

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (decisionType !== 'REJECT' && (!decisionForm.decisionNumber || !decisionForm.approvalDate || !decisionForm.expiryDate)) {
      warning('Vui lòng nhập đầy đủ Số quyết định và thời hạn hiệu lực.');
      return;
    }
    if (decisionType === 'REJECT' && !decisionForm.rejectionReason.trim()) {
      warning('Vui lòng nhập lý do không chấp thuận.');
      return;
    }
    if (decisionType === 'CONDITIONAL' && !decisionForm.conditions.trim()) {
      warning('Vui lòng nhập điều kiện của chấp thuận có điều kiện.');
      return;
    }

    const base: EthicsApproval = ethics || {
      id: `eth-${Date.now()}`,
      projectId: project.id,
      screeningAnswers: { involvesHumanSubjects: true, involvesIdentifiableData: true, involvesBiologicalSamples: true, involvesNewInterventionsOrDrugs: false },
      ethicsRequired: true,
      status: 'DOSSIER_SUBMITTED',
    };

    const newStatus: EthicsStatus = decisionType === 'REJECT' ? 'ETHICS_REJECTED' : 'ETHICS_APPROVED';
    const noteText =
      decisionType === 'CONDITIONAL'
        ? `[CHẤP THUẬN CÓ ĐIỀU KIỆN] Điều kiện: ${decisionForm.conditions}. ${decisionForm.notes}`.trim()
        : decisionType === 'REJECT'
        ? `[KHÔNG CHẤP THUẬN] Lý do: ${decisionForm.rejectionReason}`
        : decisionForm.notes;

    const updated: EthicsApproval = {
      ...base,
      status: newStatus,
      reviewType: decisionForm.reviewType,
      decisionNumber: decisionForm.decisionNumber,
      approvalDate: decisionForm.approvalDate,
      expiryDate: decisionForm.expiryDate,
      notes: noteText,
    };

    repo.updateProject(project.id, { ethicsApproval: updated, ethicsStatus: newStatus });
    setEthics(updated);
    setShowDecisionModal(false);
    repo.addAuditLog({ userId: currentUser.id, userFullName: currentUser.fullName, userRole: currentUser.role, actionCode: newStatus, entityType: 'ETHICS', entityId: updated.id, notes: noteText });

    // Notify Principal Investigator
    repo.addNotification({
      userId: project.principalInvestigatorId,
      title: `Quyết định Đạo đức: ${project.proposalCode}`,
      content: decisionType === 'REJECT' ? `Hồ sơ IRB không được chấp thuận: ${decisionForm.rejectionReason}` : `Hồ sơ IRB đã được chấp thuận. Số quyết định: ${decisionForm.decisionNumber}`,
      type: decisionType === 'REJECT' ? 'ERROR' : 'SUCCESS',
      link: `/projects/${project.id}`,
    });

    const toastMsg =
      decisionType === 'REJECT' ? 'Đã ghi nhận quyết định Không chấp thuận hồ sơ IRB.'
      : decisionType === 'CONDITIONAL' ? 'Đã ban hành Chấp thuận có điều kiện IRB thành công!'
      : 'Đã ban hành Chấp thuận Đạo đức Y sinh (IRB) thành công!';
    success(toastMsg);
  };

  const handleRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalForm.newExpiryDate) { warning('Vui lòng chọn ngày hết hạn mới.'); return; }
    const updated: EthicsApproval = { ...ethics!, expiryDate: renewalForm.newExpiryDate };
    repo.updateProject(project.id, { ethicsApproval: updated });
    setEthics(updated);
    setShowRenewalModal(false);
    setRenewalForm({ newExpiryDate: '', renewalReason: '' });
    success('Đã gia hạn hiệu lực Giấy chứng nhận Đạo đức Y sinh thành công!');
  };

  /* ── Status badge helper ─── */
  const getStatusBadge = (status?: EthicsStatus) => {
    const cfg: Record<string, { cls: string; label: string }> = {
      NOT_REQUIRED:            { cls: 'bg-slate-100 text-slate-700 border-slate-200',     label: 'Không yêu cầu IRB' },
      SCREENING_IN_PROGRESS:  { cls: 'bg-blue-50 text-blue-800 border-blue-200',          label: 'Đang sàng lọc' },
      DOSSIER_SUBMITTED:      { cls: 'bg-amber-50 text-amber-800 border-amber-200',       label: 'Đã nộp hồ sơ' },
      UNDER_ETHICS_REVIEW:    { cls: 'bg-sky-50 text-sky-800 border-sky-200',             label: 'Hội đồng đang xem xét' },
      ETHICS_REVISION_REQUIRED: { cls: 'bg-orange-50 text-orange-800 border-orange-200', label: 'Yêu cầu sửa đổi' },
      ETHICS_APPROVED:        { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Đã phê duyệt (IRB APPROVED)' },
      ETHICS_REJECTED:        { cls: 'bg-rose-50 text-rose-800 border-rose-200',          label: 'Không chấp thuận' },
    };
    const c = status ? (cfg[status] || { cls: 'bg-slate-100 text-slate-700', label: 'Chưa xác định' }) : { cls: 'bg-slate-100 text-slate-700', label: 'Chưa xác định' };
    return <span className={`border text-xs px-2.5 py-0.5 rounded-full font-bold ${c.cls}`}>{c.label}</span>;
  };

  const TABS: { id: EthicsTab; label: string }[] = [
    { id: 'OVERVIEW', label: 'Tổng quan' },
    { id: 'DOCUMENTS', label: 'Tài liệu IRB' },
    { id: 'REPORTS', label: 'Báo cáo & SAE' },
    { id: 'HISTORY', label: 'Lịch sử' },
  ];

  /* ══════════════════════════════════════════════════════════════ */
  return (
    <div className="w-full space-y-4 pb-12 text-slate-800">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/projects" className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0A6EBD] font-semibold transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Đề tài
        </Link>
        <span>/</span>
        <Link href={`/projects/${project.id}`} className="text-slate-600 hover:text-[#0A6EBD] font-semibold truncate max-w-xs transition">
          {project.projectCode || project.proposalCode}
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-700">Đạo đức nghiên cứu (IRB)</span>
      </div>

      {/* ── Header Card ── */}
      <div className="bg-white px-5 py-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <ShieldCheck className="w-5 h-5 text-[#0A6EBD] shrink-0" />
            <h1 className="text-base font-bold text-slate-900">Đạo đức nghiên cứu Y sinh (IRB)</h1>
            {getStatusBadge(ethics?.status)}
          </div>
          <p className="text-xs text-slate-500 font-medium leading-snug">{project.title}</p>
        </div>

        {/* Action buttons per role/status */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {currentUser.role === 'RESEARCHER' && ethics?.status === 'SCREENING_IN_PROGRESS' && (
            <button onClick={() => handleUpdateStatus('DOSSIER_SUBMITTED', 'Nộp hồ sơ IRB lên Hội đồng Đạo đức')}
              className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition">
              <FileText className="w-3.5 h-3.5" /> Nộp hồ sơ IRB
            </button>
          )}
          {currentUser.role === 'RESEARCHER' && isEthicsApproved && (
            <button onClick={() => setShowAmendmentModal(true)}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition">
              <Activity className="w-3.5 h-3.5" /> Nộp sửa đổi đề cương
            </button>
          )}
          {canReviewEthics(currentUser) && ethics?.status === 'DOSSIER_SUBMITTED' && (
            <button onClick={() => handleUpdateStatus('UNDER_ETHICS_REVIEW', 'Chuyển hồ sơ đề tài sang xem xét bởi Hội đồng')}
              className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition">
              <Clock className="w-3.5 h-3.5" /> Chuyển Hội đồng xem xét
            </button>
          )}
          {canReviewEthics(currentUser) && ethics?.status === 'UNDER_ETHICS_REVIEW' && (
            <>
              <button onClick={() => handleUpdateStatus('ETHICS_REVISION_REQUIRED', 'Yêu cầu sửa đổi hồ sơ theo ý kiến Hội đồng')}
                className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition">
                <AlertCircle className="w-3.5 h-3.5" /> Yêu cầu sửa đổi
              </button>
              <button onClick={() => { setDecisionType('APPROVE'); setShowDecisionModal(true); }}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ban hành quyết định
              </button>
            </>
          )}
          {currentUser.role === 'ETHICS_OFFICE' && isEthicsApproved && (isExpired || isExpiringSoon) && (
            <button onClick={() => setShowRenewalModal(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition">
              <RefreshCw className="w-3.5 h-3.5" /> Gia hạn hiệu lực
            </button>
          )}
        </div>
      </div>

      {/* ── Banners ── */}
      {isBlockedForProgress && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl px-4 py-3 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose-800">⛔ Đề tài bị chặn – Chưa hoàn thành xét duyệt Đạo đức Y sinh</p>
            <p className="text-xs text-rose-700 mt-0.5">
              Đề tài yêu cầu xem xét đạo đức bắt buộc nhưng chưa được Hội đồng Đạo đức phê duyệt.
              Đề tài <strong>không thể chuyển sang giai đoạn Thực hiện</strong> cho đến khi nhận được chấp thuận IRB chính thức.
            </p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose-800">⚠️ Giấy chứng nhận Đạo đức đã hết hiệu lực</p>
            <p className="text-xs text-rose-700 mt-0.5">
              Hiệu lực IRB đã hết kể từ ngày <strong>{formatDate(ethics!.expiryDate!)}</strong>.
              Cần gia hạn hoặc nộp hồ sơ xem xét mới để tiếp tục triển khai nghiên cứu hợp lệ.
            </p>
          </div>
        </div>
      )}

      {isExpiringSoon && !isExpired && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">⏳ Giấy chứng nhận IRB sắp hết hiệu lực</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Còn <strong>{daysToExpiry} ngày</strong> đến khi Giấy chứng nhận hết hiệu lực (ngày {formatDate(ethics!.expiryDate!)}).
              Hãy liên hệ Hội đồng Đạo đức để gia hạn kịp thời.
            </p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/75 px-3 text-xs font-bold text-slate-600">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white' : 'border-transparent hover:text-slate-900'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ═══ TAB 1: TỔNG QUAN ═══ */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Left column */}
              <div className="space-y-4">
                {/* Ethics required indicator */}
                <div className={`p-4 rounded-xl border ${isEthicsRequired ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Yêu cầu Đạo đức Y sinh</p>
                  <div className="flex items-center gap-2">
                    <Shield className={`w-5 h-5 ${isEthicsRequired ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
                    <strong className={`text-sm ${isEthicsRequired ? 'text-rose-800' : 'text-slate-600'}`}>
                      {isEthicsRequired ? 'BẮT BUỘC ĐÁNH GIÁ ĐẠO ĐỨC' : 'KHÔNG THUỘC DIỆN IRB'}
                    </strong>
                  </div>
                  {ethics?.reviewType && (
                    <div className="mt-2.5 pt-2.5 border-t border-rose-100 text-[11px] font-semibold text-slate-600">
                      Hình thức xem xét:{' '}
                      <span className="text-[#0A6EBD] font-bold">
                        {ethics.reviewType === 'EXEMPT' ? 'Miễn xem xét' : ethics.reviewType === 'EXPEDITED' ? 'Xem xét rút gọn' : 'Hội đồng đầy đủ'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Screening checklist */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-slate-400" /> Kết quả Sàng lọc
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Liên quan đến đối tượng con người', val: ethics?.screeningAnswers?.involvesHumanSubjects },
                      { label: 'Sử dụng dữ liệu định danh cá nhân nhạy cảm', val: ethics?.screeningAnswers?.involvesIdentifiableData },
                      { label: 'Sử dụng mẫu sinh học của bệnh nhân', val: ethics?.screeningAnswers?.involvesBiologicalSamples },
                      { label: 'Thử nghiệm thuốc hoặc can thiệp lâm sàng mới', val: ethics?.screeningAnswers?.involvesNewInterventionsOrDrugs },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 text-xs font-semibold">
                        <span className="text-slate-600 leading-snug">{item.label}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
                          item.val === undefined
                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                            : item.val
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {item.val === undefined ? 'N/A' : item.val ? 'CÓ' : 'KHÔNG'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column: IRB Certificate */}
              <div className="lg:col-span-2 border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Giấy chứng nhận Chấp thuận Đạo đức (IRB Certificate)
                </h3>

                {isEthicsApproved ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Số Quyết định:</span>
                          <strong className="text-slate-800 font-mono">{ethics!.decisionNumber || '–'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Loại xem xét:</span>
                          <strong className="text-slate-800">
                            {ethics!.reviewType === 'EXEMPT' ? 'Miễn xem xét' : ethics!.reviewType === 'EXPEDITED' ? 'Rút gọn' : 'Đầy đủ'}
                          </strong>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Ngày phê duyệt:</span>
                          <strong className="text-slate-800 font-mono">{formatDate(ethics!.approvalDate)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Ngày hết hiệu lực:</span>
                          <strong className={`font-mono ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-800'}`}>
                            {formatDate(ethics!.expiryDate)}
                            {isExpired && <span className="ml-1 text-[10px]">(Hết hạn)</span>}
                            {isExpiringSoon && !isExpired && <span className="ml-1 text-[10px]">(Còn {daysToExpiry} ngày)</span>}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Conditional approval notice */}
                    {ethics!.notes?.includes('[CHẤP THUẬN CÓ ĐIỀU KIỆN]') && (
                      <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 text-xs">
                        <p className="font-bold text-amber-800 mb-1">⚠ Chấp thuận có điều kiện</p>
                        <p className="text-amber-700 leading-relaxed">
                          {ethics!.notes.replace('[CHẤP THUẬN CÓ ĐIỀU KIỆN] Điều kiện: ', '')}
                        </p>
                      </div>
                    )}

                    {ethics!.notes && !ethics!.notes.includes('[CHẤP THUẬN CÓ ĐIỀU KIỆN]') && (
                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Ghi chú Hội đồng:</span>
                        <p className="p-3 bg-emerald-50/30 text-slate-600 border border-emerald-100 rounded-lg italic">
                          &ldquo;{ethics!.notes}&rdquo;
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span className="font-semibold">Trạng thái hiệu lực:</span>
                      {isExpired
                        ? <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold border border-rose-200">Đã hết hiệu lực</span>
                        : isExpiringSoon
                        ? <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">Sắp hết hiệu lực</span>
                        : <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">✓ Còn hiệu lực</span>
                      }
                    </div>
                  </div>
                ) : ethics?.status === 'ETHICS_REJECTED' ? (
                  <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-4 text-xs space-y-1">
                    <p className="font-bold text-rose-800 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Hồ sơ Không được chấp thuận
                    </p>
                    <p className="text-rose-700 leading-relaxed">
                      {ethics.notes?.replace('[KHÔNG CHẤP THUẬN] Lý do: ', '') || 'Không đáp ứng yêu cầu đạo đức nghiên cứu.'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-15" />
                    <p>Đề tài chưa được cấp Giấy chứng nhận Đạo đức Y sinh chính thức.</p>
                    {isEthicsRequired && (
                      <p className="mt-1 text-rose-500">Hoàn thành nộp hồ sơ và xét duyệt IRB trước khi triển khai nghiên cứu.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB 2: TÀI LIỆU IRB ═══ */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Hồ sơ & Tài liệu IRB</h3>
                {currentUser.role === 'RESEARCHER' && (
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A6EBD] text-white text-xs font-bold rounded-lg hover:bg-[#085896] transition shadow-xs">
                    <Plus className="w-3.5 h-3.5" /> Tải lên tài liệu mới
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Loại tài liệu</th>
                      <th className="px-4 py-3">Mô tả</th>
                      <th className="px-4 py-3 w-24 text-center">Bắt buộc</th>
                      <th className="px-4 py-3 w-20 text-center">Phiên bản</th>
                      <th className="px-4 py-3 w-32 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {IRB_DOCUMENTS.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-800">{doc.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{doc.description}</td>
                        <td className="px-4 py-3 text-center">
                          {doc.required
                            ? <span className="text-rose-600 font-bold text-[10px]">Bắt buộc</span>
                            : <span className="text-slate-400 text-[10px]">Khuyến nghị</span>}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-[#0A6EBD] font-bold">{doc.version}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="text-[#0A6EBD] hover:underline inline-flex items-center gap-1 font-bold">
                              <Download className="w-3.5 h-3.5" /> Tải về
                            </button>
                            {currentUser.role === 'RESEARCHER' && (
                              <button className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 font-bold">
                                <Upload className="w-3.5 h-3.5" /> Cập nhật
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Protocol amendments */}
              <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-600" /> Sửa đổi đề cương sau chấp thuận (Amendment)
                  </h4>
                  {currentUser.role === 'RESEARCHER' && isEthicsApproved && (
                    <button onClick={() => setShowAmendmentModal(true)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition">
                      + Nộp sửa đổi mới
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-semibold">
                  Mọi thay đổi đề cương, phương pháp hoặc tài liệu ICF sau khi phê duyệt đều phải được Hội đồng xem xét lại trước khi áp dụng.
                </p>
                <div className="text-center py-4 text-slate-400 text-[11px] font-semibold">
                  Chưa có yêu cầu sửa đổi đề cương nào được nộp.
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 3: BÁO CÁO & SAE ═══ */}
          {activeTab === 'REPORTS' && (
            <div className="space-y-6">

              {/* Progress Reports */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Báo cáo định kỳ gửi Hội đồng Đạo đức</h3>
                  {currentUser.role === 'RESEARCHER' && isEthicsApproved && (
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A6EBD] text-white text-xs font-bold rounded-lg hover:bg-[#085896] transition shadow-xs">
                      <Plus className="w-3.5 h-3.5" /> Nộp báo cáo định kỳ
                    </button>
                  )}
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Tên báo cáo</th>
                        <th className="px-4 py-3 w-24">Kỳ báo cáo</th>
                        <th className="px-4 py-3 w-28">Ngày nộp</th>
                        <th className="px-4 py-3 w-24 text-center">Trạng thái</th>
                        <th className="px-4 py-3 w-20 text-right">Tải về</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {MOCK_REPORTS.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-semibold">Chưa có báo cáo định kỳ nào.</td></tr>
                      ) : MOCK_REPORTS.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3 font-bold text-slate-800">{r.title}</td>
                          <td className="px-4 py-3 text-slate-500">{r.period}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{formatDate(r.submittedAt)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">{r.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="text-[#0A6EBD] hover:underline inline-flex items-center gap-1 font-bold">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Final Report */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Báo cáo kết thúc nghiên cứu</h4>
                  {currentUser.role === 'RESEARCHER' && isEthicsApproved && (
                    <button className="text-xs font-bold text-[#0A6EBD] border border-slate-200 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 transition">
                      + Nộp báo cáo kết thúc
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-semibold">Báo cáo tổng kết cần nộp lên Hội đồng Đạo đức sau khi hoàn thành thu thập dữ liệu và kết thúc nghiên cứu.</p>
                <div className="text-center py-3 text-slate-400 text-[11px]">Chưa nộp báo cáo kết thúc.</div>
              </div>

              {/* SAE Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Sự kiện bất lợi nghiêm trọng (SAE – Serious Adverse Events)
                  </h3>
                  {currentUser.role === 'RESEARCHER' && (
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition shadow-xs">
                      <Plus className="w-3.5 h-3.5" /> Báo cáo SAE mới
                    </button>
                  )}
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 w-28">Ngày xảy ra</th>
                        <th className="px-4 py-3">Mô tả sự kiện</th>
                        <th className="px-4 py-3 w-24 text-center">Mức độ</th>
                        <th className="px-4 py-3 w-24 text-center">Trạng thái</th>
                        <th className="px-4 py-3 w-36">Người báo cáo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {MOCK_SAES.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-semibold">Không có sự kiện SAE nào được ghi nhận.</td></tr>
                      ) : MOCK_SAES.map((sae) => (
                        <tr key={sae.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3 font-mono text-slate-600">{formatDate(sae.date)}</td>
                          <td className="px-4 py-3 text-slate-800">{sae.description}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              sae.severity === 'NGHIÊM TRỌNG' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>{sae.severity}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">{sae.status}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{sae.reporter}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 4: LỊCH SỬ ═══ */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Nhật ký thay đổi trạng thái IRB</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Khởi tạo hồ sơ sàng lọc', date: project.createdAt, by: project.principalInvestigatorName, cls: 'bg-blue-100 text-blue-700 border-blue-200', always: true },
                  { label: 'Nộp hồ sơ IRB lên Hội đồng', date: project.submittedAt || project.createdAt, by: project.principalInvestigatorName, cls: 'bg-amber-100 text-amber-700 border-amber-200',
                    show: ['DOSSIER_SUBMITTED', 'UNDER_ETHICS_REVIEW', 'ETHICS_REVISION_REQUIRED', 'ETHICS_APPROVED', 'ETHICS_REJECTED'].includes(ethics?.status || '') },
                  { label: 'Hội đồng tiến hành xem xét', date: '', by: 'Hội đồng Đạo đức Y sinh', cls: 'bg-sky-100 text-sky-700 border-sky-200',
                    show: ['UNDER_ETHICS_REVIEW', 'ETHICS_APPROVED', 'ETHICS_REJECTED'].includes(ethics?.status || '') },
                  ...(ethics?.status === 'ETHICS_APPROVED' ? [{
                    label: `Chấp thuận IRB – QĐ ${ethics?.decisionNumber || '–'}${ethics?.notes?.includes('[CHẤP THUẬN CÓ ĐIỀU KIỆN]') ? ' (Có điều kiện)' : ''}`,
                    date: ethics?.approvalDate || '',
                    by: 'Hội đồng Đạo đức Y sinh',
                    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    show: true,
                  }] : []),
                  ...(ethics?.status === 'ETHICS_REJECTED' ? [{
                    label: 'Không chấp thuận hồ sơ IRB',
                    date: ethics?.approvalDate || '',
                    by: 'Hội đồng Đạo đức Y sinh',
                    cls: 'bg-rose-100 text-rose-700 border-rose-200',
                    show: true,
                  }] : []),
                ].filter((e) => (e as any).always || (e as any).show).map((evt, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className={`mt-0.5 w-6 h-6 flex items-center justify-center rounded-full font-bold border shrink-0 text-[10px] ${evt.cls}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800">{evt.label}</span>
                        {evt.date && <span className="font-mono text-slate-400 whitespace-nowrap">{formatDate(evt.date)}</span>}
                      </div>
                      <span className="text-slate-500 font-semibold">Bởi: {evt.by}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══ DECISION MODAL ═══ */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleDecisionSubmit}>
              <div className="px-5 py-4 border-b border-slate-100 bg-[#0B2A63] text-white flex justify-between items-center">
                <h3 className="font-bold text-sm">Ban hành Quyết định IRB – Hội đồng Đạo đức Y sinh</h3>
                <button type="button" onClick={() => setShowDecisionModal(false)} className="text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-5 space-y-4">
                {/* Decision type selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Loại quyết định *</label>
                  <div className="flex gap-2">
                    {([
                      { id: 'APPROVE',      label: 'Chấp thuận',               activeCls: 'bg-emerald-600 border-emerald-600 text-white' },
                      { id: 'CONDITIONAL',  label: 'Chấp thuận có điều kiện',  activeCls: 'bg-amber-600 border-amber-600 text-white' },
                      { id: 'REJECT',       label: 'Không chấp thuận',         activeCls: 'bg-rose-600 border-rose-600 text-white' },
                    ] as const).map((dt) => (
                      <button key={dt.id} type="button"
                        onClick={() => setDecisionType(dt.id)}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg border-2 transition ${
                          decisionType === dt.id ? dt.activeCls : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}>
                        {dt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {decisionType !== 'REJECT' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Hình thức xem xét *</label>
                      <select className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none"
                        value={decisionForm.reviewType}
                        onChange={(e) => setDecisionForm({ ...decisionForm, reviewType: e.target.value as EthicsReviewType })}>
                        <option value="EXEMPT">Miễn xem xét (EXEMPT)</option>
                        <option value="EXPEDITED">Xem xét rút gọn (EXPEDITED)</option>
                        <option value="FULL_BOARD">Hội đồng đầy đủ (FULL_BOARD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Số chứng nhận / Quyết định *</label>
                      <input type="text" placeholder="VD: GCN-ĐĐ-2026/045"
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none"
                        value={decisionForm.decisionNumber}
                        onChange={(e) => setDecisionForm({ ...decisionForm, decisionNumber: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Ngày phê duyệt *</label>
                        <input type="date" className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none"
                          value={decisionForm.approvalDate}
                          onChange={(e) => setDecisionForm({ ...decisionForm, approvalDate: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Ngày hết hạn hiệu lực *</label>
                        <input type="date" className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none text-rose-600 font-bold"
                          value={decisionForm.expiryDate}
                          onChange={(e) => setDecisionForm({ ...decisionForm, expiryDate: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}

                {decisionType === 'CONDITIONAL' && (
                  <div>
                    <label className="block text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Điều kiện chấp thuận *</label>
                    <textarea rows={3} placeholder="Nêu rõ các điều kiện cần đáp ứng trước khi triển khai..."
                      className="w-full border border-amber-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none resize-none"
                      value={decisionForm.conditions}
                      onChange={(e) => setDecisionForm({ ...decisionForm, conditions: e.target.value })} />
                  </div>
                )}

                {decisionType === 'REJECT' && (
                  <div>
                    <label className="block text-xs font-bold text-rose-700 uppercase tracking-wide mb-1">Lý do không chấp thuận *</label>
                    <textarea rows={4} placeholder="Nêu chi tiết lý do từ chối hồ sơ IRB..."
                      className="w-full border border-rose-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 outline-none resize-none"
                      value={decisionForm.rejectionReason}
                      onChange={(e) => setDecisionForm({ ...decisionForm, rejectionReason: e.target.value })} />
                  </div>
                )}

                {decisionType !== 'REJECT' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Nhận xét / Khuyến cáo thêm</label>
                    <textarea rows={2} placeholder="Ghi chú thêm của Hội đồng (không bắt buộc)..."
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#0A6EBD]/10 focus:border-[#0A6EBD] outline-none resize-none"
                      value={decisionForm.notes}
                      onChange={(e) => setDecisionForm({ ...decisionForm, notes: e.target.value })} />
                  </div>
                )}
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowDecisionModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition">Hủy</button>
                <button type="submit"
                  className={`px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition ${
                    decisionType === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700'
                    : decisionType === 'CONDITIONAL' ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}>
                  {decisionType === 'REJECT' ? 'Xác nhận Không chấp thuận'
                   : decisionType === 'CONDITIONAL' ? 'Ban hành Chấp thuận có điều kiện'
                   : 'Ban hành Chấp thuận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ RENEWAL MODAL ═══ */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleRenewal}>
              <div className="px-5 py-4 border-b border-slate-100 bg-indigo-700 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Gia hạn hiệu lực IRB</h3>
                <button type="button" onClick={() => setShowRenewalModal(false)} className="text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-600 font-semibold">
                  Ngày hết hạn hiện tại: <strong className="text-rose-600 font-mono">{formatDate(ethics?.expiryDate)}</strong>
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Ngày hết hạn mới *</label>
                  <input type="date" required className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-300/30 focus:border-indigo-500 outline-none"
                    value={renewalForm.newExpiryDate}
                    onChange={(e) => setRenewalForm({ ...renewalForm, newExpiryDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Lý do gia hạn</label>
                  <textarea rows={2} placeholder="Số biên bản họp Hội đồng hoặc lý do gia hạn..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-300/30 focus:border-indigo-500 outline-none resize-none"
                    value={renewalForm.renewalReason}
                    onChange={(e) => setRenewalForm({ ...renewalForm, renewalReason: e.target.value })} />
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowRenewalModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition">Hủy</button>
                <button type="submit" className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition">Xác nhận Gia hạn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ AMENDMENT MODAL ═══ */}
      {showAmendmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-amber-700 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Nộp sửa đổi đề cương (Protocol Amendment)</h3>
              <button type="button" onClick={() => setShowAmendmentModal(false)} className="text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 font-semibold bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed">
                Mọi thay đổi về đề cương, phương pháp, hay tài liệu ICF sau khi được phê duyệt đều phải được Hội đồng Đạo đức xem xét lại <strong>trước khi áp dụng</strong>.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Mô tả nội dung sửa đổi *</label>
                <textarea rows={4} placeholder="Mô tả chi tiết nội dung cần sửa đổi và lý do thay đổi..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-300/30 focus:border-amber-500 outline-none resize-none"
                  value={amendmentNote}
                  onChange={(e) => setAmendmentNote(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Đính kèm tài liệu sửa đổi</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-xs text-slate-400 hover:border-amber-300 hover:bg-amber-50/30 transition cursor-pointer">
                  <Upload className="w-6 h-6 mx-auto mb-1 opacity-30" />
                  Kéo thả hoặc click để tải tệp lên
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAmendmentModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition">Hủy</button>
              <button type="button"
                onClick={() => {
                  if (!amendmentNote.trim()) { warning('Vui lòng mô tả nội dung sửa đổi.'); return; }
                  success('Đã nộp yêu cầu sửa đổi đề cương thành công! Hội đồng sẽ xem xét trong 5–7 ngày làm việc.');
                  setShowAmendmentModal(false);
                  setAmendmentNote('');
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition">
                Nộp yêu cầu sửa đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
