import type { Metadata } from 'next';
import { Noto_Sans_Thai, Plus_Jakarta_Sans } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import CsmjuAppShellClient from '@/components/CsmjuAppShellClient';
import type { NavItem } from '@/csmju';
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

const DISPLAY_NAME = 'ระบบวิเคราะห์ความเสี่ยงโครงการซอฟต์แวร์';

const NAV: NavItem[] = [
  { label: 'ภาพรวม', labelEn: 'Overview', href: '/', icon: 'dashboard' },
  { label: 'โครงการ', labelEn: 'Projects', href: '/projects', icon: 'description' },
  { label: 'สถานการณ์จำลอง', labelEn: 'Scenarios', href: '/scenarios', icon: 'event' },
  { label: 'ผลการจำลอง', labelEn: 'Simulations', href: '/simulations', icon: 'receipt' },
];

const CORE_HUB_WEB_URL = process.env.CORE_HUB_WEB_URL;

export const metadata: Metadata = {
  title: {
    template: '%s · Software Project Risk · CSMJU',
    default: 'Software Project Risk · CSMJU',
  },
  description: 'ระบบวิเคราะห์ความเสี่ยงโครงการซอฟต์แวร์ และจำลองสถานการณ์ What-if',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={jakarta.variable + ' ' + notoSansThai.variable + ' h-full antialiased'}>
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        <ToastProvider>
          <CsmjuAppShellClient
            displayName={DISPLAY_NAME}
            nav={NAV}
            coreHubUrl={CORE_HUB_WEB_URL}
          >
            {children}
          </CsmjuAppShellClient>
        </ToastProvider>
      </body>
    </html>
  );
}
