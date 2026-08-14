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
  PENDING_SIGNATURE: { label: 'Chờ ký', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  RETURNED: { label: 'Trả lại', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  SIGNED: { label: 'Đã ký', className: 'border-sky-200 bg-sky-50 text-[#0A6EBD]' },
  ISSUED: { label: 'Đã ban hành', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
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
                proposalEvaluation?.conclusion === 'APPROVED',
            },
            {
              label: 'Đạo đức nghiên cứu đã được phê duyệt hoặc không áp dụng',
              passed:
                !project.ethicsRequired ||
                project.ethicsStatus === 'ETHICS_APPROVED' ||
                project.ethicsStatus === 'NOT_REQUIRED',
            },
            {
              label: 'Đề tài đang chờ quyết định giao thực hiện',
              passed: project.status === 'WAITING_ASSIGNMENT',
            },
          ]
        : [
            {
              label: 'Hội đồng nghiệm thu đã có kết luận chính thức',
              passed:
                acceptanceEvaluation?.conclusion === 'ACCEPTED' ||
                conditionalAcceptanceCompleted,
            },
            {
              label: 'Đề tài đang ở trạng thái đã nghiệm thu',
              passed: project.status === 'ACCEPTED',
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
            : { status: 'RECOGNIZED', updatedAt: now }
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
    <div className="mx-auto max-w-[1240px] space-y-4 p-6 text-xs text-slate-800">
      <div className="flex items-center justify-between gap-3">
        <Link href="/decisions" className="inline-flex items-center gap-2 font-semibold text-slate-500 hover:text-[#0A6EBD]">
          <ArrowLeft className="h-4 w-4" /> Quản lý quyết định
        </Link>
        <span className={`rounded-full border px-3 py-1 font-bold ${statusMeta.className}`}>{statusMeta.label}</span>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-bold text-slate-600">
                {decision.type === 'ASSIGNMENT' ? 'QĐ giao thực hiện' : 'QĐ công nhận kết quả'}
              </span>
              {decision.decisionNumber && <span className="font-mono font-bold text-[#0A6EBD]">{decision.decisionNumber}</span>}
            </div>
            <h1 className="mt-2 text-lg font-bold leading-snug text-slate-900">{project.title}</h1>
            <p className="mt-1 text-slate-500">{project.projectCode || project.proposalCode || '—'} • {project.principalInvestigatorName} • {project.departmentName}</p>
          </div>
          <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50">
            <BookOpen className="h-4 w-4" /> Xem đề tài
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="border-b border-slate-200 px-5 py-3.5"><h2 className="font-bold text-slate-900">Thông tin quyết định</h2></div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
              <InfoItem label="Loại quyết định" value={decision.type === 'ASSIGNMENT' ? 'Giao thực hiện đề tài' : 'Công nhận kết quả'} />
              <InfoItem label="Số quyết định" value={decision.decisionNumber || 'Chưa cấp'} />
              <InfoItem label="Ngày lập" value={formatDate(decision.createdAt)} />
              <InfoItem label="Người ký" value={decision.signedBy || '—'} />
              <InfoItem label="Ngày ký" value={decision.signedDate ? formatDate(decision.signedDate) : '—'} />
              <InfoItem label="Ngày ban hành" value={decision.issuedDate ? formatDate(decision.issuedDate) : '—'} />
            </div>

            {canIssue && (
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                <label className="mb-1 block font-bold text-slate-700">Số quyết định chính thức *</label>
                <input
                  value={decisionNumber}
                  onChange={(event) => setDecisionNumber(event.target.value)}
                  placeholder="Ví dụ: 123/QĐ-BV"
                  className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono font-bold outline-none focus:border-[#0A6EBD]"
                />
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
              <History className="h-4 w-4 text-slate-400" />
              <h2 className="font-bold text-slate-900">Lịch sử xử lý</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(decision.history || []).length === 0 ? (
                <div className="p-8 text-center text-slate-400">Chưa có lịch sử xử lý.</div>
              ) : (
                [...decision.history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100"><Clock3 className="h-4 w-4 text-slate-500" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3"><p className="font-bold text-slate-800">{getHistoryActionLabel(item.action)}</p><span className="text-slate-400">{formatDate(item.timestamp)}</span></div>
                      <p className="mt-0.5 text-[11px] text-slate-500">{item.actorName} • {item.actorRole}</p>
                      {item.notes && <p className="mt-1 text-slate-600">{item.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#0A6EBD]" /><h2 className="font-bold text-slate-900">Điều kiện trình ký</h2></div>
            <div className="mt-3 space-y-2.5">
              {gate.checks.map((check) => (
                <div key={check.label} className="flex items-start gap-2">
                  {check.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 text-rose-600" />}
                  <span className={check.passed ? 'text-slate-700' : 'text-rose-700'}>{check.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <h2 className="font-bold text-slate-900">Thao tác</h2>
            <div className="mt-3 space-y-2">
              {canSubmit && (
                <button type="button" onClick={() => handleAction('SUBMIT')} disabled={!gate.isReady || isProcessing} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A6EBD] px-4 py-2.5 font-bold text-white hover:bg-[#085896] disabled:opacity-50">
                  <Send className="h-4 w-4" /> {decision.status === 'RETURNED' ? 'Trình ký lại' : 'Trình ký'}
                </button>
              )}

              {canSign && !showReturnBox && (
                <>
                  <button type="button" onClick={() => handleAction('SIGN')} disabled={isProcessing} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                    <PenTool className="h-4 w-4" /> Ký quyết định
                  </button>
                  <button type="button" onClick={() => setShowReturnBox(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 font-semibold text-rose-600 hover:bg-rose-50">
                    <RotateCcw className="h-4 w-4" /> Trả lại
                  </button>
                </>
              )}

              {canSign && showReturnBox && (
                <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <textarea value={returnNote} onChange={(event) => setReturnNote(event.target.value)} rows={4} placeholder="Nội dung cần chỉnh sửa..." className="w-full resize-none rounded-lg border border-rose-200 bg-white p-2.5 outline-none" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowReturnBox(false); setReturnNote(''); }} className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700">Hủy</button>
                    <button type="button" onClick={() => handleAction('RETURN')} disabled={isProcessing} className="flex-1 rounded-lg bg-rose-600 px-3 py-2 font-bold text-white disabled:opacity-50">Xác nhận trả lại</button>
                  </div>
                </div>
              )}

              {canIssue && (
                <button type="button" onClick={() => handleAction('ISSUE')} disabled={isProcessing || !decisionNumber.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A6EBD] px-4 py-2.5 font-bold text-white hover:bg-[#085896] disabled:opacity-50">
                  <CheckCircle2 className="h-4 w-4" /> Ban hành quyết định
                </button>
              )}

              {!canSubmit && !canSign && !canIssue && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-600">
                  {decision.status === 'PENDING_SIGNATURE' ? 'Đang chờ Giám đốc ký.' : decision.status === 'SIGNED' ? 'Đã ký, chờ ban hành.' : decision.status === 'ISSUED' ? 'Quyết định đã ban hành.' : 'Chỉ xem.'}
                </div>
              )}
            </div>
          </section>

          {decision.status === 'RETURNED' && (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-rose-600" /><div><p className="font-bold text-rose-800">Nội dung cần chỉnh sửa</p><p className="mt-1 text-rose-700">{getLatestReturnNote(decision) || 'Không có ghi chú.'}</p></div></div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-[11px] font-semibold text-slate-500">{label}</div><div className="mt-1 font-bold text-slate-800">{value}</div></div>;
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