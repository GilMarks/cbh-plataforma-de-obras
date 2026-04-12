import { useNavigate } from 'react-router-dom';
import { Settings, Bell, Search, HelpCircle } from 'lucide-react';
import { getCurrentUser } from '../../lib/storage';
import { temAcesso } from '../../lib/permissions';

export default function Topbar() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  if (!user) return null;

  return (
    <header
      className="flex items-center justify-between shrink-0 bg-surface-container-lowest"
      style={{ height: '72px', padding: '0 48px', borderBottom: '1px solid var(--color-border)' }}
    >
      {/* ── Search ── */}
      <div className="relative" style={{ width: '420px' }}>
        <Search
          size={18}
          className="absolute text-text-muted pointer-events-none"
          style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Pesquisar obras, pedidos ou usuarios..."
          className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all duration-150"
          style={{
            padding: '12px 20px 12px 48px',
            fontSize: '14px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
          }}
        />
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center" style={{ gap: '8px' }}>
        {/* Action buttons */}
        <div className="flex items-center" style={{ gap: '4px' }}>
          {/* Notifications */}
          <button
            className="relative flex items-center justify-center rounded-lg
              text-text-muted hover:bg-surface-container-high/60 hover:text-text-secondary transition-all duration-150"
            style={{ width: '44px', height: '44px' }}
          >
            <Bell size={20} />
            <span
              className="absolute bg-danger rounded-full"
              style={{
                width: '9px',
                height: '9px',
                top: '10px',
                right: '10px',
                border: '2px solid var(--color-surface-container-lowest)',
              }}
            />
          </button>

          {/* Help */}
          <button
            className="flex items-center justify-center rounded-lg
              text-text-muted hover:bg-surface-container-high/60 hover:text-text-secondary transition-all duration-150"
            style={{ width: '44px', height: '44px' }}
          >
            <HelpCircle size={20} />
          </button>

          {/* Settings (Master only) */}
          {temAcesso(user.cargo, 'configuracoes') && (
            <button
              onClick={() => navigate('/configuracoes')}
              className="flex items-center justify-center rounded-lg
                text-text-muted hover:bg-surface-container-high/60 hover:text-text-secondary transition-all duration-150"
              style={{ width: '44px', height: '44px' }}
            >
              <Settings size={20} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div
          className="bg-surface-container-high"
          style={{ width: '1px', height: '32px', margin: '0 12px', opacity: 0.7 }}
        />

        {/* Profile */}
        <button
          onClick={() => navigate('/configuracoes')}
          className="flex items-center hover:opacity-80 transition-opacity"
          style={{ gap: '14px', padding: '6px 8px', borderRadius: '10px' }}
        >
          <div className="text-right hidden lg:block">
            <p
              className="font-bold text-text-primary tracking-tight"
              style={{ fontSize: '13px', lineHeight: '1.2' }}
            >
              {user.login}
            </p>
            <p
              className="text-text-muted uppercase tracking-wider font-medium"
              style={{ fontSize: '10px', marginTop: '2px' }}
            >
              {user.cargo}
            </p>
          </div>
          <div
            className="rounded-lg bg-primary flex items-center justify-center text-white font-bold"
            style={{ width: '40px', height: '40px', fontSize: '15px' }}
          >
            {user.login.charAt(0).toUpperCase()}
          </div>
        </button>
      </div>
    </header>
  );
}
