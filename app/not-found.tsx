import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6 text-center text-slate-800">
      <div className="w-16 h-16 rounded-xl bg-[#EBF4FC] border border-[#B8D7F5] flex items-center justify-center mb-4 text-[#0A6EBD] shadow-sm">
        <Building2 className="w-8 h-8" />
      </div>
      <span className="font-mono text-xs font-bold text-[#0A6EBD] bg-[#EBF4FC] px-2.5 py-1 rounded border border-[#B8D7F5] uppercase tracking-wider">
        Mã lỗi: 404 - Không tìm thấy dữ liệu
      </span>
      <h1 className="text-2xl font-bold text-[#1B3B60] mt-3">
        Không tìm thấy trang yêu cầu
      </h1>
      <p className="text-[13px] text-slate-500 max-w-md mt-2 leading-relaxed">
        Đường dẫn bạn đang truy cập không tồn tại hoặc đã được di chuyển sang phân hệ khác trong Hệ thống Quản lý NCKH Bệnh viện.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0A6EBD] hover:bg-[#085896] text-white font-bold text-xs transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard Quản trị
      </Link>
    </div>
  );
}
