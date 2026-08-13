'use client';

import React, { useState } from 'react';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ShieldCheck,
  Search,
  Download,
  Printer,
  X,
  Eye,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { ResearchProject } from '@/lib/types';

// ==========================================
// 1. RESEARCHER VIEW
// ==========================================
function ResearcherEthicsView({ projects }: { projects: ResearchProject[] }) {
  return (
    <div className="space-y-4 max-w-4xl mx-auto text-slate-800">
      <PageHeader
        title="Đạo đức nghiên cứu"
        description="Theo dõi yêu cầu và hồ sơ đạo đức của các đề tài bạn tham gia."
      />
      
      {projects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 font-semibold">Bạn chưa có đề tài nào cần thực hiện thủ tục đạo đức.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const isApproved = p.ethicsStatus === 'ETHICS_APPROVED';
            const needsRevision = p.ethicsStatus === 'ETHICS_REVISION_REQUIRED';
            
            return (
              <div key={p.id} className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono font-bold text-xs text-[#0A6EBD] bg-sky-50 px-2.5 py-0.5 rounded border border-sky-100">
                        {p.projectCode || p.proposalCode}
                      </span>
                      <StatusBadge status={p.ethicsStatus} />
                    </div>
                    <h3 className="font-bold text-slate-900 leading-snug">{p.title}</h3>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 text-[13px]">
                    <p className="text-slate-600">Yêu cầu đạo đức: <strong className="text-slate-900">Có</strong></p>
                    {isApproved && (
                      <>
                        <p className="text-slate-600">Giấy chấp thuận: <strong className="font-mono text-emerald-700">IRB-{p.id}/25</strong></p>
                        <p className="text-slate-600">Ngày chấp thuận: <strong className="text-slate-900">20/03/2025</strong></p>
                      </>
                    )}
                    {needsRevision && (
                      <div className="mt-2 text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                        <span className="font-semibold block">Công việc cần thực hiện:</span>
                        Bổ sung tài liệu theo yêu cầu Hội đồng ngày 15/03/2025.
                      </div>
                    )}
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-2">
                    {needsRevision ? (
                      <Link
                        href={`/projects/${p.id}/ethics`}
                        className="px-4 py-2 bg-[#0A6EBD] text-white text-[13px] font-bold rounded-lg hover:bg-[#085896] transition shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Edit className="w-4 h-4" /> Bổ sung hồ sơ
                      </Link>
                    ) : (
                      <Link
                        href={`/projects/${p.id}`}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-[13px] font-bold rounded-lg hover:bg-slate-50 transition shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" /> Xem hồ sơ
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. ADMIN/RESEARCH OFFICE VIEW
// ==========================================
function AdminEthicsWorkspace({ projects }: { projects: ResearchProject[] }) {
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [filter, setFilter] = useState('ALL');

  const filteredProjects = projects.filter((p) => {
    if (filter !== 'ALL' && p.ethicsStatus !== filter) return false;
    
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

  const project = repo.getProjectById(selectedProjectId) || filteredProjects[0];

  return (
    <div className="space-y-3 text-slate-800">
      <PageHeader
        title="Quản lý Hồ sơ Đạo đức Y sinh"
        description="Hàng đợi xử lý hồ sơ đạo đức toàn viện dành cho Phòng Quản lý NCKH"
        actions={
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold shadow-xs transition whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" /> In báo cáo
          </button>
        }
      />

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'WAITING_ETHICS_SCREENING', label: 'Chờ sàng lọc' },
            { id: 'UNDER_ETHICS_REVIEW', label: 'Đang thẩm định' },
            { id: 'ETHICS_REVISION_REQUIRED', label: 'Cần bổ sung' },
            { id: 'ETHICS_APPROVED', label: 'Đã chấp thuận' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                filter === f.id ? 'bg-[#EBF4FC] text-[#0A6EBD] border border-[#B8D7F5]' : 'text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <div className="relative w-full sm:max-w-xs ml-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã, tên đề tài..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 focus:border-[#0A6EBD] outline-none text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Hàng đợi (4 / 12) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-[#F8FAFC] border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider text-slate-500">
            HỒ SƠ ĐẠO ĐỨC ({filteredProjects.length})
          </div>
          <div className="divide-y divide-slate-100 max-h-[650px] overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Không có hồ sơ nào.
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = (project?.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`p-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#EBF4FC]/70 border-l-4 border-l-[#0A6EBD]'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#0A6EBD]">{p.projectCode || p.proposalCode}</span>
                    </div>
                    <p className="font-semibold text-xs text-slate-900 line-clamp-2">{p.title}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-slate-500 truncate">{p.principalInvestigatorName}</span>
                      <StatusBadge status={p.ethicsStatus} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Nội dung chi tiết (8 / 12) */}
        {project ? (
          <div className="lg:col-span-8 space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono font-bold text-xs bg-[#EBF4FC] text-[#0A6EBD] px-2 py-0.5 rounded border border-[#B8D7F5] mb-2 inline-block">
                    {project.projectCode || project.proposalCode}
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">{project.title}</h2>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Chủ nhiệm: <strong className="text-slate-800">{project.principalInvestigatorName}</strong> • {project.departmentName}
                  </p>
                </div>
                {project.ethicsStatus === 'ETHICS_APPROVED' && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 whitespace-nowrap">
                    Đã chấp thuận
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
              <h3 className="font-bold text-[13px] text-slate-800 border-b border-slate-100 pb-2 mb-3">
                KẾT QUẢ SÀNG LỌC ĐẠO ĐỨC
              </h3>
              <div className="space-y-2 text-[12px] text-slate-700">
                <div className="flex justify-between p-2 bg-slate-50 rounded">
                  <span>Có sử dụng người tham gia nghiên cứu</span>
                  <strong className="text-rose-600">Có</strong>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded">
                  <span>Có can thiệp</span>
                  <strong className="text-rose-600">Có</strong>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded">
                  <span>Có thu thập mẫu sinh học</span>
                  <strong className="text-rose-600">Có</strong>
                </div>
                <div className="mt-4 p-3 bg-[#EBF4FC] rounded-lg border border-[#B8D7F5]">
                  <span className="font-bold text-[#0A6EBD] block mb-1">Kết luận:</span>
                  Yêu cầu xem xét đạo đức (Hội đồng Đạo đức Y sinh)
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
              <h3 className="font-bold text-[13px] text-slate-800 border-b border-slate-100 pb-2 mb-3">
                HỒ SƠ ĐẠO ĐỨC ĐÍNH KÈM
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {['Đề cương nghiên cứu', 'Phiếu thông tin cho ĐTNC', 'Phiếu đồng thuận', 'Cam kết bảo mật'].map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="truncate">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {project.ethicsStatus === 'ETHICS_APPROVED' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Quyết định / Giấy chấp thuận</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">IRB-{project.id}/25 • Có hiệu lực đến 31/12/2026</p>
                </div>
                <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 shadow-xs transition">
                  <Download className="w-3.5 h-3.5" /> Tải về
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ==========================================
// 3. MAIN PAGE EXPORT (ROLE ROUTER)
// ==========================================
export default function EthicsWorkspacePage() {
  const { currentUser } = useAuth();
  const allProjects = repo.getProjects();
  
  if (['ADMIN', 'RESEARCH_OFFICE', 'DIRECTOR'].includes(currentUser.role)) {
    // Admin sees all projects that require ethics
    const ethicsProjects = allProjects.filter(p => p.ethicsRequired);
    return <AdminEthicsWorkspace projects={ethicsProjects} />;
  } else {
    // Researcher sees only their projects
    const myEthicsProjects = allProjects.filter(p => 
      (p.principalInvestigatorId === currentUser.id || p.principalInvestigatorName === currentUser.fullName) && 
      p.ethicsRequired
    );
    return <ResearcherEthicsView projects={myEthicsProjects} />;
  }
}
