import {
  ResearchProject,
  User,
} from '@/lib/types';
import { Council } from '@/lib/types';

/**
 * Permission helpers
 *
 * Nguyên tắc:
 * - Role chỉ xác định nhóm quyền nghiệp vụ.
 * - Quyền thao tác cụ thể phải kết hợp:
 *   role + ownership + entity membership + workflow state.
 * - ADMIN không tự động kế thừa quyền nghiệp vụ.
 */

/* =========================================================
 * PROPOSAL / ADMINISTRATIVE REVIEW
 * ======================================================= */

export function canReviewProposal(
  user?: User | null
): boolean {
  if (!user) return false;

  return user.role === 'RESEARCH_OFFICE';
}

/**
 * Chủ nhiệm chỉ được nộp lại hồ sơ của chính mình.
 *
 * State cụ thể nên được kiểm tra ở workflow/page:
 * REVISION_REQUIRED hoặc PROPOSAL_REVISION_REQUIRED.
 */
export function canSubmitResubmission(
  user?: User | null,
  project?: ResearchProject | null
): boolean {
  if (!user || !project) return false;

  return (
    user.role === 'RESEARCHER' &&
    user.id === project.principalInvestigatorId
  );
}

/* =========================================================
 * SCIENTIFIC COUNCIL
 * ======================================================= */

export function isCouncilMember(
  user?: User | null,
  council?: Council | null
): boolean {
  if (!user || !council) return false;

  return council.members.some(
    (member) => member.userId === user.id
  );
}

export function isCouncilChair(
  user?: User | null,
  council?: Council | null
): boolean {
  if (!user || !council) return false;

  return council.members.some(
    (member) =>
      member.userId === user.id &&
      member.roleInCouncil === 'CHỦ_TỊCH'
  );
}

export function isCouncilSecretary(
  user?: User | null,
  council?: Council | null
): boolean {
  if (!user || !council) return false;

  return council.members.some(
    (member) =>
      member.userId === user.id &&
      member.roleInCouncil === 'THƯ_KÝ'
  );
}

/**
 * Chỉ Chủ tịch hoặc Thư ký của chính Hội đồng đó
 * được ký biên bản.
 */
export function canSignMinutes(
  user?: User | null,
  council?: Council | null
): boolean {
  if (!user || !council) return false;

  return (
    isCouncilChair(user, council) ||
    isCouncilSecretary(user, council)
  );
}

/**
 * Lập/chỉnh biên bản cũng phải gắn với Hội đồng cụ thể.
 *
 * Nếu nghiệp vụ sau này quy định chỉ Thư ký được lập
 * thì có thể đổi hàm này thành isCouncilSecretary().
 */
export function canCreateMinutes(
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
 * Thành viên Hội đồng được nộp phiếu đánh giá
 * nếu thực sự thuộc Hội đồng đó.
 */
export function canSubmitCouncilEvaluation(
  user?: User | null,
  council?: Council | null
): boolean {
  return isCouncilMember(user, council);
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
 * Chủ nhiệm nộp hồ sơ nghiệm thu của chính đề tài.
 */
export function canSubmitAcceptanceDossier(
  user?: User | null,
  project?: ResearchProject | null
): boolean {
  if (!user || !project) return false;

  return (
    user.role === 'RESEARCHER' &&
    user.id === project.principalInvestigatorId
  );
}

/**
 * Phòng NCKH tiếp nhận và kiểm tra hành chính
 * hồ sơ nghiệm thu.
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
      project.status === 'SUSPENDED'
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
  canSignMinutes,
  canCreateMinutes,
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