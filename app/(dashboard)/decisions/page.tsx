'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock3,
  FileText,
  MoreVertical,
  Plus,
  Search,
} from 'lucide-react';

import { repo } from '@/lib/repository';
import { DecisionStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import { CreateDecisionModal } from './CreateDecisionModal';

type DecisionType = 'ASSIGNMENT' | 'RECOGNITION';
type QueueStatus = DecisionStatus | 'ELIGIBLE';
type ActiveTab = QueueStatus | 'ALL';

type DecisionRowItem = {
  id: string;
  projectId: string;
  isEligibleOnly: boolean;
  decisionNumber?: string;
  createdAt?: string;
  status: QueueStatus;
  projectTitle: string;
  projectCode: string;
  piName: string;
};

const STATUS_META: Record<
  QueueStatus,
  { label: string; className: string }
> = {
  ELIGIBLE: {
    label: 'Chờ lập',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  DRAFT: {
    label: 'Dự thảo',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  PENDING_SIGNATURE: {
    label: 'Đang trình ký',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  RETURNED: {
    label: 'Đã trả lại',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  SIGNED: {
    label: 'Đã ký',
    className: 'border-sky-200 bg-sky-50 text-[#0A6EBD]',
  },
  ISSUED: {
    label: 'Đã ban hành',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
};

export default function DecisionsPage() {
  const { currentUser } = useAuth();

  const [decisionType, setDecisionType] =
    useState<DecisionType>('ASSIGNMENT');
  const [activeTab, setActiveTab] = useState<ActiveTab>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedProjectId, setPreSelectedProjectId] = useState<
    string | undefined
  >();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const projects = repo.getProjects();
  const decisions = repo.getDecisions({ type: decisionType });

  const eligibleProjects = useMemo(() => {
    const existingProjectIds = new Set(
      decisions.map((decision) => decision.projectId)
    );

    return projects.filter((project) => {
      if (existingProjectIds.has(project.id)) return false;

      if (decisionType === 'ASSIGNMENT') {
        return (
          project.status === 'WAITING_ASSIGNMENT' &&
          project.proposalStatus === 'PROPOSAL_APPROVED' &&
          (project.ethicsStatus === 'ETHICS_APPROVED' ||
            project.ethicsStatus === 'NOT_REQUIRED')
        );
      }

      // Với dữ liệu/type hiện đã xác minh, chỉ có thể chắc chắn gate này.
      // Gate "hoàn thiện sau nghiệm thu" phải bổ sung khi có field chuẩn.
      return project.status === 'ACCEPTED';
    });
  }, [projects, decisions, decisionType]);

  const eligibleItems: DecisionRowItem[] = eligibleProjects.map(
    (project) => ({
      id: `eligible-${project.id}`,
      projectId: project.id,
      isEligibleOnly: true,
      status: 'ELIGIBLE',
      projectTitle: project.title,
      projectCode:
        project.projectCode || project.proposalCode || '—',
      piName: project.principalInvestigatorName || '—',
    })
  );

  const decisionItems: DecisionRowItem[] = decisions.map((decision) => {
    const project = repo.getProjectById(decision.projectId);

    return {
      id: decision.id,
      projectId: decision.projectId,
      isEligibleOnly: false,
      decisionNumber: decision.decisionNumber,
      createdAt: decision.createdAt,
      status: decision.status,
      projectTitle: project?.title || 'Đề tài không tồn tại',
      projectCode:
        project?.projectCode || project?.proposalCode || '—',
      piName: project?.principalInvestigatorName || '—',
    };
  });

  const allItems = [...eligibleItems, ...decisionItems];

  const tabs: Array<{
    id: ActiveTab;
    label: string;
    count: number;
  }> = [
    { id: 'ALL', label: 'Tất cả', count: allItems.length },
    {
      id: 'ELIGIBLE',
      label: 'Chờ lập',
      count: eligibleItems.length,
    },
    {
      id: 'DRAFT',
      label: 'Dự thảo',
      count: decisionItems.filter((item) => item.status === 'DRAFT')
        .length,
    },
    {
      id: 'RETURNED',
      label: 'Đã trả lại',
      count: decisionItems.filter((item) => item.status === 'RETURNED')
        .length,
    },
    {
      id: 'PENDING_SIGNATURE',
      label: 'Đang trình ký',
      count: decisionItems.filter(
        (item) => item.status === 'PENDING_SIGNATURE'
      ).length,
    },
    {
      id: 'SIGNED',
      label: 'Đã ký',
      count: decisionItems.filter((item) => item.status === 'SIGNED')
        .length,
    },
    {
      id: 'ISSUED',
      label: 'Đã ban hành',
      count: decisionItems.filter((item) => item.status === 'ISSUED')
        .length,
    },
  ];

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allItems
      .filter(
        (item) => activeTab === 'ALL' || item.status === activeTab
      )
      .filter((item) => {
        if (!query) return true;

        return [
          item.decisionNumber,
          item.projectCode,
          item.projectTitle,
          item.piName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        if (a.status === 'ELIGIBLE' && b.status !== 'ELIGIBLE') return -1;
        if (a.status !== 'ELIGIBLE' && b.status === 'ELIGIBLE') return 1;

        const aTime = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
        const bTime = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return bTime - aTime;
      });
  }, [allItems, activeTab, search]);

  const openCreateModal = (projectId?: string) => {
    setPreSelectedProjectId(projectId);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const changeDecisionType = (type: DecisionType) => {
    setDecisionType(type);
    setActiveTab('ALL');
    setSearch('');
    setOpenMenuId(null);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Quản lý quyết định
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi việc lập, trình ký, ký và ban hành quyết định của
            đề tài nghiên cứu.
          </p>
        </div>

        {currentUser?.role === 'RESEARCH_OFFICE' && (
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0A6EBD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085896]"
          >
            <Plus className="h-4 w-4" />
            Lập quyết định
          </button>
        )}
      </header>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => changeDecisionType('ASSIGNMENT')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                decisionType === 'ASSIGNMENT'
                  ? 'bg-white text-[#0A6EBD] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Giao thực hiện
            </button>

            <button
              type="button"
              onClick={() => changeDecisionType('RECOGNITION')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                decisionType === 'RECOGNITION'
                  ? 'bg-white text-[#0A6EBD] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Công nhận kết quả
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm số QĐ, mã đề tài, tên đề tài..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#0A6EBD] focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto border-b border-slate-200 px-4">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'border-[#0A6EBD] text-[#0A6EBD]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="w-44 px-5 py-3">Số quyết định</th>
                <th className="w-36 px-5 py-3">Mã đề tài</th>
                <th className="min-w-[320px] px-5 py-3">Tên đề tài</th>
                <th className="w-56 px-5 py-3">Chủ nhiệm</th>
                <th className="w-32 px-5 py-3">Ngày lập</th>
                <th className="w-40 px-5 py-3">Trạng thái</th>
                <th className="w-20 px-5 py-3 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center"
                  >
                    <FileText className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      Không có dữ liệu phù hợp.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = STATUS_META[item.status];

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        {item.isEligibleOnly ? (
                          <span className="text-sm text-slate-400">
                            Chưa lập
                          </span>
                        ) : item.decisionNumber ? (
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {item.decisionNumber}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Chưa cấp số
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/projects/${item.projectId}`}
                          className="font-mono text-xs font-semibold text-[#0A6EBD] hover:underline"
                        >
                          {item.projectCode}
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        {item.isEligibleOnly ? (
                          <Link
                            href={`/projects/${item.projectId}`}
                            className="font-medium leading-5 text-slate-900 hover:text-[#0A6EBD]"
                          >
                            {item.projectTitle}
                          </Link>
                        ) : (
                          <Link
                            href={`/decisions/${item.id}`}
                            className="font-medium leading-5 text-slate-900 hover:text-[#0A6EBD]"
                          >
                            {item.projectTitle}
                          </Link>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {item.piName}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {item.createdAt
                          ? formatDate(item.createdAt)
                          : '—'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {item.status === 'PENDING_SIGNATURE' && (
                            <Clock3 className="h-3 w-3" />
                          )}
                          {item.status === 'ISSUED' && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === item.id
                                  ? null
                                  : item.id
                              )
                            }
                            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                            aria-label={`Thao tác với ${item.projectCode}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openMenuId === item.id && (
                            <>
                              <button
                                type="button"
                                className="fixed inset-0 z-10 cursor-default"
                                onClick={() => setOpenMenuId(null)}
                                aria-label="Đóng menu"
                              />

                              <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 text-left shadow-xl">
                                {item.isEligibleOnly ? (
                                  <>
                                    <Link
                                      href={`/projects/${item.projectId}`}
                                      onClick={() =>
                                        setOpenMenuId(null)
                                      }
                                      className="block px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                                    >
                                      Xem đề tài
                                    </Link>

                                    {currentUser?.role ===
                                      'RESEARCH_OFFICE' && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openCreateModal(
                                            item.projectId
                                          )
                                        }
                                        className="block w-full px-3 py-2.5 text-left text-sm font-medium text-[#0A6EBD] transition hover:bg-sky-50"
                                      >
                                        Lập quyết định
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Link
                                      href={`/decisions/${item.id}`}
                                      onClick={() =>
                                        setOpenMenuId(null)
                                      }
                                      className="block px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                      {getDecisionActionLabel(
                                        item.status,
                                        currentUser?.role
                                      )}
                                    </Link>

                                    <Link
                                      href={`/projects/${item.projectId}`}
                                      onClick={() =>
                                        setOpenMenuId(null)
                                      }
                                      className="block px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                                    >
                                      Xem đề tài
                                    </Link>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
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
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPreSelectedProjectId(undefined);
        }}
        preSelectedProjectId={preSelectedProjectId}
        decisionType={decisionType}
      />
    </div>
  );
}

function getDecisionActionLabel(
  status: QueueStatus,
  role?: string
) {
  if (status === 'ELIGIBLE') return 'Lập quyết định';
  if (status === 'DRAFT') return 'Tiếp tục soạn';
  if (status === 'RETURNED') return 'Xem và chỉnh sửa';

  if (status === 'PENDING_SIGNATURE') {
    return role === 'DIRECTOR'
      ? 'Xem và xử lý'
      : 'Xem trình ký';
  }

  if (status === 'SIGNED') {
    return role === 'RESEARCH_OFFICE'
      ? 'Xem và ban hành'
      : 'Xem bản đã ký';
  }

  if (status === 'ISSUED') return 'Xem quyết định';

  return 'Xem chi tiết';
}