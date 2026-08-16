import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Council, EvaluationResult, MeetingMinutes } from '@/lib/types';
import { formatDateVi } from '../_utils/format';
import { exportCouncilMinutesToWord } from '../_utils/exportWord';

interface CouncilHeaderProps {
  council: Council;
  meetingMinutes?: MeetingMinutes;
  allResults: EvaluationResult[];
}

export function CouncilHeader({ council, meetingMinutes, allResults }: CouncilHeaderProps) {
  const handleExport = () => {
    if (meetingMinutes) {
      exportCouncilMinutesToWord(council, meetingMinutes, allResults);
    }
  };

  return (
    <div className="space-y-4">
      <Link href="/councils" className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-[#0A6EBD]">
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách Hội đồng
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-sky-200 bg-sky-50 px-2.5 py-0.5 font-mono font-bold text-[#0A6EBD]">
                {council.code}
              </span>
              <StatusBadge status={council.status} type="COUNCIL" />
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-bold text-slate-600">
                {council.type === 'ACCEPTANCE' ? 'Hội đồng nghiệm thu' : 'Hội đồng xét duyệt đề cương'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{council.name}</h1>
            <p className="font-medium text-slate-500">
              {formatDateVi(council.meetingDate)}{' '}
              {council.meetingTime ? `• ${council.meetingTime}` : ''} • {council.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {meetingMinutes && ['CONFIRMED', 'SIGNED'].includes(meetingMinutes.status) && (
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 font-bold text-white hover:bg-emerald-700 cursor-pointer"
              >
                <Download className="h-4 w-4" /> Xuất biên bản
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Printer className="h-4 w-4" /> In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
