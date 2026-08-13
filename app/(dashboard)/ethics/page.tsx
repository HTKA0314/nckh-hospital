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
  const { success, warning, error } = useToast();

  const [filter, setFilter] = useState<EthicsFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [detailTab, setDetailTab] = useState<DetailTab>('OVERVIEW');
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const canProcess = currentUser?.role === 'ETHICS_OFFICE';
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
            document.documentType === 'ETHICS_DOSSIER'
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
      ETHICS_REVISION_REQUIRED: count(
        'ETHICS_REVISION_REQUIRED'
      ),
      ETHICS_APPROVED: count('ETHICS_APPROVED'),
    };
  }, [ethicsProjects]);

  const transitionEthicsStatus = (
    project: ResearchProject,
    nextStatus: EthicsStatus,
    notes: string
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

    if (!updated) {
      error(
        'Không thể chuyển trạng thái. Kiểm tra lại trạng thái hiện tại và hồ sơ EthicsApproval.'
      );
      return false;
    }

    setDataVersion((value) => value + 1);
    success('Đã cập nhật trạng thái hồ sơ đạo đức.');
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
      'Tiếp nhận hồ sơ đạo đức và chuyển sang thẩm định.'
    );
  };

  const handleRequestRevision = () => {
    if (!selectedProject) return;

    if (selectedProject.ethicsStatus !== 'UNDER_ETHICS_REVIEW') {
      warning(
        'Chỉ có thể yêu cầu bổ sung khi hồ sơ đang được thẩm định.'
      );
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

  const handleApprove = () => {
    if (!selectedProject) return;

    if (selectedProject.ethicsStatus !== 'UNDER_ETHICS_REVIEW') {
      warning(
        'Chỉ có thể chấp thuận hồ sơ đang được thẩm định.'
      );
      return;
    }

    transitionEthicsStatus(
      selectedProject,
      'ETHICS_APPROVED',
      'Hồ sơ đạo đức đã được chấp thuận.'
    );
  };

  if (!canView) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <ShieldCheck className="mx-auto h-9 w-9 text-slate-300" />
          <h1 className="mt-3 text-base font-semibold text-slate-900">
            Không có quyền truy cập workspace đạo đức
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Nghiên cứu viên theo dõi hồ sơ đạo đức từ trang chi tiết đề tài.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 p-6 text-slate-800">
      <PageHeader
        title="Đạo đức nghiên cứu"
        description="Hàng đợi tiếp nhận, thẩm định và theo dõi hồ sơ đạo đức của các đề tài."
      />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setFilter(item.id);
                  setDetailTab('OVERVIEW');
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  filter === item.id
                    ? 'border-sky-200 bg-sky-50 text-[#0A6EBD]'
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-slate-500">
                  {statusCounts[item.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã, tên đề tài, chủ nhiệm..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-[#0A6EBD]"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid min-h-[650px] grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hồ sơ đạo đức
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                {filteredProjects.length} hồ sơ
              </div>
            </div>

            <div className="max-h-[650px] overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <FileText className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-400">
                    Không có hồ sơ phù hợp.
                  </p>
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const selected =
                    selectedProject?.id === project.id;

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
                      className={`block w-full border-b border-slate-100 border-l-4 px-4 py-3 text-left transition ${
                        selected
                          ? 'border-l-[#0A6EBD] bg-sky-50/60'
                          : 'border-l-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-[#0A6EBD]">
                          {project.projectCode ||
                            project.proposalCode ||
                            '—'}
                        </span>
                        <StatusBadge status={project.ethicsStatus} />
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                        {project.title}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {project.principalInvestigatorName}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main className="min-w-0">
            {!selectedProject ? (
              <EmptySelection />
            ) : (
              <>
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#0A6EBD]">
                          {selectedProject.projectCode ||
                            selectedProject.proposalCode ||
                            '—'}
                        </span>
                        <StatusBadge
                          status={selectedProject.ethicsStatus}
                        />
                      </div>

                      <h2 className="mt-2 text-base font-semibold leading-6 text-slate-900">
                        {selectedProject.title}
                      </h2>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {selectedProject.principalInvestigatorName}
                        </span>
                        <span>
                          {selectedProject.departmentName || '—'}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/projects/${selectedProject.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Xem đề tài
                    </Link>
                  </div>

                  <div className="mt-4 flex gap-1 border-b border-slate-200">
                    {[
                      { id: 'OVERVIEW', label: 'Thông tin' },
                      { id: 'DOCUMENTS', label: 'Tài liệu' },
                      { id: 'HISTORY', label: 'Lịch sử' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setDetailTab(tab.id as DetailTab)
                        }
                        className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${
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

                <div className="p-5">
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
                      onApprove={handleApprove}
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
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoItem
          label="Yêu cầu đạo đức"
          value={project.ethicsRequired ? 'Có' : 'Không'}
        />
        <InfoItem
          label="Trạng thái"
          value={<StatusBadge status={project.ethicsStatus} />}
        />
        <InfoItem
          label="Loại thẩm định"
          value={formatReviewType(approval?.reviewType)}
        />
        <InfoItem
          label="Số chấp thuận"
          value={approval?.decisionNumber || '—'}
        />
        <InfoItem
          label="Ngày chấp thuận"
          value={approval?.approvalDate || '—'}
        />
        <InfoItem
          label="Ngày hết hạn"
          value={approval?.expiryDate || '—'}
        />
      </section>

      <section className="rounded-xl border border-slate-200">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Trạng thái xử lý hồ sơ
          </h3>
        </div>
        <div className="p-4">
          <EthicsStatusSummary status={project.ethicsStatus} />
        </div>
      </section>

      {canProcess && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Thao tác nghiệp vụ
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {project.ethicsStatus === 'SCREENING_IN_PROGRESS' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Hồ sơ đang ở bước sàng lọc. Chưa có thao tác thẩm định cho đến khi hồ sơ đạo đức được nộp.
              </div>
            )}

            {project.ethicsStatus === 'DOSSIER_SUBMITTED' && (
              <button
                type="button"
                onClick={onReceive}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0A6EBD] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#085896]"
              >
                <CheckCircle2 className="h-4 w-4" />
                Tiếp nhận hồ sơ
              </button>
            )}

            {project.ethicsStatus === 'UNDER_ETHICS_REVIEW' && (
              <>
                <button
                  type="button"
                  onClick={onShowRevision}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <CircleAlert className="h-4 w-4" />
                  Yêu cầu bổ sung
                </button>

                <button
                  type="button"
                  onClick={onApprove}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Chấp thuận
                </button>
              </>
            )}

            {project.ethicsStatus === 'ETHICS_REVISION_REQUIRED' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Đang chờ Chủ nhiệm bổ sung và nộp lại hồ sơ.
              </div>
            )}

            {project.ethicsStatus === 'ETHICS_APPROVED' && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Hồ sơ đã được chấp thuận.
              </div>
            )}
          </div>

          {showRevisionBox && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <label
                htmlFor="revision-note"
                className="block text-sm font-medium text-rose-800"
              >
                Nội dung cần bổ sung
              </label>

              <textarea
                id="revision-note"
                value={revisionNote}
                onChange={(event) =>
                  onRevisionNoteChange(event.target.value)
                }
                rows={4}
                placeholder="Nêu rõ tài liệu hoặc nội dung cần bổ sung..."
                className="mt-2 w-full resize-none rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400"
              />

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancelRevision}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={onRequestRevision}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  <Send className="h-4 w-4" />
                  Gửi yêu cầu
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function DocumentsTab({
  documents,
}: {
  documents: ProjectDocument[];
}) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 p-8 text-center">
        <FileText className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-700">
          Chưa có tài liệu hồ sơ đạo đức
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="divide-y divide-slate-100">
        {documents.map((document) => {
          const currentVersion = document.versions.find(
            (version) => version.isCurrent
          );

          return (
            <div
              key={document.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {document.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Phiên bản {document.currentVersion}
                  {currentVersion?.fileName
                    ? ` · ${currentVersion.fileName}`
                    : ''}
                </p>
              </div>

              {currentVersion?.downloadUrl &&
                currentVersion.downloadUrl !== '#' && (
                  <a
                    href={currentVersion.downloadUrl}
                    className="shrink-0 text-xs font-semibold text-[#0A6EBD] hover:underline"
                  >
                    Xem tệp
                  </a>
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
      <div className="rounded-xl border border-slate-200 p-8 text-center">
        <History className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-700">
          Chưa có lịch sử xử lý đạo đức
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="divide-y divide-slate-100">
        {history.map((item) => (
          <div key={item.id} className="px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">
                {item.actionCode}
              </p>
              <span className="text-xs text-slate-400">
                {item.timestamp}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {item.userFullName}
            </p>
            {item.notes && (
              <p className="mt-1.5 text-sm text-slate-600">
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
        <ShieldCheck className="mx-auto h-9 w-9 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">
          Chọn một hồ sơ để xem chi tiết.
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
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs font-medium text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}

function EthicsStatusSummary({
  status,
}: {
  status: EthicsStatus;
}) {
  if (status === 'SCREENING_IN_PROGRESS') {
    return (
      <StatusMessage
        tone="amber"
        title="Đang sàng lọc"
        description="Đang xác định nghiên cứu có thuộc diện phải thẩm định đạo đức hay không."
      />
    );
  }

  if (status === 'DOSSIER_SUBMITTED') {
    return (
      <StatusMessage
        tone="blue"
        title="Hồ sơ đã nộp"
        description="Hồ sơ đạo đức đã được nộp và đang chờ bộ phận phụ trách tiếp nhận."
      />
    );
  }

  if (status === 'UNDER_ETHICS_REVIEW') {
    return (
      <StatusMessage
        tone="blue"
        title="Đang thẩm định"
        description="Hồ sơ đang được xem xét. Có thể yêu cầu bổ sung hoặc ghi nhận kết quả thẩm định."
      />
    );
  }

  if (status === 'ETHICS_REVISION_REQUIRED') {
    return (
      <StatusMessage
        tone="rose"
        title="Cần bổ sung"
        description="Hồ sơ đã được yêu cầu bổ sung trước khi tiếp tục thẩm định."
      />
    );
  }

  if (status === 'CONDITIONALLY_APPROVED') {
    return (
      <StatusMessage
        tone="amber"
        title="Chấp thuận có điều kiện"
        description="Hồ sơ đã được chấp thuận có điều kiện và cần hoàn thiện các yêu cầu còn lại."
      />
    );
  }

  if (status === 'ETHICS_APPROVED') {
    return (
      <StatusMessage
        tone="emerald"
        title="Đã chấp thuận"
        description="Hồ sơ đạo đức đã được chấp thuận."
      />
    );
  }

  if (status === 'EXPIRED') {
    return (
      <StatusMessage
        tone="rose"
        title="Hết hiệu lực"
        description="Chấp thuận đạo đức đã hết hiệu lực."
      />
    );
  }

  if (status === 'SUSPENDED') {
    return (
      <StatusMessage
        tone="rose"
        title="Tạm đình chỉ"
        description="Hồ sơ/chấp thuận đạo đức đang bị tạm đình chỉ."
      />
    );
  }

  return (
    <StatusMessage
      tone="slate"
      title="Đang theo dõi"
      description="Không có thao tác nghiệp vụ trực tiếp cho trạng thái hiện tại."
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
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    blue: 'border-sky-200 bg-sky-50 text-[#0A6EBD]',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    emerald:
      'border-emerald-200 bg-emerald-50 text-emerald-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm opacity-90">{description}</div>
    </div>
  );
}

function formatReviewType(
  reviewType?: 'EXEMPT' | 'EXPEDITED' | 'FULL_BOARD'
) {
  if (reviewType === 'EXEMPT') return 'Miễn thẩm định';
  if (reviewType === 'EXPEDITED') return 'Thẩm định rút gọn';
  if (reviewType === 'FULL_BOARD') return 'Hội đồng đầy đủ';
  return '—';
}