'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  User,
  XCircle,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import {
  Decision,
  DecisionHistoryEntry,
  DecisionStatus,
  ResearchProject,
} from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

type DecisionAction = 'SUBMIT' | 'SIGN' | 'RETURN' | 'ISSUE';

type GateCheck = {
  label: string;
  passed: boolean;
};

const STATUS_META: Record<
  DecisionStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Dự thảo',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  PENDING_SIGNATURE: {
    label: 'Đang trình ký',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  RETURNED: {
    label: 'Đã trả lại',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  SIGNED: {
    label: 'Đã ký',
    className: 'border-sky-200 bg-sky-50 text-[#0A6EBD]',
  },
  ISSUED: {
    label: 'Đã ban hành',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
};

export default function DecisionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
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

    const foundProject = repo.getProjectById(foundDecision.projectId);

    setDecision(foundDecision);
    setProject(foundProject || null);
    setDecisionNumber(foundDecision.decisionNumber || '');
  };

  useEffect(() => {
    loadData();
  }, [decisionId]);

  const gate = useMemo(() => {
    if (!decision || !project) {
      return { checks: [] as GateCheck[], isReady: false };
    }

    if (decision.type === 'ASSIGNMENT') {
      const checks: GateCheck[] = [
        {
          label: 'Đề cương đã được Hội đồng thông qua',
          passed: project.proposalStatus === 'PROPOSAL_APPROVED',
        },
        {
          label: 'Đạo đức nghiên cứu đã đáp ứng hoặc không áp dụng',
          passed:
            project.ethicsStatus === 'ETHICS_APPROVED' ||
            project.ethicsStatus === 'NOT_REQUIRED',
        },
        {
          label: 'Đề tài đang ở trạng thái chờ giao thực hiện',
          passed: project.status === 'WAITING_ASSIGNMENT',
        },
      ];

      return {
        checks,
        isReady: checks.every((item) => item.passed),
      };
    }

    const checks: GateCheck[] = [
      {
        label: 'Đề tài đã được Hội đồng nghiệm thu thông qua',
        passed: project.status === 'ACCEPTED',
      },
    ];

    return {
      checks,
      isReady: checks.every((item) => item.passed),
    };
  }, [decision, project]);

  if (!decision || !project) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Không tìm thấy quyết định hoặc đề tài liên quan.
          </p>
          <Link
            href="/decisions"
            className="mt-4 inline-flex text-sm font-medium text-[#0A6EBD] hover:underline"
          >
            Quay lại danh sách quyết định
          </Link>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[decision.status];

  const canSubmit =
    currentUser?.role === 'RESEARCH_OFFICE' &&
    (decision.status === 'DRAFT' || decision.status === 'RETURNED');

  const canSign =
    currentUser?.role === 'DIRECTOR' &&
    decision.status === 'PENDING_SIGNATURE';

  const canIssue =
    currentUser?.role === 'RESEARCH_OFFICE' &&
    decision.status === 'SIGNED';

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
    const updatedDecision = repo.updateDecision(decision.id, {
      ...extraUpdates,
      status: nextStatus,
      history: [...decision.history, historyEntry],
    });

    if (!updatedDecision) {
      throw new Error('UPDATE_DECISION_FAILED');
    }

    setDecision(updatedDecision);
    setDecisionNumber(updatedDecision.decisionNumber || '');
  };

  const handleAction = async (action: DecisionAction) => {
    if (!currentUser) {
      warning('Phiên đăng nhập không hợp lệ.');
      return;
    }

    try {
      setIsProcessing(true);

      if (action === 'SUBMIT') {
        if (!canSubmit) {
          warning('Bạn không có quyền trình ký quyết định này.');
          return;
        }

        if (!gate.isReady) {
          warning('Đề tài chưa đáp ứng đầy đủ điều kiện trình ký.');
          return;
        }

        const entry = createHistoryEntry(
          decision.status === 'RETURNED'
            ? 'RESUBMITTED_FOR_SIGNATURE'
            : 'SUBMITTED_FOR_SIGNATURE',
          decision.status,
          'PENDING_SIGNATURE',
          decision.status === 'RETURNED'
            ? 'Trình ký lại quyết định sau khi hoàn thiện.'
            : 'Trình ký quyết định.'
        );

        persistTransition('PENDING_SIGNATURE', entry);

        setShowReturnBox(false);
        setReturnNote('');
        success('Đã trình quyết định để người có thẩm quyền ký.');
        return;
      }

      if (action === 'SIGN') {
        if (!canSign) {
          warning('Bạn không có quyền ký quyết định này.');
          return;
        }

        const now = new Date().toISOString();
        const entry = createHistoryEntry(
          'SIGNED',
          'PENDING_SIGNATURE',
          'SIGNED',
          'Người có thẩm quyền đã ký quyết định.'
        );

        persistTransition('SIGNED', entry, {
          signedBy: currentUser.fullName,
          signedDate: now,
        });

        success('Đã ký quyết định.');
        return;
      }

      if (action === 'RETURN') {
        if (!canSign) {
          warning('Bạn không có quyền trả lại quyết định này.');
          return;
        }

        if (!returnNote.trim()) {
          warning('Vui lòng nhập lý do trả lại.');
          return;
        }

        const entry = createHistoryEntry(
          'RETURNED',
          'PENDING_SIGNATURE',
          'RETURNED',
          returnNote.trim()
        );

        persistTransition('RETURNED', entry);

        setShowReturnBox(false);
        setReturnNote('');
        success('Đã trả lại quyết định để chỉnh sửa.');
        return;
      }

      if (action === 'ISSUE') {
        if (!canIssue) {
          warning('Bạn không có quyền ban hành quyết định này.');
          return;
        }

        if (!decisionNumber.trim()) {
          warning('Vui lòng nhập số quyết định trước khi ban hành.');
          return;
        }

        const now = new Date().toISOString();
        const entry = createHistoryEntry(
          'ISSUED',
          'SIGNED',
          'ISSUED',
          'Ban hành quyết định chính thức.'
        );

        persistTransition('ISSUED', entry, {
          decisionNumber: decisionNumber.trim(),
          issuedDate: now,
        });

        if (decision.type === 'ASSIGNMENT') {
          repo.updateProject(project.id, {
            status: 'IN_PROGRESS',
          });
        } else {
          repo.updateProject(project.id, {
            status: 'RECOGNIZED',
          });
        }

        setProject(repo.getProjectById(project.id) || project);
        success('Đã ban hành quyết định.');
      }
    } catch {
      error('Không thể cập nhật quyết định. Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/decisions"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Quản lý quyết định
        </Link>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                {decision.type === 'ASSIGNMENT'
                  ? 'Quyết định giao thực hiện'
                  : 'Quyết định công nhận kết quả'}
              </span>

              {decision.decisionNumber && (
                <span className="font-mono text-xs font-semibold text-[#0A6EBD]">
                  {decision.decisionNumber}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-xl font-semibold leading-7 text-slate-900">
              {project.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>
                Mã đề tài:{' '}
                <strong className="font-medium text-slate-700">
                  {project.projectCode || project.proposalCode || '—'}
                </strong>
              </span>
              <span>
                Chủ nhiệm:{' '}
                <strong className="font-medium text-slate-700">
                  {project.principalInvestigatorName}
                </strong>
              </span>
              <span>
                Ngày lập:{' '}
                <strong className="font-medium text-slate-700">
                  {formatDate(decision.createdAt)}
                </strong>
              </span>
            </div>
          </div>

          <Link
            href={`/projects/${project.id}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <BookOpen className="h-4 w-4" />
            Xem đề tài
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Thông tin quyết định
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              <InfoItem
                label="Loại quyết định"
                value={
                  decision.type === 'ASSIGNMENT'
                    ? 'Giao thực hiện đề tài'
                    : 'Công nhận kết quả'
                }
              />

              <InfoItem
                label="Số quyết định"
                value={decision.decisionNumber || 'Chưa cấp'}
              />

              <InfoItem
                label="Người lập"
                value={
                  decision.history.find(
                    (item) => item.action === 'DRAFT_CREATED'
                  )?.actorName || '—'
                }
              />

              <InfoItem
                label="Ngày tạo"
                value={formatDate(decision.createdAt)}
              />

              <InfoItem
                label="Người ký"
                value={decision.signedBy || '—'}
              />

              <InfoItem
                label="Ngày ký"
                value={
                  decision.signedDate ? formatDate(decision.signedDate) : '—'
                }
              />

              <InfoItem
                label="Ngày ban hành"
                value={
                  decision.issuedDate ? formatDate(decision.issuedDate) : '—'
                }
              />

              <InfoItem
                label="Trạng thái"
                value={statusMeta.label}
              />
            </div>

            {decision.status === 'SIGNED' &&
              currentUser?.role === 'RESEARCH_OFFICE' && (
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                  <label
                    htmlFor="decision-number"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Số quyết định <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="decision-number"
                    type="text"
                    value={decisionNumber}
                    onChange={(event) =>
                      setDecisionNumber(event.target.value)
                    }
                    placeholder="Ví dụ: 123/QĐ-BV"
                    className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0A6EBD] focus:ring-2 focus:ring-sky-100"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Nhập số chính thức trước khi ban hành.
                  </p>
                </div>
              )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Đề tài liên quan
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              <InfoItem
                label="Mã đề tài"
                value={project.projectCode || project.proposalCode || '—'}
              />
              <InfoItem
                label="Chủ nhiệm"
                value={project.principalInvestigatorName || '—'}
              />
              <InfoItem
                label="Khoa / Phòng"
                value={project.departmentName || '—'}
              />
              <InfoItem
                label="Thời gian thực hiện"
                value={
                  project.startDate && project.endDate
                    ? `${formatDate(project.startDate)} – ${formatDate(
                        project.endDate
                      )}`
                    : '—'
                }
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <History className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">
                Lịch sử xử lý
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {decision.history.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-400">
                  Chưa có lịch sử xử lý.
                </div>
              ) : (
                [...decision.history]
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 px-5 py-4"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <Clock3 className="h-4 w-4 text-slate-500" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800">
                            {getHistoryActionLabel(item.action)}
                          </p>
                          <span className="text-xs text-slate-400">
                            {formatDate(item.timestamp)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.actorName} · {item.actorRole}
                        </p>

                        {item.notes && (
                          <p className="mt-1.5 text-sm text-slate-600">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0A6EBD]" />
              <h2 className="text-sm font-semibold text-slate-900">
                Điều kiện trình ký
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {gate.checks.map((check) => (
                <div key={check.label} className="flex items-start gap-2.5">
                  {check.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span
                    className={`text-sm ${
                      check.passed ? 'text-slate-700' : 'text-rose-700'
                    }`}
                  >
                    {check.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              className={`mt-4 rounded-lg border p-3 text-sm ${
                gate.isReady
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {gate.isReady
                ? 'Đủ điều kiện trình ký.'
                : 'Chưa đủ điều kiện trình ký.'}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Thao tác
            </h2>

            <div className="mt-4 space-y-2.5">
              {canSubmit && (
                <button
                  type="button"
                  onClick={() => handleAction('SUBMIT')}
                  disabled={!gate.isReady || isProcessing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A6EBD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085896] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {decision.status === 'RETURNED'
                    ? 'Trình ký lại'
                    : 'Trình ký'}
                </button>
              )}

              {canSign && !showReturnBox && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAction('SIGN')}
                    disabled={isProcessing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <PenTool className="h-4 w-4" />
                    Ký quyết định
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReturnBox(true)}
                    disabled={isProcessing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Trả lại
                  </button>
                </>
              )}

              {canSign && showReturnBox && (
                <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <label
                    htmlFor="return-note"
                    className="block text-sm font-medium text-rose-800"
                  >
                    Lý do trả lại
                  </label>
                  <textarea
                    id="return-note"
                    value={returnNote}
                    onChange={(event) => setReturnNote(event.target.value)}
                    rows={4}
                    placeholder="Nhập nội dung cần chỉnh sửa..."
                    className="w-full resize-none rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReturnBox(false);
                        setReturnNote('');
                      }}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      Hủy
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction('RETURN')}
                      disabled={isProcessing}
                      className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Xác nhận trả lại
                    </button>
                  </div>
                </div>
              )}

              {canIssue && (
                <button
                  type="button"
                  onClick={() => handleAction('ISSUE')}
                  disabled={isProcessing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A6EBD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085896] disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Ban hành quyết định
                </button>
              )}

              {decision.status === 'PENDING_SIGNATURE' &&
                currentUser?.role === 'RESEARCH_OFFICE' && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Quyết định đang chờ người có thẩm quyền ký.
                  </div>
                )}

              {decision.status === 'SIGNED' &&
                currentUser?.role !== 'RESEARCH_OFFICE' && (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-[#0A6EBD]">
                    Quyết định đã ký và đang chờ Phòng NCKH ban hành.
                  </div>
                )}

              {decision.status === 'RETURNED' &&
                currentUser?.role !== 'RESEARCH_OFFICE' && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    Quyết định đã được trả lại để chỉnh sửa.
                  </div>
                )}

              {decision.status === 'ISSUED' && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  Quyết định đã được ban hành.
                </div>
              )}

              {!canSubmit &&
                !canSign &&
                !canIssue &&
                decision.status === 'DRAFT' && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    Bạn chỉ có quyền xem quyết định này.
                  </div>
                )}
            </div>
          </section>

          {decision.status === 'RETURNED' && (
            <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <p className="text-sm font-semibold text-rose-800">
                    Quyết định cần chỉnh sửa
                  </p>
                  <p className="mt-1 text-sm text-rose-700">
                    {getLatestReturnNote(decision) ||
                      'Không có ghi chú trả lại.'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function getHistoryActionLabel(action: DecisionHistoryEntry['action']) {
  switch (action) {
    case 'DRAFT_CREATED':
      return 'Tạo dự thảo';
    case 'SUBMITTED_FOR_SIGNATURE':
      return 'Trình ký';
    case 'RESUBMITTED_FOR_SIGNATURE':
      return 'Trình ký lại';
    case 'RETURNED':
      return 'Trả lại';
    case 'SIGNED':
      return 'Ký quyết định';
    case 'ISSUED':
      return 'Ban hành quyết định';
    default:
      return action;
  }
}

function getLatestReturnNote(decision: Decision) {
  return [...decision.history]
    .reverse()
    .find((item) => item.action === 'RETURNED')?.notes;
}