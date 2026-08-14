'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  canCreateMinutes,
  canConfirmMinutes,
  canSignMinutes,
  canSubmitCouncilEvaluation,
  isCouncilChair,
  isCouncilSecretary,
} from '@/lib/utils/permissions';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  LockKeyhole,
  PenLine,
  Printer,
  RotateCcw,
  Save,
  Send,
  Signature,
} from 'lucide-react';
import type {
  CouncilConclusion,
  EvaluationResult,
  EvaluationScoreItem,
  MeetingMinutes,
  MeetingMinutesProjectResult,
} from '@/lib/types';

type WorkspaceTab = 'EVALUATION' | 'SUMMARY' | 'MINUTES';

type ProjectConclusionDraft = {
  conclusion: CouncilConclusion;
  summaryOpinion: string;
  revisionRequirements: string;
};

function formatDateVi(value?: string) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function conclusionLabel(type: string, conclusion: CouncilConclusion) {
  if (type === 'ACCEPTANCE') {
    if (conclusion === 'APPROVED') return 'Đạt nghiệm thu';
    if (conclusion === 'APPROVED_WITH_REVISION') return 'Đạt, yêu cầu hoàn thiện';
    if (conclusion === 'RE_EVALUATE') return 'Đánh giá lại';
    return 'Không đạt nghiệm thu';
  }

  if (conclusion === 'APPROVED') return 'Thông qua đề cương';
  if (conclusion === 'APPROVED_WITH_REVISION') return 'Thông qua, yêu cầu chỉnh sửa';
  if (conclusion === 'RE_EVALUATE') return 'Đánh giá lại';
  return 'Không thông qua';
}

function evaluationStatusLabel(status?: EvaluationResult['status']) {
  if (status === 'SIGNED') return 'Đã ký xác nhận';
  if (status === 'SUBMITTED') return 'Đã nộp';
  if (status === 'DRAFT') return 'Bản nháp';
  return 'Chưa có phiếu';
}

