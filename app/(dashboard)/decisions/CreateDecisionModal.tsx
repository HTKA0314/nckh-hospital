'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, FileText, CheckCircle2 } from 'lucide-react';
import { repo } from '@/lib/repository';
import { ResearchProject as Project, Decision } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';

interface CreateDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedProjectId?: string;
  decisionType: 'ASSIGNMENT' | 'RECOGNITION';
}

export function CreateDecisionModal({ isOpen, onClose, preSelectedProjectId, decisionType }: CreateDecisionModalProps) {
  const { currentUser } = useAuth();
  const { success, warning } = useToast();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [decisionNumber, setDecisionNumber] = useState('');
  const [executionTime, setExecutionTime] = useState('12 tháng');
  
  // Set default decision number format on open
  useEffect(() => {
    if (isOpen) {
      const year = new Date().getFullYear();
      const codeType = decisionType === 'ASSIGNMENT' ? 'ASSIGN' : 'RECOG';
      setDecisionNumber(`QĐ-${year}/NCKH-${codeType}`);
      setStep(1);
      
      if (preSelectedProjectId) {
        setSelectedProjects([preSelectedProjectId]);
      } else {
        setSelectedProjects([]);
      }
    }
  }, [isOpen, decisionType, preSelectedProjectId]);

  if (!isOpen) return null;

  // Lấy danh sách đề tài chờ giao thực hiện hoặc công nhận kết quả (chưa có quyết định cùng loại)
  const waitingProjects = repo.getProjects().filter(p => {
    const hasDec = repo.getDecisions({ type: decisionType }).some(d => d.projectId === p.id);
    if (hasDec) return false;

    if (decisionType === 'ASSIGNMENT') {
      return p.status === 'WAITING_ASSIGNMENT' || (p.status as any) === 'APPROVED';
    } else {
      return p.status === 'ACCEPTED';
    }
  });

  const handleNext = () => {
    if (selectedProjects.length === 0 && step === 1) {
      warning('Vui lòng chọn ít nhất 1 đề tài để làm quyết định.');
      return;
    }
    setStep(2);
  };

  const handleSave = () => {
    if (!decisionNumber.trim()) {
      warning('Vui lòng nhập số quyết định.');
      return;
    }

    selectedProjects.forEach(pid => {
      const project = repo.getProjectById(pid);
      if (!project) return;
      
      const decId = `dec-${Date.now()}-${pid}`;
      repo.createDecision({
        id: decId,
        type: decisionType,
        status: 'DRAFT',
        projectId: pid,
        decisionNumber: decisionNumber,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || '',
        notes: `Lập quyết định tự động cho đề tài "${project.title}"`,
        history: [
          {
            id: `dh-${Date.now()}-${pid}`,
            decisionId: decId,
            action: 'DRAFT_CREATED',
            toStatus: 'DRAFT',
            actorId: currentUser?.id || '',
            actorName: currentUser?.fullName || '',
            actorRole: currentUser?.role || 'ADMIN',
            timestamp: new Date().toISOString(),
            notes: 'Tạo dự thảo quyết định từ giao diện quản trị'
          }
        ]
      });
    });

    success(`Đã lập dự thảo Quyết định ${decisionNumber} thành công!`);
    onClose();
    window.location.reload();
  };

  const toggleProject = (id: string) => {
    setSelectedProjects(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-sm font-bold text-[#0A6EBD] uppercase tracking-wide">
            {decisionType === 'ASSIGNMENT' ? 'LẬP QUYẾT ĐỊNH GIAO THỰC HIỆN ĐỀ TÀI' : 'LẬP QUYẾT ĐỊNH CÔNG NHẬN KẾT QUẢ'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex justify-center border-b border-slate-200 bg-white pt-4">
          <div className="flex items-center gap-12 px-6 pb-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(1)}>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                step >= 1 ? 'bg-[#0A6EBD] text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : 1}
              </div>
              <span className={`text-sm font-bold transition-colors ${step >= 1 ? 'text-[#0A6EBD]' : 'text-slate-500'}`}>Chọn đề tài</span>
            </div>

            <div className="w-16 h-0.5 bg-slate-200">
              <div className={`h-full bg-[#0A6EBD] transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
            </div>

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => step === 2 && setStep(2)}>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                step >= 2 ? 'bg-[#0A6EBD] text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                2
              </div>
              <span className={`text-sm font-bold transition-colors ${step >= 2 ? 'text-[#0A6EBD]' : 'text-slate-500'}`}>Thông tin Quyết định</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          
          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Đề tài đủ điều kiện cần lập quyết định
                  </label>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm bg-white">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="p-3 w-12 text-center">Chọn</th>
                          <th className="p-3">Mã đề tài</th>
                          <th className="p-3">Tên đề tài</th>
                          <th className="p-3">Chủ nhiệm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {waitingProjects.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400">
                              Không có đề tài nào đang chờ lập quyết định.
                            </td>
                          </tr>
                        ) : (
                          waitingProjects.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleProject(p.id)}>
                              <td className="p-3 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={selectedProjects.includes(p.id)}
                                  onChange={() => toggleProject(p.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-slate-300 text-[#0A6EBD] focus:ring-[#0A6EBD]"
                                />
                              </td>
                              <td className="p-3 font-semibold text-[#0A6EBD]">{p.proposalCode}</td>
                              <td className="p-3 font-medium text-slate-700">{p.title}</td>
                              <td className="p-3 text-slate-600">{p.principalInvestigatorName}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-4xl mx-auto flex flex-col items-center">
              
              <div className="flex gap-4 w-full mb-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Số quyết định dự thảo</label>
                  <input type="text" value={decisionNumber} onChange={e => setDecisionNumber(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-[#0A6EBD]" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Thời gian thực hiện đề xuất</label>
                  <input type="text" value={executionTime} onChange={e => setExecutionTime(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#0A6EBD]" />
                </div>
              </div>

              {/* Preview Quyết định */}
              <div className="bg-white p-12 rounded shadow-md border border-slate-300 w-full max-w-[800px] font-serif text-slate-900 mx-auto aspect-[1/1.2] overflow-y-auto text-sm leading-relaxed">
                <div className="flex justify-between mb-8">
                  <div className="text-center font-bold">
                    <p>SỞ Y TẾ HÀ NỘI</p>
                    <p className="underline decoration-solid underline-offset-4">BỆNH VIỆN ĐA KHOA TRUNG ƯƠNG</p>
                    <p className="mt-2 font-normal text-sm">Số: {decisionNumber || 'Chưa cấp số'}</p>
                  </div>
                  <div className="text-center font-bold">
                    <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="underline decoration-solid underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="mt-2 font-normal text-sm italic">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                  </div>
                </div>

                <div className="text-center mt-8 mb-6 font-bold space-y-2">
                  <h1 className="text-lg">DỰ THẢO QUYẾT ĐỊNH</h1>
                  <p>
                    {decisionType === 'ASSIGNMENT' 
                      ? 'Về việc giao thực hiện đề tài nghiên cứu khoa học cấp cơ sở' 
                      : 'Về việc công nhận kết quả nghiên cứu khoa học cấp cơ sở'}
                  </p>
                  <p>GIÁM ĐỐC BỆNH VIỆN ĐA KHOA TRUNG ƯƠNG</p>
                </div>

                <div className="space-y-3 italic text-justify text-[13px]">
                  <p>Căn cứ Quyết định quản lý các nhiệm vụ khoa học và công nghệ của đơn vị y tế;</p>
                  <p>Căn cứ Biên bản họp Hội đồng Đạo đức và Hội đồng Khoa học Kỹ thuật Bệnh viện;</p>
                  <p>Xét đề nghị của Trưởng phòng Quản lý Nghiên cứu khoa học,</p>
                </div>
                
                <div className="text-center mt-6 mb-6 font-bold">
                  <h1 className="text-lg">QUYẾT ĐỊNH:</h1>
                </div>

                <div className="space-y-3 text-justify text-[14px]">
                  <p>
                    <span className="font-bold">Điều 1.</span> Giao thực hiện / công nhận kết quả cho nhóm nghiên cứu ({selectedProjects.length} đề tài) (Có danh sách đề tài chi tiết kèm theo).
                  </p>
                  <p><span className="font-bold">Điều 2.</span> Thời gian thực hiện các đề tài dự kiến là {executionTime} kể từ ngày ký chính thức.</p>
                  <p><span className="font-bold">Điều 3.</span> Chủ nhiệm đề tài, các thành viên tham gia nghiên cứu và các Khoa, Phòng có liên quan chịu trách nhiệm thi hành Quyết định này.</p>
                </div>
                
                <div className="flex justify-end mt-12 mb-12">
                  <div className="text-center font-bold">
                    <p>GIÁM ĐỐC</p>
                    <div className="h-20"></div>
                    <p>GS.TS.BS. Vũ Đình Khoa</p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button 
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="px-5 py-2.5 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {step === 1 ? 'Hủy bỏ' : 'Quay lại'}
          </button>
          
          <button 
            onClick={step === 1 ? handleNext : handleSave}
            className="px-6 py-2.5 rounded-lg font-bold bg-[#0A6EBD] text-white hover:bg-[#085a9c] transition-colors flex items-center gap-2"
          >
            {step === 1 ? 'Tiếp tục' : 'Lưu Quyết định'}
          </button>
        </div>
      </div>
    </div>
  );
}
