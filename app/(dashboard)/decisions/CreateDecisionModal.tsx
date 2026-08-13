'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CircleAlert,
  FileText,
  Search,
  X,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';

interface CreateDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedProjectId?: string;
  decisionType: 'ASSIGNMENT' | 'RECOGNITION';
}

type GateItem = {
  label: string;
  passed: boolean;
};

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
    existingDecisions.some((decision) => decision.projectId === projectId);

  const getGateItems = (project: any): GateItem[] => {
    if (decisionType === 'ASSIGNMENT') {
      return [
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
    }

    return [
      {
        label: 'Đề tài đã được Hội đồng nghiệm thu thông qua',
        passed: project.status === 'ACCEPTED',
      },
    ];
  };

  const isEligible = (project: any) => {
    if (hasDecisionOfType(project.id)) return false;
    return getGateItems(project).every((item) => item.passed);
  };

  const eligibleProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return allProjects
      .filter((project) => isEligible(project))
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
  }, [allProjects, existingDecisions, decisionType, searchTerm]);

  const selectedProject = useMemo(
    () => allProjects.find((project) => project.id === selectedProjectId),
    [allProjects, selectedProjectId]
  );

  const selectedGateItems = selectedProject
    ? getGateItems(selectedProject)
    : [];

  useEffect(() => {
    if (!isOpen) {
      setSelectedProjectId('');
      setSearchTerm('');
      setIsCreating(false);
      return;
    }

    if (
      preSelectedProjectId &&
      allProjects.some(
        (project) =>
          project.id === preSelectedProjectId && isEligible(project)
      )
    ) {
      setSelectedProjectId(preSelectedProjectId);
    } else {
      setSelectedProjectId('');
    }
  }, [isOpen, preSelectedProjectId, decisionType]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isCreating) return;
    setSelectedProjectId('');
    setSearchTerm('');
    onClose();
  };

  const handleCreateDraft = async () => {
    if (!currentUser) {
      warning('Phiên đăng nhập không hợp lệ.');
      return;
    }

    if (currentUser.role !== 'RESEARCH_OFFICE') {
      warning('Bạn không có quyền lập dự thảo quyết định.');
      return;
    }

    if (!selectedProject) {
      warning('Vui lòng chọn một đề tài.');
      return;
    }

    const gates = getGateItems(selectedProject);

    if (gates.some((item) => !item.passed)) {
      warning('Đề tài chưa đáp ứng đầy đủ điều kiện lập quyết định.');
      return;
    }

    if (hasDecisionOfType(selectedProject.id)) {
      warning('Đề tài đã có quyết định cùng loại.');
      return;
    }

    try {
      setIsCreating(true);

      const now = new Date().toISOString();
      const decisionId = `dec-${Date.now()}-${selectedProject.id}`;

      repo.createDecision({
        id: decisionId,
        type: decisionType,
        status: 'DRAFT',
        projectId: selectedProject.id,
        createdAt: now,
        createdBy: currentUser.id,
        notes:
          decisionType === 'ASSIGNMENT'
            ? `Tạo dự thảo Quyết định giao thực hiện cho đề tài "${selectedProject.title}".`
            : `Tạo dự thảo Quyết định công nhận kết quả cho đề tài "${selectedProject.title}".`,
        history: [
          {
            id: `dh-${Date.now()}-${selectedProject.id}`,
            decisionId,
            action: 'DRAFT_CREATED',
            toStatus: 'DRAFT',
            actorId: currentUser.id,
            actorName: currentUser.fullName,
            actorRole: currentUser.role,
            timestamp: now,
            notes: 'Tạo dự thảo quyết định.',
          },
        ],
      });

      success('Đã tạo dự thảo quyết định.');

      onClose();
      router.push(`/decisions/${decisionId}`);
    } catch {
      error('Không thể tạo dự thảo quyết định.');
    } finally {
      setIsCreating(false);
    }
  };

  const modalTitle =
    decisionType === 'ASSIGNMENT'
      ? 'Lập Quyết định giao thực hiện'
      : 'Lập Quyết định công nhận kết quả';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-decision-title"
    >
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="create-decision-title"
              className="text-base font-semibold text-slate-900"
            >
              {modalTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn một đề tài đủ điều kiện để tạo hồ sơ quyết định ở trạng thái
              dự thảo.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo mã, tên đề tài, chủ nhiệm..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#0A6EBD] focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">
                  Đề tài đủ điều kiện
                </h3>
                <span className="text-xs text-slate-500">
                  {eligibleProjects.length} đề tài
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                {eligibleProjects.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <FileText className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      Không có đề tài đủ điều kiện.
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Các đề tài chưa đạt gate nghiệp vụ hoặc đã có quyết định
                      cùng loại sẽ không xuất hiện tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {eligibleProjects.map((project) => {
                      const checked = selectedProjectId === project.id;

                      return (
                        <label
                          key={project.id}
                          className={`flex cursor-pointer items-start gap-3 px-4 py-4 transition ${
                            checked
                              ? 'bg-sky-50/70'
                              : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="decision-project"
                            checked={checked}
                            onChange={() => setSelectedProjectId(project.id)}
                            className="mt-1 h-4 w-4 border-slate-300 text-[#0A6EBD] focus:ring-[#0A6EBD]"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-[#0A6EBD]">
                                {project.projectCode ||
                                  project.proposalCode ||
                                  '—'}
                              </span>
                              <span className="text-xs text-slate-400">
                                {project.departmentName || '—'}
                              </span>
                            </div>

                            <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">
                              {project.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Chủ nhiệm:{' '}
                              <span className="font-medium text-slate-700">
                                {project.principalInvestigatorName || '—'}
                              </span>
                            </p>
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Kiểm tra điều kiện
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Hệ thống kiểm tra từ dữ liệu hiện có của đề tài.
                    </p>
                  </div>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Đủ điều kiện
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {selectedGateItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-2 text-sm"
                    >
                      {item.passed ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      )}
                      <span
                        className={
                          item.passed ? 'text-slate-700' : 'text-rose-700'
                        }
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-500">Số quyết định</div>
                    <div className="mt-1 text-sm font-medium text-slate-800">
                      Chưa cấp
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Trạng thái tạo mới</div>
                    <div className="mt-1 text-sm font-medium text-slate-800">
                      Dự thảo
                    </div>
                  </div>

                  {decisionType === 'ASSIGNMENT' && (
                    <>
                      <div>
                        <div className="text-xs text-slate-500">
                          Thời gian bắt đầu
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-800">
                          {selectedProject.startDate || '—'}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">
                          Thời gian kết thúc
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-800">
                          {selectedProject.endDate || '—'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleCreateDraft}
            disabled={!selectedProject || isCreating}
            className="rounded-lg bg-[#0A6EBD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085896] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? 'Đang tạo...' : 'Tạo dự thảo'}
          </button>
        </footer>
      </div>
    </div>
  );
}