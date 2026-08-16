import type { CouncilConclusion } from '@/lib/types';

export function formatDateVi(value?: string) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function conclusionLabel(type: string, conclusion: CouncilConclusion) {
  if (type === 'ACCEPTANCE') {
    if (conclusion === 'APPROVED') return 'Đạt nghiệm thu';
    if (conclusion === 'APPROVED_WITH_REVISION') return 'Đạt, yêu cầu hoàn thiện';
    if (conclusion === 'RE_EVALUATE') return 'Đánh giá lại';
    return 'Không đạt nghiệm thu';
  }

  if (conclusion === 'APPROVED') return 'Thông qua đề cương';
  if (conclusion === 'APPROVED_WITH_REVISION') return 'Thông qua, yêu cầu chỉnh sửa';
  if (conclusion === 'RE_EVALUATE') return 'Đánh giá lại';
  return 'Không thông qua';
}

export function evaluationStatusLabel(status?: string) {
  if (status === 'SIGNED') return 'Đã ký xác nhận';
  if (status === 'SUBMITTED') return 'Đã nộp';
  if (status === 'DRAFT') return 'Bản nháp';
  return 'Chưa có phiếu';
}

export function minuteStatusLabel(status?: string) {
  if (status === 'PENDING_CHAIR_CONFIRMATION') return 'Chờ Chủ tịch xác nhận';
  if (status === 'CONFIRMED') return 'Đã xác nhận';
  if (status === 'SIGNED') return 'Đã ký';
  if (status === 'DRAFT') return 'Dự thảo';
  return 'Chưa lập';
}
