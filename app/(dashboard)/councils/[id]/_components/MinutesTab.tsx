import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Signature,
  PenLine,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { repo } from '@/lib/repository';
import type { Council, CouncilMember, EvaluationResult, MeetingMinutes } from '@/lib/types';
import { conclusionLabel, formatDateVi, minuteStatusLabel } from '../_utils/format';

interface MinutesTabProps {
  council: Council;
  meetingMinutes?: MeetingMinutes;
  allResults: EvaluationResult[];
  minSignedRequired: number;
  evaluators: CouncilMember[];
  projectSignedCounts: Record<string, number>;
  allProjectsMeetMinSigned: boolean;
  canOpenMinutesEditor: boolean;
  canSignMinutesNow: boolean;
  canSignAsSecretary: boolean;
  canSignAsChair: boolean;
  canConfirmCouncilMinutes: boolean;
  canEditMinutes: boolean;
  secretary?: CouncilMember;
  chair?: CouncilMember;
  onOpenMinutesEditor: () => void;
  onSignMinutes: () => void;
  onChairRequestRevision: (feedback: string) => void;
  onChairConfirmMinutes: (feedback: string) => void;
  onExportWordMinutes: () => void;
}

export function MinutesTab({
  council,
  meetingMinutes,
  allResults,
  minSignedRequired,
  evaluators,
  projectSignedCounts,
  allProjectsMeetMinSigned,
  canOpenMinutesEditor,
  canSignMinutesNow,
  canSignAsSecretary,
  canSignAsChair,
  canConfirmCouncilMinutes,
  canEditMinutes,
  secretary,
  chair,
  onOpenMinutesEditor,
  onSignMinutes,
  onChairRequestRevision,
  onChairConfirmMinutes,
  onExportWordMinutes,
}: MinutesTabProps) {
  const [localChairFeedback, setLocalChairFeedback] = useState('');

  const handleRequestRevision = () => {
    onChairRequestRevision(localChairFeedback);
    setLocalChairFeedback('');
  };

  const handleConfirm = () => {
    onChairConfirmMinutes(localChairFeedback);
    setLocalChairFeedback('');
  };

  return (
    <div className="space-y-4">
      {/* Banner tiến độ phiếu ký — điều kiện tiên quyết để lập biên bản */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">Điều kiện lập biên bản</span>
          <span className={`font-bold ${allProjectsMeetMinSigned ? 'text-emerald-700' : 'text-slate-500'}`}>
            Yêu cầu tối thiểu: {minSignedRequired} phiếu ký / đề tài
          </span>
        </div>
        <div className="mt-2 grid gap-1.5">
          {council.projectIds.map((projectId) => {
            const project = repo.getProjectById(projectId);
            const signed = projectSignedCounts[projectId] ?? 0;
            const met = signed >= minSignedRequired;
            return (
              <div key={projectId} className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                    met ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                <span className="text-slate-600 truncate">
                  {project?.projectCode || project?.proposalCode} — {project?.title}
                </span>
                <span className={`ml-auto font-mono font-bold flex-shrink-0 ${met ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {signed}/{evaluators.length} phiếu đã ký
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner phản hồi của Chủ tịch khi biên bản bị trả lại */}
      {meetingMinutes?.chairFeedback && meetingMinutes.status === 'DRAFT' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs">
          <p className="font-bold text-amber-800 mb-1">Ý kiến chỉ đạo của Chủ tịch (biên bản đã được trả về để chỉnh sửa):</p>
          <p className="text-amber-900 whitespace-pre-wrap">{meetingMinutes.chairFeedback}</p>
        </div>
      )}

      {/* Toolbar điều hướng biên bản */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B2A63] text-white px-4 py-3 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-white" />
          <div>
            <h2 className="text-xs font-bold text-white">Biên bản họp Hội đồng</h2>
            <p className="text-[11px] text-slate-300">Mẫu BM-HĐ-02 (Thông tư 09/2024/TT-BYT)</p>
          </div>
          {/* Badge trạng thái biên bản */}
          {meetingMinutes && (
            <span
              className={`ml-2 rounded border px-2 py-0.5 text-[11px] font-bold ${
                meetingMinutes.status === 'DRAFT'
                  ? 'border-slate-300 bg-slate-100 text-slate-600'
                  : meetingMinutes.status === 'PENDING_CHAIR_CONFIRMATION'
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : meetingMinutes.status === 'CONFIRMED'
                  ? 'border-sky-300 bg-sky-50 text-sky-800'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800'
              }`}
            >
              {minuteStatusLabel(meetingMinutes.status)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {meetingMinutes && ['CONFIRMED', 'SIGNED'].includes(meetingMinutes.status) && (
            <button
              type="button"
              onClick={onExportWordMinutes}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Xuất Word (.doc)
            </button>
          )}

          {meetingMinutes && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" /> In biên bản
            </button>
          )}

          {/* Nút ký biên bản — hiện sau khi Chủ tịch đã xác nhận */}
          {canSignMinutesNow && (
            <button
              type="button"
              onClick={onSignMinutes}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2A63] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#091e4a] shadow-2xs transition cursor-pointer"
            >
              <Signature className="h-3.5 w-3.5" />
              {canSignAsSecretary ? 'Ký (Thư ký)' : 'Ký (Chủ tịch)'}
            </button>
          )}

          {meetingMinutes && canOpenMinutesEditor && (
            <button
              type="button"
              onClick={onOpenMinutesEditor}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            >
              <PenLine className="h-3.5 w-3.5" /> Chỉnh sửa biên bản
            </button>
          )}

          {canEditMinutes && !allProjectsMeetMinSigned && !meetingMinutes && (
            <span className="text-[11px] text-slate-500 font-medium">Chưa đủ phiếu ký để lập biên bản</span>
          )}
        </div>
      </div>

      {/* Khung phê duyệt dành cho Chủ tịch */}
      {meetingMinutes?.status === 'PENDING_CHAIR_CONFIRMATION' && canConfirmCouncilMinutes && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-amber-700" />
            Chủ tịch Hội đồng xem xét & Xác nhận biên bản họp
          </div>
          <textarea
            rows={3}
            value={localChairFeedback}
            onChange={(event) => setLocalChairFeedback(event.target.value)}
            className="w-full resize-none rounded-lg border border-amber-300 bg-white p-2.5 text-xs font-medium outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Ý kiến chỉ đạo hoặc yêu cầu chỉnh sửa của Chủ tịch (nếu có)..."
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleRequestRevision}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3.5 py-1.5 font-bold text-amber-800 hover:bg-amber-100 text-xs shadow-2xs transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Yêu cầu Thư ký sửa
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 font-bold text-white hover:bg-emerald-700 text-xs shadow-2xs transition cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Xác nhận & Phê duyệt Biên bản
            </button>
          </div>
        </div>
      )}

      {/* CỬA SỔ HIỂN THỊ VĂN BẢN TRÌNH BÀY KHỔ A4 PHÁP LÝ */}
      {!meetingMinutes ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-8 text-center space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FileText className="w-5 h-5" />
          </div>
          {canEditMinutes && (
            <div>
              <button
                type="button"
                onClick={onOpenMinutesEditor}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-4 py-2 text-xs font-bold text-white hover:bg-[#085896] shadow-2xs transition cursor-pointer"
              >
                <PenLine className="h-4 w-4" /> Lập biên bản họp ngay
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-100 p-6 border border-slate-200 overflow-x-auto">
          {/* TỜ GIẤY A4 TRẮNG TINH KHÔNG BÓNG ĐỔ KHÔNG MÀU MÈ */}
          <div className="bg-white max-w-[800px] mx-auto p-12 border border-slate-350 text-black text-[14px] leading-relaxed space-y-6" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            {/* Header Quốc hiệu - Tiêu ngữ tiêu chuẩn Word */}
            <div className="flex justify-between items-start">
              <div className="text-center w-[45%]">
                <p className="uppercase text-[12.5px]">BỘ Y TẾ</p>
                <p className="font-bold uppercase text-[12.5px]">BỆNH VIỆN ĐA KHOA TRUNG TÂM</p>
                <p className="text-[11.5px] uppercase font-bold">HỘI ĐỒNG KH&CN CẤP CƠ SỞ</p>
                <p className="text-center text-[12px] leading-none mt-0.5">——————</p>
              </div>
              <div className="text-center w-[50%]">
                <p className="font-bold uppercase text-[12.5px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-[12.5px]">Độc lập - Tự do - Hạnh phúc</p>
                <p className="text-center text-[12px] leading-none mt-0.5">————————————</p>
                <p className="text-[12px] italic mt-1">Số: ....../BB-HĐKH</p>
              </div>
            </div>

            {/* Tiêu đề công văn */}
            <div className="text-center py-4">
              <h1 className="text-[16px] font-bold uppercase leading-normal">
                BIÊN BẢN HỌP HỘI ĐỒNG {council.type === 'ACCEPTANCE' ? 'NGHIỆM THU ĐỀ TÀI' : 'XÉT DUYỆT ĐỀ CƯƠNG'} NCKH CẤP CƠ SỞ
              </h1>
              <p className="font-bold text-[13.5px] mt-1">
                {council.name}
              </p>
              <p className="text-[12px] italic mt-1">
                Theo Quyết định thành lập số: {council.establishmentDecisionNumber || '156/QĐ-BV'} ngày{' '}
                {formatDateVi(council.establishmentDecisionDate || council.meetingDate)} của Giám đốc Bệnh viện
              </p>
            </div>

            {/* I. THỜI GIAN VÀ ĐỊA ĐIỂM */}
            <section className="space-y-1">
              <h2 className="font-bold text-[14px]">
                I. THỜI GIAN VÀ ĐỊA ĐIỂM
              </h2>
              <div className="pl-6 space-y-1">
                <p>- Thời gian: {council.meetingTime || '08:30'} ngày {formatDateVi(council.meetingDate)}</p>
                <p>
                  - Địa điểm: {council.location || 'Phòng họp Hội đồng Khoa học Bệnh viện'}
                </p>
                <p>
                  - Hình thức họp:{' '}
                  {council.meetingFormat === 'ONLINE'
                    ? 'Họp trực tuyến'
                    : council.meetingFormat === 'HYBRID'
                      ? 'Họp trực tiếp kết hợp trực tuyến'
                      : 'Họp trực tiếp'}
                </p>
              </div>
            </section>

            {/* II. THÀNH PHẦN THAM DỰ */}
            <section className="space-y-1">
              <h2 className="font-bold text-[14px]">
                II. THÀNH PHẦN THAM DỰ
              </h2>
              <div className="pl-6 space-y-1">
                <p>- Tổng số thành viên Hội đồng theo Quyết định thành lập: {council.members.length} người.</p>
                <p>
                  - Số thành viên có mặt thực tế: {meetingMinutes.attendance.filter((a) => a.attended).length} người.
                  Vắng mặt: {meetingMinutes.attendance.filter((a) => !a.attended).length} người.
                </p>
                <p>- Danh sách thành viên Hội đồng tham dự gồm:</p>
                <div className="pl-4">
                  <table className="w-full text-left border-collapse border border-black text-[12.5px] my-2">
                    <thead>
                      <tr className="border-b border-black bg-slate-50/50">
                        <th className="border border-black p-1.5 w-12 text-center">STT</th>
                        <th className="border border-black p-1.5">Họ và tên thành viên</th>
                        <th className="border border-black p-1.5">Vai trò trong Hội đồng</th>
                        <th className="border border-black p-1.5 w-28 text-center">Hiện diện</th>
                      </tr>
                    </thead>
                    <tbody>
                      {council.members.map((m, idx) => {
                        const att = meetingMinutes.attendance.find((a) => a.councilMemberId === m.id);
                        return (
                          <tr key={m.id}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5 font-bold">{m.userFullName}</td>
                            <td className="border border-black p-1.5 text-center">{m.roleInCouncil}</td>
                            <td className="border border-black p-1.5 text-center">
                              {att?.attended ? 'Có mặt' : 'Vắng mặt'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* III. NỘI DUNG VÀ DIỄN BIẾN PHIÊN HỌP */}
            <section className="space-y-1">
              <h2 className="font-bold text-[14px]">
                III. DIỄN BIẾN CHÍNH CỦA PHIÊN HỌP
              </h2>
              <div className="pl-6 text-justify whitespace-pre-wrap">
                {meetingMinutes.summaryOpinions ||
                  'Sau khi lắng nghe Thư ký công bố Quyết định thành lập Hội đồng, Chủ nhiệm đề tài đã báo cáo tóm tắt nội dung nghiên cứu. Các thành viên phản biện và Hội đồng đã tiến hành thảo luận, chất vấn chuyên môn và bỏ phiếu đánh giá theo đúng quy định.'}
              </div>
            </section>

            {/* IV. KẾT QUẢ ĐÁNH GIÁ & KẾT LUẬN CỦA HỘI ĐỒNG */}
            <section className="space-y-4">
              <h2 className="font-bold text-[14px]">
                IV. KẾT QUẢ ĐÁNH GIÁ VÀ KẾT LUẬN CỦA HỘI ĐỒNG
              </h2>

              {meetingMinutes.projectResults.map((result, pIdx) => {
                const project = repo.getProjectById(result.projectId);
                return (
                  <div key={result.projectId} className="pl-6 space-y-1.5">
                    <p className="font-bold">
                      {pIdx + 1}. Đề tài: &quot;{project?.title}&quot;
                    </p>
                    <div className="pl-4 space-y-1 text-slate-900">
                      <p>Chủ nhiệm đề tài: {project?.principalInvestigatorName}</p>
                      <p>- Điểm đánh giá trung bình: {result.averageScore === undefined ? '—' : result.averageScore.toFixed(1)} / 100 điểm.</p>
                      <p>- Kết quả biểu quyết chuyên môn: {result.passVoteCount}/{result.totalVoteCount} phiếu đạt.</p>
                      <p>- Hội đồng thống nhất kết luận chuyên môn: <strong className="uppercase">{conclusionLabel(council.type, result.conclusion)}</strong>.</p>
                      <p>- Ý kiến thảo luận và kết luận chính:</p>
                      <p className="pl-4 text-justify italic">{result.summaryOpinion}</p>
                      {result.revisionRequirements && (
                        <>
                          <p className="font-bold">- Các nội dung yêu cầu chỉnh sửa, bổ sung hoàn thiện đề tài:</p>
                          <p className="pl-4 text-slate-800">{result.revisionRequirements}</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* V. CHỮ KÝ XÁC NHẬN VĂN BẢN */}
            <section className="pt-8">
              <div className="grid grid-cols-2 text-center">
                {/* Thư ký */}
                <div className="space-y-1">
                  <p className="font-bold uppercase">THƯ KÝ HỘI ĐỒNG</p>
                  <p className="text-[11.5px] italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex flex-col items-center justify-center text-xs">
                    {meetingMinutes.secretarySignedAt ? (
                      <p className="font-bold italic text-slate-800">(Đã ký)</p>
                    ) : null}
                  </div>
                  <p className="font-bold">{meetingMinutes.secretaryName}</p>
                </div>

                {/* Chủ tịch */}
                <div className="space-y-1">
                  <p className="font-bold uppercase">CHỦ TỊCH HỘI ĐỒNG</p>
                  <p className="text-[11.5px] italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex flex-col items-center justify-center text-xs">
                    {meetingMinutes.chairSignedAt ? (
                      <p className="font-bold italic text-slate-800">(Đã ký)</p>
                    ) : ['CONFIRMED', 'SIGNED'].includes(meetingMinutes.status) ? (
                      <span className="font-serif text-[11.5px] italic text-slate-400">
                        (Chưa ký)
                      </span>
                    ) : (
                      <span className="font-serif text-[11.5px] italic text-slate-400">
                        (Chờ duyệt)
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-[13px]">{meetingMinutes.chairName}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
