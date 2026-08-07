'use client';

import React from 'react';
import { ProjectStatus } from '@/lib/types';
import { Check, Circle, Clock } from 'lucide-react';

interface LifecycleTimelineProps {
  currentStatus: ProjectStatus;
}

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({ currentStatus }) => {
  const steps = [
    { label: 'Bản nháp', statuses: ['DRAFT'] },
    { label: 'Nộp hồ sơ', statuses: ['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'REVISION_REQUIRED', 'RESUBMITTED', 'VALID'] },
    { label: 'Hội đồng duyệt', statuses: ['PROPOSAL_APPROVED'] },
    { label: 'Đang thực hiện', statuses: ['IN_PROGRESS'] },
    { label: 'Nghiệm thu', statuses: ['ACCEPTED'] },
    { label: 'Lưu trữ & Đóng', statuses: ['CLOSED', 'ARCHIVED'] },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'SUBMITTED':
      case 'UNDER_ADMIN_REVIEW':
      case 'REVISION_REQUIRED':
      case 'RESUBMITTED':
      case 'VALID': return 1;
      case 'PROPOSAL_APPROVED': return 2;
      case 'IN_PROGRESS': return 3;
      case 'ACCEPTED': return 4;
      case 'CLOSED':
      case 'ARCHIVED': return 5;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="h-10 bg-white border border-[#D8DEE6] rounded px-4 flex items-center justify-between shadow-sm">
      {steps.map((step, idx) => {
        const isPast = idx < currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <React.Fragment key={step.label}>
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition ${
                  isPast
                    ? 'bg-[#0A6EBD] text-white'
                    : isCurrent
                    ? 'bg-[#0A6EBD] text-white ring-4 ring-[#EBF4FC]'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isPast ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
              </span>
              <span
                className={`text-[13px] whitespace-nowrap ${
                  isCurrent
                    ? 'font-bold text-[#0A6EBD]'
                    : isPast
                    ? 'font-semibold text-slate-800'
                    : 'text-slate-400 font-medium'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-3 transition ${
                  idx < currentIndex ? 'bg-[#0A6EBD]' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
