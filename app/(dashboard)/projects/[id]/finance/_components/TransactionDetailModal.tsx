'use client';

import React, { useState } from 'react';
import { FinancialTransaction, TransactionStatus, BudgetCategory, TransactionType } from '@/lib/types';
import { formatVND, formatDate } from '@/lib/utils';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { X, CheckCircle2, XCircle, FileText, Printer, ChevronRight, DollarSign } from 'lucide-react';

interface Props {
  transaction: FinancialTransaction;
  projectTitle: string;
  projectCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  REMUNERATION: 'Thù lao chất xám',
  LAB_TESTING: 'Chi phí xét nghiệm / Cận lâm sàng',
  CONSUMABLES: 'Vật tư tiêu hao, hóa chất',
  CONFERENCE_TRAVEL: 'Hội thảo, công tác phí',
  OTHER_SERVICES: 'Chi phí dịch vụ khác'
};

const STATUS_LABELS: Record<string, { text: string; bg: string; textCol: string; border: string }> = {
  [TransactionStatus.PENDING_SCIENCE]: { text: 'Chờ P.NCKH xác nhận', bg: 'bg-amber-50', textCol: 'text-amber-700', border: 'border-amber-200' },
  [TransactionStatus.PENDING_ACCOUNTING]: { text: 'Chờ Kế toán thẩm định', bg: 'bg-orange-50', textCol: 'text-orange-700', border: 'border-orange-200' },
  [TransactionStatus.PENDING_DIRECTOR]: { text: 'Chờ Giám đốc duyệt', bg: 'bg-fuchsia-50', textCol: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  [TransactionStatus.APPROVED]: { text: 'Đã duyệt chứng từ', bg: 'bg-sky-50', textCol: 'text-sky-700', border: 'border-sky-200' },
  [TransactionStatus.PAID]: { text: 'Đã chi tiền / Nhập sổ', bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200' },
  [TransactionStatus.REJECTED]: { text: 'Bị từ chối', bg: 'bg-rose-50', textCol: 'text-rose-700', border: 'border-rose-200' }
};

export function TransactionDetailModal({ transaction, projectTitle, projectCode, onClose, onSuccess }: Props) {
  const { currentUser } = useAuth();
  const { success, warning } = useToast();
  
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RBAC permissions
  const isResearchOffice = currentUser?.role === 'RESEARCH_OFFICE' || currentUser?.role === 'ADMIN';
  const isAccountant = currentUser?.role === 'FINANCE_OFFICER' || currentUser?.role === 'ADMIN';
  const isDirector = currentUser?.role === 'DIRECTOR' || currentUser?.role === 'ADMIN';

  // Can perform actions?
  const canScienceApprove = isResearchOffice && transaction.status === TransactionStatus.PENDING_SCIENCE;
  const canAccountingApprove = isAccountant && (transaction.status === TransactionStatus.PENDING_ACCOUNTING || transaction.status === TransactionStatus.APPROVED);
  const canDirectorApprove = isDirector && transaction.status === TransactionStatus.PENDING_DIRECTOR;

  const handleUpdateStatus = (newStatus: TransactionStatus, actionName: string) => {
    if (!currentUser) return;
    
    if (newStatus === TransactionStatus.REJECTED && !note.trim()) {
      warning('Vui lòng nhập lý do từ chối vào ô Ghi chú / Ý kiến.');
      return;
    }

    setIsSubmitting(true);

    const project = repo.getProjectById(transaction.projectId);
    if (!project || !project.financial) return;

    const updatedTransactions = project.financial.transactions.map(t => 
      t.id === transaction.id ? { 
        ...t, 
        status: newStatus, 
        approvedBy: newStatus === TransactionStatus.PAID ? currentUser.id : t.approvedBy,
        updatedAt: new Date().toISOString()
      } : t
    );

    repo.updateProject(project.id, {
      financial: {
        ...project.financial,
        transactions: updatedTransactions
      }
    });

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: `TRANSACTION_${newStatus}`,
      entityType: 'FINANCE',
      entityId: transaction.id,
      notes: `${actionName}. Ghi chú: ${note || 'Không có'}`
    });

    success(`${actionName} thành công.`);
    onSuccess();
  };

  const handlePrint = () => {
    window.print();
  };

  const statusConfig = STATUS_LABELS[transaction.status];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 print:bg-white print:p-0">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Header - Hidden on Print */}
        <div className="flex justify-between items-start border-b pb-4 mb-4 print:hidden">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${statusConfig?.bg} ${statusConfig?.textCol} ${statusConfig?.border}`}>
                {statusConfig?.text}
              </span>
              <span className="text-slate-400 text-xs">Mã phiếu: {transaction.id.split('-')[1]}</span>
            </div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0A6EBD]" />
              Chi tiết Phiếu {transaction.type === TransactionType.ADVANCE ? 'Tạm ứng' : 'Quyết toán'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Layout */}
        <div className="hidden print:block text-center mb-8">
          <h2 className="text-xl font-bold uppercase">BỘ Y TẾ / BỆNH VIỆN...</h2>
          <h1 className="text-2xl font-bold mt-4 uppercase">
            {transaction.type === TransactionType.ADVANCE ? 'PHIẾU ĐỀ XUẤT TẠM ỨNG KINH PHÍ' : 'PHIẾU ĐỀ XUẤT QUYẾT TOÁN KINH PHÍ'}
          </h1>
          <p className="mt-2 text-sm italic">Ngày lập: {formatDate(transaction.createdAt as string)}</p>
        </div>

        <div className="space-y-5 text-sm text-slate-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-xs mb-1">Đề tài</p>
              <p className="font-bold">{projectTitle}</p>
              <p className="text-xs text-slate-500 mt-0.5">Mã: {projectCode}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Hạng mục chi phí</p>
              <p className="font-bold">{transaction.category ? CATEGORY_LABELS[transaction.category] : 'Chưa phân loại'}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between print:bg-transparent print:border-y print:border-x-0 print:rounded-none">
            <div>
              <p className="text-slate-500 text-xs mb-1 uppercase font-bold">Số tiền đề xuất</p>
              <p className="text-2xl font-mono font-bold text-[#0A6EBD]">{formatVND(transaction.amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs mb-1">Ngày cập nhật cuối</p>
              <p className="font-mono">{formatDate(transaction.updatedAt as string)}</p>
            </div>
          </div>

          <div>
            <p className="text-slate-500 text-xs mb-1">Giải trình / Lý do đề xuất</p>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 italic print:bg-transparent print:border-none print:p-0">
              {transaction.rejectionReason || 'Không có giải trình cụ thể.'}
            </p>
          </div>

          {/* Workflow Progress UI - Hidden on Print */}
          <div className="print:hidden pt-4 border-t border-slate-100">
            <p className="text-slate-500 text-xs font-bold uppercase mb-3">Tiến trình phê duyệt</p>
            <div className="flex items-center text-xs justify-between">
              <div className="text-center w-1/4">
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold mb-1 border-2 ${transaction.status !== TransactionStatus.REJECTED ? 'bg-[#0A6EBD] text-white border-[#0A6EBD]' : 'bg-slate-200 text-slate-500 border-slate-300'}`}>1</div>
                <p className="font-bold text-slate-800">Tạo phiếu</p>
              </div>
              <ChevronRight className="text-slate-300 w-5 h-5 flex-shrink-0" />
              <div className="text-center w-1/4">
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold mb-1 border-2 ${transaction.status !== TransactionStatus.PENDING_SCIENCE && transaction.status !== TransactionStatus.REJECTED ? 'bg-[#0A6EBD] text-white border-[#0A6EBD]' : 'bg-white text-slate-400 border-slate-300'}`}>2</div>
                <p className="font-bold text-slate-800">P. NCKH</p>
              </div>
              <ChevronRight className="text-slate-300 w-5 h-5 flex-shrink-0" />
              <div className="text-center w-1/4">
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold mb-1 border-2 ${transaction.status === TransactionStatus.PENDING_DIRECTOR || transaction.status === TransactionStatus.APPROVED || transaction.status === TransactionStatus.PAID ? 'bg-[#0A6EBD] text-white border-[#0A6EBD]' : 'bg-white text-slate-400 border-slate-300'}`}>3</div>
                <p className="font-bold text-slate-800">TC-Kế toán</p>
              </div>
              <ChevronRight className="text-slate-300 w-5 h-5 flex-shrink-0" />
              <div className="text-center w-1/4">
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold mb-1 border-2 ${transaction.status === TransactionStatus.APPROVED || transaction.status === TransactionStatus.PAID ? 'bg-[#0A6EBD] text-white border-[#0A6EBD]' : 'bg-white text-slate-400 border-slate-300'}`}>4</div>
                <p className="font-bold text-slate-800">Giám đốc</p>
              </div>
            </div>
          </div>

          {/* Action Note Input */}
          {(canScienceApprove || canAccountingApprove || canDirectorApprove) && (
            <div className="print:hidden">
              <label className="block font-bold text-slate-700 text-xs mb-1.5">Ghi chú / Ý kiến phê duyệt</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#0A6EBD] min-h-[60px]"
                placeholder="Nhập ý kiến của bạn..."
              />
            </div>
          )}

          {/* Print Signatures (Only visible when printing) */}
          <div className="hidden print:flex justify-between mt-16 pt-8">
            <div className="text-center w-1/4">
              <p className="font-bold">Chủ nhiệm đề tài</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
            </div>
            <div className="text-center w-1/4">
              <p className="font-bold">Phòng Quản lý NCKH</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
            </div>
            <div className="text-center w-1/4">
              <p className="font-bold">Phòng Tài chính Kế toán</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
            </div>
            <div className="text-center w-1/4">
              <p className="font-bold">Giám đốc Bệnh viện</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer text-sm"
            >
              <Printer className="w-4 h-4" /> In Phiếu cứng
            </button>
            <div className="flex gap-2">
              {/* REJECT BUTTON */}
              {(canScienceApprove || canAccountingApprove || canDirectorApprove) && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(TransactionStatus.REJECTED, 'Từ chối phiếu')}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold rounded-lg cursor-pointer transition disabled:opacity-50 text-sm flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Từ chối
                </button>
              )}

              {/* SCIENCE APPROVE */}
              {canScienceApprove && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(TransactionStatus.PENDING_ACCOUNTING, 'Xác nhận tiến độ NCKH')}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold rounded-lg shadow-2xs cursor-pointer transition disabled:opacity-50 text-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Chuyển Kế toán
                </button>
              )}

              {/* ACCOUNTING APPROVE */}
              {isAccountant && transaction.status === TransactionStatus.PENDING_ACCOUNTING && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(TransactionStatus.PENDING_DIRECTOR, 'Thẩm định hồ sơ kế toán')}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer transition disabled:opacity-50 text-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Thẩm định & Trình GĐ
                </button>
              )}

              {/* DIRECTOR APPROVE */}
              {canDirectorApprove && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(TransactionStatus.APPROVED, 'Ký duyệt chứng từ')}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer transition disabled:opacity-50 text-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Giám đốc Phê duyệt
                </button>
              )}

              {/* CASHIER PAY (Also Accountant role usually handles cash disbursements) */}
              {isAccountant && transaction.status === TransactionStatus.APPROVED && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(TransactionStatus.PAID, 'Chi tiền / Chốt sổ')}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer transition disabled:opacity-50 text-sm flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" /> Thực Chi / Chốt Phiếu
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
