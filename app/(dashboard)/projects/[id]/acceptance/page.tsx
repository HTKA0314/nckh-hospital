'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  FileCheck2,
  ListChecks,
  Paperclip,
  Plus,
  Upload,
  X,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import {
  canReviewAcceptanceDossier,
  canSubmitAcceptanceDossier,
} from '@/lib/utils/permissions';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/common/PageHeader';
import {
  AcceptanceDossier,
  AcceptanceDossierStatus,
} from '@/lib/types';

type ChecklistKey = keyof NonNullable<
  AcceptanceDossier['checklistResults']
>;

const CHECKLIST_ITEMS: Array<{
  key: ChecklistKey;
  label: string;
}> = [
  {
    key: 'finalReportSubmitted',
    label: 'Nộp báo cáo tổng kết đề tài',
  },
  {
    key: 'productsCompleted',
    label: 'Bàn giao đầy đủ sản phẩm cam kết',
  },
  {
    key: 'evidenceValid',
    label: 'Đầy đủ minh chứng khoa học',
  },
  {
    key: 'progressReportsCompleted',
    label: 'Hoàn thành các báo cáo tiến độ bắt buộc',
  },
  {
    key: 'noPendingChangeRequests',
    label: 'Không còn yêu cầu điều chỉnh đang xử lý',
  },
  {
    key: 'ethicsValid',
    label: 'Điều kiện đạo đức còn hiệu lực hoặc không áp dụng',
  },
  {
    key: 'financeConditionMet',
    label: 'Đáp ứng điều kiện tài chính theo policy',
  },
  {
    key: 'publicationsIfRequired',
    label: 'Đáp ứng yêu cầu công bố nếu policy bắt buộc',
  },
];

const EMPTY_CHECKLIST: NonNullable<
  AcceptanceDossier['checklistResults']
> = {
  finalReportSubmitted: false,
  productsCompleted: false,
  evidenceValid: false,
  progressReportsCompleted: false,
  noPendingChangeRequests: false,
  ethicsValid: false,
  financeConditionMet: false,
  publicationsIfRequired: false,
};

