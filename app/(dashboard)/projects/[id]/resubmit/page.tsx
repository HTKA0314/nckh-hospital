'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { DocumentVersion } from '@/lib/types';
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  Clock,
} from 'lucide-react';

export default function ResubmitProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  const { currentUser } = useAuth();

  const project = repo.getProjectById(projectId);

  const [revisionNotes, setRevisionNotes] = useState('');
  const [newVersionFileName, setNewVersionFileName] = useState('De_cuong_hoan_thien_v2.0.pdf');
  const [fileSize, setFileSize] = useState('1.5 MB');

  if (!project) {
    return (
      <div className="text-center py-12 text-slate-500 bg-white rounded-md border border-[#D8DEE6]">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</p>
      </div>
    );
  }

  // Lấy ý kiến thẩm định gần nhất
  const lastReviewHistory = [...project.statusHistory]
    .reverse()
    .find((h) => h.toStatus === 'REVISION_REQUIRED');

  const handleResubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) {
      alert('Vui lòng nhập giải trình các nội dung đã tiếp thu và chỉnh sửa');
      return;
    }

    // Cập nhật tài liệu bản v2.0
    const updatedDocs = project.documents.map((doc) => {
      if (doc.documentType === 'DETAILED_OUTLINE') {
        const nextVer = doc.currentVersion + 1;
        const newVer: DocumentVersion = {
          id: `ver-${Date.now()}`,
          documentId: doc.id,
          version: nextVer,
          fileName: newVersionFileName,
          fileSize: fileSize,
          uploadedBy: currentUser.id,
          uploadedByName: currentUser.fullName,
          uploadedAt: new Date().toLocaleString('vi-VN'),
          downloadUrl: '#',
          notes: revisionNotes,
          isCurrent: true,
        };

        return {
          ...doc,
          currentVersion: nextVer,
          currentVersionId: newVer.id,
          versions: [
            ...doc.versions.map((v) => ({ ...v, isCurrent: false })),
            newVer,
          ],
        };
      }
      return doc;
    });

    const updated = repo.updateProject(project.id, {
      proposalStatus: 'RESUBMITTED',
      documents: updatedDocs,
      statusHistory: [
        ...project.statusHistory,
        {
          id: `h-${Date.now()}`,
          projectId: project.id,
          fromStatus: 'REVISION_REQUIRED',
          toStatus: 'RESUBMITTED',
          changedBy: currentUser.id,
          changedByName: currentUser.fullName,
          userRole: currentUser.role,
          changedAt: new Date().toLocaleString('vi-VN'),
          action: 'Nộp lại hồ sơ đề xuất sau bổ sung (v2.0)',
          comment: revisionNotes,
        },
      ],
    });

    if (updated) {
      repo.addAuditLog({
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: 'RESUBMIT_PROPOSAL',
        entityType: 'ResearchProject',
        entityId: project.id,
        details: `Chủ nhiệm đề tài ${currentUser.fullName} đã nộp lại hồ sơ đề tài ${project.proposalCode} sau bổ sung chỉnh sửa.`,
      });

      alert('Đã nộp lại hồ sơ đề tài thành công! Chuyên viên NCKH sẽ thẩm định lại.');
      router.push(`/projects/${project.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#0A6EBD] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Chi tiết đề tài
        </Link>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
          Quy trình Bổ sung Hồ sơ
        </span>
      </div>

      <div className="bg-white rounded-md border border-[#D8DEE6] shadow-sm p-4 space-y-4 text-xs">
        <div>
          <span className="font-mono text-xs font-bold text-[#0A6EBD] bg-[#EBF4FC] px-2 py-0.5 rounded border border-[#B8D7F5]">
            {project.proposalCode}
          </span>
          <h2 className="text-base font-bold text-[#1B3B60] mt-1">{project.title}</h2>
          <p className="text-xs text-slate-500">Chủ nhiệm: {project.principalInvestigatorName}</p>
        </div>

        {/* Ý kiến yêu cầu bổ sung từ NCKH */}
        <div className="p-3 rounded-md bg-rose-50/70 border border-rose-200 text-rose-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            Ý kiến Thẩm định từ Phòng Quản lý NCKH:
          </div>
          <p className="text-rose-900 bg-white/80 p-2.5 rounded border border-rose-200 leading-relaxed text-[13px]">
            {lastReviewHistory?.comment || 'Yêu cầu cập nhật chi tiết dự toán và hoàn thiện phương pháp nghiên cứu theo mẫu quy định.'}
          </p>
          <span className="text-[11px] text-rose-700 block">
            Yêu cầu ngày: {lastReviewHistory?.changedAt} bởi {lastReviewHistory?.changedByName}
          </span>
        </div>

        {/* Form nộp lại */}
        <form onSubmit={handleResubmit} className="space-y-3">
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Bản giải trình tiếp thu và hoàn thiện đề cương (*):
            </label>
            <textarea
              rows={3}
              required
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Trình bày chi tiết các điểm đã tiếp thu, chỉnh sửa theo từng yêu cầu của chuyên viên NCKH..."
              className="w-full p-2.5 rounded-md border border-[#D8DEE6] focus:border-[#0A6EBD] text-[13px]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Tải lên File Đề cương hoàn thiện (v2.0) (*):</label>
            <div className="p-4 border-2 border-dashed border-[#D8DEE6] rounded-md bg-slate-50/50 flex flex-col items-center justify-center space-y-1">
              <Upload className="w-6 h-6 text-[#0A6EBD]" />
              <div className="text-center">
                <span className="font-bold text-slate-800">{newVersionFileName}</span>
                <span className="text-[11px] text-slate-400 block">Dung lượng: {fileSize}</span>
              </div>
              <span className="text-[11px] text-[#0A6EBD] bg-[#EBF4FC] px-2 py-0.5 rounded font-medium">
                Đã chọn file phiên bản mới
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Link
              href={`/projects/${project.id}`}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> Nộp lại Hồ sơ Thẩm định
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
