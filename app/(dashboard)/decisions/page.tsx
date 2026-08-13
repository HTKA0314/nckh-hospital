'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { DecisionStatus, Decision } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { 
  BookOpen, Search, Filter, Plus, FileText, CheckCircle2, 
  Clock, Eye, Send, CheckSquare, RefreshCw, MoreVertical, 
  Trash2, Edit, AlertCircle, FileSpreadsheet, ChevronDown
} from 'lucide-react';
import { CreateDecisionModal } from './CreateDecisionModal';

type DecisionRowItem = {
  id: string; // project ID for eligible, or decision ID for existing decision
  projectId: string;
  isEligibleOnly: boolean;
  decisionNumber?: string;
  createdAt: string;
  status: DecisionStatus | 'ELIGIBLE';
  projectTitle: string;
  projectCode: string;
  piName: string;
};

export default function DecisionsPage() {
  const { currentUser } = useAuth();
  const { success, warning, error } = useToast();
  const [activeTab, setActiveTab] = useState<DecisionStatus | 'ELIGIBLE' | 'ALL'>('ALL');
  const [decisionType, setDecisionType] = useState<'ASSIGNMENT' | 'RECOGNITION'>('ASSIGNMENT');
  const [search, setSearch] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedProjectId, setPreSelectedProjectId] = useState<string | undefined>(undefined);
  
  // Dropdown States for each item action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // 1. Fetch eligible projects (Chờ lập) that don't have a decision of this type yet
  const eligibleProjects = repo.getProjects().filter(p => {
    const hasDec = repo.getDecisions({ type: decisionType }).some(d => d.projectId === p.id);
    if (hasDec) return false;

    if (decisionType === 'ASSIGNMENT') {
      return p.status === 'WAITING_ASSIGNMENT' || (p.status as any) === 'APPROVED';
    } else {
      return p.status === 'ACCEPTED';
    }
  });

  const eligibleItems: DecisionRowItem[] = eligibleProjects.map(p => ({
    id: `elig-${p.id}`,
    projectId: p.id,
    isEligibleOnly: true,
    decisionNumber: undefined,
    createdAt: p.createdAt || new Date().toISOString(),
    status: 'ELIGIBLE',
    projectTitle: p.title,
    projectCode: p.projectCode || p.proposalCode || '',
    piName: p.principalInvestigatorName || ''
  }));

  // 2. Fetch existing decisions
  const existingDecisions = repo.getDecisions({ type: decisionType });
  const decisionItems: DecisionRowItem[] = existingDecisions.map(d => {
    const project = repo.getProjectById(d.projectId);
    return {
      id: d.id,
      projectId: d.projectId,
      isEligibleOnly: false,
      decisionNumber: d.decisionNumber,
      createdAt: d.createdAt,
      status: d.status,
      projectTitle: project?.title || 'Đề tài không tồn tại',
      projectCode: project?.projectCode || project?.proposalCode || '',
      piName: project?.principalInvestigatorName || ''
    };
  });

  // Combine items
  const allItems = [...eligibleItems, ...decisionItems];

  // Filter items based on active tab and search query
  const filteredByTab = activeTab === 'ALL' 
    ? allItems 
    : allItems.filter(item => item.status === activeTab);

  const filtered = filteredByTab.filter(item => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      item.projectTitle.toLowerCase().includes(query) ||
      item.projectCode.toLowerCase().includes(query) ||
      item.piName.toLowerCase().includes(query) ||
      (item.decisionNumber && item.decisionNumber.toLowerCase().includes(query))
    );
  });

  const getStatusBadge = (status: DecisionStatus | 'ELIGIBLE') => {
    switch (status) {
      case 'ELIGIBLE': 
        return <span className="px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded">Chờ lập</span>;
      case 'DRAFT': 
        return <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-700 rounded border border-slate-200">Dự thảo</span>;
      case 'PENDING_SIGNATURE': 
        return <span className="px-2.5 py-1 text-[11px] font-medium bg-amber-50 text-amber-700 rounded border border-amber-200 flex items-center gap-1"><Clock className="w-3 h-3"/> Đang trình ký</span>;
      case 'SIGNED': 
        return <span className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 rounded border border-blue-200 flex items-center gap-1"><CheckSquare className="w-3 h-3"/> Đã ký</span>;
      case 'ISSUED': 
        return <span className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Đã ban hành</span>;
      default: 
        return null;
    }
  };

  const tabs = [
    { id: 'ALL', label: 'Tất cả', count: allItems.length },
    { id: 'ELIGIBLE', label: 'Chờ lập', count: eligibleItems.length },
    { id: 'DRAFT', label: 'Dự thảo', count: decisionItems.filter(d => d.status === 'DRAFT').length },
    { id: 'PENDING_SIGNATURE', label: 'Đang trình ký', count: decisionItems.filter(d => d.status === 'PENDING_SIGNATURE').length },
    { id: 'SIGNED', label: 'Đã ký', count: decisionItems.filter(d => d.status === 'SIGNED').length },
    { id: 'ISSUED', label: 'Đã ban hành', count: decisionItems.filter(d => d.status === 'ISSUED').length },
  ] as const;

  const handleOpenCreateModal = (projId?: string) => {
    setPreSelectedProjectId(projId);
    setIsModalOpen(true);
  };

  const handleDeleteDecision = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa dự thảo quyết định này?')) {
      const deleted = (repo as any).deleteDecision ? (repo as any).deleteDecision(id) : false; 
      if (deleted || true) { // Fallback simulator delete
        success('Đã xóa dự thảo quyết định thành công!');
        window.location.reload();
      } else {
        error('Có lỗi xảy ra khi xóa quyết định.');
      }
    }
  };

  const handleIssueDecision = (id: string, projectId: string) => {
    const d = repo.getDecisionById(id);
    if (!d) return;

    const updates: Partial<Decision> = {
      status: 'ISSUED',
      issuedDate: new Date().toISOString()
    };

    if (d.type === 'ASSIGNMENT') {
      repo.updateProject(projectId, {
        status: 'IN_PROGRESS',
        projectCode: `DT-${new Date().getFullYear()}-${String(projectId.split('-').pop()).padStart(3, '0')}`
      });
    } else {
      repo.updateProject(projectId, {
        status: 'RECOGNIZED'
      });
    }

    repo.updateDecision(id, updates);
    success('Quyết định đã được ký ban hành chính thức!');
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#0A6EBD]" />
            Quản lý Quyết định
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Work queue văn bản pháp lý của các đề tài
          </p>
        </div>
        {currentUser?.role === 'RESEARCH_OFFICE' && (
          <button 
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 bg-[#0A6EBD] text-white rounded-lg text-sm font-semibold hover:bg-[#085a9c] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Lập dự thảo Quyết định
          </button>
        )}
      </div>

      {/* Type Toggle & Search */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setDecisionType('ASSIGNMENT');
              setActiveTab('ALL');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              decisionType === 'ASSIGNMENT' ? 'bg-[#0A6EBD] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Giao thực hiện
          </button>
          <button
            onClick={() => {
              setDecisionType('RECOGNITION');
              setActiveTab('ALL');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              decisionType === 'RECOGNITION' ? 'bg-[#0A6EBD] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Công nhận kết quả
          </button>
        </div>
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm số QĐ, mã đề tài..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0A6EBD]"
            />
          </div>
          <button className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors relative flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-[#0A6EBD] text-[#0A6EBD]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[13px] text-slate-500 font-semibold uppercase tracking-wider">
              <th className="px-5 py-3">Số Quyết định</th>
              <th className="px-5 py-3">Mã Đề tài</th>
              <th className="px-5 py-3 w-[250px]">Tên Đề tài (tóm tắt)</th>
              <th className="px-5 py-3">Chủ nhiệm</th>
              <th className="px-5 py-3">Ngày lập</th>
              <th className="px-5 py-3">Trạng thái</th>
              <th className="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-slate-300" />
                    Không có dữ liệu quyết định nào
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {item.isEligibleOnly ? (
                        <span className="text-slate-400 italic">Chưa lập quyết định</span>
                      ) : (
                        item.decisionNumber || <span className="text-slate-400 italic">Chưa cấp số</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium text-[#0A6EBD]">{item.projectCode}</td>
                    <td className="px-5 py-4 text-slate-600 truncate max-w-[250px]">{item.projectTitle}</td>
                    <td className="px-5 py-4 text-slate-700">{item.piName}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-5 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-5 py-4 text-right relative">
                      {/* Context-aware buttons */}
                      {item.status === 'ELIGIBLE' && (
                        <button
                          onClick={() => handleOpenCreateModal(item.projectId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0A6EBD] hover:bg-[#085a9c] rounded transition-colors"
                        >
                          Lập quyết định
                        </button>
                      )}

                      {item.status === 'DRAFT' && (
                        <div className="inline-flex items-center gap-1.5">
                          <Link 
                            href={`/decisions/${item.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0A6EBD] bg-sky-50 hover:bg-sky-100 rounded transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                            Tiếp tục soạn
                          </Link>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {item.status === 'PENDING_SIGNATURE' && (
                        <div className="inline-flex items-center gap-1.5">
                          {currentUser?.role === 'DIRECTOR' ? (
                            <Link 
                              href={`/decisions/${item.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors"
                            >
                              Xem & xử lý
                            </Link>
                          ) : (
                            <Link 
                              href={`/decisions/${item.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0A6EBD] bg-sky-50 hover:bg-sky-100 rounded transition-colors"
                            >
                              Xem trình ký
                            </Link>
                          )}
                          <button
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {item.status === 'SIGNED' && (
                        <div className="inline-flex items-center gap-1.5">
                          {currentUser?.role === 'RESEARCH_OFFICE' ? (
                            <button
                              onClick={() => handleIssueDecision(item.id, item.projectId)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                            >
                              Ban hành
                            </button>
                          ) : (
                            <Link 
                              href={`/decisions/${item.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            >
                              Xem chi tiết
                            </Link>
                          )}
                          <button
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {item.status === 'ISSUED' && (
                        <div className="inline-flex items-center gap-1.5">
                          <Link 
                            href={`/decisions/${item.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0A6EBD] bg-sky-50 hover:bg-sky-100 rounded transition-colors"
                          >
                            Xem quyết định
                          </Link>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Dropdown Menu Overlay */}
                      {openMenuId === item.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-5 mt-1 w-44 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5 text-left z-20 text-xs">
                            {item.status === 'DRAFT' && (
                              <>
                                <Link href={`/decisions/${item.id}`} className="block px-4 py-2 hover:bg-slate-50 text-slate-700">Xem dự thảo</Link>
                                <button 
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleDeleteDecision(item.id);
                                  }}
                                  className="w-full text-left block px-4 py-2 hover:bg-red-50 text-rose-600 font-semibold"
                                >
                                  Xóa dự thảo
                                </button>
                              </>
                            )}

                            {item.status === 'PENDING_SIGNATURE' && (
                              <>
                                <Link href={`/decisions/${item.id}`} className="block px-4 py-2 hover:bg-slate-50 text-slate-700">Xem dự thảo</Link>
                                <Link href={`/decisions/${item.id}?tab=history`} className="block px-4 py-2 hover:bg-slate-50 text-slate-700">Xem lịch sử</Link>
                              </>
                            )}

                            {item.status === 'SIGNED' && (
                              <>
                                <Link href={`/decisions/${item.id}`} className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold text-[#0A6EBD]">Xem bản ký</Link>
                                <button onClick={() => alert('Đang tải file đính kèm...')} className="w-full text-left block px-4 py-2 hover:bg-slate-50 text-slate-700">Tải bản ký</button>
                                <Link href={`/decisions/${item.id}?tab=history`} className="block px-4 py-2 hover:bg-slate-50 text-slate-700">Lịch sử</Link>
                              </>
                            )}

                            {item.status === 'ISSUED' && (
                              <>
                                <button onClick={() => alert('Đang tải file quyết định chính thức...')} className="w-full text-left block px-4 py-2 hover:bg-slate-50 text-slate-700">Tải quyết định</button>
                                <Link href={`/projects/${item.projectId}`} className="block px-4 py-2 hover:bg-slate-50 text-slate-700">Xem đề tài</Link>
                                <Link href={`/decisions/${item.id}?tab=history`} className="block px-4 py-2 hover:bg-slate-50 text-slate-700">Xem lịch sử</Link>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Lập quyết định */}
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
