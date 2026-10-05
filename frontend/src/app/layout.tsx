import type { Metadata } from 'next';
import { Noto_Sans_Thai, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

const notoSansThai = Noto_Sans_Thai({
  variable: '--font-noto-thai',
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Software Project Risk',
  description: 'ระบบวิเคราะห์ความเสี่ยงโครงการซอฟต์แวร์ และจำลองสถานการณ์ What-if',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={`${jakarta.variable} ${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full font-body">
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
