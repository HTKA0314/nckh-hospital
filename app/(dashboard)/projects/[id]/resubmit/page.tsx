'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { DocumentVersion, ProposalStatus, SubmissionVersion } from '@/lib/types';
import { canSubmitResubmission } from '@/lib/utils/permissions';
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Upload,
} from 'lucide-react';

export default function ResubmitProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  const { currentUser } = useAuth();

  const project = repo.getProjectById(projectId);

  const [revisionNotes, setRevisionNotes] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');

  if (!project) {
    return (
      <div className="text-center py-12 text-slate-500 bg-white rounded-md border border-[#D8DEE6]">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</p>
        <Link
          href="/projects"
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A6EBD] text-white rounded text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách đề tài
        </Link>
      </div>
    );
  }

  const isAdministrativeRevision =
    project.proposalStatus === 'REVISION_REQUIRED';

  const isCouncilRevision =
    project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED';

  const isValidRevisionState =
    isAdministrativeRevision || isCouncilRevision;

  if (
    !canSubmitResubmission(currentUser, project) ||
    !isValidRevisionState
  ) {
    return (
      <div className="text-center py-12 text-slate-500 bg-white rounded-md border border-[#D8DEE6]">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="font-bold text-slate-800">
          Hồ sơ hiện không ở trạng thái cho phép nộp lại.
        </p>
        <p className="text-xs mt-1">
          Chỉ Chủ nhiệm đề tài được nộp lại khi hồ sơ đang yêu cầu bổ sung/chỉnh sửa.
        </p>
        <Link
          href={`/projects/${project.id}`}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại chi tiết đề tài
        </Link>
      </div>
    );
  }

  const submissionVersions = project.submissionVersions ?? [];
  const nextVersionNo = submissionVersions.length + 1;

  const nextProposalStatus: ProposalStatus = isAdministrativeRevision
    ? 'RESUBMITTED'
    : 'PROPOSAL_RESUBMITTED';

  const revisionScopeLabel = isAdministrativeRevision
    ? 'hồ sơ đăng ký'
    : 'đề cương sau xét duyệt Hội đồng';

  const targetDocumentType = isAdministrativeRevision
    ? 'PROPOSAL_FORM'
    : 'DETAILED_OUTLINE';

  const targetDocument = project.documents?.find(
    (document) => document.documentType === targetDocumentType
  );

  const currentVersionNo = targetDocument?.currentVersion ?? 0;

  const formattedLatestVersion = useMemo(
    () => `v${nextVersionNo}`,
    [nextVersionNo]
  );

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName('');
      setSelectedFileSize('');
      return;
    }

    setSelectedFileName(file.name);
    setSelectedFileSize(
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`
    );
  };

  const handleResubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!revisionNotes.trim()) {
      window.alert(
        'Vui lòng nhập giải trình các nội dung đã tiếp thu và chỉnh sửa.'
      );
      return;
    }

    if (!selectedFileName) {
      window.alert('Vui lòng chọn tài liệu phiên bản mới trước khi nộp lại.');
      return;
    }

    /*
     * Prototype hiện chưa có binary upload service.
     * Chỉ lưu metadata/version record; downloadUrl để trống.
     * Khi tích hợp storage thật, phải upload file trước rồi nhận URL thật.
     */
    const now = new Date().toISOString();

    let updatedDocs = project.documents ?? [];
    let submissionDocuments: DocumentVersion[] = [];

    if (targetDocument) {
      const nextDocumentVersion = currentVersionNo + 1;

      const newVersion: DocumentVersion = {
        id: `ver-${Date.now()}`,
        documentId: targetDocument.id,
        version: nextDocumentVersion,
        fileName: selectedFileName,
        fileSize: selectedFileSize,
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.fullName,
        uploadedAt: now,
        downloadUrl: '',
        notes: revisionNotes.trim(),
        isCurrent: true,
      };

      updatedDocs = (project.documents ?? []).map((document) => {
        if (document.id !== targetDocument.id) {
          return document;
        }

        return {
          ...document,
          currentVersion: nextDocumentVersion,
          currentVersionId: newVersion.id,
          versions: [
            ...document.versions.map((version) => ({
              ...version,
              isCurrent: false,
            })),
            newVersion,
          ],
        };
      });

      submissionDocuments = [newVersion];
    }

    const newSubmissionVersion: SubmissionVersion = {
      id: `submission-${Date.now()}`,
      projectId: project.id,
      versionNo: nextVersionNo,
      submittedAt: now,
      submittedBy: currentUser.id,
      submittedByName: currentUser.fullName,
      changeSummary: revisionNotes.trim(),
      isCurrent: true,
      status: 'ACTIVE',
      structuredDataSnapshot: {
        proposalStatus: nextProposalStatus,
        title: project.title,
        updatedAt: now,
      },
      documents: submissionDocuments,
    };

    const added = repo.addSubmissionVersion(project.id, {
      ...newSubmissionVersion,
      documents: submissionDocuments,
    });

    const updated = repo.updateProject(project.id, {
      proposalStatus: nextProposalStatus,
      documents: updatedDocs,
    });

    /*
     * Không ghi ProposalStatus vào ProjectStatusHistory.
     * Macro ProjectStatus vẫn giữ nguyên; repository/audit log là nơi
     * ghi nhận việc REVISION_REQUIRED -> RESUBMITTED hoặc
     * PROPOSAL_REVISION_REQUIRED -> PROPOSAL_RESUBMITTED.
     */
    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: isAdministrativeRevision
        ? 'RESUBMIT_PROPOSAL_DOSSIER'
        : 'RESUBMIT_PROPOSAL_OUTLINE',
      entityType: 'PROJECT',
      entityId: project.id,
      notes: `${revisionScopeLabel}: ${project.proposalStatus} -> ${nextProposalStatus}. Giải trình: ${revisionNotes.trim()}`,
    });

    if (added && updated) {
      window.alert(
        isAdministrativeRevision
          ? 'Đã nộp lại hồ sơ đăng ký. Phòng NCKH sẽ thẩm định hành chính lại.'
          : 'Đã nộp lại đề cương sau chỉnh sửa. Hồ sơ sẽ được chuyển vào bước rà soát sau Hội đồng.'
      );

      router.push(`/projects/${project.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#0A6EBD] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại Chi tiết đề tài
        </Link>

        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          Bản nộp lại {formattedLatestVersion}
        </span>
      </div>

      <div className="bg-white rounded-md border border-[#D8DEE6] shadow-sm p-4 space-y-4 text-xs">
        <div>
          <span className="font-mono text-xs font-bold text-[#0A6EBD] bg-[#EBF4FC] px-2 py-0.5 rounded border border-[#B8D7F5]">
            {project.proposalCode}
          </span>

          <h2 className="text-base font-bold text-[#1B3B60] mt-1">
            {project.title}
          </h2>

          <p className="text-xs text-slate-500">
            Chủ nhiệm: {project.principalInvestigatorName}
          </p>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            Hồ sơ đang yêu cầu chỉnh sửa
          </div>

          <p className="mt-1.5 text-[12px] leading-relaxed text-amber-900">
            {isAdministrativeRevision
              ? 'Phòng NCKH đã yêu cầu bổ sung hồ sơ đăng ký. Sau khi nộp lại, trạng thái chuyển sang RESUBMITTED để thẩm định hành chính lại.'
              : 'Hội đồng đã yêu cầu chỉnh sửa đề cương. Sau khi nộp lại, trạng thái chuyển sang PROPOSAL_RESUBMITTED để rà soát nội dung sau Hội đồng.'}
          </p>
        </div>

        {submissionVersions.length > 0 && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="text-[12px] font-bold uppercase tracking-wide text-slate-600">
              Lịch sử bản nộp lại
            </div>

            <div className="space-y-2">
              {submissionVersions
                .slice()
                .reverse()
                .map((version) => (
                  <div
                    key={version.id}
                    className="rounded-md border border-slate-200 bg-white p-2.5 text-[12px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">
                        Bản v{version.versionNo}
                      </span>
                      <span className="text-slate-500">
                        {version.submittedAt}
                      </span>
                    </div>

                    <p className="text-slate-600 mt-1">
                      {version.changeSummary ||
                        'Không có ghi chú giải trình'}
                    </p>

                    <p className="text-[11px] text-slate-500 mt-1">
                      Người nộp: {version.submittedByName}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        <form onSubmit={handleResubmit} className="space-y-3">
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Giải trình nội dung đã tiếp thu/chỉnh sửa (*)
            </label>

            <textarea
              rows={4}
              required
              value={revisionNotes}
              onChange={(event) =>
                setRevisionNotes(event.target.value)
              }
              placeholder={
                isAdministrativeRevision
                  ? 'Nêu rõ từng nội dung hồ sơ đã bổ sung/chỉnh sửa theo yêu cầu của Phòng NCKH...'
                  : 'Nêu rõ từng ý kiến Hội đồng, nội dung đã tiếp thu và vị trí chỉnh sửa trong đề cương...'
              }
              className="w-full p-2.5 rounded-md border border-[#D8DEE6] focus:border-[#0A6EBD] text-[13px]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Tài liệu phiên bản mới (*)
            </label>

            <label className="p-4 border-2 border-dashed border-[#D8DEE6] rounded-md bg-slate-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#0A6EBD] transition">
              <Upload className="w-6 h-6 text-[#0A6EBD]" />

              {selectedFileName ? (
                <div className="text-center">
                  <span className="font-bold text-slate-800 block">
                    {selectedFileName}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedFileSize}
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="font-bold text-slate-700 block">
                    Chọn tệp từ máy
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Hệ thống prototype hiện lưu metadata phiên bản;
                    chưa có dịch vụ lưu file nhị phân.
                  </span>
                </div>
              )}

              <input
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            <div className="mt-2 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-500">
              <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Loại tài liệu cập nhật: {targetDocumentType}. Không tạo
                URL tải giả; khi tích hợp storage thật cần upload file
                trước khi hoàn tất submission.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Link
              href={`/projects/${project.id}`}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Hủy
            </Link>

            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Nộp lại {revisionScopeLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}