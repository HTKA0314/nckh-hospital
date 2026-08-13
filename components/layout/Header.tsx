'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { repo } from '@/lib/repository';
import { Role } from '@/lib/types';
import { getRoleDisplayName } from '@/lib/utils';
import {
  Bell,
  UserCheck,
  ChevronDown,
  LogOut,
  Menu,
  ChevronRight,
  Home,
} from 'lucide-react';

/* Bảng nhãn trang theo pathname */
const PAGE_LABELS: Record<string, { title: string; breadcrumb: string[] }> = {
  '/': { title: 'Tổng quan', breadcrumb: ['Tổng quan'] },
  '/projects': { title: 'Danh sách đề tài', breadcrumb: ['Danh sách đề tài'] },
  '/projects/register': { title: 'Đăng ký đề tài mới', breadcrumb: ['Danh sách đề tài', 'Đăng ký mới'] },
  '/my-projects': { title: 'Đề tài của tôi', breadcrumb: ['Đề tài của tôi'] },
  '/rounds': { title: 'Kế hoạch đợt đăng ký', breadcrumb: ['Kế hoạch đợt đăng ký'] },
  '/councils': { title: 'Hội đồng Khoa học', breadcrumb: ['Hội đồng Khoa học'] },
  '/review': { title: 'Thẩm định hồ sơ', breadcrumb: ['Thẩm định hồ sơ'] },
  '/progress': { title: 'Tiến độ & Báo cáo', breadcrumb: ['Tiến độ & Báo cáo'] },
  '/change-requests': { title: 'Yêu cầu điều chỉnh', breadcrumb: ['Yêu cầu điều chỉnh'] },
  '/ethics': { title: 'Đạo đức nghiên cứu', breadcrumb: ['Đạo đức nghiên cứu'] },
  '/finance': { title: 'Tài chính & Quyết toán', breadcrumb: ['Tài chính & Quyết toán'] },
  '/reports': { title: 'Báo cáo & Thống kê', breadcrumb: ['Báo cáo & Thống kê'] },
  '/settings': { title: 'Cấu hình hệ thống', breadcrumb: ['Cấu hình hệ thống'] },
  '/templates': { title: 'Kho tài liệu & Biểu mẫu', breadcrumb: ['Kho tài liệu & Biểu mẫu'] },
  '/acceptance': { title: 'Hồ sơ nghiệm thu', breadcrumb: ['Hồ sơ nghiệm thu'] },
  '/acceptance/revision': { title: 'Hoàn thiện sau nghiệm thu', breadcrumb: ['Hoàn thiện sau nghiệm thu'] },
};

function getPageMeta(pathname: string, type: string | null) {
  if (pathname === '/decisions') {
    const label = type === 'RECOGNITION' ? 'Quyết định công nhận' : 'Quyết định giao thực hiện';
    return { title: label, breadcrumb: [label] };
  }
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  // Dynamic routes: /projects/[id], /councils/[id]
  if (pathname.startsWith('/projects/') && !pathname.endsWith('/register')) {
    return { title: 'Chi tiết đề tài', breadcrumb: ['Danh sách đề tài', 'Chi tiết đề tài'] };
  }
  if (pathname.startsWith('/councils/')) {
    return { title: 'Workspace Hội đồng', breadcrumb: ['Hội đồng Khoa học', 'Workspace'] };
  }
  return { title: 'Bảng điều hành', breadcrumb: ['Bảng điều hành'] };
}

