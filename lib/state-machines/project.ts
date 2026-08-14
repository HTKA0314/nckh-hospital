import { ProjectStatus } from '@/lib/types';

export const PROJECT_TRANSITIONS: Record<
  ProjectStatus,
  readonly ProjectStatus[]
> = {
  DRAFT: ['SUBMITTED'],

  SUBMITTED: [
    'WAITING_ASSIGNMENT',
    'REJECTED',
  ],

  WAITING_ASSIGNMENT: [
    'IN_PROGRESS',
    'REJECTED',
  ],

  IN_PROGRESS: [
    'WAITING_ACCEPTANCE',
    'SUSPENDED',
    'TERMINATED',
  ],

  SUSPENDED: [
    'IN_PROGRESS',
    'TERMINATED',
  ],

  WAITING_ACCEPTANCE: [
    'ACCEPTED',
    'TERMINATED',
  ],

  ACCEPTED: ['RECOGNIZED'],

  RECOGNIZED: ['CLOSED'],

  CLOSED: ['ARCHIVED'],

  ARCHIVED: [],
  REJECTED: [],
  TERMINATED: [],
};

export function canTransitionProject(
  current: ProjectStatus,
  next: ProjectStatus
): boolean {
  return PROJECT_TRANSITIONS[current]?.includes(next) ?? false;
}