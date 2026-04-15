import type { ReactNode } from 'react';
import {
  Boxes,
  FileText,
  HardHat,
  History,
  Inbox,
  Package,
  Receipt,
  CheckSquare,
  Truck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  icon?: ReactNode | string;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Boxes,
  FileText,
  HardHat,
  History,
  Inbox,
  Package,
  Receipt,
  CheckSquare,
  Truck,
  UserCog,
  Users,
  Wrench,
};

function resolveIcon(icon: ReactNode | string | undefined): ReactNode {
  if (!icon) return <Inbox size={32} className="mx-auto text-text-muted mb-3" style={{ opacity: 0.4 }} />;
  if (typeof icon === 'string') {
    const IconComponent = ICON_MAP[icon] ?? Inbox;
    return <IconComponent size={32} className="mx-auto text-text-muted mb-3" style={{ opacity: 0.4 }} />;
  }
  return icon;
}

export default function EmptyState({ message = 'Nenhum registro encontrado', icon }: EmptyStateProps) {
  return (
    <div
      className="text-center"
      style={{
        padding: '48px 24px',
        border: '1px dashed var(--color-border-light)',
        borderRadius: '12px',
        background: 'var(--color-surface)',
      }}
    >
      {resolveIcon(icon)}
      <p className="text-text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>{message}</p>
    </div>
  );
}
