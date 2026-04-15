import { useMemo, useState, useEffect } from 'react';
import { Boxes, Plus, Truck, X, LayoutTemplate } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import SimuladorCarregamento from '../../components/shared/SimuladorCarregamento';
import PlantaBaixaSVG from '../../components/shared/PlantaBaixaSVG';
import { carregamentos as carregamentosApi, obras as obrasApi, solicitacoes as solicitacoesApi } from '../../lib/api';
import { getCurrentUser } from '../../lib/storage';
import {
  agruparPlanoCarregamento,
  carregamentoReservaEstoque,
  criarSequenciaMontagem,
  formatDimensaoPainel,
  inferModoCarregamento,
  parseDimensaoPainel,
} from '../../lib/carregamento';
import type { PainelEstoqueCarregamento } from '../../lib/carregamento';
import type { Carregamento, Obra, PainelCarregamento, Solicitacao } from '../../lib/types';

function getDisplayStatus(c: Carregamento): string {
  if (c.status === 'Entregue') return 'Entregue';
  if (c.status === 'Carregado') return 'Em Rota';
  if (c.statusAutorizacao === 'Aguardando') return 'Pendente';
  return c.status;
}

function getCapacidadeResumo(c: Carregamento) {
  const plano = agruparPlanoCarregamento(c.paineis);
  const profundidade =
    plano.modo === 'Munck'
      ? Math.max(plano.esquerdo.length, plano.direito.length, 1)
      : Math.max(plano.prancha.length, 1);

  const totalMeters = c.paineis.reduce((sum, p) => {
    const comp = typeof p.comp === 'number' ? p.comp : parseDimensaoPainel(p.dimensao).comp;
    return sum + comp;
  }, 0);

  const capacidadeTotal =
    plano.modo === 'Munck' ? profundidade * plano.maxComp * 2 : profundidade * plano.maxComp;

  return {
    ...plano,
    profundidade,
    pct: capacidadeTotal === 0 ? 0 : Math.min(Math.round((totalMeters / capacidadeTotal) * 100), 100),
    totalEsquerdo: plano.esquerdo.reduce((s, cam) => s + cam.itens.length, 0),
    totalDireito: plano.direito.reduce((s, cam) => s + cam.itens.length, 0),
    totalPrancha: plano.prancha.reduce((s, cam) => s + cam.itens.length, 0),
  };
}

function pctColor(pct: number) {
  if (pct >= 90) return '#dc2626';
  if (pct >= 70) return '#d97706';
  return '#2563eb';
}

