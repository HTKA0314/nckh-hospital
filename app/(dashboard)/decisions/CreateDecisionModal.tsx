'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, CircleAlert, FileText, Search, Send, X } from 'lucide-react';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { Decision, ResearchProject } from '@/lib/types';

interface CreateDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedProjectId?: string;
  decisionType: 'ASSIGNMENT' | 'RECOGNITION';
}

type GateItem = { label: string; passed: boolean };

export function CreateDecisionModal({
  isOpen,
  onClose,
  preSelectedProjectId,
  decisionType,
}: CreateDecisionModalProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const allProjects = repo.getProjects();
  const existingDecisions = repo.getDecisions({ type: decisionType });

  const hasDecisionOfType = (projectId: string) =>
    existingDecisions.some((decision) =>
      decision.projectId === projectId &&
      ['DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'ISSUED'].includes(decision.status)
    );

  const getGateItems = (project: ResearchProject): GateItem[] => {
    if (decisionType === 'ASSIGNMENT') {
      const latestProposalEvaluation = [...(project.proposalEvaluations || [])]
        .sort((a, b) => b.concludedAt.localeCompare(a.concludedAt))[0];

      return [
        {
          label: 'Đề cương đã được Hội đồng thông qua',
          passed:
            project.proposalStatus === 'PROPOSAL_APPROVED' &&
            latestProposalEvaluation?.conclusion === 'APPROVED',
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
      ];
    }

    const latestAcceptanceEvaluation = [...(project.acceptanceEvaluations || [])]
      .sort((a, b) => b.concludedAt.localeCompare(a.concludedAt))[0];

    const conditionalRevisionCompleted =
      latestAcceptanceEvaluation?.conclusion === 'CONDITIONALLY_ACCEPTED' &&
      (latestAcceptanceEvaluation.revisionItems || []).length > 0 &&
      (latestAcceptanceEvaluation.revisionItems || []).every(
        (item) => item.status === 'CONFIRMED'
      );

    return [
      {
        label: 'Hội đồng nghiệm thu đã có kết luận đạt',
        passed:
          latestAcceptanceEvaluation?.conclusion === 'ACCEPTED' ||
          conditionalRevisionCompleted,
      },
      {
        label: 'Đề tài đang ở trạng thái đã nghiệm thu',
        passed: project.status === 'ACCEPTED',
      },
    ];
  };

  const isEligible = (project: any) =>
    !hasDecisionOfType(project.id) && getGateItems(project).every((item) => item.passed);

  const eligibleProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return allProjects
      .filter(isEligible)
      .filter((project) => {
        if (!query) return true;
        return [
          project.projectCode,
          project.proposalCode,
          project.title,
          project.principalInvestigatorName,
          project.departmentName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
      });
  }, [searchTerm, decisionType, existingDecisions]);

  const selectedProject = allProjects.find((project) => project.id === selectedProjectId);
  const selectedGateItems = selectedProject ? getGateItems(selectedProject) : [];

  useEffect(() => {
    if (!isOpen) {
      setSelectedProjectId('');
      setSearchTerm('');
      setIsCreating(false);
      return;
    }

    if (preSelectedProjectId) {
      const preselected = allProjects.find((project) => project.id === preSelectedProjectId);
      setSelectedProjectId(preselected && isEligible(preselected) ? preSelectedProjectId : '');
    } else {
      setSelectedProjectId('');
    }
  }, [isOpen, preSelectedProjectId, decisionType]);

  if (!isOpen) return null;

  const close = () => {
    if (isCreating) return;
    onClose();
  };

  const createDecision = async (submitImmediately: boolean) => {
    if (!currentUser || !['RESEARCH_OFFICE', 'ADMIN'].includes(currentUser.role)) {
      warning('Bạn không có quyền lập quyết định.');
      return;
    }

    if (!selectedProject) {
      warning('Vui lòng chọn đề tài.');
      return;
    }

    if (!getGateItems(selectedProject).every((item) => item.passed)) {
      warning('Đề tài chưa đủ điều kiện lập quyết định.');
      return;
    }

    if (hasDecisionOfType(selectedProject.id)) {
      warning('Đề tài đã có quyết định cùng loại.');
      return;
    }

    setIsCreating(true);
    try {
      const now = new Date().toISOString();
      const decisionId = `dec-${Date.now()}-${selectedProject.id}`;
      const targetStatus = submitImmediately ? 'PENDING_SIGNATURE' : 'DRAFT';

      const decision: Decision = {
        id: decisionId,
        type: decisionType,
        status: targetStatus,
        projectId: selectedProject.id,
        createdAt: now,
        createdBy: currentUser.id,
        notes:
          decisionType === 'ASSIGNMENT'
            ? `Quyết định giao thực hiện đề tài "${selectedProject.title}".`
            : `Quyết định công nhận kết quả đề tài "${selectedProject.title}".`,
        history: [
          {
            id: `dh-${Date.now()}`,
            decisionId,
            action: submitImmediately ? 'SUBMITTED_FOR_SIGNATURE' : 'DRAFT_CREATED',
            toStatus: targetStatus,
            actorId: currentUser.id,
            actorName: currentUser.fullName,
            actorRole: currentUser.role,
            timestamp: now,
            notes: submitImmediately ? 'Tạo dự thảo và trình ký.' : 'Tạo dự thảo quyết định.',
          },
        ],
      };

      let created: Decision | boolean | null = null;
      if (typeof (repo as any).createDecision === 'function') {
        created = (repo as any).createDecision(decision);
      } else if (typeof (repo as any).addDecision === 'function') {
        created = (repo as any).addDecision(decision);
      } else {
        throw new Error('DECISION_REPOSITORY_NOT_SUPPORTED');
      }

      if (created === false || created === null) {
        throw new Error('CREATE_DECISION_FAILED');
      }

      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        actionCode: submitImmediately ? 'SUBMIT_DECISION_TO_DIRECTOR' : 'CREATE_DECISION_DRAFT',
        entityType: 'DECISION',
        entityId: decisionId,
        notes: `${submitImmediately ? 'Trình ký' : 'Tạo dự thảo'} ${decisionType === 'ASSIGNMENT' ? 'QĐ giao thực hiện' : 'QĐ công nhận'} cho ${selectedProject.projectCode || selectedProject.proposalCode}.`,
      });

      success(submitImmediately ? 'Đã tạo và trình ký quyết định.' : 'Đã tạo dự thảo quyết định.');
      onClose();
      router.push(`/decisions/${decisionId}`);
    } catch {
      error('Không thể tạo quyết định. Vui lòng kiểm tra repository và dữ liệu.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 text-xs backdrop-blur-xs">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 bg-[#0B2A63] px-6 py-4 text-white">
          <div>
            <h2 className="text-sm font-bold">
              {decisionType === 'ASSIGNMENT' ? 'Lập quyết định giao thực hiện' : 'Lập quyết định công nhận kết quả'}
            </h2>
            <p className="mt-0.5 text-[11px] text-white/75">Chọn đề tài đủ điều kiện và tạo hồ sơ trình ký.</p>
          </div>
          <button type="button" onClick={close} disabled={isCreating} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm mã đề tài, tên đề tài, chủ nhiệm..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 outline-none focus:border-[#0A6EBD]"
            />
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wide text-slate-900">Đề tài đủ điều kiện</h3>
              <span className="rounded border border-sky-100 bg-sky-50 px-2 py-0.5 font-mono font-bold text-[#0A6EBD]">{eligibleProjects.length}</span>
            </div>

            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-slate-200">
              {eligibleProjects.length === 0 ? (
                <div className="px-5 py-10 text-center text-slate-400">
                  <FileText className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 font-bold text-slate-600">Không có đề tài đủ điều kiện.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {eligibleProjects.map((project) => {
                    const checked = selectedProjectId === project.id;
                    return (
                      <label key={project.id} className={`flex cursor-pointer items-start gap-3 p-3.5 ${checked ? 'border-l-4 border-l-[#0A6EBD] bg-sky-50/70' : 'hover:bg-slate-50'}`}>
                        <input type="radio" checked={checked} onChange={() => setSelectedProjectId(project.id)} className="mt-1" />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono font-bold text-[#0A6EBD]">{project.projectCode || project.proposalCode || '—'}</p>
                          <p className="mt-0.5 font-bold leading-snug text-slate-900">{project.title}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{project.principalInvestigatorName || '—'} • {project.departmentName || '—'}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {selectedProject && (
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold uppercase tracking-wide text-slate-900">Điều kiện nghiệp vụ</h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đủ điều kiện
                </span>
              </div>
              <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                {selectedGateItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 font-semibold">
                    {item.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CircleAlert className="h-4 w-4 text-rose-600" />}
                    <span className={item.passed ? 'text-slate-700' : 'text-rose-700'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button type="button" onClick={close} disabled={isCreating} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Hủy</button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => createDecision(false)} disabled={!selectedProject || isCreating} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50">
              {isCreating ? 'Đang tạo...' : 'Lưu dự thảo'}
            </button>
            <button type="button" onClick={() => createDecision(true)} disabled={!selectedProject || isCreating} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-4 py-2 font-bold text-white hover:bg-[#085896] disabled:opacity-50">
              <Send className="h-3.5 w-3.5" /> {isCreating ? 'Đang gửi...' : 'Tạo & trình ký'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}