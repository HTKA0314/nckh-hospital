'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import {
  Search,
  Filter,
  Eye,
  Printer,
  X,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Paperclip,
  Check,
  AlertTriangle,
  ClipboardList,
  MoreVertical,
  HelpCircle,
  FileCheck2,
  Award
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { canCreateMinutes } from '@/lib/utils/permissions';
import { PageHeader } from '@/components/common/PageHeader';
import { TableEmptyState } from '@/components/common/EmptyState';

// Define the custom types for augmented projects in work queue
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
  // Augmented properties
  acceptanceStatus: 'PENDING_REVIEW' | 'REVISION_REQUIRED' | 'ELIGIBLE' | 'FORWARDED' | 'PROCESSED';
  acceptanceDate: string;
  acceptanceDocCount: string;
  acceptanceDeadline: string;
  acceptanceDocs: { name: string; status: 'OK' | 'MISSING' }[];
  acceptanceChecklist: { label: string; checked: boolean }[];
  reviewComment?: string;
  minutesCreated?: boolean;
}

export default function GlobalAcceptancePage() {
  const { currentUser } = useAuth();
  const { success, warning } = useToast();
  
  // 1. Fetch raw projects
  const allProjects = repo.getProjects();

  // 2. Initialize work queue with mockup-augmented states matching user data
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

  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    // Only map projects in the acceptance stage to avoid fallback clutter
    const targetProjects = allProjects.filter((p) => 
      ['proj-08', 'proj-09', 'proj-10'].includes(p.id) || p.status === 'WAITING_ACCEPTANCE'
    );

    const mapped = targetProjects.map((p) => {
      // Setup proj-08 as "Cần bổ sung"
      if (p.id === 'proj-08') {
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
          acceptanceStatus: 'REVISION_REQUIRED' as const,
          acceptanceDate: '08/08/2026',
          acceptanceDocCount: '5/6',
          acceptanceDeadline: '15/08/2026',
          acceptanceDocs: [
            { name: 'Báo cáo tổng kết đề tài', status: 'OK' as const },
            { name: 'Bản giải trình chỉnh sửa', status: 'OK' as const },
            { name: 'Sản phẩm nghiên cứu bàn giao', status: 'OK' as const },
            { name: 'Minh chứng xuất bản (nếu có)', status: 'OK' as const },
            { name: 'Báo cáo tài chính quyết toán', status: 'MISSING' as const },
            { name: 'Ý kiến phê duyệt khoa phòng', status: 'OK' as const },
          ],
          acceptanceChecklist: [
            { label: 'Đúng biểu mẫu theo BM-NT-01', checked: true },
            { label: 'Thuyết minh sản phẩm thực tế đầy đủ', checked: true },
            { label: 'Đầy đủ chứng từ quyết toán tài chính', checked: false },
            { label: 'Đảm bảo tiến độ thực hiện đã đăng ký', checked: true },
          ],
          reviewComment: 'Thiếu Báo cáo tài chính quyết toán có xác nhận của Phòng Tài chính - Kế toán bệnh viện.'
        };
      }
      
      // Setup proj-09 as "Chờ kiểm tra"
      if (p.id === 'proj-09') {
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
          acceptanceStatus: 'PENDING_REVIEW' as const,
          acceptanceDate: '10/08/2026',
          acceptanceDocCount: '6/6',
          acceptanceDeadline: '13/08/2026',
          acceptanceDocs: [
            { name: 'Báo cáo tổng kết đề tài', status: 'OK' as const },
            { name: 'Bản giải trình chỉnh sửa', status: 'OK' as const },
            { name: 'Sản phẩm nghiên cứu bàn giao', status: 'OK' as const },
            { name: 'Minh chứng xuất bản (nếu có)', status: 'OK' as const },
            { name: 'Báo cáo tài chính quyết toán', status: 'OK' as const },
            { name: 'Ý kiến phê duyệt khoa phòng', status: 'OK' as const },
          ],
          acceptanceChecklist: [
            { label: 'Đúng biểu mẫu theo BM-NT-01', checked: true },
            { label: 'Thuyết minh sản phẩm thực tế đầy đủ', checked: true },
            { label: 'Đầy đủ chứng từ quyết toán tài chính', checked: true },
            { label: 'Đảm bảo tiến độ thực hiện đã đăng ký', checked: true },
          ],
          reviewComment: ''
        };
      }

      // Setup proj-10 as "Đủ điều kiện"
      if (p.id === 'proj-10') {
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
          acceptanceStatus: 'ELIGIBLE' as const,
          acceptanceDate: '09/08/2026',
          acceptanceDocCount: 'Đầy đủ',
          acceptanceDeadline: '—',
          acceptanceDocs: [
            { name: 'Báo cáo tổng kết đề tài', status: 'OK' as const },
            { name: 'Bản giải trình chỉnh sửa', status: 'OK' as const },
            { name: 'Sản phẩm nghiên cứu bàn giao', status: 'OK' as const },
            { name: 'Minh chứng xuất bản (nếu có)', status: 'OK' as const },
            { name: 'Báo cáo tài chính quyết toán', status: 'OK' as const },
            { name: 'Ý kiến phê duyệt khoa phòng', status: 'OK' as const },
          ],
          acceptanceChecklist: [
            { label: 'Đúng biểu mẫu theo BM-NT-01', checked: true },
            { label: 'Thuyết minh sản phẩm thực tế đầy đủ', checked: true },
            { label: 'Đầy đủ chứng từ quyết toán tài chính', checked: true },
            { label: 'Đảm bảo tiến độ thực hiện đã đăng ký', checked: true },
          ],
          reviewComment: 'Hồ sơ đầy đủ hợp lệ. Đủ điều kiện đưa ra Hội đồng đánh giá nghiệm thu.'
        };
      }

      // Processed / History (ACCEPTED, RECOGNIZED, CLOSED, ARCHIVED)
      if (['ACCEPTED', 'RECOGNIZED', 'CLOSED', 'ARCHIVED'].includes(p.status)) {
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
          acceptanceStatus: 'PROCESSED' as const,
          acceptanceDate: '01/08/2026',
          acceptanceDocCount: 'Đầy đủ',
          acceptanceDeadline: '—',
          acceptanceDocs: [],
          acceptanceChecklist: [],
          minutesCreated: false,
        };
      }

      // Default fallback (For testing/other WAITING_ACCEPTANCE states)
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
        acceptanceStatus: 'FORWARDED' as const,
        acceptanceDate: '05/08/2026',
        acceptanceDocCount: 'Đầy đủ',
        acceptanceDeadline: '—',
        acceptanceDocs: [],
        acceptanceChecklist: [],
        minutesCreated: false,
      };
    });

    setProjects(mapped);
  }, [allProjects]);

  // Dynamic status tabs item count
  const getTabCount = (tab: typeof activeTab) => {
    return projects.filter((p) => p.acceptanceStatus === tab).length;
  };

  const handleOpenWorkspace = (p: AcceptanceProject) => {
    setSelectedProject(p);
    setChecklistState(p.acceptanceChecklist?.map(c => c.checked) || [false, false, false, false]);
    setCommentText(p.reviewComment || '');
    setShowWorkspace(true);
  };

  // Perform dossier state action updates
  const handleUpdateStatus = (newStatus: 'REVISION_REQUIRED' | 'ELIGIBLE' | 'FORWARDED') => {
    if (!selectedProject) return;

    const updatedDocs = selectedProject.acceptanceDocs.map((doc, idx) => {
      if (newStatus === 'ELIGIBLE') return { ...doc, status: 'OK' as const };
      return doc;
    });

    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          acceptanceStatus: newStatus,
          acceptanceDocCount: newStatus === 'ELIGIBLE' ? 'Đầy đủ' : '5/6',
          acceptanceDeadline: newStatus === 'REVISION_REQUIRED' ? '15/08/2026' : '—',
          reviewComment: commentText,
          acceptanceDocs: updatedDocs,
          acceptanceChecklist: p.acceptanceChecklist?.map((c, i) => ({
            ...c,
            checked: checklistState[i]
          })) || []
        };
      }
      return p;
    });

    setProjects(updated);
    setShowWorkspace(false);
    
    let msg = '';
    if (newStatus === 'REVISION_REQUIRED') {
      msg = `Đã yêu cầu chủ nhiệm đề tài ${selectedProject.projectCode || selectedProject.proposalCode} bổ sung hồ sơ.`;
      warning(msg, 'Yêu cầu bổ sung');
    } else if (newStatus === 'ELIGIBLE') {
      msg = `Đã xác nhận hồ sơ đề tài ${selectedProject.projectCode || selectedProject.proposalCode} Đủ điều kiện nghiệm thu.`;
      success(msg, 'Xác nhận hợp lệ');
    } else if (newStatus === 'FORWARDED') {
      msg = `Đề tài ${selectedProject.projectCode || selectedProject.proposalCode} đã chuyển hội đồng nghiệm thu.`;
      success(msg, 'Chuyển hội đồng');
    }
  };

  const departments = Array.from(new Set(projects.map((p) => p.departmentName)));

  // Filter projects by Tab, Department, and Search Query
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

  const pagedProjects = finalFiltered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusLabel = (status: AcceptanceProject['acceptanceStatus']) => {
    switch (status) {
      case 'PENDING_REVIEW': return 'Chờ kiểm tra';
      case 'REVISION_REQUIRED': return 'Cần bổ sung';
      case 'ELIGIBLE': return 'Đủ điều kiện';
      case 'FORWARDED': return 'Đã chuyển Hội đồng';
      case 'PROCESSED': return 'Đã xử lý';
      default: return status;
    }
  };

  const getStatusColorClass = (status: AcceptanceProject['acceptanceStatus']) => {
    switch (status) {
      case 'PENDING_REVIEW': return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'REVISION_REQUIRED': return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      case 'ELIGIBLE': return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'FORWARDED': return 'bg-blue-50 text-[#0A6EBD] border-blue-200';
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" /> In danh mục
          </button>
        }
      />

      {/* ── WORK QUEUE STATUS TABS ── */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 p-1 rounded-xl border">
        {(['PENDING_REVIEW', 'REVISION_REQUIRED', 'ELIGIBLE', 'FORWARDED', 'PROCESSED'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const count = getTabCount(tab);
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold rounded-lg transition-all ${
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

      {/* ── SEARCH & FILTER ROW ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên đề tài, chủ nhiệm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] text-xs outline-none bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className={`py-1.5 px-3 rounded-lg border text-xs font-medium outline-none transition cursor-pointer ${
            selectedDept !== 'ALL'
              ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]'
              : 'border-slate-300 bg-white text-slate-600'
          }`}
        >
          <option value="ALL">Tất cả khoa / phòng</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {(selectedDept !== 'ALL' || search.trim()) && (
          <button
            onClick={() => { setSelectedDept('ALL'); setSearch(''); }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-100 transition shadow-2xs cursor-pointer"
          >
            <X className="w-3 h-3" /> Xóa lọc
          </button>
        )}

        <span className="ml-auto text-[11px] text-slate-400 font-medium">
          Đang hiển thị <strong className="text-slate-700 font-mono">{finalFiltered.length}</strong> hồ sơ
        </span>
      </div>

      {/* ── WORK QUEUE DATA TABLE ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-visible">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 w-32 whitespace-nowrap">Mã Hồ sơ/Đề tài</th>
                <th className="px-4 py-3 min-w-[280px]">Tên đề tài / Chủ nhiệm</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap text-center">Ngày nộp</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap text-center">Hồ sơ</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap text-center">Tình trạng hồ sơ</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap text-center">Hạn xử lý</th>
                <th className="px-4 py-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {finalFiltered.length === 0 ? (
                <TableEmptyState
                  colSpan={7}
                  title={`Không có hồ sơ nào ở tab "${getStatusLabel(activeTab)}"`}
                  description="Không tìm thấy hồ sơ nào tương ứng trong hệ thống."
                />
              ) : (
                pagedProjects.map((p) => {
                  const isMenuOpen = activeMenuId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 transition border-l-[3px] border-l-transparent hover:border-l-[#0A6EBD]"
                    >
                      {/* Mã đề tài */}
                      <td className="px-4 py-3 font-mono font-bold text-[#0A6EBD] align-middle whitespace-nowrap">
                        {p.projectCode || p.proposalCode}
                      </td>

                      {/* Tên đề tài + Chủ nhiệm */}
                      <td className="px-4 py-3 align-middle leading-snug">
                        <p className="font-semibold text-slate-900 line-clamp-2">{p.title}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Chủ nhiệm: <strong className="text-slate-600 font-medium">{p.principalInvestigatorName}</strong> • {p.departmentName}
                        </p>
                      </td>

                      {/* Ngày nộp */}
                      <td className="px-4 py-3 text-center align-middle font-mono text-[12px] text-slate-600">
                        {p.acceptanceDate}
                      </td>

                      {/* Tình trạng nộp (Tài liệu) */}
                      <td className="px-4 py-3 text-center align-middle font-semibold text-[12px]">
                        <span className={`inline-block px-2 py-0.5 rounded-full ${
                          p.acceptanceDocCount === 'Đầy đủ'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {p.acceptanceDocCount}
                        </span>
                      </td>

                      {/* Trạng thái thân thiện */}
                      <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] border whitespace-nowrap ${getStatusColorClass(p.acceptanceStatus)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse"></span>
                          {getStatusLabel(p.acceptanceStatus)}
                        </span>
                      </td>

                      {/* Hạn xử lý */}
                      <td className="px-4 py-3 text-center align-middle font-mono text-[12px] text-slate-500">
                        {p.acceptanceDeadline === '—' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span className="text-rose-600 font-bold">{p.acceptanceDeadline}</span>
                        )}
                      </td>

                      {/* Nút hành động */}
                      <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 relative">
                          <button
                            onClick={() => handleOpenWorkspace(p)}
                            className={`px-2.5 py-1.2 rounded-lg border font-bold text-[11px] transition shadow-2xs ${
                              p.acceptanceStatus === 'PENDING_REVIEW'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/75'
                                : p.acceptanceStatus === 'REVISION_REQUIRED'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/75'
                                : p.acceptanceStatus === 'ELIGIBLE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/75'
                                : 'bg-[#EBF4FC] text-[#0A6EBD] border-[#B8D7F5] hover:bg-[#D8ECF9]'
                            }`}
                          >
                            {p.acceptanceStatus === 'PENDING_REVIEW' && 'Kiểm tra'}
                            {p.acceptanceStatus === 'REVISION_REQUIRED' && 'Xử lý'}
                            {p.acceptanceStatus === 'ELIGIBLE' && 'Chuyển HĐ'}
                            {p.acceptanceStatus === 'FORWARDED' && 'Xem lại'}
                            {p.acceptanceStatus === 'PROCESSED' && 'Xem lại'}
                          </button>
                          
                          {/* Menu ba chấm phụ */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(isMenuOpen ? null : p.id);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {isMenuOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-20" 
                                  onClick={() => setActiveMenuId(null)}
                                />
                                <div className="absolute right-0 top-6 z-30 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-left animate-in fade-in zoom-in-95 duration-100">
                                  <Link
                                    href={`/projects/${p.id}`}
                                    onClick={() => setActiveMenuId(null)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    Xem chi tiết đề tài
                                  </Link>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleOpenWorkspace(p);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 text-left transition"
                                  >
                                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                    Xem tài liệu hồ sơ
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      success(`Lịch sử thẩm định đề tài ${p.projectCode || p.proposalCode} sạch.`, 'Lịch sử xử lý');
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 text-left transition"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    Xem lịch sử xử lý
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
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

      {/* ========================================================================= */}
      {/* WORKSPACE KIỂM TRA HỒ SƠ NGHIỆM THU (POPUP CHUYÊN NGHIỆP) */}
      {/* ========================================================================= */}
      {showWorkspace && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in max-h-[90vh] flex flex-col text-xs text-slate-800">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-[#0A6EBD] border border-blue-200 rounded text-[10px] font-bold font-mono">
                    WORKSPACE THẨM ĐỊNH NGHIỆM THU
                  </span>
                  <h2 className="text-[16px] font-bold text-slate-900">
                    Chi tiết Hồ sơ nghiệm thu: {selectedProject.projectCode || selectedProject.proposalCode}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kiểm tra tính pháp lý, thành phần hồ sơ theo chính sách quy trình quản lý NCKH bệnh viện
                </p>
              </div>
              <button
                onClick={() => setShowWorkspace(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Project Meta Card */}
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
                  <p className="text-slate-400 font-medium">Ngày nộp / Phiên bản:</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedProject.acceptanceDate}</p>
                  <p className="text-[11px] text-[#0A6EBD] font-bold mt-0.5 bg-sky-50 px-2 py-0.2 rounded border border-sky-100 inline-block">
                    Phiên bản hồ sơ: v2.0
                  </p>
                </div>
              </div>
            </div>

            {/* Split panel: Left documents checklists, Right compliance check */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1 min-h-[250px]">
              
              {/* Left Column: HỒ SƠ NGHIỆM THU */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5 shrink-0">
                  <h4 className="font-bold text-[#0B2A63] text-[13px] flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-[#0A6EBD]" />
                    Hồ sơ nghiệm thu đề nghị
                  </h4>
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border">
                    {selectedProject.acceptanceDocCount === 'Đầy đủ' ? '6/6 Tài liệu' : '5/6 Tài liệu'}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {selectedProject.acceptanceDocs?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-150 rounded-lg hover:shadow-2xs transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">{doc.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {doc.status === 'OK' ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Hợp lệ
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200 flex items-center gap-0.5">
                            <X className="w-3 h-3" /> Thiếu
                          </span>
                        )}
                        <button
                          onClick={() => success(`Đang tải tài liệu: ${doc.name}`, 'Tải tệp tin')}
                          className="p-1 rounded text-slate-400 hover:text-[#0A6EBD] hover:bg-slate-100 transition"
                          title="Xem tệp tin đính kèm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: KẾT QUẢ KIỂM TRA & NHẬN XÉT */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2 mb-2.5">
                    <h4 className="font-bold text-[#0B2A63] text-[13px] flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      Kết quả kiểm tra điều kiện
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {selectedProject.acceptanceChecklist?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 cursor-pointer select-none"
                        onClick={() => {
                          const next = [...checklistState];
                          next[idx] = !next[idx];
                          setChecklistState(next);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checklistState[idx] || false}
                          onChange={() => {}}
                          className="rounded text-[#0A6EBD] focus:ring-[#0A6EBD] w-3.5 h-3.5 mt-0.5 cursor-pointer"
                        />
                        <span className="font-medium text-slate-700 leading-snug">{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Feedback comments */}
                  <div className="space-y-1 mt-4">
                    <label className="block font-bold text-slate-700">Ý kiến phản hồi / Nhận xét chi tiết *</label>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Nhập ghi chú thẩm định hồ sơ, lý do bổ sung tài liệu..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] outline-none bg-white text-xs resize-none"
                    />
                  </div>
                </div>

                {/* Checklist compliance check result alert */}
                <div className="mt-3">
                  {checklistState.every(Boolean) ? (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-[11px]">Hồ sơ đạt đầy đủ các điều kiện kiểm tra hành chính.</span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-medium text-[11px]">Hồ sơ chưa đạt đủ các điều kiện hoặc thiếu chứng từ quyết toán.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowWorkspace(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-2">
                {/* 1. Nút yêu cầu bổ sung */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('REVISION_REQUIRED')}
                  className="px-3.5 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs shadow-2xs transition"
                >
                  Yêu cầu bổ sung
                </button>

                {/* 2. Nút xác nhận đủ điều kiện */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('ELIGIBLE')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1 transition"
                >
                  <Check className="w-3.5 h-3.5" /> Xác nhận đủ điều kiện
                </button>

                {/* 3. Nút chuyển hội đồng nghiệm thu (chỉ sáng khi hồ sơ đã đạt) */}
                {selectedProject.acceptanceStatus === 'ELIGIBLE' && (
                  <div className="flex items-center gap-2">
                    {canCreateMinutes(currentUser) && !selectedProject.minutesCreated && (
                      <button
                        onClick={() => {
                          // mark minutes created for selected project
                          setProjects((prev) => prev.map((pp) => pp.id === selectedProject.id ? { ...pp, minutesCreated: true } : pp));
                          repo.addAuditLog({
                            userId: currentUser.id,
                            userFullName: currentUser.fullName,
                            userRole: currentUser.role,
                            actionCode: 'CREATE_ACCEPTANCE_MINUTES',
                            entityType: 'ACCEPTANCE',
                            entityId: selectedProject.id,
                            notes: `Phòng KHTH đã tạo biên bản nghiệm thu cho đề tài ${selectedProject.proposalCode}`,
                          });
                          // notify PI
                          repo.addNotification({
                            userId: selectedProject.principalInvestigatorName ? repo.getProjects().find(p=>p.proposalCode===selectedProject.proposalCode)?.principalInvestigatorId || '' : '',
                            title: `Biên bản nghiệm thu đã được tạo: ${selectedProject.proposalCode}`,
                            content: `Phòng KHTH đã tạo biên bản nghiệm thu cho đề tài ${selectedProject.title}. Chuẩn bị chuyển Hội đồng nghiệm thu.`,
                            type: 'INFO',
                            link: `/projects/${selectedProject.id}`,
                          });
                        }}
                        className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
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
                      className="px-4 py-2 rounded-lg bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition animate-pulse"
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
