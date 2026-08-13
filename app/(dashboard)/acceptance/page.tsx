'use client';

import React, { useState, useEffect } from 'react';
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
  Clock,
  Paperclip,
  Check,
  AlertTriangle,
  ClipboardList,
  MoreVertical,
  FileCheck2,
  Award,
} from 'lucide-react';
import { canCreateMinutes } from '@/lib/utils/permissions';
import { PageHeader } from '@/components/common/PageHeader';
import { TableEmptyState } from '@/components/common/EmptyState';

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
  const { success, warning } = useToast();

  const allProjects = repo.getProjects();
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

  // Mẫu tài liệu chuẩn nghiệm thu
  const defaultDocs: AcceptanceDoc[] = [
    { name: 'Báo cáo tổng kết đề tài', status: 'OK' },
    { name: 'Bản giải trình / Báo cáo tóm tắt', status: 'OK' },
    { name: 'Sản phẩm nghiên cứu bàn giao', status: 'OK' },
    { name: 'Minh chứng xuất bản bài báo (nếu có)', status: 'OK' },
    { name: 'Báo cáo quyết toán tài chính', status: 'OK' },
    { name: 'Ý kiến phê duyệt khoa phòng', status: 'OK' },
  ];

  // Mẫu checklist kiểm tra
  const defaultChecklist: AcceptanceCheckitem[] = [
    { label: 'Đúng biểu mẫu theo quy định BM-NT-01', checked: true },
    { label: 'Thuyết minh sản phẩm thực tế đầy đủ', checked: true },
    { label: 'Đầy đủ chứng từ quyết toán tài chính', checked: true },
    { label: 'Đảm bảo tiến độ thực hiện đã đăng ký', checked: true },
  ];

  // Khởi tạo danh sách hồ sơ nghiệm thu động
  useEffect(() => {
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
        acceptanceDate: '10/08/2026',
        acceptanceDocCount: docCount,
        acceptanceDeadline: deadline,
        acceptanceDocs: docs,
        acceptanceChecklist: checklist,
        reviewComment: comment,
        minutesCreated: false,
      };
    });

    setProjects(mapped);
  }, [allProjects]);

  const handleOpenWorkspace = (p: AcceptanceProject) => {
    setSelectedProject(p);
    setChecklistState(p.acceptanceChecklist?.map((c) => c.checked) || [false, false, false, false]);
    setCommentText(p.reviewComment || '');
    setShowWorkspace(true);
  };

  // Cập nhật trạng thái và đồng bộ vào Repository
  const handleUpdateStatus = (newStatus: 'REVISION_REQUIRED' | 'ELIGIBLE' | 'FORWARDED') => {
    if (!selectedProject) return;

    const updatedDocs = selectedProject.acceptanceDocs.map((doc) => {
      if (newStatus === 'ELIGIBLE') return { ...doc, status: 'OK' as const };
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
          acceptanceDocCount: newStatus === 'ELIGIBLE' ? 'Đầy đủ' : '5/6',
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

    // Lưu vào Repository thực
    repo.updateProject(selectedProject.id, {
      acceptanceDossier: {
        status: newStatus,
        reviewComment: commentText,
        updatedAt: new Date().toISOString(),
      } as any,
    });

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      entityType: 'ACCEPTANCE',
      entityId: selectedProject.id,
      actionCode: `ACCEPTANCE_${newStatus}`,
      notes: commentText || `Cập nhật trạng thái nghiệm thu: ${newStatus}`,
    });

    if (newStatus === 'REVISION_REQUIRED') {
      warning(`Đã yêu cầu đề tài ${selectedProject.projectCode || selectedProject.proposalCode} bổ sung hồ sơ.`, 'Yêu cầu bổ sung');
    } else if (newStatus === 'ELIGIBLE') {
      success(`Đã xác nhận hồ sơ đề tài ${selectedProject.projectCode || selectedProject.proposalCode} Đủ điều kiện nghiệm thu.`, 'Xác nhận hợp lệ');
    } else if (newStatus === 'FORWARDED') {
      success(`Đề tài ${selectedProject.projectCode || selectedProject.proposalCode} đã được chuyển sang Hội đồng nghiệm thu.`, 'Chuyển hội đồng');
    }
  };

  const departments = Array.from(new Set(projects.map((p) => p.departmentName)));
  const tabFiltered = projects.filter((p) => p.acceptanceStatus === activeTab);

  const finalFiltered = tabFiltered.filter((p) => {
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
      case 'PENDING_REVIEW': return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'REVISION_REQUIRED': return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      case 'ELIGIBLE': return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'FORWARDED': return 'bg-sky-50 text-[#0A6EBD] border-sky-200';
      case 'PROCESSED': return 'bg-slate-100 text-slate-700 border-slate-300';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* ── HEADER ── */}
      <PageHeader
        title="Hồ sơ nghiệm thu"
        description="Tiếp nhận, kiểm tra thành phần hồ sơ và xác nhận điều kiện đưa ra Hội đồng nghiệm thu"
        actions={
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> In danh mục
          </button>
        }
      />

      {/* ── WORK QUEUE STATUS TABS ── */}
      <div className="flex border border-slate-200 bg-slate-50/50 p-1 rounded-xl overflow-x-auto">
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
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-[#0A6EBD] shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/75'
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-wrap items-center gap-2.5">
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
            className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] text-xs outline-none bg-white transition"
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
          className={`py-1.5 px-3 rounded-lg border text-xs font-medium outline-none transition cursor-pointer ${
            selectedDept !== 'ALL' ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]' : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả khoa / phòng</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          Hiển thị <strong className="text-slate-700 font-mono">{finalFiltered.length}</strong> hồ sơ
        </span>
      </div>

      {/* ── BẢNG DỮ LIỆU WORK QUEUE ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 w-32 whitespace-nowrap">Mã Đề tài</th>
                <th className="px-4 py-3 min-w-[280px]">Tên đề tài / Chủ nhiệm</th>
                <th className="px-4 py-3 w-32 whitespace-nowrap text-center">Ngày nộp</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap text-center">Hồ sơ</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap text-center">Tình trạng</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap text-center">Hạn xử lý</th>
                <th className="px-4 py-3 text-center w-28">Thao tác</th>
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
                  <tr key={p.id} className="hover:bg-slate-50/60 transition border-l-[3px] border-l-transparent hover:border-l-[#0A6EBD]">
                    <td className="px-4 py-3 font-mono font-bold text-[#0A6EBD] align-middle whitespace-nowrap">
                      {p.projectCode || p.proposalCode}
                    </td>

                    <td className="px-4 py-3 align-middle leading-snug">
                      <p className="font-semibold text-slate-900 line-clamp-2">{p.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Chủ nhiệm: <strong className="text-slate-600 font-medium">{p.principalInvestigatorName}</strong> • {p.departmentName}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center align-middle font-mono text-xs text-slate-600">
                      {p.acceptanceDate}
                    </td>

                    <td className="px-4 py-3 text-center align-middle font-semibold text-xs">
                      <span className={`inline-block px-2 py-0.5 rounded-full ${
                        p.acceptanceDocCount === 'Đầy đủ' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {p.acceptanceDocCount}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] border ${getStatusColorClass(p.acceptanceStatus)}`}>
                        {getStatusLabel(p.acceptanceStatus)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center align-middle font-mono text-xs text-slate-500">
                      {p.acceptanceDeadline === '—' ? '—' : <span className="text-rose-600 font-bold">{p.acceptanceDeadline}</span>}
                    </td>

                    <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenWorkspace(p)}
                          className={`px-3 py-1 rounded-lg border font-bold text-xs transition cursor-pointer ${
                            p.acceptanceStatus === 'PENDING_REVIEW'
                              ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                              : 'bg-sky-50 text-[#0A6EBD] border-sky-200 hover:bg-sky-100'
                          }`}
                        >
                          {p.acceptanceStatus === 'PENDING_REVIEW' ? 'Kiểm tra' : 'Xem lại'}
                        </button>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === p.id ? null : p.id);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {activeMenuId === p.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                              <div className="absolute right-0 top-6 z-30 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-left animate-in fade-in duration-100">
                                <Link
                                  href={`/projects/${p.id}`}
                                  onClick={() => setActiveMenuId(null)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Xem chi tiết đề tài
                                </Link>
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleOpenWorkspace(p);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 text-left transition cursor-pointer"
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-slate-400" /> Xem file đính kèm
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in max-h-[90vh] flex flex-col text-xs text-slate-800">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-sky-50 text-[#0A6EBD] border border-sky-200 rounded text-[10px] font-bold font-mono">
                    WORKSPACE THẨM ĐỊNH NGHIỆM THU
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Chi tiết Hồ sơ: {selectedProject.projectCode || selectedProject.proposalCode}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
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
                <p className="text-slate-400 font-medium">Tên đề tài nghiên cứu:</p>
                <p className="font-bold text-slate-900 mt-0.5 leading-snug">{selectedProject.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400 font-medium">Chủ nhiệm đề tài:</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedProject.principalInvestigatorName}</p>
                  <p className="text-slate-400 mt-0.5">{selectedProject.departmentName}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Ngày nộp hồ sơ:</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedProject.acceptanceDate}</p>
                  <p className="text-[11px] text-[#0A6EBD] font-bold mt-0.5 bg-sky-50 px-2 py-0.2 rounded border border-sky-100 inline-block">
                    Phiên bản hồ sơ: v2.0
                  </p>
                </div>
              </div>
            </div>

            {/* Split Panel: Left Documents, Right Checklists */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1 min-h-[250px]">
              {/* Left Column: Hồ sơ đính kèm */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5 shrink-0">
                  <h4 className="font-bold text-[#0B2A63] text-xs flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-[#0A6EBD]" /> Hồ sơ nghiệm thu đề nghị
                  </h4>
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border">
                    {selectedProject.acceptanceDocCount === 'Đầy đủ' ? '6/6 Tài liệu' : '5/6 Tài liệu'}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {selectedProject.acceptanceDocs?.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-150 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">{doc.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${doc.status === 'OK' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                        {doc.status === 'OK' ? 'Hợp lệ' : 'Thiếu'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Checklist kiểm tra */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2 mb-2.5">
                    <h4 className="font-bold text-[#0B2A63] text-xs flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" /> Kết quả kiểm tra điều kiện
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
                        <span className="font-medium text-slate-700 leading-snug">{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-1 mt-4">
                    <label className="block font-bold text-slate-700">Ghi chú nhận xét thẩm định *</label>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Nhập ghi chú chi tiết, lý do yêu cầu bổ sung..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0A6EBD] outline-none bg-white text-xs resize-none"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  {checklistState.every(Boolean) ? (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-[11px]">Hồ sơ đạt đầy đủ các điều kiện kiểm tra hành chính.</span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-medium text-[11px]">Hồ sơ chưa đạt đủ các điều kiện hoặc thiếu chứng từ.</span>
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
                  <div className="flex items-center gap-2">
                    {canCreateMinutes(currentUser) && !selectedProject.minutesCreated && (
                      <button
                        onClick={() => {
                          setProjects((prev) => prev.map((pp) => (pp.id === selectedProject.id ? { ...pp, minutesCreated: true } : pp)));
                          success('Phòng KHTH đã tạo biên bản nghiệm thu thành công.', 'Tạo biên bản');
                        }}
                        className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Tạo biên bản (Phòng KHTH)
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedProject.minutesCreated) {
                          warning('Cần tạo biên bản nghiệm thu trước khi chuyển Hội đồng.');
                          return;
                        }
                        handleUpdateStatus('FORWARDED');
                      }}
                      className="px-4 py-2 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" /> Chuyển Hội đồng nghiệm thu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}