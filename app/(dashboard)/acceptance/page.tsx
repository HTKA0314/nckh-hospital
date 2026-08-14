'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import {
  Search,
  Printer,
  X,
  FileText,
  Paperclip,
  Check,
  AlertTriangle,
  ClipboardList,
  MoreVertical,
  FileCheck2,
  Award,
  Eye,
} from 'lucide-react';
import { canCreateMinutes } from '@/lib/utils/permissions';
import { PageHeader } from '@/components/common/PageHeader';
import { TableEmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/utils';

interface AcceptanceDoc {
  name: string;
  status: 'OK' | 'MISSING';
}

interface AcceptanceCheckitem {
  label: string;
  checked: boolean;
}

interface AcceptanceProject {
  id: string;
  projectCode?: string;
  proposalCode: string;
  title: string;
  principalInvestigatorName: string;
  departmentName: string;
  researchField: string;
  approvedBudget: number;
  estimatedBudget: number;
  status: string;
  acceptanceStatus: 'PENDING_REVIEW' | 'REVISION_REQUIRED' | 'ELIGIBLE' | 'FORWARDED' | 'PROCESSED';
  acceptanceDate: string;
  acceptanceDocCount: string;
  acceptanceDeadline: string;
  acceptanceDocs: AcceptanceDoc[];
  acceptanceChecklist: AcceptanceCheckitem[];
  reviewComment?: string;
  minutesCreated?: boolean;
}

export default function GlobalAcceptancePage() {
  const { currentUser } = useAuth();
  const { success, warning, info } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [projects, setProjects] = useState<AcceptanceProject[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING_REVIEW' | 'REVISION_REQUIRED' | 'ELIGIBLE' | 'FORWARDED' | 'PROCESSED'>('PENDING_REVIEW');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedProject, setSelectedProject] = useState<AcceptanceProject | null>(null);

  // Modal Workspace States
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [checklistState, setChecklistState] = useState<boolean[]>([]);
  const [commentText, setCommentText] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const defaultDocs: AcceptanceDoc[] = [
    { name: 'Báo cáo tổng kết đề tài', status: 'OK' },
    { name: 'Bản giải trình / Báo cáo tóm tắt', status: 'OK' },
    { name: 'Sản phẩm nghiên cứu bàn giao', status: 'OK' },
    { name: 'Minh chứng xuất bản bài báo (nếu có)', status: 'OK' },
    { name: 'Báo cáo quyết toán tài chính', status: 'OK' },
    { name: 'Ý kiến phê duyệt khoa phòng', status: 'OK' },
  ];

  const defaultChecklist: AcceptanceCheckitem[] = [
    { label: 'Đúng biểu mẫu theo quy định BM-NT-01', checked: true },
    { label: 'Thuyết minh sản phẩm thực tế đầy đủ', checked: true },
    { label: 'Đầy đủ chứng từ quyết toán tài chính', checked: true },
    { label: 'Đảm bảo tiến độ thực hiện đã đăng ký', checked: true },
  ];

  useEffect(() => {
    setIsMounted(true);
    const allProjects = repo.getProjects();
    const targetProjects = allProjects.filter(
      (p) => p.status === 'WAITING_ACCEPTANCE' || ['ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(p.status) || ['proj-08', 'proj-09', 'proj-10'].includes(p.id)
    );

    const mapped: AcceptanceProject[] = targetProjects.map((p) => {
      let acceptanceStatus: AcceptanceProject['acceptanceStatus'] = 'PENDING_REVIEW';
      let docCount = '6/6';
      let deadline = '15/08/2026';
      let docs = [...defaultDocs];
      let checklist = [...defaultChecklist];
      let comment = '';

      if (p.acceptanceDossier?.status) {
        const dStatus = p.acceptanceDossier.status;
        if (dStatus === 'REVISION_REQUIRED') acceptanceStatus = 'REVISION_REQUIRED';
        else if (dStatus === 'ELIGIBLE_FOR_ACCEPTANCE') acceptanceStatus = 'ELIGIBLE';
        else if (dStatus === 'FORWARDED_TO_COUNCIL') acceptanceStatus = 'FORWARDED';
        if (p.acceptanceDossier.reviewComment) comment = p.acceptanceDossier.reviewComment;
      } else {
        if (p.id === 'proj-08') {
          acceptanceStatus = 'REVISION_REQUIRED';
          docCount = '5/6';
          docs[4] = { name: 'Báo cáo tài chính quyết toán', status: 'MISSING' };
          checklist[2] = { label: 'Đầy đủ chứng từ quyết toán tài chính', checked: false };
          comment = 'Thiếu Báo cáo tài chính quyết toán có xác nhận của Phòng Tài chính - Kế toán.';
        } else if (p.id === 'proj-10') {
          acceptanceStatus = 'ELIGIBLE';
          docCount = 'Đầy đủ';
          deadline = '—';
          comment = 'Hồ sơ đầy đủ hợp lệ. Đủ điều kiện đưa ra Hội đồng nghiệm thu.';
        } else if (['ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(p.status)) {
          acceptanceStatus = 'PROCESSED';
          docCount = 'Đầy đủ';
          deadline = '—';
        }
      }

      return {
        id: p.id,
        projectCode: p.projectCode,
        proposalCode: p.proposalCode,
        title: p.title,
        principalInvestigatorName: p.principalInvestigatorName,
        departmentName: p.departmentName,
        researchField: p.researchField,
        approvedBudget: p.approvedBudget || 0,
        estimatedBudget: p.estimatedBudget || 0,
        status: p.status,
        acceptanceStatus,
        acceptanceDate: formatDate(p.updatedAt || p.createdAt),
        acceptanceDocCount: docCount,
        acceptanceDeadline: deadline,
        acceptanceDocs: docs,
        acceptanceChecklist: checklist,
        reviewComment: comment,
        minutesCreated: false,
      };
    });

    setProjects(mapped);
  }, []);

  const handleOpenWorkspace = (p: AcceptanceProject) => {
    setSelectedProject(p);
    setChecklistState(p.acceptanceChecklist?.map((c) => c.checked) || [false, false, false, false]);
    setCommentText(p.reviewComment || '');
    setShowWorkspace(true);
  };

  const handleUpdateStatus = (newStatus: 'REVISION_REQUIRED' | 'ELIGIBLE' | 'FORWARDED') => {
    if (!selectedProject) return;

    const updatedDocs = selectedProject.acceptanceDocs.map((doc) => {
      if (newStatus === 'ELIGIBLE' || newStatus === 'FORWARDED') return { ...doc, status: 'OK' as const };
      return doc;
    });

    const updatedChecklist = selectedProject.acceptanceChecklist.map((c, i) => ({
      ...c,
      checked: checklistState[i] ?? c.checked,
    }));

    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          acceptanceStatus: newStatus,
          acceptanceDocCount: newStatus === 'ELIGIBLE' || newStatus === 'FORWARDED' ? 'Đầy đủ' : '5/6',
          acceptanceDeadline: newStatus === 'REVISION_REQUIRED' ? '15/08/2026' : '—',
          reviewComment: commentText,
          acceptanceDocs: updatedDocs,
          acceptanceChecklist: updatedChecklist,
        };
      }
      return p;
    });

    setProjects(updated);
    setShowWorkspace(false);

    const projectRecord = repo.getProjectById(selectedProject.id);
    if (projectRecord) {
      repo.updateProject(selectedProject.id, {
        acceptanceDossier: {
          ...(projectRecord.acceptanceDossier || { id: `dossier-${Date.now()}`, claimedOverallCompletionPercentage: 100 }),
          status: newStatus === 'FORWARDED' ? 'FORWARDED_TO_COUNCIL' : newStatus,
          reviewComment: commentText,
          updatedAt: new Date().toISOString(),
        } as any,
      });
    }

    repo.addAuditLog({
      userId: currentUser?.id || '',
      userFullName: currentUser?.fullName || '',
      userRole: currentUser?.role || 'RESEARCH_OFFICE',
      entityType: 'ACCEPTANCE',
      entityId: selectedProject.id,
      actionCode: `ACCEPTANCE_${newStatus}`,
      notes: commentText || `Cập nhật trạng thái nghiệm thu: ${newStatus}`,
    });

    if (newStatus === 'REVISION_REQUIRED') {
      warning(`Đã yêu cầu đề tài ${selectedProject.projectCode || selectedProject.proposalCode} bổ sung hồ sơ.`);
    } else if (newStatus === 'ELIGIBLE') {
      success(`Đã xác nhận hồ sơ đề tài ${selectedProject.projectCode || selectedProject.proposalCode} Đủ điều kiện nghiệm thu.`);
    } else if (newStatus === 'FORWARDED') {
      success(`Đề tài ${selectedProject.projectCode || selectedProject.proposalCode} đã được chuyển sang Hội đồng nghiệm thu.`);
    }
  };

  const departments = useMemo(() => Array.from(new Set(projects.map((p) => p.departmentName))), [projects]);
  const tabFiltered = useMemo(() => projects.filter((p) => p.acceptanceStatus === activeTab), [projects, activeTab]);

  const finalFiltered = useMemo(() => {
    return tabFiltered.filter((p) => {
      if (selectedDept !== 'ALL' && p.departmentName !== selectedDept) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.proposalCode.toLowerCase().includes(q) ||
          (p.projectCode && p.projectCode.toLowerCase().includes(q)) ||
          p.principalInvestigatorName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tabFiltered, selectedDept, search]);

  const pagedProjects = finalFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusLabel = (status: AcceptanceProject['acceptanceStatus']) => {
    switch (status) {
      case 'PENDING_REVIEW': return 'Chờ kiểm tra';
      case 'REVISION_REQUIRED': return 'Cần bổ sung';
      case 'ELIGIBLE': return 'Đủ điều kiện';
      case 'FORWARDED': return 'Đã chuyển HĐ';
      case 'PROCESSED': return 'Đã xử lý';
      default: return status;
    }
  };

  const getStatusColorClass = (status: AcceptanceProject['acceptanceStatus']) => {
    switch (status) {
      case 'PENDING_REVIEW': return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'REVISION_REQUIRED': return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      case 'ELIGIBLE': return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      case 'FORWARDED': return 'bg-sky-50 text-[#0A6EBD] border-sky-200 font-bold';
      case 'PROCESSED': return 'bg-slate-100 text-slate-700 border-slate-300 font-medium';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500 text-xs">Đang tải bàn làm việc nghiệm thu...</div>;
  }

  return (
    <div className="space-y-4 text-slate-800 text-xs pb-16">
      {/* ── HEADER ── */}
      <PageHeader
        title="Bàn Thẩm định Hồ sơ Nghiệm thu"
        description="Tiếp nhận, đối soát checklist 8 tiêu chí hành chính và chuyển hồ sơ sang Hội đồng nghiệm thu chuyên môn"
        actions={
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" /> In danh mục
          </button>
        }
      />

      {/* ── WORK QUEUE STATUS TABS ── */}
      <div className="flex border border-slate-200 bg-slate-50/60 p-1 rounded-xl overflow-x-auto select-none">
        {(['PENDING_REVIEW', 'REVISION_REQUIRED', 'ELIGIBLE', 'FORWARDED', 'PROCESSED'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const count = projects.filter((p) => p.acceptanceStatus === tab).length;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-[#0A6EBD] shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{getStatusLabel(tab)}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-[#0A6EBD] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TÌM KIẾM & LỌC KHOA PHÒNG ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên đề tài, chủ nhiệm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] text-xs outline-none bg-white transition font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setCurrentPage(1);
          }}
          className={`py-1.5 px-3 rounded-lg border text-xs font-semibold outline-none transition cursor-pointer ${
            selectedDept !== 'ALL' ? 'border-[#0A6EBD] text-[#0A6EBD] bg-sky-50' : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          <option value="ALL">Tất cả khoa / phòng</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          Hiển thị <strong className="text-slate-700 font-mono font-bold">{finalFiltered.length}</strong> hồ sơ
        </span>
      </div>

      {/* ── BẢNG DỮ LIỆU WORK QUEUE ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#0B2A63] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-white select-none">
              <tr>
                <th className="px-4 py-3 w-32 whitespace-nowrap">MÃ ĐỀ TÀI</th>
                <th className="px-4 py-3 min-w-[280px]">TÊN ĐỀ TÀI / CHỦ NHIỆM</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap text-center">NGÀY NỘP</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap text-center">HỒ SƠ</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap text-center">TÌNH TRẠNG</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap text-center">HẠN XỬ LÝ</th>
                <th className="px-4 py-3 text-center w-28 whitespace-nowrap">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {finalFiltered.length === 0 ? (
                <TableEmptyState
                  colSpan={7}
                  title={`Không có hồ sơ nào ở mục "${getStatusLabel(activeTab)}"`}
                  description="Không tìm thấy hồ sơ phù hợp với bộ lọc."
                />
              ) : (
                pagedProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition border-l-[3px] border-l-transparent hover:border-l-[#0A6EBD]">
                    <td className="px-4 py-3 font-mono font-bold text-[#0A6EBD] align-middle whitespace-nowrap">
                      {p.projectCode || p.proposalCode}
                    </td>

                    <td className="px-4 py-3 align-middle leading-snug">
                      <Link href={`/projects/${p.id}`} className="font-bold text-slate-900 hover:text-[#0A6EBD] line-clamp-2">
                        {p.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Chủ nhiệm: <strong className="text-slate-600 font-medium">{p.principalInvestigatorName}</strong> • {p.departmentName}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center align-middle font-mono text-[11px] text-slate-600">
                      {p.acceptanceDate}
                    </td>

                    <td className="px-4 py-3 text-center align-middle font-semibold">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.acceptanceDocCount === 'Đầy đủ' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {p.acceptanceDocCount}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] border ${getStatusColorClass(p.acceptanceStatus)}`}>
                        {getStatusLabel(p.acceptanceStatus)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center align-middle font-mono text-[11px]">
                      {p.acceptanceDeadline === '—' ? <span className="text-slate-400">—</span> : <span className="text-rose-600 font-bold">{p.acceptanceDeadline}</span>}
                    </td>

                    <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenWorkspace(p)}
                          className={`px-3 py-1 rounded-lg border font-bold text-xs transition cursor-pointer shadow-2xs ${
                            p.acceptanceStatus === 'PENDING_REVIEW'
                              ? 'bg-[#0A6EBD] hover:bg-[#085896] text-white border-transparent'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          {p.acceptanceStatus === 'PENDING_REVIEW' ? 'Thẩm định' : 'Xem lại'}
                        </button>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === p.id ? null : p.id);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer border border-slate-200 bg-white"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {activeMenuId === p.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                              <div className="absolute right-0 top-6 z-30 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-left animate-in fade-in duration-100 text-xs">
                                <Link
                                  href={`/projects/${p.id}`}
                                  onClick={() => setActiveMenuId(null)}
                                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition font-medium"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" /> Xem hồ sơ đề tài
                                </Link>
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleOpenWorkspace(p);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left transition cursor-pointer font-medium"
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-slate-400" /> Xem minh chứng
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={finalFiltered.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="đề tài"
      />

      {/* ── WORKSPACE MODAL THẨM ĐỊNH ── */}
      {showWorkspace && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col text-xs text-slate-800">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-sky-50 text-[#0A6EBD] border border-sky-200 rounded text-[10px] font-bold font-mono">
                    WORKSPACE THẨM ĐỊNH NGHIỆM THU
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Hồ sơ: {selectedProject.projectCode || selectedProject.proposalCode}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Kiểm tra thành phần hồ sơ và xác nhận điều kiện đưa ra Hội đồng nghiệm thu
                </p>
              </div>
              <button onClick={() => setShowWorkspace(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Meta */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 shrink-0 grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Tên đề tài nghiên cứu:</p>
                <p className="font-bold text-slate-900 mt-0.5 leading-snug">{selectedProject.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Chủ nhiệm đề tài:</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedProject.principalInvestigatorName}</p>
                  <p className="text-slate-500 mt-0.5">{selectedProject.departmentName}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Ngày nộp hồ sơ:</p>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedProject.acceptanceDate}</p>
                </div>
              </div>
            </div>

            {/* Split Panel */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1 min-h-[250px]">
              {/* Left Column */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5 shrink-0">
                  <h4 className="font-bold text-[#0B2A63] text-xs flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-[#0A6EBD]" /> Danh mục tài liệu đã nộp
                  </h4>
                  <span className="text-[11px] bg-white text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                    {selectedProject.acceptanceDocCount === 'Đầy đủ' ? '6/6 Tài liệu' : '5/6 Tài liệu'}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {selectedProject.acceptanceDocs?.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{doc.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${doc.status === 'OK' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                        {doc.status === 'OK' ? 'Hợp lệ' : 'Thiếu'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2 mb-2.5">
                    <h4 className="font-bold text-[#0B2A63] text-xs flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" /> Kết quả đối soát điều kiện
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {selectedProject.acceptanceChecklist?.map((item, idx) => (
                      <label key={idx} className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checklistState[idx] ?? false}
                          onChange={(e) => {
                            const next = [...checklistState];
                            next[idx] = e.target.checked;
                            setChecklistState(next);
                          }}
                          className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD] w-3.5 h-3.5 mt-0.5 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-700 leading-snug">{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-1 mt-4">
                    <label className="block font-bold text-slate-700">Ghi chú nhận xét thẩm định *</label>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Nhập ghi chú chi tiết hoặc lý do yêu cầu bổ sung..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0A6EBD] outline-none bg-white text-xs resize-none"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  {checklistState.every(Boolean) ? (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-[11px]">Hồ sơ đạt đầy đủ các điều kiện kiểm tra hành chính.</span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-bold text-[11px]">Hồ sơ chưa đạt đủ các điều kiện hoặc thiếu chứng từ.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowWorkspace(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('REVISION_REQUIRED')}
                  className="px-3.5 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs shadow-2xs transition cursor-pointer"
                >
                  Yêu cầu bổ sung
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus('ELIGIBLE')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Xác nhận đủ điều kiện
                </button>

                {selectedProject.acceptanceStatus === 'ELIGIBLE' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('FORWARDED')}
                    className="px-4 py-2 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" /> Chuyển Hội đồng nghiệm thu
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}