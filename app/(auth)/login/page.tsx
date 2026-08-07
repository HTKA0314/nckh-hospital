'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Role, User } from '@/lib/types';
import { getRoleDisplayName } from '@/lib/utils';
import { Hospital, UserCheck, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { allUsers, setCurrentUser } = useAuth();

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-4xl w-full space-y-8">
        {/* Hospital Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white shadow-xl shadow-teal-500/20 mb-2">
            <Hospital className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            HỆ THỐNG QUẢN LÝ NGHIÊN CỨU KHOA HỌC
          </h1>
          <p className="text-sm text-teal-300 font-medium max-w-xl mx-auto">
            Phân hệ Quản lý Vòng đời Đề tài NCKH Cấp Cơ Sở tại Bệnh viện (CRMS Prototype)
          </p>
        </div>

        {/* Quick Login Cards Matrix */}
        <div className="bg-slate-800/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          <div className="border-b border-slate-700/80 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-400" />
              Chọn tài khoản Demo để đăng nhập nhanh (RBAC 8 Roles)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống hỗ trợ chuyển đổi linh hoạt giữa các vai trò để kiểm thử toàn diện quy trình
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allUsers.slice(0, 8).map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="group p-4 rounded-2xl bg-slate-900/60 hover:bg-teal-950/40 border border-slate-700 hover:border-teal-500 transition-all text-left flex flex-col justify-between h-36"
              >
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 text-teal-300 group-hover:bg-teal-900/60 transition">
                    {getRoleDisplayName(user.role)}
                  </span>
                  <h3 className="font-bold text-slate-100 text-xs mt-2 group-hover:text-teal-300 transition line-clamp-1">
                    {user.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{user.degree}</p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 group-hover:text-teal-400 pt-2 border-t border-slate-800/60 font-medium">
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-700/60 text-center text-xs text-slate-400">
            Căn cứ theo Thông tư 09/2024/TT-BKHCN, Thông tư 43/2024/TT-BYT và Quy chế NCKH Bệnh viện.
          </div>
        </div>
      </div>
    </div>
  );
}
