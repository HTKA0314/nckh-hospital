'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  'projects': 'Danh sách Đề tài',
  'rounds': 'Đợt đăng ký',
  'my-projects': 'Đề tài của tôi',
  'register': 'Đăng ký đề tài mới',
  'councils': 'Hội đồng Khoa học',
  'progress': 'Theo dõi tiến độ',
  'change-requests': 'Yêu cầu điều chỉnh',
  'ethics': 'Đạo đức nghiên cứu (IRB)',
  'finance': 'Tài chính & Quyết toán',
  'reports': 'Báo cáo & Thống kê',
  'settings': 'Quản trị & Cấu hình',
  'review': 'Thẩm định hồ sơ',
  'templates': 'Kho Biểu mẫu & Quy định',
};

export const Breadcrumb: React.FC = () => {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/login') return null;

  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-3 overflow-x-auto select-none">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-[#0A6EBD] transition font-medium"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Trang chủ</span>
      </Link>

      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        const href = `/${segments.slice(0, idx + 1).join('/')}`;
        const label =
          ROUTE_LABELS[seg] ||
          (seg.startsWith('proj-')
            ? 'Chi tiết đề tài'
            : seg.startsWith('council-')
            ? 'Không gian Họp Hội đồng'
            : seg);

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 truncate max-w-[240px]">{label}</span>
            ) : (
              <Link href={href} className="hover:text-[#0A6EBD] transition truncate max-w-[180px]">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
