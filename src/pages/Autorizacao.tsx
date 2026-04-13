import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Check, X, Shield, CheckCircle,
  FileText, AlertTriangle, Truck, Package, Wrench,
  ChevronRight, MapPin, User, Calendar,
} from 'lucide-react';
import { criarResumoSequenciaCarregamento } from '../lib/carregamento';
import { autorizacao as autorizacaoApi } from '../lib/api';
import type {
  Solicitacao,
  SolicitacaoCompra,
  Carregamento,
} from '../lib/types';

// ─── Types ─────────────────────────────────────────────────────────────────────
type TabKey = 'compras' | 'fabricacao' | 'logistica';
type ToastType = 'aprovado' | 'negado';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

// ─── Formatters ────────────────────────────────────────────────────────────────
const fmt = {
  currency: (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v),
  date: (d: string) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  },
};

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  border: '1px solid #e2e4e9',
  borderLight: '1px solid #f2f4f6',
  radius: { sm: '6px', md: '8px', lg: '10px' },
  text: { primary: '#191c1e', secondary: '#434655', muted: '#737686' },
  surface: { page: '#f7f9fb', card: '#ffffff', low: '#f2f4f6' },
  rust: { text: '#b45309', border: '#fde68a', bg: '#fff7ed', hover: '#fef3c7' },
  slate: { dark: '#0f172a', hover: '#1e293b' },
  blue: { text: '#004ac6', bg: '#eff6ff', border: '#dbe1ff' },
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toasts({ items }: { items: ToastItem[] }) {
  if (!items.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(t => (
        <div
          key={t.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px', borderRadius: C.radius.md,
            border: t.type === 'aprovado' ? '1px solid #bbf7d0' : '1px solid #fde68a',
            background: t.type === 'aprovado' ? '#f0fdf4' : '#fff7ed',
            color: t.type === 'aprovado' ? '#166534' : '#92400e',
            fontSize: 13, fontWeight: 600, minWidth: 280,
            animation: 'toastIn 0.2s ease',
          }}
        >
          {t.type === 'aprovado'
            ? <CheckCircle size={16} style={{ flexShrink: 0 }} />
            : <X size={16} style={{ flexShrink: 0 }} />}
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toastIn{from{transform:translateX(32px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

// ─── Sheet (drawer lateral) ────────────────────────────────────────────────────
function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(25,28,30,0.28)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.22s ease',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 460, zIndex: 101,
        background: '#fff',
        borderLeft: C.border,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: C.border,
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text.primary }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: C.radius.sm,
              border: C.border, background: 'transparent', cursor: 'pointer',
            }}
          >
            <X size={15} color={C.text.muted} />
          </button>
        </div>
        <div style={{ padding: 24, flex: 1 }}>{children}</div>
      </div>
    </>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function Empty({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 14, padding: '64px 0',
      border: C.border, borderRadius: C.radius.md, background: C.surface.page,
    }}>
      <CheckCircle size={52} color="#d1d5db" strokeWidth={1.25} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.text.primary }}>Tudo em dia!</p>
        <p style={{ fontSize: 13, color: C.text.muted, marginTop: 4 }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Decision bar ──────────────────────────────────────────────────────────────
function DecisionBar({ onNegar, onAprovar, sm }: {
  onNegar: () => void; onAprovar: () => void; sm?: boolean;
}) {
  const pad = sm ? '7px 14px' : '9px 20px';
  return (
    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); onNegar(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: pad, borderRadius: C.radius.sm,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          border: `1px solid ${C.rust.border}`,
          color: C.rust.text, background: 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = C.rust.hover)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <X size={13} /> Negar
      </button>
      <button
        onClick={e => { e.stopPropagation(); onAprovar(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: pad, borderRadius: C.radius.sm,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          border: `1px solid ${C.slate.dark}`,
          color: '#fff', background: C.slate.dark,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = C.slate.hover)}
        onMouseLeave={e => (e.currentTarget.style.background = C.slate.dark)}
      >
        <Check size={13} /> Aprovar
      </button>
    </div>
  );
}

// ─── Células de tabela ─────────────────────────────────────────────────────────
function Th({ children }: { children: string }) {
  return (
    <th style={{
      padding: '10px 16px', textAlign: 'left',
      fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: C.text.muted, whiteSpace: 'nowrap', background: C.surface.page,
    }}>
      {children}
    </th>
  );
}

function Td({ children, mono, bold, muted }: {
  children: React.ReactNode; mono?: boolean; bold?: boolean; muted?: boolean;
}) {
  return (
    <td style={{
      padding: '13px 16px', fontSize: 13,
      color: muted ? C.text.muted : C.text.primary,
      fontWeight: bold ? 700 : 400,
      fontVariantNumeric: mono ? 'tabular-nums' : undefined,
      verticalAlign: 'middle',
    }}>
      {children}
    </td>
  );
}

// ─── Tag de característica técnica ─────────────────────────────────────────────
function TechTag({ label }: { label: string }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontWeight: 700,
      background: '#e0e7ff', color: '#3730a3',
      border: '1px solid #c7d2fe',
    }}>
      {label}
    </span>
  );
}

