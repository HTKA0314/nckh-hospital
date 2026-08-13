'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ClipboardList,
  Download,
  FileText,
  PenTool,
  Printer,
  Save,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DocxExportService } from '@/lib/services/docx-export-service';
import { canSignMinutes } from '@/lib/utils/permissions';
import { useToast } from '@/components/ui/Toast';
import {
  EvaluationResult,
  EvaluationScoreItem,
  MeetingMinutes,
  ProposalStatus,
} from '@/lib/types';

/*
 * Bộ tiêu chí mẫu.
 * Production nên lấy từ council.scoringCriteriaSnapshot / CriteriaSet.
 */
const CRITERIA = [
  {
    key: 'novelty',
    max: 20,
    label: 'Tính cấp thiết và tính mới của đề tài',
  },
  {
    key: 'methodology',
    max: 30,
    label: 'Mục tiêu, đối tượng và phương pháp nghiên cứu',
  },
  {
    key: 'feasibility',
    max: 20,
    label: 'Tính khả thi và năng lực tổ chức thực hiện',
  },
  {
    key: 'efficacy',
    max: 20,
    label: 'Hiệu quả khoa học, thực tiễn và khả năng ứng dụng',
  },
  {
    key: 'capability',
    max: 10,
    label: 'Dự toán kinh phí',
  },
] as const;

const VERDICT_OPTIONS = [
  { id: 'APPROVED', label: 'Thông qua' },
  {
    id: 'REVISION',
    label: 'Thông qua có sửa đổi, bổ sung',
  },
  { id: 'REJECTED', label: 'Không thông qua' },
] as const;

type Verdict = (typeof VERDICT_OPTIONS)[number]['id'];

const TABS = [
  {
    id: 'MINUTES' as const,
    icon: ClipboardList,
    label: 'Biên bản họp Hội đồng',
  },
  {
    id: 'SCORING' as const,
    icon: PenTool,
    label: 'Phiếu chấm điểm',
  },
];

