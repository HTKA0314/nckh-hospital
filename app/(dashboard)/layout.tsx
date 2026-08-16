'use client';

import React, { useState, Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans antialiased">
      {/* 1. Sidebar điều hướng cố định */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* 2. Khung nội dung chính */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        {/* Header với Suspense tránh hydration mismatch */}
        <Suspense fallback={<div className="h-14 bg-white border-b border-[#E2E8F0] w-full" />}>
          <Header sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
        </Suspense>

        {/* Thùng chứa chính */}
        <main id="main-content" role="main" className="flex-1 mt-14 p-3.5 md:p-5 w-full max-w-[1800px] mx-auto space-y-3.5">
          {/* Nội dung các trang con (children) */}
          {children}
        </main>

        {/* Footer hệ thống */}
        <footer className="py-2.5 px-5 bg-white border-t border-[#DDE2E8] text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Hệ thống Quản lý NCKH & Đạo đức Y sinh Cấp cơ sở • Bệnh viện Đa khoa Trung tâm
            </span>
          </div>
          <span className="font-mono text-slate-400">HIS-CRMS Enterprise v3.2.0</span>
        </footer>
      </div>
    </div>
  );
}