function minuteStatusLabel(status?: MeetingMinutes['status']) {
  if (status === 'PENDING_CHAIR_CONFIRMATION') return 'Chờ Chủ tịch xác nhận';
  if (status === 'CONFIRMED') return 'Đã xác nhận';
  if (status === 'SIGNED') return 'Đã ký';
  if (status === 'DRAFT') return 'Dự thảo';
  return 'Chưa lập';
}

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

  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [voteResult, setVoteResult] = useState<EvaluationResult['voteResult']>('APPROVE_WITH_REVISION');

  const [showMinutesModal, setShowMinutesModal] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState('');
  const [projectDrafts, setProjectDrafts] = useState<Record<string, ProjectConclusionDraft>>({});
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [chairFeedback, setChairFeedback] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'minutes') setActiveTab('MINUTES');
    else if (tab === 'summary') setActiveTab('SUMMARY');
    else if (tab === 'evaluation') setActiveTab('EVALUATION');
  }, [searchParams]);

  const council = useMemo(() => repo.getCouncilById(councilId), [councilId, dataVersion]);
  const meetingMinutes = useMemo(() => repo.getCouncilMeetingMinutes(councilId), [councilId, dataVersion]);

  useEffect(() => {
    if (!council) return;
    if (!selectedProjectId || !council.projectIds.includes(selectedProjectId)) {
      setSelectedProjectId(council.projectIds[0] || '');
    }
  }, [council, selectedProjectId]);

  const selectedProject = useMemo(
    () => (selectedProjectId ? repo.getProjectById(selectedProjectId) : undefined),
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
  const signedProjectResults = selectedProjectResults.filter((result) => result.status === 'SIGNED');

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

  useEffect(() => {
    const nextScores: Record<string, number> = {};
    criteria.forEach((criterion) => {
      const item = currentEvaluation?.scores.find((score) => score.criteriaId === criterion.id);
      nextScores[criterion.id] = item?.score ?? 0;
    });
    setScores(nextScores);
    setComments(currentEvaluation?.comments || '');
    setRecommendations(currentEvaluation?.recommendations || '');
    setVoteResult(currentEvaluation?.voteResult || 'APPROVE_WITH_REVISION');
  }, [councilId, selectedProjectId, currentMember?.id, currentEvaluation?.id, currentEvaluation?.status, dataVersion]);

  const totalScore = criteria.reduce((sum, criterion) => sum + Number(scores[criterion.id] || 0), 0);

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
  }, [council, allResults, dataVersion]);

  const refresh = () => setDataVersion((version) => version + 1);

  const buildEvaluation = (): EvaluationResult | null => {
    if (!council || !currentUser || !currentMember || !selectedProject) return null;
    if (!criteria.length) {
      warning('Hội đồng chưa có bộ tiêu chí đánh giá được cấu hình.');
      return null;
    }

    const invalid = criteria.some((criterion) => {
      const score = Number(scores[criterion.id] || 0);
      return score < 0 || score > criterion.maxScore;
    });
    if (invalid) {
      warning('Điểm đánh giá không nằm trong giới hạn của tiêu chí.');
      return null;
    }

    const scoreItems: EvaluationScoreItem[] = criteria.map((criterion) => ({
      criteriaId: criterion.id,
      criteriaName: criterion.name,
      maxScore: criterion.maxScore,
      weight: criterion.weight,
      score: Number(scores[criterion.id] || 0),
    }));

    const now = new Date().toISOString();
    return {
      id: currentEvaluation?.id || `eval-${Date.now()}`,
      councilId: council.id,
      projectId: selectedProject.id,
      councilMemberId: currentMember.id,
      councilMemberName: currentMember.userFullName,
      roleInCouncil: currentMember.roleInCouncil,
      scores: scoreItems,
      totalScore,
      voteResult,
      comments: comments.trim(),
      recommendations: recommendations.trim() || undefined,
      submittedAt: currentEvaluation?.submittedAt || now,
      status: 'DRAFT',
      updatedAt: now,
    };
  };

  const handleSaveDraft = () => {
    if (!council || !canEditEvaluation) return;
    const evaluation = buildEvaluation();
    if (!evaluation) return;
    const saved = repo.saveCouncilEvaluationDraft(council.id, evaluation);
    if (!saved) {
      warning('Không thể lưu bản nháp phiếu đánh giá.');
      return;
    }
    refresh();
    success('Đã lưu bản nháp phiếu đánh giá.');
  };

  const handleSubmitEvaluation = () => {
    if (!council || !currentMember || !canEditEvaluation) return;
    if (!comments.trim()) {
      warning('Cần nhập nhận xét trước khi nộp phiếu đánh giá.');
      return;
    }

    const evaluation = buildEvaluation();
    if (!evaluation) return;
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

  const openMinutesEditor = () => {
    if (!council) return;
    const drafts: Record<string, ProjectConclusionDraft> = {};
    council.projectIds.forEach((projectId) => {
      const existing = meetingMinutes?.projectResults.find((item) => item.projectId === projectId);
      drafts[projectId] = {
        conclusion: existing?.conclusion || 'APPROVED_WITH_REVISION',
        summaryOpinion: existing?.summaryOpinion || '',
        revisionRequirements: existing?.revisionRequirements || '',
      };
    });

    const attendanceMap: Record<string, boolean> = {};
    council.members.forEach((member) => {
      attendanceMap[member.id] =
        meetingMinutes?.attendance.find((item) => item.councilMemberId === member.id)?.attended ?? false;
    });

    setMeetingSummary(meetingMinutes?.summaryOpinions || '');
    setProjectDrafts(drafts);
    setAttendance(attendanceMap);
    setShowMinutesModal(true);
  };

  const deriveRatingLabel = (averageScore?: number) => {
    if (averageScore === undefined || council?.type !== 'ACCEPTANCE') return undefined;
    return council.ratingSchemeSnapshot?.find(
      (level) => averageScore >= level.minScore && averageScore <= level.maxScore
    )?.label;
  };

  const buildMinutes = (): MeetingMinutes | null => {
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
      summaryOpinions: meetingSummary.trim(),
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

  const handleSaveMinutesDraft = () => {
    if (!council || !canEditMinutes) return;
    const minutes = buildMinutes();
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

  const handleSubmitMinutes = () => {
    if (!council || !currentUser || !canEditMinutes) return;
    const minutes = buildMinutes();
    if (!minutes || !validateMinutesForSubmit(minutes)) return;

    const saved = repo.saveCouncilMeetingMinutesDraft(council.id, minutes);
    if (!saved) {
      warning('Không thể lưu biên bản họp.');
      return;
    }
    const submitted = repo.submitCouncilMeetingMinutesForChair(council.id, currentUser.id);
    if (!submitted) {
      warning('Không thể trình biên bản cho Chủ tịch xác nhận.');
      return;
    }
    setShowMinutesModal(false);
    refresh();
    success('Đã trình Chủ tịch Hội đồng xác nhận biên bản.');
  };

  const handleChairRequestRevision = () => {
    if (!council || !currentUser || !canConfirmCouncilMinutes || !chairFeedback.trim()) {
      warning('Cần nhập nội dung yêu cầu chỉnh sửa.');
      return;
    }
    const updated = repo.requestCouncilMeetingMinutesRevision(council.id, currentUser.id, chairFeedback);
    if (!updated) {
      warning('Không thể trả biên bản để chỉnh sửa.');
      return;
    }
    setChairFeedback('');
    refresh();
    success('Đã trả biên bản cho Thư ký chỉnh sửa.');
  };

  const handleChairConfirmMinutes = () => {
    if (!council || !currentUser || !canConfirmCouncilMinutes) return;
    const confirmed = repo.confirmCouncilMeetingMinutes(council.id, currentUser.id, chairFeedback);
    if (!confirmed) {
      warning('Không thể xác nhận biên bản họp.');
      return;
    }
    setChairFeedback('');
    refresh();
    success('Đã xác nhận biên bản và ghi nhận kết luận Hội đồng.');
  };

  const handleExportWordMinutes = () => {
    if (!council || !meetingMinutes || !['CONFIRMED', 'SIGNED'].includes(meetingMinutes.status)) {
      warning('Biên bản chưa được xác nhận.');
      return;
    }

    info('Đang tạo biên bản họp...');
    const resultSections = meetingMinutes.projectResults
      .map((result, index) => {
        const project = repo.getProjectById(result.projectId);
        const evaluations = allResults.filter(
          (evaluation) => evaluation.projectId === result.projectId && evaluation.status === 'SIGNED'
        );
        const rows = evaluations
          .map(
            (evaluation, rowIndex) => `<tr>
              <td style="text-align:center">${rowIndex + 1}</td>
              <td>${evaluation.councilMemberName}</td>
              <td style="text-align:center">${evaluation.totalScore.toFixed(1)}</td>
              <td>${evaluation.voteResult === 'APPROVE' ? 'Đạt' : evaluation.voteResult === 'APPROVE_WITH_REVISION' ? 'Đạt, cần chỉnh sửa' : 'Không đạt'}</td>
            </tr>`
          )
          .join('');

        return `<h3>${index + 1}. ${project?.title || result.projectId}</h3>
          <p><strong>Mã:</strong> ${project?.projectCode || project?.proposalCode || result.projectId}</p>
          <p><strong>Chủ nhiệm:</strong> ${project?.principalInvestigatorName || ''}</p>
          <table><thead><tr><th>STT</th><th>Thành viên</th><th>Điểm</th><th>Kết luận phiếu</th></tr></thead><tbody>${rows}</tbody></table>
          <p><strong>Điểm trung bình:</strong> ${result.averageScore === undefined ? '—' : result.averageScore.toFixed(1)}</p>
          <p><strong>Kết luận:</strong> ${conclusionLabel(council.type, result.conclusion)}</p>
          <p><strong>Ý kiến Hội đồng:</strong> ${result.summaryOpinion}</p>
          ${result.revisionRequirements ? `<p><strong>Yêu cầu hoàn thiện:</strong> ${result.revisionRequirements}</p>` : ''}`;
      })
      .join('<hr/>');

    const htmlContent = `<!doctype html><html><head><meta charset="utf-8" />
      <style>body{font-family:'Times New Roman',serif;font-size:13pt;line-height:1.35}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #000;padding:6px}h2{text-align:center}.sign td{border:0;text-align:center;width:50%;vertical-align:top;padding-top:28px}</style>
      </head><body>
      <p><strong>BỆNH VIỆN ĐA KHOA TRUNG TÂM</strong></p>
      <h2>BIÊN BẢN HỌP HỘI ĐỒNG ${council.type === 'ACCEPTANCE' ? 'NGHIỆM THU ĐỀ TÀI' : 'XÉT DUYỆT ĐỀ CƯƠNG'}</h2>
      <p><strong>Hội đồng:</strong> ${council.name}</p>
      <p><strong>Thời gian:</strong> ${council.meetingTime || ''} ngày ${formatDateVi(council.meetingDate)}</p>
      <p><strong>Địa điểm:</strong> ${council.location}</p>
      <p><strong>Thành viên tham dự:</strong> ${meetingMinutes.attendance.filter((item) => item.attended).length}/${council.members.length}</p>
      <p><strong>Tóm tắt diễn biến:</strong> ${meetingMinutes.summaryOpinions}</p>
      ${resultSections}
      <table class="sign"><tr><td><strong>THƯ KÝ HỘI ĐỒNG</strong><br/><br/><br/>${meetingMinutes.secretaryName}</td><td><strong>CHỦ TỊCH HỘI ĐỒNG</strong><br/><br/><br/>${meetingMinutes.chairName}</td></tr></table>
      </body></html>`;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bien_ban_hop_${council.code}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  return (
    <div className="space-y-4 pb-12 text-xs text-slate-800">
      <Link href="/councils" className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-[#0A6EBD]">
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách Hội đồng
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-sky-200 bg-sky-50 px-2.5 py-0.5 font-mono font-bold text-[#0A6EBD]">{council.code}</span>
              <StatusBadge status={council.status} type="COUNCIL" />
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-bold text-slate-600">
                {council.type === 'ACCEPTANCE' ? 'Hội đồng nghiệm thu' : 'Hội đồng xét duyệt đề cương'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{council.name}</h1>
            <p className="font-medium text-slate-500">
              {formatDateVi(council.meetingDate)} {council.meetingTime ? `• ${council.meetingTime}` : ''} • {council.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {meetingMinutes && ['CONFIRMED', 'SIGNED'].includes(meetingMinutes.status) && (
              <button onClick={handleExportWordMinutes} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 font-bold text-white hover:bg-emerald-700">
                <Download className="h-4 w-4" /> Xuất biên bản
              </button>
            )}
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-50">
              <Printer className="h-4 w-4" /> In
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><span className="text-[10px] font-bold uppercase text-slate-400">Đề tài</span><strong className="mt-1 block text-lg">{council.projectIds.length}</strong></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><span className="text-[10px] font-bold uppercase text-slate-400">Thành viên</span><strong className="mt-1 block text-lg">{council.members.length}</strong></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><span className="text-[10px] font-bold uppercase text-slate-400">Phiếu đã ký</span><strong className="mt-1 block text-lg">{signedCount}/{expectedCount}</strong></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><span className="text-[10px] font-bold uppercase text-slate-400">Biên bản</span><strong className="mt-1 block text-sm">{minuteStatusLabel(meetingMinutes?.status)}</strong></div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="font-bold text-slate-700">Đề tài đang xem</div>
          <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="min-w-[340px] rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold">
            {council.projectIds.map((projectId) => {
              const project = repo.getProjectById(projectId);
              return <option key={projectId} value={projectId}>{project?.projectCode || project?.proposalCode} — {project?.title || projectId}</option>;
            })}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex border-b border-slate-200 bg-slate-50 px-3">
          {([
            ['EVALUATION', 'Phiếu đánh giá'],
            ['SUMMARY', 'Tổng hợp kết quả'],
            ['MINUTES', 'Biên bản họp'],
          ] as const).map(([value, label]) => (
            <button key={value} onClick={() => setActiveTab(value)} className={`border-b-2 px-4 py-3 font-bold ${activeTab === value ? 'border-[#0A6EBD] text-[#0A6EBD]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'EVALUATION' && (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Phiếu đánh giá của tôi</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">{selectedProject?.projectCode || selectedProject?.proposalCode} — {selectedProject?.title}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-bold text-slate-600">{evaluationStatusLabel(currentEvaluation?.status)}</span>
              </div>

              {!currentMember && <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-600">Tài khoản hiện tại không thuộc Hội đồng này.</div>}
              {currentMember && criteria.length === 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-800">Hội đồng chưa được gắn bộ tiêu chí đánh giá.</div>}

              {currentMember && criteria.length > 0 && (
                <>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-[#0B2A63] text-[11px] font-bold uppercase text-white"><tr><th className="p-3">Tiêu chí</th><th className="w-28 p-3 text-center">Điểm tối đa</th><th className="w-36 p-3 text-center">Điểm đánh giá</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {criteria.map((criterion) => (
                          <tr key={criterion.id}>
                            <td className="p-3 font-semibold text-slate-800">{criterion.name}{criterion.isRequired && <span className="ml-1 text-rose-500">*</span>}</td>
                            <td className="p-3 text-center font-mono font-bold">{criterion.maxScore}</td>
                            <td className="p-3 text-center"><input type="number" min={0} max={criterion.maxScore} disabled={!canEditEvaluation} value={scores[criterion.id] ?? 0} onChange={(event) => setScores((current) => ({ ...current, [criterion.id]: Number(event.target.value) }))} className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-center font-mono font-bold disabled:bg-slate-100" /></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50"><tr><td className="p-3 font-bold">Tổng điểm</td><td className="p-3 text-center font-mono font-bold">{totalMaxScore}</td><td className="p-3 text-center font-mono text-sm font-bold text-[#0A6EBD]">{totalScore}</td></tr></tfoot>
                    </table>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div><label className="mb-1 block font-bold text-slate-700">Kết luận trên phiếu *</label><select disabled={!canEditEvaluation} value={voteResult} onChange={(event) => setVoteResult(event.target.value as EvaluationResult['voteResult'])} className="w-full rounded-lg border border-slate-300 p-2 font-semibold disabled:bg-slate-100"><option value="APPROVE">{council.type === 'ACCEPTANCE' ? 'Đạt nghiệm thu' : 'Thông qua đề cương'}</option><option value="APPROVE_WITH_REVISION">{council.type === 'ACCEPTANCE' ? 'Đạt, cần hoàn thiện' : 'Thông qua, cần chỉnh sửa'}</option><option value="REJECT">{council.type === 'ACCEPTANCE' ? 'Không đạt nghiệm thu' : 'Không thông qua'}</option></select></div>
                    <div><label className="mb-1 block font-bold text-slate-700">Kiến nghị</label><input disabled={!canEditEvaluation} value={recommendations} onChange={(event) => setRecommendations(event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 disabled:bg-slate-100" /></div>
                    <div className="md:col-span-2"><label className="mb-1 block font-bold text-slate-700">Nhận xét *</label><textarea disabled={!canEditEvaluation} rows={4} value={comments} onChange={(event) => setComments(event.target.value)} className="w-full resize-none rounded-lg border border-slate-300 p-2.5 disabled:bg-slate-100" /></div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    {canEditEvaluation && <button onClick={handleSaveDraft} className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A6EBD] bg-white px-4 py-2 font-bold text-[#0A6EBD] hover:bg-sky-50"><Save className="h-4 w-4" /> Lưu nháp</button>}
                    {canEditEvaluation && <button onClick={handleSubmitEvaluation} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-4 py-2 font-bold text-white hover:bg-[#085896]"><Send className="h-4 w-4" /> Nộp phiếu</button>}
                    {currentEvaluation?.status === 'SUBMITTED' && <button onClick={handleSignEvaluation} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"><Signature className="h-4 w-4" /> Ký xác nhận phiếu</button>}
                    {currentEvaluation?.status === 'SIGNED' && <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 font-bold text-emerald-700"><LockKeyhole className="h-4 w-4" /> Phiếu đã khóa</span>}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'SUMMARY' && (
            <div className="space-y-4">
              <div><h2 className="text-sm font-bold text-slate-900">Tổng hợp phiếu đánh giá</h2><p className="mt-0.5 text-[11px] text-slate-500">Chỉ phiếu đã ký xác nhận được đưa vào kết quả tổng hợp.</p></div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#0B2A63] text-[11px] font-bold uppercase text-white"><tr><th className="p-3">Thành viên</th><th className="p-3 text-center">Vai trò</th><th className="p-3 text-center">Trạng thái phiếu</th><th className="p-3 text-center">Điểm</th><th className="p-3">Kết luận</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {council.members.filter((member) => member.canEvaluate !== false).map((member) => {
                      const result = selectedProjectResults.find((item) => item.councilMemberId === member.id);
                      return <tr key={member.id}><td className="p-3 font-bold text-slate-900">{member.userFullName}</td><td className="p-3 text-center text-[#0A6EBD]">{member.roleInCouncil}</td><td className="p-3 text-center">{evaluationStatusLabel(result?.status)}</td><td className="p-3 text-center font-mono font-bold">{result?.status === 'SIGNED' ? `${result.totalScore}/${totalMaxScore}` : '—'}</td><td className="p-3">{result?.status === 'SIGNED' ? (result.voteResult === 'APPROVE' ? 'Đạt' : result.voteResult === 'APPROVE_WITH_REVISION' ? 'Đạt, cần chỉnh sửa' : 'Không đạt') : '—'}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="text-slate-500">Phiếu đã ký</span><strong className="mt-1 block text-lg">{signedProjectResults.length}/{evaluators.length}</strong></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="text-slate-500">Điểm trung bình</span><strong className="mt-1 block text-lg">{projectStats[selectedProjectId]?.averageScore?.toFixed(1) || '—'}</strong></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="text-slate-500">Tỷ lệ phiếu đạt</span><strong className="mt-1 block text-lg">{projectStats[selectedProjectId]?.signedCount ? `${Math.round(projectStats[selectedProjectId].passRatio * 100)}%` : '—'}</strong></div></div>
            </div>
          )}

          {activeTab === 'MINUTES' && (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><h2 className="text-sm font-bold text-slate-900">Biên bản họp Hội đồng</h2><p className="mt-0.5 text-[11px] text-slate-500">Một phiên họp có một biên bản tổng hợp kết luận của các đề tài.</p></div><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-bold text-slate-600">{minuteStatusLabel(meetingMinutes?.status)}</span></div>

              <div className="overflow-hidden rounded-xl border border-slate-200"><table className="w-full border-collapse text-left"><thead className="bg-[#0B2A63] text-[11px] font-bold uppercase text-white"><tr><th className="p-3">Đề tài</th><th className="p-3 text-center">Phiếu đã ký</th><th className="p-3 text-center">Điểm TB</th><th className="p-3">Kết luận</th></tr></thead><tbody className="divide-y divide-slate-100">{council.projectIds.map((projectId) => { const project = repo.getProjectById(projectId); const stats = projectStats[projectId]; const result = meetingMinutes?.projectResults.find((item) => item.projectId === projectId); return <tr key={projectId}><td className="p-3"><span className="font-mono text-[#0A6EBD]">{project?.projectCode || project?.proposalCode}</span><p className="mt-0.5 font-bold text-slate-900">{project?.title}</p></td><td className="p-3 text-center font-mono">{stats?.signedCount || 0}/{evaluators.length}</td><td className="p-3 text-center font-mono font-bold">{stats?.averageScore?.toFixed(1) || '—'}</td><td className="p-3">{result ? conclusionLabel(council.type, result.conclusion) : 'Chưa kết luận'}</td></tr>; })}</tbody></table></div>

              {meetingMinutes && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-bold text-slate-900">Tóm tắt diễn biến</p><p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-700">{meetingMinutes.summaryOpinions}</p></div>}

              {meetingMinutes?.status === 'PENDING_CHAIR_CONFIRMATION' && canConfirmCouncilMinutes && <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"><p className="font-bold text-amber-900">Xác nhận biên bản họp</p><textarea rows={3} value={chairFeedback} onChange={(event) => setChairFeedback(event.target.value)} className="mt-3 w-full resize-none rounded-lg border border-amber-300 bg-white p-2.5" placeholder="Ý kiến của Chủ tịch (nếu có)" /><div className="mt-3 flex justify-end gap-2"><button onClick={handleChairRequestRevision} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3.5 py-2 font-bold text-amber-800 hover:bg-amber-100"><RotateCcw className="h-4 w-4" /> Yêu cầu chỉnh sửa</button><button onClick={handleChairConfirmMinutes} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 font-bold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" /> Xác nhận biên bản</button></div></div>}

              {canEditMinutes && !['PENDING_CHAIR_CONFIRMATION', 'CONFIRMED', 'SIGNED'].includes(meetingMinutes?.status || '') && council.status !== 'CONCLUDED' && <div className="flex justify-end"><button onClick={openMinutesEditor} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-4 py-2 font-bold text-white hover:bg-[#085896]"><FileText className="h-4 w-4" /> {meetingMinutes ? 'Chỉnh sửa biên bản' : 'Lập biên bản họp'}</button></div>}
            </div>
          )}
        </div>
      </section>

      {showMinutesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><div><h3 className="text-base font-bold text-slate-900">Biên bản họp Hội đồng</h3><p className="mt-0.5 text-[11px] text-slate-500">{council.code} • {formatDateVi(council.meetingDate)}</p></div><button onClick={() => setShowMinutesModal(false)} className="text-slate-400 hover:text-slate-700">Đóng</button></div>

            <div className="mt-4 space-y-5">
              <div><label className="mb-1 block font-bold text-slate-700">Tóm tắt diễn biến và ý kiến chung *</label><textarea rows={4} value={meetingSummary} onChange={(event) => setMeetingSummary(event.target.value)} className="w-full resize-none rounded-lg border border-slate-300 p-3" /></div>

              <div><h4 className="mb-2 font-bold text-slate-900">Thành phần tham dự</h4><div className="grid gap-2 md:grid-cols-2">{council.members.map((member) => <label key={member.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"><input type="checkbox" checked={Boolean(attendance[member.id])} onChange={(event) => setAttendance((current) => ({ ...current, [member.id]: event.target.checked }))} /><span className="font-semibold">{member.userFullName}</span><span className="ml-auto text-[10px] font-bold text-slate-500">{member.roleInCouncil}</span></label>)}</div></div>

              <div className="space-y-3"><h4 className="font-bold text-slate-900">Kết luận từng đề tài</h4>{council.projectIds.map((projectId) => { const project = repo.getProjectById(projectId); const draft = projectDrafts[projectId] || { conclusion: 'APPROVED_WITH_REVISION' as CouncilConclusion, summaryOpinion: '', revisionRequirements: '' }; return <div key={projectId} className="rounded-xl border border-slate-200 p-4"><div className="mb-3"><span className="font-mono font-bold text-[#0A6EBD]">{project?.projectCode || project?.proposalCode}</span><p className="mt-0.5 font-bold text-slate-900">{project?.title}</p></div><div className="grid gap-3 md:grid-cols-2"><div><label className="mb-1 block font-bold text-slate-700">Kết luận *</label><select value={draft.conclusion} onChange={(event) => setProjectDrafts((current) => ({ ...current, [projectId]: { ...draft, conclusion: event.target.value as CouncilConclusion } }))} className="w-full rounded-lg border border-slate-300 p-2 font-semibold"><option value="APPROVED">{conclusionLabel(council.type, 'APPROVED')}</option><option value="APPROVED_WITH_REVISION">{conclusionLabel(council.type, 'APPROVED_WITH_REVISION')}</option><option value="REJECTED">{conclusionLabel(council.type, 'REJECTED')}</option><option value="RE_EVALUATE">{conclusionLabel(council.type, 'RE_EVALUATE')}</option></select></div><div><label className="mb-1 block font-bold text-slate-700">Kết quả tổng hợp</label><div className="rounded-lg bg-slate-50 px-3 py-2 font-semibold">{projectStats[projectId]?.signedCount || 0} phiếu đã ký • Điểm TB {projectStats[projectId]?.averageScore?.toFixed(1) || '—'}</div></div><div className="md:col-span-2"><label className="mb-1 block font-bold text-slate-700">Ý kiến kết luận *</label><textarea rows={3} value={draft.summaryOpinion} onChange={(event) => setProjectDrafts((current) => ({ ...current, [projectId]: { ...draft, summaryOpinion: event.target.value } }))} className="w-full resize-none rounded-lg border border-slate-300 p-2.5" /></div><div className="md:col-span-2"><label className="mb-1 block font-bold text-slate-700">Yêu cầu chỉnh sửa/hoàn thiện</label><textarea rows={2} value={draft.revisionRequirements} onChange={(event) => setProjectDrafts((current) => ({ ...current, [projectId]: { ...draft, revisionRequirements: event.target.value } }))} className="w-full resize-none rounded-lg border border-slate-300 p-2.5" /></div></div></div>; })}</div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button onClick={() => setShowMinutesModal(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">Hủy</button><button onClick={handleSaveMinutesDraft} className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A6EBD] bg-white px-4 py-2 font-bold text-[#0A6EBD]"><Save className="h-4 w-4" /> Lưu dự thảo</button><button onClick={handleSubmitMinutes} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-4 py-2 font-bold text-white"><Send className="h-4 w-4" /> Trình Chủ tịch xác nhận</button></div>
          </div>
        </div>
      )}
    </div>
  );
}