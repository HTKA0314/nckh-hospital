'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { repo } from '@/lib/repository';
import {
  Home,
  FileText,
  FileBox,
  FolderKanban,
  FileSpreadsheet,
  Award,
  FileCheck2,
  TrendingUp,
  GitPullRequest,
  Shield,
  BarChart3,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users,
  ClipboardCheck,
  DollarSign,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface MenuGroup {
  groupTitle: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
}) => {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const role = currentUser?.role || 'RESEARCHER';

  const getMenuGroups = (): MenuGroup[] => {
    const isResearcher = role === 'RESEARCHER';
    const isOffice = role === 'RESEARCH_OFFICE';
    const isAdmin = role === 'ADMIN';
    const isDirector = role === 'DIRECTOR';
    const isCouncilMember = role === 'COUNCIL_MEMBER';
    const isFinanceOfficer = role === 'FINANCE_OFFICER';

    const hasMyProjects = currentUser
      ? repo.getProjects().some(
          (project) =>
            project.principalInvestigatorId === currentUser.id ||
            project.members?.some(
              (member) => member.userId === currentUser.id
            )
        )
      : false;

    const showMyProjects = isResearcher || hasMyProjects;

    const canManageResearch =
      isOffice || isAdmin || isDirector || isFinanceOfficer;

    const groups: MenuGroup[] = [
      {
        groupTitle: 'TỔNG QUAN',
        items: [
          {
            title: 'Tổng quan',
            href: '/',
            icon: Home,
          },
        ],
      },

      {
        groupTitle: 'QUẢN LÝ ĐỀ TÀI',
        items: [
          ...(canManageResearch
            ? [
                {
                  title: 'Đợt đăng ký',
                  href: '/rounds',
                  icon: FileBox,
                },
              ]
            : []),

          ...(showMyProjects
            ? [
                {
                  title: 'Đề tài của tôi',
                  href: '/my-projects',
                  icon: FileSpreadsheet,
                },
              ]
            : []),

          ...(!isCouncilMember
            ? [
                {
                  title: 'Danh sách đề tài',
                  href: '/projects',
                  icon: FolderKanban,
                },
              ]
            : []),
        ],
      },

      {
        groupTitle: 'XỬ LÝ NGHIỆP VỤ',
        items: [
          {
            title: 'Quản lý Hội đồng KH&CN',
            href: '/councils',
            icon: Users,
          },
          {
            title: 'Đạo đức nghiên cứu',
            href: '/ethics',
            icon: Shield,
          },
          {
            title: 'Tiến độ & báo cáo',
            href: '/progress',
            icon: TrendingUp,
          },
          {
            title: 'Gia hạn / Điều chỉnh',
            href: '/change-requests',
            icon: GitPullRequest,
          },
          {
            title: 'Nghiệm thu',
            href: '/acceptance',
            icon: ClipboardCheck,
          },
        ].filter((item) => {
          /*
           * Chủ nhiệm xử lý nghiệp vụ của từng đề tài
           * trong "Đề tài của tôi", không cần menu quản lý toàn viện.
           */
          if (isResearcher) return false;

          /*
           * Thành viên Hội đồng chỉ cần workspace Hội đồng.
           */
          if (
            isCouncilMember &&
            item.href !== '/councils'
          ) {
            return false;
          }

          return true;
        }),
      },

      {
        groupTitle: 'QUYẾT ĐỊNH',
        items: canManageResearch
          ? [
              {
                title: 'Quản lý quyết định',
                href: '/decisions',
                icon: Award,
              },
            ]
          : [],
      },

      {
        groupTitle: 'BÁO CÁO & TÀI NGUYÊN',
        items: [
          ...(!isResearcher && !isCouncilMember
            ? [
                {
                  title: 'Báo cáo, thống kê',
                  href: '/reports',
                  icon: BarChart3,
                },
              ]
            : []),

          ...(!isCouncilMember
            ? [
                {
                  title: 'Kho biểu mẫu',
                  href: '/templates',
                  icon: FileText,
                },
              ]
            : []),
        ],
      },
    ];

    if (isAdmin) {
      groups.push({
        groupTitle: 'QUẢN TRỊ HỆ THỐNG',
        items: [
          {
            title: 'Cấu hình hệ thống',
            href: '/settings',
            icon: SlidersHorizontal,
          },
          {
            title: 'Người dùng & phân quyền',
            href: '/settings/users',
            icon: Users,
          },
        ],
      });
    }

    return groups.filter(
      (group) => group.items.length > 0
    );
  };

  const menuGroups = getMenuGroups();

  /**
   * Xác định menu active.
   *
   * Ví dụ:
   * /projects
   * /projects/123
   * /projects/123/progress
   *
   * đều có thể làm sáng menu tương ứng.
   */
  const isMenuActive = (href: string) => {
    const baseHref = href.split('?')[0];

    if (baseHref === '/') {
      return pathname === '/';
    }

    return (
      pathname === baseHref ||
      pathname.startsWith(`${baseHref}/`)
    );
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-white text-slate-700
        transition-all duration-200 flex flex-col border-r border-[#E2E8F0]
        shadow-sm select-none
        ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* HEADER */}
      <div
        className="h-16 flex items-center justify-between px-3
        bg-gradient-to-r from-[#0b224d] via-[#0B2A63] to-[#081a3d]
        border-b border-white/5 shadow-md text-white"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div
            className="w-8.5 h-8.5 rounded-xl
            bg-gradient-to-br from-sky-400 to-blue-600
            text-white flex items-center justify-center shrink-0
            shadow-md shadow-blue-900/30 border border-white/10"
          >
            <BookOpen className="w-4.5 h-4.5" />
          </div>

          {!collapsed && (
            <div className="flex flex-col">
              <span
                className="font-bold text-[12px] text-white
                tracking-wider leading-none"
              >
                CRMS{' '}
                <span className="text-sky-300 font-normal">
                  HOSPITAL
                </span>
              </span>

              <span
                className="font-medium text-[9.5px]
                text-sky-100/90 tracking-wide mt-1 leading-none"
              >
                Quản lý Nghiên cứu Khoa học
              </span>

              <span
                className="text-[8px] text-sky-200/50
                tracking-tight mt-0.5 leading-none"
              >
                Bệnh viện Đa khoa Trung tâm
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-slate-300
          hover:text-white hover:bg-white/10
          transition ml-1 cursor-pointer"
          title={
            collapsed
              ? 'Mở rộng menu'
              : 'Thu gọn menu'
          }
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <div
        className="flex-1 overflow-y-auto
        py-3 px-2.5 space-y-4"
      >
        {menuGroups.map((group) => (
          <div
            key={group.groupTitle}
            className="space-y-1"
          >


            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isMenuActive(
                  item.href
                );

                return (
                  <Link
                    key={`${group.groupTitle}-${item.href}`}
                    href={item.href}
                    title={
                      collapsed
                        ? item.title
                        : undefined
                    }
                    className={`
                      flex items-center gap-3
                      px-3 py-1.5
                      rounded-lg
                      text-[12px]
                      transition-all duration-200
                      border
                      
                      ${
                        active
                          ? `
                            bg-sky-50/60
                            text-[#0A6EBD]
                            font-bold
                            border-[#0A6EBD]/35
                            shadow-xs
                          `
                          : `
                            text-slate-600
                            font-medium
                            border-transparent
                            hover:bg-slate-50/80
                            hover:text-slate-900
                            hover:translate-x-0.5
                          `
                      }

                      ${
                        collapsed
                          ? 'justify-center px-0 hover:translate-x-0'
                          : ''
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active
                          ? 'text-[#0A6EBD]'
                          : 'text-slate-400'
                      }`}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1 uppercase">
                        {item.title}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div
        className="p-2.5 border-t
        border-slate-100 bg-[#F8FAFC]"
      >
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center
          justify-center gap-2 px-2.5 py-1.5
          rounded-lg text-[12px] font-semibold
          text-slate-600 hover:bg-slate-200/70
          hover:text-slate-900 transition cursor-pointer"
          title={
            collapsed
              ? 'Mở rộng menu'
              : 'Thu gọn menu'
          }
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
          <div
            className="text-[11px] text-slate-400
            text-center pt-2 mt-1
            border-t border-slate-200/60"
          >
            <p className="font-semibold text-slate-600">
              Hệ thống CRMS v2.0
            </p>
            <p className="text-[10px] text-slate-400">
              Bệnh viện Đa khoa Trung tâm
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};