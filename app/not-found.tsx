import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  FileQuestion,
  FolderSearch,
  Home,
} from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-3xl">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#0A6EBD] flex items-center justify-center shadow-sm">
            <Building2 className="w-4 h-4 text-white" />
          </div>

          <div className="text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Hệ thống Quản lý NCKH
            </p>
            <p className="text-[10px] text-slate-400">
              Bệnh viện
            </p>
          </div>
        </div>

        {/* Main card */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Decorative background */}
          <div className="absolute -right-16 -top-20 text-slate-50 pointer-events-none">
            <FileQuestion strokeWidth={1} className="w-72 h-72" />
          </div>

          <div className="relative px-6 py-10 sm:px-12 sm:py-14">
            <div className="max-w-xl mx-auto text-center">
              {/* Error badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5">
                <span className="font-mono text-[11px] font-bold tracking-wide text-[#0A6EBD]">
                  HTTP 404
                </span>

                <span className="w-px h-3 bg-sky-200" />

                <span className="text-[11px] font-semibold text-slate-600">
                  Không tìm thấy trang
                </span>
              </div>

              {/* 404 */}
              <div className="mt-6">
                <p className="font-mono text-[72px] sm:text-[88px] leading-none font-bold tracking-[-0.08em] text-slate-100 select-none">
                  404
                </p>
              </div>

              <div className="-mt-3">
                <div className="mx-auto w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                  <FolderSearch className="w-6 h-6" />
                </div>

                <h1 className="mt-5 text-xl sm:text-2xl font-bold text-[#1B3B60] tracking-tight">
                  Trang bạn đang tìm không tồn tại
                </h1>

                <p className="mt-3 text-[13px] sm:text-sm leading-6 text-slate-500">
                  Đường dẫn có thể đã được thay đổi, phân hệ đã được di chuyển
                  hoặc bạn đang truy cập một địa chỉ không còn tồn tại trong
                  Hệ thống Quản lý Nghiên cứu Khoa học.
                </p>
              </div>

              {/* Hint */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-left">
                <p className="text-[12px] font-semibold text-slate-700">
                  Bạn có thể:
                </p>

                <ul className="mt-1.5 space-y-1 text-[12px] leading-5 text-slate-500">
                  <li>• Kiểm tra lại địa chỉ đường dẫn.</li>
                  <li>• Quay về Dashboard để tiếp tục công việc.</li>
                  <li>• Mở danh sách đề tài để tìm lại hồ sơ cần xử lý.</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
                <Link
                  href="/"
                  className="
                    inline-flex h-10 items-center justify-center gap-2
                    rounded-lg bg-[#0A6EBD] px-5
                    text-[13px] font-bold text-white
                    shadow-sm transition
                    hover:bg-[#085896]
                    focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/30
                  "
                >
                  <Home className="w-4 h-4" />
                  Về Dashboard
                </Link>

                <Link
                  href="/projects"
                  className="
                    inline-flex h-10 items-center justify-center gap-2
                    rounded-lg border border-slate-300 bg-white px-5
                    text-[13px] font-semibold text-slate-700
                    transition
                    hover:bg-slate-50 hover:border-slate-400
                  "
                >
                  <ArrowLeft className="w-4 h-4" />
                  Danh sách đề tài
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative border-t border-slate-100 bg-[#FAFBFC] px-6 py-3">
            <p className="text-center text-[10px] text-slate-400">
              Nếu lỗi xuất hiện khi mở một hồ sơ từ thông báo hoặc liên kết cũ,
              hồ sơ có thể đã được chuyển sang workspace nghiệp vụ khác.
            </p>
          </div>
        </section>

        {/* Bottom metadata */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <span>HIS-CRMS</span>
          <span>•</span>
          <span>Research Management System</span>
        </div>
      </div>
    </main>
  );
}