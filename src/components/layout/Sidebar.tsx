import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Factory, DollarSign, Settings, History,
  Package, BarChart3, FileText, CheckCircle, Landmark,
  ChevronDown, LogOut, Info, Shield, HardHat, Truck, Receipt, CheckSquare,
  ShoppingCart, Activity, Database, Wrench,
  Users, UserPlus, UserCog, PanelLeftClose,
} from 'lucide-react';
import { getMenuFiltrado, type MenuItem } from '../../lib/permissions';
import { clearCurrentUser, getCurrentUser } from '../../lib/storage';
import { clearAuth } from '../../lib/api';
import { useSidebar } from '../../contexts/SidebarContext';
import iconLogo from '../../assets/icon-logo.png';

const iconMap: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  LayoutDashboard, Factory, DollarSign, Settings, History,
  Package, BarChart3, FileText, CheckCircle, Landmark,
  Shield, HardHat, Truck, Receipt, CheckSquare,
  ShoppingCart, Activity, Database, Wrench,
  Users, UserPlus, UserCog,
};

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const C = iconMap[name] || Settings;
  return <C size={size} strokeWidth={1.75} />;
}

const S = {
  bg:          'var(--color-surface)',
  bgLowest:    'var(--color-surface-container-lowest)',
  border:      'var(--color-border)',
  borderLight: 'var(--color-border-light)',
  textPrimary: 'var(--color-text-primary)',
  textSecondary:'var(--color-text-secondary)',
  textMuted:   'var(--color-text-muted)',
  primary:     'var(--color-primary)',
  primaryBg:   'var(--color-primary-bg)',
  primaryLight:'var(--color-primary-light)',
  iconBg:      'var(--color-surface-container)',
  iconBgActive:'var(--color-primary-light)',
  activeText:  'var(--color-primary-dark)',
  brandBg:     'var(--color-sidebar-brand)', /* always dark in both themes */
} as const;