export default function ProjectAcceptancePage({
  params,
}: {
  params: { id: string };
}) {
  const project = repo.getProjectById(params.id);
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();

  const [dossier, setDossier] = useState<
    AcceptanceDossier | undefined
  >(() => project?.acceptanceDossier);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    productsSummary: '',
    productsCommitted: '',
    productsActual: '',
    claimedOverallCompletionPercentage: 100,
  });
  const [evidenceFile, setEvidenceFile] =
    useState<File | null>(null);

  const [reviewChecklist, setReviewChecklist] = useState<
    NonNullable<AcceptanceDossier['checklistResults']>
  >(() => dossier?.checklistResults || EMPTY_CHECKLIST);

  if (!project) {
    return (
      <div className="mx-auto my-8 max-w-xl rounded-xl border border-slate-200 bg-white py-16 text-center">
        <AlertCircle className="mx-auto mb-2 h-10 w-10 text-slate-400" />
        <h2 className="text-base font-bold text-slate-800">
          Không tìm thấy hồ sơ đề tài
        </h2>
        <Link
          href="/projects"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-1.5 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh mục đề tài
        </Link>
      </div>
    );
  }

  const canSubmit =
    canSubmitAcceptanceDossier(currentUser) &&
    project.status === 'IN_PROGRESS';

  const canReview = canReviewAcceptanceDossier(currentUser);

  const isResubmission =
    dossier?.status === 'REVISION_REQUIRED';

  const checklistAllPassed = useMemo(
    () => Object.values(reviewChecklist).every(Boolean),
    [reviewChecklist]
  );

  const refreshDossierFromRepository = () => {
    const refreshed = repo.getProjectById(project.id);
    setDossier(refreshed?.acceptanceDossier);
  };

  const resetForm = () => {
    setFormData({
      productsSummary: '',
      productsCommitted: '',
      productsActual: '',
      claimedOverallCompletionPercentage: 100,
    });
    setEvidenceFile(null);
  };

  const openSubmissionModal = () => {
    if (dossier && dossier.status === 'REVISION_REQUIRED') {
      setFormData({
        productsSummary: dossier.productsSummary,
        productsCommitted: dossier.productsCommitted,
        productsActual: dossier.productsActual,
        claimedOverallCompletionPercentage:
          dossier.claimedOverallCompletionPercentage ?? 100,
      });
    }
    setShowAddModal(true);
  };

  const handleSubmitDossier = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmitAcceptanceDossier(currentUser)) {
      warning('Bạn không có quyền nộp hồ sơ nghiệm thu.');
      return;
    }

    if (project.status !== 'IN_PROGRESS') {
      warning(
        'Chỉ đề tài đang thực hiện mới được nộp hồ sơ nghiệm thu.'
      );
      return;
    }

    if (
      dossier &&
      dossier.status !== 'REVISION_REQUIRED'
    ) {
      warning(
        'Hồ sơ nghiệm thu đã tồn tại và không ở trạng thái cho phép nộp lại.'
      );
      return;
    }

    if (
      formData.claimedOverallCompletionPercentage < 0 ||
      formData.claimedOverallCompletionPercentage > 100
    ) {
      warning('Tỷ lệ hoàn thành phải nằm trong khoảng 0–100%.');
      return;
    }

    /*
     * Prototype hiện chưa có binary upload service.
     * Chỉ ghi metadata tên file; không tạo URL giả "#".
     */
    const evidenceUrls = evidenceFile
      ? [{ name: evidenceFile.name, url: '' }]
      : [];

    const nextStatus: AcceptanceDossierStatus =
      dossier?.status === 'REVISION_REQUIRED'
        ? 'RESUBMITTED'
        : 'SUBMITTED';

    const nextDossier: AcceptanceDossier = dossier
      ? {
          ...dossier,
          submissionDate: new Date().toISOString(),
          productsSummary: formData.productsSummary.trim(),
          productsCommitted: formData.productsCommitted.trim(),
          productsActual: formData.productsActual.trim(),
          claimedOverallCompletionPercentage:
            Number(
              formData.claimedOverallCompletionPercentage
            ),
          evidenceUrls:
            evidenceUrls.length > 0
              ? evidenceUrls
              : dossier.evidenceUrls,
          status: nextStatus,
          checklistResults: undefined,
        }
      : {
          id: `acc-${Date.now()}`,
          projectId: project.id,
          submissionDate: new Date().toISOString(),
          productsSummary: formData.productsSummary.trim(),
          productsCommitted: formData.productsCommitted.trim(),
          productsActual: formData.productsActual.trim(),
          claimedOverallCompletionPercentage:
            Number(
              formData.claimedOverallCompletionPercentage
            ),
          evidenceUrls,
          status: nextStatus,
        };

    const updatedProject = repo.updateProject(project.id, {
      acceptanceDossier: nextDossier,
      status: 'WAITING_ACCEPTANCE',
    });

    if (!updatedProject) {
      error('Không thể lưu hồ sơ nghiệm thu.');
      return;
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode:
        nextStatus === 'RESUBMITTED'
          ? 'RESUBMIT_ACCEPTANCE_DOSSIER'
          : 'SUBMIT_ACCEPTANCE_DOSSIER',
      entityType: 'ACCEPTANCE',
      entityId: nextDossier.id,
      fromStatus: dossier?.status,
      toStatus: nextStatus,
      notes:
        nextStatus === 'RESUBMITTED'
          ? 'Chủ nhiệm nộp lại hồ sơ nghiệm thu sau yêu cầu bổ sung.'
          : 'Chủ nhiệm nộp hồ sơ nghiệm thu.',
    });

    setDossier(nextDossier);
    setReviewChecklist(EMPTY_CHECKLIST);
    setShowAddModal(false);
    resetForm();

    success(
      nextStatus === 'RESUBMITTED'
        ? 'Đã nộp lại hồ sơ nghiệm thu.'
        : 'Đã nộp hồ sơ nghiệm thu. Chờ Phòng NCKH tiếp nhận.'
    );
  };

  const handleReceiveForReview = () => {
    if (!dossier || !canReview) return;

    if (
      dossier.status !== 'SUBMITTED' &&
      dossier.status !== 'RESUBMITTED'
    ) {
      warning(
        'Chỉ có thể tiếp nhận hồ sơ vừa nộp hoặc nộp lại.'
      );
      return;
    }

    const previousStatus = dossier.status;
    const updatedDossier: AcceptanceDossier = {
      ...dossier,
      status: 'UNDER_ADMIN_REVIEW',
    };

    const updatedProject = repo.updateProject(project.id, {
      acceptanceDossier: updatedDossier,
    });

    if (!updatedProject) {
      error('Không thể tiếp nhận hồ sơ nghiệm thu.');
      return;
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'RECEIVE_ACCEPTANCE_DOSSIER',
      entityType: 'ACCEPTANCE',
      entityId: dossier.id,
      fromStatus: previousStatus,
      toStatus: 'UNDER_ADMIN_REVIEW',
      notes:
        'Phòng NCKH tiếp nhận hồ sơ và bắt đầu kiểm tra điều kiện nghiệm thu.',
    });

    setDossier(updatedDossier);
    success('Đã tiếp nhận hồ sơ nghiệm thu.');
  };

  const handleVerifyChecklist = (
    status:
      | 'ELIGIBLE_FOR_ACCEPTANCE'
      | 'REVISION_REQUIRED'
  ) => {
    if (!dossier || !canReview) return;

    if (dossier.status !== 'UNDER_ADMIN_REVIEW') {
      warning(
        'Hồ sơ phải ở trạng thái đang kiểm tra hành chính.'
      );
      return;
    }

    if (
      status === 'ELIGIBLE_FOR_ACCEPTANCE' &&
      !checklistAllPassed
    ) {
      warning(
        'Chưa thể xác nhận đủ điều kiện vì checklist còn mục chưa đạt.'
      );
      return;
    }

    confirm({
      title:
        status === 'ELIGIBLE_FOR_ACCEPTANCE'
          ? 'Xác nhận đủ điều kiện nghiệm thu'
          : 'Yêu cầu bổ sung hồ sơ',
      message:
        status === 'ELIGIBLE_FOR_ACCEPTANCE'
          ? 'Xác nhận hồ sơ đã đáp ứng các điều kiện hành chính để chuyển bước tổ chức Hội đồng nghiệm thu?'
          : 'Xác nhận trả hồ sơ cho Chủ nhiệm để bổ sung?',
      confirmLabel: 'Xác nhận',
      type:
        status === 'ELIGIBLE_FOR_ACCEPTANCE'
          ? 'info'
          : 'warning',
      onConfirm: () => {
        const updatedDossier: AcceptanceDossier = {
          ...dossier,
          status,
          checklistResults: {
            ...reviewChecklist,
          },
        };

        const updatedProject = repo.updateProject(project.id, {
          acceptanceDossier: updatedDossier,
        });

        if (!updatedProject) {
          error('Không thể cập nhật kết quả kiểm tra hồ sơ.');
          return;
        }

        repo.addAuditLog({
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          actionCode:
            status === 'ELIGIBLE_FOR_ACCEPTANCE'
              ? 'ACCEPTANCE_DOSSIER_VALIDATED'
              : 'ACCEPTANCE_DOSSIER_REVISION_REQUIRED',
          entityType: 'ACCEPTANCE',
          entityId: dossier.id,
          fromStatus: dossier.status,
          toStatus: status,
          notes:
            status === 'ELIGIBLE_FOR_ACCEPTANCE'
              ? 'Hồ sơ đủ điều kiện chuyển bước tổ chức Hội đồng nghiệm thu.'
              : 'Hồ sơ cần Chủ nhiệm bổ sung trước khi tiếp tục.',
        });

        setDossier(updatedDossier);

        if (status === 'ELIGIBLE_FOR_ACCEPTANCE') {
          success(
            'Đã xác nhận hồ sơ đủ điều kiện nghiệm thu.'
          );
        } else {
          warning(
            'Đã chuyển hồ sơ về trạng thái cần bổ sung.'
          );
        }
      },
    });
  };

  const handleForwardToCouncil = () => {
    if (!dossier || !canReview) return;

    if (dossier.status !== 'ELIGIBLE_FOR_ACCEPTANCE') {
      warning(
        'Chỉ hồ sơ đã đủ điều kiện mới được chuyển Hội đồng nghiệm thu.'
      );
      return;
    }

    confirm({
      title: 'Chuyển Hội đồng nghiệm thu',
      message:
        'Xác nhận chuyển hồ sơ sang workspace Quản lý Hội đồng để tổ chức nghiệm thu?',
      confirmLabel: 'Chuyển Hội đồng',
      type: 'info',
      onConfirm: () => {
        const updatedDossier: AcceptanceDossier = {
          ...dossier,
          status: 'FORWARDED_TO_COUNCIL',
        };

        const updatedProject = repo.updateProject(project.id, {
          acceptanceDossier: updatedDossier,
        });

        if (!updatedProject) {
          error('Không thể chuyển hồ sơ sang Hội đồng.');
          return;
        }

        repo.addAuditLog({
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          actionCode:
            'ACCEPTANCE_DOSSIER_FORWARDED_TO_COUNCIL',
          entityType: 'ACCEPTANCE',
          entityId: dossier.id,
          fromStatus: dossier.status,
          toStatus: 'FORWARDED_TO_COUNCIL',
          notes:
            'Hồ sơ nghiệm thu đã được chuyển sang bước tổ chức Hội đồng.',
        });

        setDossier(updatedDossier);
        success(
          'Đã chuyển hồ sơ sang bước tổ chức Hội đồng nghiệm thu.'
        );
      },
    });
  };

  const getDossierStatusBadge = (
    status?: AcceptanceDossierStatus
  ) => {
    const className =
      'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold';

    switch (status) {
      case 'DRAFT':
        return (
          <span
            className={`${className} border-slate-200 bg-slate-100 text-slate-800`}
          >
            Dự thảo
          </span>
        );
      case 'SUBMITTED':
        return (
          <span
            className={`${className} border-amber-200 bg-amber-50 text-amber-800`}
          >
            Chờ tiếp nhận
          </span>
        );
      case 'RESUBMITTED':
        return (
          <span
            className={`${className} border-amber-200 bg-amber-50 text-amber-800`}
          >
            Đã nộp lại
          </span>
        );
      case 'UNDER_ADMIN_REVIEW':
        return (
          <span
            className={`${className} border-blue-200 bg-blue-50 text-blue-800`}
          >
            Đang kiểm tra hồ sơ
          </span>
        );
      case 'REVISION_REQUIRED':
        return (
          <span
            className={`${className} border-rose-200 bg-rose-50 text-rose-800`}
          >
            Cần bổ sung
          </span>
        );
      case 'ELIGIBLE_FOR_ACCEPTANCE':
        return (
          <span
            className={`${className} border-sky-200 bg-sky-50 text-[#0A6EBD]`}
          >
            Đủ điều kiện nghiệm thu
          </span>
        );
      case 'FORWARDED_TO_COUNCIL':
        return (
          <span
            className={`${className} border-violet-200 bg-violet-50 text-violet-800`}
          >
            Đã chuyển Hội đồng
          </span>
        );
      default:
        return (
          <span
            className={`${className} border-slate-200 bg-slate-100 text-slate-600`}
          >
            Chưa nộp
          </span>
        );
    }
  };

  const currentChecklist =
    dossier?.checklistResults || reviewChecklist;

  return (
    <div className="w-full space-y-4 pb-12 text-slate-800">
      <PageHeader
        title="Hồ sơ Nghiệm thu Đề tài"
        description={`Mã đề tài: ${
          project.projectCode || project.proposalCode
        } • ${project.title}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại đề tài
            </Link>

            {canSubmit && !dossier && (
              <button
                type="button"
                onClick={openSubmissionModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#085896]"
              >
                <Plus className="h-4 w-4" />
                Nộp hồ sơ nghiệm thu
              </button>
            )}

            {canSubmit && isResubmission && (
              <button
                type="button"
                onClick={openSubmissionModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#085896]"
              >
                <Upload className="h-4 w-4" />
                Nộp lại hồ sơ
              </button>
            )}

            {canReview &&
              (dossier?.status === 'SUBMITTED' ||
                dossier?.status === 'RESUBMITTED') && (
                <button
                  type="button"
                  onClick={handleReceiveForReview}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#085896]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Tiếp nhận hồ sơ
                </button>
              )}

            {canReview &&
              dossier?.status === 'UNDER_ADMIN_REVIEW' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleVerifyChecklist(
                        'REVISION_REQUIRED'
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
                  >
                    <X className="h-4 w-4" />
                    Yêu cầu bổ sung
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleVerifyChecklist(
                        'ELIGIBLE_FOR_ACCEPTANCE'
                      )
                    }
                    disabled={!checklistAllPassed}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Xác nhận hợp lệ
                  </button>
                </>
              )}

            {canReview &&
              dossier?.status ===
                'ELIGIBLE_FOR_ACCEPTANCE' && (
                <button
                  type="button"
                  onClick={handleForwardToCouncil}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Chuyển Hội đồng nghiệm thu
                </button>
              )}
          </div>
        }
      />

      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Trạng thái hồ sơ nghiệm thu
          </span>
          {getDossierStatusBadge(dossier?.status)}
        </div>

        <div className="flex flex-col items-start md:items-end">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Tỷ lệ hoàn thành do Chủ nhiệm khai báo
          </span>
          {dossier ? (
            <strong className="font-mono text-2xl font-extrabold text-[#0A6EBD]">
              {dossier.claimedOverallCompletionPercentage ??
                '—'}
              {dossier.claimedOverallCompletionPercentage !==
              undefined
                ? '%'
                : ''}
            </strong>
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              Chưa khai báo
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-5 lg:col-span-2">
          <h3 className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-slate-900">
            <FileCheck2 className="h-4 w-4 text-slate-500" />
            Đối chiếu sản phẩm khoa học bàn giao
          </h3>

          {dossier ? (
            <div className="space-y-4 text-xs font-medium">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <span className="mb-1 block font-semibold text-slate-500">
                  Sản phẩm cam kết trong đề cương
                </span>
                <p className="font-bold leading-relaxed text-slate-900">
                  {dossier.productsCommitted}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5">
                <span className="mb-1 block font-bold text-emerald-800">
                  Sản phẩm thực tế bàn giao
                </span>
                <p className="font-bold leading-relaxed text-slate-900">
                  {dossier.productsActual}
                </p>
              </div>

              {dossier.productsSummary && (
                <div>
                  <span className="mb-1 block font-semibold text-slate-500">
                    Tóm tắt kết quả
                  </span>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-semibold leading-relaxed text-slate-600">
                    {dossier.productsSummary}
                  </p>
                </div>
              )}

              {dossier.evidenceUrls.length > 0 && (
                <div className="pt-2">
                  <span className="mb-1 block font-semibold text-slate-500">
                    Tài liệu / Minh chứng
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {dossier.evidenceUrls.map(
                      (file, index) => (
                        <span
                          key={`${file.name}-${index}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                          {file.name}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-slate-400">
                <FileCheck2 className="h-8 w-8" />
              </div>
              <h4 className="mb-1 text-xs font-bold text-slate-800">
                Chưa nộp Hồ sơ Nghiệm thu
              </h4>
              <p className="max-w-xs text-xs leading-relaxed text-slate-500">
                Chủ nhiệm nộp hồ sơ nghiệm thu khi đề tài đã
                hoàn thành nội dung nghiên cứu và đủ điều kiện
                theo policy áp dụng.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-5">
          <h3 className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-slate-900">
            <ListChecks className="h-4 w-4 text-slate-500" />
            Checklist điều kiện nghiệm thu
          </h3>

          {!dossier ? (
            <p className="text-xs text-slate-500">
              Checklist được Phòng NCKH kiểm tra sau khi tiếp
              nhận hồ sơ.
            </p>
          ) : (
            <div className="space-y-3">
              {CHECKLIST_ITEMS.map((item) => {
                const editable =
                  canReview &&
                  dossier.status ===
                    'UNDER_ADMIN_REVIEW';

                const value = editable
                  ? reviewChecklist[item.key]
                  : currentChecklist[item.key];

                return (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-3 text-xs font-semibold"
                  >
                    <span className="leading-snug text-slate-600">
                      {item.label}
                    </span>

                    {editable ? (
                      <button
                        type="button"
                        onClick={() =>
                          setReviewChecklist((current) => ({
                            ...current,
                            [item.key]:
                              !current[item.key],
                          }))
                        }
                        className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${
                          value
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-slate-300 bg-white text-slate-500'
                        }`}
                      >
                        {value ? 'ĐẠT' : 'CHƯA'}
                      </button>
                    ) : (
                      <span
                        className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${
                          value
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-slate-50 text-slate-400'
                        }`}
                      >
                        {value ? 'ĐẠT' : 'CHƯA'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white text-xs shadow-2xl">
            <form onSubmit={handleSubmitDossier}>
              <div className="flex items-center justify-between border-b border-slate-100 bg-[#0B2A63] px-5 py-4 text-white">
                <h3 className="text-sm font-bold">
                  {isResubmission
                    ? 'Nộp lại Hồ sơ Nghiệm thu'
                    : 'Nộp Hồ sơ Nghiệm thu đề tài'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[75vh] space-y-3.5 overflow-y-auto p-5">
                <Field
                  label="Sản phẩm cam kết (theo đề cương)"
                  value={formData.productsCommitted}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      productsCommitted: value,
                    })
                  }
                />

                <Field
                  label="Sản phẩm thực tế bàn giao"
                  value={formData.productsActual}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      productsActual: value,
                    })
                  }
                />

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    % hoàn thành do Chủ nhiệm khai báo
                  </label>
                  <input
                    type="number"
                    max={100}
                    min={0}
                    required
                    value={
                      formData.claimedOverallCompletionPercentage
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        claimedOverallCompletionPercentage:
                          Number(event.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 p-2 font-mono text-xs outline-none focus:border-[#0A6EBD]"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    File báo cáo/minh chứng (.docx, .pdf)
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      onChange={(event) =>
                        setEvidenceFile(
                          event.target.files?.[0] || null
                        )
                      }
                      className="hidden"
                      id="evidence-upload"
                    />

                    <label
                      htmlFor="evidence-upload"
                      className="cursor-pointer rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      <Upload className="mr-1 inline h-3.5 w-3.5" />
                      Chọn file
                    </label>

                    <span className="max-w-[200px] truncate text-slate-500">
                      {evidenceFile
                        ? evidenceFile.name
                        : 'Chưa chọn file'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Tóm tắt kết quả khoa học đạt được
                  </label>
                  <textarea
                    rows={3}
                    value={formData.productsSummary}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        productsSummary: event.target.value,
                      })
                    }
                    className="w-full resize-none rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus:border-[#0A6EBD]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#0A6EBD] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#085896]"
                >
                  {isResubmission
                    ? 'Nộp lại hồ sơ'
                    : 'Nộp hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block font-bold text-slate-700">
        {label} *
      </label>
      <input
        type="text"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-[#0A6EBD]"
      />
    </div>
  );
}