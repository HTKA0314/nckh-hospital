'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import {
  DocumentType,
  DocumentVersion,
  ProposalStatus,
  ResearchProject,
  SubmissionVersion,
} from '@/lib/types';
import { canSubmitResubmission } from '@/lib/utils/permissions';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Upload,
  History,
  MessageSquare,
  X,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export default function ResubmitProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();

  const [project, setProject] = useState<ResearchProject | null>(null);

  // Form State Chung
  const [revisionNotes, setRevisionNotes] = useState('');

  // Form State Cấu trúc Đề cương Chi tiết
  const [urgencyExplanation, setUrgencyExplanation] = useState('');
  const [expectedObjectives, setExpectedObjectives] = useState('');
  const [researchDesign, setResearchDesign] = useState('');
  const [sampleSizeEstimation, setSampleSizeEstimation] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState(0);

  // Sàng lọc nguy cơ Đạo đức Y sinh (IRB)
  const [involvesHumanSubjects, setInvolvesHumanSubjects] = useState(false);
  const [involvesIdentifiableData, setInvolvesIdentifiableData] = useState(false);
  const [involvesBiologicalSamples, setInvolvesBiologicalSamples] = useState(false);
  const [involvesNewInterventions, setInvolvesNewInterventions] = useState(false);

  // Danh sách tệp đính kèm
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; type: DocumentType; name: string; size: string }[]
  >([]);
  const [selectedUploadDocType, setSelectedUploadDocType] =
    useState<DocumentType>('DETAILED_OUTLINE');

  // Load dự án
  useEffect(() => {
    if (projectId) {
      const p = repo.getProjectById(projectId);
      if (p) {
        setProject(p);
        setEstimatedBudget(p.estimatedBudget || 0);
        setUrgencyExplanation(p.urgencyExplanation || '');
        setExpectedObjectives(p.expectedObjectives || p.summary || '');
        setResearchDesign(p.researchDesign || '');
        setSampleSizeEstimation(p.sampleSizeEstimation || '');
        setInvolvesHumanSubjects(Boolean(p.ethicsRequired));
        setSelectedUploadDocType(
          p.proposalStatus === 'REVISION_REQUIRED' ? 'PROPOSAL_FORM' : 'DETAILED_OUTLINE'
        );
      }
    }
  }, [projectId]);

  // 🔴 TẤT CẢ HOOK USEMEMO ĐƯỢC CHUYỂN LÊN TRÊN NÀY (TRƯỚC BẤT KỲ CÂU LỆNH IF RETURN NÀO)
  const latestFeedback = useMemo(() => {
    if (!project) return null;

    if (project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
      const latestCouncilEvaluation = [...(project.proposalEvaluations || [])]
        .reverse()
        .find((item) => item.conclusion === 'APPROVED_WITH_REVISION');

      if (latestCouncilEvaluation?.revisionRequirements?.trim()) {
        return latestCouncilEvaluation.revisionRequirements.trim();
      }
    }

    const historyItem = [...(project.statusHistory || [])]
      .reverse()
      .find((item) => item.comment?.trim());

    return historyItem?.comment?.trim() || 'Chưa có nội dung yêu cầu chỉnh sửa được ghi nhận.';
  }, [project]);

  // BẮT ĐẦU CÁC CÂU LỆNH ĐIỀU KIỆN RETURN (KHI CÁC HOOK ĐÃ ĐƯỢC KHAI BÁO BẮT BUỘC BAN ĐẦU)
  if (!project) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs shadow-2xs">
        <AlertCircle className="mx-auto mb-2 h-10 w-10 text-rose-500" />
        <h2 className="text-sm font-bold text-slate-900">Không tìm thấy hồ sơ đề tài</h2>
        <p className="mt-1 text-slate-500">Mã đề tài không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <Link
          href="/projects"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-4 py-2 font-bold text-white shadow-2xs hover:bg-[#085896] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh mục đề tài
        </Link>
      </div>
    );
  }

  // Phân loại ngữ cảnh nghiệp vụ
  const isAdministrativeRevision = project.proposalStatus === 'REVISION_REQUIRED';
  const isCouncilRevision = project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED';
  const isValidRevisionState = isAdministrativeRevision || isCouncilRevision;

  // Route /resubmit chỉ phục vụ hồ sơ đã bị yêu cầu bổ sung/chỉnh sửa.
  // Hồ sơ ADMIN_VALIDATED phải đi qua workspace /outline-update để nộp đề cương lần đầu.
  if (project.proposalStatus === 'ADMIN_VALIDATED') {
    return (
      <div className="mx-auto my-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs shadow-2xs">
        <FileText className="mx-auto mb-2 h-10 w-10 text-[#0A6EBD]" />
        <h2 className="text-sm font-bold text-slate-900">Hồ sơ đã hợp lệ về hành chính</h2>
        <p className="mt-1 leading-relaxed text-slate-500">
          Bước tiếp theo là hoàn thiện và nộp Thuyết minh đề cương chi tiết, không phải nộp lại hồ sơ.
        </p>
        <Link
          href={`/projects/${project.id}/outline-update`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-4 py-2 font-bold text-white shadow-2xs hover:bg-[#085896] transition"
        >
          Đi tới hoàn thiện đề cương
        </Link>
      </div>
    );
  }

  if (!isValidRevisionState || !canSubmitResubmission(currentUser, project)) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs shadow-2xs">
        <AlertCircle className="mx-auto mb-2 h-10 w-10 text-amber-500" />
        <h2 className="text-sm font-bold text-slate-900">Hồ sơ không ở trạng thái cho phép nộp lại</h2>
        <p className="mt-1 leading-relaxed text-slate-500">
          Chỉ Chủ nhiệm đề tài được thực hiện nộp lại khi hồ sơ có yêu cầu bổ sung từ Phòng NCKH hoặc Hội đồng.
        </p>
        <Link
          href={`/projects/${project.id}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại chi tiết đề tài
        </Link>
      </div>
    );
  }

  const isEthicsRequired =
    involvesHumanSubjects ||
    involvesIdentifiableData ||
    involvesBiologicalSamples ||
    involvesNewInterventions;

  const submissionVersions = project.submissionVersions ?? [];
  const nextVersionNo = submissionVersions.length + 1;

  const nextProposalStatus: ProposalStatus = isAdministrativeRevision
    ? 'RESUBMITTED'
    : 'PROPOSAL_RESUBMITTED';

  const pageTitle = isAdministrativeRevision
    ? 'Bổ sung Hồ sơ Đăng ký đề xuất'
    : 'Hoàn thiện Đề cương theo yêu cầu Hội đồng';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'doc', 'docx', 'xlsx'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(extension)) {
      warning('Tệp không đúng định dạng cho phép. Chỉ nhận PDF, DOC, DOCX hoặc XLSX.');
      e.target.value = '';
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      warning('Dung lượng mỗi tệp không được vượt quá 25MB.');
      e.target.value = '';
      return;
    }

    const newFile = {
      id: `f-${Date.now()}`,
      type: selectedUploadDocType,
      name: file.name,
      size:
        file.size >= 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`,
    };
    setUploadedFiles((prev) => [...prev, newFile]);
    e.target.value = '';
    success(`Đã đính kèm tệp: ${file.name}`);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleResubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!revisionNotes.trim()) {
      warning('Vui lòng nhập văn bản giải trình tiếp thu ý kiến chỉnh sửa.');
      return;
    }

    if (isCouncilRevision && (!urgencyExplanation.trim() || !expectedObjectives.trim() || !researchDesign.trim())) {
      warning('Vui lòng hoàn thiện các nội dung cốt lõi của đề cương trước khi nộp lại.');
      return;
    }

    if (estimatedBudget < 0) {
      warning('Dự toán kinh phí không được là số âm.');
      return;
    }

    if (uploadedFiles.length === 0) {
      warning('Vui lòng tải lên ít nhất 1 tệp tài liệu bản cập nhật.');
      return;
    }

    const now = new Date().toISOString();
    const newVersionRecords: DocumentVersion[] = [];
    let updatedDocuments = (project.documents || []).map((doc) => ({
      ...doc,
      versions: (doc.versions || []).map((version) => ({ ...version })),
    }));

    uploadedFiles.forEach((file, index) => {
      const existingIndex = updatedDocuments.findIndex((doc) => doc.documentType === file.type);
      const stamp = `${Date.now()}-${index}`;

      if (existingIndex >= 0) {
        const existing = updatedDocuments[existingIndex];
        const nextDocumentVersion = Math.max(0, ...(existing.versions || []).map((v) => v.version || 0)) + 1;
        const versionId = `ver-resubmit-${stamp}`;
        const newVersion: DocumentVersion = {
          id: versionId,
          documentId: existing.id,
          version: nextDocumentVersion,
          fileName: file.name,
          fileSize: file.size,
          uploadedBy: currentUser.id,
          uploadedByName: currentUser.fullName,
          uploadedAt: now,
          downloadUrl: '',
          notes: revisionNotes.trim(),
          isCurrent: true,
        };

        updatedDocuments[existingIndex] = {
          ...existing,
          title: existing.title || file.name,
          currentVersion: nextDocumentVersion,
          currentVersionId: versionId,
          versions: [
            ...(existing.versions || []).map((version) => ({ ...version, isCurrent: false })),
            newVersion,
          ],
        };
        newVersionRecords.push(newVersion);
      } else {
        const documentId = `doc-resubmit-${stamp}`;
        const versionId = `ver-resubmit-${stamp}`;
        const newVersion: DocumentVersion = {
          id: versionId,
          documentId,
          version: 1,
          fileName: file.name,
          fileSize: file.size,
          uploadedBy: currentUser.id,
          uploadedByName: currentUser.fullName,
          uploadedAt: now,
          downloadUrl: '',
          notes: revisionNotes.trim(),
          isCurrent: true,
        };

        updatedDocuments = [
          ...updatedDocuments,
          {
            id: documentId,
            projectId: project.id,
            documentType: file.type,
            title: file.name,
            currentVersion: 1,
            currentVersionId: versionId,
            versions: [newVersion],
          },
        ];
        newVersionRecords.push(newVersion);
      }
    });

    const updatedProject: Partial<ResearchProject> = {
      proposalStatus: nextProposalStatus,
      ...(isCouncilRevision
        ? {
            urgencyExplanation: urgencyExplanation.trim(),
            expectedObjectives: expectedObjectives.trim(),
            researchDesign: researchDesign.trim(),
            sampleSizeEstimation: sampleSizeEstimation.trim(),
            estimatedBudget,
            // Không cập nhật approvedBudget tại màn Chủ nhiệm nộp lại; kinh phí được duyệt chỉ thay đổi sau quyết định có thẩm quyền.
          }
        : {}),
      documents: updatedDocuments,
      updatedAt: now,
    };

    const newSubmissionVersion: SubmissionVersion = {
      id: `sub-ver-${Date.now()}`,
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
        ...(isCouncilRevision
          ? {
              urgencyExplanation: urgencyExplanation.trim(),
              expectedObjectives: expectedObjectives.trim(),
              researchDesign: researchDesign.trim(),
              sampleSizeEstimation: sampleSizeEstimation.trim(),
              estimatedBudget,
            }
          : {}),
        updatedAt: now,
      },
      documents: newVersionRecords,
    };

    const updated = repo.updateProject(project.id, updatedProject);
    const addedVersion = updated
      ? repo.addSubmissionVersion(project.id, newSubmissionVersion)
      : false;

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: isAdministrativeRevision ? 'RESUBMIT_ADMIN_PROPOSAL' : 'RESUBMIT_PROPOSAL_OUTLINE',
      entityType: 'PROJECT',
      entityId: project.id,
      fromStatus: project.proposalStatus,
      toStatus: nextProposalStatus,
      notes: `${pageTitle}. Giải trình: ${revisionNotes.trim()}`,
    });

    if (addedVersion && updated) {
      success('Đã nộp hồ sơ cập nhật thành công! Hồ sơ đã chuyển đến Phòng Quản lý NCKH.');
      router.push(`/projects/${project.id}`);
    } else {
      error('Không thể lưu hồ sơ nộp lại. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12 text-xs text-slate-800">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 select-none">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 font-bold text-slate-600 transition hover:text-[#0A6EBD]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Chi tiết đề tài</span>
        </Link>

        <span className="font-mono text-xs font-bold text-[#0A6EBD] bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
          {pageTitle} • Lần {nextVersionNo}
        </span>
      </div>

      {/* Thông tin Hồ sơ */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            {project.projectCode || project.proposalCode}
          </span>
          <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {pageTitle}
          </span>
        </div>
        <h1 className="text-base font-bold text-slate-900 leading-snug">{project.title}</h1>
        <p className="font-medium text-slate-500">
          Chủ nhiệm đề tài: <strong className="text-slate-800">{project.principalInvestigatorName}</strong> •{' '}
          {project.departmentName}
        </p>
      </div>

      {/* Bố cục Split Layout (2 Cột) */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* CỘT TRÁI (5 CỘT) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-900 select-none">
                <MessageSquare className="h-4 w-4 text-amber-600" />
                <span>Ý kiến phản hồi / Yêu cầu chỉnh sửa</span>
              </h3>
              <p className="rounded-lg border border-amber-200/80 bg-white p-3 font-medium leading-relaxed italic text-slate-700">
                &ldquo;{latestFeedback}&rdquo;
              </p>
            </div>

          {/* Lịch sử nộp trước */}
          {submissionVersions.length > 0 && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-800 select-none">
                <History className="h-4 w-4 text-slate-500" />
                <span>Lịch sử các bản nộp trước ({submissionVersions.length})</span>
              </h3>
              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                {submissionVersions
                  .slice()
                  .reverse()
                  .map((ver) => (
                    <div key={ver.id} className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#0A6EBD]">Bản v{ver.versionNo}.0</span>
                        <span className="font-mono text-[10px] text-slate-400">{formatDate(ver.submittedAt)}</span>
                      </div>
                      <p className="font-medium leading-relaxed text-slate-700">{ver.changeSummary}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Sàng lọc Đạo đức Y sinh (IRB) chỉ áp dụng khi chỉnh sửa đề cương chuyên môn */}
          {isCouncilRevision && (
          <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-800 select-none">
              <ShieldAlert className="h-4 w-4 text-slate-500" />
              <span>Sàng lọc Đạo đức Y sinh (IRB)</span>
            </h3>
            <div className="space-y-2 font-medium text-slate-700">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={involvesHumanSubjects}
                  onChange={(e) => setInvolvesHumanSubjects(e.target.checked)}
                  className="mt-0.5"
                />
                <span>Nghiên cứu có can thiệp trực tiếp trên người bệnh</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={involvesIdentifiableData}
                  onChange={(e) => setInvolvesIdentifiableData(e.target.checked)}
                  className="mt-0.5"
                />
                <span>Trích xuất hồ sơ bệnh án có dữ liệu định danh</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={involvesBiologicalSamples}
                  onChange={(e) => setInvolvesBiologicalSamples(e.target.checked)}
                  className="mt-0.5"
                />
                <span>Nghiên cứu thu thập/sử dụng mẫu bệnh phẩm sinh học</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={involvesNewInterventions}
                  onChange={(e) => setInvolvesNewInterventions(e.target.checked)}
                  className="mt-0.5"
                />
                <span>Thử nghiệm kỹ thuật mới, thuốc/thiết bị y tế mới</span>
              </label>
            </div>
            <div className="pt-1">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  isEthicsRequired
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
              >
                {isEthicsRequired ? 'Yêu cầu thẩm định Hội đồng Đạo đức (IRB)' : 'Không thuộc diện thẩm định Đạo đức'}
              </span>
            </div>
          </div>
          )}
        </div>

        {/* CỘT PHẢI (7 CỘT) */}
        <div className="space-y-4 lg:col-span-7">
          <form onSubmit={handleResubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-slate-900 select-none">
              Nội dung bổ sung & Tải tệp cập nhật
            </h3>

            {isAdministrativeRevision && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-800">
                Bước này chỉ bổ sung hồ sơ đăng ký theo yêu cầu của Phòng NCKH. Nội dung đề cương chuyên môn được hoàn thiện ở bước tiếp theo sau khi hồ sơ hành chính hợp lệ.
              </div>
            )}

            {/* Văn bản giải trình tiếp thu */}
            <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  Văn bản Giải trình tiếp thu & Chỉnh sửa <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Ghi rõ chi tiết từng ý kiến góp ý, cách thức tiếp thu và vị trí chỉnh sửa trong tài liệu..."
                  className="w-full resize-none rounded-lg border border-slate-300 p-3 font-medium text-xs leading-relaxed outline-none focus:border-[#0A6EBD]"
                />
              </div>

            {/* Các trường nội dung cốt lõi chỉ chỉnh sửa khi Hội đồng yêu cầu sửa đề cương */}
            {isCouncilRevision && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="mb-1 block font-bold text-slate-800">Tính cấp thiết của đề tài</label>
                <textarea
                  rows={2}
                  value={urgencyExplanation}
                  onChange={(e) => setUrgencyExplanation(e.target.value)}
                  placeholder="Nêu bật lý do cần thực hiện nghiên cứu..."
                  className="w-full resize-none rounded-lg border border-slate-300 p-2 font-medium"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-800">Mục tiêu nghiên cứu</label>
                <textarea
                  rows={2}
                  value={expectedObjectives}
                  onChange={(e) => setExpectedObjectives(e.target.value)}
                  placeholder="Mục tiêu tổng quát và cụ thể..."
                  className="w-full resize-none rounded-lg border border-slate-300 p-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-800">Thiết kế nghiên cứu</label>
                  <input
                    type="text"
                    value={researchDesign}
                    onChange={(e) => setResearchDesign(e.target.value)}
                    placeholder="Ví dụ: Mô tả cắt ngang"
                    className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-800">Cỡ mẫu / Căn cứ ước tính</label>
                  <input
                    type="text"
                    value={sampleSizeEstimation}
                    onChange={(e) => setSampleSizeEstimation(e.target.value)}
                    placeholder="Ví dụ: 220 người bệnh"
                    className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-800">Dự toán kinh phí (VND)</label>
                  <input
                    type="number"
                    step="1000000"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
            )}

            {/* Khối Tải lên Tệp tin */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800">
                  Tài liệu đính kèm <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedUploadDocType}
                  onChange={(e) => setSelectedUploadDocType(e.target.value as DocumentType)}
                  className="rounded-lg border border-slate-300 bg-white p-1 text-[11px] font-semibold text-slate-700"
                >
                  <option value="DETAILED_OUTLINE">Thuyết minh đề cương (BM2)</option>
                  <option value="BUDGET_ESTIMATE">Dự toán kinh phí (BM3)</option>
                  <option value="ETHICS_DOSSIER">Hồ sơ Đạo đức y sinh</option>
                  <option value="PROPOSAL_FORM">Hồ sơ Đăng ký đề xuất (BM1)</option>
                  <option value="OTHER">Tài liệu bổ trợ khác</option>
                </select>
              </div>

              <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-4 text-center transition hover:border-[#0A6EBD] hover:bg-sky-50/30 cursor-pointer">
                <input
                  type="file"
                  accept=".doc,.docx,.pdf,.xlsx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="pointer-events-none select-none space-y-1">
                  <Upload className="mx-auto h-6 w-6 text-[#0A6EBD]" />
                  <span className="block font-bold text-slate-700 text-xs">Nhấp để chọn tệp từ máy tính</span>
                  <span className="text-[10px] text-slate-400">Hỗ trợ định dạng PDF, DOCX, XLSX (Tối đa 25MB)</span>
                </div>
              </div>

              {/* Danh sách tệp đã chọn */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="block font-bold text-slate-700">Tệp chuẩn bị gửi ({uploadedFiles.length}):</span>
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#0A6EBD]" />
                        <span className="font-bold text-slate-800">{file.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">({file.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-slate-400 transition hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 select-none">
              <Link
                href={`/projects/${project.id}`}
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy bỏ
              </Link>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-5 py-2 font-bold text-white shadow-2xs hover:bg-[#085896] transition cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{isCouncilRevision ? 'Nộp lại đề cương' : 'Nộp lại hồ sơ'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}