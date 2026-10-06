'use client';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const styles: Record<Variant, string> = {
  primary: 'btn-gradient text-on-primary shadow-md hover:brightness-95',
  secondary: 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low',
  danger: 'bg-error text-on-primary hover:brightness-95',
  ghost: 'text-primary-container hover:bg-primary-container/10',
};
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  disabledReason?: string;
}
export function Button({ variant = 'primary', loading, disabled, disabledReason, className = '', children, title, ...rest }: Props) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      title={disabledReason ?? title}
      className={'focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-label-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' + styles[variant] + ' ' + className}
    >
      {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
