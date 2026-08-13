'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { ResearchProject, DocumentType } from '@/lib/types';
import { canSubmitResubmission } from '@/lib/utils/permissions';
import {
  ArrowLeft,
  CheckCircle2,
  Upload,
  FileText,
  X,
  AlertCircle
} from 'lucide-react';

export default function OutlineUpdatePage() {
  const router = useRouter();
  const params = useParams();
  const { currentUser } = useAuth();
  const { success, error, warning } = useToast();
  
  const [project, setProject] = useState<ResearchProject | null>(null);

  // Form State
  const [urgencyExplanation, setUrgencyExplanation] = useState('');
  const [expectedObjectives, setExpectedObjectives] = useState('');
  const [researchDesign, setResearchDesign] = useState('');
  const [researchSubjects, setResearchSubjects] = useState('');
  const [researchLocation, setResearchLocation] = useState('');
  const [selectionCriteria, setSelectionCriteria] = useState('');
  const [exclusionCriteria, setExclusionCriteria] = useState('');
  const [recruitmentAndSampleCollection, setRecruitmentAndSampleCollection] = useState('');
  const [researchVariables, setResearchVariables] = useState('');
  const [sampleSizeEstimation, setSampleSizeEstimation] = useState('');
  const [studyTimeEstimation, setStudyTimeEstimation] = useState('');
  const [expectedProducts, setExpectedProducts] = useState('');
  const [hospitalApplication, setHospitalApplication] = useState('');
  
  const [estimatedBudget, setEstimatedBudget] = useState(0);
  
  const [involvesHumanSubjects, setInvolvesHumanSubjects] = useState(false);
  const [involvesIdentifiableData, setInvolvesIdentifiableData] = useState(false);
  const [involvesBiologicalSamples, setInvolvesBiologicalSamples] = useState(false);
  const [involvesNewInterventions, setInvolvesNewInterventions] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; type: DocumentType; name: string; size: string }[]
  >([]);
  const [selectedUploadDocType, setSelectedUploadDocType] = useState<DocumentType>('DETAILED_OUTLINE');

  const isEthicsRequired =
    involvesHumanSubjects ||
    involvesIdentifiableData ||
    involvesBiologicalSamples ||
    involvesNewInterventions;

  useEffect(() => {
    if (params.id) {
      const p = repo.getProjectById(params.id as string);
      if (p) {
        setProject(p);
        setEstimatedBudget(p.estimatedBudget || 0);
      }
    }
  }, [params.id]);

  if (project && !canSubmitResubmission(currentUser, project)) {
    return (
      <div className="text-center py-12 text-slate-500 bg-white rounded-md border border-[#D8DEE6]">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="font-bold text-slate-800">Bạn không có quyền sửa / nộp bổ sung thuyết minh cho đề tài này.</p>
      </div>
    );
  }

  if (!project) return <div className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>;

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
    success('Đã xóa tệp đính kèm');
  };

  const handleFileUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFiles([
      ...uploadedFiles,
      {
        id: `f-${Date.now()}`,
        type: selectedUploadDocType,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      },
    ]);
    success(`Đã tải lên tệp tin: ${file.name}`);
  };

  const handleSubmit = () => {
    if (!urgencyExplanation.trim() || !expectedObjectives.trim()) {
      warning('Vui lòng nhập Tính cấp thiết và Mục tiêu nghiên cứu.', 'Thiếu thông tin');
      return;
    }
    if (uploadedFiles.length === 0) {
      warning('Vui lòng tải lên file Thuyết minh đề cương chi tiết.', 'Thiếu tài liệu');
      return;
    }

    const updatedProject = {
      ...project,
      urgencyExplanation,
      expectedObjectives,
      researchDesign,
      researchSubjects,
      researchLocation,
      selectionCriteria,
      exclusionCriteria,
      recruitmentAndSampleCollection,
      researchVariables,
      sampleSizeEstimation,
      studyTimeEstimation,
      expectedProducts,
      hospitalApplication,
      estimatedBudget,
      approvedBudget: estimatedBudget,
      ethicsRequired: isEthicsRequired,
      ethicsStatus: isEthicsRequired ? 'DOSSIER_SUBMITTED' : 'NOT_REQUIRED',
      proposalStatus: 'UNDER_ADMIN_REVIEW' as any,
      status: 'UNDER_REVIEW' as any,
      documents: [
        ...(project.documents || []),
        ...uploadedFiles.map((f, i) => ({
          id: `doc-new-${Date.now()}-${i}`,
          projectId: project.id,
          documentType: f.type,
          title: f.name,
          currentVersion: 1,
          currentVersionId: `ver-1`,
          versions: [
            {
              id: `ver-1`,
              documentId: `doc-new-${Date.now()}-${i}`,
              version: 1,
              fileName: f.name,
              fileSize: f.size,
              uploadedBy: currentUser.id,
              uploadedByName: currentUser.fullName,
              uploadedAt: new Date().toLocaleString('vi-VN'),
              downloadUrl: '#',
              isCurrent: true,
            },
          ],
        }))
      ]
    };

    repo.updateProject(project.id, updatedProject as Partial<ResearchProject>);
    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'SUBMIT_OUTLINE',
      entityType: 'PROJECT',
      entityId: project.id,
      notes: `Nộp bổ sung thuyết minh đề cương chi tiết cho đề tài ${project.proposalCode}`,
    });

    // Notify Research Office users
    repo.getUsers().filter(u => u.role === 'RESEARCH_OFFICE').forEach(u => {
      repo.addNotification({
        userId: u.id,
        title: `Đề tài ${project.proposalCode} đã nộp bổ sung Thuyết minh`,
        content: `Đề tài ${project.title} vừa nộp bổ sung Thuyết minh đề cương. Vui lòng thẩm định.`,
        type: 'INFO',
        link: `/projects/${project.id}`,
      });
    });

    success('Nộp bổ sung thuyết minh thành công! Hồ sơ đã được chuyển đến Phòng Quản lý NCKH.');
    router.push('/my-projects');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24 text-slate-800">
      
      {/* Header */}
      <div className="flex items-center gap-3.5 border-b border-slate-200 pb-4 select-none">
        <Link
          href="/my-projects"
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#0A6EBD] flex items-center justify-center shrink-0 transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            Bổ sung Thuyết minh Đề cương chi tiết
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5 font-medium">
            Đề tài: {project.title}
          </p>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex gap-3 text-sky-900">
        <AlertCircle className="w-5 h-5 shrink-0 text-sky-600" />
        <div className="text-sm">
          <p className="font-bold mb-1">Hướng dẫn Bổ sung hồ sơ</p>
          <p className="opacity-90">Đề xuất đề tài của bạn đã được duyệt. Vui lòng cung cấp chi tiết nội dung nghiên cứu, dự toán kinh phí và tải lên các biểu mẫu bắt buộc (Thuyết minh đề cương BM2, Dự toán BM3) để Hội đồng Xét duyệt Đề cương xem xét.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. Nội dung Thuyết minh */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">I. Nội dung Thuyết minh</h2>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Tính cấp thiết của đề tài <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={urgencyExplanation}
                onChange={(e) => setUrgencyExplanation(e.target.value)}
                placeholder="Nêu bật lý do tại sao cần thực hiện nghiên cứu này..."
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Mục tiêu nghiên cứu <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={expectedObjectives}
                onChange={(e) => setExpectedObjectives(e.target.value)}
                placeholder="Nêu rõ mục tiêu tổng quát và cụ thể..."
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-medium"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Thiết kế nghiên cứu</label>
                <input
                  type="text"
                  value={researchDesign}
                  onChange={(e) => setResearchDesign(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Cỡ mẫu & Phương pháp chọn mẫu</label>
                <input
                  type="text"
                  value={sampleSizeEstimation}
                  onChange={(e) => setSampleSizeEstimation(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD] font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Kinh phí & Đạo đức */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">II. Kinh phí & Sàng lọc Đạo đức</h2>
          </div>
          <div className="p-6 space-y-6 text-sm">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Kinh phí dự toán tổng cộng (VND) <span className="text-rose-500">*</span>
              </label>
              <div className="relative max-w-sm">
                <input
                  type="number"
                  step="1000000"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                  className="w-full p-3 pr-14 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-[#0A6EBD]/20 focus:border-[#0A6EBD]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">VND</span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block border-b border-slate-200 pb-2">Đánh giá nguy cơ (Đạo đức Y Sinh):</span>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={involvesHumanSubjects} onChange={(e) => setInvolvesHumanSubjects(e.target.checked)} className="mt-1" />
                <span>Nghiên cứu có can thiệp hoặc thu thập thông tin trực tiếp trên người bệnh?</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={involvesIdentifiableData} onChange={(e) => setInvolvesIdentifiableData(e.target.checked)} className="mt-1" />
                <span>Nghiên cứu có trích xuất hồ sơ bệnh án chứa dữ liệu định danh?</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={involvesBiologicalSamples} onChange={(e) => setInvolvesBiologicalSamples(e.target.checked)} className="mt-1" />
                <span>Nghiên cứu có lấy mẫu bệnh phẩm sinh học (máu, mô, dịch)?</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={involvesNewInterventions} onChange={(e) => setInvolvesNewInterventions(e.target.checked)} className="mt-1" />
                <span>Nghiên cứu có thử nghiệm thuốc mới, thiết bị y tế mới?</span>
              </label>
              
              <div className="pt-2">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${isEthicsRequired ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}>
                  {isEthicsRequired ? 'Yêu cầu Hội đồng Đạo đức thẩm định' : 'Không thuộc diện thẩm định đạo đức'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Tải lên Hồ sơ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">III. Tải lên Hồ sơ đính kèm</h2>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div className="max-w-sm">
              <label className="font-bold text-slate-700 block mb-1.5">Loại tài liệu tải lên:</label>
              <select
                value={selectedUploadDocType}
                onChange={(e) => setSelectedUploadDocType(e.target.value as DocumentType)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value="DETAILED_OUTLINE">Thuyết minh đề cương chi tiết (BM2)</option>
                <option value="BUDGET_ESTIMATE">Bản dự toán kinh phí chi tiết (BM3)</option>
                <option value="ETHICS_DOSSIER">Hồ sơ thẩm định đạo đức y sinh</option>
                <option value="OTHER">Tài liệu phụ trợ khác</option>
              </select>
            </div>

            <label className="border-2 border-dashed border-slate-300 hover:border-[#0A6EBD] bg-slate-50/50 hover:bg-sky-50/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition">
              <input type="file" className="hidden" onChange={handleFileUploadSimulate} />
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <p className="font-bold text-slate-800">Kéo thả tài liệu vào đây hoặc <span className="text-[#0A6EBD]">click để tải lên</span></p>
              <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ: PDF, DOCX, XLSX (Tối đa 25MB)</p>
            </label>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-4">
                <span className="font-bold text-slate-700 block">Danh sách tài liệu:</span>
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#0A6EBD]" />
                      <div>
                        <p className="font-bold text-slate-800">{file.name}</p>
                        <span className="text-[10px] text-slate-400">{file.size}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveFile(file.id)} className="text-slate-400 hover:text-rose-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href="/my-projects"
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
        >
          Hủy bỏ
        </Link>
        <button
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold shadow-md transition"
        >
          <CheckCircle2 className="w-4 h-4" />
          Nộp Thuyết minh Đề cương
        </button>
      </div>
    </div>
  );
}
