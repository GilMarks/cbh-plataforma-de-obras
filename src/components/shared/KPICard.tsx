import type { ReactNode } from 'react';
import {
  History, ArrowDown, ArrowUp, FileText, Clock, AlertTriangle,
  Package, Wrench, CheckCircle, ArrowLeftRight, Users, HardHat, Boxes,
  Receipt, CheckSquare, Truck, DollarSign, TrendingUp, TrendingDown,
  Wallet, LayoutDashboard, BarChart3,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  History, ArrowDown, ArrowUp, FileText, Clock, AlertTriangle,
  Package, Wrench, CheckCircle, ArrowLeftRight, Users, HardHat, Boxes,
  Receipt, CheckSquare, Truck, DollarSign, TrendingUp, TrendingDown,
  Wallet, LayoutDashboard, BarChart3,
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: ReactNode | string;
  color?: string;
  subtitle?: string;
}

function resolveIcon(icon: ReactNode | string | undefined): ReactNode | null {
  if (!icon) return null;
  if (typeof icon === 'string') {
    const IconComponent = ICON_MAP[icon];
    return IconComponent ? <IconComponent size={20} /> : null;
  }
  return icon as ReactNode;
}

function normalizeColor(color: string): string {
  return color.startsWith('text-') ? color : `text-${color}`;
}

export default function KPICard({ title, value, icon, color = 'text-primary', subtitle }: KPICardProps) {
  const colorClass = normalizeColor(color);
  const resolvedIcon = resolveIcon(icon);

  return (
    <div
      className="bg-surface-container-lowest"
      style={{
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
      }}
    >
      {resolvedIcon && (
        <div
          className={`inline-flex items-center justify-center rounded-lg mb-4 ${colorClass}`}
          style={{
            width: '40px',
            height: '40px',
            background: 'var(--color-primary-bg)',
          }}
        >
          {resolvedIcon}
        </div>
      )}
      <p
        className="font-semibold text-text-muted"
        style={{ fontSize: '13px', marginBottom: '6px' }}
      >
        {title}
      </p>
      <p
        className="font-bold text-text-primary tabular-nums"
        style={{ fontSize: '30px', lineHeight: 1.15, letterSpacing: '-0.02em' }}
      >
        {value}
      </p>
      {subtitle && (
        <p
          className="text-text-muted"
          style={{ fontSize: '13px', marginTop: '6px' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
