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
    return IconComponent ? <IconComponent size={24} /> : null;
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
      className="bg-surface-container-lowest relative"
      style={{
        padding: '28px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
      }}
    >
      {resolvedIcon && (
        <div
          className={`absolute opacity-40 ${colorClass}`}
          style={{ top: '28px', right: '28px' }}
        >
          {resolvedIcon}
        </div>
      )}
      <p
        className="font-extrabold text-text-muted uppercase tracking-widest"
        style={{ fontSize: '11px', marginBottom: '12px' }}
      >
        {title}
      </p>
      <p
        className="font-extrabold text-text-primary tracking-tight tabular-nums"
        style={{ fontSize: '28px', lineHeight: 1.1 }}
      >
        {value}
      </p>
      {subtitle && (
        <p
          className="text-text-muted"
          style={{ fontSize: '12px', marginTop: '8px' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
