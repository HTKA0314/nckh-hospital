'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';

type ChecklistKey = keyof NonNullable<
  AcceptanceDossier['checklistResults']
>;

const CHECKLIST_ITEMS: Array<{
  key: ChecklistKey;
  label: string;
}> = [
  {
    key: 'finalReportSubmitted',
    label: 'Nộp báo cáo tổng kết đề tài (Bản hoàn chỉnh)',
  },
  {
    key: 'productsCompleted',
    label: 'Đã nộp đầy đủ hồ sơ/sản phẩm bàn giao theo cam kết trong đề cương',
  },
  {
    key: 'evidenceValid',
    label: 'Đã nộp tài liệu/minh chứng kết quả nghiên cứu theo hồ sơ yêu cầu',
  },
  {
    key: 'progressReportsCompleted',
    label: 'Hoàn thành các báo cáo tiến độ định kỳ bắt buộc',
  },
  {
    key: 'noPendingChangeRequests',
    label: 'Không còn yêu cầu gia hạn / điều chỉnh đang chờ xử lý',
  },
  {
    key: 'ethicsValid',
    label: 'Đã hoàn tất yêu cầu đạo đức nghiên cứu theo hồ sơ được phê duyệt',
  },
  {
    key: 'financeConditionMet',
    label: 'Đã hoàn thành nghĩa vụ/hồ sơ tài chính theo quy định của đề tài',
  },
  {
    key: 'publicationsIfRequired',
    label: 'Đã nộp minh chứng công bố khoa học nếu đề cương có yêu cầu',
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
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [dossier, setDossier] = useState<AcceptanceDossier | undefined>(undefined);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    productsSummary: '',
    productsCommitted: '',
    productsActual: '',
    claimedOverallCompletionPercentage: 100,
  });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  const [reviewChecklist, setReviewChecklist] = useState<
    NonNullable<AcceptanceDossier['checklistResults']>
  >(EMPTY_CHECKLIST);

  useEffect(() => {
    setIsMounted(true);
    const p = repo.getProjectById(params.id);
    if (p && p.acceptanceDossier) {
      setDossier(p.acceptanceDossier);
      if (p.acceptanceDossier.checklistResults) {
        setReviewChecklist(p.acceptanceDossier.checklistResults);
      }
    }
  }, [params.id]);

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500 text-xs font-medium">Đang tải hồ sơ nghiệm thu đề tài...</div>;
  }

  const project = repo.getProjectById(params.id);

  if (!project) {
    return (
      <div className="mx-auto my-8 max-w-xl rounded-xl border border-slate-200 bg-white py-16 text-center shadow-2xs text-xs">
        <AlertCircle className="mx-auto mb-2 h-10 w-10 text-slate-400" />
        <h2 className="text-base font-bold text-slate-800">
          Không tìm thấy hồ sơ đề tài
        </h2>
        <Link
          href="/projects"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#085896] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh mục đề tài
        </Link>
      </div>
    );
  }

  const canCreateAcceptanceDossier =
    canSubmitAcceptanceDossier(currentUser) &&
    project.status === 'IN_PROGRESS' &&
    !dossier;

  const canResubmitAcceptanceDossier =
    canSubmitAcceptanceDossier(currentUser) &&
    project.status === 'WAITING_ACCEPTANCE' &&
    dossier?.status === 'REVISION_REQUIRED';

  const canReview = canReviewAcceptanceDossier(currentUser);
  const isResubmission = dossier?.status === 'REVISION_REQUIRED';

  // Đề tài không yêu cầu đạo đức thì tiêu chí ethics được xem là N/A,
  // không làm cản trở điều kiện chuyển Hội đồng nghiệm thu.
  const effectiveChecklist = {
    ...reviewChecklist,
    ethicsValid: project.ethicsRequired ? reviewChecklist.ethicsValid : true,
  };

  const checklistAllPassed = Object.values(effectiveChecklist).every(Boolean);

  const resetForm = () => {
    setFormData({
      productsSummary: '',
      productsCommitted: '',
      productsActual: '',
      claimedOverallCompletionPercentage: 100,
    });
    setEvidenceFiles([]);
  };

  const openSubmissionModal = () => {
    const committedProducts =
      dossier?.productsCommitted ||
      project.expectedProducts ||
      'Theo sản phẩm/kết quả đầu ra trong đề cương đã được phê duyệt';

    setFormData({
      productsSummary: dossier?.productsSummary || '',
      productsCommitted: committedProducts,
      productsActual: dossier?.productsActual || '',
      claimedOverallCompletionPercentage:
        dossier?.claimedOverallCompletionPercentage ?? 100,
    });
    setEvidenceFiles([]);
    setShowAddModal(true);
  };

  const handleSubmitDossier = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmitAcceptanceDossier(currentUser)) {
      warning('Bạn không có quyền nộp hồ sơ nghiệm thu.');
      return;
    }

    const isFirstSubmission = project.status === 'IN_PROGRESS' && !dossier;
    const isValidResubmission =
      project.status === 'WAITING_ACCEPTANCE' &&
      dossier?.status === 'REVISION_REQUIRED';

    if (!isFirstSubmission && !isValidResubmission) {
      warning('Hồ sơ nghiệm thu không ở trạng thái cho phép nộp hoặc nộp lại.');
      return;
    }

    if (
      formData.claimedOverallCompletionPercentage < 0 ||
      formData.claimedOverallCompletionPercentage > 100
    ) {
      warning('Tỷ lệ hoàn thành phải nằm trong khoảng 0–100%.');
      return;
    }

    if (!formData.productsActual.trim()) {
      warning('Vui lòng nhập sản phẩm/kết quả thực tế bàn giao.');
      return;
    }

    if (!isResubmission && evidenceFiles.length === 0) {
      warning('Vui lòng đính kèm ít nhất một tệp báo cáo tổng kết hoặc minh chứng nghiệm thu.');
      return;
    }

    // Prototype hiện chưa có dịch vụ lưu tệp. Giữ metadata tên tệp để không
    // giả lập một URL tải xuống không tồn tại. Khi tích hợp storage, thay url rỗng
    // bằng URL thực do dịch vụ upload trả về.
    const newlySelectedEvidence = evidenceFiles.map((file) => ({
      name: file.name,
      url: '',
    }));
    const evidenceUrls = newlySelectedEvidence.length > 0
      ? [...(dossier?.evidenceUrls || []), ...newlySelectedEvidence]
      : dossier?.evidenceUrls || [];

    const nextStatus: AcceptanceDossierStatus =
      dossier?.status === 'REVISION_REQUIRED'
        ? 'RESUBMITTED'
        : 'SUBMITTED';

    const nextDossier: AcceptanceDossier = {
      id: dossier?.id || `acc-${Date.now()}`,
      projectId: project.id,
      submissionDate: new Date().toISOString(),
      productsSummary: formData.productsSummary.trim(),
      productsCommitted: formData.productsCommitted.trim(),
      productsActual: formData.productsActual.trim() || 'Báo cáo kết quả và bộ số liệu phân tích',
      claimedOverallCompletionPercentage: Number(formData.claimedOverallCompletionPercentage),
      evidenceUrls,
      status: nextStatus,
      checklistResults: undefined,
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
        ? 'Đã nộp lại hồ sơ nghiệm thu thành công.'
        : 'Đã nộp hồ sơ nghiệm thu. Chờ Phòng Quản lý NCKH tiếp nhận.'
    );
  };

  const handleReceiveForReview = () => {
    if (!dossier || !canReview) return;
    if (!['SUBMITTED', 'RESUBMITTED'].includes(dossier.status)) {
      warning('Hồ sơ không ở trạng thái chờ tiếp nhận.');
      return;
    }

    const previousStatus = dossier.status;
    const updatedDossier: AcceptanceDossier = {
      ...dossier,
      status: 'UNDER_ADMIN_REVIEW',
    };

    repo.updateProject(project.id, {
      acceptanceDossier: updatedDossier,
    });

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'RECEIVE_ACCEPTANCE_DOSSIER',
      entityType: 'ACCEPTANCE',
      entityId: dossier.id,
      fromStatus: previousStatus,
      toStatus: 'UNDER_ADMIN_REVIEW',
      notes: 'Phòng NCKH tiếp nhận hồ sơ và bắt đầu kiểm tra điều kiện nghiệm thu.',
    });

    setDossier(updatedDossier);
    success('Đã tiếp nhận hồ sơ nghiệm thu để kiểm tra hành chính.');
  };

  const handleVerifyChecklist = (
    status: 'ELIGIBLE_FOR_ACCEPTANCE' | 'REVISION_REQUIRED'
  ) => {
    if (!dossier || !canReview) return;
    if (dossier.status !== 'UNDER_ADMIN_REVIEW') {
      warning('Chỉ hồ sơ đang được kiểm tra mới có thể xác nhận kết quả rà soát.');
      return;
    }

    if (status === 'ELIGIBLE_FOR_ACCEPTANCE' && !checklistAllPassed) {
      warning('Chưa thể xác nhận đủ điều kiện vì checklist còn mục chưa đạt.');
      return;
    }

    if (status === 'REVISION_REQUIRED') {
      setRevisionNotes('');
      setShowRevisionModal(true);
      return;
    }

    confirm({
      title:
        status === 'ELIGIBLE_FOR_ACCEPTANCE'
          ? 'Xác nhận đủ điều kiện nghiệm thu'
          : 'Yêu cầu bổ sung hồ sơ',
      message:
        status === 'ELIGIBLE_FOR_ACCEPTANCE'
          ? 'Xác nhận hồ sơ đã đáp ứng đầy đủ điều kiện hành chính để chuyển sang bước tổ chức Hội đồng nghiệm thu?'
          : 'Xác nhận trả hồ sơ cho Chủ nhiệm đề tài để hoàn thiện bổ sung?',
      confirmLabel: 'Xác nhận',
      type: status === 'ELIGIBLE_FOR_ACCEPTANCE' ? 'info' : 'warning',
      onConfirm: () => {
        const updatedDossier: AcceptanceDossier = {
          ...dossier,
          status,
          checklistResults: { ...reviewChecklist },
        };

        repo.updateProject(project.id, {
          acceptanceDossier: updatedDossier,
        });

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
          success('Đã xác nhận hồ sơ đủ điều kiện nghiệm thu.');
        } else {
          warning('Đã chuyển hồ sơ về trạng thái cần bổ sung.');
        }
      },
    });
  };

  const handleSubmitRevisionRequest = () => {
    if (!dossier || !canReview) return;
    if (dossier.status !== 'UNDER_ADMIN_REVIEW') {
      warning('Chỉ hồ sơ đang được kiểm tra mới có thể yêu cầu bổ sung.');
      return;
    }

    const failedItems = CHECKLIST_ITEMS.filter((item) => {
      if (item.key === 'ethicsValid' && !project.ethicsRequired) return false;
      return !reviewChecklist[item.key];
    }).map((item) => item.label);

    if (failedItems.length === 0 && !revisionNotes.trim()) {
      warning('Vui lòng ghi rõ nội dung cần Chủ nhiệm bổ sung.');
      return;
    }

    const notes = [
      failedItems.length > 0
        ? `Các nội dung chưa đạt: ${failedItems.join('; ')}.`
        : '',
      revisionNotes.trim(),
    ]
      .filter(Boolean)
      .join(' ');

    const updatedDossier: AcceptanceDossier = {
      ...dossier,
      status: 'REVISION_REQUIRED',
      checklistResults: { ...reviewChecklist },
    };

    const updated = repo.updateProject(project.id, {
      acceptanceDossier: updatedDossier,
    });

    if (!updated) {
      error('Không thể cập nhật yêu cầu bổ sung hồ sơ nghiệm thu.');
      return;
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'ACCEPTANCE_DOSSIER_REVISION_REQUIRED',
      entityType: 'ACCEPTANCE',
      entityId: dossier.id,
      fromStatus: dossier.status,
      toStatus: 'REVISION_REQUIRED',
      notes,
    });

    setDossier(updatedDossier);
    setShowRevisionModal(false);
    setRevisionNotes('');
    warning('Đã gửi yêu cầu bổ sung hồ sơ nghiệm thu cho Chủ nhiệm đề tài.');
  };

  const handleForwardToCouncil = () => {
    if (!dossier || !canReview) return;
    if (dossier.status !== 'ELIGIBLE_FOR_ACCEPTANCE') {
      warning('Chỉ hồ sơ đã được xác nhận đủ điều kiện nghiệm thu mới được chuyển sang Hội đồng.');
      return;
    }

    confirm({
      title: 'Chuyển bước tổ chức Hội đồng',
      message: 'Xác nhận chuyển hồ sơ sang module Quản lý Hội đồng để tổ chức phiên họp nghiệm thu?',
      confirmLabel: 'Xác nhận chuyển bước',
      type: 'info',
      onConfirm: () => {
        const updatedDossier: AcceptanceDossier = {
          ...dossier,
          status: 'FORWARDED_TO_COUNCIL',
        };

        repo.updateProject(project.id, {
          acceptanceDossier: updatedDossier,
        });

        repo.addAuditLog({
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          actionCode: 'ACCEPTANCE_DOSSIER_FORWARDED_TO_COUNCIL',
          entityType: 'ACCEPTANCE',
          entityId: dossier.id,
          fromStatus: dossier.status,
          toStatus: 'FORWARDED_TO_COUNCIL',
          notes: 'Hồ sơ nghiệm thu đã được chuyển sang bước tổ chức Hội đồng.',
        });

        setDossier(updatedDossier);
        success('Đã chuyển hồ sơ sang bước tổ chức Hội đồng nghiệm thu.');
      },
    });
  };

  const currentAcceptanceEvaluation = project.acceptanceEvaluations?.slice().reverse()[0];



  const currentChecklist = dossier?.checklistResults || reviewChecklist;

  return (
    <div className="w-full space-y-4 pb-16 text-slate-800 text-xs">
      <PageHeader
        title="Hồ sơ Nghiệm thu Đề tài"
        description={`Mã đề tài: ${project.projectCode || project.proposalCode} • ${project.title}`}
        actions={
          <div className="flex flex-wrap items-center gap-2 select-none">
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Chi tiết đề tài
            </Link>

            {canCreateAcceptanceDossier && (
              <button
                type="button"
                onClick={openSubmissionModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#085896] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Nộp hồ sơ nghiệm thu
              </button>
            )}

            {canResubmitAcceptanceDossier && (
              <button
                type="button"
                onClick={openSubmissionModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#085896] cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" /> Nộp lại hồ sơ
              </button>
            )}

            {canReview && (dossier?.status === 'SUBMITTED' || dossier?.status === 'RESUBMITTED') && (
              <button
                type="button"
                onClick={handleReceiveForReview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#085896] cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Tiếp nhận hồ sơ
              </button>
            )}

            {canReview && dossier?.status === 'UNDER_ADMIN_REVIEW' && (
              <>
                <button
                  type="button"
                  onClick={() => handleVerifyChecklist('REVISION_REQUIRED')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-rose-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Yêu cầu bổ sung
                </button>

                <button
                  type="button"
                  onClick={() => handleVerifyChecklist('ELIGIBLE_FOR_ACCEPTANCE')}
                  disabled={!checklistAllPassed}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> Xác nhận đủ điều kiện
                </button>
              </>
            )}

            {canReview && dossier?.status === 'ELIGIBLE_FOR_ACCEPTANCE' && (
              <button
                type="button"
                onClick={handleForwardToCouncil}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-violet-700 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Chuyển bước tổ chức Hội đồng
              </button>
            )}
          </div>
        }
      />

      {/* ── STATUS CARD ── */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs md:flex-row md:items-center">
        <div className="space-y-1">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Trạng thái hồ sơ nghiệm thu
          </span>
          <StatusBadge status={dossier?.status || 'NOT_SUBMITTED'} type="ACCEPTANCE" />
        </div>

        <div className="flex flex-col items-start md:items-end">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Tỷ lệ hoàn thành do Chủ nhiệm tự đánh giá
          </span>
          {dossier ? (
            <strong className="font-mono text-2xl font-extrabold text-[#0A6EBD]">
              {dossier.claimedOverallCompletionPercentage ?? '100'}%
            </strong>
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              Chưa nộp
            </span>
          )}
        </div>
      </div>

      {currentAcceptanceEvaluation && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Kết quả Hội đồng nghiệm thu</span>
              <div className="mt-1 text-sm font-bold text-slate-900">
                {currentAcceptanceEvaluation.conclusion === 'ACCEPTED'
                  ? 'Đạt nghiệm thu'
                  : currentAcceptanceEvaluation.conclusion === 'CONDITIONALLY_ACCEPTED'
                    ? 'Đạt có điều kiện'
                    : 'Không đạt nghiệm thu'}
              </div>
            </div>
            <div className="text-left md:text-right">
              {currentAcceptanceEvaluation.ratingLabel && (
                <div className="font-semibold text-slate-700">Xếp loại: {currentAcceptanceEvaluation.ratingLabel}</div>
              )}
              {typeof currentAcceptanceEvaluation.scoreTotal === 'number' && (
                <div className="font-mono text-xs text-slate-500">Điểm tổng hợp: {currentAcceptanceEvaluation.scoreTotal}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* CỘT TRÁI: ĐỐI CHIẾU SẢN PHẨM BÀN GIAO */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-2">
          <h3 className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-slate-900 select-none">
            <FileCheck2 className="h-4 w-4 text-[#0A6EBD]" />
            Đối chiếu sản phẩm khoa học bàn giao
          </h3>

          {dossier ? (
            <div className="space-y-4 text-xs font-medium">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <span className="mb-1 block font-bold text-slate-500 uppercase text-[10px]">
                  Sản phẩm cam kết trong đề cương ban đầu
                </span>
                <p className="font-bold leading-relaxed text-slate-900">
                  {dossier.productsCommitted}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5">
                <span className="mb-1 block font-bold text-emerald-800 uppercase text-[10px]">
                  Sản phẩm thực tế bàn giao nghiệm thu
                </span>
                <p className="font-bold leading-relaxed text-slate-900">
                  {dossier.productsActual}
                </p>
              </div>

              {dossier.productsSummary && (
                <div>
                  <span className="mb-1 block font-bold text-slate-700">
                    Tóm tắt kết quả nghiên cứu & Giá trị ứng dụng
                  </span>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 leading-relaxed text-slate-700 font-medium">
                    {dossier.productsSummary}
                  </p>
                </div>
              )}

              {dossier.evidenceUrls && dossier.evidenceUrls.length > 0 && (
                <div className="pt-2">
                  <span className="mb-1.5 block font-bold text-slate-700">
                    Tài liệu báo cáo & Minh chứng khoa học đã nộp
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {dossier.evidenceUrls.map((file, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        {file.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-slate-400">
                <FileCheck2 className="h-8 w-8 text-slate-300" />
              </div>
              <h4 className="mb-1 text-xs font-bold text-slate-800">
                Chưa nộp Hồ sơ Nghiệm thu
              </h4>
              <p className="max-w-xs text-xs leading-relaxed text-slate-500">
                Chủ nhiệm nộp hồ sơ nghiệm thu khi đề tài đã hoàn thành nghiên cứu và sẵn sàng báo cáo trước Hội đồng.
              </p>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: CHECKLIST 8 TIÊU CHÍ HÀNH CHÍNH */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h3 className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-slate-900 select-none">
            <ListChecks className="h-4 w-4 text-[#0A6EBD]" />
            Checklist kiểm tra điều kiện nghiệm thu
          </h3>

          {!dossier ? (
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Checklist sẽ được Phòng Quản lý NCKH đối soát và kiểm tra ngay sau khi tiếp nhận hồ sơ từ Chủ nhiệm.
            </p>
          ) : (
            <div className="space-y-2.5">
              {CHECKLIST_ITEMS.map((item) => {
                const isNotApplicable =
                  item.key === 'ethicsValid' && !project.ethicsRequired;
                const editable =
                  canReview &&
                  dossier.status === 'UNDER_ADMIN_REVIEW' &&
                  !isNotApplicable;

                const value = isNotApplicable
                  ? true
                  : editable
                  ? reviewChecklist[item.key]
                  : currentChecklist[item.key];

                return (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-3 text-xs font-medium p-1.5 rounded-lg hover:bg-slate-50 transition"
                  >
                    <span className="leading-snug text-slate-700">
                      {item.label}
                    </span>

                    {isNotApplicable ? (
                      <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        N/A
                      </span>
                    ) : editable ? (
                      <button
                        type="button"
                        onClick={() =>
                          setReviewChecklist((current) => ({
                            ...current,
                            [item.key]: !current[item.key],
                          }))
                        }
                        className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold cursor-pointer transition ${
                          value
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
                        }`}
                      >
                        {value ? 'ĐẠT' : 'CHƯA'}
                      </button>
                    ) : (
                      <span
                        className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${
                          value
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
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

      {/* ── MODAL YÊU CẦU BỔ SUNG ── */}
      {showRevisionModal && dossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white text-xs shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 bg-rose-700 px-5 py-3.5 text-white">
              <div>
                <h3 className="text-sm font-bold">Yêu cầu bổ sung hồ sơ nghiệm thu</h3>
                <p className="mt-0.5 text-[11px] text-white/80">{project.projectCode || project.proposalCode} • {project.title}</p>
              </div>
              <button type="button" onClick={() => setShowRevisionModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <span className="mb-2 block font-bold text-slate-800">Các tiêu chí chưa đạt</span>
                <div className="space-y-1.5 rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                  {CHECKLIST_ITEMS.filter((item) => {
                    if (item.key === 'ethicsValid' && !project.ethicsRequired) return false;
                    return !reviewChecklist[item.key];
                  }).length === 0 ? (
                    <p className="text-slate-500">Chưa đánh dấu tiêu chí chưa đạt; cần ghi rõ lý do bổ sung bên dưới.</p>
                  ) : (
                    CHECKLIST_ITEMS.filter((item) => {
                      if (item.key === 'ethicsValid' && !project.ethicsRequired) return false;
                      return !reviewChecklist[item.key];
                    }).map((item) => (
                      <div key={item.key} className="flex items-start gap-2 text-rose-900">
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span className="font-medium leading-snug">{item.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Nội dung hướng dẫn bổ sung</label>
                <textarea
                  rows={4}
                  value={revisionNotes}
                  onChange={(event) => setRevisionNotes(event.target.value)}
                  placeholder="Nêu rõ tài liệu, nội dung hoặc minh chứng Chủ nhiệm cần bổ sung/chỉnh sửa..."
                  className="w-full resize-none rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-[#0A6EBD]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
              <button type="button" onClick={() => setShowRevisionModal(false)} className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
                Hủy
              </button>
              <button type="button" onClick={handleSubmitRevisionRequest} className="rounded-lg bg-rose-700 px-4 py-1.5 font-bold text-white shadow-2xs hover:bg-rose-800 cursor-pointer">
                Gửi yêu cầu bổ sung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NỘP HỒ SƠ NGHIỆM THU ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white text-xs shadow-2xl animate-in zoom-in-95 duration-150">
            <form onSubmit={handleSubmitDossier}>
              <div className="flex items-center justify-between border-b border-slate-100 bg-[#0B2A63] px-5 py-3.5 text-white">
                <h3 className="text-sm font-bold">
                  {isResubmission ? 'Nộp lại Hồ sơ Nghiệm thu' : 'Nộp Hồ sơ Nghiệm thu đề tài'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[75vh] space-y-3.5 overflow-y-auto p-5">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Sản phẩm/kết quả đầu ra cam kết theo đề cương đã phê duyệt
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold leading-relaxed text-slate-700">
                    {formData.productsCommitted}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Nội dung này được lấy từ hồ sơ đề cương, không chỉnh sửa tại bước nghiệm thu.
                  </p>
                </div>

                <Field
                  label="Sản phẩm thực tế bàn giao"
                  value={formData.productsActual}
                  onChange={(value) =>
                    setFormData({ ...formData, productsActual: value })
                  }
                />

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Tỷ lệ hoàn thành do Chủ nhiệm tự đánh giá (%) *
                  </label>
                  <input
                    type="number"
                    max={100}
                    min={0}
                    required
                    value={formData.claimedOverallCompletionPercentage}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        claimedOverallCompletionPercentage: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold text-xs outline-none focus:border-[#0A6EBD]"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Tải lên file Báo cáo tổng kết / Minh chứng (.docx, .pdf)
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      multiple
                      accept=".doc,.docx,.pdf"
                      onChange={(event) =>
                        setEvidenceFiles(Array.from(event.target.files || []))
                      }
                      className="hidden"
                      id="evidence-upload"
                    />

                    <label
                      htmlFor="evidence-upload"
                      className="cursor-pointer rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 shadow-2xs"
                    >
                      <Upload className="mr-1 inline h-3.5 w-3.5" />
                      Chọn file
                    </label>

                    <span className="max-w-[200px] truncate text-slate-500 font-medium">
                      {evidenceFiles.length > 0 ? `${evidenceFiles.length} tệp đã chọn` : 'Chưa chọn file'}
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
                    placeholder="Mô tả tóm tắt kết luận và giá trị thực tiễn..."
                    className="w-full resize-none rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-[#0A6EBD]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-[#0A6EBD] hover:bg-[#085896] px-4 py-1.5 text-xs font-bold text-white shadow-2xs cursor-pointer transition"
                >
                  {isResubmission ? 'Nộp lại hồ sơ' : 'Nộp hồ sơ'}
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
        className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium outline-none focus:border-[#0A6EBD]"
      />
    </div>
  );
}