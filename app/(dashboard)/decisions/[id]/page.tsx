'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  PenTool,
  RotateCcw,
  Send,
  ShieldCheck,
  XCircle,
  User,
  Building2,
} from 'lucide-react';
import { repo } from '@/lib/repository';
import { Decision, DecisionHistoryEntry, DecisionStatus, ResearchProject } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

type DecisionAction = 'SUBMIT' | 'SIGN' | 'RETURN' | 'ISSUE';
type GateCheck = { label: string; passed: boolean };

const STATUS_META: Record<DecisionStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Dự thảo', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  PENDING_SIGNATURE: { label: 'Chờ ký', className: 'border-slate-300 bg-slate-100 text-slate-800' },
  RETURNED: { label: 'Trả lại', className: 'border-slate-300 bg-slate-100 text-slate-700' },
  SIGNED: { label: 'Đã ký', className: 'border-slate-300 bg-white text-slate-800' },
  ISSUED: { label: 'Đã ban hành', className: 'border-slate-200 bg-slate-50 text-slate-700' },
};

export default function DecisionDetailPage() {
  const params = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();
  const decisionId = params.id;

  const [decision, setDecision] = useState<Decision | null>(null);
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [decisionNumber, setDecisionNumber] = useState('');
  const [returnNote, setReturnNote] = useState('');
  const [showReturnBox, setShowReturnBox] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = () => {
    const foundDecision = repo.getDecisionById(decisionId);
    if (!foundDecision) {
      setDecision(null);
      setProject(null);
      return;
    }
    setDecision(foundDecision);
    setProject(repo.getProjectById(foundDecision.projectId) || null);
    setDecisionNumber(foundDecision.decisionNumber || '');
  };

  useEffect(() => {
    loadData();
  }, [decisionId]);

  const gate = useMemo(() => {
    if (!decision || !project) return { checks: [] as GateCheck[], isReady: false };

    const proposalEvaluation = [...(project.proposalEvaluations || [])]
      .reverse()
      .find((item) => item.projectId === project.id);

    const acceptanceEvaluation = [...(project.acceptanceEvaluations || [])]
      .reverse()
      .find((item) => item.projectId === project.id);

    const conditionalAcceptanceCompleted =
      acceptanceEvaluation?.conclusion === 'CONDITIONALLY_ACCEPTED' &&
      (acceptanceEvaluation.revisionItems || []).length > 0 &&
      (acceptanceEvaluation.revisionItems || []).every((item) => item.status === 'CONFIRMED');

    const checks: GateCheck[] =
      decision.type === 'ASSIGNMENT'
        ? [
            {
              label: 'Đề cương đã được Hội đồng thông qua',
              passed:
                project.proposalStatus === 'PROPOSAL_APPROVED' &&
                (!proposalEvaluation || proposalEvaluation.conclusion === 'APPROVED'),
            },
            {
              label: 'Đạo đức nghiên cứu đã được phê duyệt hoặc không áp dụng',
              passed:
                !project.ethicsRequired ||
                project.ethicsStatus === 'ETHICS_APPROVED' ||
                project.ethicsStatus === 'NOT_REQUIRED',
            },
          ]
        : [
            {
              label: 'Hội đồng nghiệm thu đã có kết luận chính thức',
              passed:
                !acceptanceEvaluation ||
                acceptanceEvaluation.conclusion === 'COMPLETED' ||
                conditionalAcceptanceCompleted,
            },
            {
              label: 'Đề tài đang ở trạng thái đã nghiệm thu',
              passed: ['SIGNED', 'ISSUED'].includes(decision.status)
                ? ['COMPLETED', 'COMPLETED'].includes(project.status)
                : project.status === 'COMPLETED',
            },
          ];

    return { checks, isReady: checks.every((item) => item.passed) };
  }, [decision, project]);

  if (!decision || !project) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">Không tìm thấy quyết định hoặc đề tài liên quan.</p>
          <Link href="/decisions" className="mt-4 inline-flex text-sm font-medium text-[#0A6EBD] hover:underline">Quay lại danh sách quyết định</Link>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[decision.status];
  const isOffice = ['RESEARCH_OFFICE', 'ADMIN'].includes(currentUser?.role || '');
  const isDirector = ['DIRECTOR', 'ADMIN'].includes(currentUser?.role || '');
  const canSubmit = isOffice && ['DRAFT', 'RETURNED'].includes(decision.status);
  const canSign = isDirector && decision.status === 'PENDING_SIGNATURE';
  const canIssue = isOffice && decision.status === 'SIGNED';

  const createHistoryEntry = (
    action: DecisionHistoryEntry['action'],
    fromStatus: DecisionStatus,
    toStatus: DecisionStatus,
    notes: string
  ): DecisionHistoryEntry => ({
    id: `dh-${Date.now()}`,
    decisionId: decision.id,
    action,
    fromStatus,
    toStatus,
    actorId: currentUser!.id,
    actorName: currentUser!.fullName,
    actorRole: currentUser!.role,
    timestamp: new Date().toISOString(),
    notes,
  });

  const persistTransition = (
    nextStatus: DecisionStatus,
    historyEntry: DecisionHistoryEntry,
    extraUpdates: Partial<Decision> = {}
  ) => {
    const updated = repo.updateDecision(decision.id, {
      ...extraUpdates,
      status: nextStatus,
      history: [...(decision.history || []), historyEntry],
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new Error('UPDATE_DECISION_FAILED');
    setDecision(updated);
    setDecisionNumber(updated.decisionNumber || '');
  };

  const handleAction = async (action: DecisionAction) => {
    if (!currentUser) return;
    setIsProcessing(true);

    try {
      if (action === 'SUBMIT') {
        if (!canSubmit) return warning('Bạn không có quyền trình ký quyết định này.');
        if (!gate.isReady) return warning('Chưa đủ điều kiện trình ký.');

        const entry = createHistoryEntry(
          decision.status === 'RETURNED' ? 'RESUBMITTED_FOR_SIGNATURE' : 'SUBMITTED_FOR_SIGNATURE',
          decision.status,
          'PENDING_SIGNATURE',
          decision.status === 'RETURNED' ? 'Trình ký lại sau khi hoàn thiện.' : 'Trình ký quyết định.'
        );
        persistTransition('PENDING_SIGNATURE', entry);
        setShowReturnBox(false);
        setReturnNote('');
        success('Đã trình ký quyết định.');
        return;
      }

      if (action === 'SIGN') {
        if (!canSign) return warning('Bạn không có quyền ký quyết định này.');
        if (!gate.isReady) return warning('Điều kiện nghiệp vụ của đề tài không còn đáp ứng để ký quyết định.');
        const now = new Date().toISOString();
        persistTransition(
          'SIGNED',
          createHistoryEntry('SIGNED', 'PENDING_SIGNATURE', 'SIGNED', 'Giám đốc đã ký quyết định.'),
          { signedBy: currentUser.fullName, signedDate: now }
        );
        success('Đã ký quyết định.');
        return;
      }

      if (action === 'RETURN') {
        if (!canSign) return warning('Bạn không có quyền trả lại quyết định này.');
        if (!returnNote.trim()) return warning('Vui lòng nhập lý do trả lại.');
        persistTransition(
          'RETURNED',
          createHistoryEntry('RETURNED', 'PENDING_SIGNATURE', 'RETURNED', returnNote.trim())
        );
        setShowReturnBox(false);
        setReturnNote('');
        success('Đã trả lại quyết định để chỉnh sửa.');
        return;
      }

      if (action === 'ISSUE') {
        if (!canIssue) return warning('Bạn không có quyền ban hành quyết định này.');
        if (!gate.isReady) return warning('Điều kiện nghiệp vụ của đề tài không còn đáp ứng để ban hành quyết định.');
        if (!decisionNumber.trim()) return warning('Vui lòng nhập số quyết định.');

        const now = new Date().toISOString();
        persistTransition(
          'ISSUED',
          createHistoryEntry('ISSUED', 'SIGNED', 'ISSUED', `Ban hành quyết định số ${decisionNumber.trim()}.`),
          { decisionNumber: decisionNumber.trim(), issuedDate: now }
        );

        const projectUpdated = repo.updateProject(
          project.id,
          decision.type === 'ASSIGNMENT'
            ? { status: 'IN_PROGRESS', updatedAt: now }
            : { status: 'COMPLETED', updatedAt: now }
        );

        if (!projectUpdated) {
          throw new Error('UPDATE_PROJECT_AFTER_DECISION_FAILED');
        }
        setProject(repo.getProjectById(project.id) || project);
        success('Đã ban hành quyết định.');
      }
    } catch {
      error('Không thể cập nhật quyết định.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 w-full text-slate-800 pb-16 animate-in fade-in duration-200">
      {/* ── QUAY LẠI ── */}
      <div className="flex items-center mb-[-8px]">
        <Link
          href="/decisions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition select-none cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Quản lý quyết định
        </Link>
      </div>

      {/* ── HEADER CARD ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs p-5 flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {decision.decisionNumber ? (
              <span className="font-mono font-bold text-[13px] bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded border border-slate-200 shadow-xs">
                {decision.decisionNumber}
              </span>
            ) : (
              <span className="font-mono font-bold text-[13px] bg-slate-50 text-slate-400 px-2.5 py-0.5 rounded border border-slate-200 border-dashed">
                Chưa cấp số
              </span>
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-xs border ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
            <span className="rounded-md bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0A6EBD] border border-sky-100 shadow-xs">
              {decision.type === 'ASSIGNMENT' ? 'Quyết định giao thực hiện' : 'Quyết định công nhận'}
            </span>
          </div>

          <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-snug break-words">
            {project.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-600 bg-slate-50 inline-flex p-2 rounded-lg border border-slate-100">
            <span className="font-mono text-[#0A6EBD] font-bold">{project.projectCode || project.proposalCode || '—'}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> {project.principalInvestigatorName}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> {project.departmentName}
            </span>
          </div>
        </div>
        
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <BookOpen className="h-3.5 w-3.5 text-slate-400" /> Xem hồ sơ gốc
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-3 space-y-5">{/* THÔNG TIN CHI TIẾT */}





          {/* QUYẾT ĐỊNH PREVIEW */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center gap-2 bg-[#0B2A63] px-3.5 py-2">
              <FileText className="h-3.5 w-3.5 text-white" />
              <h2 className="text-[10px] font-bold text-white uppercase tracking-wider">Nội dung quyết định (Dự thảo / Bản chính)</h2>
            </div>
            <div className="p-5 bg-slate-100 border-b border-slate-200 overflow-x-auto rounded-b-xl">
              <div 
                className="bg-white p-10 md:p-12 border border-slate-400 shadow-md max-w-[800px] mx-auto space-y-6 text-[13.5px] text-black leading-relaxed text-justify relative"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                {/* Header 2 cột */}
                <div className="flex justify-between items-start gap-4">
                  <div className="text-center w-5/12">
                    <p className="font-bold text-xs uppercase tracking-wide">BỆNH VIỆN ĐA KHOA TRUNG TÂM</p>
                    <p className="font-semibold text-[11px] underline">HỘI ĐỒNG KHCN</p>
                    <p className="text-[11px] mt-1 font-mono">Số: {decision.decisionNumber || '... /QĐ-BV'}</p>
                  </div>
                  <div className="text-center w-7/12 space-y-0.5">
                    <p className="font-bold text-[12px] uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-bold text-[11px] tracking-wider">Độc lập - Tự do - Hạnh phúc</p>
                    <div className="w-24 h-[1px] bg-black mx-auto mt-1"></div>
                  </div>
                </div>

                <div className="text-right italic text-[11px] text-slate-500 mt-2">
                  TP. Hồ Chí Minh, ngày {new Date(decision.createdAt).getDate()} tháng {new Date(decision.createdAt).getMonth() + 1} năm {new Date(decision.createdAt).getFullYear()}
                </div>

                {/* Tiêu đề quyết định */}
                <div className="text-center mt-6 space-y-1">
                  <p className="font-bold text-[14px]">QUYẾT ĐỊNH</p>
                  <p className="italic text-[12px] font-semibold">
                    V/v: {decision.type === 'ASSIGNMENT' 
                      ? 'Giao nhiệm vụ nghiên cứu khoa học cấp cơ sở' 
                      : 'Công nhận kết quả nghiệm thu đề tài khoa học cấp cơ sở'}
                  </p>
                  <div className="w-16 h-[1px] bg-black mx-auto mt-1"></div>
                </div>

                {/* Thẩm quyền quyết định */}
                <div className="text-center font-bold text-[13px] uppercase mt-4">
                  GIÁM ĐỐC BỆNH VIỆN ĐA KHOA TRUNG TÂM
                </div>

                {/* Căn cứ pháp lý */}
                <div className="space-y-1.5 italic text-slate-700 text-[12px]">
                  <p>- Căn cứ Quyết định thành lập Bệnh viện Đa khoa Trung tâm và chức năng, nhiệm vụ của Giám đốc Bệnh viện;</p>
                  <p>- Căn cứ Quy chế quản lý hoạt động Nghiên cứu khoa học và Công nghệ hiện hành của bệnh viện;</p>
                  <p>- Căn cứ Biên bản họp đánh giá và kiến nghị xét duyệt thuyết minh đề tài của Hội đồng Khoa học & Công nghệ bệnh viện;</p>
                  <p>- Xét đề nghị của Trưởng phòng Quản lý Nghiên cứu khoa học & Đào tạo.</p>
                </div>

                <div className="text-center font-bold text-[13px] tracking-widest my-4">
                  QUYẾT ĐỊNH:
                </div>

                {/* Các Điều khoản quyết định */}
                <div className="space-y-4 text-justify">
                  {decision.type === 'ASSIGNMENT' ? (
                    <>
                      <p>
                        <span className="font-bold">Điều 1.</span> Giao nhiệm vụ và phê duyệt thuyết minh đề tài nghiên cứu khoa học cấp cơ sở cho đ/c <span className="font-bold">{project.principalInvestigatorName}</span> làm Chủ nhiệm đề tài, phối hợp với {project.departmentName} thực hiện nghiên cứu đề tài:
                        <br />
                        <span className="font-bold italic">“{project.title}”</span>
                      </p>
                      <p>
                        <span className="font-bold">Điều 2.</span> Kinh phí thực hiện đề tài và thời gian quy định cụ thể như sau:
                        <br />
                        - Tổng kinh phí được phê duyệt: <span className="font-bold">{project.approvedBudget?.toLocaleString('vi-VN') || project.estimatedBudget?.toLocaleString('vi-VN')} VNĐ</span> (Bằng chữ: Bảy mươi lăm triệu đồng chẵn).
                        <br />
                        - Thời gian thực hiện: Từ tháng {new Date(project.startDate).getMonth() + 1}/{new Date(project.startDate).getFullYear()} đến hết tháng {new Date(project.endDate).getMonth() + 1}/{new Date(project.endDate).getFullYear()}.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <span className="font-bold">Điều 1.</span> Công nhận kết quả nghiệm thu đề tài khoa học cấp cơ sở cho đề tài:
                        <br />
                        <span className="font-bold italic">“{project.title}”</span>
                        <br />
                        Do đ/c <span className="font-bold">{project.principalInvestigatorName}</span> (đơn vị: {project.departmentName}) làm Chủ nhiệm đề tài.
                      </p>
                      <p>
                        <span className="font-bold">Điều 2.</span> Kết quả đánh giá nghiệm thu của Hội đồng Khoa học đạt mức: <span className="font-bold text-emerald-600">Đạt yêu cầu (Xếp loại Xuất sắc)</span>. Chủ nhiệm đề tài có trách nhiệm hoàn thiện hồ sơ báo cáo và bàn giao sản phẩm nghiên cứu theo quy chế.
                      </p>
                    </>
                  )}
                  <p>
                    <span className="font-bold">Điều 3.</span> Các Trưởng phòng: Quản lý NCKH, Tổ chức cán bộ, Tài chính - Kế toán, Trưởng khoa/phòng liên quan và cá nhân có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này kể từ ngày ký.
                  </p>
                </div>

                {/* Ký tên và Nơi nhận */}
                <div className="pt-8 flex justify-between items-start gap-4">
                  <div className="text-[11px] space-y-1 w-5/12 text-slate-500">
                    <p className="font-bold uppercase">Nơi nhận:</p>
                    <p>- Như Điều 3;</p>
                    <p>- Giám đốc (để b/c);</p>
                    <p>- Lưu: VT, NCKH.</p>
                  </div>
                  
                  <div className="text-center w-7/12 relative space-y-1">
                    <p className="font-bold text-xs uppercase">GIÁM ĐỐC BỆNH VIỆN</p>
                    
                    {decision.status === 'SIGNED' || decision.status === 'ISSUED' ? (
                      <div className="py-2 flex flex-col items-center justify-center">
                        <div className="border-2 border-rose-600 text-rose-600 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wide rotate-[-3deg] bg-rose-50/50 shadow-2xs">
                          <p>KÝ BỞI: {decision.signedBy || 'GS.TS.BS. Vũ Đình Khoa'}</p>
                          <p className="text-[9px] font-mono mt-0.5">Ngày ký: {formatDate(decision.signedDate || decision.createdAt)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-10 flex items-center justify-center">
                        <p className="text-slate-300 italic text-xs">(Chưa ký duyệt)</p>
                      </div>
                    )}
                    
                    <p className="font-bold text-xs mt-4">{decision.signedBy || 'GS.TS.BS. Vũ Đình Khoa'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-white flex items-center justify-end gap-2">
              <button className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300">Xem bản PDF</button>
              <button className="text-xs font-bold text-[#0A6EBD] bg-sky-50 border border-sky-200 hover:bg-sky-100 px-3 py-1.5 rounded-lg">Tải xuống</button>
            </div>
          </section>


          {decision.status === 'RETURNED' && (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-2xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-rose-900 uppercase tracking-wider">Nội dung yêu cầu chỉnh sửa</p>
                  <p className="mt-1.5 text-xs font-medium text-rose-800 leading-relaxed bg-white/60 p-2.5 rounded border border-rose-100">{getLatestReturnNote(decision) || 'Không có ghi chú.'}</p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-wrap items-center justify-end gap-2 sticky bottom-4 z-10">
            {canSubmit && (
              <button type="button" onClick={() => handleAction('SUBMIT')} disabled={!gate.isReady || isProcessing} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0A6EBD] px-5 py-2 text-xs font-bold text-white hover:bg-[#085896] transition disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /> {decision.status === 'RETURNED' ? 'Trình ký lại' : 'Trình ký quyết định'}
              </button>
            )}

            {canSign && !showReturnBox && (
              <>
                <button type="button" onClick={() => setShowReturnBox(true)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                  <RotateCcw className="h-3.5 w-3.5" /> Thu hồi / Trả lại chỉnh sửa
                </button>
                <button type="button" onClick={() => handleAction('SIGN')} disabled={isProcessing || !gate.isReady} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50">
                  <PenTool className="h-3.5 w-3.5" /> Ký phê duyệt
                </button>
              </>
            )}

            {canSign && showReturnBox && (
              <div className="w-full flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <textarea value={returnNote} onChange={(event) => setReturnNote(event.target.value)} rows={2} placeholder="Nhập lý do trả lại để phòng NCKH chỉnh sửa..." className="flex-1 resize-none rounded-lg border border-slate-300 bg-white p-2.5 text-xs outline-none focus:border-[#0A6EBD] font-medium" />
                <div className="flex flex-col gap-2 shrink-0">
                  <button type="button" onClick={() => handleAction('RETURN')} disabled={isProcessing} className="w-full rounded-md bg-rose-600 px-4 py-1.5 text-[11px] font-bold text-white disabled:opacity-50 hover:bg-rose-700">Xác nhận trả lại</button>
                  <button type="button" onClick={() => { setShowReturnBox(false); setReturnNote(''); }} className="w-full rounded-md border border-slate-300 bg-white px-4 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">Hủy bỏ</button>
                </div>
              </div>
            )}

            {canIssue && (
              <div className="flex items-center gap-2 mr-2">
                <label className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Số QĐ chính thức:</label>
                <input
                  value={decisionNumber}
                  onChange={(event) => setDecisionNumber(event.target.value)}
                  placeholder="Ví dụ: 123/QĐ-BV"
                  className="w-36 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs font-bold outline-none focus:border-[#0A6EBD] shadow-inner"
                />
              </div>
            )}

            {canIssue && (
              <button type="button" onClick={() => handleAction('ISSUE')} disabled={isProcessing || !decisionNumber.trim()} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0A6EBD] px-5 py-2 text-xs font-bold text-white hover:bg-[#085896] transition disabled:opacity-50">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ban hành quyết định
              </button>
            )}

            {!canSubmit && !canSign && !canIssue && (
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-4 py-1.5 rounded border border-slate-200 flex items-center gap-1.5">
                {decision.status === 'PENDING_SIGNATURE' ? 'Đang chờ Giám đốc ký duyệt' : decision.status === 'SIGNED' ? 'Đã ký, chờ ban hành' : decision.status === 'ISSUED' ? 'Đã ban hành chính thức' : 'Trạng thái chỉ xem'}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight, fullWidth }: { label: string; value: React.ReactNode; highlight?: boolean; fullWidth?: boolean }) {
  return (
    <div className={`flex flex-col py-2.5 border-b border-slate-100 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
        {label}
      </span>
      <span className={`text-[13px] ${highlight ? 'font-bold text-[#0A6EBD]' : 'font-semibold text-slate-800'}`}>
        {value || <span className="text-slate-400 italic font-normal">Chưa cập nhật</span>}
      </span>
    </div>
  );
}

function getHistoryActionLabel(action: DecisionHistoryEntry['action']) {
  switch (action) {
    case 'DRAFT_CREATED': return 'Tạo dự thảo';
    case 'SUBMITTED_FOR_SIGNATURE': return 'Trình ký';
    case 'RESUBMITTED_FOR_SIGNATURE': return 'Trình ký lại';
    case 'RETURNED': return 'Trả lại';
    case 'SIGNED': return 'Ký quyết định';
    case 'ISSUED': return 'Ban hành quyết định';
    default: return action;
  }
}

function getLatestReturnNote(decision: Decision) {
  return [...(decision.history || [])].reverse().find((item) => item.action === 'RETURNED')?.notes;
}