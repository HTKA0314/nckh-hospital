'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DocxExportService } from '@/lib/services/docx-export-service';
import {
  ArrowLeft,
  FileText,
  Save,
  Printer,
  Download,
  Share2,
  ClipboardList,
  PenTool,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { canSignMinutes } from '@/lib/utils/permissions';

/* ── Tiêu chí chấm điểm theo TT 09/2024 ── */
const CRITERIA = [
  { key: 'novelty',     max: 20, label: 'Tính cấp thiết và tính mới của đề tài' },
  { key: 'methodology', max: 30, label: 'Mục tiêu, đối tượng và phương pháp nghiên cứu' },
  { key: 'feasibility', max: 20, label: 'Tính khả thi và năng lực tổ chức thực hiện' },
  { key: 'efficacy',    max: 20, label: 'Hiệu quả khoa học, thực tiễn và khả năng ứng dụng' },
  { key: 'capability',  max: 10, label: 'Dự toán kinh phí' },
] as const;

/* ── Kết quả xét duyệt ── */
const VERDICT_OPTIONS = [
  { id: 'APPROVED', label: 'Thông qua'                         },
  { id: 'REVISION', label: 'Thông qua có sửa đổi, bổ sung'    },
  { id: 'REJECTED', label: 'Không thông qua'                   },
] as const;

const TABS = [
  { id: 'MINUTES' as const, icon: ClipboardList, label: 'Biên bản họp Hội đồng' },
  { id: 'SCORING' as const, icon: PenTool,       label: 'Phiếu chấm điểm'       },
  { id: 'HANDOVER' as const, icon: Share2,        label: 'Biên bản bàn giao'     },
];

export default function CouncilWorkspacePage({ params }: { params: { id: string } }) {
  const { currentUser } = useAuth();
  const council  = repo.getCouncilById(params.id) || repo.getCouncils()[0];

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    council?.projectIds[0] || 'proj-01'
  );
  const project = repo.getProjectById(selectedProjectId);
  const [activeTab, setActiveTab] = useState<'MINUTES' | 'SCORING' | 'HANDOVER'>('MINUTES');

  /* state – chấm điểm */
  const [scores, setScores] = useState<Record<string, number>>({
    novelty: 0, methodology: 0, feasibility: 0, efficacy: 0, capability: 0,
  });
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const [expertComment, setExpertComment] = useState('');

  /* state – biên bản họp */
  const [verdict, setVerdict] = useState<'APPROVED' | 'REVISION' | 'REJECTED' | ''>('');
  const [minutesContent, setMinutesContent] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  /* state – bàn giao */
  const [receivingDept, setReceivingDept] = useState('');
  const [handoverDetail, setHandoverDetail] = useState('');

  const handleExportDocx = () => {
    if (!project) return;
    DocxExportService.exportCouncilMinutesDocx(
      council.name, council.code,
      project.title, project.principalInvestigatorName,
      verdict as any, minutesContent
    );
  };

  const handleSaveMinutes = () => {
    if (!canSignMinutes(currentUser, council)) {
      alert('Bạn không có quyền ban hành biên bản Hội đồng. Chỉ Chủ tịch hoặc Thư ký mới được ký xác nhận.');
      return;
    }

    // Enforce minimum signatures: at least 3 evaluations submitted including Chair and Secretary
    const signedCount = council.members.filter((m) => m.evaluationSubmitted).length;
    const chairSigned = council.members.some((m) => m.roleInCouncil === 'CHỦ_TỊCH' && m.evaluationSubmitted);
    const secretarySigned = council.members.some((m) => m.roleInCouncil === 'THƯ_KÝ' && m.evaluationSubmitted);
    if (signedCount < 3 || !chairSigned || !secretarySigned) {
      alert('Không thể ban hành biên bản: yêu cầu tối thiểu 3 phiếu đã ký, trong đó có Chủ tịch và Thư ký.');
      return;
    }

    // Persist minutes and emit audit + notifications
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 4000);

    if (project) {
      // apply verdict to project
      const newProposalStatus = verdict === 'APPROVED' ? 'PROPOSAL_APPROVED' : verdict === 'REVISION' ? 'PROPOSAL_REVISION_REQUIRED' : 'REJECTED';
      const newProjectStatus = verdict === 'APPROVED' ? 'APPROVED' : project.status;

      repo.updateCouncil(council.id, { status: 'CONCLUDED' });
      if (verdict === 'APPROVED') {
        const decisionId = `dec-${Date.now()}`;
        repo.createDecision({
          id: decisionId,
          type: 'ASSIGNMENT',
          status: 'PENDING_SIGNATURE',
          projectId: project.id,
          decisionNumber: `QĐ-${new Date().getFullYear()}/ASSIGN-${project.proposalCode}`,
          createdAt: new Date().toISOString(),
          createdBy: currentUser.id,
          notes: `Được tạo tự động sau khi Hội đồng phê duyệt Đề cương đề tài "${project.title}"`,
          history: [
            {
              id: `dh-${Date.now()}`,
              decisionId: decisionId,
              action: 'SUBMITTED_FOR_SIGNATURE',
              toStatus: 'PENDING_SIGNATURE',
              actorId: currentUser.id,
              actorName: currentUser.fullName,
              actorRole: currentUser.role,
              timestamp: new Date().toISOString(),
              notes: 'Tự động tạo dự thảo và trình ký quyết định giao thực hiện từ kết luận Hội đồng'
            }
          ]
        });

        // Also add notification for Director/Admin that a new decision is pending signature
        repo.addNotification({
          userId: 'user-10', // GS.TS.BS Vũ Đình Khoa (Giám đốc Bệnh viện)
          title: `Cần ký duyệt Quyết định giao thực hiện: ${project.proposalCode}`,
          content: `Hội đồng đã thông qua đề tài "${project.title}". Quyết định giao thực hiện đã được tạo tự động và đang chờ bạn ký phê duyệt.`,
          type: 'INFO',
          link: `/decisions/${decisionId}`,
        });
      }

      repo.updateProject(project.id, {
        proposalStatus: newProposalStatus as any,
        status: newProjectStatus as any,
        statusHistory: [
          ...project.statusHistory,
          {
            id: `h-${Date.now()}`,
            projectId: project.id,
            fromStatus: project.proposalStatus,
            toStatus: newProposalStatus,
            changedBy: currentUser.id,
            changedByName: currentUser.fullName,
            userRole: currentUser.role,
            changedAt: new Date().toLocaleString('vi-VN'),
            action: `Hội đồng: ${verdict}`,
            comment: minutesContent,
          },
        ],
      });

      repo.addAuditLog({
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userRole: currentUser.role,
        actionCode: `COUNCIL_VERDICT_${verdict}`,
        entityType: 'PROJECT',
        entityId: project.id,
        notes: `Hội đồng ${council.code} đã kết luận ${verdict} cho đề tài ${project.proposalCode}.`,
      });

      // Notify PI and Research Office
      repo.addNotification({
        userId: project.principalInvestigatorId,
        title: `Hội đồng kết luận: ${project.proposalCode}`,
        content: `Hội đồng ${council.name} đã đưa ra kết luận: ${verdict} — ${minutesContent}`,
        type: verdict === 'APPROVED' ? 'SUCCESS' : verdict === 'REVISION' ? 'WARNING' : 'ERROR',
        link: `/projects/${project.id}`,
      });
      repo.getUsers().filter(u => u.role === 'RESEARCH_OFFICE').forEach(u => {
        repo.addNotification({
          userId: u.id,
          title: `Hội đồng đã kết luận đề tài ${project.proposalCode}`,
          content: `Kết luận: ${verdict} — ${minutesContent}`,
          type: 'INFO',
          link: `/projects/${project.id}`,
        });
      });
    }
  };

  /* ─── render ─── */
  return (
    <main className="flex flex-col gap-3 text-slate-800 pb-12">

      {/* ── Điều hướng ── */}
      <nav className="flex items-center gap-2 text-[12px] text-slate-500 select-none">
        <Link
          href="/councils"
          className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0A6EBD] font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Danh sách Hội đồng
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-mono text-slate-500">{council.code}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-semibold">Nghiệp vụ Hội đồng</span>
      </nav>

      {/* ── Tiêu đề phiên họp ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] font-bold bg-[#F0F6FE] text-[#0A6EBD] border border-[#C7DFF7] px-2.5 py-0.5 rounded">
              {council.code}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
              {council.type === 'PROPOSAL_REVIEW' ? 'Hội đồng xét duyệt đề cương' : 'Hội đồng nghiệm thu'}
            </span>
          </div>
          <h1 className="text-[15px] font-bold text-slate-900 leading-snug mt-1">{council.name}</h1>
          <p className="text-[12px] text-slate-500">
            Phiên họp: <strong className="text-slate-700">{council.meetingDate}</strong>
            {council.meetingTime ? ` — ${council.meetingTime}` : ''}
            {council.location ? ` · ${council.location}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="h-8 px-3 text-[12px] font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> In
          </button>
          <button
            onClick={handleExportDocx}
            className="h-8 px-3 text-[12px] font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Word
          </button>
        </div>
      </div>

      {/* ── Layout chính ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">

        {/* ══ Panel trái ══ */}
        <aside className="lg:col-span-4 space-y-3">

          {/* Danh sách đề tài */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <header className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Đề tài trong phiên họp</h2>
              <span className="font-mono text-[11px] font-bold text-[#0A6EBD] bg-[#F0F6FE] border border-[#C7DFF7] px-2 py-0.5 rounded">
                {council.projectIds.length}
              </span>
            </header>
            <div className="divide-y divide-slate-100">
              {council.projectIds.map((pid) => {
                const p = repo.getProjectById(pid);
                if (!p) return null;
                const active = selectedProjectId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`w-full text-left px-4 py-3 border-l-[3px] transition-colors ${
                      active
                        ? 'border-l-[#0A6EBD] bg-[#F5FAFF]'
                        : 'border-l-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-bold text-[#0A6EBD]">
                        {p.projectCode || p.proposalCode}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-[12px] font-semibold text-slate-900 leading-snug line-clamp-2">{p.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{p.principalInvestigatorName}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Thành viên hội đồng */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <header className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Thành viên Hội đồng
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {council.members.length} người
              </span>
            </header>
            <div className="divide-y divide-slate-100">
              {council.members.map((m) => {
                const roleLabel =
                  m.roleInCouncil === 'CHỦ_TỊCH' ? 'Chủ tịch' :
                  m.roleInCouncil === 'THƯ_KÝ'   ? 'Thư ký'   : 'Ủy viên';
                return (
                  <div key={m.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-900 truncate">{m.userFullName}</p>
                      <p className="text-[11px] text-slate-400">{roleLabel}</p>
                    </div>
                    {m.evaluationSubmitted ? (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Đã chấm
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        <Circle className="w-3 h-3" /> Chờ
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        {/* ══ Panel phải ══ */}
        <div className="lg:col-span-8">
          {project ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">

              {/* Thông tin đề tài đang xem */}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] font-bold text-[#0A6EBD]">
                      {project.projectCode || project.proposalCode}
                    </span>
                    <h2 className="text-[13px] font-bold text-slate-900 leading-snug mt-0.5 line-clamp-2">
                      {project.title}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Chủ nhiệm: <strong className="text-slate-700">{project.principalInvestigatorName}</strong>
                      {project.departmentName ? ` — ${project.departmentName}` : ''}
                    </p>
                  </div>
                  {(() => {
                    const a = council.projectAssignments?.find((x) => x.projectId === selectedProjectId);
                    if (!a?.reviewer1Name) return null;
                    return (
                      <div className="shrink-0 text-right space-y-0.5">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Phản biện</p>
                        {a.reviewer1Name && (
                          <p className="text-[11px] font-semibold text-slate-700">
                            PB1: <span className="text-[#0A6EBD]">{a.reviewer1Name}</span>
                          </p>
                        )}
                        {a.reviewer2Name && (
                          <p className="text-[11px] font-semibold text-slate-700">
                            PB2: <span className="text-[#0A6EBD]">{a.reviewer2Name}</span>
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex border-b border-slate-200 px-2 gap-0">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                        isActive
                          ? 'border-[#0A6EBD] text-[#0A6EBD]'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ─── Tab: Biên bản họp ─── */}
              {activeTab === 'MINUTES' && (
                <div className="p-5 space-y-5">
                  {savedOk && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[12px] text-emerald-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Biên bản đã được lưu và phát hành vào hồ sơ đề tài.
                    </div>
                  )}

                  {/* Kết quả xét duyệt */}
                  <div className="space-y-2">
                    <p className="text-[12px] font-bold text-slate-700">Kết quả xét duyệt</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {VERDICT_OPTIONS.map((v) => {
                        const active = verdict === v.id;
                        const borderColor =
                          v.id === 'APPROVED' ? 'border-emerald-500' :
                          v.id === 'REVISION'  ? 'border-amber-400'  : 'border-rose-500';
                        const activeBg =
                          v.id === 'APPROVED' ? 'bg-emerald-50 text-emerald-900' :
                          v.id === 'REVISION'  ? 'bg-amber-50 text-amber-900'    : 'bg-rose-50 text-rose-900';
                        return (
                          <label
                            key={v.id}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer select-none text-[12px] font-semibold transition-colors ${
                              active
                                ? `${borderColor} ${activeBg} ring-1 ring-offset-0 ${borderColor.replace('border', 'ring')}`
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="verdict"
                              checked={active}
                              onChange={() => setVerdict(v.id)}
                              className="accent-[#0A6EBD] w-3.5 h-3.5 shrink-0"
                            />
                            {v.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nội dung kết luận */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-700">
                      Nội dung kết luận
                    </label>
                    <textarea
                      rows={5}
                      value={minutesContent}
                      onChange={(e) => setMinutesContent(e.target.value)}
                      className="w-full px-3 py-2.5 text-[12px] text-slate-800 leading-relaxed border border-slate-300 rounded-lg outline-none focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] bg-white transition resize-none"
                    />
                  </div>

                  {/* Tổng hợp bỏ phiếu */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Phiếu tán thành', value: '5 / 5', accent: 'text-emerald-700' },
                      { label: 'Phiếu yêu cầu sửa', value: '4 / 5', accent: 'text-amber-700' },
                      { label: 'Điểm trung bình', value: '88,5', accent: 'text-[#0A6EBD]' },
                    ].map((item) => (
                      <div key={item.label} className="text-center px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{item.label}</p>
                        <p className={`text-[18px] font-bold font-mono ${item.accent}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={handleExportDocx}
                      className="h-8 px-3.5 text-[12px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Xuất Word
                    </button>
                    <button
                      onClick={handleSaveMinutes}
                      className="h-8 px-4 text-[12px] font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" /> Lưu & Ban hành
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Tab: Phiếu chấm điểm ─── */}
              {activeTab === 'SCORING' && (
                <div className="p-5 space-y-4">
                  {/* Tổng điểm */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">Phiếu chấm điểm thẩm định đề cương</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Thang điểm 100 điểm — Đạt: từ 70 điểm trở lên</p>
                    </div>
                    <div className={`text-center w-20 py-2.5 rounded-xl border-2 ${
                      totalScore >= 70
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-300 bg-slate-50'
                    }`}>
                      <p className={`text-[26px] leading-none font-bold font-mono ${
                        totalScore >= 70 ? 'text-emerald-700' : 'text-slate-500'
                      }`}>{totalScore}</p>
                      <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-wider ${
                        totalScore >= 70 ? 'text-emerald-600' : 'text-slate-400'
                      }`}>{totalScore >= 70 ? 'Đạt' : 'Chưa đủ'}</p>
                    </div>
                  </div>

                  {/* Bảng tiêu chí */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[12px]">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-bold text-slate-600 text-[11px] w-8">STT</th>
                          <th className="px-4 py-2.5 text-left font-bold text-slate-600 text-[11px]">Tiêu chí đánh giá</th>
                          <th className="px-4 py-2.5 text-center font-bold text-slate-600 text-[11px] w-20">Điểm tối đa</th>
                          <th className="px-4 py-2.5 text-center font-bold text-slate-600 text-[11px] w-24">Điểm chấm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {CRITERIA.map((c, i) => (
                          <tr key={c.key} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{c.label}</td>
                            <td className="px-4 py-3 text-center text-slate-500 font-mono">{c.max}</td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={c.max}
                                value={scores[c.key] || 0}
                                onChange={(e) => setScores({
                                  ...scores,
                                  [c.key]: Math.min(c.max, Math.max(0, Number(e.target.value))),
                                })}
                                className="w-14 px-2 py-1 text-center font-mono font-bold text-[13px] text-[#0A6EBD] border border-slate-300 rounded-lg outline-none focus:border-[#0A6EBD] bg-white transition"
                              />
                            </td>
                          </tr>
                        ))}
                        {/* Tổng cộng */}
                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                          <td colSpan={2} className="px-4 py-2.5 font-bold text-slate-700 text-[12px]">Tổng điểm</td>
                          <td className="px-4 py-2.5 text-center font-bold text-slate-700 font-mono">100</td>
                          <td className="px-4 py-2.5 text-center font-bold text-[#0A6EBD] font-mono text-[14px]">
                            {totalScore}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Nhận xét */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-700">
                      Ý kiến nhận xét của thành viên Hội đồng
                    </label>
                    <textarea
                      rows={3}
                      value={expertComment}
                      onChange={(e) => setExpertComment(e.target.value)}
                      className="w-full px-3 py-2.5 text-[12px] text-slate-800 leading-relaxed border border-slate-300 rounded-lg outline-none focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] bg-white transition resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        const memberIdx = council.members.findIndex((m) => m.userId === currentUser.id);
                        if (memberIdx === -1) {
                          alert('Bạn không phải là thành viên chính thức của Hội đồng này.');
                          return;
                        }
                        const newMembers = [...council.members];
                        newMembers[memberIdx] = {
                          ...newMembers[memberIdx],
                          evaluationSubmitted: true,
                        };
                        repo.updateCouncil(council.id, { members: newMembers });
                        alert('Đã ký và nộp phiếu chấm điểm thành công!');
                        window.location.reload();
                      }}
                      className="h-8 px-4 text-[12px] font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" /> Ký & Nộp phiếu
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Tab: Biên bản bàn giao ─── */}
              {activeTab === 'HANDOVER' && (
                <div className="p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-[13px] font-bold text-slate-900">Biên bản bàn giao và ứng dụng kết quả nghiên cứu</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Chuyển giao cho đơn vị thực hiện ứng dụng kết quả vào thực tiễn lâm sàng</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-700">
                        Đơn vị tiếp nhận
                      </label>
                      <input
                        type="text"
                        value={receivingDept}
                        onChange={(e) => setReceivingDept(e.target.value)}
                        className="w-full px-3 py-2 text-[12px] font-medium text-slate-800 border border-slate-300 rounded-lg outline-none focus:border-[#0A6EBD] transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-700">
                        Sản phẩm / Quy trình chuyển giao
                      </label>
                      <textarea
                        rows={4}
                        value={handoverDetail}
                        onChange={(e) => setHandoverDetail(e.target.value)}
                        className="w-full px-3 py-2.5 text-[12px] text-slate-800 leading-relaxed border border-slate-300 rounded-lg outline-none focus:border-[#0A6EBD] bg-white transition resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      onClick={() => alert('Đã phát hành biên bản bàn giao.')}
                      className="h-8 px-4 text-[12px] font-bold text-white bg-[#0A6EBD] hover:bg-[#085896] rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" /> Ký & Phát hành
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-[13px] text-slate-400">Chọn đề tài từ danh sách để tiếp tục</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
