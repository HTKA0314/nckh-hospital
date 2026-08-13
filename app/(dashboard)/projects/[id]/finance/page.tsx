'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/repository';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { FinancialSummary, FinanceStatus } from '@/lib/types';
import { formatVND, formatDate } from '@/lib/utils';
import { 
  ArrowLeft, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Briefcase, 
  FileText,
  FileCheck2,
  TrendingUp,
  Receipt
} from 'lucide-react';

export default function ProjectFinancePage({ params }: { params: { id: string } }) {
  const project = repo.getProjectById(params.id);
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();

  const [finance, setFinance] = useState<FinancialSummary | undefined>(() => project?.financialSummary);

  if (!project) {
    return (
      <div className="text-center py-16 bg-white rounded border border-slate-200 max-w-xl mx-auto">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ đề tài</h2>
        <Link href="/projects" className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A6EBD] text-white rounded text-xs font-bold shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục đề tài
        </Link>
      </div>
    );
  }

  const handleUpdateFinanceStatus = (nextStatus: FinanceStatus, logText: string) => {
    confirm({
      title: 'Xác nhận thay đổi trạng thái tài chính',
      message: `Bạn có chắc chắn muốn cập nhật trạng thái tài chính đề tài thành "${nextStatus}"?`,
      confirmLabel: 'Xác nhận',
      onConfirm: () => {
        const currentFS = finance || {
          id: `fin-${Date.now()}`,
          projectId: project.id,
          fundingSource: project.fundingSource,
          estimatedBudget: project.estimatedBudget,
          approvedBudget: project.approvedBudget,
          allocatedBudget: 0,
          disbursedBudget: 0,
          settledBudget: 0,
          refundableBudget: 0,
          status: 'PENDING',
          hasContract: false,
        };

        const updatedFS: FinancialSummary = {
          ...currentFS,
          status: nextStatus,
        };

        repo.updateProject(project.id, { 
          financialSummary: updatedFS,
          financeStatus: nextStatus
        });
        setFinance(updatedFS);

        // Add Audit Log
        repo.addAuditLog({
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          actionCode: `FINANCE_${nextStatus}`,
          entityType: 'FINANCE',
          entityId: currentFS.id,
          notes: logText,
        });

        // If financeStatus transitions to CLOSED, check if project can transition to CLOSED
        if (nextStatus === 'CLOSED' && project.status === 'RECOGNIZED') {
          repo.updateProject(project.id, {
            status: 'CLOSED',
            statusHistory: [
              ...project.statusHistory,
              {
                id: `h-${Date.now()}`,
                projectId: project.id,
                fromStatus: project.status,
                toStatus: 'CLOSED',
                changedBy: currentUser.id,
                changedByName: currentUser.fullName,
                userRole: currentUser.role,
                changedAt: new Date().toLocaleString('vi-VN'),
                action: 'Đóng đề tài (Hoàn tất nghĩa vụ tài chính)',
              }
            ]
          });
        }

        success(`Đã cập nhật trạng thái tài chính thành ${nextStatus} thành công!`);
      }
    });
  };

  const getFinanceStatusBadge = (status?: FinanceStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-slate-100 text-slate-800 border-slate-200 border text-xs px-2.5 py-0.5 rounded-full font-bold">Chờ cấp kinh phí</span>;
      case 'ACTIVE':
        return <span className="bg-blue-50 text-blue-800 border-blue-200 border text-xs px-2.5 py-0.5 rounded-full font-bold">Đang chi tiêu</span>;
      case 'AWAITING_FINALIZATION':
        return <span className="bg-amber-50 text-amber-800 border-amber-200 border text-xs px-2.5 py-0.5 rounded-full font-bold">Đang quyết toán</span>;
      case 'FINALIZED':
        return <span className="bg-emerald-50 text-emerald-800 border-emerald-200 border text-xs px-2.5 py-0.5 rounded-full font-bold">Đã quyết toán</span>;
      case 'CLOSED':
        return <span className="bg-slate-900 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">Đóng tài chính</span>;
      default:
        return <span className="text-slate-400 font-medium">Chưa cấu hình</span>;
    }
  };

  // Mock list of transactions for visual layout excellence
  const transactions = [
    { id: 'tx-01', type: 'Tạm ứng đợt 1', amount: finance?.allocatedBudget || 0, date: project.approvedAt || '25/03/2025', status: 'Đã thực hiện' },
    { id: 'tx-02', type: 'Chi mua sinh phẩm & hóa chất xét nghiệm', amount: (finance?.disbursedBudget || 0) * 0.6, date: '15/05/2025', status: 'Đã thực hiện' },
    { id: 'tx-03', type: 'Chi thù lao nhóm nghiên cứu', amount: (finance?.disbursedBudget || 0) * 0.4, date: '28/08/2025', status: 'Đã thực hiện' },
  ];

  const txColumns: ColumnDef<any>[] = [
    {
      key: 'type',
      header: 'Nội dung khoản mục',
      render: (row) => <span className="font-bold text-slate-900">{row.type}</span>,
    },
    {
      key: 'date',
      header: 'Ngày thực hiện',
      render: (row) => <span className="font-mono text-slate-500">{row.date}</span>,
    },
    {
      key: 'amount',
      header: 'Số tiền',
      render: (row) => <span className="font-mono font-bold text-slate-800">{formatVND(row.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded border border-emerald-200">{row.status}</span>,
    },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        title="Quản lý Tài chính & Quyết toán"
        description={`Đề tài: ${project.title}`}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Chi tiết
            </Link>
            {currentUser.role === 'FINANCE_OFFICER' && finance?.status === 'PENDING' && (
              <button
                onClick={() => handleUpdateFinanceStatus(
                  'ACTIVE', 
                  'Cấp kinh phí tạm ứng đợt 1 và kích hoạt trạng thái chi tiêu'
                )}
                className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
              >
                <Unlock className="w-4 h-4" /> Cấp kinh phí & Kích hoạt
              </button>
            )}
            {currentUser.role === 'FINANCE_OFFICER' && finance?.status === 'ACTIVE' && (
              <button
                onClick={() => handleUpdateFinanceStatus(
                  'AWAITING_FINALIZATION', 
                  'Bắt đầu quyết toán tài chính đề tài'
                )}
                className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
              >
                <Receipt className="w-4 h-4" /> Bắt đầu quyết toán
              </button>
            )}
            {currentUser.role === 'FINANCE_OFFICER' && finance?.status === 'AWAITING_FINALIZATION' && (
              <button
                onClick={() => handleUpdateFinanceStatus(
                  'FINALIZED', 
                  'Phê duyệt báo cáo quyết toán tài chính đề tài'
                )}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" /> Duyệt quyết toán
              </button>
            )}
            {currentUser.role === 'FINANCE_OFFICER' && finance?.status === 'FINALIZED' && (
              <button
                onClick={() => handleUpdateFinanceStatus(
                  'CLOSED', 
                  'Đóng hoàn toàn các nghĩa vụ tài chính đề tài'
                )}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
              >
                <Lock className="w-4 h-4" /> Đóng tài chính đề tài
              </button>
            )}
          </div>
        }
      />

      {/* KPI Financial stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Tổng Kinh phí duyệt</span>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            {formatVND(project.approvedBudget || project.estimatedBudget)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 block">Nguồn: {project.fundingSource}</span>
        </div>
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Kinh phí đã cấp</span>
          <p className="text-xl font-extrabold text-[#0A6EBD] font-mono mt-1">
            {formatVND(finance?.allocatedBudget || 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 block">
            {finance?.allocatedBudget && project.approvedBudget 
              ? `${((finance.allocatedBudget / project.approvedBudget) * 100).toFixed(0)}% tổng ngân sách`
              : '0% tổng ngân sách'}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Kinh phí đã chi</span>
          <p className="text-xl font-extrabold text-amber-600 font-mono mt-1">
            {formatVND(finance?.disbursedBudget || 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 block">
            {finance?.disbursedBudget && finance?.allocatedBudget 
              ? `${((finance.disbursedBudget / finance.allocatedBudget) * 100).toFixed(0)}% kinh phí đã cấp`
              : '0% kinh phí đã cấp'}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Trạng thái tài chính</span>
          <div className="mt-2.5">
            {getFinanceStatusBadge(finance?.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Detail info */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-slate-500" />
            <span>Thông tin Quyết toán</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-semibold">Đã cấp / Tạm ứng:</span>
              <strong className="text-slate-800 font-mono">{formatVND(finance?.allocatedBudget || 0)}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-semibold">Đã thực chi:</span>
              <strong className="text-slate-800 font-mono">{formatVND(finance?.disbursedBudget || 0)}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-semibold">Đã quyết toán:</span>
              <strong className="text-emerald-700 font-mono">{formatVND(finance?.settledBudget || 0)}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-semibold">Kinh phí thu hồi (nếu dư):</span>
              <strong className="text-rose-700 font-mono">{formatVND(finance?.refundableBudget || 0)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Có Hợp đồng nghiên cứu:</span>
              <strong className="text-slate-800">{finance?.hasContract ? 'Có (Phải thanh lý)' : 'Không (Chỉ ban hành QĐ)'}</strong>
            </div>
          </div>
        </div>

        {/* Right column: Expense ledger list */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>Nhật ký thanh quyết toán / Tạm ứng</span>
          </h3>
          <DataTable
            columns={txColumns}
            data={transactions}
            rowKey={(row) => row.id}
            emptyTitle="Không có giao dịch nào"
            emptyDescription="Đề tài chưa phát sinh bất kỳ khoản giải ngân hoặc chi tiêu nào được duyệt."
          />
        </div>
      </div>
    </div>
  );
}
