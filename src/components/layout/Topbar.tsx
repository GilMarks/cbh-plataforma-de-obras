import { useNavigate } from 'react-router-dom';
import { Settings, Bell, Search, Sun, Moon, CheckCheck } from 'lucide-react';
import { getCurrentUser } from '../../lib/storage';
import { temAcesso } from '../../lib/permissions';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotificacoes } from '../../contexts/NotificacoesContext';
import { useState, useRef, useEffect } from 'react';

function NotifDropdown({ onClose }: { onClose: () => void }) {
  const { notificacoes, markAllRead } = useNotificacoes();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '340px',
        background: 'var(--color-surface-container-lowest)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Notificações</span>
        {notificacoes.length > 0 && (
          <button
            onClick={markAllRead}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <CheckCheck size={13} />
            Marcar como lidas
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {notificacoes.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <Bell size={28} style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Sem notificações</p>
          </div>
        ) : (
          notificacoes.map(n => (
            <button
              key={n.id}
              onClick={() => { if (n.href) { navigate(n.href); } onClose(); }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%', textAlign: 'left',
                padding: '12px 16px', border: 'none',
                borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                background: n.read ? 'none' : 'var(--color-primary-bg)',
              }}
              className="hover:bg-surface-container transition-colors"
            >
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, marginTop: '4px',
                background: n.read ? 'transparent' : 'var(--color-primary)',
              }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{n.titulo}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{n.corpo}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={() => { onClose(); setTimeout(() => navigate('/configuracoes'), 0); }}
          style={{ fontSize: '12px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          Gerenciar notificações
        </button>
      </div>
    </div>
  );
}

export default function Topbar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const { unread } = useNotificacoes();
  const [showNotif, setShowNotif] = useState(false);

  if (!user) return null;

  const initials = user.login.slice(0, 2).toUpperCase();
  const isDark = theme === 'dark';

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between shrink-0 bg-surface-container-lowest"
      style={{ height: '64px', padding: '0 24px', borderBottom: '1px solid var(--color-border)' }}
    >
      {/* ── Search ── */}
      <div className="relative" style={{ width: '300px' }}>
        <Search
          size={15}
          className="absolute text-text-muted pointer-events-none"
          style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Pesquisar... (⌘K)"
          readOnly
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className="w-full text-text-primary placeholder:text-text-muted cursor-pointer focus:outline-none transition-all duration-150"
          style={{
            padding: '9px 14px 9px 36px',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid var(--color-border-light)',
            background: 'var(--color-surface-container-lowest)',
            boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
          }}
        />
      </div>

      {/* ── Right ── */}
      <div className="flex items-center" style={{ gap: '4px' }}>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Modo claro' : 'Modo escuro'}
          className="flex items-center justify-center rounded-lg text-text-muted transition-all duration-150"
          style={{ width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          <span
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '8px',
              background: isDark ? 'rgba(59,130,246,0.12)' : 'var(--color-surface-container)',
              color: isDark ? 'var(--color-primary)' : 'var(--color-text-muted)',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={1.75} />}
          </span>
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotif(v => !v)}
            className="relative flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-container hover:text-text-secondary transition-all duration-150"
            style={{ width: '40px', height: '40px' }}
          >
            <Bell size={17} strokeWidth={1.75} />
            {unread > 0 && (
              <span
                className="absolute bg-danger rounded-full flex items-center justify-center text-white"
                style={{
                  minWidth: unread > 9 ? '16px' : '14px',
                  height: '14px',
                  top: '7px',
                  right: '7px',
                  fontSize: '9px',
                  fontWeight: 700,
                  lineHeight: 1,
                  padding: '0 3px',
                  border: '1.5px solid var(--color-surface-container-lowest)',
                }}
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
            {unread === 0 && (
              <span
                className="absolute bg-danger rounded-full"
                style={{ width: '7px', height: '7px', top: '10px', right: '10px', border: '1.5px solid var(--color-surface-container-lowest)' }}
              />
            )}
          </button>
          {showNotif && <NotifDropdown onClose={() => setShowNotif(false)} />}
        </div>

        {/* Settings (Master only) */}
        {temAcesso(user.cargo, 'configuracoes') && (
          <button
            onClick={() => navigate('/configuracoes')}
            className="flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-container hover:text-text-secondary transition-all duration-150"
            style={{ width: '40px', height: '40px' }}
          >
            <Settings size={17} strokeWidth={1.75} />
          </button>
        )}

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 8px' }} />

        {/* Profile */}
        <button
          onClick={() => navigate('/configuracoes')}
          className="flex items-center hover:opacity-85 transition-opacity"
          style={{ gap: '10px', padding: '4px 6px 4px 4px', borderRadius: '8px' }}
        >
          <div
            className="rounded-full bg-primary flex items-center justify-center text-white font-semibold shrink-0"
            style={{ width: '34px', height: '34px', fontSize: '12px' }}
          >
            {initials}
          </div>
          <div className="text-left hidden md:block" style={{ lineHeight: 1 }}>
            <p className="font-semibold text-text-primary" style={{ fontSize: '13px' }}>{user.login}</p>
            <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>{user.cargo}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
