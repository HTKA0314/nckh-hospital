'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { ProjectMilestone, ProgressReport, ProgressReportStatus, MilestoneStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { 
  ArrowLeft,
  Activity,
  Plus,
  AlertCircle,
  Calendar,
  Upload,
  Paperclip,
  CheckCircle2,
  X,
} from 'lucide-react';

const ALLOWED_REPORT_EXTENSIONS = ['doc', 'docx', 'pdf'];
const MAX_REPORT_FILE_SIZE_MB = 20;

export default function ProjectProgressPage({ params }: { params: { id: string } }) {
  const project = repo.getProjectById(params.id);
  const workflowPolicy = project?.workflowPolicyId
    ? repo.getPolicyById(project.workflowPolicyId)
    : undefined;

  const reportingIntervalMonths = workflowPolicy?.reportingIntervalMonths ?? 3;
  const progressDocumentRequired =
    workflowPolicy?.requiredDocumentsByStep?.[9]?.some(
      (document) => document.required
    ) ?? false;

  const { currentUser } = useAuth();
  const { success, warning, confirm } = useToast();

  const [milestones, setMilestones] = useState<ProjectMilestone[]>(() => project?.milestones || []);
  const [reports, setReports] = useState<ProgressReport[]>(() => project?.progressReports || []);

  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    targetDate: '',
    weightPercentage: 20,
    deliverables: '',
  });

  const [showAddReport, setShowAddReport] = useState(false);
  const [newReport, setNewReport] = useState({
    period: `Báo cáo tiến độ định kỳ ${reportingIntervalMonths} tháng`,
    workCompleted: '',
    resultsAchieved: '',
    reportedCompletionPercentage: 50,
    nextPlan: '',
  });
  const [reportFile, setReportFile] = useState<File | null>(null);

  const [selectedReport, setSelectedReport] = useState<ProgressReport | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  if (!project) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200 max-w-xl mx-auto my-8 text-xs">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</h2>
        <Link href="/projects" className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A6EBD] text-white rounded-lg font-bold shadow-2xs">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục đề tài
        </Link>
      </div>
    );
  }

  const isPrincipalInvestigator =
    currentUser.role === 'RESEARCHER' &&
    currentUser.id === project.principalInvestigatorId;

  const canSubmitProgress =
    isPrincipalInvestigator &&
    project.status === 'IN_PROGRESS';

  const canManageProgress =
    currentUser.role === 'RESEARCH_OFFICE' &&
    (project.status === 'IN_PROGRESS' || project.status === 'EXTENSION_REQUESTED');

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageProgress) {
      warning('Bạn không có quyền lập mốc tiến độ cho đề tài này.');
      return;
    }
    if (!newMilestone.title || !newMilestone.targetDate) {
      warning('Vui lòng điền đầy đủ thông tin mốc kiểm tra.');
      return;
    }

    const currentTotalWeight = milestones.reduce(
      (total, milestone) => total + Number(milestone.weightPercentage || 0),
      0
    );

    if (currentTotalWeight + Number(newMilestone.weightPercentage) > 100) {
      warning(
        `Tổng trọng số các mốc không được vượt quá 100%. Hiện đã có ${currentTotalWeight}%.`
      );
      return;
    }

    const milestone: ProjectMilestone = {
      id: `ms-${Date.now()}`,
      projectId: project.id,
      title: newMilestone.title,
      description: newMilestone.description,
      targetDate: newMilestone.targetDate,
      weightPercentage: Number(newMilestone.weightPercentage),
      status: 'NOT_STARTED',
      deliverables: newMilestone.deliverables,
      completionPercentage: 0,
    };

    const updatedMilestones = [...milestones, milestone];
    repo.updateProject(project.id, { milestones: updatedMilestones });
    setMilestones(updatedMilestones);
    setShowAddMilestone(false);
    success('Đã thêm mốc tiến độ kiểm tra thành công!');

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'ADD_MILESTONE',
      entityType: 'MILESTONE',
      entityId: milestone.id,
      notes: `Thêm mốc tiến độ: ${milestone.title} (Hạn: ${milestone.targetDate})`,
    });
  };

  const validateReportFile = (selectedFile: File): string | null => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!extension || !ALLOWED_REPORT_EXTENSIONS.includes(extension)) {
      return 'Tệp báo cáo chỉ hỗ trợ định dạng DOC, DOCX hoặc PDF.';
    }

    const fileSizeMb = selectedFile.size / 1024 / 1024;
    if (fileSizeMb > MAX_REPORT_FILE_SIZE_MB) {
      return `Dung lượng tệp không được vượt quá ${MAX_REPORT_FILE_SIZE_MB} MB.`;
    }

    return null;
  };

  const handleReportFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setReportFile(null);
      return;
    }

    const validationMessage = validateReportFile(selectedFile);
    if (validationMessage) {
      warning(validationMessage);
      event.target.value = '';
      setReportFile(null);
      return;
    }

    setReportFile(selectedFile);
  };

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitProgress) {
      warning('Chỉ Chủ nhiệm đề tài đang thực hiện mới được nộp báo cáo tiến độ.');
      return;
    }

    if (!newReport.workCompleted.trim() || !newReport.resultsAchieved.trim() || !newReport.nextPlan.trim()) {
      warning('Vui lòng nhập đầy đủ nội dung báo cáo tiến độ.');
      return;
    }

    if (
      newReport.reportedCompletionPercentage < 0 ||
      newReport.reportedCompletionPercentage > 100
    ) {
      warning('Tỷ lệ hoàn thành phải nằm trong khoảng từ 0% đến 100%.');
      return;
    }

    if (progressDocumentRequired && !reportFile) {
      warning('Vui lòng đính kèm tệp báo cáo tiến độ theo yêu cầu của quy trình.');
      return;
    }

    if (reportFile) {
      const validationMessage = validateReportFile(reportFile);
      if (validationMessage) {
        warning(validationMessage);
        return;
      }
    }

    const report: ProgressReport = {
      id: `pr-${Date.now()}`,
      projectId: project.id,
      period: newReport.period,
      reportingDate: new Date().toISOString(),
      workCompleted: newReport.workCompleted,
      resultsAchieved: newReport.resultsAchieved,
      reportedCompletionPercentage: Number(newReport.reportedCompletionPercentage),
      nextPlan: newReport.nextPlan,
      evidenceUrls: reportFile ? [{ name: reportFile.name, url: '#' }] : [],
      status: 'SUBMITTED',
    };

    const updatedReports = [report, ...reports];
    repo.updateProject(project.id, { progressReports: updatedReports });
    setReports(updatedReports);
    setShowAddReport(false);
    setReportFile(null);
    setNewReport({
      period: `Báo cáo tiến độ định kỳ ${reportingIntervalMonths} tháng`,
      workCompleted: '',
      resultsAchieved: '',
      reportedCompletionPercentage: Number(report.reportedCompletionPercentage),
      nextPlan: '',
    });
    success('Đã nộp báo cáo tiến độ thành công! Đang chờ Phòng NCKH thẩm định.');

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'SUBMIT_PROGRESS_REPORT',
      entityType: 'PROJECT',
      entityId: project.id,
      notes: `Nộp báo cáo tiến độ kỳ: ${report.period} (${report.reportedCompletionPercentage}% hoàn thành)`,
    });
  };

  const handleReceiveReport = () => {
    if (!selectedReport || !canManageProgress || selectedReport.status !== 'SUBMITTED') return;

    const updatedReports = reports.map((report) =>
      report.id === selectedReport.id
        ? {
            ...report,
            status: 'UNDER_REVIEW' as ProgressReportStatus,
            reviewedBy: currentUser.fullName,
            reviewedAt: new Date().toISOString(),
          }
        : report
    );

    repo.updateProject(project.id, { progressReports: updatedReports });
    setReports(updatedReports);
    setSelectedReport({
      ...selectedReport,
      status: 'UNDER_REVIEW',
      reviewedBy: currentUser.fullName,
      reviewedAt: new Date().toISOString(),
    });

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'RECEIVE_PROGRESS_REPORT',
      entityType: 'PROJECT',
      entityId: project.id,
      notes: `Tiếp nhận báo cáo tiến độ kỳ ${selectedReport.period} để đánh giá.`,
    });

    success('Đã tiếp nhận báo cáo và chuyển sang trạng thái đang đánh giá.');
  };

  const handleReviewReport = (status: 'APPROVED' | 'REVISION_REQUIRED' | 'SCREENING_FAILED') => {
    if (!selectedReport || !canManageProgress || selectedReport.status !== 'UNDER_REVIEW') return;

    if (status !== 'APPROVED' && !reviewComment.trim()) {
      warning('Vui lòng nhập ý kiến xử lý trước khi yêu cầu sửa đổi hoặc từ chối.');
      return;
    }

    confirm({
      title: status === 'APPROVED' ? 'Duyệt báo cáo tiến độ' : status === 'SCREENING_FAILED' ? 'Từ chối báo cáo tiến độ' : 'Yêu cầu sửa đổi báo cáo',
      message: `Bạn chắc chắn muốn đánh giá báo cáo này là "${status === 'APPROVED' ? 'Đạt' : status === 'SCREENING_FAILED' ? 'Không đạt' : 'Cần sửa đổi'}"?`,
      confirmLabel: 'Xác nhận',
      type: status === 'APPROVED' ? 'info' : 'danger',
      onConfirm: () => {
        const updatedReports = reports.map((r) => {
          if (r.id === selectedReport.id) {
            return {
              ...r,
              status: status as ProgressReportStatus,
              reviewComment,
              reviewedBy: currentUser.fullName,
              reviewedAt: new Date().toISOString(),
            };
          }
          return r;
        });

        const projectProgress = status === 'APPROVED' ? selectedReport.reportedCompletionPercentage : (project.reportedProgressPercentage ?? 0);

        repo.updateProject(project.id, { 
          progressReports: updatedReports,
          reportedProgressPercentage: projectProgress
        });
        setReports(updatedReports);
        setSelectedReport(null);
        setReviewComment('');
        success('Đã cập nhật đánh giá báo cáo tiến độ thành công!');

        repo.addAuditLog({
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          actionCode: `REVIEW_PROGRESS_${status}`,
          entityType: 'PROJECT',
          entityId: project.id,
          notes: `Đánh giá báo cáo tiến độ kỳ ${selectedReport.period}: ${status}. Nhận xét: ${reviewComment}`,
        });
      }
    });
  };

  const getMilestoneStatusBadge = (status: MilestoneStatus) => {
    switch (status) {
      case 'NOT_STARTED':
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">Chưa bắt đầu</span>;
      case 'IN_PROGRESS':
        return <span className="bg-sky-50 text-[#0A6EBD] text-[10px] font-bold px-2 py-0.5 rounded border border-sky-200">Đang thực hiện</span>;
      case 'SUBMITTED':
        return <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">Đã nộp báo cáo</span>;
      case 'VERIFIED':
        return <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">Đã xác nhận</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">Hoàn thành</span>;
      case 'OVERDUE':
        return <span className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200">Trễ hạn</span>;
      default:
        return null;
    }
  };

  const getReportStatusBadge = (status: ProgressReportStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">Nháp</span>;
      case 'SUBMITTED':
        return <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">Chờ duyệt</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">Đang đánh giá</span>;
      case 'APPROVED':
        return <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">Đạt</span>;
      case 'REVISION_REQUIRED':
        return <span className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200">Cần sửa đổi</span>;
      case 'SCREENING_FAILED':
        return <span className="bg-rose-100 text-rose-900 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-300">Không đạt</span>;
    }
  };

  const milestoneColumns: ColumnDef<ProjectMilestone>[] = [
    {
      key: 'title',
      header: 'Tên Mốc',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 leading-snug">{row.title}</p>
          <span className="text-[11px] text-slate-500 font-medium line-clamp-1">{row.description}</span>
        </div>
      ),
    },
    {
      key: 'targetDate',
      header: 'Hạn hoàn thành',
      render: (row) => <span className="font-mono text-slate-500 text-xs">{formatDate(row.targetDate)}</span>,
    },
    {
      key: 'weightPercentage',
      header: 'Trọng số',
      render: (row) => <span className="font-mono font-bold text-slate-800 text-xs">{row.weightPercentage}%</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => getMilestoneStatusBadge(row.status),
    },
  ];

  const reportColumns: ColumnDef<ProgressReport>[] = [
    {
      key: 'period',
      header: 'Kỳ báo cáo',
      render: (row) => <span className="font-bold text-slate-900">{row.period}</span>,
    },
    {
      key: 'reportingDate',
      header: 'Ngày nộp',
      render: (row) => (
        <span className="font-mono text-slate-500 text-xs">
          {formatDate(row.reportingDate)}
        </span>
      ),
    },
    {
      key: 'reportedCompletionPercentage',
      header: '% Hoàn thành',
      render: (row) => (
        <span className="font-mono font-bold text-[#0A6EBD] text-xs">
          {row.reportedCompletionPercentage}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Kết quả đánh giá',
      render: (row) => getReportStatusBadge(row.status),
    },
  ];

  return (
    <div className="w-full space-y-4 pb-12 text-slate-800 text-xs">
      <PageHeader
        title="Theo dõi tiến độ"
        description={`Mã đề tài: ${project.projectCode || project.proposalCode} • ${project.title}`}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại chi tiết đề tài
            </Link>
            {canSubmitProgress && (
              <button
                onClick={() => setShowAddReport(true)}
                className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Báo cáo tiến độ
              </button>
            )}
            {canManageProgress && (
              <button
                onClick={() => setShowAddMilestone(true)}
                className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Lập mốc kiểm tra
              </button>
            )}
          </div>
        }
      />

      {/* Progress Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block select-none">Tiến độ tổng thể</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl font-extrabold text-[#0A6EBD] font-mono">{project.reportedProgressPercentage ?? 0}%</span>
            <span className="text-xs text-slate-400 font-semibold">hoàn thành</span>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold mb-1.5 select-none">
            <span>Mức độ hoàn thành mục tiêu</span>
            <span>Kế hoạch 100%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-[#0A6EBD] h-2.5 rounded-full transition-all duration-500" style={{ width: `${project.reportedProgressPercentage ?? 0}%` }} />
          </div>
        </div>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Workspace 1: Milestones List */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 select-none">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Kế hoạch mốc tiến độ</span>
          </h3>
          <DataTable
            columns={milestoneColumns}
            data={milestones}
            rowKey={(row) => row.id}
            emptyTitle="Chưa có mốc tiến độ"
            emptyDescription="Chưa lập mốc kiểm tra chính thức cho đề tài này."
          />
        </div>

        {/* Workspace 2: Progress Reports */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 select-none">
            <Activity className="w-4 h-4 text-slate-500" />
            <span>Báo cáo tiến độ đã nộp</span>
          </h3>
          <DataTable
            columns={reportColumns}
            data={reports}
            rowKey={(row) => row.id}
            onRowClick={(row) => setSelectedReport(row)}
            emptyTitle="Chưa có báo cáo nào"
            emptyDescription="Chủ nhiệm đề tài chưa nộp báo cáo tiến độ định kỳ."
          />
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleAddMilestone}>
              <div className="px-5 py-4 border-b border-slate-100 bg-[#0B2A63] text-white flex justify-between items-center select-none">
                <h3 className="font-bold text-sm">Lập mốc tiến độ kiểm tra mới</h3>
                <button type="button" onClick={() => setShowAddMilestone(false)} className="text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>
              <div className="p-5 space-y-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên mốc kiểm tra *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:border-[#0A6EBD] outline-none"
                    placeholder="Ví dụ: Hoàn thành thu thập 60 mẫu bệnh phẩm"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hạn hoàn thành (Target Date) *</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:border-[#0A6EBD] outline-none"
                    value={newMilestone.targetDate}
                    onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trọng số (%)</label>
                    <input
                      type="number"
                      max={100}
                      min={10}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:border-[#0A6EBD] outline-none font-mono"
                      value={newMilestone.weightPercentage}
                      onChange={(e) => setNewMilestone({ ...newMilestone, weightPercentage: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sản phẩm bàn giao yêu cầu</label>
                  <textarea
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:border-[#0A6EBD] outline-none resize-none"
                    placeholder="Mô tả sản phẩm minh chứng..."
                    value={newMilestone.deliverables}
                    onChange={(e) => setNewMilestone({ ...newMilestone, deliverables: e.target.value })}
                  />
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 select-none">
                <button type="button" onClick={() => setShowAddMilestone(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer">Hủy</button>
                <button type="submit" className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-xl shadow-2xs cursor-pointer">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Report Modal */}
      {showAddReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleAddReport}>
              <div className="px-5 py-4 border-b border-slate-100 bg-[#0B2A63] text-white flex justify-between items-center select-none">
                <h3 className="font-bold text-sm">Nộp báo cáo tiến độ đề tài</h3>
                <button type="button" onClick={() => setShowAddReport(false)} className="text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>
              <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kỳ báo cáo *</label>
                  <p className="mb-1.5 text-[11px] text-slate-500">
                    Chu kỳ theo chính sách áp dụng: {reportingIntervalMonths} tháng/lần.
                  </p>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:border-[#0A6EBD] outline-none"
                    placeholder="Ví dụ: Báo cáo tiến độ 6 tháng lần 1"
                    value={newReport.period}
                    onChange={(e) => setNewReport({ ...newReport, period: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">% Tiến độ hoàn thành thực tế</label>
                    <input
                      type="number"
                      max={100}
                      min={0}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:border-[#0A6EBD] outline-none font-mono"
                      value={newReport.reportedCompletionPercentage}
                      onChange={(e) => setNewReport({ ...newReport, reportedCompletionPercentage: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tệp báo cáo {progressDocumentRequired ? '*' : '(không bắt buộc)'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".doc,.docx,.pdf"
                        onChange={handleReportFileChange}
                        className="hidden"
                        id="progress-upload"
                      />
                      <label
                        htmlFor="progress-upload"
                        className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition"
                      >
                        <Upload className="w-3.5 h-3.5 inline mr-1" /> Chọn file
                      </label>
                      <span className="text-slate-500 truncate max-w-[150px]">
                        {reportFile
                          ? `${reportFile.name} (${(reportFile.size / 1024 / 1024).toFixed(2)} MB)`
                          : `DOC/DOCX/PDF, tối đa ${MAX_REPORT_FILE_SIZE_MB} MB`}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Công việc đã thực hiện *</label>
                  <textarea
                    rows={2}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:border-[#0A6EBD] outline-none resize-none"
                    value={newReport.workCompleted}
                    onChange={(e) => setNewReport({ ...newReport, workCompleted: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kết quả đạt được *</label>
                  <textarea
                    rows={2}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:border-[#0A6EBD] outline-none resize-none"
                    value={newReport.resultsAchieved}
                    onChange={(e) => setNewReport({ ...newReport, resultsAchieved: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kế hoạch giai đoạn tiếp theo *</label>
                  <textarea
                    rows={2}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:border-[#0A6EBD] outline-none resize-none"
                    value={newReport.nextPlan}
                    onChange={(e) => setNewReport({ ...newReport, nextPlan: e.target.value })}
                  />
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 select-none">
                <button type="button" onClick={() => setShowAddReport(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer">Hủy</button>
                <button type="submit" className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-xl shadow-2xs cursor-pointer">Nộp báo cáo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Report Drawer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelectedReport(null)} />
          <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100 bg-[#0B2A63] text-white">
              <h3 className="font-bold text-sm">Chi tiết báo cáo tiến độ</h3>
              <button onClick={() => setSelectedReport(null)} className="text-white/80 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Kỳ báo cáo:</span>
                  <strong className="text-slate-800">{selectedReport.period}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Tiến độ báo cáo:</span>
                  <strong className="text-[#0A6EBD] font-mono">{selectedReport.reportedCompletionPercentage}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Ngày nộp:</span>
                  <strong className="text-slate-800 font-mono">{formatDate(selectedReport.reportingDate)}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-1">Công việc đã thực hiện</h4>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium leading-relaxed">{selectedReport.workCompleted}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-1">Kết quả đạt được</h4>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium leading-relaxed">{selectedReport.resultsAchieved}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-1">Kế hoạch tiếp theo</h4>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium leading-relaxed">{selectedReport.nextPlan}</p>
              </div>

              {selectedReport.evidenceUrls && selectedReport.evidenceUrls.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-1">File báo cáo đính kèm</h4>
                  <div className="flex items-center gap-1.5 p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedReport.evidenceUrls[0].name}</span>
                  </div>
                </div>
              )}

              {selectedReport.status === 'UNDER_REVIEW' && canManageProgress && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide">Ý kiến đánh giá chuyên môn *</label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:border-[#0A6EBD] outline-none resize-none"
                    placeholder="Nhập nhận xét hoặc lý do yêu cầu sửa đổi..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setSelectedReport(null)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">Đóng</button>
              {selectedReport.status === 'SUBMITTED' && canManageProgress && (
                <button
                  onClick={handleReceiveReport}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-lg cursor-pointer transition shadow-2xs"
                >
                  Tiếp nhận đánh giá
                </button>
              )}

              {selectedReport.status === 'UNDER_REVIEW' && canManageProgress && (
                <>
                  <button
                    onClick={() => handleReviewReport('SCREENING_FAILED')}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer shadow-2xs transition"
                  >
                    Không đạt
                  </button>
                  <button
                    onClick={() => handleReviewReport('REVISION_REQUIRED')}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer shadow-2xs transition"
                  >
                    Yêu cầu sửa
                  </button>
                  <button
                    onClick={() => handleReviewReport('APPROVED')}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer shadow-2xs transition"
                  >
                    Duyệt Đạt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}