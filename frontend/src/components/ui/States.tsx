import type { ReactNode } from 'react';
import type { ApiError } from '@/lib/api';
import { Button } from './Button';

export function LoadingState({ label = 'กำลังโหลดข้อมูล...' }: { label?: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4 py-4">
      <span className="sr-only">{label}</span>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-container" />
      <div className="h-5 w-72 max-w-full animate-pulse rounded-lg bg-surface-container" />
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
        <div className="h-6 w-2/3 animate-pulse rounded-lg bg-surface-container" />
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-surface-container" />
      </div>
    </div>
  );
}
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center gap-2 py-12 text-center">
    <p className="font-display text-headline-md text-on-surface">{title}</p>
    {description && <p className="max-w-md text-body-md text-on-surface-variant">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>;
}
export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const notFound = error.status === 404;
  return <div role="alert" className="rounded-xl border border-error/20 bg-error-container/30 px-6 py-12 text-center">
    <p className="font-display text-headline-md text-on-surface">{notFound ? 'ไม่พบข้อมูล' : 'เกิดข้อผิดพลาด'}</p>
    <p className="mx-auto mt-2 max-w-md text-body-md text-on-surface-variant">{error.message}</p>
    {onRetry && !notFound && <Button variant="secondary" onClick={onRetry} className="mt-4">ลองใหม่</Button>}
  </div>;
}
