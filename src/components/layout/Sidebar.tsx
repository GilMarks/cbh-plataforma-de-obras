import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Factory, DollarSign, Settings, History,
  Package, BarChart3, FileText, CheckCircle, Landmark,
  ChevronRight, LogOut, ChevronsLeft, ChevronsRight,
  Shield, HardHat, Truck, Receipt, CheckSquare,
  ShoppingCart, Activity, Database, Wrench,
  Users, UserPlus, UserCog,
} from 'lucide-react';
import { getMenuFiltrado, type MenuItem } from '../../lib/permissions';
import { clearCurrentUser, getCurrentUser } from '../../lib/storage';
import { clearAuth } from '../../lib/api';
import { useSidebar } from '../../contexts/SidebarContext';
import iconLogo from '../../assets/icon-logo.png';

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutDashboard, Factory, DollarSign, Settings, History,
  Package, BarChart3, FileText, CheckCircle, Landmark,
  Shield, HardHat, Truck, Receipt, CheckSquare,
  ShoppingCart, Activity, Database, Wrench,
  Users, UserPlus, UserCog,
};

function MenuIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = iconMap[name] || Settings;
  return <Icon size={size} />;
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const { collapsed, toggleCollapsed } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  if (!user) return null;

  const menuItems = getMenuFiltrado(user.cargo);

  const toggleMenu = (id: string) => {
    if (collapsed) {
      toggleCollapsed();
      setExpandedMenus(new Set([id]));
      return;
    }
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  return (
    <aside
      className="sidebar-transition flex flex-col h-screen bg-surface-container-low overflow-hidden"
      style={{
        width: collapsed ? '80px' : '272px',
        minWidth: collapsed ? '80px' : '272px',
      }}
    >
      {/* ── Brand ── */}
      <div
        className="flex items-center shrink-0"
        style={{
          padding: collapsed ? '28px 20px 20px 20px' : '28px 24px 20px 24px',
          gap: '14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <img
          src={iconLogo}
          alt="CBH"
          className="object-contain"
          style={{ height: '40px', width: '40px', flexShrink: 0 }}
        />
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <h2
              className="font-extrabold text-text-primary leading-none tracking-tight"
              style={{ fontSize: '18px' }}
            >
              CBH
            </h2>
            <p
              className="text-text-muted font-medium uppercase tracking-widest"
              style={{ fontSize: '10px', marginTop: '4px' }}
            >
              Construction Hub
            </p>
          </div>
        )}
      </div>

      {/* ── Separador ── */}
      <div
        className="bg-surface-container-high"
        style={{ height: '1px', margin: collapsed ? '0 16px' : '0 24px', opacity: 0.5 }}
      />

      {/* ── Toggle Button ── */}
      <div style={{ padding: collapsed ? '12px 16px' : '12px 16px' }}>
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center rounded-lg text-text-muted hover:bg-surface-container-high/60 hover:text-text-secondary transition-all duration-150"
          style={{
            padding: '10px 16px',
            gap: '12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          {!collapsed && (
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>
              Recolher
            </span>
          )}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{ padding: collapsed ? '16px 12px' : '16px 16px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {menuItems.map(item => (
            <div key={item.id}>
              {item.children ? (
                <>
                  {/* Menu pai com filhos */}
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`
                      w-full flex items-center rounded-lg
                      font-medium transition-all duration-150
                      ${isGroupActive(item)
                        ? 'bg-primary-bg text-primary font-bold'
                        : 'text-text-secondary hover:bg-surface-container-high/60'}
                    `}
                    style={{
                      padding: collapsed ? '14px 0' : '14px 16px',
                      gap: '12px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <MenuIcon name={item.icon} />
                    {!collapsed && (
                      <>
                        <span
                          className="flex-1 text-left font-bold uppercase tracking-wider"
                          style={{ fontSize: '11px', overflow: 'hidden', whiteSpace: 'nowrap' }}
                        >
                          {item.label}
                        </span>
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-200 ${
                            expandedMenus.has(item.id) || isGroupActive(item) ? 'rotate-90' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {/* Submenus — hidden quando collapsed */}
                  {!collapsed && (expandedMenus.has(item.id) || isGroupActive(item)) && (
                    <div
                      style={{
                        marginLeft: '20px',
                        marginTop: '6px',
                        paddingLeft: '16px',
                        borderLeft: '2px solid var(--color-surface-container-high)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => child.path && navigate(child.path)}
                          className={`
                            w-full flex items-center rounded-lg
                            transition-all duration-150
                            ${isActive(child.path)
                              ? 'bg-primary-bg text-primary font-bold'
                              : 'text-text-muted hover:bg-surface-container-high/60 hover:text-text-secondary'}
                          `}
                          style={{ padding: '12px 14px', gap: '10px' }}
                        >
                          <MenuIcon name={child.icon} size={16} />
                          <span style={{ fontSize: '12px', overflow: 'hidden', whiteSpace: 'nowrap' }} className="font-medium">
                            {child.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Menu item simples (sem filhos) */
                <button
                  onClick={() => item.path && navigate(item.path)}
                  className={`
                    w-full flex items-center rounded-lg
                    transition-all duration-150
                    ${isActive(item.path)
                      ? 'bg-primary-bg text-primary font-bold'
                      : 'text-text-secondary hover:bg-surface-container-high/60'}
                  `}
                  style={{
                    padding: collapsed ? '14px 0' : '14px 16px',
                    gap: '12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <MenuIcon name={item.icon} />
                  {!collapsed && (
                    <span
                      className="font-bold uppercase tracking-wider"
                      style={{ fontSize: '11px', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* ── Separador ── */}
      <div
        className="bg-surface-container-high"
        style={{ height: '1px', margin: collapsed ? '0 16px' : '0 24px', opacity: 0.5 }}
      />

      {/* ── Profile + Logout Group (base) ── */}
      <div
        className="shrink-0"
        style={{
          padding: collapsed ? '16px 10px' : '16px 12px',
        }}
      >
        <div
          style={{
            background: 'rgba(230, 232, 234, 0.3)',
            borderRadius: '12px',
            padding: collapsed ? '16px 8px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: collapsed ? '12px' : '0',
          }}
        >
          {/* Profile row */}
          <div
            className="flex items-center"
            style={{
              gap: '12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <div
              className="rounded-lg bg-primary flex items-center justify-center text-white font-bold shrink-0"
              style={{
                width: collapsed ? '36px' : '40px',
                height: collapsed ? '36px' : '40px',
                fontSize: collapsed ? '14px' : '15px',
                borderRadius: '10px',
              }}
            >
              {user.login.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <p
                  className="font-bold text-text-primary uppercase tracking-wider truncate"
                  style={{ fontSize: '12px' }}
                >
                  {user.login}
                </p>
                <p
                  className="text-text-muted font-medium uppercase truncate"
                  style={{ fontSize: '10px', marginTop: '2px' }}
                >
                  {user.cargo}
                </p>
              </div>
            )}
          </div>

          {/* Separador sutil dentro do grupo */}
          {!collapsed && (
            <div
              className="bg-surface-container-high"
              style={{ height: '1px', margin: '12px 0', opacity: 0.4 }}
            />
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center rounded-lg text-text-muted hover:bg-surface-container-high/60 hover:text-danger transition-all duration-150"
            style={{
              padding: collapsed ? '10px 0' : '10px 12px',
              gap: '10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut size={16} />
            {!collapsed && (
              <span className="font-bold uppercase tracking-wider" style={{ fontSize: '11px' }}>
                Sair
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
