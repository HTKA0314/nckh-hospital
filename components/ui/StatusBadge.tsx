'use client';

import React from 'react';
import { ProjectStatus, ProposalStatus } from '@/lib/types';

interface BadgeProps {
  status: ProjectStatus | ProposalStatus | string;
  type?: 'PROJECT' | 'PROPOSAL' | 'COUNCIL' | 'ETHICS' | 'PROGRESS' | 'CHANGE' | 'FINANCE';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  let label = status;
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-300';

  switch (status) {
    // 1. Trạng thái Đề tài & Hồ sơ đăng ký
    case 'DRAFT':
      label = 'Chờ nộp đề cương';
      colorClass = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'SUBMITTED_PROPOSAL':
      label = 'Chờ duyệt đề xuất';
      colorClass = 'bg-blue-50 text-[#0A6EBD] border-blue-200';
      break;
    case 'UNDER_REVIEW':
      label = 'Đang thẩm định';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'SUBMITTED':
      label = 'Đã nộp hồ sơ';
      colorClass = 'bg-blue-50 text-[#0A6EBD] border-blue-200';
      break;
    case 'UNDER_ADMIN_REVIEW':
      label = 'Đang kiểm tra HĐ';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'ADMIN_VALIDATED':
      label = 'Chờ xét duyệt đề cương';
      colorClass = 'bg-sky-50 text-[#0A6EBD] border-[#B8D7F5] font-semibold';
      break;
    case 'REVISION_REQUIRED':
      label = 'Yêu cầu bổ sung';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      break;
    case 'PROPOSAL_REVISION_REQUIRED':
      label = 'Bổ sung đề xuất';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      break;
    case 'RESUBMITTED':
      label = 'Đã nộp lại';
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'VALID':
      label = 'Hồ sơ hợp lệ';
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      break;
    case 'PROPOSAL_APPROVED':
      label = 'Đã duyệt đề cương';
      colorClass = 'bg-blue-50 text-[#0A6EBD] border-[#B8D7F5] font-semibold';
      break;
    case 'WAITING_ASSIGNMENT':
      label = 'Chờ giao nhiệm vụ';
      colorClass = 'bg-violet-50 text-violet-700 border-violet-200 font-semibold';
      break;
    case 'APPROVED':
      label = 'Đã phê duyệt';
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      break;
    case 'ASSIGNED':
      label = 'Đã giao nhiệm vụ';
      colorClass = 'bg-sky-50 text-sky-700 border-sky-200 font-semibold';
      break;
    case 'IN_PROGRESS':
      label = 'Đang thực hiện';
      colorClass = 'bg-sky-50 text-sky-800 border-sky-300 font-semibold';
      break;
    case 'WAITING_ACCEPTANCE':
      label = 'Chờ nghiệm thu';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      break;
    case 'ACCEPTED':
      label = 'Đã nghiệm thu';
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      break;
    case 'RECOGNIZED':
      label = 'Công nhận kết quả';
      colorClass = 'bg-teal-50 text-teal-800 border-teal-300 font-bold';
      break;
    case 'CLOSED':
      label = 'Đã đóng hồ sơ';
      colorClass = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'ARCHIVED':
      label = 'Đã lưu trữ';
      colorClass = 'bg-slate-100 text-slate-600 border-slate-300';
      break;
    case 'REJECTED':
      label = 'Bị từ chối';
      colorClass = 'bg-red-50 text-red-700 border-red-200 font-semibold';
      break;
    case 'TERMINATED':
      label = 'Chấm dứt trước hạn';
      colorClass = 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
      break;
    case 'SUSPENDED':
      label = 'Tạm dừng thực hiện';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'CANCELLED':
      label = 'Đã hủy';
      colorClass = 'bg-red-50 text-red-600 border-red-200';
      break;

    // 2. Trạng thái Hội đồng khoa học
    case 'ESTABLISHED':
      label = 'Đã thành lập';
      colorClass = 'bg-blue-50 text-[#0A6EBD] border-blue-200 font-semibold';
      break;
    case 'MEETING_SCHEDULED':
      label = 'Đã lên lịch họp';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'IN_SESSION':
      label = 'Đang họp hội đồng';
      colorClass = 'bg-purple-50 text-purple-700 border-purple-300 font-bold';
      break;
    case 'CONCLUDED':
      label = 'Đã có kết luận';
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      break;
    case 'DISSOLVED':
      label = 'Đã giải thể';
      colorClass = 'bg-slate-100 text-slate-600 border-slate-300';
      break;

    // 3. Trạng thái Hội đồng Đạo đức
    case 'ETHICS_APPROVED':
      label = 'Đạt chuẩn đạo đức';
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      break;
    case 'DOSSIER_SUBMITTED':
      label = 'Chờ duyệt đạo đức';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'ETHICS_REVISION_REQUIRED':
      label = 'Bổ sung hồ sơ đạo đức';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-300';
      break;
    case 'NOT_REQUIRED':
      label = 'Không thuộc diện';
      colorClass = 'bg-slate-100 text-slate-600 border-slate-300';
      break;

    // 4. Trạng thái Đợt đăng ký
    case 'OPEN':
      label = 'Đang mở nộp';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
      break;
    case 'CLOSED_ROUND':
      label = 'Đã đóng đợt';
      colorClass = 'bg-slate-100 text-slate-600 border-slate-300';
      break;
    case 'EVALUATION':
      label = 'Đang xét duyệt';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-300';
      break;

    // 5. Trạng thái Yêu cầu điều chỉnh & Tài chính
    case 'PENDING':
      label = 'Chờ thẩm định';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'DISBURSED':
      label = 'Đã giải ngân';
      colorClass = 'bg-blue-50 text-[#0A6EBD] border-blue-200 font-semibold';
      break;
    case 'SETTLED':
      label = 'Đã quyết toán';
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      break;

    // 6. Trạng thái Thành viên / Nhân sự
    case 'ACTIVE':
      label = 'Đang hoạt động';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
      break;
    case 'INACTIVE':
      label = 'Không hoạt động';
      colorClass = 'bg-slate-100 text-slate-600 border-slate-300';
      break;

    default:
      label = status?.replace(/_/g, ' ') ?? '—';
      colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] border whitespace-nowrap ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      {label}
    </span>
  );
};