export default function CouncilWorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();

  const council = repo.getCouncilById(params.id);

  const [selectedProjectId, setSelectedProjectId] = useState(
    council?.projectIds[0] || ''
  );
  const [activeTab, setActiveTab] = useState<
    'MINUTES' | 'SCORING'
  >('MINUTES');

  const [scores, setScores] = useState<Record<string, number>>({
    novelty: 0,
    methodology: 0,
    feasibility: 0,
    efficacy: 0,
    capability: 0,
  });
  const [expertComment, setExpertComment] = useState('');

  const [verdict, setVerdict] = useState<Verdict | ''>('');
  const [minutesContent, setMinutesContent] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  if (!council) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Không tìm thấy Hội đồng.
          </p>
          <Link
            href="/councils"
            className="mt-4 inline-flex text-sm font-medium text-[#0A6EBD] hover:underline"
          >
            Quay lại danh sách Hội đồng
          </Link>
        </div>
      </main>
    );
  }

  // Ép React đọc lại dữ liệu mock sau khi repository cập nhật.
  void dataVersion;

  const project = repo.getProjectById(selectedProjectId);
  const evaluationResults = council.evaluationResults ?? [];
  const minutes = council.minutes ?? [];

  const currentMember = council.members.find(
    (member) => member.userId === currentUser.id
  );

  const currentEvaluation = project
    ? evaluationResults.find(
        (result) =>
          result.projectId === project.id &&
          result.councilMemberId === currentMember?.id
      )
    : undefined;

  const submittedEvaluations = project
    ? evaluationResults.filter(
        (result) =>
          result.projectId === project.id &&
          (result.status === 'SUBMITTED' ||
            result.status === 'SIGNED')
      )
    : [];

  const currentMinutes = project
    ? minutes.find((item) => item.projectId === project.id)
    : undefined;

  const maxTotalScore = CRITERIA.reduce(
    (sum, criterion) => sum + criterion.max,
    0
  );

  const passThreshold =
    council.minPassRatio <= 1
      ? maxTotalScore * council.minPassRatio
      : council.minPassRatio;

  const totalScore = Object.values(scores).reduce(
    (sum, score) => sum + score,
    0
  );

  const requiredEvaluationCount = Math.min(
    council.members.length,
    Math.max(1, council.minMembers || 3)
  );

  const canDraftMinutes =
    submittedEvaluations.length >= requiredEvaluationCount;

  const chair = council.members.find(
    (member) => member.roleInCouncil === 'CHỦ_TỊCH'
  );
  const secretary = council.members.find(
    (member) => member.roleInCouncil === 'THƯ_KÝ'
  );

  const isChair = currentMember?.roleInCouncil === 'CHỦ_TỊCH';
  const isSecretary =
    currentMember?.roleInCouncil === 'THƯ_KÝ';

  const handleExportDocx = () => {
    if (!project) return;

    const exportVerdict =
      verdict ||
      minutesConclusionToVerdict(currentMinutes?.conclusion) ||
      '';

    DocxExportService.exportCouncilMinutesDocx(
      council.name,
      council.code,
      project.title,
      project.principalInvestigatorName,
      exportVerdict,
      minutesContent ||
        currentMinutes?.summaryOpinions ||
        ''
    );
  };

  const handleSubmitEvaluation = () => {
    if (!project) return;

    if (!currentMember) {
      warning(
        'Bạn không phải là thành viên chính thức của Hội đồng này.'
      );
      return;
    }

    if (
      currentEvaluation?.status === 'SUBMITTED' ||
      currentEvaluation?.status === 'SIGNED'
    ) {
      warning('Phiếu đánh giá của bạn đã được nộp.');
      return;
    }

    if (totalScore <= 0) {
      warning('Vui lòng chấm điểm trước khi nộp phiếu.');
      return;
    }

    const now = new Date().toISOString();

    const scoreItems: EvaluationScoreItem[] = CRITERIA.map(
      (criterion) => ({
        criteriaId: criterion.key,
        criteriaName: criterion.label,
        maxScore: criterion.max,
        weight: criterion.max / maxTotalScore,
        score: scores[criterion.key] || 0,
      })
    );

    const evaluation: EvaluationResult = {
      id:
        currentEvaluation?.id ||
        `eval-${council.id}-${project.id}-${currentMember.id}`,
      councilId: council.id,
      projectId: project.id,
      councilMemberId: currentMember.id,
      councilMemberName: currentMember.userFullName,
      roleInCouncil: currentMember.roleInCouncil,
      scores: scoreItems,
      totalScore,
      voteResult:
        totalScore >= passThreshold
          ? 'APPROVE'
          : 'REJECT',
      comments: expertComment.trim(),
      submittedAt: now,
      status: 'SUBMITTED',
    };

    const nextResults = currentEvaluation
      ? evaluationResults.map((result) =>
          result.id === currentEvaluation.id
            ? evaluation
            : result
        )
      : [...evaluationResults, evaluation];

    const updated = repo.updateCouncil(council.id, {
      evaluationResults: nextResults,
      status:
        council.status === 'ESTABLISHED'
          ? 'EVALUATING'
          : council.status,
    });

    if (!updated) {
      error('Không thể lưu phiếu đánh giá.');
      return;
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'COUNCIL_EVALUATION_SUBMITTED',
      entityType: 'COUNCIL',
      entityId: council.id,
      notes: `Nộp phiếu đánh giá đề tài ${project.proposalCode}; tổng điểm ${totalScore}.`,
    });

    setDataVersion((value) => value + 1);
    success('Đã nộp phiếu đánh giá.');
  };

  const handleSaveMinutes = () => {
    if (!project) return;

    if (!canSignMinutes(currentUser, council)) {
      warning(
        'Chỉ Chủ tịch hoặc Thư ký của Hội đồng mới được lập biên bản.'
      );
      return;
    }

    if (!verdict) {
      warning('Vui lòng chọn kết luận của Hội đồng.');
      return;
    }

    if (!minutesContent.trim()) {
      warning('Vui lòng nhập nội dung kết luận.');
      return;
    }

    if (!canDraftMinutes) {
      warning(
        `Chưa đủ phiếu đánh giá để lập biên bản. Hiện có ${submittedEvaluations.length}/${requiredEvaluationCount} phiếu.`
      );
      return;
    }

    if (!chair || !secretary) {
      warning(
        'Hội đồng phải có đầy đủ Chủ tịch và Thư ký trước khi lập biên bản.'
      );
      return;
    }

    const averageScore =
      submittedEvaluations.length > 0
        ? submittedEvaluations.reduce(
            (sum, item) => sum + item.totalScore,
            0
          ) / submittedEvaluations.length
        : 0;

    const passVoteCount = submittedEvaluations.filter(
      (item) =>
        item.voteResult === 'APPROVE' ||
        item.voteResult === 'APPROVE_WITH_REVISION'
    ).length;

    const nextMinutes: MeetingMinutes = {
      id:
        currentMinutes?.id ||
        `minutes-${council.id}-${project.id}`,
      councilId: council.id,
      projectId: project.id,
      meetingDate: council.meetingDate,
      location: council.location,
      secretaryId: secretary.id,
      secretaryName: secretary.userFullName,
      chairId: chair.id,
      chairName: chair.userFullName,
      attendeesCount: council.members.length,
      summaryOpinions: minutesContent.trim(),
      conclusion: verdictToMinutesConclusion(verdict),
      averageScore,
      passVoteCount,
      totalVoteCount: submittedEvaluations.length,
      revisionRequirements:
        verdict === 'REVISION'
          ? minutesContent.trim()
          : undefined,
      status: 'CONFIRMED',
      secretarySignedAt: currentMinutes?.secretarySignedAt,
      chairSignedAt: currentMinutes?.chairSignedAt,
    };

    const nextMinutesList = currentMinutes
      ? minutes.map((item) =>
          item.id === currentMinutes.id ? nextMinutes : item
        )
      : [...minutes, nextMinutes];

    const updated = repo.updateCouncil(council.id, {
      minutes: nextMinutesList,
      status: 'MINUTES_DRAFTED',
    });

    if (!updated) {
      error('Không thể lưu biên bản Hội đồng.');
      return;
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'COUNCIL_MINUTES_CONFIRMED',
      entityType: 'COUNCIL',
      entityId: council.id,
      notes: `Lập biên bản cho đề tài ${project.proposalCode}; kết luận ${verdict}.`,
    });

    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
    setDataVersion((value) => value + 1);
    success(
      'Đã lưu biên bản. Chủ tịch và Thư ký cần ký để hoàn tất kết luận.'
    );
  };

  const handleSignMinutes = () => {
    if (!project || !currentMinutes) {
      warning('Chưa có biên bản để ký.');
      return;
    }

    if (!isChair && !isSecretary) {
      warning(
        'Chỉ Chủ tịch hoặc Thư ký Hội đồng được ký biên bản.'
      );
      return;
    }

    const now = new Date().toISOString();

    const secretarySignedAt = isSecretary
      ? now
      : currentMinutes.secretarySignedAt;

    const chairSignedAt = isChair
      ? now
      : currentMinutes.chairSignedAt;

    const bothSigned = Boolean(
      secretarySignedAt && chairSignedAt
    );

    const signedMinutes: MeetingMinutes = {
      ...currentMinutes,
      secretarySignedAt,
      chairSignedAt,
      status: bothSigned ? 'SIGNED' : 'CONFIRMED',
    };

    const nextMinutes = minutes.map((item) =>
      item.id === signedMinutes.id ? signedMinutes : item
    );

    const allProjectMinutesSigned = council.projectIds.every(
      (projectId) => {
        const candidate =
          projectId === project.id
            ? signedMinutes
            : nextMinutes.find(
                (item) => item.projectId === projectId
              );

        return candidate?.status === 'SIGNED';
      }
    );

    const updatedCouncil = repo.updateCouncil(council.id, {
      minutes: nextMinutes,
      status: allProjectMinutesSigned
        ? 'CONCLUDED'
        : 'MINUTES_DRAFTED',
    });

    if (!updatedCouncil) {
      error('Không thể cập nhật chữ ký biên bản.');
      return;
    }

    if (bothSigned) {
      applySignedConclusion(
        project.id,
        signedMinutes,
        council.type
      );
    }

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'COUNCIL_MINUTES_SIGNED',
      entityType: 'COUNCIL',
      entityId: council.id,
      notes: `Ký biên bản đề tài ${project.proposalCode} với vai trò ${currentMember?.roleInCouncil}.`,
    });

    setDataVersion((value) => value + 1);

    success(
      bothSigned
        ? 'Biên bản đã đủ chữ ký Chủ tịch và Thư ký. Kết luận đã có hiệu lực trong workflow.'
        : 'Đã ký biên bản. Đang chờ chữ ký còn lại.'
    );
  };

  const applySignedConclusion = (
    projectId: string,
    signedMinutes: MeetingMinutes,
    councilType: 'PROPOSAL_REVIEW' | 'ACCEPTANCE'
  ) => {
    const targetProject = repo.getProjectById(projectId);
    if (!targetProject) return;

    const now = new Date().toISOString();

    if (councilType === 'PROPOSAL_REVIEW') {
      let proposalStatus: ProposalStatus;

      if (signedMinutes.conclusion === 'APPROVED') {
        proposalStatus = 'PROPOSAL_APPROVED';
      } else if (
        signedMinutes.conclusion ===
          'APPROVED_WITH_REVISION' ||
        signedMinutes.conclusion === 'RE_EVALUATE'
      ) {
        proposalStatus = 'PROPOSAL_REVISION_REQUIRED';
      } else {
        proposalStatus = 'REJECTED';
      }

      repo.updateProject(targetProject.id, {
        proposalStatus,
        status:
          proposalStatus === 'PROPOSAL_APPROVED'
            ? 'WAITING_ASSIGNMENT'
            : targetProject.status,
        updatedAt: now,
      });

      return;
    }

    /*
     * AcceptanceDossierStatus chỉ quản lý hồ sơ đến bước
     * FORWARDED_TO_COUNCIL. Kết quả Hội đồng nằm ở MeetingMinutes/
     * AcceptanceEvaluation, vì vậy không ghi ACCEPTED/REJECTED vào dossier.
     */
    if (signedMinutes.conclusion === 'APPROVED') {
      repo.updateProject(targetProject.id, {
        status: 'ACCEPTED',
        updatedAt: now,
      });
      return;
    }

    if (
      signedMinutes.conclusion ===
        'APPROVED_WITH_REVISION' &&
      targetProject.acceptanceDossier
    ) {
      repo.updateProject(targetProject.id, {
        acceptanceDossier: {
          ...targetProject.acceptanceDossier,
          postAcceptanceRevisions: [
            ...(targetProject.acceptanceDossier
              .postAcceptanceRevisions || []),
            {
              id: `post-acceptance-${Date.now()}`,
              councilFeedback:
                signedMinutes.revisionRequirements ||
                signedMinutes.summaryOpinions,
              status: 'PENDING',
            },
          ],
        },
        updatedAt: now,
      });
    }

    // REJECTED/RE_EVALUATE: kết luận đã nằm trong biên bản.
    // Không tự suy đoán ProjectStatus khi policy chưa định nghĩa.
  };

  return (
    <main className="flex flex-col gap-3 pb-12 text-slate-800">
      <nav className="flex select-none items-center gap-2 text-[12px] text-slate-500">
        <Link
          href="/councils"
          className="inline-flex items-center gap-1 font-medium text-slate-600 transition-colors hover:text-[#0A6EBD]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Danh sách Hội đồng
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-mono text-slate-500">
          {council.code}
        </span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-700">
          Nghiệp vụ Hội đồng
        </span>
      </nav>

      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs sm:flex-row sm:items-center">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-[#C7DFF7] bg-[#F0F6FE] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#0A6EBD]">
              {council.code}
            </span>
            <span className="rounded border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
              {council.type === 'PROPOSAL_REVIEW'
                ? 'Hội đồng xét duyệt đề cương'
                : 'Hội đồng nghiệm thu'}
            </span>
          </div>
          <h1 className="mt-1 text-[15px] font-bold leading-snug text-slate-900">
            {council.name}
          </h1>
          <p className="text-[12px] text-slate-500">
            Phiên họp:{' '}
            <strong className="text-slate-700">
              {council.meetingDate}
            </strong>
            {council.meetingTime
              ? ` — ${council.meetingTime}`
              : ''}
            {council.location
              ? ` · ${council.location}`
              : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            In
          </button>

          <button
            type="button"
            onClick={handleExportDocx}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Xuất Word
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-12">
        <aside className="space-y-3 lg:col-span-4">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Đề tài trong phiên họp
              </h2>
              <span className="rounded border border-[#C7DFF7] bg-[#F0F6FE] px-2 py-0.5 font-mono text-[11px] font-bold text-[#0A6EBD]">
                {council.projectIds.length}
              </span>
            </header>

            <div className="divide-y divide-slate-100">
              {council.projectIds.map((projectId) => {
                const item = repo.getProjectById(projectId);
                if (!item) return null;

                const active =
                  selectedProjectId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(item.id);
                      setVerdict('');
                      setMinutesContent('');
                    }}
                    className={`w-full border-l-[3px] px-4 py-3 text-left transition-colors ${
                      active
                        ? 'border-l-[#0A6EBD] bg-[#F5FAFF]'
                        : 'border-l-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[#0A6EBD]">
                        {item.projectCode ||
                          item.proposalCode}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>

                    <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-slate-900">
                      {item.title}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {item.principalInvestigatorName}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Thành viên Hội đồng
              </h2>
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {council.members.length} người
              </span>
            </header>

            <div className="divide-y divide-slate-100">
              {council.members.map((member) => {
                const roleLabel =
                  member.roleInCouncil === 'CHỦ_TỊCH'
                    ? 'Chủ tịch'
                    : member.roleInCouncil === 'THƯ_KÝ'
                      ? 'Thư ký'
                      : member.roleInCouncil ===
                          'PHẢN_BIỆN'
                        ? 'Phản biện'
                        : 'Ủy viên';

                const submitted =
                  evaluationResults.some(
                    (result) =>
                      result.projectId ===
                        selectedProjectId &&
                      result.councilMemberId === member.id &&
                      (result.status === 'SUBMITTED' ||
                        result.status === 'SIGNED')
                  );

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-900">
                        {member.userFullName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {roleLabel}
                      </p>
                    </div>

                    {submitted ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Đã nộp phiếu
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                        <Circle className="h-3 w-3" />
                        Chưa nộp
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <div className="lg:col-span-8">
          {project ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] font-bold text-[#0A6EBD]">
                      {project.projectCode ||
                        project.proposalCode}
                    </span>
                    <h2 className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-slate-900">
                      {project.title}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Chủ nhiệm:{' '}
                      <strong className="text-slate-700">
                        {project.principalInvestigatorName}
                      </strong>
                      {project.departmentName
                        ? ` — ${project.departmentName}`
                        : ''}
                    </p>
                  </div>

                  {(() => {
                    const assignment =
                      council.projectAssignments?.find(
                        (item) =>
                          item.projectId ===
                          selectedProjectId
                      );

                    if (
                      !assignment?.reviewerAssignments
                        ?.length
                    ) {
                      return null;
                    }

                    return (
                      <div className="shrink-0 space-y-0.5 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Phản biện
                        </p>

                        {assignment.reviewerAssignments.map(
                          (reviewer) => (
                            <p
                              key={`${assignment.projectId}-${reviewer.reviewerId}`}
                              className="text-[11px] font-semibold text-slate-700"
                            >
                              PB{reviewer.reviewerOrder}:{' '}
                              <span className="text-[#0A6EBD]">
                                {reviewer.reviewerName}
                              </span>
                            </p>
                          )
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex gap-0 border-b border-slate-200 px-2">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive =
                    activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setActiveTab(tab.id)
                      }
                      className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-[12px] font-semibold transition-colors ${
                        isActive
                          ? 'border-[#0A6EBD] text-[#0A6EBD]'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {activeTab === 'MINUTES' && (
                <div className="space-y-5 p-5">
                  {savedOk && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[12px] font-medium text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      Biên bản đã được lưu.
                    </div>
                  )}

                  {currentMinutes ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      Trạng thái biên bản:{' '}
                      <strong>
                        {currentMinutes.status}
                      </strong>
                      {' · '}
                      Thư ký:{' '}
                      {currentMinutes.secretarySignedAt
                        ? 'Đã ký'
                        : 'Chưa ký'}
                      {' · '}
                      Chủ tịch:{' '}
                      {currentMinutes.chairSignedAt
                        ? 'Đã ký'
                        : 'Chưa ký'}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <p className="text-[12px] font-bold text-slate-700">
                      Kết quả Hội đồng
                    </p>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {VERDICT_OPTIONS.map((option) => {
                        const active =
                          verdict === option.id;

                        return (
                          <label
                            key={option.id}
                            className={`flex cursor-pointer select-none items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[12px] font-semibold ${
                              active
                                ? 'border-[#0A6EBD] bg-sky-50 text-[#0A6EBD]'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="verdict"
                              checked={active}
                              onChange={() =>
                                setVerdict(option.id)
                              }
                              className="h-3.5 w-3.5 accent-[#0A6EBD]"
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-700">
                      Nội dung kết luận
                    </label>

                    <textarea
                      rows={5}
                      value={minutesContent}
                      onChange={(event) =>
                        setMinutesContent(
                          event.target.value
                        )
                      }
                      className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[12px] leading-relaxed text-slate-800 outline-none transition focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <SummaryCard
                      label="Phiếu đã nộp"
                      value={`${submittedEvaluations.length} / ${council.members.length}`}
                    />
                    <SummaryCard
                      label="Phiếu tán thành"
                      value={String(
                        submittedEvaluations.filter(
                          (item) =>
                            item.voteResult ===
                              'APPROVE' ||
                            item.voteResult ===
                              'APPROVE_WITH_REVISION'
                        ).length
                      )}
                    />
                    <SummaryCard
                      label="Điểm trung bình"
                      value={
                        submittedEvaluations.length
                          ? (
                              submittedEvaluations.reduce(
                                (sum, item) =>
                                  sum +
                                  item.totalScore,
                                0
                              ) /
                              submittedEvaluations.length
                            ).toFixed(1)
                          : '—'
                      }
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={handleExportDocx}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Xuất Word
                    </button>

                    {!currentMinutes ||
                    currentMinutes.status !== 'SIGNED' ? (
                      <button
                        type="button"
                        onClick={handleSaveMinutes}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-4 text-[12px] font-bold text-white hover:bg-[#085896]"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Lưu biên bản
                      </button>
                    ) : null}

                    {currentMinutes &&
                    currentMinutes.status !== 'SIGNED' &&
                    (isChair || isSecretary) ? (
                      <button
                        type="button"
                        onClick={handleSignMinutes}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-[12px] font-bold text-white hover:bg-emerald-700"
                      >
                        <PenTool className="h-3.5 w-3.5" />
                        Ký biên bản
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {activeTab === 'SCORING' && (
                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">
                        Phiếu chấm điểm
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Ngưỡng đạt hiện tại:{' '}
                        {passThreshold.toFixed(0)} /{' '}
                        {maxTotalScore}
                      </p>
                    </div>

                    <div className="w-20 rounded-xl border-2 border-slate-300 bg-slate-50 py-2.5 text-center">
                      <p className="font-mono text-[26px] font-bold leading-none text-slate-600">
                        {totalScore}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-[12px]">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="w-8 px-4 py-2.5 text-left text-[11px] font-bold text-slate-600">
                            STT
                          </th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600">
                            Tiêu chí đánh giá
                          </th>
                          <th className="w-20 px-4 py-2.5 text-center text-[11px] font-bold text-slate-600">
                            Tối đa
                          </th>
                          <th className="w-24 px-4 py-2.5 text-center text-[11px] font-bold text-slate-600">
                            Điểm
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {CRITERIA.map(
                          (criterion, index) => (
                            <tr key={criterion.key}>
                              <td className="px-4 py-3 text-slate-400">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {criterion.label}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {criterion.max}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={
                                    criterion.max
                                  }
                                  value={
                                    scores[
                                      criterion.key
                                    ] || 0
                                  }
                                  onChange={(event) =>
                                    setScores({
                                      ...scores,
                                      [criterion.key]:
                                        Math.min(
                                          criterion.max,
                                          Math.max(
                                            0,
                                            Number(
                                              event
                                                .target
                                                .value
                                            )
                                          )
                                        ),
                                    })
                                  }
                                  className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-center font-mono font-bold text-[#0A6EBD]"
                                />
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-700">
                      Ý kiến nhận xét
                    </label>
                    <textarea
                      rows={3}
                      value={expertComment}
                      onChange={(event) =>
                        setExpertComment(
                          event.target.value
                        )
                      }
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-[12px]"
                    />
                  </div>

                  <div className="flex justify-end border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={handleSubmitEvaluation}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-4 text-[12px] font-bold text-white hover:bg-[#085896]"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Nộp phiếu đánh giá
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-[13px] text-slate-400">
                Chọn đề tài từ danh sách để tiếp tục
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="font-mono text-[18px] font-bold text-[#0A6EBD]">
        {value}
      </p>
    </div>
  );
}

function verdictToMinutesConclusion(
  verdict: Verdict
): MeetingMinutes['conclusion'] {
  if (verdict === 'APPROVED') return 'APPROVED';
  if (verdict === 'REVISION')
    return 'APPROVED_WITH_REVISION';
  return 'REJECTED';
}

function minutesConclusionToVerdict(
  conclusion?: MeetingMinutes['conclusion']
): Verdict | undefined {
  if (conclusion === 'APPROVED') return 'APPROVED';
  if (
    conclusion === 'APPROVED_WITH_REVISION' ||
    conclusion === 'RE_EVALUATE'
  ) {
    return 'REVISION';
  }
  if (conclusion === 'REJECTED') return 'REJECTED';
  return undefined;
}