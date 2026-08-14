'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, Printer } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import type { MeetingMinutes } from '@/lib/types';

interface CreateMeetingMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  councilId?: string;
  projectId?: string;
  projectTitle: string;
  piName: string;
  decisionNumber?: string;
  defaultMeetingDate?: string;
  defaultLocation?: string;
  onSuccess?: () => void;
}

export function CreateMeetingMinutesModal({
  isOpen,
  onClose,
  councilId,
  projectId,
  projectTitle,
  piName,
  decisionNumber = '...../QĐ-BV của Giám đốc Bệnh viện',
  defaultMeetingDate = new Date().toISOString().slice(0, 10),
  defaultLocation = 'Phòng họp Giao ban số 1',
  onSuccess,
}: CreateMeetingMinutesModalProps) {
  const { currentUser } = useAuth();
  const { success, warning } = useToast();

  const [title, setTitle] = useState(projectTitle);
  const [pi, setPi] = useState(piName);
  const [decisionNum, setDecisionNum] = useState(decisionNumber);
  const [agency, setAgency] = useState('Bệnh viện Đa khoa Trung tâm');
  const [meetingDate, setMeetingDate] = useState(defaultMeetingDate);
  const [location, setLocation] = useState(defaultLocation);
  
  // Thành phần & Điểm số
  const [totalMembers, setTotalMembers] = useState('5');
  const [presentMembers, setPresentMembers] = useState('5');
  const [absentMembers, setAbsentMembers] = useState('0');
  const [guests, setGuests] = useState('Đại diện Phòng Quản lý NCKH');
  const [totalScore, setTotalScore] = useState('425');
  const [avgScore, setAvgScore] = useState('85.0');
  const [validVotes, setValidVotes] = useState('5');
  const [invalidVotes, setInvalidVotes] = useState('0');
  const [conclusion, setConclusion] = useState<'APPROVED' | 'APPROVED_WITH_REVISION' | 'REJECTED' | 'RE_EVALUATE'>('APPROVED_WITH_REVISION');
  const [summaryOpinions, setSummaryOpinions] = useState(
    'Đề tài có tính thời sự và khả năng ứng dụng thực tiễn cao tại bệnh viện. Đề nghị Chủ nhiệm làm rõ thêm tiêu chuẩn chọn mẫu bệnh nhân và bổ sung dự toán chi tiết.'
  );

  useEffect(() => {
    setTitle(projectTitle);
    setPi(piName);
    setDecisionNum(decisionNumber);
    setMeetingDate(defaultMeetingDate);
    setLocation(defaultLocation);
  }, [projectTitle, piName, decisionNumber, defaultMeetingDate, defaultLocation]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      warning('Vui lòng nhập Tên đề tài nghiên cứu.');
      return;
    }

    if (councilId && projectId) {
      const minutesRecord: MeetingMinutes = {
        id: `min-${Date.now()}`,
        councilId,
        projectId,
        meetingDate,
        location,
        secretaryId: currentUser?.id || '',
        secretaryName: currentUser?.fullName || 'Thư ký Hội đồng',
        chairId: 'chair-id',
        chairName: 'Chủ tịch Hội đồng',
        attendeesCount: Number(presentMembers) || 5,
        summaryOpinions,
        conclusion,
        averageScore: Number(avgScore) || 85.0,
        passVoteCount: Number(validVotes) || 5,
        totalVoteCount: Number(totalMembers) || 5,
        status: 'CONFIRMED',
      };

      const council = repo.getCouncilById(councilId);
      if (council) {
        const existingMinutes = council.minutes || [];
        repo.updateCouncil(councilId, {
          minutes: [...existingMinutes, minutesRecord],
          status: 'MINUTES_DRAFTED',
        });
      }

      repo.addAuditLog({
        userId: currentUser?.id || '',
        userFullName: currentUser?.fullName || '',
        userRole: currentUser?.role || 'RESEARCH_OFFICE',
        actionCode: 'CREATE_MEETING_MINUTES',
        entityType: 'COUNCIL',
        entityId: councilId,
        notes: `Lập Biên bản họp Hội đồng cho đề tài: ${title}`,
      });
    }

    success('Đã lưu Biên bản họp Hội đồng thành công!');
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 text-xs">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-[#0B2A63] text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-300" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Biên bản họp Hội đồng Khoa học & Công nghệ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Biên bản chuẩn Hành chính */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
          <div className="bg-white p-8 border border-slate-300 rounded-xl shadow-xs max-w-3xl mx-auto space-y-6 text-slate-800">
            
            {/* Header Quốc hiệu / Tiêu ngữ */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
              <div className="text-center font-bold">
                <p className="uppercase">{agency}</p>
                <p className="text-[11px] uppercase text-[#0A6EBD]">HỘI ĐỒNG KHOA HỌC & CÔNG NGHỆ</p>
              </div>
              <div className="text-center">
                <p className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-[11px]">Độc lập - Tự do - Hạnh phúc</p>
                <p className="italic text-[11px] text-slate-500 mt-1">
                  Hà Nội, ngày {new Date(meetingDate).getDate()} tháng {new Date(meetingDate).getMonth() + 1} năm {new Date(meetingDate).getFullYear()}
                </p>
              </div>
            </div>

            {/* Tiêu đề Biên bản */}
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold uppercase text-slate-900">BIÊN BẢN HỌP HỘI ĐỒNG ĐÁNH GIÁ</h3>
              <h4 className="text-xs font-bold uppercase text-slate-700">THUYẾT MINH ĐỀ TÀI KHOA HỌC VÀ CÔNG NGHỆ CẤP CƠ SỞ</h4>
            </div>

            {/* Các trường thông tin */}
            <div className="space-y-4 font-medium text-slate-850">
              <div className="flex items-start gap-3">
                <label className="font-bold whitespace-nowrap pt-1 w-44">1. Tên đề tài:</label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 w-full border-b border-dotted border-slate-400 bg-transparent font-bold text-slate-900 focus:outline-none focus:border-[#0A6EBD] resize-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="font-bold whitespace-nowrap w-44">2. Chủ nhiệm đề tài:</label>
                <input
                  type="text"
                  value={pi}
                  onChange={(e) => setPi(e.target.value)}
                  className="flex-1 border-b border-dotted border-slate-400 bg-transparent font-bold text-slate-900 focus:outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="font-bold whitespace-nowrap w-44">3. Quyết định thành lập số:</label>
                <input
                  type="text"
                  value={decisionNum}
                  onChange={(e) => setDecisionNum(e.target.value)}
                  className="flex-1 border-b border-dotted border-slate-400 bg-transparent font-mono focus:outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="font-bold whitespace-nowrap w-44">4. Đơn vị chủ trì:</label>
                <input
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  className="flex-1 border-b border-dotted border-slate-400 bg-transparent focus:outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <label className="font-bold whitespace-nowrap w-36">5. Ngày họp:</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1 bg-white font-mono focus:border-[#0A6EBD]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="font-bold whitespace-nowrap">6. Địa điểm:</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 border-b border-dotted border-slate-400 bg-transparent focus:outline-none focus:border-[#0A6EBD]"
                  />
                </div>
              </div>

              {/* Thành viên tham dự */}
              <div className="space-y-2 pt-2">
                <label className="font-bold block">7. Thành viên của Hội đồng:</label>
                <div className="flex items-center gap-6 pl-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span>Tổng số:</span>
                    <input
                      type="text"
                      value={totalMembers}
                      onChange={(e) => setTotalMembers(e.target.value)}
                      className="w-12 border-b border-dotted border-slate-400 font-mono font-bold text-center bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Có mặt:</span>
                    <input
                      type="text"
                      value={presentMembers}
                      onChange={(e) => setPresentMembers(e.target.value)}
                      className="w-12 border-b border-dotted border-slate-400 font-mono font-bold text-center bg-transparent focus:outline-none text-emerald-700"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Vắng mặt:</span>
                    <input
                      type="text"
                      value={absentMembers}
                      onChange={(e) => setAbsentMembers(e.target.value)}
                      className="w-12 border-b border-dotted border-slate-400 font-mono font-bold text-center bg-transparent focus:outline-none text-rose-600"
                    />
                  </div>
                </div>
              </div>

              {/* Khách mời */}
              <div className="flex items-center gap-3">
                <label className="font-bold whitespace-nowrap w-44">8. Khách mời dự:</label>
                <input
                  type="text"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="flex-1 border-b border-dotted border-slate-400 bg-transparent focus:outline-none focus:border-[#0A6EBD]"
                />
              </div>

              {/* Điểm số & Bỏ phiếu */}
              <div className="grid grid-cols-2 gap-4 pt-2 bg-sky-50/50 p-3 rounded-lg border border-sky-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Tổng điểm:</span>
                  <input
                    type="text"
                    value={totalScore}
                    onChange={(e) => setTotalScore(e.target.value)}
                    className="w-16 border-b border-dotted border-slate-400 bg-transparent text-center font-mono font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Điểm trung bình:</span>
                  <input
                    type="text"
                    value={avgScore}
                    onChange={(e) => setAvgScore(e.target.value)}
                    className="w-16 border-b border-dotted border-slate-400 bg-transparent text-center font-mono font-bold text-[#0A6EBD]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Phiếu Đạt:</span>
                  <input
                    type="text"
                    value={validVotes}
                    onChange={(e) => setValidVotes(e.target.value)}
                    className="w-12 border-b border-dotted border-slate-400 bg-transparent text-center font-mono font-bold text-emerald-700"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Không đạt:</span>
                  <input
                    type="text"
                    value={invalidVotes}
                    onChange={(e) => setInvalidVotes(e.target.value)}
                    className="w-12 border-b border-dotted border-slate-400 bg-transparent text-center font-mono font-bold text-rose-600"
                  />
                </div>
              </div>

              {/* Kết luận & Ý kiến */}
              <div className="space-y-2 pt-2">
                <label className="font-bold block">9. Kết luận chính thức của Hội đồng:</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 border rounded-lg bg-white cursor-pointer">
                    <input
                      type="radio"
                      name="conclusion"
                      checked={conclusion === 'APPROVED'}
                      onChange={() => setConclusion('APPROVED')}
                    />
                    <span className="font-bold text-emerald-800">Thông qua</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border rounded-lg bg-white cursor-pointer">
                    <input
                      type="radio"
                      name="conclusion"
                      checked={conclusion === 'APPROVED_WITH_REVISION'}
                      onChange={() => setConclusion('APPROVED_WITH_REVISION')}
                    />
                    <span className="font-bold text-amber-800">Thông qua có sửa đổi</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border rounded-lg bg-white cursor-pointer">
                    <input
                      type="radio"
                      name="conclusion"
                      checked={conclusion === 'REJECTED'}
                      onChange={() => setConclusion('REJECTED')}
                    />
                    <span className="font-bold text-rose-800">Không thông qua</span>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="font-bold block mb-1">10. Tóm tắt ý kiến thảo luận & Yêu cầu bổ sung:</label>
                  <textarea
                    rows={3}
                    value={summaryOpinions}
                    onChange={(e) => setSummaryOpinions(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#0A6EBD] leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white rounded-lg font-bold shadow-2xs transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Lưu & Hoàn tất Biên bản
          </button>
        </div>
      </div>
    </div>
  );
}