'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { formatVND, formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { SubmitProposalModal } from './SubmitProposalModal';
import { Award, Plus,
  Search,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Eye,
  FileText,
  Upload,
  AlertCircle,
  MoreVertical,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  Printer,
  Edit,
  Filter,
  Activity,
  Shield,
  Briefcase,
  ExternalLink,
  GitPullRequest,
  Trash2,
  Download,
  X,
  Send,
  FileUp,
  History as HistoryIcon,
  MoreHorizontal
} from 'lucide-react';

export default function MyProjectsPage() {
  const { currentUser } = useAuth();
  const { success, warning, error, info } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'action_needed' | 'review' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRound, setSelectedRound] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'DEADLINE' | 'BUDGET' | 'PROGRESS'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Track open dropdown for the context menu (⋮)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [submitModalProjectId, setSubmitModalProjectId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  
  // Track modal state
  const [outlineProject, setOutlineProject] = useState<any>(null);

  const handleDeleteDraft = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đề tài này?')) {
      const successVal = repo.deleteProject(id);
      if (successVal) {
        success('Đã xóa đề tài thành công!');
        window.location.reload();
      } else {
        error('Có lỗi xảy ra khi xóa đề tài.');
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rounds = repo.getRounds();

  // Lấy dữ liệu đề tài gắn với người dùng hiện tại
  const isManager = ['ADMIN', 'DIRECTOR', 'RESEARCH_OFFICE'].includes(currentUser.role);
  const rawProjects = useMemo(() => {
    let list = repo.getProjects();
    if (!isManager) {
      const userProjects = list.filter(
        (p) =>
          p.principalInvestigatorId === currentUser.id ||
          p.principalInvestigatorName === currentUser.fullName ||
          p.members?.some((m) => m.fullName.toLowerCase().includes(currentUser.fullName.toLowerCase()))
      );
      if (userProjects.length > 0) {
        list = userProjects;
      }
    }
    return list;
  }, [currentUser, isManager]);

  // Chuẩn hóa và bổ sung dữ liệu hiển thị (Badge, ActionLink, NextAction, NextWorkItem)
  const myProjects = useMemo(() => {
    return rawProjects.map((p) => {
      let statusText = 'Đang thực hiện';
      let statusColor = 'bg-sky-50 text-[#0A6EBD] border-sky-200';
      let isActionNeeded = false;
      let nextWorkItem = 'Tiếp tục triển khai nghiên cứu';
      
      let primaryAction: any = { label: 'Xem chi tiết', href: `/projects/${p.id}`, icon: Eye };
      let secondaryActions: any[] = [];

      const addDefaultDropdowns = () => {
        secondaryActions.push({ label: 'Xem hồ sơ/tài liệu', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: FileText });
        secondaryActions.push({ label: 'Xem lịch sử xử lý', href: `/projects/${p.id}?tab=HISTORY`, icon: HistoryIcon });
      };

            if (p.status === 'DRAFT') {
        statusText = 'Chờ nộp đề cương';
        statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
        isActionNeeded = true;
        nextWorkItem = 'Hoàn thiện hồ sơ thuyết minh';
        primaryAction = { label: 'Chỉnh sửa', href: `/projects/register?draftId=${p.id}`, icon: Edit };
        secondaryActions = [
          { label: 'Xem chi tiết', href: `/projects/${p.id}`, icon: Eye },
          { label: 'Xóa bản nháp', href: '#', icon: Trash2, isDestructive: true, onClick: () => handleDeleteDraft(p.id) },
          { label: 'Nộp đề cương', href: '#', icon: FileUp, onClick: () => setSubmitModalProjectId(p.proposalCode || p.id) }
        ];
      }
      else if (p.proposalStatus === 'SUBMITTED' || p.proposalStatus === 'UNDER_ADMIN_REVIEW') {
        statusText = 'Chờ duyệt đề xuất';
        statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
        nextWorkItem = 'Phòng NCKH đang thẩm định';
        primaryAction = { label: 'Xem chi tiết', href: `/projects/${p.id}`, icon: Eye };
        secondaryActions = [
          { label: 'Xem hồ sơ đã nộp', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: FileText },
          { label: 'Xem trạng thái xử lý', href: `/projects/${p.id}?tab=HISTORY`, icon: Activity },
          { label: 'Xem lịch sử', href: `/projects/${p.id}?tab=HISTORY`, icon: HistoryIcon }
        ];
      }
      else if (p.proposalStatus === 'REVISION_REQUIRED') {
        statusText = 'Cần bổ sung';
        statusColor = 'bg-rose-50 text-rose-800 border-rose-200';
        isActionNeeded = true;
        nextWorkItem = 'Bổ sung theo yêu cầu';
        primaryAction = { label: 'Bổ sung hồ sơ', href: `/projects/register?draftId=${p.id}`, icon: Edit };
        secondaryActions = [
          { label: 'Xem yêu cầu bổ sung', href: `/projects/${p.id}?tab=HISTORY`, icon: AlertCircle },
          { label: 'Nộp lại', href: '#', icon: Send, onClick: () => warning('Cổng tiếp nhận hồ sơ trực tuyến đang bảo trì định kỳ. Quý vị vui lòng thử lại sau.') },
          { label: 'Xem phiên bản trước', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: HistoryIcon }
        ];
      }
      else if (p.proposalStatus === 'ADMIN_VALIDATED' || p.proposalStatus === ('UNDER_PROPOSAL_REVISION_REVIEW' as any)) {
        statusText = 'Chờ xét duyệt đề cương';
        statusColor = 'bg-sky-50 text-[#0A6EBD] border-sky-200';
        nextWorkItem = 'Chờ HĐ duyệt đề cương';
        primaryAction = { label: 'Xem chi tiết', href: `/projects/${p.id}`, icon: Eye };
        secondaryActions = [
          { label: 'Xem đề cương đã nộp', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: FileText },
          { label: 'Xem lịch Hội đồng', href: `/projects/${p.id}?tab=COUNCIL`, icon: Calendar },
          { label: 'Xem trạng thái xét duyệt', href: `/projects/${p.id}?tab=HISTORY`, icon: Activity }
        ];
      }
      else if (p.proposalStatus === 'PROPOSAL_REVISION_REQUIRED') {
        statusText = 'Cần hoàn thiện sau HĐ';
        statusColor = 'bg-rose-50 text-rose-800 border-rose-200';
        isActionNeeded = true;
        nextWorkItem = 'Hoàn thiện theo ý kiến HĐ';
        primaryAction = { label: 'Chỉnh sửa/hoàn thiện đề cương', href: `/projects/${p.id}/resubmit`, icon: Edit };
        secondaryActions = [
          { label: 'Xem ý kiến Hội đồng', href: `/projects/${p.id}?tab=COUNCIL_MINUTES`, icon: FileText },
          { label: 'Xem biên bản', href: `/projects/${p.id}?tab=COUNCIL_MINUTES`, icon: FileText },
          { label: 'Nộp bản giải trình', href: '', onClick: () => warning('Tính năng nộp bản giải trình trực tuyến đang được đồng bộ dữ liệu. Vui lòng liên hệ phòng QL-NCKH.'), icon: Upload },
          { label: 'Nộp lại hồ sơ', href: '', onClick: () => warning('Cổng tiếp nhận hồ sơ trực tuyến đang bảo trì định kỳ. Quý vị vui lòng nộp bản giấy tại phòng NCKH.'), icon: Send }
        ];
      }
      else if (p.ethicsStatus === 'UNDER_ETHICS_REVIEW' || p.ethicsStatus === 'ETHICS_REVISION_REQUIRED') {
        statusText = 'Đang xử lý đạo đức';
        statusColor = 'bg-purple-50 text-purple-800 border-purple-200';
        isActionNeeded = p.ethicsStatus === 'ETHICS_REVISION_REQUIRED';
        nextWorkItem = isActionNeeded ? 'Bổ sung hồ sơ Đạo đức' : 'Chờ Hội đồng Đạo đức';
        primaryAction = isActionNeeded ? { label: 'Bổ sung hồ sơ nếu được yêu cầu', href: `/projects/${p.id}/ethics`, icon: Edit } : { label: 'Xem trạng thái', href: `/projects/${p.id}?tab=HISTORY`, icon: Activity };
        secondaryActions = [
          { label: 'Xem hồ sơ đạo đức', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: Shield },
          { label: 'Xem kết quả/chấp thuận khi có', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: CheckCircle2 }
        ];
      }
      else if ((p.status as any) === 'APPROVED' || p.status === 'WAITING_ASSIGNMENT') {
        statusText = 'Chờ giao thực hiện';
        statusColor = 'bg-sky-50 text-[#0A6EBD] border-sky-200';
        nextWorkItem = 'Chờ Quyết định giao thực hiện';
        primaryAction = { label: 'Xem chi tiết', href: `/projects/${p.id}`, icon: Eye };
        secondaryActions = [
          { label: 'Xem kết quả xét duyệt', href: `/projects/${p.id}?tab=COUNCIL_MINUTES`, icon: FileText }
        ];
      }
      else if (p.status === 'IN_PROGRESS') {
        statusText = 'Đang thực hiện';
        statusColor = 'bg-sky-50 text-[#0A6EBD] border-sky-200';
        nextWorkItem = 'Triển khai nghiên cứu';
        primaryAction = { label: 'Nộp báo cáo định kỳ', href: '', onClick: () => warning('Hệ thống đang kiểm tra tiến độ mốc. Cổng nộp báo cáo định kỳ trực tuyến sẽ mở sau khi hoàn tất đối soát dữ liệu mốc.'), icon: Upload };
        secondaryActions = [
          { label: 'Đề xuất điều chỉnh/gia hạn', href: `/projects/${p.id}/change-requests/new`, icon: GitPullRequest },
          { label: 'Nộp sản phẩm trung gian', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: Upload },
          { label: 'Xin đánh giá đạo đức bổ sung (nếu có)', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: Shield }
        ];
      }
      else if (p.status === 'WAITING_ACCEPTANCE') {
        statusText = 'Chuẩn bị nghiệm thu';
        statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
        isActionNeeded = true;
        nextWorkItem = 'Hoàn thiện hồ sơ NT';
        primaryAction = { label: 'Nộp hồ sơ nghiệm thu', href: `/projects/${p.id}/acceptance`, icon: Upload };
        secondaryActions = [
          { label: 'Xem điều kiện nghiệm thu', href: '', onClick: () => warning('Hướng dẫn điều kiện nghiệm thu đang được cập nhật theo văn bản chỉ đạo mới nhất từ Hội đồng Y khoa.'), icon: List }
        ];
      }
      else if ((p.acceptanceDossier as any)?.status === 'REVISION_REQUIRED') {
        statusText = 'Cần hoàn thiện sau NT';
        statusColor = 'bg-rose-50 text-rose-800 border-rose-200';
        isActionNeeded = true;
        nextWorkItem = 'Chỉnh sửa theo góp ý HĐNT';
        primaryAction = { label: 'Hoàn thiện hồ sơ nghiệm thu', href: '', onClick: () => warning('Cổng cập nhật hồ sơ nghiệm thu sau họp đang bảo trì hệ thống. Vui lòng liên hệ Thư ký Hội đồng.'), icon: Edit };
        secondaryActions = [
          { label: 'Xem ý kiến Hội đồng', href: `/projects/${p.id}?tab=COUNCIL_MINUTES`, icon: AlertCircle },
          { label: 'Xem biên bản', href: `/projects/${p.id}?tab=COUNCIL_MINUTES`, icon: FileText }
        ];
      }
      else if (p.status === 'ACCEPTED') {
        statusText = 'Đã nghiệm thu';
        statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        nextWorkItem = 'Chờ công nhận kết quả';
        primaryAction = { label: 'Xem kết quả', href: `/projects/${p.id}?tab=COUNCIL_MINUTES`, icon: Award };
        secondaryActions = [
          { label: 'Xem biên bản', href: `/projects/${p.id}?tab=COUNCIL_MINUTES`, icon: FileText }
        ];
      }
      else if (p.status === 'RECOGNIZED') {
        statusText = 'Đã công nhận';
        statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        nextWorkItem = 'Hoàn tất nộp lưu';
        primaryAction = { label: 'Xem quyết định', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: Award };
        secondaryActions = [
          { label: 'Xem hồ sơ', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: FileText },
          { label: 'Hoàn tất nộp lưu', href: '', onClick: () => warning('Cổng nộp lưu hồ sơ số đang được cấu hình đồng bộ dữ liệu với Thư viện Y học Quốc gia.'), icon: Upload }
        ];
      }
      else if (p.status === 'CLOSED' || p.status === 'ARCHIVED') {
        statusText = 'Đã đóng';
        statusColor = 'bg-slate-900 text-white border-slate-950';
        nextWorkItem = 'Lưu trữ hồ sơ dài hạn';
        primaryAction = { label: 'Xem chi tiết', href: `/projects/${p.id}`, icon: Eye };
        secondaryActions = [
          { label: 'Xem tài liệu', href: `/projects/${p.id}?tab=DOCUMENTS`, icon: FileText },
          { label: 'Xem lịch sử', href: `/projects/${p.id}?tab=HISTORY`, icon: HistoryIcon }
        ];
      }
      else {
        addDefaultDropdowns();
      }

      let shortRound = p.registrationRoundName || 'Đợt 1/2026';
      shortRound = shortRound
        .replace(/Đợt đăng ký Đề tài NCKH Cấp cơ sởs*/gi, '')
        .replace(/Kế hoạch đăng ký đề tài NCKHs*/gi, '')
        .replace(/Đề tài NCKH Cấp cơ sởs*/gi, '')
        .replace(/Năm /gi, '')
        .trim();
      if (!shortRound.toLowerCase().startsWith('đợt')) {
        shortRound = `Đợt ${shortRound}`;
      }

      const nextAction = primaryAction.label;
      const actionLink = primaryAction.href;

      return {
        ...p,
        code: p.projectCode || p.proposalCode || `DX-2026-${p.id}`,
        category: p.researchField || 'Y Dược học',
        round: shortRound,
        statusText,
        statusColor,
        progress: typeof p.progressPercentage === 'number' ? p.progressPercentage : '---',
        budgetFormatted: p.approvedBudget ? formatVND(p.approvedBudget) : (p.estimatedBudget ? formatVND(p.estimatedBudget) : 'Chưa cập nhật'),
        budgetValue: p.approvedBudget || p.estimatedBudget || 0,
        deadline: p.endDate ? formatDate(p.endDate) : 'Chưa xác định',
        nextAction,
        actionLink,
        primaryAction,
        secondaryActions,
        isActionNeeded,
        nextWorkItem,
      };
    });
  }, [rawProjects]);

  // Thống kê số lượng cho các tab
  const tabCounts = useMemo(() => {
    return {
      all: myProjects.length,
      in_progress: myProjects.filter((p) => p.status === 'IN_PROGRESS' || p.status === ('APPROVED' as any) || p.status === 'WAITING_ASSIGNMENT' || p.status === ('ASSIGNED' as any)).length,
      action_needed: myProjects.filter((p) => p.isActionNeeded).length,
      review: myProjects.filter(
        (p) => p.proposalStatus === 'SUBMITTED' || p.proposalStatus === 'UNDER_ADMIN_REVIEW'
      ).length,
      completed: myProjects.filter((p) => p.status === 'ACCEPTED' || p.status === 'CLOSED' || p.status === 'ARCHIVED' || p.status === 'RECOGNIZED').length,
    };
  }, [myProjects]);

  // Bộ lọc dữ liệu
  const filteredProjects = useMemo(() => {
    return myProjects
      .filter((p) => {
        if (activeTab === 'in_progress') {
          if (p.status !== 'IN_PROGRESS' && p.status !== 'WAITING_ASSIGNMENT') return false;
        } else if (activeTab === 'action_needed') {
          if (!p.isActionNeeded) return false;
        } else if (activeTab === 'review') {
          if (p.proposalStatus !== 'SUBMITTED' && p.proposalStatus !== 'UNDER_ADMIN_REVIEW')
            return false;
        } else if (activeTab === 'completed') {
          if (p.status !== 'ACCEPTED' && p.status !== 'CLOSED' && p.status !== 'ARCHIVED' && p.status !== 'RECOGNIZED') return false;
        }

        if (selectedRound !== 'ALL' && p.registrationRoundId !== selectedRound) {
          return false;
        }

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchCode = p.code.toLowerCase().includes(q);
          const matchCategory = p.category.toLowerCase().includes(q);
          if (!matchTitle && !matchCode && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') return b.id.localeCompare(a.id);
        if (sortBy === 'BUDGET') return b.budgetValue - a.budgetValue;
        if (sortBy === 'PROGRESS') return (b.progress as number || 0) - (a.progress as number || 0);
        if (sortBy === 'DEADLINE') return a.deadline.localeCompare(b.deadline);
        return 0;
      });
  }, [myProjects, activeTab, selectedRound, searchTerm, sortBy]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pagedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto text-slate-800">
      {/* ── HEADER: Tiêu đề trang + Actions ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-800">Đề tài nghiên cứu của tôi</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Quản lý, theo dõi tiến độ và thực hiện các thủ tục hồ sơ đề tài của bạn</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
            title="In danh sách đề tài"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" /> In danh mục
          </button>
          <button
            onClick={() => success('Đã xuất danh sách đề tài thành file Excel (.xlsx) thành công!')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
            title="Xuất danh sách đề tài thành file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Xuất Excel
          </button>
          <Link
            href="/projects/register"
            className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold px-3.5 py-2 rounded-lg text-[13px] shadow-xs transition whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Đăng ký đề tài mới
          </Link>
        </div>
      </div>

      {/* ── THANH BỘ LỌC TỐI ƯU ĐỒNG BỘ ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-2.5 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Tất cả đề tài', count: tabCounts.all },
            { id: 'in_progress', label: 'Đang thực hiện', count: tabCounts.in_progress },
            { id: 'action_needed', label: 'Cần xử lý ngay', count: tabCounts.action_needed },
            { id: 'review', label: 'Chờ kiểm tra hồ sơ', count: tabCounts.review },
            { id: 'completed', label: 'Đã hoàn thành', count: tabCounts.completed },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#EBF4FC] text-[#0A6EBD] border border-[#B8D7F5] shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === tab.id ? 'bg-[#0A6EBD] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Cụm Tìm kiếm + Dropdowns */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên đề tài..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0A6EBD] focus:bg-white transition"
            />
          </div>

          <select
            value={selectedRound}
            onChange={(e) => {
              setSelectedRound(e.target.value);
              setCurrentPage(1);
            }}
            className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium outline-none transition cursor-pointer ${
              selectedRound !== 'ALL' ? 'border-[#0A6EBD] text-[#0A6EBD] bg-[#EBF4FC]' : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            <option value="ALL">Tất cả đợt</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name.replace('Đợt đăng ký Đề tài NCKH Cấp cơ sở ', 'Đợt ').replace('Kế hoạch đăng ký đề tài NCKH ', '')}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="DEADLINE">Hạn hoàn thành</option>
            <option value="BUDGET">Kinh phí cao</option>
            <option value="PROGRESS">Tiến độ cao</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded-md text-xs transition ${
                viewMode === 'table' ? 'bg-white text-[#0A6EBD] shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dạng Bảng"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md text-xs transition ${
                viewMode === 'grid' ? 'bg-white text-[#0A6EBD] shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dạng Thẻ"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. DẠNG HIỂN THỊ 1: BẢNG DỮ LIỆU (TABLE VIEW) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px] text-slate-750">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700 select-none">
                <tr className="border-l-4 border-l-transparent">
                  <th className="px-5 py-3.5 w-32 whitespace-nowrap">Mã ĐX / Đề tài</th>
                  <th className="px-5 py-3.5 min-w-[320px]">Tên đề tài nghiên cứu</th>
                  <th className="px-5 py-3.5 w-40 whitespace-nowrap text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 w-40 whitespace-nowrap text-center">Thời gian thực hiện</th>
                  <th className="px-5 py-3.5 w-28 whitespace-nowrap text-center">Tiến độ</th>
                  <th className="px-5 py-3.5 w-64 text-right pr-6 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {pagedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      Không tìm thấy đề tài nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  pagedProjects.map((p) => (
                    <tr key={p.id} className="border-l-4 border-l-transparent hover:border-l-[#0A6EBD] hover:bg-sky-50/45 transition-all duration-150 cursor-pointer">
                      {/* Mã ĐX / Đề tài */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <span className="inline-block font-mono font-bold text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="Mã đề xuất">
                            {p.proposalCode || '---'}
                          </span>
                          <span className="block font-mono font-bold text-xs text-[#0A6EBD] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 w-fit" title="Mã đề tài">
                            {p.projectCode || 'Chưa cấp mã'}
                          </span>
                        </div>
                      </td>

                      {/* Tên đề tài & Chuyên ngành */}
                      <td className="px-5 py-4 align-top">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-slate-900 hover:text-[#0A6EBD] leading-snug block break-words"
                        >
                          {p.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-medium">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold border border-slate-200">
                            {p.category}
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 align-top text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap shrink-0 ${p.statusColor}`}>
                          {p.statusText}
                        </span>
                      </td>

                      {/* Thời gian thực hiện */}
                      <td className="px-5 py-4 align-top text-center text-[11px] font-mono whitespace-nowrap text-slate-600">
                        {p.startDate ? formatDate(p.startDate) : '---'} <br />
                        <span className="text-slate-400">đến</span> <br />
                        {p.endDate ? formatDate(p.endDate) : p.deadline}
                      </td>
                      <td className="px-5 py-4 align-top w-28 text-center">
                        <div className="space-y-1 mt-1">
                          <div className="flex items-center justify-center text-[11px] font-mono font-bold text-[#0A6EBD]">
                            <span>{p.progress === '---' ? '---' : `${p.progress}%`}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                p.progress === 100 ? 'bg-emerald-500' : 'bg-[#0A6EBD]'
                              }`}
                              style={{ width: `${p.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Thao tác hành động */}
                      <td className="px-5 py-4 align-middle whitespace-nowrap text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {p.secondaryActions.map((action: any, idx: number) => {
                            const baseClass = action.isDestructive 
                              ? "p-1.5 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center border border-transparent hover:border-rose-200" 
                              : "p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#0A6EBD] transition flex items-center justify-center border border-transparent hover:border-slate-200";
                              
                            return action.onClick ? (
                              <button
                                key={idx}
                                onClick={action.onClick}
                                title={action.label}
                                className={baseClass}
                              >
                                <action.icon className="w-4 h-4" />
                              </button>
                            ) : (
                              <Link
                                key={idx}
                                href={action.href}
                                title={action.label}
                                className={baseClass}
                              >
                                <action.icon className="w-4 h-4" />
                              </Link>
                            );
                          })}

                          {/* Primary Action */}
                          {p.primaryAction && (
                            p.primaryAction.onClick ? (
                              <button
                                onClick={p.primaryAction.onClick}
                                className={`p-1.5 rounded-lg border transition shadow-2xs flex items-center justify-center ${
                                  p.isActionNeeded 
                                    ? 'text-amber-600 bg-white hover:bg-amber-50 border-amber-200' 
                                    : 'text-[#0A6EBD] bg-white hover:bg-sky-50 border-slate-200'
                                }`}
                                title={p.primaryAction.label}
                              >
                                <p.primaryAction.icon className="w-4 h-4" />
                              </button>
                            ) : (
                              <Link
                                href={p.primaryAction.href}
                                className={`p-1.5 rounded-lg border transition shadow-2xs flex items-center justify-center ${
                                  p.isActionNeeded 
                                    ? 'text-amber-600 bg-white hover:bg-amber-50 border-amber-200' 
                                    : 'text-[#0A6EBD] bg-white hover:bg-sky-50 border-slate-200'
                                }`}
                                title={p.primaryAction.label}
                              >
                                <p.primaryAction.icon className="w-4 h-4" />
                              </Link>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DẠNG HIỂN THỊ 2: LƯỚI THẺ (GRID CARD VIEW) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pagedProjects.length === 0 ? (
            <div className="col-span-2 bg-white p-12 text-center rounded-xl border border-slate-200/80 text-slate-400 font-semibold">
              Không tìm thấy đề tài nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            pagedProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono font-bold text-xs text-[#0A6EBD] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      {p.code}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${p.statusColor}`}>
                      {p.statusText}
                    </span>
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-bold text-slate-900 group-hover:text-[#0A6EBD] text-sm leading-snug line-clamp-2 transition-colors"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600 font-bold">{p.category}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-500 font-mono text-[11px]">{p.round}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-500 text-[11px]">Kinh phí: <strong className="text-slate-800 font-mono">{p.budgetFormatted}</strong></span>
                  </p>
                </div>

                {/* Progress & Info */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-600 font-bold">
                    <span>Tiến độ thực hiện</span>
                    <span className="font-mono font-bold text-[#0A6EBD]">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        p.progress === 100 ? 'bg-emerald-500' : 'bg-[#0A6EBD]'
                      }`}
                      style={{ width: `${p.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 font-semibold">
                    <span>
                      Hạn: <strong className="text-slate-800 font-mono">{p.deadline}</strong>
                    </span>
                    
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 relative">
                  <span className="text-[11px] text-slate-500 italic truncate max-w-[260px] font-semibold">
                    Hành động: {p.nextAction}
                  </span>
                  
                  <div 
                    className="relative inline-block text-left" 
                    onClick={(e) => e.stopPropagation()}
                    ref={openDropdownId === p.id ? dropdownRef : null}
                  >
                    <button
                      onClick={() => setOpenDropdownId(openDropdownId === p.id ? null : p.id)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                      title="Thao tác"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openDropdownId === p.id && (
                      <div className="absolute right-0 bottom-full mb-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-[100] animate-in fade-in slide-in-from-bottom-2">
                        {p.primaryAction && (
                          <>
                            {p.primaryAction.onClick ? (
                              <button
                                onClick={() => { setOpenDropdownId(null); p.primaryAction.onClick(); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition ${
                                  p.isActionNeeded 
                                    ? 'text-amber-700 hover:bg-amber-50' 
                                    : 'text-[#0A6EBD] hover:bg-sky-50'
                                }`}
                              >
                                <p.primaryAction.icon className="w-4 h-4" />
                                {p.primaryAction.label}
                              </button>
                            ) : (
                              <Link
                                href={p.primaryAction.href}
                                onClick={() => setOpenDropdownId(null)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition ${
                                  p.isActionNeeded 
                                    ? 'text-amber-700 hover:bg-amber-50' 
                                    : 'text-[#0A6EBD] hover:bg-sky-50'
                                }`}
                              >
                                <p.primaryAction.icon className="w-4 h-4" />
                                {p.primaryAction.label}
                              </Link>
                            )}
                            {p.secondaryActions.length > 0 && <div className="h-px bg-slate-100 my-1.5 mx-2" />}
                          </>
                        )}

                        {p.secondaryActions.map((action: any, idx: number) => (
                          action.onClick ? (
                            <button
                              key={idx}
                              onClick={() => { setOpenDropdownId(null); action.onClick(); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition ${
                                action.isDestructive ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <action.icon className="w-4 h-4" />
                              {action.label}
                            </button>
                          ) : (
                            <Link
                              key={idx}
                              href={action.href}
                              onClick={() => setOpenDropdownId(null)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition ${
                                action.isDestructive ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <action.icon className="w-4 h-4" />
                              {action.label}
                            </Link>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. THANH PHÂN TRANG TỔNG THỂ (PAGINATION FOOTER) */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredProjects.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="đề tài"
      />
      {outlineProject && (
        <OutlineModal 
          project={outlineProject} 
          onClose={() => setOutlineProject(null)} 
        />
      )}
      
      {/* ── Modal: Nộp đề cương (Legacy UX) ── */}
      <SubmitProposalModal 
        isOpen={!!submitModalProjectId} 
        onClose={() => setSubmitModalProjectId(null)} 
        projectCode={submitModalProjectId || ''} 
      />
    </div>
  );
}

// Modal component for Uploading Outline
function OutlineModal({ project, onClose }: { project: any, onClose: () => void }) {
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { currentUser } = useAuth();

  const handleSave = () => {
    if (!startMonth || !endMonth) {
      warning('Vui lòng chọn thời gian thực hiện');
      return;
    }
    
    // Convert YYYY-MM to ISO date for repo
    const startDate = `${startMonth}-01T00:00:00Z`;
    const endDate = `${endMonth}-28T00:00:00Z`; // Approximation

    repo.updateProject(project.id, {
      startDate,
      endDate,
      status: 'SUBMITTED', // Status changes back to under review
      proposalStatus: 'UNDER_PROPOSAL_REVISION_REVIEW' as any // Council will review outline next
    });

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      entityType: 'PROJECT',
      entityId: project.id,
      actionCode: 'OUTLINE_UPLOADED',
      notes: 'Tải lên file đề cương và cập nhật thời gian thực hiện',
    });

    success('Đã tải lên đề cương và gửi phê duyệt thành công!');
    onClose();
    window.location.reload(); // Refresh the page to reflect changes
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 uppercase text-[#0A6EBD]">TẢI LÊN ĐỀ CƯƠNG</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Đề tài: {project.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Thực hiện từ tháng <span className="text-rose-500">*</span></label>
              <input
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] outline-none text-sm shadow-xs transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Thực hiện đến tháng <span className="text-rose-500">*</span></label>
              <input
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] outline-none text-sm shadow-xs transition"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Chọn file <span className="text-rose-500">*</span></label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".doc,.docx,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="outline-upload"
              />
              <label 
                htmlFor="outline-upload" 
                className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition shadow-xs"
              >
                Choose File
              </label>
              <span className="text-sm text-slate-600 truncate max-w-sm">
                {file ? file.name : 'Không có file nào được chọn'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-center gap-3 shrink-0">
          <button
            onClick={handleSave}
            className="px-8 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white text-sm font-bold rounded-lg shadow-sm transition"
          >
            Lưu
          </button>
          <button
            onClick={onClose}
            className="px-8 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold rounded-lg shadow-sm transition"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
