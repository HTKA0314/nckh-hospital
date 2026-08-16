'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { BudgetCategory, TransactionType, TransactionStatus, FinancialTransaction } from '@/lib/types';
import { formatVND, formatDate } from '@/lib/utils';
import { ArrowLeft, AlertCircle, Plus, Eye } from 'lucide-react';
import { CreateTransactionModal } from './_components/CreateTransactionModal';
import { TransactionDetailModal } from './_components/TransactionDetailModal';

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  REMUNERATION: 'Thù lao chất xám',
  LAB_TESTING: 'Chi phí xét nghiệm / Cận lâm sàng',
  CONSUMABLES: 'Vật tư tiêu hao, hóa chất',
  CONFERENCE_TRAVEL: 'Hội thảo, công tác phí',
  OTHER_SERVICES: 'Chi phí dịch vụ khác'
};

const STATUS_BADGES: Record<string, { text: string; bg: string; textCol: string; border: string }> = {
  [TransactionStatus.PENDING_SCIENCE]: { text: 'Chờ P.NCKH xác nhận', bg: 'bg-amber-50', textCol: 'text-amber-700', border: 'border-amber-200' },
  [TransactionStatus.PENDING_ACCOUNTING]: { text: 'Chờ Kế toán thẩm định', bg: 'bg-orange-50', textCol: 'text-orange-700', border: 'border-orange-200' },
  [TransactionStatus.PENDING_DIRECTOR]: { text: 'Chờ Giám đốc duyệt', bg: 'bg-fuchsia-50', textCol: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  [TransactionStatus.APPROVED]: { text: 'Đã duyệt chứng từ', bg: 'bg-sky-50', textCol: 'text-sky-700', border: 'border-sky-200' },
  [TransactionStatus.PAID]: { text: 'Đã chi tiền', bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200' },
  [TransactionStatus.REJECTED]: { text: 'Bị từ chối', bg: 'bg-rose-50', textCol: 'text-rose-700', border: 'border-rose-200' }
};

export default function ProjectFinancePage({ params }: { params: { id: string } }) {
  const { currentUser } = useAuth();
  const { success } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  
  const [showCreateModal, setShowCreateModal] = useState<{ isOpen: boolean; type: TransactionType | null }>({ isOpen: false, type: null });
  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, [params.id]);

  const project = useMemo(() => repo.getProjectById(params.id), [params.id, dataVersion]);

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500 text-xs font-medium">Đang tải dữ liệu tài chính đề tài...</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200 max-w-xl mx-auto shadow-2xs my-8 text-xs">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</h2>
        <Link href="/projects" className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A6EBD] text-white rounded-lg text-xs font-bold shadow-2xs hover:bg-[#085896] transition">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục đề tài
        </Link>
      </div>
    );
  }

  const financialData = project.financial || {
    totalApprovedBudget: 0,
    totalAdvanced: 0,
    totalSettled: 0,
    remainingBudget: 0,
    budgetDetails: [],
    transactions: []
  };

  // Tính toán Dashboard Logic
  const totalApprovedBudget = financialData.budgetDetails.reduce(
    (sum, item) => sum + (item.approvedAmount || item.totalAmount), 
    0
  );

  const totalAdvanced = financialData.transactions
    .filter(t => t.type === TransactionType.ADVANCE && t.status === TransactionStatus.PAID)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSettled = financialData.transactions
    .filter(t => t.type === TransactionType.SETTLEMENT && t.status === TransactionStatus.PAID)
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingBudget = totalApprovedBudget - totalAdvanced;

  const disbursementRate = totalApprovedBudget > 0 
    ? Math.round((totalAdvanced / totalApprovedBudget) * 100) 
    : 0;

  // Tính toán số dư khả dụng của từng hạng mục
  const categoryStats = useMemo(() => {
    const stats: Record<string, { approved: number; advanced: number; settled: number; available: number }> = {};
    
    // Khởi tạo
    Object.keys(CATEGORY_LABELS).forEach(cat => {
      stats[cat] = { approved: 0, advanced: 0, settled: 0, available: 0 };
    });

    // Cộng duyệt
    financialData.budgetDetails.forEach(item => {
      if (stats[item.category]) {
        stats[item.category].approved += (item.approvedAmount || item.totalAmount);
      }
    });

    // Cộng giao dịch (chỉ tính PAID)
    financialData.transactions.forEach(t => {
      if (t.status === TransactionStatus.PAID && t.category && stats[t.category]) {
        if (t.type === TransactionType.ADVANCE) stats[t.category].advanced += t.amount;
        if (t.type === TransactionType.SETTLEMENT) stats[t.category].settled += t.amount;
      }
    });

    // Tính khả dụng (remaining for advance)
    Object.keys(stats).forEach(cat => {
      stats[cat].available = stats[cat].approved - stats[cat].advanced;
    });

    return stats;
  }, [financialData]);

  const canCreateRequest = currentUser?.id === project.principalInvestigatorId || currentUser?.role === 'ADMIN';

  // Columns for Transactions
  const txColumns: ColumnDef<FinancialTransaction>[] = [
    {
      key: 'createdAt',
      header: 'Ngày lập',
      render: (row) => <span className="font-mono text-slate-500">{formatDate(row.createdAt as string)}</span>,
    },
    {
      key: 'type',
      header: 'Phân loại',
      render: (row) => (
        <span className="font-bold text-slate-800">
          {row.type === TransactionType.ADVANCE ? 'Phiếu tạm ứng' : row.type === TransactionType.SETTLEMENT ? 'Phiếu quyết toán' : row.type}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Hạng mục chi phí',
      render: (row) => <span className="text-slate-600">{row.category ? CATEGORY_LABELS[row.category] : '---'}</span>,
    },
    {
      key: 'amount',
      header: 'Số tiền',
      render: (row) => <span className="font-mono font-bold text-[#0A6EBD]">{formatVND(row.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => {
        const s = STATUS_BADGES[row.status as string];
        if (!s) return null;
        return (
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${s.bg} ${s.textCol} ${s.border}`}>
            {s.text}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button 
          onClick={() => setSelectedTx(row)}
          className="p-1 text-slate-400 hover:text-[#0A6EBD] transition"
          title="Xem chi tiết / Phê duyệt"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    }
  ];

  return (
    <div className="w-full space-y-6 pb-16 text-slate-800 text-xs">
      <PageHeader
        title="Quản lý Tài chính & Quyết toán"
        description={`Đề tài: ${project.title}`}
        actions={
          <div className="flex flex-wrap items-center gap-2 select-none">
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Chi tiết đề tài
            </Link>
          </div>
        }
      />
      
      {/* SECTION 1: FINANCIAL DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tổng kinh phí phê duyệt</p>
          <p className="text-xl font-mono font-bold text-slate-900 mt-1">{formatVND(totalApprovedBudget)}</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Lũy kế đã tạm ứng</p>
          <p className="text-xl font-mono font-bold text-[#0A6EBD] mt-1">{formatVND(totalAdvanced)}</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5">
            <div className="bg-[#0A6EBD] h-1.5 rounded-full" style={{ width: `${Math.min(disbursementRate, 100)}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Đã giải ngân {disbursementRate}%</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Lũy kế đã quyết toán</p>
          <p className="text-xl font-mono font-bold text-emerald-600 mt-1">{formatVND(totalSettled)}</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Kinh phí còn lại</p>
          <p className="text-xl font-mono font-bold text-amber-600 mt-1">{formatVND(remainingBudget)}</p>
        </div>
      </div>

      {/* SECTION 2 & 3: DETAILS & TRANSACTIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Bảng Chi tiết Dự toán */}
        <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Cơ cấu Dự toán đã phê duyệt</h3>
          </div>
          <div className="p-4 space-y-4 flex-1">
            {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => {
              const stats = categoryStats[catKey];
              if (stats.approved === 0) return null; // Only show non-zero categories
              
              const usedPercentage = stats.approved > 0 ? Math.round((stats.advanced / stats.approved) * 100) : 0;
              
              return (
                <div key={catKey} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-slate-700">{label}</p>
                    <p className="font-mono font-bold text-slate-900">{formatVND(stats.approved)}</p>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px] mb-1.5">
                    <span>Đã ứng: <span className="font-mono text-slate-700 font-bold">{formatVND(stats.advanced)}</span></span>
                    <span>Khả dụng: <span className="font-mono text-[#0A6EBD] font-bold">{formatVND(stats.available)}</span></span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full">
                    <div className={`h-1.5 rounded-full ${usedPercentage >= 100 ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(usedPercentage, 100)}%` }}></div>
                  </div>
                </div>
              );
            })}
            
            {financialData.budgetDetails.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <p>Chưa có chi tiết dự toán.</p>
              </div>
            )}
          </div>
        </div>

        {/* Nhật ký Giao dịch */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Nhật ký Phiếu yêu cầu tài chính</h3>
            
            {canCreateRequest && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowCreateModal({ isOpen: true, type: TransactionType.ADVANCE })}
                  className="bg-white border border-[#0A6EBD] text-[#0A6EBD] hover:bg-blue-50 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạm ứng
                </button>
                <button 
                  onClick={() => setShowCreateModal({ isOpen: true, type: TransactionType.SETTLEMENT })}
                  className="bg-[#0A6EBD] hover:bg-[#085896] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Quyết toán
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-0">
            <DataTable
              columns={txColumns}
              data={financialData.transactions.slice().reverse()}
              rowKey={(row) => row.id}
              emptyTitle="Chưa có giao dịch"
              emptyDescription="Chủ nhiệm đề tài chưa tạo phiếu tạm ứng hoặc quyết toán nào."
            />
          </div>
        </div>
      </div>

      {showCreateModal.isOpen && showCreateModal.type && (
        <CreateTransactionModal
          project={project}
          type={showCreateModal.type}
          onClose={() => setShowCreateModal({ isOpen: false, type: null })}
          onSuccess={() => {
            setShowCreateModal({ isOpen: false, type: null });
            setDataVersion(v => v + 1); // trigger reload
          }}
        />
      )}

      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          projectTitle={project.title}
          projectCode={project.projectCode || project.proposalCode}
          onClose={() => setSelectedTx(null)}
          onSuccess={() => {
            setSelectedTx(null);
            setDataVersion(v => v + 1); // trigger reload
          }}
        />
      )}
    </div>
  );
}