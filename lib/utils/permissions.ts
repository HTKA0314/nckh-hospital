import { User, ResearchProject } from '@/lib/types';
import { Council } from '@/lib/types';

// Permission helpers for mockup flows.
// Keep simple and explicit so UI can enforce role-separated actions.

export function canReviewProposal(user?: User | null): boolean {
  if (!user) return false;
  return ['RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN'].includes(user.role);
}

export function canSubmitResubmission(user?: User | null, project?: ResearchProject | null): boolean {
  if (!user || !project) return false;
  // Principal Investigator or Admin can submit resubmission
  return user.id === project.principalInvestigatorId || user.role === 'ADMIN';
}

export function isCouncilMember(user?: User | null, council?: Council | null): boolean {
  if (!user) return false;
  if (!council) {
    return ['COUNCIL_MEMBER', 'COUNCIL_SECRETARY' as any, 'ADMIN'].includes(user.role);
  }

  if (user.role === 'ADMIN') return true;
  if (user.role === 'COUNCIL_MEMBER' || user.role === 'COUNCIL_SECRETARY' as any) {
    return council.members.some((m) => m.userId === user.id);
  }

  return council.members.some((m) => m.userId === user.id);
}

export function isCouncilChair(user?: User | null, council?: Council | null): boolean {
  if (!user || !council) return false;
  return council.members.some((m) => m.userId === user.id && m.roleInCouncil === 'CHỦ_TỊCH');
}

export function isCouncilSecretary(user?: User | null, council?: Council | null): boolean {
  if (!user || !council) return false;
  return council.members.some((m) => m.userId === user.id && m.roleInCouncil === 'THƯ_KÝ');
}

export function canSignMinutes(user?: User | null, council?: Council | null): boolean {
  if (!user || !council) return false;
  // Only Chair or Secretary may sign minutes for this council.
  return isCouncilChair(user, council) || isCouncilSecretary(user, council) || user.role === 'ADMIN';
}

export function canCreateMinutes(user?: User | null): boolean {
  if (!user) return false;
  // Phòng KHTH / Phòng NCKH role mapped to RESEARCH_OFFICE; Admin can too
  return user.role === 'RESEARCH_OFFICE' || user.role === 'ADMIN';
}

export function canReviewEthics(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'ETHICS_OFFICE' || user.role === 'ADMIN';
}

export function canApproveDecision(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'DIRECTOR' || user.role === 'ADMIN';
}

export function canDraftDecision(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'RESEARCH_OFFICE' || user.role === 'ADMIN';
}

export function canIssueDecision(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'RESEARCH_OFFICE' || user.role === 'ADMIN';
}

export function canSubmitAcceptanceDossier(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'RESEARCHER' || user.role === 'ADMIN';
}

export function canReviewAcceptanceDossier(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'RESEARCH_OFFICE' || user.role === 'ADMIN';
}

export default {
  canReviewProposal,
  canSubmitResubmission,
  isCouncilMember,
  isCouncilChair,
  isCouncilSecretary,
  canSignMinutes,
  canCreateMinutes,
  canReviewEthics,
  canApproveDecision,
  canDraftDecision,
  canIssueDecision,
  canSubmitAcceptanceDossier,
  canReviewAcceptanceDossier,
};
