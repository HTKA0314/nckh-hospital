'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DocxExportService } from '@/lib/services/docx-export-service';
import {
  Award,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  CheckSquare,
  AlertCircle,
  Save,
  Printer,
  ChevronRight,
  Download,
  ShieldCheck,
  Building2,
  FileCheck2,
  Share2,
  Sparkles,
  ClipboardList,
  UserCheck,
} from 'lucide-react';

export default function CouncilWorkspacePage({ params }: { params: { id: string } }) {
  const { currentUser } = useAuth();
  const council = repo.getCouncilById(params.id) || repo.getCouncils()[0];
  const [selectedProjectId, setSelectedProjectId] = useState<string>(council?.projectIds[0] || 'proj-01');
  const project = repo.getProjectById(selectedProjectId);

  // Tab chuyển đổi giữa: 1. Phiếu chấm điểm chuyên môn | 2. Lập Biên bản họp Online | 3. Biên bản Bàn giao
  const [activeTab, setActiveTab] = useState<'SCORING' | 'MINUTES' | 'HANDOVER'>('MINUTES');

  // State Phiếu chấm điểm 5 tiêu chí (Thông tư 09/2024 & Thông tư 43/2024)
  const [scores, setScores] = useState({
    novelty: 18, // max 20
    methodology: 26, // max 30
    feasibility: 18, // max 20
    efficacy: 17, // max 20
    capability: 9, // max 10
  });
  const totalScore = scores.novelty + scores.methodology + scores.feasibility + scores.efficacy + scores.capability;
  const [expertVote, setExpertVote] = useState<'APPROVE' | 'APPROVE_WITH_REVISION' | 'REJECT'>('APPROVE_WITH_REVISION');
  const [expertComments, setExpertComments] = useState(
    'Đề cương có tính thực tiễn cao đối với bệnh viện, cần làm rõ hơn tiêu chuẩn chọn bệnh nhân tại Khoa Hồi sức tích cực.'
  );

  // State Biên bản họp Hội đồng Online (BM-HĐ-02 / BM-NT-02 / BM-IRB-01)
  const [councilResult, setCouncilResult] = useState<'APPROVED' | 'REVISION' | 'REJECTED'>('REVISION');
  const [conclusion, setConclusion] = useState(
    'Hội đồng nhất trí thông qua đề cương. Đề nghị chủ nhiệm đề tài bổ sung làm rõ cỡ mẫu nghiên cứu tại Khoa Hồi sức tích cực (tối thiểu 80 bệnh án) và cập nhật lại bảng dự toán chi tiết v2.0 trước khi ký duyệt hợp đồng.'
  );
  const [minutesCode, setMinutesCode] = useState(`BB-${council.code}-01`);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Handover state (BM-CG-01)
  const [targetDepartment, setTargetDepartment] = useState('Khoa Hồi sức tích cực & Chống độc');
  const [handoverContent, setHandoverContent] = useState('Phác đồ phối hợp kháng sinh theo dược động học (PK/PD) cho bệnh nhân nhiễm khuẩn huyết nặng.');

  const handleExportDocx = () => {
    if (!project) return;
    DocxExportService.exportCouncilMinutesDocx(
      council.name,
      council.code,
      project.title,
      project.principalInvestigatorName,
      councilResult,
      conclusion
    );
  };

  const handleSaveMinutes = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-3 max-w-[1440px] mx-auto text-slate-800">
      {/* 1. Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Link href="/councils" className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0A6EBD] font-medium transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Danh sách Hội đồng
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-400">{council.code}</span>
          <span>/</span>
          <span className="font-semibold text-slate-700">Workspace Chấm điểm & Lập Biên bản Họp Online</span>
        </div>
      </div>

      {/* 2. Council Header Banner */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-sky-50 text-[#0A6EBD] px-2.5 py-0.5 rounded border border-sky-100">
              {council.code}
            </span>
            <h1 className="text-lg font-bold text-slate-900">{council.name}</h1>
          </div>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Phiên họp: <strong>{council.meetingDate}</strong> tại <strong>{council.location}</strong> • Tiêu chuẩn đạt tối thiểu: {council.minPassRatio * 100}% phiếu tán thành
          </p>
        </div>

        {/* Nút thao tác nhanh trên đầu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> In Biên bản
          </button>
          <button
            onClick={handleExportDocx}
            className="px-3.5 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Xuất File Word (.docx)
          </button>
        </div>
      </div>

      {/* 3. Master - Detail Grid (4 Cột Danh sách Đề tài & Thành viên / 8 Cột Workspace Nghiệp vụ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* CỘT TRÁI: Danh sách đề tài + Thành viên Hội đồng */}
        <div className="lg:col-span-4 space-y-3">
          {/* Danh mục Đề tài */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-3 bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Đề tài trong phiên họp</span>
              <span className="font-mono text-[#0A6EBD] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                {council.projectIds.length} Đề tài
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {council.projectIds.map((pid) => {
                const p = repo.getProjectById(pid);
                if (!p) return null;
                const isSelected = selectedProjectId === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`p-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#EBF4FC] border-l-4 border-l-[#0A6EBD]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#0A6EBD]">{p.projectCode || p.proposalCode}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="font-bold text-xs text-slate-900 line-clamp-2 mt-1 leading-snug">{p.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {p.principalInvestigatorName} • {p.departmentName}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danh sách Thành viên Hội đồng */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-3 bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Thành viên Hội đồng ({council.members.length})</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                Đã đủ túc số
              </span>
            </div>
            <div className="p-2.5 divide-y divide-slate-100 text-xs">
              {council.members.map((m) => (
                <div key={m.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{m.userFullName}</span>
                    <span className="text-slate-500 text-[11px]">{m.roleInCouncil} • {m.departmentName}</span>
                  </div>
                  {m.evaluationSubmitted ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Đã chấm
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Chờ chấm
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Workspace Nghiệp vụ Hội đồng */}
        <div className="lg:col-span-8 space-y-3">
          {project && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Header Hồ sơ đang chọn */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#0A6EBD] bg-white px-2 py-0.5 rounded border border-sky-200">
                    {project.projectCode || project.proposalCode}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    Chủ nhiệm: <strong>{project.principalInvestigatorName}</strong> ({project.departmentName})
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">{project.title}</h2>
                
                {/* 2 Phản biện phân công chuyên sâu */}
                {(() => {
                  const assign = council.projectAssignments?.find((a) => a.projectId === selectedProjectId);
                  return (
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-200/80 text-[11px]">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Phản biện độc lập theo đề tài:
                      </span>
                      <span className="bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                        PB1: <strong className="text-[#0A6EBD]">{assign?.reviewer1Name || 'PGS.TS.BS. Phạm Đức Dũng'}</strong>
                      </span>
                      <span className="bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                        PB2: <strong className="text-[#0A6EBD]">{assign?.reviewer2Name || 'TS.BS. Vũ Thị Hồng Hạnh'}</strong>
                      </span>
                      {assign?.notes && (
                        <span className="text-slate-500 italic">• Yêu cầu: {assign.notes}</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Navigation Tabs Bar */}
              <div className="flex border-b border-slate-200 bg-white px-3 text-xs font-bold text-slate-600">
                <button
                  onClick={() => setActiveTab('MINUTES')}
                  className={`px-4 py-3 border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'MINUTES'
                      ? 'border-[#0A6EBD] text-[#0A6EBD] bg-sky-50/40'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Lập Biên bản họp Online (BM-HĐ-02 / BM-IRB-01)
                </button>
                <button
                  onClick={() => setActiveTab('SCORING')}
                  className={`px-4 py-3 border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'SCORING'
                      ? 'border-[#0A6EBD] text-[#0A6EBD] bg-sky-50/40'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" /> Phiếu chấm điểm điện tử (BM-HĐ-01 / BM-NT-01)
                </button>
                <button
                  onClick={() => setActiveTab('HANDOVER')}
                  className={`px-4 py-3 border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'HANDOVER'
                      ? 'border-[#0A6EBD] text-[#0A6EBD] bg-sky-50/40'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" /> Bàn giao ứng dụng (BM-CG-01)
                </button>
              </div>

              {/* Tab 1: LẬP BIÊN BẢN HỌP HỘI ĐỒNG ONLINE */}
              {activeTab === 'MINUTES' && (
                <div className="p-5 space-y-4 text-xs">
                  {savedSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Thành công:</strong> Đã lưu và phát hành Biên bản họp Hội đồng vào hồ sơ đề tài!</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-[#0A6EBD]" /> Nội dung Biên bản họp Hội đồng Xét duyệt Đề cương
                      </h3>
                      <p className="text-[11px] text-slate-500">Mẫu BM-HĐ-02 & BM-IRB-01 theo Thông tư 09/2024 & Thông tư 43/2024/TT-BYT</p>
                    </div>
                    <span className="font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                      Số: {minutesCode}
                    </span>
                  </div>

                  {/* 1. Kết luận chung của Hội đồng */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 text-xs">1. Kết luận chung của Hội đồng khoa học:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'APPROVED', label: 'Thông qua (Không cần sửa)', desc: 'Hồ sơ đạt chuẩn xuất sắc', color: 'border-emerald-500 bg-emerald-50/60 text-emerald-900' },
                        { id: 'REVISION', label: 'Thông qua Có sửa đổi bổ sung', desc: 'Chủ nhiệm nộp lại v2.0', color: 'border-amber-500 bg-amber-50/60 text-amber-900' },
                        { id: 'REJECTED', label: 'Không thông qua', desc: 'Dừng đề tài hoặc đổi đề cương', color: 'border-rose-500 bg-rose-50/60 text-rose-900' },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                            councilResult === item.id ? item.color + ' ring-2 ring-[#0A6EBD]' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="councilResultOption"
                              checked={councilResult === item.id}
                              onChange={() => setCouncilResult(item.id as any)}
                              className="text-[#0A6EBD]"
                            />
                            <span className="font-bold text-xs">{item.label}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-1 pl-5">{item.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 2. Nội dung yêu cầu sửa đổi, giải trình */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                      <span>2. Nội dung chi tiết yêu cầu Chủ nhiệm đề tài sửa đổi, giải trình:</span>
                      <span className="text-slate-400 font-normal">Tự động gắn vào Thông báo phản hồi cho Bác sĩ</span>
                    </label>
                    <textarea
                      rows={4}
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-300 focus:border-[#0A6EBD] focus:ring-1 focus:ring-[#0A6EBD] outline-none text-xs leading-relaxed text-slate-800 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>

                  {/* 3. Tóm tắt biểu quyết của Hội đồng */}
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 text-xs">3. Tổng hợp kết quả bỏ phiếu của 05 Ủy viên Hội đồng:</span>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-500 text-[11px] block">Số phiếu Tán thành</span>
                        <strong className="text-emerald-700 text-base font-mono">5 / 5 (100%)</strong>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-500 text-[11px] block">Số phiếu Yêu cầu sửa</span>
                        <strong className="text-amber-700 text-base font-mono">4 / 5</strong>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-500 text-[11px] block">Điểm trung bình</span>
                        <strong className="text-[#0A6EBD] text-base font-mono">88.5 / 100</strong>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleExportDocx}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Xuất File Word (.docx)
                    </button>
                    <button
                      onClick={handleSaveMinutes}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-4 h-4" /> Lưu & Ban Hành Biên Bản Vào Hệ Thống
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: PHIẾU CHẤM ĐIỂM ĐIỆN TỬ */}
              {activeTab === 'SCORING' && (
                <div className="p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Phiếu Chấm Điểm Thẩm Định Đề Cương (BM-HĐ-01)
                      </h3>
                      <p className="text-[11px] text-slate-500">Chấm điểm độc lập theo thang điểm 100 của Bộ Y tế</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#0A6EBD] bg-sky-50 px-2.5 py-1 rounded border border-sky-100">
                      Tổng: {totalScore} / 100 điểm ({totalScore >= 70 ? 'ĐẠT' : 'KHÔNG ĐẠT'})
                    </span>
                  </div>

                  {/* 5 Tiêu chí */}
                  <div className="space-y-2">
                    {[
                      { key: 'novelty', max: 20, title: '1. Tính cấp thiết & Giá trị khoa học của nghiên cứu', desc: 'Không trùng lặp, giải quyết vấn đề điều trị thực tiễn tại bệnh viện.' },
                      { key: 'methodology', max: 30, title: '2. Phương pháp nghiên cứu & Cỡ mẫu điều tra', desc: 'Thiết kế nghiên cứu, tiêu chuẩn chọn/loại trừ, kỹ thuật thu thập mẫu bệnh án.' },
                      { key: 'feasibility', max: 20, title: '3. Tính khả thi & Kế hoạch triển khai', desc: 'Thời gian, nhân lực, trang thiết bị máy móc phòng xét nghiệm sẵn có.' },
                      { key: 'efficacy', max: 20, title: '4. Hiệu quả ứng dụng lâm sàng & Bàn giao', desc: 'Khả năng đưa vào phác đồ điều trị thường quy, nâng cao chất lượng chẩn đoán.' },
                      { key: 'capability', max: 10, title: '5. Dự toán kinh phí & Năng lực nhóm nghiên cứu', desc: 'Dự toán hợp lý theo định mức quy chế tài chính viện.' },
                    ].map((crit) => (
                      <div key={crit.key} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-xs">{crit.title}</p>
                          <p className="text-[11px] text-slate-500">{crit.desc} (Tối đa {crit.max} điểm)</p>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={crit.max}
                          value={(scores as any)[crit.key]}
                          onChange={(e) => setScores({ ...scores, [crit.key]: Number(e.target.value) })}
                          className="w-16 p-1.5 text-center font-mono font-bold text-xs border border-slate-300 rounded bg-white text-[#0A6EBD] focus:border-[#0A6EBD] outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Ý kiến chuyên gia phản biện */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 text-xs">Ý kiến nhận xét chuyên môn của Chuyên gia phản biện:</label>
                    <textarea
                      rows={3}
                      value={expertComments}
                      onChange={(e) => setExpertComments(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:border-[#0A6EBD] outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => alert('Đã ký nộp phiếu đánh giá điện tử thành công!')}
                      className="px-4 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-4 h-4" /> Ký Nộp Phiếu Chấm Điểm Điện Tử
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: BIÊN BẢN BÀN GIAO & ỨNG DỤNG LÂM SÀNG (BM-CG-01) */}
              {activeTab === 'HANDOVER' && (
                <div className="p-5 space-y-4 text-xs">
                  <div className="pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900">
                      Biên bản Bàn giao & Ứng dụng Kết quả Nghiên cứu vào Lâm sàng (BM-CG-01)
                    </h3>
                    <p className="text-[11px] text-slate-500">Chuyển giao phác đồ, quy trình kỹ thuật mới cho các Khoa/Phòng áp dụng điều trị</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-800">Khoa / Phòng tiếp nhận chuyển giao kỹ thuật:</label>
                      <input
                        type="text"
                        value={targetDepartment}
                        onChange={(e) => setTargetDepartment(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-800">Sản phẩm / Quy trình kỹ thuật chuyển giao:</label>
                      <textarea
                        rows={3}
                        value={handoverContent}
                        onChange={(e) => setHandoverContent(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-800"
                      />
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        Sản phẩm nghiên cứu khoa học sau khi nghiệm thu sẽ được Ban Giám đốc ban hành thành Quy trình kỹ thuật nội bộ của Bệnh viện Đa khoa Trung tâm.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => alert('Đã phát hành Biên bản bàn giao kỹ thuật lâm sàng!')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-4 h-4" /> Ký Phát Hành Biên Bản Bàn Giao (BM-CG-01)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