/* Tooltip flyout para collapsed mode */
function CollapsedTooltip({ label, children: childItems, path, onNavigate }: {
  label: string;
  children?: MenuItem[];
  path?: string;
  onNavigate: (p: string) => void;
}) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {show && (
        <div
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: '12px',
            zIndex: 300,
            background: S.bgLowest,
            border: `1px solid ${S.border}`,
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            minWidth: '160px',
            padding: '6px',
            pointerEvents: 'auto',
          }}
        >
          {/* Arrow */}
          <div style={{
            position: 'absolute', left: '-5px', top: '50%', transform: 'translateY(-50%)',
            width: '10px', height: '10px', background: S.bgLowest,
            border: `1px solid ${S.border}`, borderRight: 'none', borderTop: 'none',
            rotate: '45deg',
          }} />
          <p style={{ fontSize: '11px', fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px 6px' }}>
            {label}
          </p>
          {childItems ? childItems.map(child => (
            <button
              key={child.id}
              onClick={() => child.path && onNavigate(child.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '8px 10px', borderRadius: '7px', fontSize: '13px', fontWeight: 500,
                color: S.textSecondary, background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left',
              }}
              className="hover:bg-gray-50 transition-colors"
            >
              {child.label}
            </button>
          )) : path && (
            <button
              onClick={() => onNavigate(path)}
              style={{
                display: 'flex', width: '100%', padding: '8px 10px', borderRadius: '7px',
                fontSize: '13px', fontWeight: 500, color: S.textSecondary,
                background: 'none', border: 'none', cursor: 'pointer',
              }}
              className="hover:bg-gray-50 transition-colors"
            >
              Abrir
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const { collapsed, toggleCollapsed } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  if (!user) return null;

  const menuItems = getMenuFiltrado(user.cargo);

  // Separate footer items from main nav
  const FOOTER_IDS = ['configuracoes', 'usuarios'];
  const mainItems = menuItems.filter(i => !FOOTER_IDS.includes(i.id));
  const footerItems = menuItems.filter(i => FOOTER_IDS.includes(i.id));

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isActive = (path?: string) => path && location.pathname === path;
  const isGroupActive = (item: MenuItem) =>
    item.children?.some(child => child.path && location.pathname === child.path);

  const handleLogout = () => {
    clearCurrentUser();
    clearAuth();
    navigate('/login');
  };

  const initials = user.login.slice(0, 2).toUpperCase();

  // ── COLLAPSED ──────────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside
        className="sidebar-transition flex flex-col h-screen overflow-visible"
        style={{
          width: '64px',
          minWidth: '64px',
          background: S.bg,
          borderRight: `1px solid ${S.border}`,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '18px 0', display: 'flex', justifyContent: 'center', borderBottom: `1px solid ${S.border}` }}>
          <button
            onClick={toggleCollapsed}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: S.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', flexShrink: 0,
            }}
            title="Expandir menu"
          >
            <img src={iconLogo} alt="CBH" style={{ width: '22px', height: '22px', objectFit: 'contain', filter: 'brightness(10)' }} />
          </button>
        </div>

        {/* Nav icons */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'visible', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
          {mainItems.map(item => {
            const active = item.children ? isGroupActive(item) : isActive(item.path);
            return (
              <div key={item.id} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => item.path ? navigate(item.path) : undefined}
                  title={item.label}
                  style={{
                    width: '40px', height: '40px', borderRadius: '9px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? S.primaryBg : 'none',
                    color: active ? S.primary : S.textMuted,
                    border: active ? `1px solid ${S.primaryLight}` : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-gray-100 hover:text-gray-700 transition-all"
                >
                  <Icon name={item.icon} size={17} />
                </button>
                <CollapsedTooltip
                  label={item.label}
                  children={item.children}
                  path={item.path}
                  onNavigate={navigate}
                />
              </div>
            );
          })}

          {/* Section label */}
          {mainItems.length > 0 && (
            <div style={{ width: '32px', height: '1px', background: S.border, margin: '8px 0' }} />
          )}

          {footerItems.map(item => (
            <div key={item.id} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => item.path && navigate(item.path)}
                title={item.label}
                style={{
                  width: '40px', height: '40px', borderRadius: '9px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive(item.path) ? S.primaryBg : 'none',
                  color: isActive(item.path) ? S.primary : S.textMuted,
                  border: '1px solid transparent',
                  cursor: 'pointer',
                }}
                className="hover:bg-gray-100 hover:text-gray-700 transition-all"
              >
                <Icon name={item.icon} size={17} />
              </button>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${S.border}`, padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleLogout}
            title="Sair"
            style={{ width: '40px', height: '40px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted }}
            className="hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut size={17} strokeWidth={1.75} />
          </button>
          {/* Avatar */}
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: S.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
            {initials}
          </div>
        </div>
      </aside>
    );
  }

  // ── EXPANDED ───────────────────────────────────────────────────
  return (
    <aside
      className="sidebar-transition flex flex-col h-screen"
      style={{
        width: '240px',
        minWidth: '240px',
        background: S.bg,
        borderRight: `1px solid ${S.border}`,
      }}
    >
      {/* ── Brand ── */}
      <div
        style={{
          padding: '16px 16px 14px',
          borderBottom: `1px solid ${S.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px', background: S.brandBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <img src={iconLogo} alt="CBH" style={{ width: '20px', height: '20px', objectFit: 'contain', filter: 'brightness(10)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: S.textPrimary, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              CBH
            </p>
            <p style={{ fontSize: '10px', color: S.textMuted, fontWeight: 500, letterSpacing: '0.04em' }}>
              Construction Hub
            </p>
          </div>
        </div>
        <button
          onClick={toggleCollapsed}
          style={{
            width: '28px', height: '28px', borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, flexShrink: 0,
          }}
          className="hover:bg-gray-200 hover:text-gray-600 transition-all"
          title="Recolher menu"
        >
          <PanelLeftClose size={15} strokeWidth={1.75} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {mainItems.map((item, idx) => {
            const groupActive = item.children ? isGroupActive(item) : false;
            const itemActive = isActive(item.path);
            const isExpanded = expandedMenus.has(item.id) || !!groupActive;

            // Section header label for grouped items (first item of a new "section")
            const prevItem = mainItems[idx - 1];
            const showSectionDivider = idx > 0 && !!item.children !== !!prevItem?.children;

            return (
              <div key={item.id}>
                {showSectionDivider && (
                  <div style={{ height: '1px', background: S.bg, margin: '6px 4px' }} />
                )}

                {item.children ? (
                  <div>
                    {/* Group header */}
                    <button
                      onClick={() => toggleMenu(item.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '7px 10px', borderRadius: '8px',
                        background: groupActive ? S.primaryBg : 'none',
                        color: groupActive ? S.activeText : S.textSecondary,
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                      className={`transition-all ${!groupActive ? 'hover:bg-gray-100' : ''}`}
                    >
                      <span style={{
                        width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: groupActive ? S.iconBgActive : S.iconBg,
                        color: groupActive ? S.primary : S.textMuted,
                      }}>
                        <Icon name={item.icon} size={14} />
                      </span>
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em' }}>
                        {item.label}
                      </span>
                      <ChevronDown
                        size={13}
                        strokeWidth={2}
                        style={{
                          color: S.textMuted,
                          transition: 'transform 0.2s',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          flexShrink: 0,
                        }}
                      />
                    </button>

                    {/* Children */}
                    {isExpanded && (
                      <div style={{ paddingLeft: '16px', marginTop: '1px', marginBottom: '2px' }}>
                        {/* Vertical line */}
                        <div style={{ borderLeft: `1px solid ${S.border}`, paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          {item.children.map(child => {
                            const childActive = isActive(child.path);
                            return (
                              <button
                                key={child.id}
                                onClick={() => child.path && navigate(child.path)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                  padding: '6px 10px', borderRadius: '7px', width: '100%',
                                  fontSize: '13px',
                                  fontWeight: childActive ? 600 : 400,
                                  color: childActive ? S.activeText : S.textMuted,
                                  background: childActive ? S.primaryBg : 'none',
                                  border: 'none', cursor: 'pointer', textAlign: 'left',
                                }}
                                className={`transition-all ${!childActive ? 'hover:bg-gray-100 hover:text-gray-700' : ''}`}
                              >
                                {/* Active indicator dot */}
                                <span style={{
                                  width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                                  background: childActive ? S.primary : S.border,
                                }} />
                                {child.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => item.path && navigate(item.path)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 10px', borderRadius: '8px',
                      background: itemActive ? S.primaryBg : 'none',
                      color: itemActive ? S.activeText : S.textSecondary,
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    className={`transition-all ${!itemActive ? 'hover:bg-gray-100' : ''}`}
                  >
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: itemActive ? S.iconBgActive : S.iconBg,
                      color: itemActive ? S.primary : S.textMuted,
                    }}>
                      <Icon name={item.icon} size={14} />
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: itemActive ? 600 : 500, letterSpacing: '-0.01em' }}>
                      {item.label}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div style={{ borderTop: `1px solid ${S.border}`, padding: '10px' }}>
        {/* Footer nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '8px' }}>
          {footerItems.map(item => {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => item.path && navigate(item.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 10px', borderRadius: '8px',
                  background: active ? S.primaryBg : 'none',
                  color: active ? S.activeText : S.textMuted,
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                className="hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                <span style={{
                  width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? S.iconBgActive : 'none',
                  color: active ? S.primary : S.textMuted,
                }}>
                  <Icon name={item.icon} size={14} />
                </span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: active ? S.activeText : S.textMuted }}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Info (static) */}
          <button
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 10px', borderRadius: '8px',
              background: 'none', border: 'none', cursor: 'default', textAlign: 'left',
              color: S.textMuted,
            }}
          >
            <span style={{ width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.textMuted }}>
              <Info size={14} strokeWidth={1.75} />
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: S.textMuted }}>
              CBH v2.3
            </span>
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: S.border, marginBottom: '8px' }} />

        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: S.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: S.textPrimary, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.login}
            </p>
            <p style={{ fontSize: '10px', color: S.textMuted, fontWeight: 500, marginTop: '1px' }}>
              {user.cargo}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            style={{
              width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted,
            }}
            className="hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
