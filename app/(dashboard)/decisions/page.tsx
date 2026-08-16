'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { repo } from '@/lib/repository';
import { Decision, DecisionStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Award,
  FileCheck,
  Search,
  Printer,
  Plus,
  X,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { CreateDecisionModal } from './CreateDecisionModal';

type DecisionTab = 'ALL' | DecisionStatus;
type DecisionTypeFilter = 'ALL' | 'ASSIGNMENT' | 'RECOGNITION';

const STATUS_LABEL: Record<DecisionStatus, string> = {
  DRAFT: 'Dự thảo',
  PENDING_SIGNATURE: 'Chờ ký',
  RETURNED: 'Trả lại',
  SIGNED: 'Đã ký',
  ISSUED: 'Đã ban hành',
};

const STATUS_CLASS: Record<DecisionStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  PENDING_SIGNATURE: 'border-amber-200 bg-amber-50 text-amber-700',
  RETURNED: 'border-rose-200 bg-rose-50 text-rose-700',
  SIGNED: 'border-sky-200 bg-sky-50 text-[#0A6EBD]',
  ISSUED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export default function DecisionsManagementPage() {
  const { currentUser } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [activeTab, setActiveTab] = useState<DecisionTab>('ALL');
  const [typeFilter, setTypeFilter] = useState<DecisionTypeFilter>('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDecisionType, setCreateDecisionType] = useState<'ASSIGNMENT' | 'RECOGNITION'>('ASSIGNMENT');

  const isResearchOffice = ['RESEARCH_OFFICE', 'ADMIN'].includes(currentUser?.role || '');

  const reload = () => setDecisions(repo.getDecisions());

  useEffect(() => {
    setIsMounted(true);
    reload();
  }, []);

  const projects = useMemo(() => repo.getProjects(), [decisions]);

  const filteredDecisions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return decisions.filter((decision) => {
      if (activeTab !== 'ALL' && decision.status !== activeTab) return false;
      if (typeFilter !== 'ALL' && decision.type !== typeFilter) return false;
      if (yearFilter !== 'ALL' && !decision.createdAt.startsWith(yearFilter)) return false;

      if (!query) return true;
      const project = projects.find((item) => item.id === decision.projectId);

      return [
        decision.decisionNumber,
        project?.projectCode,
        project?.proposalCode,
        project?.title,
        project?.principalInvestigatorName,
        project?.departmentName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [activeTab, decisions, projects, searchTerm, typeFilter]);

  const counts = useMemo(
    () => ({
      ALL: decisions.length,
      DRAFT: decisions.filter((item) => item.status === 'DRAFT').length,
      RETURNED: decisions.filter((item) => item.status === 'RETURNED').length,
      PENDING_SIGNATURE: decisions.filter((item) => item.status === 'PENDING_SIGNATURE').length,
      SIGNED: decisions.filter((item) => item.status === 'SIGNED').length,
      ISSUED: decisions.filter((item) => item.status === 'ISSUED').length,
    }),
    [decisions]
  );

  const getActionLabel = (decision: Decision) => {
    if (decision.status === 'DRAFT') return isResearchOffice ? 'Hoàn thiện' : 'Xem';
    if (decision.status === 'RETURNED') return isResearchOffice ? 'Chỉnh sửa' : 'Xem';
    if (decision.status === 'PENDING_SIGNATURE') {
      return ['DIRECTOR', 'ADMIN'].includes(currentUser?.role || '') ? 'Ký duyệt' : 'Theo dõi';
    }
    if (decision.status === 'SIGNED') return isResearchOffice ? 'Ban hành' : 'Xem';
    return 'Xem';
  };

  if (!isMounted) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải danh sách quyết định...</div>;
  }

  return (
    <div className="space-y-4 pb-12 text-xs text-slate-800">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">Quản lý quyết định</h1>
          <p className="mt-0.5 font-medium text-slate-500">
            Lập dự thảo, trình ký, ký và ban hành quyết định đề tài NCKH cấp cơ sở
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" /> In danh mục
          </button>

          {isResearchOffice && (
            <>
              <button
                type="button"
                onClick={() => {
                  setCreateDecisionType('ASSIGNMENT');
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-3 py-1.5 font-bold text-white hover:bg-[#085896]"
              >
                <Plus className="h-3.5 w-3.5" /> QĐ giao thực hiện
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateDecisionType('RECOGNITION');
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700"
              >
                <Award className="h-3.5 w-3.5" /> QĐ công nhận
              </button>
            </>
          )}
        </div>
      </header>

      <section className="flex overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 p-1">
        {[
          ['ALL', 'Tất cả'],
          ['DRAFT', 'Dự thảo'],
          ['RETURNED', 'Trả lại'],
          ['PENDING_SIGNATURE', 'Chờ ký'],
          ['SIGNED', 'Đã ký'],
          ['ISSUED', 'Đã ban hành'],
        ].map(([id, label]) => {
          const active = activeTab === id;
          const count = counts[id as keyof typeof counts];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as DecisionTab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 font-bold transition ${
                active ? 'border border-slate-200 bg-white text-[#0A6EBD] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 text-[10px] font-mono ${active ? 'bg-[#0A6EBD] text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </section>

      <section className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm số quyết định, mã đề tài, tên đề tài, chủ nhiệm..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-8 outline-none focus:border-[#0A6EBD]"
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as DecisionTypeFilter)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold outline-none focus:border-[#0A6EBD]"
        >
          <option value="ALL">Loại quyết định</option>
          <option value="ASSIGNMENT">Giao thực hiện</option>
          <option value="RECOGNITION">Công nhận kết quả</option>
        </select>
        <select
          value={yearFilter}
          onChange={(event) => setYearFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold outline-none focus:border-[#0A6EBD]"
        >
          <option value="ALL">Năm tạo</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#0B2A63] text-[11px] font-bold uppercase text-white tracking-wider">
              <tr>
                <th className="w-36 p-3">Loại quyết định</th>
                <th className="w-32 p-3">Số quyết định</th>
                <th className="min-w-[280px] p-3">Đề tài</th>
                <th className="w-36 p-3">Người trình</th>
                <th className="w-28 p-3 text-center">Ngày tạo</th>
                <th className="w-28 p-3 text-center">Ngày ký</th>
                <th className="w-32 p-3 text-center">Trạng thái</th>
                <th className="w-24 p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDecisions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">Không có quyết định phù hợp.</td>
                </tr>
              ) : (
                filteredDecisions.map((decision) => {
                  const project = projects.find((item) => item.id === decision.projectId);
                  return (
                    <tr key={decision.id} className="hover:bg-slate-50">
                      <td className="p-3 align-middle font-bold text-slate-900">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          {decision.type === 'ASSIGNMENT' ? <FileCheck className="h-3.5 w-3.5 text-[#0A6EBD]" /> : <Award className="h-3.5 w-3.5 text-emerald-600" />}
                          {decision.type === 'ASSIGNMENT' ? 'Giao TH' : 'Công nhận'}
                        </span>
                      </td>
                      <td className="p-3 align-middle font-mono font-bold text-[#0A6EBD]">
                        {decision.decisionNumber || <span className="font-normal italic text-slate-400">Chưa cấp số</span>}
                      </td>
                      <td className="p-3 align-middle">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono font-bold text-slate-500 mb-0.5">
                            {project?.projectCode || project?.proposalCode || '—'}
                          </span>
                          <Link href={`/decisions/${decision.id}`} className="font-bold leading-snug text-slate-900 hover:text-[#0A6EBD] line-clamp-2">
                            {project?.title || decision.projectId}
                          </Link>
                        </div>
                      </td>
                      <td className="p-3 align-middle font-semibold text-slate-600">
                        {decision.history?.find(h => h.action === 'DRAFT_CREATED' || h.action === 'SUBMITTED_FOR_SIGNATURE')?.actorName || '—'}
                      </td>
                      <td className="p-3 align-middle font-mono text-center text-slate-500">{formatDate(decision.createdAt)}</td>
                      <td className="p-3 align-middle font-mono text-center text-slate-700 font-semibold">{decision.signedDate ? formatDate(decision.signedDate) : '—'}</td>
                      <td className="p-3 text-center align-middle">
                        <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_CLASS[decision.status]}`}>
                          {STATUS_LABEL[decision.status]}
                        </span>
                      </td>
                      <td className="p-3 text-center align-middle">
                        <Link href={`/decisions/${decision.id}`} title="Xem chi tiết" className="inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 bg-white p-1.5 hover:bg-sky-50 hover:text-[#0A6EBD] hover:border-sky-200 transition shadow-2xs">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CreateDecisionModal
        isOpen={showCreateModal}
        decisionType={createDecisionType}
        onClose={() => {
          setShowCreateModal(false);
          reload();
        }}
      />
    </div>
  );
}