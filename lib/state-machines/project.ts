import { ProjectStatus } from '@/lib/types';

export const PROJECT_TRANSITIONS: Record<
  ProjectStatus,
  readonly ProjectStatus[]
> = {
  DRAFT: ['SUBMITTED'],

  SUBMITTED: [
    'SCREENING_FAILED',
    'CONCEPT_APPROVED',
  ],

  SCREENING_FAILED: [],

  CONCEPT_APPROVED: [
    'PROPOSAL_SUBMITTED',
  ],

  PROPOSAL_SUBMITTED: [
    'IRB_REVIEWING',
  ],

  IRB_REVIEWING: [
    'REVISION_REQUIRED',
    'APPROVED_PENDING_CONTRACT',
    'SCREENING_FAILED',
  ],

  REVISION_REQUIRED: [
    'PROPOSAL_SUBMITTED',
  ],

  APPROVED_PENDING_CONTRACT: [
    'IN_PROGRESS',
    'SCREENING_FAILED',
  ],

  IN_PROGRESS: [
    'CLOSING_SUBMITTED',
    'EXTENSION_REQUESTED',
    'TERMINATED',
  ],

  EXTENSION_REQUESTED: [
    'IN_PROGRESS',
    'TERMINATED',
  ],

  CLOSING_SUBMITTED: [
    'COMPLETED',
    'TERMINATED',
  ],

  COMPLETED: [],
  TERMINATED: [],
};

export function canTransitionProject(
  current: ProjectStatus,
  next: ProjectStatus
): boolean {
  return PROJECT_TRANSITIONS[current]?.includes(next) ?? false;
}