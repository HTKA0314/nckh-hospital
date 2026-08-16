'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import {
  canCreateMinutes,
  canConfirmMinutes,
  canSignMinutes,
  canSubmitCouncilEvaluation,
  isCouncilChair,
  isCouncilSecretary,
} from '@/lib/utils/permissions';
import { ArrowLeft, Eye } from 'lucide-react';
import type {
  CouncilConclusion,
  EvaluationResult,
  MeetingMinutes,
  MeetingMinutesProjectResult,
} from '@/lib/types';

import { CouncilHeader } from './_components/CouncilHeader';
import { EvaluationTab } from './_components/EvaluationTab';
import { SummaryTab } from './_components/SummaryTab';
import { MinutesTab } from './_components/MinutesTab';
import { MinutesEditorModal, ProjectConclusionDraft } from './_components/MinutesEditorModal';
import { minuteStatusLabel } from './_utils/format';
import { exportCouncilMinutesToWord } from './_utils/exportWord';

type WorkspaceTab = 'EVALUATION' | 'SUMMARY' | 'MINUTES';

export default function CouncilWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const councilId = params?.id as string;
  const { currentUser } = useAuth();
  const { success, warning, info } = useToast();

  const [mounted, setMounted] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const requestedTab = searchParams.get('tab');
  const initialTab: WorkspaceTab = requestedTab === 'minutes' ? 'MINUTES' : requestedTab === 'summary' ? 'SUMMARY' : 'EVALUATION';
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showMinutesModal, setShowMinutesModal] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'minutes') setActiveTab('MINUTES');
    else if (tab === 'summary') setActiveTab('SUMMARY');
    else if (tab === 'evaluation') setActiveTab('EVALUATION');
  }, [searchParams]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const council = useMemo(() => repo.getCouncilById(councilId), [councilId, dataVersion]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const meetingMinutes = useMemo(() => repo.getCouncilMeetingMinutes(councilId), [councilId, dataVersion]);

  useEffect(() => {
    if (!council) return;
    if (!selectedProjectId || !council.projectIds.includes(selectedProjectId)) {
      setSelectedProjectId(council.projectIds[0] || '');
    }
  }, [council, selectedProjectId]);

  const selectedProject = useMemo(
    () => (selectedProjectId ? repo.getProjectById(selectedProjectId) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedProjectId, dataVersion]
  );

  const currentMember = council?.members.find((member) => member.userId === currentUser?.id);
  const chair = council?.members.find((member) => member.roleInCouncil === 'CHỦ_TỊCH');
  const secretary = council?.members.find((member) => member.roleInCouncil === 'THƯ_KÝ');

  const isSecretary = Boolean(
    currentUser && council && isCouncilSecretary(currentUser, council)
  );

  const isChair = Boolean(
    currentUser && council && isCouncilChair(currentUser, council)
  );

  const canEditMinutes = Boolean(
    currentUser && council && canCreateMinutes(currentUser, council)
  );

  const canConfirmCouncilMinutes = Boolean(
    currentUser && council && canConfirmMinutes(currentUser, council)
  );

  const canSignCouncilMinutes = Boolean(
    currentUser && council && canSignMinutes(currentUser, council)
  );

  const criteria = council?.scoringCriteriaSnapshot || [];
  const totalMaxScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);

  const allResults = council?.evaluationResults || [];
  const selectedProjectResults = allResults.filter((result) => result.projectId === selectedProjectId);

  const currentEvaluation =
    council && currentMember && selectedProjectId
      ? repo.getCouncilEvaluation(council.id, selectedProjectId, currentMember.id)
      : undefined;

  const canEvaluate = Boolean(
    council &&
      currentUser &&
      currentMember &&
      canSubmitCouncilEvaluation(currentUser, council) &&
      criteria.length > 0 &&
      selectedProjectId
  );

  const canEditEvaluation = canEvaluate && currentEvaluation?.status !== 'SUBMITTED' && currentEvaluation?.status !== 'SIGNED';

  const projectStats = useMemo(() => {
    if (!council) return {} as Record<string, { signedCount: number; averageScore?: number; passCount: number; passRatio: number }>;

    return council.projectIds.reduce<Record<string, { signedCount: number; averageScore?: number; passCount: number; passRatio: number }>>(
      (acc, projectId) => {
        const results = allResults.filter((result) => result.projectId === projectId && result.status === 'SIGNED');
        const passCount = results.filter((result) => result.voteResult !== 'REJECT').length;
        acc[projectId] = {
          signedCount: results.length,
          averageScore: results.length
            ? results.reduce((sum, result) => sum + result.totalScore, 0) / results.length
            : undefined,
          passCount,
          passRatio: results.length ? passCount / results.length : 0,
        };
        return acc;
      },
      {}
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [council, allResults, dataVersion]);

  const refresh = () => setDataVersion((version) => version + 1);

  const handleSaveEvaluationDraft = (evaluation: EvaluationResult) => {
    if (!council || !canEditEvaluation) return;
    const saved = repo.saveCouncilEvaluationDraft(council.id, evaluation);
    if (!saved) {
      warning('Không thể lưu bản nháp phiếu đánh giá.');
      return;
    }
    refresh();
    success('Đã lưu bản nháp phiếu đánh giá.');
  };

  const handleSubmitEvaluation = (evaluation: EvaluationResult) => {
    if (!council || !currentMember || !canEditEvaluation) return;
    const draft = repo.saveCouncilEvaluationDraft(council.id, evaluation);
    if (!draft) {
      warning('Không thể lưu phiếu đánh giá.');
      return;
    }

    const submitted = repo.submitCouncilEvaluation(council.id, selectedProjectId, currentMember.id);
    if (!submitted) {
      warning('Không thể nộp phiếu đánh giá.');
      return;
    }
    refresh();
    success('Đã nộp phiếu đánh giá.');
  };

  const handleSignEvaluation = () => {
    if (!council || !currentMember || !currentUser || currentEvaluation?.status !== 'SUBMITTED') return;
    const signed = repo.signCouncilEvaluation(council.id, selectedProjectId, currentMember.id, currentUser.id);
    if (!signed) {
      warning('Không thể xác nhận phiếu đánh giá.');
      return;
    }
    refresh();
    success('Đã ký xác nhận phiếu đánh giá.');
  };

  const deriveRatingLabel = (averageScore?: number) => {
    if (averageScore === undefined || council?.type !== 'ACCEPTANCE') return undefined;
    return council.ratingSchemeSnapshot?.find(
      (level) => averageScore >= level.minScore && averageScore <= level.maxScore
    )?.label;
  };

  const buildMinutes = (
    summary: string,
    attendance: Record<string, boolean>,
    projectDrafts: Record<string, ProjectConclusionDraft>
  ): MeetingMinutes | null => {
    if (!council || !currentUser || !secretary || !chair) return null;

    const projectResults: MeetingMinutesProjectResult[] = council.projectIds.map((projectId) => {
      const stats = projectStats[projectId];
      const draft = projectDrafts[projectId] || {
        conclusion: 'APPROVED_WITH_REVISION' as CouncilConclusion,
        summaryOpinion: '',
        revisionRequirements: '',
      };
      return {
        projectId,
        conclusion: draft.conclusion,
        summaryOpinion: draft.summaryOpinion.trim(),
        averageScore: stats?.averageScore,
        passVoteCount: stats?.passCount || 0,
        totalVoteCount: stats?.signedCount || 0,
        ratingLabel: deriveRatingLabel(stats?.averageScore),
        revisionRequirements: draft.revisionRequirements.trim() || undefined,
      };
    });

    const attendanceRows = council.members.map((member) => ({
      councilMemberId: member.id,
      userId: member.userId,
      attended: Boolean(attendance[member.id]),
      attendanceMode: meetingMinutes?.attendance.find((item) => item.councilMemberId === member.id)?.attendanceMode,
      absenceReason: meetingMinutes?.attendance.find((item) => item.councilMemberId === member.id)?.absenceReason,
      eligibleToVote: member.canVote !== false,
    }));

    const now = new Date().toISOString();
    return {
      id: meetingMinutes?.id || `minutes-${Date.now()}`,
      councilId: council.id,
      meetingDate: council.meetingDate,
      location: council.location,
      secretaryId: secretary.userId,
      secretaryName: secretary.userFullName,
      chairId: chair.userId,
      chairName: chair.userFullName,
      attendance: attendanceRows,
      summaryOpinions: summary.trim(),
      projectResults,
      status: 'DRAFT',
      createdAt: meetingMinutes?.createdAt || now,
      createdBy: meetingMinutes?.createdBy || currentUser.id,
      updatedAt: now,
      chairFeedback: meetingMinutes?.chairFeedback,
    };
  };

  const validateMinutesForSubmit = (minutes: MeetingMinutes) => {
    if (!minutes.summaryOpinions) {
      warning('Cần nhập tóm tắt diễn biến và ý kiến chung của phiên họp.');
      return false;
    }

    const missingResult = minutes.projectResults.find((item) => !item.summaryOpinion);
    if (missingResult) {
      const project = repo.getProjectById(missingResult.projectId);
      warning(`Cần nhập ý kiến kết luận cho ${project?.projectCode || project?.proposalCode || 'đề tài'}.`);
      return false;
    }

    const missingRevisionRequirements = minutes.projectResults.find(
      (item) =>
        item.conclusion === 'APPROVED_WITH_REVISION' &&
        !item.revisionRequirements?.trim()
    );
    if (missingRevisionRequirements) {
      const project = repo.getProjectById(missingRevisionRequirements.projectId);
      warning(
        `Cần nhập yêu cầu chỉnh sửa/hoàn thiện cho ${
          project?.projectCode || project?.proposalCode || 'đề tài'
        }.`
      );
      return false;
    }

    const minSigned = repo.getCommonCouncilPolicy(council!.projectIds)?.minSignedEvaluationsBeforeMinutes;
    if (minSigned !== undefined) {
      const insufficient = minutes.projectResults.find((item) => item.totalVoteCount < minSigned);
      if (insufficient) {
        const project = repo.getProjectById(insufficient.projectId);
        warning(`Chưa đủ số phiếu đã ký để lập biên bản cho ${project?.projectCode || project?.proposalCode || 'đề tài'}.`);
        return false;
      }
    }

    const attendedCount = minutes.attendance.filter((item) => item.attended).length;
    if (council?.minMembers && attendedCount < council.minMembers) {
      warning(`Phiên họp chưa đủ số thành viên tối thiểu (${council.minMembers}).`);
      return false;
    }

    if (!minutes.attendance.find((item) => item.userId === chair?.userId)?.attended) {
      warning('Chủ tịch Hội đồng phải được ghi nhận tham dự phiên họp.');
      return false;
    }
    if (!minutes.attendance.find((item) => item.userId === secretary?.userId)?.attended) {
      warning('Thư ký Hội đồng phải được ghi nhận tham dự phiên họp.');
      return false;
    }

    return true;
  };

  const handleSaveMinutesDraft = (
    summary: string,
    attendance: Record<string, boolean>,
    projectDrafts: Record<string, ProjectConclusionDraft>
  ) => {
    if (!council || !canEditMinutes) return;
    const minutes = buildMinutes(summary, attendance, projectDrafts);
    if (!minutes) return;
    const saved = repo.saveCouncilMeetingMinutesDraft(council.id, minutes);
    if (!saved) {
      warning('Không thể lưu dự thảo biên bản họp.');
      return;
    }
    setShowMinutesModal(false);
    refresh();
    success('Đã lưu dự thảo biên bản họp.');
  };

  const handleSubmitMinutes = (
    summary: string,
    attendance: Record<string, boolean>,
    projectDrafts: Record<string, ProjectConclusionDraft>
  ) => {
    if (!council || !currentUser || !canEditMinutes) return;
    const minutes = buildMinutes(summary, attendance, projectDrafts);
    if (!minutes || !validateMinutesForSubmit(minutes)) return;

    const saved = repo.saveCouncilMeetingMinutesDraft(council.id, minutes);
    if (!saved) {
      warning('Không thể lưu biên bản họp.');
      return;
    }
    const submitted = repo.submitCouncilMeetingMinutesForChair(council.id, currentUser.id);
    if (!submitted) {
      warning('Không thể trình ký biên bản họp.');
      return;
    }
    setShowMinutesModal(false);
    refresh();
    success('Đã trình ký biên bản họp thành công.');
  };

  const handleChairRequestRevision = (feedback: string) => {
    if (!council || !currentUser || !canConfirmCouncilMinutes || !feedback.trim()) {
      warning('Cần nhập nội dung yêu cầu chỉnh sửa.');
      return;
    }
    const updated = repo.requestCouncilMeetingMinutesRevision(council.id, currentUser.id, feedback);
    if (!updated) {
      warning('Không thể trả biên bản để chỉnh sửa.');
      return;
    }
    refresh();
    success('Đã trả biên bản cho Thư ký chỉnh sửa.');
  };

  const handleChairConfirmMinutes = (feedback: string) => {
    if (!council || !currentUser || !canConfirmCouncilMinutes) return;
    const confirmed = repo.confirmCouncilMeetingMinutes(council.id, currentUser.id, feedback);
    if (!confirmed) {
      warning('Không thể xác nhận biên bản họp.');
      return;
    }
    refresh();
    success('Đã xác nhận biên bản họp. Vui lòng ký số để kết luận chính thức có hiệu lực.');
  };

  const handleSignMinutes = () => {
    if (!council || !currentUser) return;
    const signed = repo.signCouncilMeetingMinutes(council.id, currentUser.id);
    if (!signed) {
      warning('Không thể ký biên bản. Vui lòng kiểm tra lại trạng thái biên bản và quyền hạn.');
      return;
    }
    refresh();
    success(
      signed.status === 'SIGNED'
        ? 'Biên bản đã được ký đầy đủ bởi cả Thư ký và Chủ tịch.'
        : 'Đã ký biên bản thành công. Chờ người còn lại ký để hoàn tất.'
    );
  };

  const handleExportWordMinutes = () => {
    if (!council || !meetingMinutes || !['CONFIRMED', 'SIGNED'].includes(meetingMinutes.status)) {
      warning('Biên bản chưa được xác nhận.');
      return;
    }
    exportCouncilMinutesToWord(council, meetingMinutes, allResults);
  };

  if (!mounted) {
    return <div className="p-8 text-center text-xs font-medium text-slate-500">Đang tải dữ liệu Hội đồng...</div>;
  }

  if (!council) {
    return (
      <div className="mx-auto my-8 max-w-xl rounded-xl border border-slate-200 bg-white py-16 text-center text-xs">
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy Hội đồng</h2>
        <Link href="/councils" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3.5 py-2 font-bold text-white">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const evaluators = council.members.filter((member) => member.canEvaluate !== false);
  const signedCount = allResults.filter((result) => result.status === 'SIGNED').length;
  const expectedCount = evaluators.length * council.projectIds.length;

  const minSignedRequired =
    repo.getCommonCouncilPolicy(council.projectIds)?.minSignedEvaluationsBeforeMinutes ?? 3;

  const projectSignedCounts = council.projectIds.reduce<Record<string, number>>((acc, projectId) => {
    acc[projectId] = allResults.filter(
      (r) => r.projectId === projectId && r.status === 'SIGNED'
    ).length;
    return acc;
  }, {});

  const allProjectsMeetMinSigned = council.projectIds.every(
    (projectId) => (projectSignedCounts[projectId] ?? 0) >= minSignedRequired
  );

  const canOpenMinutesEditor =
    canEditMinutes &&
    allProjectsMeetMinSigned &&
    !['PENDING_CHAIR_CONFIRMATION', 'CONCLUDED'].includes(council.status) &&
    !['PENDING_CHAIR_CONFIRMATION', 'CONFIRMED', 'SIGNED'].includes(meetingMinutes?.status || '');

  const canSignAsSecretary =
    isSecretary &&
    !!meetingMinutes &&
    ['CONFIRMED', 'SIGNED'].includes(meetingMinutes.status) &&
    !meetingMinutes.secretarySignedAt;

  const canSignAsChair =
    isChair &&
    !!meetingMinutes &&
    ['CONFIRMED', 'SIGNED'].includes(meetingMinutes.status) &&
    !meetingMinutes.chairSignedAt;

  const canSignMinutesNow = canSignAsSecretary || canSignAsChair;

  return (
    <div className="space-y-4 pb-12 text-xs text-slate-800">
      <CouncilHeader council={council} meetingMinutes={meetingMinutes} allResults={allResults} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[10px] font-bold uppercase text-slate-400">Đề tài</span>
          <strong className="mt-1 block text-lg">{council.projectIds.length}</strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[10px] font-bold uppercase text-slate-400">Thành viên</span>
          <strong className="mt-1 block text-lg">{council.members.length}</strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[10px] font-bold uppercase text-slate-400">Phiếu đã ký</span>
          <strong className="mt-1 block text-lg">
            {signedCount}/{expectedCount}
          </strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[10px] font-bold uppercase text-slate-400">Biên bản</span>
          <strong className="mt-1 block text-sm">{minuteStatusLabel(meetingMinutes?.status)}</strong>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="font-bold text-slate-700">Đề tài đang xem</div>
          <div className="flex items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="min-w-[340px] rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold outline-none focus:border-[#0A6EBD]"
            >
              {council.projectIds.map((projectId) => {
                const project = repo.getProjectById(projectId);
                return (
                  <option key={projectId} value={projectId}>
                    {project?.projectCode || project?.proposalCode} — {project?.title || projectId}
                  </option>
                );
              })}
            </select>

            <Link
              href={`/projects/${selectedProjectId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A6EBD] bg-white px-3 py-2 text-xs font-bold text-[#0A6EBD] hover:bg-sky-50 shadow-2xs transition"
            >
              <Eye className="w-3.5 h-3.5" /> Xem hồ sơ & Báo cáo
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex border-b border-slate-200 bg-slate-50 px-3">
          {([
            ['EVALUATION', 'Phiếu đánh giá'],
            ['SUMMARY', 'Tổng hợp kết quả'],
            ['MINUTES', 'Biên bản họp'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`border-b-2 px-4 py-3 font-bold ${
                activeTab === value ? 'border-[#0A6EBD] text-[#0A6EBD]' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'EVALUATION' && (
            <EvaluationTab
              council={council}
              selectedProject={selectedProject}
              currentMember={currentMember}
              currentEvaluation={currentEvaluation}
              canEditEvaluation={canEditEvaluation}
              onSaveDraft={handleSaveEvaluationDraft}
              onSubmitEvaluation={handleSubmitEvaluation}
              onSignEvaluation={handleSignEvaluation}
            />
          )}

          {activeTab === 'SUMMARY' && (
            <SummaryTab
              council={council}
              selectedProjectId={selectedProjectId}
              selectedProjectResults={allResults.filter((result) => result.projectId === selectedProjectId)}
              totalMaxScore={totalMaxScore}
              projectStats={projectStats}
            />
          )}

          {activeTab === 'MINUTES' && (
            <MinutesTab
              council={council}
              meetingMinutes={meetingMinutes}
              allResults={allResults}
              minSignedRequired={minSignedRequired}
              evaluators={evaluators}
              projectSignedCounts={projectSignedCounts}
              allProjectsMeetMinSigned={allProjectsMeetMinSigned}
              canOpenMinutesEditor={canOpenMinutesEditor}
              canSignMinutesNow={canSignMinutesNow}
              canSignAsSecretary={canSignAsSecretary}
              canSignAsChair={canSignAsChair}
              canConfirmCouncilMinutes={canConfirmCouncilMinutes}
              canEditMinutes={canEditMinutes}
              secretary={secretary}
              chair={chair}
              onOpenMinutesEditor={() => setShowMinutesModal(true)}
              onSignMinutes={handleSignMinutes}
              onChairRequestRevision={handleChairRequestRevision}
              onChairConfirmMinutes={handleChairConfirmMinutes}
              onExportWordMinutes={handleExportWordMinutes}
            />
          )}
        </div>
      </section>

      {showMinutesModal && (
        <MinutesEditorModal
          council={council}
          meetingMinutes={meetingMinutes}
          projectStats={projectStats}
          evaluators={evaluators}
          onClose={() => setShowMinutesModal(false)}
          onSave={handleSaveMinutesDraft}
          onSubmit={handleSubmitMinutes}
        />
      )}
    </div>
  );
}