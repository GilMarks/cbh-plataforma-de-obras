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

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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
  if (!icon) return <Inbox size={36} className="mx-auto text-text-muted mb-3 opacity-50" />;
  if (typeof icon === 'string') {
    const IconComponent = ICON_MAP[icon] ?? Inbox;
    return <IconComponent size={36} className="mx-auto text-text-muted mb-3 opacity-50" />;
  }
  return icon;
}

export default function EmptyState({ message = 'Nenhum registro encontrado', icon }: EmptyStateProps) {
  return (
    <div className="text-center py-12 border border-dashed border-border-light rounded-[var(--radius-card)]">
      {resolveIcon(icon)}
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  );
}
