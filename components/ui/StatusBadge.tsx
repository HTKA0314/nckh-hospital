'use client';

import React from 'react';

type BadgeType =
  | 'PROJECT'
  | 'PROPOSAL'
  | 'COUNCIL'
  | 'ETHICS'
  | 'PROGRESS'
  | 'CHANGE'
  | 'ACCEPTANCE'
  | 'FINANCE'
  | 'ROUND';

interface BadgeProps {
  status?: string;
  type?: BadgeType;
}

type BadgeConfig = {
  label: string;
  className: string;
};

const DEFAULT_CLASS = 'bg-slate-400';
const BLUE = 'bg-[#0A6EBD]';
const SKY = 'bg-sky-500';
const AMBER = 'bg-amber-500';
const EMERALD = 'bg-emerald-500';
const ROSE = 'bg-rose-500';
const RED = 'bg-red-500';
const VIOLET = 'bg-violet-500';
const TEAL = 'bg-teal-500';
const SLATE = 'bg-slate-400';

const PROJECT_STATUS_MAP: Record<string, BadgeConfig> = {
  DRAFT: {
    label: 'Bản nháp',
    className: SLATE,
  },
  SUBMITTED: {
    label: 'Đã nộp hồ sơ',
    className: BLUE,
  },
  WAITING_ASSIGNMENT: {
    label: 'Chờ quyết định giao',
    className: VIOLET,
  },
  IN_PROGRESS: {
    label: 'Đang thực hiện',
    className: SKY,
  },
  WAITING_ACCEPTANCE: {
    label: 'Chờ nghiệm thu',
    className: AMBER,
  },
  ACCEPTED: {
    label: 'Đã nghiệm thu',
    className: EMERALD,
  },
  RECOGNIZED: {
    label: 'Đã công nhận kết quả',
    className: TEAL,
  },
  CLOSED: {
    label: 'Đã đóng hồ sơ',
    className: SLATE,
  },
  ARCHIVED: {
    label: 'Đã lưu trữ',
    className: SLATE,
  },
  SUSPENDED: {
    label: 'Tạm dừng',
    className: AMBER,
  },
  TERMINATED: {
    label: 'Đã chấm dứt',
    className: ROSE,
  },
  REJECTED: {
    label: 'Bị từ chối',
    className: RED,
  },
};

const PROPOSAL_STATUS_MAP: Record<string, BadgeConfig> = {
  DRAFT: {
    label: 'Bản nháp',
    className: SLATE,
  },
  SUBMITTED: {
    label: 'Chờ tiếp nhận',
    className: BLUE,
  },
  UNDER_ADMIN_REVIEW: {
    label: 'Đang kiểm tra hồ sơ',
    className: AMBER,
  },
  REVISION_REQUIRED: {
    label: 'Yêu cầu bổ sung',
    className: ROSE,
  },
  RESUBMITTED: {
    label: 'Đã nộp lại',
    className: VIOLET,
  },
  ADMIN_VALIDATED: {
    label: 'Hồ sơ hợp lệ',
    className: EMERALD,
  },
  OUTLINE_SUBMITTED: {
    label: 'Đã nộp đề cương',
    className: BLUE,
  },
  UNDER_PROPOSAL_REVIEW: {
    label: 'Đang xét duyệt đề cương',
    className: AMBER,
  },
  PROPOSAL_REVISION_REQUIRED: {
    label: 'Yêu cầu chỉnh sửa đề cương',
    className: ROSE,
  },
  PROPOSAL_RESUBMITTED: {
    label: 'Đã nộp lại đề cương',
    className: VIOLET,
  },
  UNDER_PROPOSAL_REVISION_REVIEW: {
    label: 'Đang kiểm tra đề cương chỉnh sửa',
    className: AMBER,
  },
  PROPOSAL_APPROVED: {
    label: 'Đề cương đã thông qua',
    className: EMERALD,
  },
  REJECTED: {
    label: 'Không thông qua',
    className: RED,
  },
};

const COUNCIL_STATUS_MAP: Record<string, BadgeConfig> = {
  DRAFT: {
    label: 'Dự thảo',
    className: SLATE,
  },
  ESTABLISHED: {
    label: 'Đã thành lập',
    className: BLUE,
  },
  EVALUATING: {
    label: 'Đang đánh giá',
    className: AMBER,
  },
  MINUTES_DRAFTED: {
    label: 'Đang hoàn thiện biên bản',
    className: VIOLET,
  },
  CONCLUDED: {
    label: 'Đã kết luận',
    className: EMERALD,
  },
  DISSOLVED: {
    label: 'Đã giải thể',
    className: SLATE,
  },
};

const ETHICS_STATUS_MAP: Record<string, BadgeConfig> = {
  NOT_REQUIRED: {
    label: 'Không yêu cầu',
    className: SLATE,
  },
  SCREENING_IN_PROGRESS: {
    label: 'Đang sàng lọc',
    className: AMBER,
  },
  DOSSIER_SUBMITTED: {
    label: 'Đã nộp hồ sơ',
    className: BLUE,
  },
  UNDER_ETHICS_REVIEW: {
    label: 'Đang thẩm định đạo đức',
    className: AMBER,
  },
  ETHICS_REVISION_REQUIRED: {
    label: 'Yêu cầu bổ sung',
    className: ROSE,
  },
  CONDITIONALLY_APPROVED: {
    label: 'Chấp thuận có điều kiện',
    className: VIOLET,
  },
  ETHICS_APPROVED: {
    label: 'Đã phê duyệt',
    className: EMERALD,
  },
  ETHICS_REJECTED: {
    label: 'Không phê duyệt',
    className: RED,
  },
  EXPIRED: {
    label: 'Hết hiệu lực',
    className: AMBER,
  },
  SUSPENDED: {
    label: 'Đình chỉ',
    className: AMBER,
  },
  WITHDRAWN: {
    label: 'Đã rút hồ sơ',
    className: SLATE,
  },
  TERMINATED: {
    label: 'Đã thu hồi',
    className: RED,
  },
};

