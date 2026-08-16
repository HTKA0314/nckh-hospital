import {
  Council,
  ResearchProject,
  User,
} from '@/lib/types';

export function canReviewProposal(
  user?: User | null
): boolean {
  if (!user) return false;

  return user.role === 'RESEARCH_OFFICE';
}

export function canSubmitResubmission(
  user?: User | null,
  project?: ResearchProject | null
): boolean {
  if (!user || !project) return false;

  if (
    user.role !== 'RESEARCHER' ||
    user.id !== project.principalInvestigatorId
  ) {
    return false;
  }

  return (
    project.proposalStatus === 'REVISION_REQUIRED' ||
    project.proposalStatus === 'PROPOSAL_REVISION_REQUIRED'
  );
}

function getCouncilMember(
  user?: User | null,
  council?: Council | null
) {
  if (!user || !council) return undefined;

  return council.members.find(
    (member) => member.userId === user.id
  );
}

export function isCouncilMember(
  user?: User | null,
  council?: Council | null
): boolean {
  return Boolean(getCouncilMember(user, council));
}

export function isCouncilChair(
  user?: User | null,
  council?: Council | null
): boolean {
  return (
    getCouncilMember(user, council)?.roleInCouncil === 'CHỦ_TỊCH'
  );
}

export function isCouncilSecretary(
  user?: User | null,
  council?: Council | null
): boolean {
  return (
    getCouncilMember(user, council)?.roleInCouncil === 'THƯ_KÝ'
  );
}

/**
 * Thư ký lập và chỉnh sửa dự thảo biên bản.
 * Chủ tịch không trực tiếp lập biên bản.
 */
export function canCreateMinutes(
  user?: User | null,
  council?: Council | null
): boolean {
  if (!user || !council) return false;

  return (
    isCouncilSecretary(user, council) &&
    (
      council.status === 'EVALUATING' ||
      council.status === 'MINUTES_DRAFTED'
    )
  );
}

/**
 * Chủ tịch xác nhận kết luận/biên bản của Hội đồng.
 */
export function canConfirmMinutes(
  user?: User | null,
  council?: Council | null
): boolean {
  if (!user || !council) return false;

  return (
    isCouncilChair(user, council) &&
    council.status === 'MINUTES_DRAFTED'
  );
}

/**
 * Quyền ký biên bản:
 * - Thư ký ký phần Thư ký.
 * - Chủ tịch ký phần Chủ tịch.
 *
 * Trạng thái cụ thể của MeetingMinutes nên tiếp tục được kiểm tra
 * tại repository/service khi thực hiện thao tác ký.
 */
export function canSignMinutes(
  user?: User | null,
  council?: Council | null
): boolean {
  if (!user || !council) return false;

  return (
    isCouncilSecretary(user, council) ||
    isCouncilChair(user, council)
  );
}

/**
 * Thành viên chỉ được đánh giá khi:
 * - thuộc Hội đồng;
 * - không có xung đột lợi ích;
 * - được phép đánh giá;
 * - Hội đồng đang ở giai đoạn có thể chấm.
 */
export function canSubmitCouncilEvaluation(
  user?: User | null,
  council?: Council | null
): boolean {
  if (!user || !council) return false;

  const member = getCouncilMember(user, council);
  if (!member) return false;

  if (member.hasConflictOfInterest) return false;
  if (member.canEvaluate === false) return false;

  return (
    council.status === 'ESTABLISHED' ||
    council.status === 'EVALUATING'
  );
}

/* =========================================================
 * ETHICS
 * ======================================================= */

export function canReviewEthics(
  user?: User | null
): boolean {
  if (!user) return false;

  return user.role === 'ETHICS_OFFICE';
}

/* =========================================================
 * DECISION
 * ======================================================= */

/**
 * Giám đốc ký hoặc trả lại Quyết định.
 */
export function canApproveDecision(
  user?: User | null
): boolean {
  if (!user) return false;

  return user.role === 'DIRECTOR';
}

/**
 * Phòng NCKH lập dự thảo Quyết định.
 */
export function canDraftDecision(
  user?: User | null
): boolean {
  if (!user) return false;

  return user.role === 'RESEARCH_OFFICE';
}

/**
 * Sau khi Giám đốc ký, Phòng NCKH thực hiện ban hành.
 */
export function canIssueDecision(
  user?: User | null
): boolean {
  if (!user) return false;

  return user.role === 'RESEARCH_OFFICE';
}

/* =========================================================
 * ACCEPTANCE DOSSIER
 * ======================================================= */

/**
 * Chủ nhiệm nộp hồ sơ nghiệm thu lần đầu khi đề tài đang thực hiện,
 * hoặc nộp lại khi hồ sơ nghiệm thu đang yêu cầu bổ sung.
 */
export function canSubmitAcceptanceDossier(
  user?: User | null,
  project?: ResearchProject | null
): boolean {
  if (!user || !project) return false;

  if (
    user.role !== 'RESEARCHER' ||
    user.id !== project.principalInvestigatorId
  ) {
    return false;
  }

  const firstSubmission =
    project.status === 'IN_PROGRESS' &&
    !project.acceptanceDossier;

  const resubmission =
    project.status === 'CLOSING_SUBMITTED' &&
    project.acceptanceDossier?.status === 'REVISION_REQUIRED';

  return firstSubmission || resubmission;
}

/**
 * Phòng NCKH tiếp nhận và kiểm tra hành chính hồ sơ nghiệm thu.
 */
export function canReviewAcceptanceDossier(
  user?: User | null
): boolean {
  if (!user) return false;

  return user.role === 'RESEARCH_OFFICE';
}

/* =========================================================
 * CHANGE REQUEST
 * ======================================================= */

export function canSubmitChangeRequest(
  user?: User | null,
  project?: ResearchProject | null
): boolean {
  if (!user || !project) return false;

  return (
    user.role === 'RESEARCHER' &&
    user.id === project.principalInvestigatorId &&
    (
      project.status === 'IN_PROGRESS' ||
      project.status === 'EXTENSION_REQUESTED'
    )
  );
}

export function canReviewChangeRequest(
  user?: User | null
): boolean {
  if (!user) return false;

  return user.role === 'RESEARCH_OFFICE';
}

/* =========================================================
 * PROGRESS
 * ======================================================= */

export function canSubmitProgressReport(
  user?: User | null,
  project?: ResearchProject | null
): boolean {
  if (!user || !project) return false;

  return (
    user.role === 'RESEARCHER' &&
    user.id === project.principalInvestigatorId &&
    project.status === 'IN_PROGRESS'
  );
}

export function canReviewProgressReport(
  user?: User | null
): boolean {
  if (!user) return false;

  return user.role === 'RESEARCH_OFFICE';
}

export default {
  canReviewProposal,
  canSubmitResubmission,

  isCouncilMember,
  isCouncilChair,
  isCouncilSecretary,
  canCreateMinutes,
  canConfirmMinutes,
  canSignMinutes,
  canSubmitCouncilEvaluation,

  canReviewEthics,

  canApproveDecision,
  canDraftDecision,
  canIssueDecision,

  canSubmitAcceptanceDossier,
  canReviewAcceptanceDossier,

  canSubmitChangeRequest,
  canReviewChangeRequest,

  canSubmitProgressReport,
  canReviewProgressReport,
};