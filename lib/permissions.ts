import { Role } from '@/lib/types';

export const PERMISSIONS = {
  // Đợt đăng ký
  MANAGE_REGISTRATION_ROUNDS: [
    'RESEARCH_OFFICE',
  ] as Role[],

  VIEW_REGISTRATION_ROUNDS: [
    'RESEARCHER',
    'RESEARCH_OFFICE',
    'COUNCIL_MEMBER',
    'ETHICS_OFFICE',
    'FINANCE_OFFICER',
    'DIRECTOR',
    'ADMIN',
  ] as Role[],

  // Đăng ký đề tài
  SUBMIT_PROPOSAL: [
    'RESEARCHER',
  ] as Role[],

  // Thẩm định hành chính hồ sơ
  REVIEW_ADMIN_PROPOSAL: [
    'RESEARCH_OFFICE',
  ] as Role[],

  // Hội đồng KH&CN
  MANAGE_COUNCILS: [
    'RESEARCH_OFFICE',
  ] as Role[],

  EVALUATE_PROJECT: [
    'COUNCIL_MEMBER',
  ] as Role[],

  /*
   * CREATE_MINUTES không thể xác định chỉ bằng User.role.
   * Chủ tịch / Thư ký là CouncilRole trong CouncilMember.
   * Vì vậy không nên dùng permission coarse-grained này
   * để quyết định quyền lập/ký biên bản.
   */
  CREATE_MINUTES: [
    'COUNCIL_MEMBER',
  ] as Role[],

  // Quyết định
  SIGN_DECISIONS: [
    'DIRECTOR',
  ] as Role[],

  DRAFT_DECISIONS: [
    'RESEARCH_OFFICE',
  ] as Role[],

  ISSUE_DECISIONS: [
    'RESEARCH_OFFICE',
  ] as Role[],

  // Tiến độ
  SUBMIT_PROGRESS_REPORT: [
    'RESEARCHER',
  ] as Role[],

  REVIEW_PROGRESS_REPORT: [
    'RESEARCH_OFFICE',
  ] as Role[],

  // Gia hạn / Điều chỉnh
  SUBMIT_CHANGE_REQUEST: [
    'RESEARCHER',
  ] as Role[],

  REVIEW_CHANGE_REQUEST: [
    'RESEARCH_OFFICE',
  ] as Role[],

  // Đạo đức nghiên cứu
  REVIEW_ETHICS: [
    'ETHICS_OFFICE',
  ] as Role[],

  // Nghiệm thu
  SUBMIT_ACCEPTANCE: [
    'RESEARCHER',
  ] as Role[],

  REVIEW_ACCEPTANCE_DOSSIER: [
    'RESEARCH_OFFICE',
  ] as Role[],

  // Tài chính
  SETTLE_FINANCE: [
    'FINANCE_OFFICER',
  ] as Role[],

  // Quản trị hệ thống
  REOPEN_ARCHIVED: [
    'ADMIN',
  ] as Role[],

  MANAGE_USERS: [
    'ADMIN',
  ] as Role[],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export function hasPermission(
  userRole: Role,
  allowedRoles: readonly Role[]
): boolean {
  return allowedRoles.includes(userRole);
}

export function hasNamedPermission(
  userRole: Role,
  permission: PermissionKey
): boolean {
  return PERMISSIONS[permission].includes(userRole);
}