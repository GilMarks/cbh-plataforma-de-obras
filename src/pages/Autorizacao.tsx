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

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toasts({ items }: { items: ToastItem[] }) {
  if (!items.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(t => (
        <div
          key={t.id}
          className={
            t.type === 'aprovado'
              ? 'bg-success-bg text-success-text'
              : 'bg-warning-bg text-warning-text'
          }
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px', borderRadius: '8px',
            border: t.type === 'aprovado'
              ? '1px solid var(--color-success-bright)'
              : '1px solid var(--color-warning-bright)',
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
          background: 'rgba(0,0,0,0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.22s ease',
        }}
      />
      <div
        className="bg-surface-container-lowest"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 460, zIndex: 101,
          borderLeft: '1px solid var(--color-border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div
          className="bg-surface-container-lowest"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid var(--color-border)',
            position: 'sticky', top: 0, zIndex: 1,
          }}
        >
          <span className="text-text-primary" style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: '6px',
              border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer',
            }}
          >
            <X size={15} className="text-text-muted" />
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
    <div
      className="bg-surface"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 14, padding: '64px 0',
        border: '1px solid var(--color-border)', borderRadius: '8px',
      }}
    >
      <CheckCircle size={52} className="text-text-muted" style={{ opacity: 0.4 }} strokeWidth={1.25} />
      <div style={{ textAlign: 'center' }}>
        <p className="text-text-primary" style={{ fontSize: 15, fontWeight: 700 }}>Tudo em dia!</p>
        <p className="text-text-muted" style={{ fontSize: 13, marginTop: 4 }}>{label}</p>
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
        className="bg-danger text-white hover:opacity-90 transition-all"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: pad, borderRadius: '6px',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          border: 'none',
        }}
      >
        <X size={13} /> Negar
      </button>
      <button
        onClick={e => { e.stopPropagation(); onAprovar(); }}
        className="bg-primary text-white hover:bg-primary-dark transition-all"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: pad, borderRadius: '6px',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          border: 'none',
        }}
      >
        <Check size={13} /> Aprovar
      </button>
    </div>
  );
}