// ─── Aba Compras ───────────────────────────────────────────────────────────────
function AbaCompras({
  items, dismissing,
  onNegar, onAprovar,
}: {
  items: SolicitacaoCompra[];
  dismissing: Set<number>;
  onNegar: (id: number) => void;
  onAprovar: (s: SolicitacaoCompra) => void;
}) {
  const [sheet, setSheet] = useState<SolicitacaoCompra | null>(null);

  if (!items.length) return <Empty label="Nenhuma autorização de compra pendente." />;

  const prioridadeColor = (p: string) =>
    p === 'Alta' ? { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }
    : p === 'Media' ? { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }
    : { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' };

  return (
    <>
      <div style={{ border: C.border, borderRadius: C.radius.md, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: C.border }}>
              <Th>Data</Th><Th>Solicitante</Th><Th>Obra</Th><Th>Material</Th><Th>Valor Total</Th><Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr
                key={s.id}
                onClick={() => setSheet(s)}
                style={{
                  borderBottom: C.borderLight, cursor: 'pointer',
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  opacity: dismissing.has(s.id) ? 0 : 1,
                  transform: dismissing.has(s.id) ? 'translateX(16px)' : 'none',
                }}
                onMouseEnter={e => { if (!dismissing.has(s.id)) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Td muted>{fmt.date(s.data)}</Td>
                <Td>{s.solicitante}</Td>
                <Td bold>{s.obraNome}</Td>
                <Td>{s.item}</Td>
                <td style={{ padding: '13px 16px', fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 13, verticalAlign: 'middle' }}>
                  {fmt.currency(s.valor)}
                </td>
                <td style={{ padding: '10px 16px', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DecisionBar sm onNegar={() => onNegar(s.id)} onAprovar={() => onAprovar(s)} />
                    <button
                      onClick={e => { e.stopPropagation(); setSheet(s); }}
                      title="Ver detalhes"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: C.radius.sm,
                        border: C.border, background: 'transparent', cursor: 'pointer',
                      }}
                    >
                      <ChevronRight size={14} color={C.text.muted} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet de detalhes */}
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title="Detalhes da Solicitação">
        {sheet && (() => {
          const pc = prioridadeColor(sheet.prioridade);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Cabeçalho */}
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: C.text.primary }}>{sheet.item}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`,
                  }}>
                    Prioridade {sheet.prioridade}
                  </span>
                </div>
              </div>

              {/* Metadados */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { icon: <MapPin size={13} />, label: 'Obra', value: sheet.obraNome },
                  { icon: <User size={13} />, label: 'Solicitante', value: sheet.solicitante },
                  { icon: <Calendar size={13} />, label: 'Data', value: fmt.date(sheet.data) },
                  { icon: null, label: 'Forma de Pagto.', value: sheet.pagamento || '—' },
                  { icon: null, label: 'Fornecedor', value: sheet.fornecedor || '—' },
                  { icon: null, label: 'Qtd / Un.', value: `${sheet.quantidade} ${sheet.unidade}` },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ padding: '10px 12px', borderRadius: C.radius.sm, border: C.border, background: C.surface.page }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      {icon && <span style={{ color: C.text.muted }}>{icon}</span>}
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text.muted }}>{label}</p>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text.primary }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Valor total em destaque */}
              <div style={{ padding: '14px 16px', borderRadius: C.radius.md, border: C.border, background: C.surface.page }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text.muted }}>Valor Total</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: C.text.primary, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt.currency(sheet.valor)}
                </p>
              </div>

              {/* Observações */}
              {sheet.observacoes && (
                <div style={{ padding: '12px 14px', borderRadius: C.radius.sm, border: C.border, background: C.surface.page }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text.muted, marginBottom: 6 }}>Observações</p>
                  <p style={{ fontSize: 13, color: C.text.secondary, lineHeight: 1.6 }}>{sheet.observacoes}</p>
                </div>
              )}

              {/* Cotação */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text.muted, marginBottom: 10 }}>
                  Cotação Anexada
                </p>
                {sheet.imagemOrcamento ? (
                  <img
                    src={sheet.imagemOrcamento}
                    alt="Cotação"
                    style={{ width: '100%', borderRadius: C.radius.sm, border: C.border, objectFit: 'contain', maxHeight: 280 }}
                  />
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 8, padding: '36px 0',
                    border: '1px dashed #d1d5db', borderRadius: C.radius.sm, background: C.surface.page,
                  }}>
                    <FileText size={32} color="#d1d5db" />
                    <p style={{ fontSize: 12, color: C.text.muted }}>Nenhum documento anexado</p>
                  </div>
                )}
              </div>

              {/* Decision bar no sheet */}
              <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: C.border, paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <DecisionBar
                  onNegar={() => { onNegar(sheet.id); setSheet(null); }}
                  onAprovar={() => { onAprovar(sheet); setSheet(null); }}
                />
              </div>
            </div>
          );
        })()}
      </Sheet>
    </>
  );
}

// ─── Aba Fabricação ────────────────────────────────────────────────────────────
function AbaFabricacao({
  items, dismissing, onNegar, onAprovar,
}: {
  items: Solicitacao[];
  dismissing: Set<number>;
  onNegar: (id: number) => void;
  onAprovar: (id: number) => void;
}) {
  if (!items.length) return <Empty label="Nenhuma solicitação de fabricação pendente." />;

  return (
    <div style={{ border: C.border, borderRadius: C.radius.md, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: C.border }}>
            <Th>Peça / Obra</Th><Th>Dimensões</Th><Th>Quantidade</Th><Th>Características</Th><Th>Solicitante</Th><Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {items.map(s => {
            const dims: string[] = [];
            if (s.paineis > 0) dims.push(`${s.painelComp}×${s.painelAlt}m`);
            if (s.pilares > 0) dims.push(`H ${s.pilarAlt}m`);
            if (s.sapatas > 0) dims.push(s.tamanhoSapata);

            const qtds: string[] = [];
            if (s.paineis > 0) qtds.push(`${s.paineis} painéis`);
            if (s.pilares > 0) qtds.push(`${s.pilares} pilares`);
            if (s.sapatas > 0) qtds.push(`${s.sapatas} sapatas`);

            const tags: string[] = [];
            if (s.tipoPainel) tags.push(s.tipoPainel === 'Liso' ? 'Acabamento Liso' : s.tipoPainel);
            if (s.raPainel) tags.push(`Malha ${s.raPainel}`);
            if (s.tipoSapata && s.sapatas > 0) tags.push(s.tipoSapata);

            return (
              <tr
                key={s.id}
                style={{
                  borderBottom: C.borderLight,
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  opacity: dismissing.has(s.id) ? 0 : 1,
                  transform: dismissing.has(s.id) ? 'translateX(16px)' : 'none',
                }}
              >
                <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text.primary }}>{s.obraNome}</p>
                  <p style={{ fontSize: 11, color: C.text.muted, marginTop: 2 }}>{fmt.date(s.dataSolicitacaoRegistro)}</p>
                </td>
                <Td mono>{dims.join(' / ') || '—'}</Td>
                <Td mono bold>{qtds.join(', ') || '—'}</Td>
                <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                  {tags.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tags.map(t => <TechTag key={t} label={t} />)}
                    </div>
                  ) : <span style={{ fontSize: 13, color: C.text.muted }}>—</span>}
                </td>
                <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                  <p style={{ fontSize: 13, color: C.text.primary }}>{s.solicitante}</p>
                  <p style={{ fontSize: 11, color: C.text.muted, marginTop: 2 }}>{s.cargoSolicitante}</p>
                </td>
                <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                  <DecisionBar sm onNegar={() => onNegar(s.id)} onAprovar={() => onAprovar(s.id)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Aba Logística ─────────────────────────────────────────────────────────────
function AbaLogistica({
  items, dismissing, onNegar, onAprovar,
}: {
  items: Carregamento[];
  dismissing: Set<number>;
  onNegar: (id: number) => void;
  onAprovar: (id: number) => void;
}) {
  if (!items.length) return <Empty label="Nenhum carregamento pendente de autorização." />;

  return (
    <div style={{ border: C.border, borderRadius: C.radius.md, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: C.border }}>
            <Th>Obra</Th><Th>Tipo de Veículo</Th><Th>Qtd. Painéis</Th><Th>Sequência de Carregamento</Th><Th>Solicitante</Th><Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {items.map(c => {
            const seq = criarResumoSequenciaCarregamento(c.paineis);

            return (
              <tr
                key={c.id}
                style={{
                  borderBottom: C.borderLight,
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  opacity: dismissing.has(c.id) ? 0 : 1,
                  transform: dismissing.has(c.id) ? 'translateX(16px)' : 'none',
                }}
              >
                <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text.primary }}>{c.obraNome}</p>
                  <p style={{ fontSize: 11, color: C.text.muted, marginTop: 2 }}>{fmt.date(c.dataSolicitacao)}</p>
                </td>
                <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Truck size={14} color={C.text.muted} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text.primary }}>{c.veiculo}</span>
                  </div>
                </td>
                <Td mono bold>{c.paineis.length}</Td>
                <td style={{ padding: '13px 16px', verticalAlign: 'middle', maxWidth: 280 }}>
                  <code style={{
                    display: 'block', fontSize: 11, color: C.text.secondary,
                    background: C.surface.low, border: C.border,
                    padding: '4px 8px', borderRadius: 4,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {seq || '—'}
                  </code>
                </td>
                <Td>{c.solicitante}</Td>
                <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                  <DecisionBar sm onNegar={() => onNegar(c.id)} onAprovar={() => onAprovar(c.id)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function Autorizacao() {
  const [activeTab, setActiveTab] = useState<TabKey>('compras');
  const [dismissing, setDismissing] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  const [compras, setCompras] = useState<SolicitacaoCompra[]>([]);
  const [fabricacoes, setFabricacoes] = useState<Solicitacao[]>([]);
  const [logistica, setLogistica] = useState<Carregamento[]>([]);

  const carregarDados = useCallback(() => {
    autorizacaoApi.compras().then(setCompras).catch(() => {});
    autorizacaoApi.fabricacao().then(setFabricacoes).catch(() => {});
    autorizacaoApi.logistica().then(setLogistica).catch(() => {});
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const total = compras.length + fabricacoes.length + logistica.length;

  // Toast
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);

  // Dismiss animado — espera 320ms para remover do DOM e recarregar
  const dismiss = useCallback((id: number, action: () => Promise<unknown>, msg: ToastItem) => {
    setDismissing(prev => new Set(prev).add(id));
    addToast(msg.type, msg.message);
    action().finally(() => {
      setTimeout(() => {
        setDismissing(prev => { const s = new Set(prev); s.delete(id); return s; });
        carregarDados();
      }, 320);
    });
  }, [addToast, carregarDados]);

  // ── Handlers Compras ─────────────────────────────────────────────────────────
  const handleNegarCompra = useCallback((id: number) => {
    dismiss(id, () => autorizacaoApi.negarCompra(id),
      { id: 0, type: 'negado', message: 'Solicitação de compra negada.' });
  }, [dismiss]);

  const handleAprovarCompra = useCallback((s: SolicitacaoCompra) => {
    dismiss(s.id, () => autorizacaoApi.aprovarCompra(s.id),
      { id: 0, type: 'aprovado', message: `Compra de "${s.item}" aprovada e enviada ao financeiro.` });
  }, [dismiss]);

  // ── Handlers Fabricação ──────────────────────────────────────────────────────
  const handleNegarFab = useCallback((id: number) => {
    dismiss(id, () => autorizacaoApi.negarFabricacao(id),
      { id: 0, type: 'negado', message: 'Solicitação de fabricação negada.' });
  }, [dismiss]);

  const handleAprovarFab = useCallback((id: number) => {
    dismiss(id, () => autorizacaoApi.aprovarFabricacao(id),
      { id: 0, type: 'aprovado', message: 'Solicitação de fabricação aprovada.' });
  }, [dismiss]);

  // ── Handlers Logística ───────────────────────────────────────────────────────
  const handleNegarLog = useCallback((id: number) => {
    dismiss(id, () => autorizacaoApi.negarLogistica(id),
      { id: 0, type: 'negado', message: 'Carregamento negado.' });
  }, [dismiss]);

  const handleAprovarLog = useCallback((id: number) => {
    dismiss(id, () => autorizacaoApi.aprovarLogistica(id),
      { id: 0, type: 'aprovado', message: 'Carregamento autorizado com sucesso.' });
  }, [dismiss]);

  // ── Tabs config ──────────────────────────────────────────────────────────────
  const TABS: { key: TabKey; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'compras',    label: 'Compras',    count: compras.length,    icon: <Package size={14} /> },
    { key: 'fabricacao', label: 'Fabricação', count: fabricacoes.length, icon: <Wrench size={14} /> },
    { key: 'logistica',  label: 'Logística',  count: logistica.length,  icon: <Truck size={14} /> },
  ];

  return (
    <div>

      {/* ── Page header ── */}
      <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text.muted, marginBottom: 8 }}>
        Sistema · Controle de Acesso
      </p>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: C.radius.lg,
            background: C.blue.bg, border: `1px solid ${C.blue.border}`,
          }}>
            <Shield size={22} color={C.blue.text} />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text.primary, lineHeight: 1.2 }}>
              Central de Autorizações
            </h1>
            <p style={{ fontSize: 13, color: C.text.muted, marginTop: 3 }}>
              Perfil Master · Aprovações pendentes de Compras, Fabricação e Logística
            </p>
          </div>
        </div>

        {total > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: C.radius.md,
            border: `1px solid ${C.rust.border}`, background: C.rust.bg,
          }}>
            <AlertTriangle size={15} color={C.rust.text} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.rust.text }}>
              {total} pendência{total !== 1 ? 's' : ''} aguardando decisão
            </span>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: C.border, marginBottom: 20 }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                borderBottom: active ? '2px solid #004ac6' : '2px solid transparent',
                background: 'transparent', marginBottom: -1,
                color: active ? C.blue.text : C.text.muted,
                transition: 'color 0.12s, border-color 0.12s',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999,
                  fontSize: 10, fontWeight: 800,
                  background: active ? C.blue.text : C.rust.hover,
                  color: active ? '#fff' : C.rust.text,
                  border: `1px solid ${active ? C.blue.text : C.rust.border}`,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'compras' && (
        <AbaCompras
          items={compras} dismissing={dismissing}
          onNegar={handleNegarCompra} onAprovar={handleAprovarCompra}
        />
      )}
      {activeTab === 'fabricacao' && (
        <AbaFabricacao
          items={fabricacoes} dismissing={dismissing}
          onNegar={handleNegarFab} onAprovar={handleAprovarFab}
        />
      )}
      {activeTab === 'logistica' && (
        <AbaLogistica
          items={logistica} dismissing={dismissing}
          onNegar={handleNegarLog} onAprovar={handleAprovarLog}
        />
      )}

      <Toasts items={toasts} />
    </div>
  );
}