interface HeaderProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed?: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const { currentUser, switchRole } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const pageMeta = getPageMeta(pathname, type);

  const demoRoles: { role: Role; label: string; desc: string }[] = [
    { role: 'RESEARCHER', label: 'Cán bộ Nghiên cứu', desc: 'BS.CKII Nguyễn Văn An' },
    { role: 'RESEARCH_OFFICE', label: 'Phòng Quản lý NCKH', desc: 'ThS. Lê Hoàng Long' },
    { role: 'COUNCIL_MEMBER', label: 'Hội đồng Khoa học', desc: 'PGS.TS.BS Phạm Đức Dũng' },
    { role: 'COUNCIL_MEMBER', label: 'Thành viên Hội đồng', desc: 'BS.CKI Đỗ Bích Ngọc' },
    { role: 'ETHICS_OFFICE', label: 'HĐ Đạo đức Y sinh', desc: 'TS.BS Vũ Thị Hồng Hạnh' },
    { role: 'FINANCE_OFFICER', label: 'Phòng Tài chính - KT', desc: 'CN. Nguyễn Thị Thu Hà' },
    { role: 'DIRECTOR', label: 'Ban Giám đốc', desc: 'GS.TS.BS Vũ Đình Khoa' },
    { role: 'ADMIN', label: 'Quản trị viên', desc: 'KS. Trịnh Quốc Bảo' },
  ];

  const notifications = [
    { id: 1, type: 'info', text: 'Hồ sơ DX-2026-101 đã được thẩm định hợp lệ', time: '5 phút trước' },
    { id: 2, type: 'warning', text: 'Đề tài DT-2025-007 cần bổ sung tài liệu', time: '1 giờ trước' },
    { id: 3, type: 'success', text: 'Hội đồng HĐ-2026-003 đã hoàn thành chấm điểm', time: '2 giờ trước' },
  ];

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-14 overflow-visible bg-white border-b border-[#E2E8F0] transition-all duration-200 shadow-xs ${sidebarCollapsed ? 'left-16' : 'left-64'
        }`}
    >
      {/* Main header row */}
      <div className="h-14 flex items-center justify-between px-5">
        {/* Left: Hamburger + Page Title + Breadcrumb inline */}
        <div className="flex items-center gap-3 min-w-0">
          {setSidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition flex-shrink-0"
              title="Đóng / Mở menu bên"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Title + mini breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0">
            {pageMeta.breadcrumb.length > 0 && (
              <>
                <Link href="/" className="text-slate-400 hover:text-slate-655 transition flex-shrink-0">
                  <Home className="w-3.5 h-3.5" />
                </Link>
                {pageMeta.breadcrumb.map((crumb, i) => (
                  <React.Fragment key={i}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-350 flex-shrink-0" />
                    {i === pageMeta.breadcrumb.length - 1 ? (
                      <span className="text-[13px] font-bold text-slate-800 truncate">{crumb}</span>
                    ) : (
                      <span className="text-[12px] text-slate-450 font-medium truncate">{crumb}</span>
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
            {pageMeta.breadcrumb.length === 0 && (
              <span className="text-[13px] font-bold text-slate-800">
                {pageMeta.title}
              </span>
            )}
          </div>
        </div>

        {/* Right: Notifications + Role Switcher + User */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifMenu(!showNotifMenu); setShowRoleMenu(false); }}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition relative"
              title="Thông báo"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            </button>
            {showNotifMenu && (
              <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <p className="text-[12px] font-bold text-slate-700">Thông báo hệ thống</p>
                </div>
                {notifications.map((n) => (
                  <div key={n.id} className="px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 cursor-pointer">
                    <p className="text-[13px] text-slate-800 leading-snug">{n.text}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                ))}
                <div className="px-3 py-2 text-center">
                  <button className="text-[12px] text-[#0A6EBD] font-semibold hover:underline">
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Capsule with integrated Role Switcher (RBAC) */}
          <div className="relative">
            <button
              onClick={() => { setShowRoleMenu(!showRoleMenu); setShowNotifMenu(false); }}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-[#EBF4FC] hover:border-[#B8D7F5] transition group shadow-xs"
              title="Tài khoản & Chuyển đổi vai trò"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0B2A63] text-white font-bold text-[13px] flex items-center justify-center shadow-xs shrink-0">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[13px] font-bold text-slate-800 leading-snug group-hover:text-[#0A6EBD] truncate max-w-[200px]">
                  {currentUser.fullName}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10.5px] font-semibold text-[#0A6EBD] bg-[#EBF4FC] px-1.5 py-0.5 rounded border border-[#B8D7F5] whitespace-nowrap leading-none">
                    {getRoleDisplayName(currentUser.role)}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0A6EBD] transition ml-0.5" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100 bg-[#F8FAFC]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0B2A63] text-white font-bold text-[15px] flex items-center justify-center shadow-xs shrink-0">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-900 leading-snug truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-[#0A6EBD] font-semibold mt-0.5 truncate">
                        {repo.getDepartmentById(currentUser.departmentId)?.name || 'Bệnh viện Đa khoa Trung tâm'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* Role Switcher Section */}
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Chuyển vai trò thử nghiệm (RBAC)
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto px-1.5 py-1 space-y-0.5">
                  {demoRoles.map((item) => (
                    <button
                      key={item.role}
                      onClick={() => { switchRole(item.role); setShowRoleMenu(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[13px] flex items-center justify-between transition ${
                        currentUser.role === item.role
                          ? 'bg-[#EBF4FC] font-bold text-[#0A6EBD]'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="font-semibold leading-tight">{item.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                      {currentUser.role === item.role && (
                        <span className="w-2 h-2 rounded-full bg-[#0A6EBD] flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Logout / Switch Account */}
                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                  <Link
                    href="/login"
                    className="text-[12px] text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Đăng xuất / Đổi tài khoản
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
