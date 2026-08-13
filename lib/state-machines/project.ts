import { ProjectStatus } from '@/lib/types';

export const PROJECT_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'DRAFT'],
  APPROVED: ['WAITING_ASSIGNMENT', 'REJECTED'],
  WAITING_ASSIGNMENT: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'TERMINATED'],
  IN_PROGRESS: ['WAITING_ACCEPTANCE', 'SUSPENDED', 'TERMINATED'],
  WAITING_ACCEPTANCE: ['ACCEPTED', 'IN_PROGRESS', 'TERMINATED'],
  ACCEPTED: ['RECOGNIZED', 'CLOSED'],
  RECOGNIZED: ['CLOSED'],
  CLOSED: ['ARCHIVED'],
  ARCHIVED: [],
  REJECTED: [],
  TERMINATED: [],
  SUSPENDED: ['IN_PROGRESS', 'TERMINATED'],
};

export function canTransitionProject(current: ProjectStatus, next: ProjectStatus): boolean {
  return PROJECT_TRANSITIONS[current]?.includes(next) || false;
}
