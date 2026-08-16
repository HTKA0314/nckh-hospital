import React, { useEffect, useState } from 'react';
import { Save, Send, Signature, LockKeyhole } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import type {
  Council,
  CouncilMember,
  EvaluationResult,
  EvaluationScoreItem,
  ResearchProject,
} from '@/lib/types';
import { evaluationStatusLabel } from '../_utils/format';

interface EvaluationTabProps {
  council: Council;
  selectedProject?: ResearchProject;
  currentMember?: CouncilMember;
  currentEvaluation?: EvaluationResult;
  canEditEvaluation: boolean;
  onSaveDraft: (evaluation: EvaluationResult) => void;
  onSubmitEvaluation: (evaluation: EvaluationResult) => void;
  onSignEvaluation: () => void;
}

export function EvaluationTab({
  council,
  selectedProject,
  currentMember,
  currentEvaluation,
  canEditEvaluation,
  onSaveDraft,
  onSubmitEvaluation,
  onSignEvaluation,
}: EvaluationTabProps) {
  const { warning } = useToast();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [voteResult, setVoteResult] = useState<EvaluationResult['voteResult']>('APPROVE_WITH_REVISION');

  const criteria = council.scoringCriteriaSnapshot || [];
  const totalMaxScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);

  // Sync state with evaluation data when changed
  useEffect(() => {
    const nextScores: Record<string, number> = {};
    criteria.forEach((criterion) => {
      const item = currentEvaluation?.scores.find((score) => score.criteriaId === criterion.id);
      nextScores[criterion.id] = item?.score ?? 0;
    });
    setScores(nextScores);
    setComments(currentEvaluation?.comments || '');
    setRecommendations(currentEvaluation?.recommendations || '');
    setVoteResult(currentEvaluation?.voteResult || 'APPROVE_WITH_REVISION');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id, currentMember?.id, currentEvaluation?.id]);

  const totalScore = criteria.reduce((sum, criterion) => sum + Number(scores[criterion.id] || 0), 0);

  const buildEvaluation = (): EvaluationResult | null => {
    if (!currentMember || !selectedProject) return null;
    if (!criteria.length) {
      warning('Hội đồng chưa có bộ tiêu chí đánh giá được cấu hình.');
      return null;
    }

    const invalid = criteria.some((criterion) => {
      const score = Number(scores[criterion.id] || 0);
      return score < 0 || score > criterion.maxScore;
    });
    if (invalid) {
      warning('Điểm đánh giá không nằm trong giới hạn của tiêu chí.');
      return null;
    }

    const scoreItems: EvaluationScoreItem[] = criteria.map((criterion) => ({
      criteriaId: criterion.id,
      criteriaName: criterion.name,
      maxScore: criterion.maxScore,
      weight: criterion.weight,
      score: Number(scores[criterion.id] || 0),
    }));

    const now = new Date().toISOString();
    return {
      id: currentEvaluation?.id || `eval-${Date.now()}`,
      councilId: council.id,
      projectId: selectedProject.id,
      councilMemberId: currentMember.id,
      councilMemberName: currentMember.userFullName,
      roleInCouncil: currentMember.roleInCouncil,
      scores: scoreItems,
      totalScore,
      voteResult,
      comments: comments.trim(),
      recommendations: recommendations.trim() || undefined,
      submittedAt: currentEvaluation?.submittedAt || now,
      status: 'DRAFT',
      updatedAt: now,
    };
  };

  const handleSave = () => {
    const evaluation = buildEvaluation();
    if (evaluation) {
      onSaveDraft(evaluation);
    }
  };

  const handleSubmit = () => {
    if (!comments.trim()) {
      warning('Cần nhập nhận xét trước khi nộp phiếu đánh giá.');
      return;
    }
    const evaluation = buildEvaluation();
    if (evaluation) {
      onSubmitEvaluation(evaluation);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Phiếu đánh giá của tôi</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {selectedProject?.projectCode || selectedProject?.proposalCode} — {selectedProject?.title}
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-bold text-slate-600">
          {evaluationStatusLabel(currentEvaluation?.status)}
        </span>
      </div>

      {!currentMember && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-600">
          Tài khoản hiện tại không thuộc Hội đồng này.
        </div>
      )}
      {currentMember && criteria.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-800">
          Hội đồng chưa được gắn bộ tiêu chí đánh giá.
        </div>
      )}
      {currentMember && council.status === 'DRAFT' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs font-semibold text-amber-900 flex items-center gap-2">
          <span className="text-base">📌</span>
          <span>
            <strong>Hội đồng đang ở trạng thái Bản nháp (DRAFT).</strong> Phòng Quản lý NCKH / Ban Giám đốc cần xác nhận{' '}
            <strong>Thành lập / Mở đánh giá</strong> thì các thành viên mới có thể nhập điểm và nộp phiếu.
          </span>
        </div>
      )}

      {currentMember && criteria.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#0B2A63] text-[11px] font-bold uppercase text-white">
                <tr>
                  <th className="p-3">Tiêu chí</th>
                  <th className="w-28 p-3 text-center">Điểm tối đa</th>
                  <th className="w-36 p-3 text-center">Điểm đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criteria.map((criterion) => (
                  <tr key={criterion.id}>
                    <td className="p-3 font-semibold text-slate-800">
                      {criterion.name}
                      {criterion.isRequired && <span className="ml-1 text-rose-500">*</span>}
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{criterion.maxScore}</td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={criterion.maxScore}
                        disabled={!canEditEvaluation}
                        value={scores[criterion.id] ?? 0}
                        onChange={(event) =>
                          setScores((current) => ({
                            ...current,
                            [criterion.id]: Number(event.target.value),
                          }))
                        }
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-center font-mono font-bold disabled:bg-slate-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td className="p-3 font-bold">Tổng điểm</td>
                  <td className="p-3 text-center font-mono font-bold">{totalMaxScore}</td>
                  <td className="p-3 text-center font-mono text-sm font-bold text-[#0A6EBD]">
                    {totalScore}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-slate-700">Kết luận trên phiếu *</label>
              <select
                disabled={!canEditEvaluation}
                value={voteResult}
                onChange={(event) => setVoteResult(event.target.value as EvaluationResult['voteResult'])}
                className="w-full rounded-lg border border-slate-300 p-2 font-semibold disabled:bg-slate-100"
              >
                <option value="APPROVE">
                  {council.type === 'ACCEPTANCE' ? 'Đạt nghiệm thu' : 'Thông qua đề cương'}
                </option>
                <option value="APPROVE_WITH_REVISION">
                  {council.type === 'ACCEPTANCE' ? 'Đạt, cần hoàn thiện' : 'Thông qua, cần chỉnh sửa'}
                </option>
                <option value="REJECT">
                  {council.type === 'ACCEPTANCE' ? 'Không đạt nghiệm thu' : 'Không thông qua'}
                </option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">Kiến nghị</label>
              <input
                type="text"
                disabled={!canEditEvaluation}
                value={recommendations}
                onChange={(event) => setRecommendations(event.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 disabled:bg-slate-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block font-bold text-slate-700">Nhận xét *</label>
              <textarea
                disabled={!canEditEvaluation}
                rows={4}
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                className="w-full resize-none rounded-lg border border-slate-300 p-2.5 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            {canEditEvaluation && (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A6EBD] bg-white px-4 py-2 font-bold text-[#0A6EBD] hover:bg-sky-50 cursor-pointer"
              >
                <Save className="h-4 w-4" /> Lưu nháp
              </button>
            )}
            {canEditEvaluation && (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-4 py-2 font-bold text-white hover:bg-[#085896] cursor-pointer"
              >
                <Send className="h-4 w-4" /> Nộp phiếu
              </button>
            )}
            {currentEvaluation?.status === 'SUBMITTED' && (
              <button
                type="button"
                onClick={onSignEvaluation}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 cursor-pointer"
              >
                <Signature className="h-4 w-4" /> Ký xác nhận phiếu
              </button>
            )}
            {currentEvaluation?.status === 'SIGNED' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 font-bold text-emerald-700">
                <LockKeyhole className="h-4 w-4" /> Phiếu đã khóa
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
