import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, Factory, Package, Truck, DollarSign,
  Users, Settings, HardHat, ShoppingCart, Wrench, FileText,
  CheckSquare, Receipt, BarChart3, ArrowRight,
} from 'lucide-react';
import { temAcesso } from '../../lib/permissions';
import { getCurrentUser } from '../../lib/storage';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
  group: string;
  keywords?: string[];
}

const ALL_COMMANDS: Command[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Visão geral executiva', icon: LayoutDashboard, path: '/', group: 'Navegação', keywords: ['inicio', 'home'] },
  { id: 'fabricacao', label: 'Controle de Fabricação', description: 'Painel de produção', icon: Factory, path: '/fabrica/controle', group: 'Fábrica' },
  { id: 'historico-producao', label: 'Histórico de Produção', icon: BarChart3, path: '/fabrica/historico', group: 'Fábrica' },
  { id: 'carregamento-fabrica', label: 'Carregamento (Fábrica)', icon: Truck, path: '/fabrica/carregamento', group: 'Fábrica' },
  { id: 'estoque-pecas', label: 'Estoque de Peças', icon: Package, path: '/fabrica/estoque', group: 'Fábrica' },
  { id: 'solicitacao-fabricacao', label: 'Solicitação de Fabricação', description: 'Nova solicitação de peças', icon: FileText, path: '/obra/solicitacao-fabricacao', group: 'Obra', keywords: ['solicitar', 'pedir'] },
  { id: 'carregamento-obra', label: 'Carregamento de Obra', icon: Truck, path: '/obra/carregamento', group: 'Obra' },
  { id: 'paineis-montados', label: 'Painéis Montados', icon: CheckSquare, path: '/obra/paineis-montados', group: 'Obra' },
  { id: 'visao-obras', label: 'Visão Geral de Obras', icon: HardHat, path: '/obra/visao-geral', group: 'Obra' },
  { id: 'solicitacoes-compra', label: 'Solicitações de Compra', icon: ShoppingCart, path: '/compras/solicitacoes', group: 'Compras', keywords: ['comprar', 'solicitar'] },
  { id: 'estoque-materiais', label: 'Estoque de Materiais', icon: Package, path: '/compras/estoque', group: 'Compras' },
  { id: 'ferramentas', label: 'Rastreio de Ferramentas', icon: Wrench, path: '/compras/ferramentas', group: 'Compras' },
  { id: 'contas-pagar', label: 'Contas a Pagar', icon: Receipt, path: '/financeiro/contas-pagar', group: 'Financeiro' },
  { id: 'lancamentos', label: 'Lançamentos Financeiros', icon: DollarSign, path: '/financeiro/lancamentos', group: 'Financeiro' },
  { id: 'funcionarios', label: 'Lista de Funcionários', icon: Users, path: '/rh/funcionarios', group: 'RH' },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, path: '/configuracoes', group: 'Sistema' },
];

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)', fontWeight: 600, borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const commands = ALL_COMMANDS.filter(cmd => {
      if (user && !temAcesso(user.cargo, cmd.path.slice(1))) return false;
      if (!q) return true;
      return (
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.group.toLowerCase().includes(q) ||
        cmd.keywords?.some(k => k.includes(q))
      );
    });
    return commands;
  }, [query, user]);

  // Group
  const groups = useMemo(() => {
    const map = new Map<string, Command[]>();
    filtered.forEach(cmd => {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group)!.push(cmd);
    });
    return map;
  }, [filtered]);

  const flatList = filtered;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const cmd = flatList[activeIdx];
      if (cmd) { navigate(cmd.path); setOpen(false); }
    }
  };

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  let globalIdx = 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 16px 16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          boxShadow: '0px 8px 8px -4px rgba(16,24,40,0.03), 0px 20px 24px -4px rgba(16,24,40,0.1)',
          overflow: 'hidden',
          animation: 'cmdmenu-enter 0.18s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar páginas e ações..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              color: 'var(--color-text-primary)',
              background: 'transparent',
            }}
          />
          <kbd style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-surface)', fontFamily: 'inherit' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Nenhum resultado para "{query}"
            </div>
          ) : (
            Array.from(groups.entries()).map(([group, cmds]) => (
              <div key={group} style={{ marginBottom: '4px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '6px 10px 4px' }}>
                  {group}
                </p>
                {cmds.map(cmd => {
                  const idx = globalIdx++;
                  const isActive = idx === activeIdx;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      data-active={isActive}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => { navigate(cmd.path); setOpen(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 10px',
                        borderRadius: '8px',
                        background: isActive ? 'var(--color-primary-bg)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive ? 'var(--color-primary-light)' : 'var(--color-surface-container)',
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      }}>
                        <Icon size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {highlight(cmd.label, query)}
                        </p>
                        {cmd.description && (
                          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                            {cmd.description}
                          </p>
                        )}
                      </div>
                      {isActive && <ArrowRight size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {[
            { keys: ['↑', '↓'], label: 'navegar' },
            { keys: ['↵'], label: 'selecionar' },
            { keys: ['Esc'], label: 'fechar' },
          ].map(({ keys, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {keys.map(k => (
                <kbd key={k} style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-surface)', fontFamily: 'inherit' }}>
                  {k}
                </kbd>
              ))}
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes cmdmenu-enter {
          from { transform: scale(0.96) translateY(-8px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
