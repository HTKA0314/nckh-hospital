'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  CircleAlert,
  Eye,
  FileText,
  History,
  Search,
  Send,
  ShieldCheck,
  User,
  X,
  Award,
  Calendar,
  Building2,
  Download,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  AuditLog,
  EthicsStatus,
  ProjectDocument,
  ResearchProject,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';

type EthicsFilter =
  | 'ALL'
  | 'SCREENING_IN_PROGRESS'
  | 'DOSSIER_SUBMITTED'
  | 'UNDER_ETHICS_REVIEW'
  | 'ETHICS_REVISION_REQUIRED'
  | 'ETHICS_APPROVED';

type DetailTab = 'OVERVIEW' | 'DOCUMENTS' | 'HISTORY';

const FILTERS: Array<{ id: EthicsFilter; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'SCREENING_IN_PROGRESS', label: 'Đang sàng lọc' },
  { id: 'DOSSIER_SUBMITTED', label: 'Chờ tiếp nhận' },
  { id: 'UNDER_ETHICS_REVIEW', label: 'Đang thẩm định' },
  { id: 'ETHICS_REVISION_REQUIRED', label: 'Cần bổ sung' },
  { id: 'ETHICS_APPROVED', label: 'Đã chấp thuận' },
];

export default function EthicsWorkspacePage() {
  const { currentUser } = useAuth();
  const { success, warning, error, info } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [filter, setFilter] = useState<EthicsFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [detailTab, setDetailTab] = useState<DetailTab>('OVERVIEW');
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [irbDecisionNumber, setIrbDecisionNumber] = useState('');
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const canProcess = currentUser?.role === 'ETHICS_OFFICE' || currentUser?.role === 'ADMIN';
  const canView =
    canProcess ||
    currentUser?.role === 'RESEARCH_OFFICE' ||
    currentUser?.role === 'DIRECTOR';

  const ethicsProjects = useMemo(
    () => repo.getEthicsProjects(),
    [dataVersion]
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ethicsProjects.filter((project) => {
      if (filter !== 'ALL' && project.ethicsStatus !== filter) {
        return false;
      }

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
  }, [ethicsProjects, filter, search]);

  useEffect(() => {
    if (filteredProjects.length === 0) {
      setSelectedProjectId('');
      return;
    }

    if (
      !filteredProjects.some(
        (project) => project.id === selectedProjectId
      )
    ) {
      setSelectedProjectId(filteredProjects[0].id);
      setDetailTab('OVERVIEW');
      setShowRevisionBox(false);
      setRevisionNote('');
    }
  }, [filteredProjects, selectedProjectId]);

  const selectedProject =
    filteredProjects.find(
      (project) => project.id === selectedProjectId
    ) || null;

  const selectedApproval = selectedProject
    ? repo.getEthicsApprovalByProjectId(selectedProject.id)
    : undefined;

  const selectedDocuments: ProjectDocument[] = selectedProject
    ? repo
        .getProjectDocuments(selectedProject.id)
        .filter(
          (document) =>
            document.documentType === 'ETHICS_DOSSIER' ||
            document.documentType === 'ETHICS_ICF'
        )
    : [];

  const selectedHistory: AuditLog[] = selectedProject
    ? repo.getAuditLogs({
        entityType: 'ETHICS',
        entityId: selectedApproval?.id,
      })
    : [];

  const statusCounts = useMemo(() => {
    const count = (status: EthicsStatus) =>
      ethicsProjects.filter(
        (project) => project.ethicsStatus === status
      ).length;

    return {
      ALL: ethicsProjects.length,
      SCREENING_IN_PROGRESS: count('SCREENING_IN_PROGRESS'),
      DOSSIER_SUBMITTED: count('DOSSIER_SUBMITTED'),
      UNDER_ETHICS_REVIEW: count('UNDER_ETHICS_REVIEW'),
      ETHICS_REVISION_REQUIRED: count('ETHICS_REVISION_REQUIRED'),
      ETHICS_APPROVED: count('ETHICS_APPROVED'),
    };
  }, [ethicsProjects]);

  const transitionEthicsStatus = (
    project: ResearchProject,
    nextStatus: EthicsStatus,
    notes: string,
    decisionNo?: string
  ) => {
    if (!currentUser || !canProcess) {
      warning('Bạn không có quyền xử lý hồ sơ đạo đức.');
      return false;
    }

    const updated = repo.transitionEthicsStatus(
      project.id,
      nextStatus,
      currentUser.id,
      notes
    );

    if (decisionNo && selectedApproval) {
      const now = new Date().toISOString();
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      repo.updateEthicsApproval(selectedApproval.id, {
        decisionNumber: decisionNo,
        approvalDate: now.slice(0, 10),
        expiryDate: expiry.toISOString().slice(0, 10),
        status: 'ETHICS_APPROVED',
      });
    }

    if (!updated) {
      error(
        'Không thể chuyển trạng thái. Kiểm tra lại trạng thái hiện tại và hồ sơ EthicsApproval.'
      );
      return false;
    }

    setDataVersion((value) => value + 1);
    success('Đã cập nhật trạng thái hồ sơ đạo đức thành công.');
    return true;
  };

  const handleReceiveDossier = () => {
    if (!selectedProject) return;

    if (selectedProject.ethicsStatus !== 'DOSSIER_SUBMITTED') {
      warning('Chỉ tiếp nhận hồ sơ đã được nộp.');
      return;
    }

    transitionEthicsStatus(
      selectedProject,
      'UNDER_ETHICS_REVIEW',
      'Tiếp nhận hồ sơ đạo đức và chuyển sang thẩm định chuyên môn.'
    );
  };

  const handleRequestRevision = () => {
    if (!selectedProject) return;

    if (selectedProject.ethicsStatus !== 'UNDER_ETHICS_REVIEW') {
      warning('Chỉ có thể yêu cầu bổ sung khi hồ sơ đang được thẩm định.');
      return;
    }

    if (!revisionNote.trim()) {
      warning('Vui lòng nhập nội dung cần bổ sung.');
      return;
    }

    const updated = transitionEthicsStatus(
      selectedProject,
      'ETHICS_REVISION_REQUIRED',
      `Yêu cầu bổ sung hồ sơ đạo đức: ${revisionNote.trim()}`
    );

    if (updated) {
      setShowRevisionBox(false);
      setRevisionNote('');
    }
  };

  const handleConfirmApprove = () => {
    if (!selectedProject) return;
    if (!irbDecisionNumber.trim()) {
      warning('Vui lòng nhập Số Giấy chứng nhận Đạo đức Y sinh.');
      return;
    }

    transitionEthicsStatus(
      selectedProject,
      'ETHICS_APPROVED',
      `Hồ sơ đạo đức đã được chấp thuận theo Giấy chứng nhận số ${irbDecisionNumber.trim()}`,
      irbDecisionNumber.trim()
    );

    setShowApproveModal(false);
    setIrbDecisionNumber('');
  };

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500 text-xs">Đang tải Workspace Đạo đức Y sinh...</div>;
  }

  if (!canView) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-xs">
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-2xs">
          <ShieldCheck className="mx-auto h-9 w-9 text-slate-300" />
          <h1 className="mt-3 text-sm font-bold text-slate-900">
            Không có quyền truy cập Workspace Đạo đức
          </h1>
          <p className="mt-1 text-slate-500">
            Nghiên cứu viên theo dõi hồ sơ đạo đức trực tiếp từ trang Chi tiết đề tài.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 pb-12 text-slate-800 text-xs">
      <PageHeader
        title="Đạo đức nghiên cứu Y sinh (IRB)"
        description="Hàng đợi tiếp nhận, thẩm định chuyên môn và cấp Chứng nhận Đạo đức theo Thông tư 43/2024/TT-BYT."
      />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {/* Thanh Filter Tabs & Search */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 p-3 bg-slate-50/50">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto select-none">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setFilter(item.id);
                  setDetailTab('OVERVIEW');
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  filter === item.id
                    ? 'border-sky-200 bg-sky-50 text-[#0A6EBD] shadow-2xs'
                    : 'border-transparent text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  filter === item.id ? 'bg-[#0A6EBD] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {statusCounts[item.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã, tên đề tài, chủ nhiệm..."
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-8 text-xs outline-none focus:border-[#0A6EBD] font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bố cục Split Panel: Danh sách bên trái, Chi tiết bên phải */}
        <div className="grid min-h-[650px] grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* CỘT TRÁI: DANH SÁCH ĐỀ TÀI */}
          <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r bg-slate-50/30">
            <div className="border-b border-slate-200 bg-slate-100/60 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Hồ sơ đạo đức ({filteredProjects.length})
              </span>
            </div>

            <div className="max-h-[650px] overflow-y-auto divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <FileText className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    Không có hồ sơ phù hợp.
                  </p>
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const selected = selectedProject?.id === project.id;

                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setDetailTab('OVERVIEW');
                        setShowRevisionBox(false);
                        setRevisionNote('');
                      }}
                      className={`block w-full border-l-4 p-3.5 text-left transition cursor-pointer ${
                        selected
                          ? 'border-l-[#0A6EBD] bg-sky-50/70 shadow-2xs'
                          : 'border-l-transparent hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#0A6EBD]">
                          {project.projectCode || project.proposalCode || '—'}
                        </span>
                        <StatusBadge status={project.ethicsStatus} />
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-snug text-slate-900">
                        {project.title}
                      </p>

                      <p className="mt-1 truncate text-[11px] text-slate-500 font-medium">
                        Chủ nhiệm: <strong className="text-slate-700">{project.principalInvestigatorName}</strong>
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* CỘT PHẢI: CHI TIẾT & THAO TÁC THẨM ĐỊNH */}
          <main className="min-w-0 bg-white flex flex-col">
            {!selectedProject ? (
              <EmptySelection />
            ) : (
              <>
                <div className="border-b border-slate-200 p-5 bg-white">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0A6EBD] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                          {selectedProject.projectCode || selectedProject.proposalCode || '—'}
                        </span>
                        <StatusBadge status={selectedProject.ethicsStatus} />
                      </div>

                      <h2 className="mt-2 text-sm md:text-base font-bold leading-snug text-slate-900">
                        {selectedProject.title}
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          Chủ nhiệm: <strong className="text-slate-800">{selectedProject.principalInvestigatorName}</strong>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {selectedProject.departmentName || '—'}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/projects/${selectedProject.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Xem đề tài
                    </Link>
                  </div>

                  {/* Tab bar chi tiết */}
                  <div className="mt-4 flex gap-1 border-b border-slate-200 select-none">
                    {[
                      { id: 'OVERVIEW', label: 'Thông tin thẩm định' },
                      { id: 'DOCUMENTS', label: `Hồ sơ đính kèm (${selectedDocuments.length})` },
                      { id: 'HISTORY', label: 'Lịch sử xử lý' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDetailTab(tab.id as DetailTab)}
                        className={`border-b-2 px-4 py-2 text-xs font-bold transition cursor-pointer ${
                          detailTab === tab.id
                            ? 'border-[#0A6EBD] text-[#0A6EBD]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 flex-1 overflow-y-auto">
                  {detailTab === 'OVERVIEW' && (
                    <OverviewTab
                      project={selectedProject}
                      approval={selectedApproval}
                      canProcess={canProcess}
                      showRevisionBox={showRevisionBox}
                      revisionNote={revisionNote}
                      onRevisionNoteChange={setRevisionNote}
                      onShowRevision={() => setShowRevisionBox(true)}
                      onCancelRevision={() => {
                        setShowRevisionBox(false);
                        setRevisionNote('');
                      }}
                      onReceive={handleReceiveDossier}
                      onRequestRevision={handleRequestRevision}
                      onApprove={() => {
                        setIrbDecisionNumber(`IRB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
                        setShowApproveModal(true);
                      }}
                    />
                  )}

                  {detailTab === 'DOCUMENTS' && (
                    <DocumentsTab documents={selectedDocuments} />
                  )}

                  {detailTab === 'HISTORY' && (
                    <HistoryTab history={selectedHistory} />
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </section>

      {/* ── MODAL CHẤP THUẬN & CẤP SỐ CHỨNG NHẬN ĐẠO ĐỨC ── */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex justify-between items-center border-b pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                Cấp Giấy chứng nhận Chấp thuận Đạo đức
              </h3>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100 text-emerald-900">
                <span className="font-bold block">Đề tài thẩm định:</span>
                <p className="mt-0.5 line-clamp-2">{selectedProject?.title}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Quyết định / Giấy chứng nhận IRB *</label>
                <input
                  type="text"
                  value={irbDecisionNumber}
                  onChange={(e) => setIrbDecisionNumber(e.target.value)}
                  placeholder="Ví dụ: IRB-2026-156"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs outline-none focus:border-[#0A6EBD]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer transition"
              >
                Xác nhận phê duyệt & Cấp số
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({
  project,
  approval,
  canProcess,
  showRevisionBox,
  revisionNote,
  onRevisionNoteChange,
  onShowRevision,
  onCancelRevision,
  onReceive,
  onRequestRevision,
  onApprove,
}: {
  project: ResearchProject;
  approval: ReturnType<typeof repo.getEthicsApprovalByProjectId>;
  canProcess: boolean;
  showRevisionBox: boolean;
  revisionNote: string;
  onRevisionNoteChange: (value: string) => void;
  onShowRevision: () => void;
  onCancelRevision: () => void;
  onReceive: () => void;
  onRequestRevision: () => void;
  onApprove: () => void;
}) {
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoItem
          label="Yêu cầu Đạo đức (IRB)"
          value={project.ethicsRequired ? 'Bắt buộc thẩm định' : 'Miễn thẩm định'}
        />
        <InfoItem
          label="Trạng thái hồ sơ"
          value={<StatusBadge status={project.ethicsStatus} />}
        />
        <InfoItem
          label="Phân loại thẩm định"
          value={formatReviewType(approval?.reviewType)}
        />
        <InfoItem
          label="Số Giấy chứng nhận"
          value={<span className="font-mono font-bold text-[#0A6EBD]">{approval?.decisionNumber || 'Chưa cấp'}</span>}
        />
        <InfoItem
          label="Ngày phê duyệt"
          value={<span className="font-mono">{approval?.approvalDate || '—'}</span>}
        />
        <InfoItem
          label="Thời hạn hiệu lực"
          value={<span className="font-mono text-emerald-700 font-bold">{approval?.expiryDate || '—'}</span>}
        />
      </section>

      {/* Sàng lọc nguy cơ đạo đức */}
      {approval?.screeningAnswers && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Kết quả sàng lọc tiêu chí Đạo đức Y sinh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-medium text-slate-700">
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className={approval.screeningAnswers.involvesHumanSubjects ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                {approval.screeningAnswers.involvesHumanSubjects ? '☒' : '☐'} Can thiệp trực tiếp người bệnh
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className={approval.screeningAnswers.involvesBiologicalSamples ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                {approval.screeningAnswers.involvesBiologicalSamples ? '☒' : '☐'} Thu thập mẫu bệnh phẩm
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className={approval.screeningAnswers.involvesIdentifiableData ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                {approval.screeningAnswers.involvesIdentifiableData ? '☒' : '☐'} Hồ sơ có dữ liệu định danh
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className={approval.screeningAnswers.involvesNewInterventionsOrDrugs ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                {approval.screeningAnswers.involvesNewInterventionsOrDrugs ? '☒' : '☐'} Thử nghiệm thuốc/thiết bị mới
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Trạng thái tóm tắt */}
      <section className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Đánh giá tiến trình thẩm định
          </h3>
        </div>
        <div className="p-4">
          <EthicsStatusSummary status={project.ethicsStatus} />
        </div>
      </section>

      {/* Thao tác nghiệp vụ Văn phòng IRB */}
      {canProcess && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Thao tác thẩm định Văn phòng Đạo đức
          </h3>

          <div className="flex flex-wrap gap-2">
            {project.ethicsStatus === 'SCREENING_IN_PROGRESS' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 font-medium">
                Hồ sơ đang ở bước sàng lọc. Chờ Nghiên cứu viên nộp hồ sơ đạo đức chính thức.
              </div>
            )}

            {project.ethicsStatus === 'DOSSIER_SUBMITTED' && (
              <button
                type="button"
                onClick={onReceive}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] px-4 py-2 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Tiếp nhận hồ sơ thẩm định
              </button>
            )}

            {project.ethicsStatus === 'UNDER_ETHICS_REVIEW' && (
              <>
                <button
                  type="button"
                  onClick={onShowRevision}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 shadow-2xs transition cursor-pointer"
                >
                  <CircleAlert className="h-4 w-4" />
                  Yêu cầu bổ sung hồ sơ
                </button>

                <button
                  type="button"
                  onClick={onApprove}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Chấp thuận & Cấp giấy chứng nhận
                </button>
              </>
            )}

            {project.ethicsStatus === 'ETHICS_REVISION_REQUIRED' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 font-medium">
                Đang chờ Chủ nhiệm đề tài bổ sung và nộp lại hồ sơ.
              </div>
            )}

            {project.ethicsStatus === 'ETHICS_APPROVED' && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Hồ sơ đã được Hội đồng Đạo đức chấp thuận đầy đủ.
              </div>
            )}
          </div>

          {showRevisionBox && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 space-y-2">
              <label
                htmlFor="revision-note"
                className="block text-xs font-bold text-rose-900 uppercase"
              >
                Nội dung yêu cầu chỉnh sửa / Bổ sung *
              </label>

              <textarea
                id="revision-note"
                value={revisionNote}
                onChange={(event) => onRevisionNoteChange(event.target.value)}
                rows={3}
                placeholder="Nêu rõ các điều khoản trong mẫu ICF hoặc quy trình thu thập mẫu cần bổ sung..."
                className="w-full resize-none rounded-lg border border-rose-200 bg-white p-2.5 text-xs outline-none focus:border-rose-400 font-medium"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCancelRevision}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={onRequestRevision}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-bold text-white shadow-2xs cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  Gửi yêu cầu bổ sung
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function DocumentsTab({ documents }: { documents: ProjectDocument[] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 p-8 text-center bg-slate-50/50">
        <FileText className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Chưa có tài liệu hồ sơ đạo đức đính kèm.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="divide-y divide-slate-100">
        {documents.map((document) => {
          const currentVersion = document.versions.find((v) => v.isCurrent) || document.versions[0];

          return (
            <div
              key={document.id}
              className="flex items-center justify-between gap-4 p-3.5 hover:bg-slate-50 transition"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900">
                  {document.title}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400 font-mono">
                  Phiên bản v{document.currentVersion}.0 • {currentVersion?.fileName || 'Tài liệu'}
                </p>
              </div>

              {currentVersion?.downloadUrl && currentVersion.downloadUrl !== '#' ? (
                <a
                  href={currentVersion.downloadUrl}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#0A6EBD] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về
                </a>
              ) : (
                <span className="text-slate-400 text-xs">Chưa có tệp</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryTab({ history }: { history: AuditLog[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 p-8 text-center bg-slate-50/50">
        <History className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Chưa ghi nhận lịch sử xử lý hồ sơ đạo đức.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="divide-y divide-slate-100">
        {history.map((item) => (
          <div key={item.id} className="p-3 hover:bg-slate-50 transition">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[#0A6EBD]">
                {item.actionCode}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {item.timestamp}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-slate-700">
              Người thực hiện: <strong>{item.userFullName}</strong>
            </p>
            {item.notes && (
              <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptySelection() {
  return (
    <div className="flex min-h-[500px] items-center justify-center p-8 text-center">
      <div>
        <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-2 text-xs font-bold text-slate-600">
          Chọn một hồ sơ ở danh sách bên trái để xem chi tiết và thẩm định.
        </p>
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
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-xs font-bold text-slate-900">{value}</div>
    </div>
  );
}

function EthicsStatusSummary({ status }: { status: EthicsStatus }) {
  if (status === 'SCREENING_IN_PROGRESS') {
    return (
      <StatusMessage
        tone="amber"
        title="Đang trong quá trình sàng lọc"
        description="Đang xác định mức độ rủi ro và diện thẩm định đạo đức Y sinh của nghiên cứu."
      />
    );
  }

  if (status === 'DOSSIER_SUBMITTED') {
    return (
      <StatusMessage
        tone="blue"
        title="Hồ sơ đạo đức đã được nộp"
        description="Chờ Văn phòng Hội đồng Đạo đức (IRB) kiểm tra tính hợp lệ và tiếp nhận thẩm định."
      />
    );
  }

  if (status === 'UNDER_ETHICS_REVIEW') {
    return (
      <StatusMessage
        tone="blue"
        title="Đang trong quá trình thẩm định chuyên môn"
        description="Hội đồng Đạo đức đang xem xét. Có thể yêu cầu bổ sung chỉnh sửa hoặc cấp Giấy chứng nhận chấp thuận."
      />
    );
  }

  if (status === 'ETHICS_REVISION_REQUIRED') {
    return (
      <StatusMessage
        tone="rose"
        title="Yêu cầu bổ sung / Hoàn thiện hồ sơ"
        description="Hồ sơ cần được Chủ nhiệm bổ sung, giải trình trước khi tiếp tục xem xét."
      />
    );
  }

  if (status === 'ETHICS_APPROVED') {
    return (
      <StatusMessage
        tone="emerald"
        title="Đã được Chấp thuận Đạo đức Y sinh"
        description="Đề tài đủ điều kiện đạo đức để tiến hành ban hành Quyết định giao thực hiện."
      />
    );
  }

  return (
    <StatusMessage
      tone="slate"
      title="Đang theo dõi"
      description="Không có yêu cầu thao tác trực tiếp ở trạng thái hiện tại."
    />
  );
}

function StatusMessage({
  tone,
  title,
  description,
}: {
  tone: 'amber' | 'blue' | 'rose' | 'emerald' | 'slate';
  title: string;
  description: string;
}) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    blue: 'border-sky-200 bg-sky-50 text-sky-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="text-xs font-bold">{title}</div>
      <div className="mt-0.5 text-[11px] leading-relaxed opacity-90 font-medium">{description}</div>
    </div>
  );
}

function formatReviewType(reviewType?: 'EXEMPT' | 'EXPEDITED' | 'FULL_BOARD') {
  if (reviewType === 'EXEMPT') return 'Miễn thẩm định';
  if (reviewType === 'EXPEDITED') return 'Thẩm định rút gọn';
  if (reviewType === 'FULL_BOARD') return 'Hội đồng đầy đủ';
  return '—';
}