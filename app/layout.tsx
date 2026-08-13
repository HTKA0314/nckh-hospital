import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'], display: 'swap' });

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
      <body className={`min-h-screen bg-slate-50 text-slate-900 antialiased ${inter.className}`}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
