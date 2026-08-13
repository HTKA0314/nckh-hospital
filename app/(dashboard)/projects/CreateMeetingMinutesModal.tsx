'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface CreateMeetingMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  piName: string;
}

export function CreateMeetingMinutesModal({ isOpen, onClose, projectTitle, piName }: CreateMeetingMinutesModalProps) {
  const [title, setTitle] = useState(projectTitle);
  const [pi, setPi] = useState(piName);
  const [decisionNum, setDecisionNum] = useState('...../QĐ-BVĐKSS của Giám đốc Bệnh viện đa khoa Sóc Sơn');
  const [agency, setAgency] = useState('Bệnh viện Đa khoa Sóc Sơn');
  const [meetingDate, setMeetingDate] = useState('2025-03-20');
  const [location, setLocation] = useState('Phòng họp giao ban');
  const [totalMembers, setTotalMembers] = useState('5');
  const [presentMembers, setPresentMembers] = useState('5');
  const [absentMembers, setAbsentMembers] = useState('0');
  const [guests, setGuests] = useState('');
  const [totalScore, setTotalScore] = useState('');
  const [avgScore, setAvgScore] = useState('');
  const [validVotes, setValidVotes] = useState('');
  const [invalidVotes, setInvalidVotes] = useState('');

  const { success } = useToast();

  if (!isOpen) return null;

  const handleSave = () => {
    success(`Đã lưu Biên bản họp Hội đồng thành công!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-[15px] font-bold text-[#0A6EBD] uppercase tracking-wide">BIÊN BẢN HỌP HỘI ĐỒNG KHOA HỌC</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="bg-white p-10 border border-slate-300 rounded shadow-sm max-w-3xl mx-auto font-serif text-sm">
            <div className="text-right mb-8 italic">
              Sóc Sơn, ngày 20 tháng 03 năm 2025
            </div>

            <div className="text-center font-bold mb-10 space-y-2">
              <h3 className="text-lg uppercase">BIÊN BẢN HỌP HỘI ĐỒNG ĐÁNH GIÁ</h3>
              <h3 className="text-base uppercase">THUYẾT MINH ĐỀ TÀI KHOA HỌC VÀ CÔNG NGHỆ CẤP CƠ SỞ</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <label className="font-bold whitespace-nowrap pt-1.5 w-40">1. Tên đề tài:</label>
                <textarea 
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="flex-1 w-full border-b border-dotted border-slate-400 bg-transparent focus:outline-none focus:border-[#0A6EBD] resize-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="font-bold whitespace-nowrap w-40">2. Chủ nhiệm đề tài:</label>
                <input 
                  type="text" value={pi} onChange={e => setPi(e.target.value)}
                  className="flex-1 border-b border-dotted border-slate-400 bg-transparent focus:outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="font-bold whitespace-nowrap w-40">3. Quyết định thành lập Hội đồng số:</label>
                <input 
                  type="text" value={decisionNum} onChange={e => setDecisionNum(e.target.value)}
                  className="flex-1 border-b border-dotted border-slate-400 bg-transparent focus:outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="font-bold whitespace-nowrap w-40">4. Cơ quan thực hiện:</label>
                <input 
                  type="text" value={agency} onChange={e => setAgency(e.target.value)}
                  className="flex-1 border-b border-dotted border-slate-400 bg-transparent focus:outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="font-bold whitespace-nowrap w-40">5. Ngày họp:</label>
                <input 
                  type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-[#0A6EBD] font-sans"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="font-bold whitespace-nowrap w-40">6. Địa điểm:</label>
                <input 
                  type="text" value={location} onChange={e => setLocation(e.target.value)}
                  className="flex-1 border-b border-dotted border-slate-400 bg-transparent focus:outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div className="space-y-4">
                <label className="font-bold block">7. Thành viên của hội đồng:</label>
                <div className="flex items-center gap-8 pl-4">
                  <div className="flex items-center gap-2">
                    <span>Tổng số:</span>
                    <input type="text" value={totalMembers} onChange={e => setTotalMembers(e.target.value)} className="w-16 border-b border-dotted border-slate-400 bg-transparent text-center focus:outline-none focus:border-[#0A6EBD]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Có mặt:</span>
                    <input type="text" value={presentMembers} onChange={e => setPresentMembers(e.target.value)} className="w-16 border-b border-dotted border-slate-400 bg-transparent text-center focus:outline-none focus:border-[#0A6EBD]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Vắng mặt:</span>
                    <input type="text" value={absentMembers} onChange={e => setAbsentMembers(e.target.value)} className="w-16 border-b border-dotted border-slate-400 bg-transparent text-center focus:outline-none focus:border-[#0A6EBD]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="font-bold whitespace-nowrap w-40">8. Khách mời dự:</label>
                <input 
                  type="text" value={guests} onChange={e => setGuests(e.target.value)}
                  className="flex-1 border-b border-dotted border-slate-400 bg-transparent focus:outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div className="flex items-center gap-12 mt-6">
                <div className="flex items-center gap-4">
                  <span className="font-bold">Tổng số điểm:</span>
                  <input type="text" value={totalScore} onChange={e => setTotalScore(e.target.value)} className="w-24 border-b border-dotted border-slate-400 bg-transparent text-center focus:outline-none focus:border-[#0A6EBD]" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">Điểm trung bình ban đầu:</span>
                  <input type="text" value={avgScore} onChange={e => setAvgScore(e.target.value)} className="w-24 border-b border-dotted border-slate-400 bg-transparent text-center focus:outline-none focus:border-[#0A6EBD]" />
                </div>
              </div>

              <div className="flex items-center gap-12 mt-6">
                <div className="flex items-center gap-4">
                  <span className="font-bold">9. Tổng số phiếu Đạt:</span>
                  <input type="text" value={validVotes} onChange={e => setValidVotes(e.target.value)} className="w-16 border-b border-dotted border-slate-400 bg-transparent text-center focus:outline-none focus:border-[#0A6EBD]" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">Không hợp lệ:</span>
                  <input type="text" value={invalidVotes} onChange={e => setInvalidVotes(e.target.value)} className="w-16 border-b border-dotted border-slate-400 bg-transparent text-center focus:outline-none focus:border-[#0A6EBD]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-center gap-3">
          <button 
            onClick={handleSave}
            className="px-8 py-2 bg-[#0A6EBD] text-white rounded-lg font-bold text-sm hover:bg-[#085a9c] transition-colors shadow-sm"
          >
            Gửi
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-slate-500 text-white rounded-lg font-bold text-sm hover:bg-slate-600 transition-colors shadow-sm"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
