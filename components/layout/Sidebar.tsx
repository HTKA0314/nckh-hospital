'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Home,
  FileText,
  FileBox,
  Files,
  FolderKanban,
  FileSpreadsheet,
  Award,
  UserCheck,
  TrendingUp,
  GitPullRequest,
  Shield,
  DollarSign,
  BarChart3,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

interface MenuGroup {
  groupTitle: string;
  items: {
    title: string;
    href: string;
    icon: any;
    roles: string[];
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const role = currentUser.role;

  const menuGroups: MenuGroup[] = [
    {
      groupTitle: 'QUẢN LÝ ĐỀ TÀI',
      items: [
        {
          title: 'Đợt đăng ký',
          href: '/rounds',
          icon: FileBox,
          roles: ['RESEARCHER', 'RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN', 'COUNCIL_MEMBER', 'COUNCIL_SECRETARY', 'ETHICS_OFFICE', 'FINANCE_OFFICER'],
        },
        {
          title: 'Đề tài của tôi',
          href: '/my-projects',
          icon: Files,
          roles: ['RESEARCHER', 'RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN', 'COUNCIL_MEMBER', 'COUNCIL_SECRETARY', 'ETHICS_OFFICE', 'FINANCE_OFFICER'],
        },
        {
          title: 'Danh sách đề tài',
          href: '/projects',
          icon: FileSpreadsheet,
          roles: [
            'RESEARCH_OFFICE',
            'COUNCIL_MEMBER',
            'COUNCIL_SECRETARY',
            'ETHICS_OFFICE',
            'FINANCE_OFFICER',
            'DIRECTOR',
            'ADMIN',
          ],
        },
      ],
    },
    {
      groupTitle: 'HỘI ĐỒNG',
      items: [
        {
          title: 'Hội đồng xét duyệt đề cương',
          href: '/councils?type=PROPOSAL_REVIEW',
          icon: FileText,
          roles: ['RESEARCH_OFFICE', 'COUNCIL_MEMBER', 'COUNCIL_SECRETARY', 'DIRECTOR', 'ADMIN'],
        },
        {
          title: 'Hội đồng nghiệm thu',
          href: '/councils?type=ACCEPTANCE_REVIEW',
          icon: UserCheck,
          roles: ['RESEARCH_OFFICE', 'COUNCIL_MEMBER', 'COUNCIL_SECRETARY', 'DIRECTOR', 'ADMIN'],
        },
      ],
    },
    {
      groupTitle: 'THỰC HIỆN ĐỀ TÀI',
      items: [
        {
          title: 'Tiến độ và báo cáo',
          href: '/progress',
          icon: TrendingUp,
          roles: ['RESEARCHER', 'RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN'],
        },
        {
          title: 'Yêu cầu điều chỉnh',
          href: '/change-requests',
          icon: GitPullRequest,
          roles: ['RESEARCHER', 'RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN'],
        },
        {
          title: 'Đạo đức nghiên cứu',
          href: '/ethics',
          icon: Shield,
          roles: ['RESEARCHER', 'ETHICS_OFFICE', 'RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN'],
        },
        {
          title: 'Tài chính và quyết toán',
          href: '/finance',
          icon: DollarSign,
          roles: ['RESEARCHER', 'FINANCE_OFFICER', 'RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN'],
        },
      ],
    },
    {
      groupTitle: 'BÁO CÁO VÀ QUẢN TRỊ',
      items: [
        {
          title: 'Kho Biểu mẫu & Quy định',
          href: '/templates',
          icon: FolderKanban,
          roles: ['RESEARCHER', 'RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN', 'COUNCIL_MEMBER', 'COUNCIL_SECRETARY', 'ETHICS_OFFICE', 'FINANCE_OFFICER'],
        },
        {
          title: 'Báo cáo, thống kê',
          href: '/reports',
          icon: BarChart3,
          roles: ['RESEARCH_OFFICE', 'DIRECTOR', 'ADMIN'],
        },
        {
          title: 'Danh mục và cấu hình',
          href: '/settings',
          icon: SlidersHorizontal,
          roles: ['ADMIN'],
        },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-white text-slate-700 transition-all duration-200 flex flex-col border-r border-[#E2E8F0] shadow-sm select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header Logo theo đúng ảnh mẫu (Xanh Navy đậm với icon tài liệu) */}
      <div className="h-16 flex items-center justify-between px-3 bg-[#0B2A63] text-white">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded bg-[#163F8A] border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
            <BookOpen className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-[11px] text-white tracking-wide uppercase leading-snug">
                HỆ THỐNG QUẢN LÝ
              </span>
              <span className="font-bold text-[12px] text-sky-200 uppercase leading-snug">
                NGHIÊN CỨU KHOA HỌC
              </span>
              <span className="text-[9px] text-slate-300 tracking-tight leading-tight">
                BỆNH VIỆN ĐA KHOA TRUNG TÂM
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition ml-1"
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Group Sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {/* Nút 'Tổng quan' bo tròn nổi bật màu xanh dương */}
        <Link
          href="/"
          title={collapsed ? 'Tổng quan' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition ${
            pathname === '/'
              ? 'bg-[#0A6EBD] text-white shadow-xs font-bold'
              : 'text-slate-700 hover:bg-slate-100 font-medium'
          } ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <Home className={`w-4 h-4 shrink-0 ${pathname === '/' ? 'text-white' : 'text-slate-500'}`} />
          {!collapsed && <span className="truncate">Tổng quan</span>}
        </Link>

        {menuGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  {group.groupTitle}
                </div>
              )}

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const itemBaseHref = item.href.split('?')[0];
                  const isActive = pathname === itemBaseHref;

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      title={collapsed ? item.title : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition ${
                        isActive
                          ? 'bg-[#EBF4FC] text-[#0A6EBD] font-bold border-l-4 border-l-[#0A6EBD]'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0A6EBD]' : 'text-slate-400'}`} />
                      {!collapsed && <span className="truncate flex-1">{item.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Version & Subtle Collapse Toggle */}
      <div className="p-2.5 border-t border-slate-100 bg-[#F8FAFC]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition"
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Thu gọn menu</span>
            </>
          )}
        </button>

        {!collapsed && (
          <div className="text-[11px] text-slate-400 text-center pt-2 mt-1 border-t border-slate-200/60">
            <p className="font-semibold text-slate-600">Hệ thống CRMS v2.0</p>
            <p className="text-[10px] text-slate-400">Bệnh viện Đa khoa Trung tâm</p>
          </div>
        )}
      </div>
    </aside>
  );
};
