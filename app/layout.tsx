import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Hệ thống Quản lý Nghiên cứu Khoa học Bệnh viện (CRMS)',
  description: 'Hệ thống quản lý toàn diện vòng đời đề tài NCKH cấp cơ sở tại bệnh viện',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
