import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="mb-1 text-label-sm font-semibold text-primary-container">Software Project Risk</p>
        <h1 className="font-display text-headline-lg font-bold text-on-surface">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