const PROGRESS_STATUS_MAP: Record<string, BadgeConfig> = {
  DRAFT: {
    label: 'Bản nháp',
    className: SLATE,
  },
  SUBMITTED: {
    label: 'Đã nộp',
    className: BLUE,
  },
  UNDER_REVIEW: {
    label: 'Đang kiểm tra',
    className: AMBER,
  },
  REVISION_REQUIRED: {
    label: 'Yêu cầu chỉnh sửa',
    className: ROSE,
  },
  APPROVED: {
    label: 'Đã xác nhận',
    className: EMERALD,
  },
  REJECTED: {
    label: 'Không chấp nhận',
    className: RED,
  },
};

const CHANGE_STATUS_MAP: Record<string, BadgeConfig> = {
  DRAFT: {
    label: 'Bản nháp',
    className: SLATE,
  },
  SUBMITTED: {
    label: 'Đã gửi yêu cầu',
    className: BLUE,
  },
  UNDER_REVIEW: {
    label: 'Đang xem xét',
    className: AMBER,
  },
  REVISION_REQUIRED: {
    label: 'Yêu cầu bổ sung',
    className: ROSE,
  },
  RESUBMITTED: {
    label: 'Đã bổ sung',
    className: VIOLET,
  },
  APPROVED: {
    label: 'Đã phê duyệt',
    className: EMERALD,
  },
  REJECTED: {
    label: 'Không phê duyệt',
    className: RED,
  },
};

const ACCEPTANCE_STATUS_MAP: Record<string, BadgeConfig> = {
  NOT_SUBMITTED: {
    label: 'Chưa nộp',
    className: SLATE,
  },
  DRAFT: {
    label: 'Bản nháp',
    className: SLATE,
  },
  SUBMITTED: {
    label: 'Đã nộp hồ sơ',
    className: BLUE,
  },
  UNDER_ADMIN_REVIEW: {
    label: 'Đang kiểm tra',
    className: AMBER,
  },
  REVISION_REQUIRED: {
    label: 'Yêu cầu bổ sung',
    className: ROSE,
  },
  RESUBMITTED: {
    label: 'Đã nộp lại',
    className: VIOLET,
  },
  ELIGIBLE_FOR_ACCEPTANCE: {
    label: 'Đủ điều kiện nghiệm thu',
    className: EMERALD,
  },
  FORWARDED_TO_COUNCIL: {
    label: 'Đã chuyển Hội đồng',
    className: BLUE,
  },
};

const FINANCE_STATUS_MAP: Record<string, BadgeConfig> = {
  PENDING: {
    label: 'Chờ cấp kinh phí',
    className: AMBER,
  },
  ACTIVE: {
    label: 'Đang thực hiện',
    className: BLUE,
  },
  AWAITING_FINALIZATION: {
    label: 'Chờ quyết toán',
    className: AMBER,
  },
  FINALIZED: {
    label: 'Đã quyết toán',
    className: EMERALD,
  },
  CLOSED: {
    label: 'Đã đóng tài chính',
    className: SLATE,
  },
};

const ROUND_STATUS_MAP: Record<string, BadgeConfig> = {
  DRAFT: {
    label: 'Dự thảo',
    className: SLATE,
  },
  OPEN: {
    label: 'Đang mở',
    className: EMERALD,
  },
  CLOSED: {
    label: 'Đã đóng',
    className: SLATE,
  },
};

const STATUS_MAPS: Record<
  BadgeType,
  Record<string, BadgeConfig>
> = {
  PROJECT: PROJECT_STATUS_MAP,
  PROPOSAL: PROPOSAL_STATUS_MAP,
  COUNCIL: COUNCIL_STATUS_MAP,
  ETHICS: ETHICS_STATUS_MAP,
  PROGRESS: PROGRESS_STATUS_MAP,
  CHANGE: CHANGE_STATUS_MAP,
  ACCEPTANCE: ACCEPTANCE_STATUS_MAP,
  FINANCE: FINANCE_STATUS_MAP,
  ROUND: ROUND_STATUS_MAP,
};

const FALLBACK_STATUS_MAP: Record<string, BadgeConfig> = {
  ACTIVE: {
    label: 'Đang hoạt động',
    className: EMERALD,
  },
  INACTIVE: {
    label: 'Không hoạt động',
    className: SLATE,
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: RED,
  },
};

export const StatusBadge: React.FC<BadgeProps> = ({
  status,
  type,
}) => {
  if (!status) {
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-600"
      >
        —
      </span>
    );
  }

  const config =
    (type ? STATUS_MAPS[type]?.[status] : undefined) ||
    FALLBACK_STATUS_MAP[status] || {
      label: status.replace(/_/g, ' '),
      className: DEFAULT_CLASS,
    };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border border-slate-200 bg-slate-50/60 text-slate-700 whitespace-nowrap"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.className} shrink-0`} />
      {config.label}
    </span>
  );
};