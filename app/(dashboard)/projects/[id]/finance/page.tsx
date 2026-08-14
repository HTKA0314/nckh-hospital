'use client';

import React, { useState, useEffect } from 'react';
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
  Receipt,
  Edit,
  Plus,
  X,
  Printer,
} from 'lucide-react';

export default function ProjectFinancePage({ params }: { params: { id: string } }) {
  const { currentUser } = useAuth();
  const { success, warning, error, confirm } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [finance, setFinance] = useState<FinancialSummary | undefined>(undefined);
  const [showEditModal, setShowEditModal] = useState(false);

  // State Modal chỉnh sửa số liệu tài chính
  const [allocatedInput, setAllocatedInput] = useState(0);
  const [disbursedInput, setDisbursedInput] = useState(0);
  const [settledInput, setSettledInput] = useState(0);
  const [refundableInput, setRefundableInput] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    const p = repo.getProjectById(params.id);
    if (p) {
      const fs = p.financialSummary || {
        id: `fin-${p.id}`,
        projectId: p.id,
        fundingSource: p.fundingSource || 'NGÂN_SÁCH_BỆNH_VIỆN',
        estimatedBudget: p.estimatedBudget || 0,
        approvedBudget: p.approvedBudget || p.estimatedBudget || 0,
        allocatedBudget: 0,
        disbursedBudget: 0,
        settledBudget: 0,
        refundableBudget: 0,
        status: p.financeStatus || 'PENDING',
        hasContract: false,
      };
      setFinance(fs);
      setAllocatedInput(fs.allocatedBudget || 0);
      setDisbursedInput(fs.disbursedBudget || 0);
      setSettledInput(fs.settledBudget || 0);
      setRefundableInput(fs.refundableBudget || 0);
    }
  }, [params.id]);

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500 text-xs font-medium">Đang tải dữ liệu tài chính đề tài...</div>;
  }

  const project = repo.getProjectById(params.id);

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

  const isFinanceOfficer = currentUser?.role === 'FINANCE_OFFICER' || currentUser?.role === 'ADMIN';

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

        repo.addAuditLog({
          userId: currentUser.id,
          userFullName: currentUser.fullName,
          userRole: currentUser.role,
          actionCode: `FINANCE_${nextStatus}`,
          entityType: 'FINANCE',
          entityId: currentFS.id,
          notes: logText,
        });

        // Nếu chuyển sang CLOSED và đề tài đã RECOGNIZED -> Đóng đề tài
        if (nextStatus === 'CLOSED' && project.status === 'RECOGNIZED') {
          repo.updateProject(project.id, {
            status: 'CLOSED',
            statusHistory: [
              ...(project.statusHistory || []),
              {
                id: `h-${Date.now()}`,
                projectId: project.id,
                fromStatus: project.status,
                toStatus: 'CLOSED',
                changedBy: currentUser.id,
                changedByName: currentUser.fullName,
                userRole: currentUser.role,
                changedAt: new Date().toISOString(),
                action: 'Đóng đề tài (Hoàn tất nghĩa vụ tài chính & Quyết toán)',
              }
            ]
          });
        }

        success(`Đã cập nhật trạng thái tài chính thành ${nextStatus} thành công!`);
      }
    });
  };

  const handleSaveFinancialNumbers = () => {
    if (!finance) return;

    const updatedFS: FinancialSummary = {
      ...finance,
      allocatedBudget: Number(allocatedInput) || 0,
      disbursedBudget: Number(disbursedInput) || 0,
      settledBudget: Number(settledInput) || 0,
      refundableBudget: Number(refundableInput) || 0,
    };

    repo.updateProject(project.id, {
      financialSummary: updatedFS,
    });
    setFinance(updatedFS);

    repo.addAuditLog({
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      userRole: currentUser.role,
      actionCode: 'UPDATE_FINANCIAL_FIGURES',
      entityType: 'FINANCE',
      entityId: finance.id,
      notes: `Cập nhật số liệu quyết toán: Cấp ${formatVND(allocatedInput)}, Chi ${formatVND(disbursedInput)}, Quyết toán ${formatVND(settledInput)}`,
    });

    setShowEditModal(false);
    success('Đã cập nhật số liệu kinh phí & quyết toán thành công!');
  };

  const getFinanceStatusBadge = (status?: FinanceStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-slate-100 text-slate-800 border-slate-200 border text-[11px] px-2.5 py-0.5 rounded-full font-bold">Chờ cấp kinh phí</span>;
      case 'ACTIVE':
        return <span className="bg-sky-50 text-[#0A6EBD] border-sky-200 border text-[11px] px-2.5 py-0.5 rounded-full font-bold">Đang chi tiêu</span>;
      case 'AWAITING_FINALIZATION':
        return <span className="bg-amber-50 text-amber-800 border-amber-200 border text-[11px] px-2.5 py-0.5 rounded-full font-bold">Đang quyết toán</span>;
      case 'FINALIZED':
        return <span className="bg-emerald-50 text-emerald-800 border-emerald-200 border text-[11px] px-2.5 py-0.5 rounded-full font-bold">Đã quyết toán</span>;
      case 'CLOSED':
        return <span className="bg-slate-900 text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold">Đóng tài chính</span>;
      default:
        return <span className="text-slate-400 font-medium">Chưa cấu hình</span>;
    }
  };

  const transactions = [
    { id: 'tx-01', type: 'Tạm ứng đợt 1 (Theo Quyết định giao)', amount: finance?.allocatedBudget || 0, date: formatDate(project.approvedAt || project.startDate || '2026-03-25'), status: 'Đã thực hiện' },
    { id: 'tx-02', type: 'Chi mua sinh phẩm & hóa chất xét nghiệm', amount: (finance?.disbursedBudget || 0) * 0.6, date: '15/05/2026', status: 'Đã thực hiện' },
    { id: 'tx-03', type: 'Chi thù lao nhóm nghiên cứu & thu thập mẫu', amount: (finance?.disbursedBudget || 0) * 0.4, date: '28/08/2026', status: 'Đã thực hiện' },
  ];

  const txColumns: ColumnDef<any>[] = [
    {
      key: 'type',
      header: 'Nội dung khoản mục chi tiêu',
      render: (row) => <span className="font-bold text-slate-900">{row.type}</span>,
    },
    {
      key: 'date',
      header: 'Ngày thực hiện',
      render: (row) => <span className="font-mono text-slate-500">{row.date}</span>,
    },
    {
      key: 'amount',
      header: 'Số tiền thực chi',
      render: (row) => <span className="font-mono font-bold text-slate-800">{formatVND(row.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">{row.status}</span>,
    },
  ];

  return (
    <div className="w-full space-y-4 pb-16 text-slate-800 text-xs">
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

            {isFinanceOfficer && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" /> Cập nhật số liệu
              </button>
            )}

            {isFinanceOfficer && finance?.status === 'PENDING' && (
              <button
                onClick={() => handleUpdateFinanceStatus('ACTIVE', 'Cấp kinh phí tạm ứng đợt 1 và kích hoạt trạng thái chi tiêu')}
                className="inline-flex items-center gap-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" /> Cấp kinh phí & Kích hoạt
              </button>
            )}

            {isFinanceOfficer && finance?.status === 'ACTIVE' && (
              <button
                onClick={() => handleUpdateFinanceStatus('AWAITING_FINALIZATION', 'Bắt đầu thủ tục quyết toán tài chính đề tài')}
                className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" /> Bắt đầu quyết toán
              </button>
            )}

            {isFinanceOfficer && finance?.status === 'AWAITING_FINALIZATION' && (
              <button
                onClick={() => handleUpdateFinanceStatus('FINALIZED', 'Phê duyệt báo cáo quyết toán tài chính đề tài')}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt quyết toán
              </button>
            )}

            {isFinanceOfficer && finance?.status === 'FINALIZED' && (
              <button
                onClick={() => handleUpdateFinanceStatus('CLOSED', 'Đóng hoàn toàn các nghĩa vụ tài chính đề tài')}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" /> Đóng tài chính đề tài
              </button>
            )}
          </div>
        }
      />

      {/* KPI Financial stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Tổng Kinh phí duyệt</span>
          <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {formatVND(project.approvedBudget || project.estimatedBudget)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 block">Nguồn: {project.fundingSource}</span>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Kinh phí đã cấp</span>
          <p className="text-lg font-bold text-[#0A6EBD] font-mono mt-0.5">
            {formatVND(finance?.allocatedBudget || 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 block">
            {finance?.allocatedBudget && (project.approvedBudget || project.estimatedBudget)
              ? `${Math.round(((finance.allocatedBudget / (project.approvedBudget || project.estimatedBudget)) * 100))}% tổng ngân sách`
              : '0% tổng ngân sách'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Kinh phí đã thực chi</span>
          <p className="text-lg font-bold text-amber-700 font-mono mt-0.5">
            {formatVND(finance?.disbursedBudget || 0)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 block">
            {finance?.disbursedBudget && finance?.allocatedBudget 
              ? `${Math.round(((finance.disbursedBudget / finance.allocatedBudget) * 100))}% kinh phí đã cấp`
              : '0% kinh phí đã cấp'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Trạng thái tài chính</span>
          <div className="mt-1.5">
            {getFinanceStatusBadge(finance?.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Detail info */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-1.5 select-none">
            <Briefcase className="w-4 h-4 text-[#0A6EBD]" />
            <span>Thông tin Tổng hợp Quyết toán</span>
          </h3>

          <div className="space-y-2.5 text-xs font-medium">
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <span className="text-slate-500">Đã cấp / Tạm ứng:</span>
              <strong className="text-slate-800 font-mono">{formatVND(finance?.allocatedBudget || 0)}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <span className="text-slate-500">Đã thực chi:</span>
              <strong className="text-slate-800 font-mono">{formatVND(finance?.disbursedBudget || 0)}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <span className="text-slate-500">Đã quyết toán:</span>
              <strong className="text-emerald-700 font-mono font-bold">{formatVND(finance?.settledBudget || 0)}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <span className="text-slate-500">Kinh phí thu hồi (nếu dư):</span>
              <strong className="text-rose-700 font-mono font-bold">{formatVND(finance?.refundableBudget || 0)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hợp đồng nghiên cứu:</span>
              <strong className="text-slate-800">{finance?.hasContract ? 'Có (Cần thanh lý)' : 'Không (Theo Quyết định giao)'}</strong>
            </div>
          </div>
        </div>

        {/* Right column: Expense ledger list */}
        <div className="lg:col-span-2 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 select-none">
            <Receipt className="w-4 h-4 text-[#0A6EBD]" />
            <span>Nhật ký thanh quyết toán / Tạm ứng đề tài</span>
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
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

      {/* ── MODAL CẬP NHẬT SỐ LIỆU TÀI CHÍNH ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex justify-between items-center border-b pb-2.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#0A6EBD]" />
                Cập nhật số liệu giải ngân & Quyết toán
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kinh phí đã cấp / Tạm ứng (VND) *</label>
                <input
                  type="number"
                  value={allocatedInput}
                  onChange={(e) => setAllocatedInput(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kinh phí đã thực chi (VND) *</label>
                <input
                  type="number"
                  value={disbursedInput}
                  onChange={(e) => setDisbursedInput(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs outline-none focus:border-[#0A6EBD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kinh phí đã phê duyệt quyết toán (VND)</label>
                <input
                  type="number"
                  value={settledInput}
                  onChange={(e) => setSettledInput(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kinh phí thu hồi hoàn trả (nếu có)</label>
                <input
                  type="number"
                  value={refundableInput}
                  onChange={(e) => setRefundableInput(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-rose-600 text-xs outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveFinancialNumbers}
                className="px-4 py-1.5 bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold rounded-lg shadow-2xs cursor-pointer transition"
              >
                Lưu số liệu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}