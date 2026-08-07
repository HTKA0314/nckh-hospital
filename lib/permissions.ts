import { Role } from '@/lib/types';

export const PERMISSIONS = {
  // Đợt đăng ký
  MANAGE_REGISTRATION_ROUNDS: ['RESEARCH_OFFICE', 'ADMIN'] as Role[],
  VIEW_REGISTRATION_ROUNDS: [
    'RESEARCHER',
    'RESEARCH_OFFICE',
    'COUNCIL_MEMBER',
    'COUNCIL_SECRETARY',
    'ETHICS_OFFICE',
    'FINANCE_OFFICER',
    'DIRECTOR',
    'ADMIN',
  ] as Role[],

  // Đăng ký đề tài
  SUBMIT_PROPOSAL: ['RESEARCHER', 'ADMIN'] as Role[],

  // Thẩm định hồ sơ
  REVIEW_ADMIN_PROPOSAL: ['RESEARCH_OFFICE', 'ADMIN'] as Role[],

  // Hội đồng
  MANAGE_COUNCILS: ['RESEARCH_OFFICE', 'ADMIN'] as Role[],
  EVALUATE_PROJECT: ['COUNCIL_MEMBER', 'ADMIN'] as Role[],
  CREATE_MINUTES: ['COUNCIL_SECRETARY', 'ADMIN'] as Role[],

  // Phê duyệt quyết định
  SIGN_DECISIONS: ['DIRECTOR', 'ADMIN'] as Role[],
  DRAFT_DECISIONS: ['RESEARCH_OFFICE', 'ADMIN'] as Role[],

  // Tiến độ & Điều chỉnh
  SUBMIT_PROGRESS_REPORT: ['RESEARCHER', 'ADMIN'] as Role[],
  REVIEW_PROGRESS_REPORT: ['RESEARCH_OFFICE', 'ADMIN'] as Role[],
  SUBMIT_CHANGE_REQUEST: ['RESEARCHER', 'ADMIN'] as Role[],
  APPROVE_CHANGE_REQUEST: ['DIRECTOR', 'RESEARCH_OFFICE', 'ADMIN'] as Role[],

  // Đạo đức y sinh
  REVIEW_ETHICS: ['ETHICS_OFFICE', 'ADMIN'] as Role[],

  // Nghiệm thu
  SUBMIT_ACCEPTANCE: ['RESEARCHER', 'ADMIN'] as Role[],
  REVIEW_ACCEPTANCE_DOSSIER: ['RESEARCH_OFFICE', 'ADMIN'] as Role[],

  // Tài chính
  SETTLE_FINANCE: ['FINANCE_OFFICER', 'ADMIN'] as Role[],

  // Quản trị
  REOPEN_ARCHIVED: ['ADMIN'] as Role[],
  MANAGE_USERS: ['ADMIN'] as Role[],
};

export function hasPermission(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}
