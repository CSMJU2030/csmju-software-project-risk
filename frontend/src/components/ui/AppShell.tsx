'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

const NAV = [
  { href: '/', label: 'แดชบอร์ด', icon: '⌂' },
  { href: '/projects', label: 'โครงการทั้งหมด', icon: '▣' },
];

function currentLabel(pathname: string) {
  if (pathname === '/') return 'แดชบอร์ด';
  if (pathname.startsWith('/projects')) return 'โครงการทั้งหมด';
  if (pathname.startsWith('/scenarios')) return 'สถานการณ์จำลอง';
  if (pathname.startsWith('/simulations')) return 'ผลการจำลอง';
  return 'Software Project Risk';
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <header className="sticky top-0 z-40 border-b border-outline-variant/70 bg-surface-container-lowest/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-8">
          <Link href="/" className="focus-ring flex min-w-0 shrink-0 items-center gap-3 rounded-xl">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-container font-display text-sm font-bold text-on-primary shadow-sm">
              SP
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-bold leading-tight text-on-surface">Software Project Risk</p>
              <p className="truncate text-caption text-on-surface-variant">Risk &amp; What-if Simulation</p>
            </div>
          </Link>

          <nav aria-label="เมนูหลัก" className="ml-2 hidden flex-1 items-center justify-center md:flex">
            <div className="flex items-center gap-1 rounded-xl border border-outline-variant/60 bg-surface-container-low p-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={isActive(n.href) ? 'page' : undefined}
                  className={`focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-label-md transition-colors ${
                    isActive(n.href)
                      ? 'bg-surface-container-lowest font-bold text-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface'
                  }`}
                >
                  <span aria-hidden className="grid w-5 place-items-center text-sm">{n.icon}</span>
                  <span>{n.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-outline-variant/70 bg-surface-container-low px-3 py-1.5 text-caption font-medium text-on-surface-variant lg:inline-flex">
              {currentLabel(pathname)}
            </span>
            <button
              type="button"
              aria-label="เปิด/ปิดเมนู"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="focus-ring inline-flex min-h-10 items-center rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-label-md font-semibold text-on-surface md:hidden"
            >
              เมนู
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="เมนูหลักบนมือถือ" className="border-t border-outline-variant/70 bg-surface-container-lowest px-4 py-3 md:hidden">
            <div className="mx-auto grid w-full max-w-7xl gap-2 sm:grid-cols-2">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(n.href) ? 'page' : undefined}
                  className={`focus-ring flex min-h-11 items-center gap-3 rounded-lg px-4 text-label-md ${
                    isActive(n.href) ? 'bg-primary-fixed font-bold text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span aria-hidden className="grid w-5 place-items-center">{n.icon}</span>
                  <span>{n.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
