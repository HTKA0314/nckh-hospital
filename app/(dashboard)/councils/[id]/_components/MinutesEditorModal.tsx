import React, { useState } from 'react';
import { Save, Send, X } from 'lucide-react';
import { repo } from '@/lib/repository';
import type {
  Council,
  CouncilConclusion,
  CouncilMember,
  MeetingMinutes,
} from '@/lib/types';
import { conclusionLabel, formatDateVi } from '../_utils/format';

export type ProjectConclusionDraft = {
  conclusion: CouncilConclusion;
  summaryOpinion: string;
  revisionRequirements: string;
};

interface MinutesEditorModalProps {
  council: Council;
  meetingMinutes?: MeetingMinutes;
  projectStats: Record<
    string,
    { signedCount: number; averageScore?: number; passCount: number; passRatio: number }
  >;
  evaluators: CouncilMember[];
  onClose: () => void;
  onSave: (
    summary: string,
    attendance: Record<string, boolean>,
    projectDrafts: Record<string, ProjectConclusionDraft>
  ) => void;
  onSubmit: (
    summary: string,
    attendance: Record<string, boolean>,
    projectDrafts: Record<string, ProjectConclusionDraft>
  ) => void;
}

export function MinutesEditorModal({
  council,
  meetingMinutes,
  projectStats,
  evaluators,
  onClose,
  onSave,
  onSubmit,
}: MinutesEditorModalProps) {
  const [meetingSummary, setMeetingSummary] = useState(
    meetingMinutes?.summaryOpinions ||
      'Sau khi lắng nghe Thư ký công bố Quyết định thành lập Hội đồng, Chủ nhiệm đề tài đã báo cáo tóm tắt nội dung nghiên cứu. Các thành viên phản biện và Hội đồng đã tiến hành thảo luận, chất vấn chuyên môn và bỏ phiếu đánh giá theo đúng quy định.'
  );

  const [attendance, setAttendance] = useState<Record<string, boolean>>(() => {
    const attendanceMap: Record<string, boolean> = {};
    council.members.forEach((member) => {
      attendanceMap[member.id] =
        meetingMinutes?.attendance.find((item) => item.councilMemberId === member.id)?.attended ?? true;
    });
    return attendanceMap;
  });

  const [projectDrafts, setProjectDrafts] = useState<Record<string, ProjectConclusionDraft>>(() => {
    const drafts: Record<string, ProjectConclusionDraft> = {};
    council.projectIds.forEach((projectId) => {
      const existing = meetingMinutes?.projectResults.find((item) => item.projectId === projectId);
      const stats = projectStats[projectId];
      drafts[projectId] = {
        conclusion: existing?.conclusion || 'APPROVED_WITH_REVISION',
        summaryOpinion: existing?.summaryOpinion || 'Đề tài hoàn thành tốt mục tiêu đề ra, phương pháp nghiên cứu tin cậy.',
        revisionRequirements: existing?.revisionRequirements || 'Chuẩn hóa lại định dạng bảng biểu và cập nhật thêm tài liệu tham khảo.',
      };
    });
    return drafts;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100 p-6 shadow-2xl text-xs text-slate-800 flex flex-col">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 bg-white -mx-6 -mt-6 px-6 py-4 rounded-t-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-950">Soạn thảo & Lập biên bản họp Hội đồng</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Nhập liệu trực tiếp trên mẫu văn bản hành chính A4 chuẩn Quy chế.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Khung tài liệu A4 để soạn thảo trực tiếp */}
        <div className="flex-1 my-4 overflow-y-auto bg-slate-200 p-4 rounded-xl border border-slate-300">
          <div 
            className="bg-white max-w-[800px] mx-auto p-12 border border-slate-400 text-black text-[14px] leading-relaxed space-y-6 shadow-md" 
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {/* Quốc hiệu - Tiêu ngữ */}
            <div className="flex justify-between items-start select-none">
              <div className="text-center w-[45%]">
                <p className="uppercase text-[12.5px] tracking-tight">BỘ Y TẾ</p>
                <p className="font-bold uppercase text-[12.5px] tracking-tight">BỆNH VIỆN ĐA KHOA TRUNG TÂM</p>
                <p className="text-[11.5px] uppercase font-bold tracking-tight">HỘI ĐỒNG KH&CN CẤP CƠ SỞ</p>
                <p className="text-center text-[12px] leading-none mt-0.5">——————</p>
              </div>
              <div className="text-center w-[50%]">
                <p className="font-bold uppercase text-[12.5px] tracking-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-[12.5px]">Độc lập - Tự do - Hạnh phúc</p>
                <p className="text-center text-[12px] leading-none mt-0.5">————————————</p>
                <p className="text-[12px] italic mt-1">Số: ....../BB-HĐKH</p>
              </div>
            </div>

            {/* Tiêu đề văn bản */}
            <div className="text-center py-2 select-none">
              <h1 className="text-[16px] font-bold uppercase leading-normal">
                BIÊN BẢN HỌP HỘI ĐỒNG {council.type === 'ACCEPTANCE' ? 'NGHIỆM THU ĐỀ TÀI' : 'XÉT DUYỆT ĐỀ CƯƠNG'} NCKH CẤP CƠ SỞ
              </h1>
              <p className="font-bold text-[13.5px] mt-1">
                {council.name}
              </p>
              <p className="text-[12px] italic mt-1 text-slate-600">
                Theo Quyết định thành lập số: {council.establishmentDecisionNumber || '156/QĐ-BV'} ngày{' '}
                {formatDateVi(council.establishmentDecisionDate || council.meetingDate)} của Giám đốc Bệnh viện
              </p>
            </div>

            {/* I. THỜI GIAN VÀ ĐỊA ĐIỂM */}
            <section className="space-y-1 select-none">
              <h2 className="font-bold text-[14px]">I. THỜI GIAN VÀ ĐỊA ĐIỂM</h2>
              <div className="pl-6 space-y-1 text-slate-800">
                <p>- Thời gian: {council.meetingTime || '08:30'} ngày {formatDateVi(council.meetingDate)}</p>
                <p>- Địa điểm: {council.location || 'Phòng họp Hội đồng Khoa học Bệnh viện'}</p>
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
            <section className="space-y-2">
              <h2 className="font-bold text-[14px] select-none">II. THÀNH PHẦN THAM DỰ</h2>
              <div className="pl-6 space-y-2">
                <p className="select-none">- Danh sách thành viên Hội đồng tham dự và tích hiện diện:</p>
                <div className="pl-0">
                  <table className="w-full text-left border-collapse border border-black text-[12.5px]">
                    <thead>
                      <tr className="border-b border-black bg-slate-50 select-none">
                        <th className="border border-black p-1.5 w-12 text-center">STT</th>
                        <th className="border border-black p-1.5">Họ và tên thành viên</th>
                        <th className="border border-black p-1.5">Vai trò trong Hội đồng</th>
                        <th className="border border-black p-1.5 w-36 text-center">Hiện diện</th>
                      </tr>
                    </thead>
                    <tbody>
                      {council.members.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="border border-black p-1.5 text-center select-none">{idx + 1}</td>
                          <td className="border border-black p-1.5 font-bold">{m.userFullName}</td>
                          <td className="border border-black p-1.5 text-center select-none">{m.roleInCouncil}</td>
                          <td className="border border-black p-1.5 text-center">
                            <select
                              value={attendance[m.id] ? 'true' : 'false'}
                              onChange={(e) =>
                                setAttendance((prev) => ({
                                  ...prev,
                                  [m.id]: e.target.value === 'true',
                                }))
                              }
                              className="rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold bg-white outline-none cursor-pointer"
                            >
                              <option value="true">Có mặt</option>
                              <option value="false">Vắng mặt</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* III. DIỄN BIẾN CHÍNH CỦA PHIÊN HỌP */}
            <section className="space-y-1">
              <h2 className="font-bold text-[14px]">III. DIỄN BIẾN CHÍNH CỦA PHIÊN HỌP *</h2>
              <div className="pl-6">
                <textarea
                  rows={4}
                  value={meetingSummary}
                  onChange={(event) => setMeetingSummary(event.target.value)}
                  className="w-full rounded-md border border-slate-350 p-2.5 text-[13.5px] leading-relaxed focus:border-sky-500 focus:ring-1 focus:ring-sky-200 outline-none"
                  placeholder="Nhập nội dung diễn biến phiên họp tại đây..."
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                />
              </div>
            </section>

            {/* IV. KẾT QUẢ ĐÁNH GIÁ VÀ KẾT LUẬN CỦA HỘI ĐỒNG */}
            <section className="space-y-4">
              <h2 className="font-bold text-[14px] select-none">IV. KẾT QUẢ ĐÁNH GIÁ VÀ KẾT LUẬN CỦA HỘI ĐỒNG</h2>

              {council.projectIds.map((projectId, pIdx) => {
                const project = repo.getProjectById(projectId);
                const draft = projectDrafts[projectId] || {
                  conclusion: 'APPROVED_WITH_REVISION' as CouncilConclusion,
                  summaryOpinion: '',
                  revisionRequirements: '',
                };
                const stats = projectStats[projectId];

                return (
                  <div key={projectId} className="pl-6 space-y-3">
                    <p className="font-bold">
                      {pIdx + 1}. Đề tài: &quot;{project?.title}&quot;
                    </p>
                    <div className="pl-4 space-y-3 text-[13.5px]">
                      <p className="select-none text-slate-600">Chủ nhiệm đề tài: {project?.principalInvestigatorName}</p>
                      
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 select-none">
                        <div>
                          - Điểm đánh giá trung bình: <strong className="text-[#0A6EBD]">{stats?.averageScore?.toFixed(1) || '—'}</strong> / 100 điểm.
                        </div>
                        <div>
                          - Ý kiến biểu quyết chuyên môn: <strong>{stats?.passCount || 0} / {stats?.signedCount || 0}</strong> phiếu đạt.
                        </div>
                      </div>

                      {/* Dropdown Conclusion */}
                      <div className="flex items-center gap-2">
                        <span>- Hội đồng thống nhất kết luận chuyên môn:</span>
                        <select
                          value={draft.conclusion}
                          onChange={(event) =>
                            setProjectDrafts((current) => ({
                              ...current,
                              [projectId]: {
                                ...draft,
                                conclusion: event.target.value as CouncilConclusion,
                              },
                            }))
                          }
                          className="rounded-lg border border-slate-350 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-sky-500"
                        >
                          <option value="APPROVED">{conclusionLabel(council.type, 'APPROVED')}</option>
                          <option value="APPROVED_WITH_REVISION">
                            {conclusionLabel(council.type, 'APPROVED_WITH_REVISION')}
                          </option>
                          <option value="REJECTED">{conclusionLabel(council.type, 'SCREENING_FAILED')}</option>
                          <option value="RE_EVALUATE">{conclusionLabel(council.type, 'RE_EVALUATE')}</option>
                        </select>
                      </div>

                      {/* Textarea Summary Opinion */}
                      <div className="space-y-1">
                        <span className="font-semibold block">- Ý kiến thảo luận và kết luận chính *</span>
                        <textarea
                          rows={2}
                          value={draft.summaryOpinion}
                          onChange={(event) =>
                            setProjectDrafts((current) => ({
                              ...current,
                              [projectId]: { ...draft, summaryOpinion: event.target.value },
                            }))
                          }
                          className="w-full rounded-md border border-slate-350 p-2 focus:border-sky-500 outline-none"
                          style={{ fontFamily: '"Times New Roman", Times, serif' }}
                          placeholder="Ý kiến thảo luận kết luận chính của Hội đồng..."
                        />
                      </div>

                      {/* Textarea Revision Requirements */}
                      <div className="space-y-1">
                        <span className="font-semibold block">- Các nội dung yêu cầu chỉnh sửa, bổ sung hoàn thiện:</span>
                        <textarea
                          rows={2}
                          value={draft.revisionRequirements}
                          onChange={(event) =>
                            setProjectDrafts((current) => ({
                              ...current,
                              [projectId]: { ...draft, revisionRequirements: event.target.value },
                            }))
                          }
                          className="w-full rounded-md border border-slate-350 p-2 focus:border-sky-500 outline-none"
                          style={{ fontFamily: '"Times New Roman", Times, serif' }}
                          placeholder="Nhập các nội dung yêu cầu chỉnh sửa (nếu có)..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* V. CHỮ KÝ XÁC NHẬN VĂN BẢN */}
            <section className="pt-6 border-t border-dashed border-slate-200 select-none">
              <div className="grid grid-cols-2 text-center">
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[12.5px]">THƯ KÝ HỘI ĐỒNG</p>
                  <p className="text-[11.5px] italic text-slate-500">(Ký số khi duyệt chính thức)</p>
                  <div className="h-10"></div>
                </div>
                <div className="space-y-1">
                  <p className="font-bold uppercase text-[12.5px]">CHỦ TỊCH HỘI ĐỒNG</p>
                  <p className="text-[11.5px] italic text-slate-500">(Ký số khi duyệt chính thức)</p>
                  <div className="h-10"></div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 bg-white -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onSave(meetingSummary, attendance, projectDrafts)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A6EBD] bg-white px-4.5 py-2 font-bold text-[#0A6EBD] hover:bg-sky-50 cursor-pointer shadow-2xs transition"
          >
            <Save className="h-4 w-4" /> Lưu dự thảo
          </button>
          <button
            type="button"
            onClick={() => onSubmit(meetingSummary, attendance, projectDrafts)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A6EBD] px-5 py-2 font-bold text-white hover:bg-[#085896] cursor-pointer shadow-2xs transition"
          >
            <Send className="h-4 w-4" /> Trình ký
          </button>
        </div>
      </div>
    </div>
  );
}
