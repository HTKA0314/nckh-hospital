'use client';

import React, { useState, useMemo } from 'react';
import { ResearchProject, TransactionType, BudgetCategory, TransactionStatus, FinancialTransaction } from '@/lib/types';
import { formatVND } from '@/lib/utils';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { X, DollarSign, Upload, FileText } from 'lucide-react';

interface Props {
  project: ResearchProject;
  type: TransactionType;
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

export function CreateTransactionModal({ project, type, onClose, onSuccess }: Props) {
  const { currentUser } = useAuth();
  const { success, warning } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const financial = project.financial;

  // Calculate budget stats for the selected category
  const categoryStats = useMemo(() => {
    if (!selectedCategory || !financial) return null;

    // 1. Total Approved for this category
    const approved = financial.budgetDetails
      .filter(i => i.category === selectedCategory)
      .reduce((sum, i) => sum + (i.approvedAmount || i.totalAmount), 0);

    // 2. Total Advanced for this category (PAID only)
    const advanced = financial.transactions
      .filter(t => t.category === selectedCategory && t.type === TransactionType.ADVANCE && t.status === TransactionStatus.PAID)
      .reduce((sum, t) => sum + t.amount, 0);

    // 3. Total Settled for this category (PAID only)
    const settled = financial.transactions
      .filter(t => t.category === selectedCategory && t.type === TransactionType.SETTLEMENT && t.status === TransactionStatus.PAID)
      .reduce((sum, t) => sum + t.amount, 0);

    // Remaining logic depends on transaction type
    let available = 0;
    if (type === TransactionType.ADVANCE) {
      available = approved - advanced;
    } else if (type === TransactionType.SETTLEMENT) {
      available = advanced - settled; // Usually you can only settle what you advanced
    }

    return { approved, advanced, settled, available };
  }, [selectedCategory, financial, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !financial) return;

    if (!selectedCategory) {
      warning('Vui lòng chọn danh mục dự toán.');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      warning('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    if (categoryStats && numAmount > categoryStats.available) {
      warning(`Số tiền vượt quá hạn mức khả dụng (${formatVND(categoryStats.available)}).`);
      return;
    }

    setIsSubmitting(true);

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      projectId: project.id,
      type: type,
      category: selectedCategory as BudgetCategory,
      status: TransactionStatus.PENDING_SCIENCE,
      amount: numAmount,
      requestedBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachmentUrls: [], // Mặc định rỗng, thực tế sẽ upload file
      rejectionReason: note // Dùng tạm note cho reason hoặc mở rộng schema sau, ở đây chỉ ghi log
    };

    const updatedTransactions = [...(financial.transactions || []), newTx];

    repo.updateProject(project.id, {
      financial: {
        ...financial,
        transactions: updatedTransactions
      }
    });

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: `CREATE_${type}`,
      entityType: 'FINANCE',
      entityId: newTx.id,
      notes: `Lập Phiếu ${type === TransactionType.ADVANCE ? 'Tạm ứng' : 'Quyết toán'} ${formatVND(numAmount)} cho hạng mục ${CATEGORY_LABELS[selectedCategory as BudgetCategory]}. Lời nhắn: ${note}`
    });

    success(`Đã tạo phiếu ${type === TransactionType.ADVANCE ? 'Tạm ứng' : 'Quyết toán'} thành công.`);
    onSuccess();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 print:bg-white print:p-0">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 print:shadow-none print:border-none print:w-full print:max-w-none">
        <div className="flex justify-between items-start border-b pb-4 mb-4 print:hidden">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#0A6EBD]" />
              {type === TransactionType.ADVANCE ? 'Lập Phiếu Đề Xuất Tạm Ứng' : 'Lập Phiếu Quyết Toán'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Đề tài: {project.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Header (Only visible when printing) */}
        <div className="hidden print:block text-center mb-8">
          <h2 className="text-xl font-bold uppercase">BỘ Y TẾ / BỆNH VIỆN...</h2>
          <h1 className="text-2xl font-bold mt-4 uppercase">
            {type === TransactionType.ADVANCE ? 'PHIẾU ĐỀ XUẤT TẠM ỨNG KINH PHÍ' : 'PHIẾU ĐỀ XUẤT QUYẾT TOÁN KINH PHÍ'}
          </h1>
          <p className="mt-2 text-sm">Đề tài: {project.title}</p>
          <p className="text-sm">Mã đề tài: {project.projectCode || project.proposalCode}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1.5">Hạng mục Dự toán *</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as BudgetCategory)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#0A6EBD] print:border-none print:appearance-none print:p-0 print:font-bold"
              required
            >
              <option value="" disabled>-- Chọn danh mục cần {type === TransactionType.ADVANCE ? 'tạm ứng' : 'quyết toán'} --</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {categoryStats && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs print:hidden">
              <div>
                <p className="text-slate-500 mb-0.5">Tổng ngân sách duyệt</p>
                <p className="font-mono font-bold text-slate-700">{formatVND(categoryStats.approved)}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-0.5">Số tiền khả dụng</p>
                <p className="font-mono font-bold text-[#0A6EBD] text-sm">{formatVND(categoryStats.available)}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1.5">Số tiền đề xuất (VND) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              max={categoryStats?.available || undefined}
              className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 outline-none focus:border-[#0A6EBD] print:border-none print:p-0 print:text-lg"
              placeholder="VD: 15000000"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1.5">Nội dung giải trình / Lý do *</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#0A6EBD] min-h-[80px] print:border-none print:p-0"
              placeholder="Ghi rõ mục đích sử dụng số tiền này..."
              required
            />
          </div>

          <div className="print:hidden">
            <label className="block font-bold text-slate-700 text-xs mb-1.5">Tệp đính kèm (Bảng kê, Báo giá...)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Kéo thả file hoặc click để tải lên</p>
            </div>
          </div>

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
              <FileText className="w-4 h-4" /> In Phiếu cứng
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold rounded-lg shadow-2xs cursor-pointer transition disabled:opacity-50 text-sm"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi Phiếu'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
