import { ProjectStatus } from '@/lib/types';

/**
 * Macro lifecycle của ResearchProject.
 *
 * Lưu ý:
 * - Không biểu diễn Proposal workflow ở đây.
 * - Không biểu diễn Decision workflow ở đây.
 * - Các gate nghiệp vụ phải được kiểm tra trước khi gọi transition.
 */
export const PROJECT_TRANSITIONS: Record<
  ProjectStatus,
  readonly ProjectStatus[]
> = {
  DRAFT: [
    'SUBMITTED',
  ],

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

  ACCEPTED: [
    'RECOGNIZED',
  ],

  RECOGNIZED: [
    'CLOSED',
  ],

  CLOSED: [
    'ARCHIVED',
  ],

  ARCHIVED: [],

  REJECTED: [],

  TERMINATED: [],
};

export function canTransitionProject(
  current: ProjectStatus,
  next: ProjectStatus
): boolean {
  return PROJECT_TRANSITIONS[current].includes(next);
}