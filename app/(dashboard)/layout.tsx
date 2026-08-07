'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Container */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-200 ${sidebarCollapsed ? 'pl-16' : 'pl-64'
          }`}
      >
        {/* Header */}
        <Header sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />

        {/* Content Body with High Density */}
        <main className="flex-1 mt-16 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          <Breadcrumb />
          {children}
        </main>

        {/* System Footer */}
        <footer className="py-2.5 px-5 bg-white border-t border-[#DDE2E8] text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Hệ thống Quản lý Đề tài Nghiên cứu Khoa học Cấp cơ sở • Bệnh viện Đa khoa Trung tâm
          </span>
          <span className="font-mono text-slate-400">Phiên bản HIS-CRMS Enterprise v3.2.0</span>
        </footer>
      </div>
    </div>);
}