// ─── Celulas de tabela ─────────────────────────────────────────────────────────
function Th({ children }: { children: string }) {
  return (
    <th
      className="text-text-muted bg-surface-container-low"
      style={{
        padding: '14px 24px', textAlign: 'left',
        fontSize: 11, fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, mono, bold, muted }: {
  children: React.ReactNode; mono?: boolean; bold?: boolean; muted?: boolean;
}) {
  return (
    <td
      className={muted ? 'text-text-muted' : 'text-text-primary'}
      style={{
        padding: '16px 24px', fontSize: 13,
        fontWeight: bold ? 700 : 400,
        fontVariantNumeric: mono ? 'tabular-nums' : undefined,
        verticalAlign: 'middle',
      }}
    >
      {children}
    </td>
  );
}

// ─── Tag de caracteristica tecnica ─────────────────────────────────────────────
function TechTag({ label }: { label: string }) {
  return (
    <span
      className="bg-info-bg text-info-text"
      style={{
        padding: '2px 8px', borderRadius: 4,
        fontSize: 10, fontWeight: 700,
        border: '1px solid var(--color-primary-fixed-dim)',
      }}
    >
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
    p === 'Alta' ? 'bg-danger-bg text-danger-text'
    : p === 'Media' ? 'bg-warning-bg text-warning-text'
    : 'bg-info-bg text-info-text';

  const prioridadeBorder = (p: string) =>
    p === 'Alta' ? '1px solid var(--color-danger-bright)'
    : p === 'Media' ? '1px solid var(--color-warning-bright)'
    : '1px solid var(--color-primary-fixed-dim)';

  return (
    <>
      <div
        className="bg-surface-container-lowest overflow-hidden"
        style={{ border: '1px solid var(--color-border)', borderRadius: '12px' }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <Th>Data</Th><Th>Solicitante</Th><Th>Obra</Th><Th>Material</Th><Th>Valor Total</Th><Th>Acoes</Th>
            </tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr
                key={s.id}
                onClick={() => setSheet(s)}
                className="hover:bg-table-hover transition-colors cursor-pointer"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  opacity: dismissing.has(s.id) ? 0 : 1,
                  transform: dismissing.has(s.id) ? 'translateX(16px)' : 'none',
                }}
              >
                <Td muted>{fmt.date(s.data)}</Td>
                <Td>{s.solicitante}</Td>
                <Td bold>{s.obraNome}</Td>
                <Td>{s.item}</Td>
                <td className="text-text-primary" style={{ padding: '16px 24px', fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 13, verticalAlign: 'middle' }}>
                  {fmt.currency(s.valor)}
                </td>
                <td style={{ padding: '10px 24px', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DecisionBar sm onNegar={() => onNegar(s.id)} onAprovar={() => onAprovar(s)} />
                    <button
                      onClick={e => { e.stopPropagation(); setSheet(s); }}
                      title="Ver detalhes"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: '6px',
                        border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer',
                      }}
                    >
                      <ChevronRight size={14} className="text-text-muted" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet de detalhes */}
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title="Detalhes da Solicitacao">
        {sheet && (() => {
          const pcClass = prioridadeColor(sheet.prioridade);
          const pcBorder = prioridadeBorder(sheet.prioridade);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Cabecalho */}
              <div>
                <p className="text-text-primary" style={{ fontSize: 20, fontWeight: 800 }}>{sheet.item}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span
                    className={pcClass}
                    style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                      border: pcBorder,
                    }}
                  >
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
                  <div
                    key={label}
                    className="bg-surface"
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      {icon && <span className="text-text-muted">{icon}</span>}
                      <p className="text-text-muted" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                    </div>
                    <p className="text-text-primary" style={{ fontSize: 13, fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Valor total em destaque */}
              <div
                className="bg-surface"
                style={{ padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
              >
                <p className="text-text-muted" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Valor Total</p>
                <p className="text-text-primary" style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt.currency(sheet.valor)}
                </p>
              </div>

              {/* Observacoes */}
              {sheet.observacoes && (
                <div
                  className="bg-surface"
                  style={{ padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                >
                  <p className="text-text-muted" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Observacoes</p>
                  <p className="text-text-secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>{sheet.observacoes}</p>
                </div>
              )}

              {/* Cotacao */}
              <div>
                <p className="text-text-muted" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Cotacao Anexada
                </p>
                {sheet.imagemOrcamento ? (
                  <img
                    src={sheet.imagemOrcamento}
                    alt="Cotacao"
                    style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--color-border)', objectFit: 'contain', maxHeight: 280 }}
                  />
                ) : (
                  <div
                    className="bg-surface"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 8, padding: '36px 0',
                      border: '1px dashed var(--color-border-light)', borderRadius: '6px',
                    }}
                  >
                    <FileText size={32} className="text-text-muted" style={{ opacity: 0.4 }} />
                    <p className="text-text-muted" style={{ fontSize: 12 }}>Nenhum documento anexado</p>
                  </div>
                )}
              </div>

              {/* Decision bar no sheet */}
              <div
                className="bg-surface-container-lowest"
                style={{ position: 'sticky', bottom: 0, borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}
              >
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

// ─── Aba Fabricacao ────────────────────────────────────────────────────────────
function AbaFabricacao({
  items, dismissing, onNegar, onAprovar,
}: {
  items: Solicitacao[];
  dismissing: Set<number>;
  onNegar: (id: number) => void;
  onAprovar: (id: number) => void;
}) {
  if (!items.length) return <Empty label="Nenhuma solicitacao de fabricacao pendente." />;

  return (
    <div
      className="bg-surface-container-lowest overflow-hidden"
      style={{ border: '1px solid var(--color-border)', borderRadius: '12px' }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Th>Peca / Obra</Th><Th>Dimensoes</Th><Th>Quantidade</Th><Th>Caracteristicas</Th><Th>Solicitante</Th><Th>Acoes</Th>
          </tr>
        </thead>
        <tbody>
          {items.map(s => {
            const dims: string[] = [];
            if (s.paineis > 0) dims.push(`${s.painelComp}×${s.painelAlt}m`);
            if (s.pilares > 0) dims.push(`H ${s.pilarAlt}m`);
            if (s.sapatas > 0) dims.push(s.tamanhoSapata);

            const qtds: string[] = [];
            if (s.paineis > 0) qtds.push(`${s.paineis} paineis`);
            if (s.pilares > 0) qtds.push(`${s.pilares} pilares`);
            if (s.sapatas > 0) qtds.push(`${s.sapatas} sapatas`);

            const tags: string[] = [];
            if (s.tipoPainel) tags.push(s.tipoPainel === 'Liso' ? 'Acabamento Liso' : s.tipoPainel);
            if (s.raPainel) tags.push(`Malha ${s.raPainel}`);
            if (s.tipoSapata && s.sapatas > 0) tags.push(s.tipoSapata);

            return (
              <tr
                key={s.id}
                className="hover:bg-table-hover transition-colors"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  opacity: dismissing.has(s.id) ? 0 : 1,
                  transform: dismissing.has(s.id) ? 'translateX(16px)' : 'none',
                }}
              >
                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                  <p className="text-text-primary" style={{ fontSize: 13, fontWeight: 700 }}>{s.obraNome}</p>
                  <p className="text-text-muted" style={{ fontSize: 11, marginTop: 2 }}>{fmt.date(s.dataSolicitacaoRegistro)}</p>
                </td>
                <Td mono>{dims.join(' / ') || '—'}</Td>
                <Td mono bold>{qtds.join(', ') || '—'}</Td>
                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                  {tags.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tags.map(t => <TechTag key={t} label={t} />)}
                    </div>
                  ) : <span className="text-text-muted" style={{ fontSize: 13 }}>—</span>}
                </td>
                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                  <p className="text-text-primary" style={{ fontSize: 13 }}>{s.solicitante}</p>
                  <p className="text-text-muted" style={{ fontSize: 11, marginTop: 2 }}>{s.cargoSolicitante}</p>
                </td>
                <td style={{ padding: '10px 24px', verticalAlign: 'middle' }}>
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

// ─── Aba Logistica ─────────────────────────────────────────────────────────────
function AbaLogistica({
  items, dismissing, onNegar, onAprovar,
}: {
  items: Carregamento[];
  dismissing: Set<number>;
  onNegar: (id: number) => void;
  onAprovar: (id: number) => void;
}) {
  if (!items.length) return <Empty label="Nenhum carregamento pendente de autorizacao." />;

  return (
    <div
      className="bg-surface-container-lowest overflow-hidden"
      style={{ border: '1px solid var(--color-border)', borderRadius: '12px' }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Th>Obra</Th><Th>Tipo de Veiculo</Th><Th>Qtd. Paineis</Th><Th>Sequencia de Carregamento</Th><Th>Solicitante</Th><Th>Acoes</Th>
          </tr>
        </thead>
        <tbody>
          {items.map(c => {
            const seq = criarResumoSequenciaCarregamento(c.paineis);

            return (
              <tr
                key={c.id}
                className="hover:bg-table-hover transition-colors"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  opacity: dismissing.has(c.id) ? 0 : 1,
                  transform: dismissing.has(c.id) ? 'translateX(16px)' : 'none',
                }}
              >
                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                  <p className="text-text-primary" style={{ fontSize: 13, fontWeight: 700 }}>{c.obraNome}</p>
                  <p className="text-text-muted" style={{ fontSize: 11, marginTop: 2 }}>{fmt.date(c.dataSolicitacao)}</p>
                </td>
                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Truck size={14} className="text-text-muted" />
                    <span className="text-text-primary" style={{ fontSize: 13, fontWeight: 600 }}>{c.veiculo}</span>
                  </div>
                </td>
                <Td mono bold>{c.paineis.length}</Td>
                <td style={{ padding: '16px 24px', verticalAlign: 'middle', maxWidth: 280 }}>
                  <code
                    className="text-text-secondary bg-surface-container-low"
                    style={{
                      display: 'block', fontSize: 11,
                      border: '1px solid var(--color-border)',
                      padding: '4px 8px', borderRadius: 4,
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {seq || '—'}
                  </code>
                </td>
                <Td>{c.solicitante}</Td>
                <td style={{ padding: '10px 24px', verticalAlign: 'middle' }}>
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
      { id: 0, type: 'negado', message: 'Solicitacao de compra negada.' });
  }, [dismiss]);

  const handleAprovarCompra = useCallback((s: SolicitacaoCompra) => {
    dismiss(s.id, () => autorizacaoApi.aprovarCompra(s.id),
      { id: 0, type: 'aprovado', message: `Compra de "${s.item}" aprovada e enviada ao financeiro.` });
  }, [dismiss]);

  // ── Handlers Fabricacao ──────────────────────────────────────────────────────
  const handleNegarFab = useCallback((id: number) => {
    dismiss(id, () => autorizacaoApi.negarFabricacao(id),
      { id: 0, type: 'negado', message: 'Solicitacao de fabricacao negada.' });
  }, [dismiss]);

  const handleAprovarFab = useCallback((id: number) => {
    dismiss(id, () => autorizacaoApi.aprovarFabricacao(id),
      { id: 0, type: 'aprovado', message: 'Solicitacao de fabricacao aprovada.' });
  }, [dismiss]);

  // ── Handlers Logistica ───────────────────────────────────────────────────────
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
    { key: 'fabricacao', label: 'Fabricacao', count: fabricacoes.length, icon: <Wrench size={14} /> },
    { key: 'logistica',  label: 'Logistica',  count: logistica.length,  icon: <Truck size={14} /> },
  ];

  return (
    <div>

      {/* ── Page header ── */}
      <p
        className="text-text-muted uppercase tracking-widest font-extrabold"
        style={{ fontSize: 11, marginBottom: 8 }}
      >
        Sistema - Controle de Acesso
      </p>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="bg-primary-bg"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: '10px',
              border: '1px solid var(--color-primary-light)',
            }}
          >
            <Shield size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-text-primary" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
              Central de Autorizacoes
            </h1>
            <p className="text-text-secondary" style={{ fontSize: 14, marginTop: 3 }}>
              Perfil Master - Aprovacoes pendentes de Compras, Fabricacao e Logistica
            </p>
          </div>
        </div>

        {total > 0 && (
          <div
            className="bg-warning-bg text-warning-text"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: '8px',
              border: '1px solid var(--color-warning-bright)',
            }}
          >
            <AlertTriangle size={15} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {total} pendencia{total !== 1 ? 's' : ''} aguardando decisao
            </span>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div
        className="bg-surface-container-low"
        style={{ display: 'inline-flex', gap: 4, borderRadius: '10px', padding: 4, marginBottom: 20 }}
      >
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                active
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-surface-container-high/50'
              }
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.15s',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={active ? 'bg-white/20 text-white' : 'bg-warning-bg text-warning-text'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999,
                    fontSize: 10, fontWeight: 800,
                  }}
                >
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
