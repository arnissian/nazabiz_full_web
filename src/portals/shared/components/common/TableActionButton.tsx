import type { ReactNode } from 'react';

type TableActionButtonProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'info';
  disabled?: boolean;
};

const variantClasses: Record<NonNullable<TableActionButtonProps['variant']>, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  danger: 'text-danger',
  info: 'text-info',
};

export function TableActionButton({
  label,
  icon,
  onClick,
  variant = 'secondary',
  disabled = false,
}: TableActionButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn-sm btn-light border p-1 ${variantClasses[variant]}`}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}
