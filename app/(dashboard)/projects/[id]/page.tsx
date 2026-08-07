'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LifecycleTimeline } from '@/components/ui/LifecycleTimeline';
import { DocxExportService } from '@/lib/services/docx-export-service';
import {
  formatVND,
  formatDate,
  getProjectTypeDisplayName,
  getFundingSourceDisplayName,
  getManagementLevelDisplayName,
  getEthicsStatusDisplayName,
  getProposalStatusDisplayName,
  getDocumentTypeDisplayName,
} from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  DollarSign,
  FileCheck2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  Users,
  Activity,
  Award,
  History,
  Layers,
  Download,
  Upload,
  Printer,
  ExternalLink,
  ChevronRight,
  GitPullRequest,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = repo.getProjectById(params.id);
  const { currentUser } = useAuth();

  // ĐÚNG CHUẨN HIS: Chỉ gồm 4 Tab thông tin nội tại của Hồ sơ đề tài
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'DOCUMENTS' | 'HISTORY'>('OVERVIEW');

  if (!project) {
    return (
      <div className="text-center py-16 bg-white rounded border border-[#D8DEE6] max-w-xl mx-auto">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</h2>
        <p className="text-xs text-slate-500 mt-1">Mã đề tài không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <Link
          href="/projects"
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A6EBD] text-white rounded text-xs font-bold shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục đề tài
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-w-[1440px] mx-auto text-slate-800">
      {/* 1. BREADCRUMB & QUAY LẠI */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Link
            href="/my-projects"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0A6EBD] font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Đề tài của tôi
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-400">{project.projectCode || project.proposalCode}</span>
          <span>/</span>
          <span className="font-semibold text-slate-700">Chi tiết đề tài</span>
        </div>
      </div>

      {/* 2. HEADER ĐỀ TÀI (Mã + Tên 1 dòng đậm, 1 badge trạng thái duy nhất, nút hành động) */}
      <div className="bg-white px-4 py-3 rounded border border-[#D8DEE6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
          <span className="font-mono font-bold text-xs bg-[#EBF4FC] text-[#0A6EBD] px-2 py-0.5 rounded border border-[#B8D7F5] shrink-0">
            {project.projectCode || project.proposalCode}
          </span>
          <h1 className="text-[18px] font-bold text-[#1B3B60] truncate leading-tight">
            {project.title}
          </h1>
          <div className="shrink-0">
            <StatusBadge status={project.status} />
          </div>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => DocxExportService.exportProposalDocx(project)}
            className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white text-[13px] font-bold px-3 py-1.5 rounded transition shadow-sm"
            title="Xuất Thuyết minh đề tài chuẩn TT 09/2024 ra file Word"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Thuyết minh Word (.doc)
          </button>

          {project.ethicsRequired && (
            <button
              onClick={() => DocxExportService.exportEthicsCertificatePdf(project)}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-bold px-3 py-1.5 rounded transition shadow-sm"
              title="Xuất Giấy chứng nhận Chấp thuận Đạo đức Y sinh chuẩn TT 43/2024"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Giấy chứng nhận IRB
            </button>
          )}

          {currentUser.role === 'RESEARCH_OFFICE' && project.proposalStatus === 'SUBMITTED' && (
            <Link
              href={`/projects/${project.id}/review`}
              className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[13px] font-bold px-3 py-1.5 rounded transition shadow-sm"
            >
              <FileCheck2 className="w-3.5 h-3.5" /> Thẩm định hồ sơ
            </Link>
          )}
          {project.proposalStatus === 'REVISION_REQUIRED' && (
            <Link
              href={`/projects/${project.id}/resubmit`}
              className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold px-3 py-1.5 rounded transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> Nộp bổ sung v2.0
            </Link>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold px-3 py-1.5 rounded border border-[#D8DEE6] transition"
          >
            <Printer className="w-3.5 h-3.5" /> In phiếu
          </button>
        </div>
      </div>

      {/* 3. DẢI CHỈ SỐ NGANG (Đúng 5 mục cốt lõi, font 14px) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
        <div className="bg-white p-2.5 rounded border border-[#D8DEE6] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Chủ nhiệm đề tài</span>
          <p className="font-bold text-[14px] text-slate-900 truncate mt-0.5">{project.principalInvestigatorName}</p>
        </div>

        <div className="bg-white p-2.5 rounded border border-[#D8DEE6] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Khoa / Phòng chủ trì</span>
          <p className="font-bold text-[14px] text-slate-900 truncate mt-0.5">{project.departmentName}</p>
        </div>

        <div className="bg-white p-2.5 rounded border border-[#D8DEE6] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Tiến độ thực hiện</span>
            <span className="font-mono font-bold text-[14px] text-[#0A6EBD]">{project.progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-[#0A6EBD] h-1.5 rounded-full"
              style={{ width: `${project.progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded border border-[#D8DEE6] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Kinh phí BV duyệt</span>
          <p className="font-mono font-bold text-[14px] text-slate-900 mt-0.5">
            {formatVND(project.approvedBudget || project.estimatedBudget)}
          </p>
        </div>

        <div className="bg-white p-2.5 rounded border border-[#D8DEE6] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Thời gian thực hiện</span>
          <p className="font-mono font-bold text-[13px] text-slate-800 mt-0.5">
            {formatDate(project.startDate)} → {formatDate(project.endDate)}
          </p>
        </div>
      </div>

      {/* 4. COMPACT LIFECYCLE TIMELINE (Nhỏ gọn max 40px, thanh ngang tinh tế) */}
      <LifecycleTimeline currentStatus={project.status} />

      {/* 5. TABS BAR NỘI TẠI (CHỈ 4 TABS: Overview, Members, Documents, History) */}
      <div className="bg-white rounded border border-[#D8DEE6] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#D8DEE6] bg-[#F5F7FA] px-2 text-[14px] font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2.5 border-b-2 transition ${
              activeTab === 'OVERVIEW'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Tổng quan đề tài
          </button>
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'MEMBERS'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Thành viên nghiên cứu
            <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
              {project.members.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'DOCUMENTS'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Tài liệu & Hồ sơ (Explorer)
            <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
              {project.documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'border-[#0A6EBD] text-[#0A6EBD] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Lịch sử & Audit Log
            <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
              {project.statusHistory.length}
            </span>
          </button>
        </div>

        {/* TAB BODY CONTENT */}
        <div className="p-4 text-[14px]">
          {/* TAB 1: OVERVIEW + 4 WORKSPACE SHORTCUT PANELS (Bấm để sang workspace riêng) */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Mục tiêu & Tóm tắt */}
              <div>
                <h3 className="font-bold text-[#1B3B60] text-[15px] uppercase tracking-wider mb-1.5">
                  Mục tiêu & Tóm tắt nghiên cứu
                </h3>
                <p className="p-3 bg-[#F5F7FA] rounded border border-[#D8DEE6] text-slate-800 leading-relaxed text-[14px]">
                  {project.summary}
                </p>
              </div>

              {/* Thông tin phân loại */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded border border-[#D8DEE6] bg-white space-y-1.5 text-[14px]">
                  <h4 className="font-bold text-[#1B3B60] text-[14px] uppercase border-b border-slate-100 pb-1">
                    Phân loại Đề tài
                  </h4>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Cấp quản lý:</span>
                    <strong className="text-slate-900">{getManagementLevelDisplayName(project.managementLevel)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Loại hình nghiên cứu:</span>
                    <strong className="text-slate-900">{getProjectTypeDisplayName(project.projectType)}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Nguồn kinh phí:</span>
                    <strong className="text-slate-900">{getFundingSourceDisplayName(project.fundingSource)}</strong>
                  </div>
                </div>

                <div className="p-3 rounded border border-[#D8DEE6] bg-white space-y-1.5 text-[14px]">
                  <h4 className="font-bold text-[#1B3B60] text-[14px] uppercase border-b border-slate-100 pb-1">
                    Thông tin Tiếp nhận
                  </h4>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Đợt tiếp nhận:</span>
                    <strong className="text-slate-900">{project.registrationRoundName}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Ngày tạo đề xuất:</span>
                    <span className="font-mono text-slate-900">{formatDate(project.createdAt)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Ngày nộp hồ sơ:</span>
                    <span className="font-mono text-slate-900">{project.submittedAt ? formatDate(project.submittedAt) : 'Chưa nộp'}</span>
                  </div>
                </div>
              </div>

              {/* 4 PHÂN HỆ NGHIỆP VỤ LIÊN KẾT */}
              <div className="pt-2">
                <h3 className="font-bold text-slate-800 text-[15px] mb-2">
                  Phân hệ nghiệp vụ liên kết
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 1. Hội đồng Khoa học */}
                  <div className="p-3 rounded border border-[#D8DEE6] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-medium text-slate-500 block">Hội đồng khoa học xét duyệt</span>
                      <p className="font-bold text-slate-900 text-[14px] mt-0.5">HĐ Cơ sở phiên 04/2026</p>
                      <p className="text-slate-500 text-[12px]">Họp ngày: 15/02/2026 • Đã thông qua đề cương</p>
                    </div>
                    <Link
                      href="/councils"
                      className="px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-[#D8DEE6] text-[#0A6EBD] font-semibold text-xs inline-flex items-center gap-1 shadow-sm shrink-0"
                    >
                      <Award className="w-3.5 h-3.5" /> Xem hội đồng →
                    </Link>
                  </div>

                  {/* 2. Đạo đức Y sinh */}
                  <div className="p-3 rounded border border-[#D8DEE6] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-medium text-slate-500 block">Đạo đức y sinh (IRB)</span>
                      <p className="font-bold text-slate-900 text-[14px] mt-0.5">
                        {project.ethicsRequired ? 'Bắt buộc sàng lọc IRB' : 'Không thuộc diện'}
                      </p>
                      <p className="text-emerald-700 font-semibold text-[12px]">
                        Trạng thái: {getEthicsStatusDisplayName(project.ethicsStatus)}
                      </p>
                    </div>
                    <Link
                      href="/ethics"
                      className="px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-[#D8DEE6] text-[#0A6EBD] font-semibold text-xs inline-flex items-center gap-1 shadow-sm shrink-0"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Xem hồ sơ IRB →
                    </Link>
                  </div>

                  {/* 3. Tiến độ & Mốc kiểm tra */}
                  <div className="p-3 rounded border border-[#D8DEE6] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-medium text-slate-500 block">Tiến độ & mốc kiểm tra</span>
                      <p className="font-bold text-slate-900 text-[14px] mt-0.5">Tiến độ tổng thể: {project.progressPercentage}%</p>
                      <p className="text-slate-500 text-[12px]">Kỳ báo cáo tiếp theo: 15/06/2026</p>
                    </div>
                    <Link
                      href="/progress"
                      className="px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-[#D8DEE6] text-[#0A6EBD] font-semibold text-xs inline-flex items-center gap-1 shadow-sm shrink-0"
                    >
                      <Activity className="w-3.5 h-3.5" /> Theo dõi tiến độ →
                    </Link>
                  </div>

                  {/* 4. Tài chính & Quyết toán */}
                  <div className="p-3 rounded border border-[#D8DEE6] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-medium text-slate-500 block">Tài chính & quyết toán</span>
                      <p className="font-bold text-slate-900 text-[14px] mt-0.5">Dự toán: {formatVND(project.approvedBudget || project.estimatedBudget)}</p>
                      <p className="text-slate-500 text-[12px]">Đã tạm ứng Đợt 1: 50%</p>
                    </div>
                    <Link
                      href="/finance"
                      className="px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-[#D8DEE6] text-[#0A6EBD] font-semibold text-xs inline-flex items-center gap-1 shadow-sm shrink-0"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Quản lý tài chính →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === 'MEMBERS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#1B3B60] text-[15px]">
                  Danh sách Thành viên Nghiên cứu ({project.members.length} thành viên)
                </h3>
              </div>
              <table className="w-full text-left border-collapse text-[14px]">
                <thead className="bg-[#F5F7FA] border-b border-[#D8DEE6] text-slate-700 font-bold text-[13px]">
                  <tr>
                    <th className="p-2.5">Họ và tên</th>
                    <th className="p-2.5">Học hàm / Học vị</th>
                    <th className="p-2.5">Đơn vị công tác</th>
                    <th className="p-2.5">Vai trò trong đề tài</th>
                    <th className="p-2.5 text-right">Tỷ lệ đóng góp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8DEE6]">
                  {project.members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{m.fullName}</td>
                      <td className="p-2.5 text-slate-600">{m.academicRank}</td>
                      <td className="p-2.5 text-slate-600">{m.unit}</td>
                      <td className="p-2.5 font-semibold text-[#0A6EBD]">{m.roleInProject}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{m.contributionPercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: DOCUMENTS (File Explorer format) */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-3">
              {/* BANNER XUẤT BIỂU MẪU TỰ ĐỘNG (SMART AUTO-FILL) */}
              <div className="p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50/50 rounded-xl border border-sky-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[#0A6EBD] font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-[#0A6EBD]" />
                    <span>Xuất Biểu Mẫu Tự Động (Smart Document Generation)</span>
                  </div>
                  <p className="text-[12px] text-slate-600 mt-0.5">
                    Hệ thống tự động điền thông tin đề tài vào các mẫu văn bản chuẩn Thông tư 09/2024 & Thông tư 43/2024/TT-BYT.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => DocxExportService.exportProposalDocx(project)}
                    className="px-3 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Xuất Thuyết minh Word
                  </button>
                  {project.ethicsRequired && (
                    <button
                      onClick={() => DocxExportService.exportEthicsCertificatePdf(project)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Giấy IRB (PDF)
                    </button>
                  )}
                  <Link
                    href="/templates"
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition"
                  >
                    Kho Biểu mẫu →
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#1B3B60] text-[15px]">
                  Hồ sơ & Tài liệu Nghiên cứu (File Explorer)
                </h3>
              </div>
              <table className="w-full text-left border-collapse text-[14px]">
                <thead className="bg-[#F5F7FA] border-b border-[#D8DEE6] text-slate-700 font-bold text-[13px]">
                  <tr>
                    <th className="p-2.5">Loại văn bản</th>
                    <th className="p-2.5">Tên tài liệu</th>
                    <th className="p-2.5 w-24">Phiên bản</th>
                    <th className="p-2.5">Người tải lên</th>
                    <th className="p-2.5 w-32">Ngày cập nhật</th>
                    <th className="p-2.5 text-right w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8DEE6]">
                  {project.documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{getDocumentTypeDisplayName(doc.documentType)}</td>
                      <td className="p-2.5 text-slate-700 font-medium">{doc.title}</td>
                      <td className="p-2.5 font-mono font-bold text-[#0A6EBD]">v{doc.currentVersion}.0</td>
                      <td className="p-2.5 text-slate-600">{doc.versions[0]?.uploadedByName || 'Chủ nhiệm đề tài'}</td>
                      <td className="p-2.5 font-mono text-slate-500 text-[13px]">{doc.versions[0]?.uploadedAt || project.createdAt}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => alert(`Tải xuống tệp tin ${doc.title}`)}
                          className="text-[#0A6EBD] hover:underline font-bold inline-flex items-center gap-1 text-[13px]"
                        >
                          <Download className="w-3.5 h-3.5" /> Tải về
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: HISTORY (Activity Timeline format) */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <h3 className="font-bold text-[#1B3B60] text-[15px]">
                Nhật ký Hoạt động & Lịch sử Trạng thái (Audit Log)
              </h3>
              <table className="w-full text-left border-collapse text-[14px]">
                <thead className="bg-[#F5F7FA] border-b border-[#D8DEE6] text-slate-700 font-bold text-[13px]">
                  <tr>
                    <th className="p-2.5 w-36">Thời gian</th>
                    <th className="p-2.5 w-44">Người thực hiện</th>
                    <th className="p-2.5 w-40">Vai trò</th>
                    <th className="p-2.5">Hành động nghiệp vụ & Ý kiến</th>
                    <th className="p-2.5 w-36">Trạng thái đích</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8DEE6]">
                  {project.statusHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-500 text-[13px]">{h.changedAt}</td>
                      <td className="p-2.5 font-bold text-slate-900">{h.changedByName}</td>
                      <td className="p-2.5 text-slate-600">{h.userRole}</td>
                      <td className="p-2.5 text-slate-800">
                        <p className="font-medium">{h.action}</p>
                        {h.comment && <p className="text-[13px] text-slate-500 italic mt-0.5">&ldquo;{h.comment}&rdquo;</p>}
                      </td>
                      <td className="p-2.5">
                        <StatusBadge status={h.toStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