/* ── Layout Modal ── */
function LayoutModal({ carregamento, onClose }: { carregamento: Carregamento; onClose: () => void }) {
  const resumo = getCapacidadeResumo(carregamento);
  const modo = inferModoCarregamento(carregamento.paineis);

  const dist =
    modo === 'Munck'
      ? `Esq ${resumo.totalEsquerdo} · Dir ${resumo.totalDireito}`
      : `${resumo.totalPrancha} painéis na prancha`;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface-container-lowest w-full overflow-hidden"
        style={{ maxWidth: '760px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0px 8px 8px -4px rgba(16,24,40,0.03), 0px 20px 24px -4px rgba(16,24,40,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between" style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
              <span className="font-mono text-text-muted" style={{ fontSize: '12px' }}>#{carregamento.id}</span>
              <StatusBadge status={getDisplayStatus(carregamento)} />
            </div>
            <h2 className="font-bold text-text-primary" style={{ fontSize: '18px' }}>
              {carregamento.obraNome}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors rounded-lg flex items-center justify-center"
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {[
            { label: 'Veículo', value: carregamento.veiculo },
            { label: 'Painéis', value: String(carregamento.paineis.length) },
            { label: 'Distribuição', value: dist },
            { label: 'Ocupação', value: `${resumo.pct}%` },
          ].map(item => (
            <div key={item.label} style={{ padding: '16px 20px', borderRight: '1px solid var(--color-border)' }} className="last:border-r-0">
              <p className="text-text-muted font-medium" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                {item.label}
              </p>
              <p className="font-semibold text-text-primary" style={{ fontSize: '14px' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* SVG */}
        <div style={{ padding: '24px 28px' }}>
          <p className="font-medium text-text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
            Planta baixa do carregamento
          </p>
          <div className="overflow-x-auto">
            <PlantaBaixaSVG
              paineis={carregamento.paineis}
              veiculo={modo}
              compact={false}
            />
          </div>
        </div>

        {/* Data + solicitante */}
        <div className="flex items-center justify-between" style={{ padding: '12px 28px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <span className="text-text-muted" style={{ fontSize: '12px' }}>
            Solicitado por <strong className="text-text-secondary">{carregamento.solicitante || '—'}</strong>
          </span>
          <span className="text-text-muted" style={{ fontSize: '12px' }}>
            {carregamento.dataSolicitacao || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Card de carregamento ── */
function CarregamentoCard({ carregamento, onVerLayout }: { carregamento: Carregamento; onVerLayout: () => void }) {
  const resumo = getCapacidadeResumo(carregamento);
  const modo = inferModoCarregamento(carregamento.paineis);
  const status = getDisplayStatus(carregamento);
  const color = pctColor(resumo.pct);

  const dist =
    modo === 'Munck'
      ? `E ${resumo.totalEsquerdo} · D ${resumo.totalDireito}`
      : `${resumo.totalPrancha} prancha`;

  return (
    <div
      className="bg-surface-container-lowest flex items-center gap-6"
      style={{
        padding: '18px 24px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        boxShadow: '0px 1px 2px rgba(16,24,40,0.05)',
      }}
    >
      {/* ID + nome + status */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
          <span className="font-mono text-text-muted" style={{ fontSize: '11px' }}>#{carregamento.id}</span>
          <StatusBadge status={status} />
        </div>
        <p className="font-semibold text-text-primary truncate" style={{ fontSize: '15px' }}>
          {carregamento.obraNome}
        </p>
        <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
          {carregamento.veiculo} · {carregamento.dataSolicitacao || '—'} · {carregamento.paineis.length} painéis
        </p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 shrink-0">
        <div style={{ textAlign: 'center' }}>
          <p className="text-text-muted font-medium" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Camadas</p>
          <p className="font-semibold text-text-primary" style={{ fontSize: '15px', marginTop: '2px' }}>{resumo.profundidade}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p className="text-text-muted font-medium" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Distribuição</p>
          <p className="font-semibold text-text-primary" style={{ fontSize: '15px', marginTop: '2px' }}>{dist}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p className="text-text-muted font-medium" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ocupação</p>
          <div className="flex items-center gap-2" style={{ marginTop: '4px' }}>
            <div style={{ width: '48px', height: '4px', borderRadius: '2px', background: 'var(--color-border)', overflow: 'hidden' }}>
              <div style={{ width: `${resumo.pct}%`, height: '100%', background: color, borderRadius: '2px' }} />
            </div>
            <span className="font-semibold" style={{ fontSize: '13px', color }}>{resumo.pct}%</span>
          </div>
        </div>
      </div>

      {/* Ação */}
      <button
        onClick={onVerLayout}
        className="shrink-0 flex items-center gap-1.5 text-primary hover:bg-primary-bg transition-colors rounded-lg font-medium"
        style={{ fontSize: '13px', padding: '8px 14px', border: '1px solid var(--color-primary-light)' }}
      >
        <LayoutTemplate size={14} />
        Ver layout
      </button>
    </div>
  );
}

/* ── Page ── */
export default function CarregamentoObra() {
  const [carregamentos, setCarregamentos] = useState<Carregamento[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [layoutCarregamento, setLayoutCarregamento] = useState<Carregamento | null>(null);
  const [formObraId, setFormObraId] = useState('');
  const [formVeiculo, setFormVeiculo] = useState<'Munck' | 'Carreta'>('Munck');
  const user = getCurrentUser();

  useEffect(() => {
    carregamentosApi.listar().then(setCarregamentos).catch(() => {});
    obrasApi.listar().then(setObras).catch(() => {});
    solicitacoesApi.listar({ statusAutorizacao: 'Autorizado' }).then(setSolicitacoes).catch(() => {});
  }, []);

  const refresh = () => carregamentosApi.listar().then(setCarregamentos).catch(() => {});

  const closeModal = () => {
    setModalOpen(false);
    setFormObraId('');
    setFormVeiculo('Munck');
  };

  const obraSelecionada = useMemo(
    () => obras.find(o => o.id === Number(formObraId)) ?? null,
    [formObraId, obras],
  );

  const paineisReservadosPorSolicitacao = useMemo(() => {
    const map = new Map<number, number>();
    carregamentos.forEach(c => {
      if (!carregamentoReservaEstoque(c)) return;
      c.paineis.forEach(p => {
        if (p.tipo !== 'Painel') return;
        map.set(p.solicitacaoId, (map.get(p.solicitacaoId) ?? 0) + 1);
      });
    });
    return map;
  }, [carregamentos]);

  const disponibilidadePorSolicitacao = useMemo(() => {
    if (!formObraId) return [];
    return solicitacoes
      .filter(s => s.obraId === Number(formObraId) && s.fabricadoPainel > 0)
      .map(s => {
        const reservado = paineisReservadosPorSolicitacao.get(s.id) ?? 0;
        return {
          solicitacaoId: s.id,
          dimensao: formatDimensaoPainel(s.painelComp, s.painelAlt),
          tipoPainel: s.tipoPainel,
          fabricado: s.fabricadoPainel,
          reservado,
          disponivel: Math.max(s.fabricadoPainel - reservado, 0),
        };
      });
  }, [formObraId, paineisReservadosPorSolicitacao, solicitacoes]);

  const availablePanels = useMemo<PainelEstoqueCarregamento[]>(() => {
    return disponibilidadePorSolicitacao.flatMap(item => {
      const { comp, alt } = parseDimensaoPainel(item.dimensao);
      return Array.from({ length: item.disponivel }, (_, i) => ({
        itemId: `sol-${item.solicitacaoId}-painel-${item.reservado + i + 1}`,
        codigo: `PA-${String(item.solicitacaoId).padStart(2, '0')}-${String(item.reservado + i + 1).padStart(3, '0')}`,
        solicitacaoId: item.solicitacaoId,
        tipo: 'Painel' as const,
        dimensao: item.dimensao,
        comp,
        alt,
      }));
    });
  }, [disponibilidadePorSolicitacao]);

  const estoqueResumo = useMemo(
    () => disponibilidadePorSolicitacao.reduce(
      (acc, item) => ({ fabricado: acc.fabricado + item.fabricado, reservado: acc.reservado + item.reservado, disponivel: acc.disponivel + item.disponivel }),
      { fabricado: 0, reservado: 0, disponivel: 0 },
    ),
    [disponibilidadePorSolicitacao],
  );

  const handleCriar = (plano: PainelCarregamento[]) => {
    if (!formObraId || plano.length === 0) return;
    const obra = obras.find(o => o.id === Number(formObraId));
    if (!obra) return;
    carregamentosApi.criar({
      obraId: obra.id,
      obraNome: obra.nome,
      veiculo: formVeiculo,
      paineis: plano,
      sequenciaMontagem: criarSequenciaMontagem(plano),
      statusAutorizacao: 'Aguardando',
      autorizadoPor: '',
      dataAutorizacao: '',
      dataSolicitacao: new Date().toISOString().split('T')[0],
      solicitante: user?.login || '',
      executadoPor: '',
      dataExecucao: '',
      status: 'Pendente',
    }).then(() => refresh()).catch(() => {});
    closeModal();
  };

  // KPIs
  const totalEstoqueLivre = useMemo(
    () => solicitacoes.reduce((sum, s) => sum + Math.max(s.fabricadoPainel - (paineisReservadosPorSolicitacao.get(s.id) ?? 0), 0), 0),
    [paineisReservadosPorSolicitacao, solicitacoes],
  );
  const obrasComEstoque = useMemo(() => {
    const set = new Set<number>();
    solicitacoes.forEach(s => {
      if (s.fabricadoPainel - (paineisReservadosPorSolicitacao.get(s.id) ?? 0) > 0) set.add(s.obraId);
    });
    return set.size;
  }, [paineisReservadosPorSolicitacao, solicitacoes]);

  const aguardandoExecucao = carregamentos.filter(
    c => c.status === 'Pendente' || c.status === 'Autorizado' || c.status === 'Em Carregamento',
  ).length;

  const sorted = [...carregamentos].sort((a, b) => b.id - a.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-text-muted font-semibold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '6px' }}>
            Obra
          </p>
          <div className="flex items-center gap-3">
            <Truck size={24} className="text-primary" />
            <h1 className="font-bold text-text-primary" style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>
              Carregamento
            </h1>
          </div>
          <p className="text-text-muted" style={{ fontSize: '13px', marginTop: '6px' }}>
            Planeje e acompanhe os planos de carregamento por obra.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white font-semibold flex items-center gap-2 hover:opacity-90 shrink-0 transition-opacity"
          style={{ padding: '10px 18px', borderRadius: '8px', fontSize: '13px', boxShadow: '0px 1px 2px rgba(16,24,40,0.05)' }}
        >
          <Plus size={15} /> Novo plano
        </button>
      </div>

      {/* KPIs */}
      <div className="grid-kpi">
        <KPICard title="Total" value={carregamentos.length} icon="Truck" color="primary" />
        <KPICard title="Aguardando" value={aguardandoExecucao} icon="Clock" color="warning" />
        <KPICard title="Painéis livres" value={totalEstoqueLivre} icon="Boxes" color="success" />
        <KPICard title="Obras c/ estoque" value={obrasComEstoque} icon="HardHat" color="primary" />
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sorted.length === 0 ? (
          <EmptyState message="Nenhum carregamento registrado" icon="Truck" />
        ) : (
          sorted.map(c => (
            <CarregamentoCard
              key={c.id}
              carregamento={c}
              onVerLayout={() => setLayoutCarregamento(c)}
            />
          ))
        )}
      </div>

      {/* Modal layout */}
      {layoutCarregamento && (
        <LayoutModal
          carregamento={layoutCarregamento}
          onClose={() => setLayoutCarregamento(null)}
        />
      )}

      {/* Modal novo plano */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 100, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-surface-container-lowest w-full overflow-y-auto"
            style={{ maxWidth: '1600px', maxHeight: '94vh', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '28px 32px', boxShadow: '0px 20px 24px -4px rgba(16,24,40,0.08)' }}
          >
            <div className="flex items-start justify-between gap-4" style={{ marginBottom: '24px' }}>
              <div>
                <h2 className="font-bold text-text-primary" style={{ fontSize: '20px', letterSpacing: '-0.01em' }}>
                  Novo plano de carregamento
                </h2>
                <p className="text-text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>
                  Selecione a obra e monte o plano com arrastar e soltar.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-text-muted hover:text-text-primary transition-colors rounded-lg flex items-center justify-center"
                style={{ width: '36px', height: '36px', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              {/* Painel esquerdo */}
              <div className="rounded-xl border border-border bg-surface-container-low" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p className="font-semibold text-text-primary" style={{ fontSize: '14px' }}>Dados da solicitação</p>

                <div>
                  <label htmlFor="select-obra" className="text-text-muted font-medium" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                    Obra
                  </label>
                  <select
                    id="select-obra"
                    value={formObraId}
                    onChange={e => setFormObraId(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-border-light"
                    style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px', color: 'var(--color-text-primary)' }}
                  >
                    <option value="">Selecione a obra</option>
                    {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                  </select>
                </div>

                {obraSelecionada ? (
                  <div className="rounded-lg border border-border bg-surface-container-lowest" style={{ padding: '14px' }}>
                    <p className="font-semibold text-text-primary" style={{ fontSize: '13px' }}>{obraSelecionada.nome}</p>
                    <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>{obraSelecionada.local}</p>
                    {obraSelecionada.observacoes && (
                      <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>{obraSelecionada.observacoes}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-text-muted" style={{ fontSize: '12px', padding: '12px', borderRadius: '8px', border: '1px dashed var(--color-border)', background: 'var(--color-surface-container-lowest)' }}>
                    Selecione a obra para ver o estoque disponível.
                  </p>
                )}

                {formObraId && (
                  <>
                    {/* Mini KPIs estoque */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { label: 'Fabricado', value: estoqueResumo.fabricado },
                        { label: 'Reservado', value: estoqueResumo.reservado },
                        { label: 'Livres', value: estoqueResumo.disponivel },
                      ].map(item => (
                        <div key={item.label} className="rounded-lg border border-border bg-surface-container-lowest text-center" style={{ padding: '12px 8px' }}>
                          <p className="text-text-muted font-medium" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                          <p className="font-bold text-text-primary" style={{ fontSize: '20px', marginTop: '4px' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Estoque por dimensão */}
                    <div className="rounded-lg border border-border bg-surface-container-lowest" style={{ padding: '14px' }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: '10px' }}>
                        <Boxes size={13} className="text-primary" />
                        <p className="font-semibold text-text-primary" style={{ fontSize: '13px' }}>Estoque por dimensão</p>
                      </div>
                      {disponibilidadePorSolicitacao.length === 0 ? (
                        <p className="text-text-muted" style={{ fontSize: '12px' }}>Nenhum painel disponível.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {disponibilidadePorSolicitacao.map(item => (
                            <div key={item.solicitacaoId} className="flex items-center justify-between rounded-lg border border-border bg-surface-container-low" style={{ padding: '8px 12px', gap: '8px' }}>
                              <div style={{ minWidth: 0 }}>
                                <p className="font-semibold text-text-primary" style={{ fontSize: '13px' }}>{item.dimensao}</p>
                                <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '1px' }}>
                                  {item.tipoPainel} · fab. {item.fabricado} · res. {item.reservado}
                                </p>
                              </div>
                              <span
                                className="shrink-0 font-semibold"
                                style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', whiteSpace: 'nowrap' }}
                              >
                                {item.disponivel} livres
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Simulador */}
              <div>
                {!formObraId ? (
                  <div className="rounded-xl border border-dashed border-border bg-surface-container-lowest" style={{ padding: '60px 28px' }}>
                    <EmptyState message="Selecione uma obra para abrir o simulador" icon="Truck" />
                  </div>
                ) : availablePanels.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-surface-container-lowest" style={{ padding: '60px 28px' }}>
                    <EmptyState message="Nenhum painel livre para esta obra" icon="Boxes" />
                  </div>
                ) : (
                  <SimuladorCarregamento
                    availablePanels={availablePanels}
                    vehicle={formVeiculo}
                    onVehicleChange={setFormVeiculo}
                    resetKey={formObraId}
                    onCancel={closeModal}
                    onConfirm={handleCriar}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
