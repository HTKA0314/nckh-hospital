import React from 'react';
import type { Council, EvaluationResult } from '@/lib/types';
import { evaluationStatusLabel } from '../_utils/format';

interface SummaryTabProps {
  council: Council;
  selectedProjectId: string;
  selectedProjectResults: EvaluationResult[];
  totalMaxScore: number;
  projectStats: Record<
    string,
    { signedCount: number; averageScore?: number; passCount: number; passRatio: number }
  >;
}

export function SummaryTab({
  council,
  selectedProjectId,
  selectedProjectResults,
  totalMaxScore,
  projectStats,
}: SummaryTabProps) {
  const evaluators = council.members.filter((member) => member.canEvaluate !== false);
  const signedProjectResults = selectedProjectResults.filter((result) => result.status === 'SIGNED');
  const currentStats = projectStats[selectedProjectId];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Tổng hợp phiếu đánh giá</h2>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Chỉ phiếu đã ký xác nhận mới được đưa vào kết quả tổng hợp của Hội đồng.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-[#0B2A63] text-[11px] font-bold uppercase text-white">
            <tr>
              <th className="p-3">Thành viên</th>
              <th className="p-3 text-center">Vai trò</th>
              <th className="p-3 text-center">Trạng thái phiếu</th>
              <th className="p-3 text-center">Điểm số</th>
              <th className="p-3">Kết luận phiếu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
            {evaluators.map((member) => {
              const result = selectedProjectResults.find((item) => item.councilMemberId === member.id);
              return (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{member.userFullName}</td>
                  <td className="p-3 text-center font-bold text-[#0A6EBD]">{member.roleInCouncil}</td>
                  <td className="p-3 text-center">{evaluationStatusLabel(result?.status)}</td>
                  <td className="p-3 text-center font-mono font-bold">
                    {result?.status === 'SIGNED' ? `${result.totalScore}/${totalMaxScore}` : '—'}
                  </td>
                  <td className="p-3">
                    {result?.status === 'SIGNED' ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          result.voteResult === 'APPROVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : result.voteResult === 'APPROVE_WITH_REVISION'
                            ? 'bg-sky-50 text-[#0A6EBD] border border-sky-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {result.voteResult === 'APPROVE'
                          ? 'Thông qua'
                          : result.voteResult === 'APPROVE_WITH_REVISION'
                          ? 'Thông qua, cần chỉnh sửa'
                          : 'Không thông qua'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-slate-500 font-semibold">Phiếu đã ký</span>
          <strong className="mt-1 block text-lg font-mono text-slate-900">
            {signedProjectResults.length}/{evaluators.length}
          </strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-slate-500 font-semibold">Điểm trung bình</span>
          <strong className="mt-1 block text-lg font-mono text-[#0A6EBD]">
            {currentStats?.averageScore?.toFixed(1) || '—'}
          </strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-slate-500 font-semibold">Tỷ lệ phiếu đạt</span>
          <strong className="mt-1 block text-lg font-mono text-emerald-700">
            {currentStats?.signedCount ? `${Math.round(currentStats.passRatio * 100)}%` : '—'}
          </strong>
        </div>
      </div>
    </div>
  );
}
