'use client';

import React, { useState } from 'react';
import { ProjectWorkflowState } from '@/lib/utils/workflow-engine';
import { Check, X, Lock, Eye, Edit2, Play } from 'lucide-react';

interface LifecycleTimelineProps {
  workflowState: ProjectWorkflowState;
  policyName?: string;
}

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({
  workflowState,
  policyName,
}) => {
  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <>
      <section aria-label="Tiến độ thực hiện đề tài" className="select-none">
        <div className="bg-white border border-[#D8DEE6] rounded-xl p-4 flex items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Giai đoạn thực hiện (Chính sách: {policyName || 'Mặc định'})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0A6EBD] bg-sky-50 px-2 py-0.5 rounded border border-sky-100 shrink-0 font-mono">
                Bước {workflowState.currentStepNumber}/14
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0B2A63] truncate">
                {workflowState.currentStepTitle}
              </h4>
            </div>
          </div>

          <button
            onClick={() => setOpenDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#0A6EBD] bg-[#0A6EBD]/10 text-xs font-bold text-[#0A6EBD] hover:text-white rounded-lg transition border border-[#0A6EBD]/20 shadow-2xs cursor-pointer shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem chi tiết quy trình</span>
          </button>
        </div>
      </section>

      {/* DRAWER SIDEBAR OVERLAY */}
      {openDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setOpenDrawer(false)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#0B2A63] text-white">
              <div>
                <h3 className="text-sm font-bold">Lưu đồ vòng đời đề tài</h3>
                <p className="text-[10px] text-sky-200 mt-0.5">Khung quy trình 14 bước áp dụng chính sách</p>
              </div>
              <button
                onClick={() => setOpenDrawer(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-sky-100 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of 14 steps */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {workflowState.steps.map((step) => {
                let statusBadge = null;
                let stepBg = 'bg-white border-slate-150';
                let iconEl = null;
                let textColor = 'text-slate-800';

                switch (step.status) {
                  case 'COMPLETED':
                    iconEl = (
                      <span className="w-5.5 h-5.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    );
                    stepBg = 'bg-emerald-50/20 border-emerald-250/60';
                    break;
                  case 'SKIPPED':
                  case 'NOT_APPLICABLE':
                    iconEl = (
                      <span className="w-5.5 h-5.5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 font-mono text-[9px] font-bold border border-slate-300">
                        S
                      </span>
                    );
                    stepBg = 'bg-slate-50/70 border-slate-200/80 opacity-70';
                    textColor = 'text-slate-400 line-through';
                    statusBadge = (
                      <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold border border-slate-200 font-mono">
                        {step.status === 'SKIPPED' ? 'BỎ QUA' : 'K.ÁP DỤNG'}
                      </span>
                    );
                    break;
                  case 'BLOCKED':
                    iconEl = (
                      <span className="w-5.5 h-5.5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    );
                    stepBg = 'bg-rose-50/40 border-rose-200';
                    textColor = 'text-rose-800 font-bold';
                    statusBadge = (
                      <span className="text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase font-bold border border-rose-200 font-mono">
                        BỊ CHẶN
                      </span>
                    );
                    break;
                  case 'REVISION_REQUIRED':
                    iconEl = (
                      <span className="w-5.5 h-5.5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Edit2 className="w-2.5 h-2.5" />
                      </span>
                    );
                    stepBg = 'bg-amber-50/40 border-amber-200';
                    textColor = 'text-amber-800 font-bold';
                    statusBadge = (
                      <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-bold border border-amber-200 font-mono">
                        Y/C SỬA
                      </span>
                    );
                    break;
                  case 'CURRENT':
                    iconEl = (
                      <span className="w-5.5 h-5.5 rounded-full bg-[#0A6EBD] text-white flex items-center justify-center shrink-0 ring-4 ring-sky-100">
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </span>
                    );
                    stepBg = 'bg-sky-50/60 border-sky-200 ring-1 ring-sky-100';
                    textColor = 'text-[#0A6EBD] font-bold';
                    statusBadge = (
                      <span className="text-[8px] bg-sky-100 text-[#0A6EBD] px-1.5 py-0.5 rounded uppercase font-bold border border-sky-200 font-mono">
                        ĐANG LÀM
                      </span>
                    );
                    break;
                  case 'FUTURE':
                  default:
                    iconEl = (
                      <span className="w-5.5 h-5.5 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0 font-mono text-[9px] font-bold">
                        {step.stepNumber}
                      </span>
                    );
                    stepBg = 'bg-white border-slate-150 opacity-60';
                    textColor = 'text-slate-400';
                    break;
                }

                return (
                  <div
                    key={step.stepNumber}
                    className={`flex gap-3 p-3 rounded-xl border ${stepBg} transition-all duration-200`}
                  >
                    {iconEl}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold ${textColor}`}>
                          Bước {step.stepNumber}: {step.title}
                        </span>
                        {statusBadge}
                      </div>

                      {/* Giải trình bỏ qua (nếu có) */}
                      {step.skipReason && (
                        <p className="text-[10px] text-slate-600 bg-slate-100/80 px-2 py-1 rounded border border-slate-200/50 leading-relaxed font-semibold">
                          💡 {step.skipReason}
                        </p>
                      )}

                      {/* Tài liệu đính kèm yêu cầu */}
                      {step.requiredDocuments.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                            Checklist hồ sơ đính kèm:
                          </span>
                          <div className="space-y-1 pl-1">
                            {step.requiredDocuments.map((doc) => (
                              <div key={doc.type} className="flex items-center gap-1.5 text-[10px]">
                                {doc.uploaded ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-rose-500 font-bold flex items-center gap-0.5">
                                    ✗
                                  </span>
                                )}
                                <span className={doc.uploaded ? 'text-slate-600 font-semibold' : 'text-slate-500 font-bold'}>
                                  {doc.label} {doc.required && <span className="text-rose-500">*</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 text-center font-medium">
              HIS-CRMS • Cấu hình Quy trình khảo sát thông minh
            </div>
          </div>
        </div>
      )}
    </>
  );
};
