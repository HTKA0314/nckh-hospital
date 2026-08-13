'use client';

import React from 'react';
import { AuditLog } from '@/lib/types';
import { User, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuditLogTimelineProps {
  logs: AuditLog[];
}

export const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-xs font-semibold">
        Không có lịch sử nhật ký vận hành.
      </div>
    );
  }

  const getActionIcon = (actionCode: string) => {
    switch (actionCode) {
      case 'SUBMIT_PROPOSAL':
      case 'PROJECT_SUBMITTED':
        return <FileText className="w-4 h-4 text-sky-600" />;
      case 'REVIEW_PROPOSAL_VALID':
      case 'APPROVE_DECISION':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'REVIEW_PROPOSAL_REVISION_REQUIRED':
      case 'DOSSIER_REVISION_REQUIRED':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActionBadgeColor = (actionCode: string) => {
    switch (actionCode) {
      case 'SUBMIT_PROPOSAL':
      case 'PROJECT_SUBMITTED':
        return 'bg-sky-50 border-sky-200 text-sky-700';
      case 'REVIEW_PROPOSAL_VALID':
      case 'APPROVE_DECISION':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'REVIEW_PROPOSAL_REVISION_REQUIRED':
      case 'DOSSIER_REVISION_REQUIRED':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  return (
    <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6">
      {logs.map((log) => (
        <div key={log.id} className="relative group">
          {/* Bullet point */}
          <div className="absolute -left-[35px] top-1.5 w-[18px] h-[18px] rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shadow-sm shrink-0">
            {getActionIcon(log.actionCode)}
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 transition hover:bg-slate-100/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold uppercase">
                  {log.userFullName.slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{log.userFullName}</h4>
                  <span className="text-[10px] font-semibold text-slate-500">{log.userRole}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{log.timestamp}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getActionBadgeColor(log.actionCode)}`}>
                {log.actionCode}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {log.entityType} ID: {log.entityId}
              </span>
            </div>

            {log.notes && (
              <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-100 rounded-lg p-2.5 font-medium">
                {log.notes}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
