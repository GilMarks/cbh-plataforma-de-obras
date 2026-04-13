import { useMemo, useState, useEffect } from 'react';
import { Boxes, ChevronDown, Plus, Truck, X } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import EmptyState from '../../components/shared/EmptyState';
import SimuladorCarregamento from '../../components/shared/SimuladorCarregamento';
import { carregamentos as carregamentosApi, obras as obrasApi, solicitacoes as solicitacoesApi } from '../../lib/api';
import { getCurrentUser } from '../../lib/storage';
import {
  agruparPlanoCarregamento,
  carregamentoReservaEstoque,
  criarResumoSequenciaCarregamento,
  criarSequenciaMontagem,
  formatMeters,
  formatDimensaoPainel,
  getMaxComprimentoCamada,
  parseDimensaoPainel,
} from '../../lib/carregamento';
import type { PainelEstoqueCarregamento } from '../../lib/carregamento';
import type { Carregamento, Obra, PainelCarregamento, Solicitacao } from '../../lib/types';

const PREVIEW_PIXELS_PER_METER = 24;
const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-wider text-slate-500';
const NUMERIC_CLASS = 'tabular-nums tracking-tight font-medium';

function getPainelComp(painel: PainelCarregamento) {
  if (typeof painel.comp === 'number') return painel.comp;
  return parseDimensaoPainel(painel.dimensao).comp;
}

function getDisplayStatus(carregamento: Carregamento) {
  if (carregamento.status === 'Entregue') {
    return {
      label: 'Entregue',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (carregamento.status === 'Carregado') {
    return {
      label: 'Em Rota',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    };
  }

  if (carregamento.statusAutorizacao === 'Aguardando') {
    return {
      label: 'Pendente',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: carregamento.status,
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  };
}

function getCapacidadeResumo(carregamento: Carregamento) {
  const plano = agruparPlanoCarregamento(carregamento.paineis);
  const maxLayerLength = getMaxComprimentoCamada(carregamento.paineis);
  const totalMeters = carregamento.paineis.reduce((total, painel) => total + getPainelComp(painel), 0);
  const profundidade =
    plano.modo === 'Munck'
      ? Math.max(plano.esquerdo.length, plano.direito.length, 1)
      : Math.max(plano.prancha.length, 1);
  const capacidadeTotal =
    plano.modo === 'Munck' ? profundidade * maxLayerLength * 2 : profundidade * maxLayerLength;
  const capacidadePercentual = capacidadeTotal === 0 ? 0 : Math.round((totalMeters / capacidadeTotal) * 100);

  return {
    ...plano,
    totalMeters,
    profundidade,
    maxLayerLength,
    capacidadePercentual: Math.max(0, Math.min(capacidadePercentual, 100)),
    totalEsquerdo: plano.esquerdo.reduce((total, camada) => total + camada.itens.length, 0),
    totalDireito: plano.direito.reduce((total, camada) => total + camada.itens.length, 0),
    totalPrancha: plano.prancha.reduce((total, camada) => total + camada.itens.length, 0),
  };
}


function CompactTruckPreview({ carregamento }: { carregamento: Carregamento }) {
  const resumo = getCapacidadeResumo(carregamento);
  const columnWidthPx = 14;
  const stageHeight = resumo.maxLayerLength * PREVIEW_PIXELS_PER_METER;
  const renderMiniColumn = (
    items: typeof resumo.esquerdo[number]['itens'],
    key: string,
    borderClass: string,
  ) => (
    <div
      key={key}
      className={borderClass}
      style={{ width: `${columnWidthPx}px`, minWidth: `${columnWidthPx}px`, height: `${stageHeight}px` }}
    >
      <div className="flex h-full w-full flex-col-reverse items-center justify-start gap-px">
        {items.map(painel => (
          <div
            key={painel.itemId ?? `${painel.solicitacaoId}-${painel.posicaoCarregamento}`}
            className="w-full rounded-sm border border-slate-400 bg-slate-200"
            style={{ height: `${getPainelComp(painel) * PREVIEW_PIXELS_PER_METER}px` }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-end">
        <span className={`text-xs text-slate-500 ${NUMERIC_CLASS}`}>
          Total: <strong className="text-slate-700">{formatMeters(resumo.totalMeters)}</strong>
        </span>
      </div>

      <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
        {resumo.modo === 'Munck' ? (
          <div
            className="grid items-start gap-3 overflow-x-auto"
            style={{
              gridTemplateColumns: `${Math.max(resumo.esquerdo.length, 2) * columnWidthPx}px 12px ${Math.max(resumo.direito.length, 2) * columnWidthPx}px`,
            }}
          >
            <div className="rounded-md border border-slate-200 bg-white px-2 py-2">
              <div className={`mb-2 text-center text-[10px] text-slate-500 ${NUMERIC_CLASS}`}>E {formatMeters(resumo.totalMeters ? resumo.esquerdo[0]?.comprimentoTotal ?? 0 : 0)}</div>
              <div className="flex h-full flex-row-reverse justify-start">
                {[...resumo.esquerdo].reverse().map((layer, index) =>
                  renderMiniColumn(layer.itens, `preview-left-${index}`, 'border-r border-slate-300'),
                )}
              </div>
            </div>

            <div className="flex flex-col items-center self-stretch">
              <div className="w-3 rounded-full bg-amber-400" style={{ minHeight: `${stageHeight}px`, height: `${stageHeight}px`, maxHeight: '150px' }} />
            </div>

            <div className="rounded-md border border-slate-200 bg-white px-2 py-2">
              <div className={`mb-2 text-center text-[10px] text-slate-500 ${NUMERIC_CLASS}`}>D {formatMeters(resumo.totalMeters ? resumo.direito[0]?.comprimentoTotal ?? 0 : 0)}</div>
              <div className="flex h-full justify-start">
                {[...resumo.direito].reverse().map((layer, index) =>
                  renderMiniColumn(layer.itens, `preview-right-${index}`, 'border-l border-slate-300'),
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className={LABEL_CLASS}>Prancha</div>
                <p className="mt-1 text-xs text-slate-600">Cabecalho a esquerda e descarregamento pela traseira.</p>
              </div>
              <div className={`text-xs text-slate-700 ${NUMERIC_CLASS}`}>{formatMeters(resumo.maxLayerLength)} por faixa</div>
            </div>

            <div className="flex items-start gap-3 overflow-x-auto">
              <div className="mt-1 h-8 w-14 rounded-l-full rounded-r-md border border-slate-300 bg-slate-100" />
              <div className="flex rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
                {resumo.prancha.map((layer, index) =>
                  renderMiniColumn(layer.itens, `preview-prancha-${index}`, 'border-l border-slate-300'),
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CapacityColor(percent: number) {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 70) return 'bg-amber-500';
  return 'bg-blue-500';
}

function CarregamentoAccordionRow({ carregamento }: { carregamento: Carregamento }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [seqExpanded, setSeqExpanded] = useState(false);
  const resumo = getCapacidadeResumo(carregamento);
  const resumoSequencia = criarResumoSequenciaCarregamento(carregamento.paineis);
  const status = getDisplayStatus(carregamento);
  const headerId = `carregamento-header-${carregamento.id}`;
  const pct = resumo.capacidadePercentual;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition-all duration-150 ${
        isExpanded ? 'border-slate-300 shadow-sm' : 'border-slate-200 hover:bg-slate-50/50 hover:border-slate-300 hover:shadow-sm'
      }`}
      role="region"
      aria-labelledby={headerId}
    >
      {/* ── Header clicável ── */}
      <button
        type="button"
        id={headerId}
        onClick={() => setIsExpanded(v => !v)}
        aria-expanded={isExpanded}
        aria-label={`Carregamento #${carregamento.id} — ${carregamento.obraNome}, ${status.label}. ${isExpanded ? 'Recolher' : 'Expandir'} detalhes.`}
        className="w-full px-5 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          {/* ID */}
          <span className="shrink-0 font-mono text-xs font-bold text-slate-400">#{carregamento.id}</span>

          {/* Nome + status */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-slate-900">{carregamento.obraNome}</span>
              <span
                className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.className}`}
                aria-label={`Status: ${status.label}`}
              >
                {status.label}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
              <span>{carregamento.veiculo}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={carregamento.dataSolicitacao || undefined}>{carregamento.dataSolicitacao || '-'}</time>
              <span aria-hidden="true">·</span>
              <span>{carregamento.paineis.length} painéis</span>
            </div>
          </div>

          {/* Capacidade — cor contextual */}
          <div
            className="hidden shrink-0 items-center gap-2 sm:flex"
            aria-label={`Capacidade: ${pct}%`}
          >
            <div
              className="h-1 w-16 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full transition-all ${CapacityColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`font-mono text-xs ${pct >= 90 ? 'font-bold text-red-500' : pct >= 70 ? 'font-bold text-amber-500' : 'text-slate-400'}`}>
              {pct}%
            </span>
          </div>

          {/* Chevron */}
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={`shrink-0 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* ── Corpo expansível ── */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          {/* KPIs inline */}
          <dl className="flex flex-wrap items-center divide-x divide-slate-100 px-5 py-3">
            {([
              { label: 'Painéis', value: String(carregamento.paineis.length) },
              { label: 'Camadas', value: String(resumo.profundidade) },
              {
                label: 'Distribuição',
                value: resumo.modo === 'Munck'
                  ? `E ${resumo.totalEsquerdo} · D ${resumo.totalDireito}`
                  : `${resumo.totalPrancha} prancha`,
              },
              { label: 'Solicitante', value: carregamento.solicitante || '-' },
            ] as { label: string; value: string }[]).map(item => (
              <div key={item.label} className="px-4 py-1 first:pl-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</dt>
                <dd className="mt-0.5 truncate font-mono text-sm font-bold text-slate-800">{item.value}</dd>
              </div>
            ))}
          </dl>

          {/* Sequência */}
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sequência de montagem</p>
              {resumoSequencia.length > 80 && (
                <button
                  type="button"
                  onClick={() => setSeqExpanded(v => !v)}
                  className="text-[10px] font-bold text-blue-500 hover:text-blue-700 focus-visible:outline-none"
                >
                  {seqExpanded ? 'Recolher' : 'Ver tudo'}
                </button>
              )}
            </div>
            <p className={`text-sm leading-relaxed text-slate-600 ${seqExpanded ? '' : 'line-clamp-1'}`}>
              {resumoSequencia}
            </p>
          </div>

          {/* Planta baixa */}
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-100 p-3">
              <CompactTruckPreview carregamento={carregamento} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CarregamentoObra() {
  const [carregamentos, setCarregamentos] = useState<Carregamento[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const user = getCurrentUser();

  useEffect(() => {
    carregamentosApi.listar().then(setCarregamentos).catch(() => {});
    obrasApi.listar().then(setObras).catch(() => {});
    solicitacoesApi.listar({ statusAutorizacao: 'Autorizado' }).then(setSolicitacoes).catch(() => {});
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [formObraId, setFormObraId] = useState('');
  const [formVeiculo, setFormVeiculo] = useState<'Munck' | 'Carreta'>('Munck');

  const refresh = () => carregamentosApi.listar().then(setCarregamentos).catch(() => {});

  const closeModal = () => {
    setModalOpen(false);
    setFormObraId('');
    setFormVeiculo('Munck');
  };

  const obraSelecionada = useMemo(
    () => obras.find(obra => obra.id === Number(formObraId)) ?? null,
    [formObraId, obras],
  );

  const paineisReservadosPorSolicitacao = useMemo(() => {
    const contagem = new Map<number, number>();

    carregamentos.forEach(carregamento => {
      if (!carregamentoReservaEstoque(carregamento)) return;

      carregamento.paineis.forEach(painel => {
        if (painel.tipo !== 'Painel') return;
        contagem.set(painel.solicitacaoId, (contagem.get(painel.solicitacaoId) ?? 0) + 1);
      });
    });

    return contagem;
  }, [carregamentos]);

  const disponibilidadePorSolicitacao = useMemo(() => {
    if (!formObraId) return [];

    return solicitacoes
      .filter(solicitacao => solicitacao.obraId === Number(formObraId) && solicitacao.fabricadoPainel > 0)
      .map(solicitacao => {
        const reservado = paineisReservadosPorSolicitacao.get(solicitacao.id) ?? 0;
        const disponivel = Math.max(solicitacao.fabricadoPainel - reservado, 0);
        return {
          solicitacaoId: solicitacao.id,
          dimensao: formatDimensaoPainel(solicitacao.painelComp, solicitacao.painelAlt),
          tipoPainel: solicitacao.tipoPainel,
          fabricado: solicitacao.fabricadoPainel,
          reservado,
          disponivel,
        };
      });
  }, [formObraId, paineisReservadosPorSolicitacao, solicitacoes]);

  const availablePanels = useMemo<PainelEstoqueCarregamento[]>(() => {
    return disponibilidadePorSolicitacao.flatMap(item => {
      const dimensao = item.dimensao;
      const { comp, alt } = parseDimensaoPainel(dimensao);

      return Array.from({ length: item.disponivel }, (_, index) => {
        const numeroPainel = item.reservado + index + 1;
        return {
          itemId: `sol-${item.solicitacaoId}-painel-${numeroPainel}`,
          codigo: `PA-${String(item.solicitacaoId).padStart(2, '0')}-${String(numeroPainel).padStart(3, '0')}`,
          solicitacaoId: item.solicitacaoId,
          tipo: 'Painel',
          dimensao,
          comp,
          alt,
        };
      });
    });
  }, [disponibilidadePorSolicitacao]);

  const estoqueResumo = useMemo(() => {
    return disponibilidadePorSolicitacao.reduce(
      (total, item) => ({
        fabricado: total.fabricado + item.fabricado,
        reservado: total.reservado + item.reservado,
        disponivel: total.disponivel + item.disponivel,
      }),
      { fabricado: 0, reservado: 0, disponivel: 0 },
    );
  }, [disponibilidadePorSolicitacao]);

  const simulatorResetKey = formObraId;

  const handleCriar = (plano: PainelCarregamento[]) => {
    if (!formObraId || plano.length === 0) return;
    const obra = obras.find(item => item.id === Number(formObraId));
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

  const totalCarregamentos = carregamentos.length;
  const aguardandoExecucao = carregamentos.filter(
    carregamento => carregamento.status === 'Pendente' || carregamento.status === 'Autorizado' || carregamento.status === 'Em Carregamento',
  ).length;
  const totalEstoqueLivre = useMemo(
    () =>
      solicitacoes.reduce((total, solicitacao) => {
        const reservado = paineisReservadosPorSolicitacao.get(solicitacao.id) ?? 0;
        return total + Math.max(solicitacao.fabricadoPainel - reservado, 0);
      }, 0),
    [paineisReservadosPorSolicitacao, solicitacoes],
  );
  const obrasComEstoque = useMemo(() => {
    const obrasDisponiveis = new Set<number>();

    solicitacoes.forEach(solicitacao => {
      const reservado = paineisReservadosPorSolicitacao.get(solicitacao.id) ?? 0;
      if (solicitacao.fabricadoPainel - reservado > 0) {
        obrasDisponiveis.add(solicitacao.obraId);
      }
    });

    return obrasDisponiveis.size;
  }, [paineisReservadosPorSolicitacao, solicitacoes]);

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
        Obra
      </p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Truck size={28} className="text-primary" />
          <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>
            Carregamento
          </h1>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 shrink-0"
          style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}
        >
          <Plus size={16} /> Novo Plano de Carregamento
        </button>
      </div>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>
        Monte o plano de carregamento por obra, obedecendo a sequencia de montagem e a ocupacao por camada.
      </p>

      <div className="grid-kpi" style={{ marginTop: '28px' }}>
        <KPICard title="Total Carregamentos" value={totalCarregamentos} icon="Truck" color="primary" />
        <KPICard title="Aguardando Execucao" value={aguardandoExecucao} icon="Clock" color="warning" />
        <KPICard title="Paineis Livres" value={totalEstoqueLivre} icon="Boxes" color="success" />
        <KPICard title="Obras com Estoque" value={obrasComEstoque} icon="HardHat" color="primary" />
      </div>

      <div className="flex flex-col gap-3" style={{ marginTop: '28px' }}>
        {carregamentos.length === 0 ? (
          <EmptyState message="Nenhum carregamento registrado" icon="Truck" />
        ) : (
          [...carregamentos]
            .sort((a, b) => b.id - a.id)
            .map(carregamento => <CarregamentoAccordionRow key={carregamento.id} carregamento={carregamento} />)
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 'var(--z-modal)', background: 'rgba(15, 23, 42, 0.36)', padding: '16px' }}
          aria-hidden="true"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-titulo"
            className="modal-card w-full overflow-y-auto"
            style={{ maxWidth: '1600px', maxHeight: '94vh', padding: '28px 32px' }}
            onKeyDown={e => { if (e.key === 'Escape') closeModal(); }}
          >
            <div className="flex items-start justify-between gap-4" style={{ marginBottom: '24px' }}>
              <div>
                <h2 id="modal-titulo" className="font-extrabold text-text-primary" style={{ fontSize: '24px' }}>
                  Novo plano de carregamento
                </h2>
                <p className="text-text-muted" style={{ fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
                  Escolha a obra, confira o estoque fabricado e monte o plano com arrastar e soltar na mesma logica de montagem.
                </p>
              </div>
              <button onClick={closeModal} aria-label="Fechar modal" className="text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-border bg-surface-container-low" style={{ padding: '20px' }}>
                <p className="font-extrabold text-text-primary" style={{ fontSize: '15px', marginBottom: '16px' }}>
                  Dados da solicitacao
                </p>

                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="select-obra" className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>
                      Obra
                    </label>
                    <select
                      id="select-obra"
                      value={formObraId}
                      onChange={event => setFormObraId(event.target.value)}
                      aria-required="true"
                      className="w-full bg-white border border-border"
                      style={{ padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}
                    >
                      <option value="">Selecione a obra</option>
                      {obras.map(obra => (
                        <option key={obra.id} value={obra.id}>
                          {obra.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {obraSelecionada ? (
                    <div className="rounded-2xl border border-border bg-white" style={{ padding: '16px' }}>
                      <p className="font-extrabold text-text-primary" style={{ fontSize: '14px' }}>
                        {obraSelecionada.nome}
                      </p>
                      <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '6px', lineHeight: 1.5 }}>
                        {obraSelecionada.local}
                      </p>
                      <p className="text-text-secondary" style={{ fontSize: '12px', marginTop: '8px', lineHeight: 1.5 }}>
                        Veiculo planejado: {formVeiculo}
                      </p>
                      {obraSelecionada.observacoes && (
                        <p className="text-text-secondary" style={{ fontSize: '12px', marginTop: '8px', lineHeight: 1.5 }}>
                          {obraSelecionada.observacoes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-white text-text-muted" style={{ padding: '16px', fontSize: '12px', lineHeight: 1.5 }}>
                      Selecione a obra para liberar automaticamente o estoque fabricado correspondente.
                    </div>
                  )}

                  {formObraId && (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: '10px',
                        }}
                      >
                        <div className="rounded-xl border border-border bg-white" style={{ padding: '14px' }}>
                          <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '10px' }}>
                            Fabricado
                          </p>
                          <p className="font-extrabold text-text-primary" style={{ fontSize: '20px', marginTop: '8px' }}>
                            {estoqueResumo.fabricado}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-white" style={{ padding: '14px' }}>
                          <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '10px' }}>
                            Reservado
                          </p>
                          <p className="font-extrabold text-text-primary" style={{ fontSize: '20px', marginTop: '8px' }}>
                            {estoqueResumo.reservado}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-white" style={{ padding: '14px' }}>
                          <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '10px' }}>
                            Livres
                          </p>
                          <p className="font-extrabold text-text-primary" style={{ fontSize: '20px', marginTop: '8px' }}>
                            {estoqueResumo.disponivel}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-white" style={{ padding: '16px' }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                          <Boxes size={16} className="text-primary" />
                          <p className="font-extrabold text-text-primary" style={{ fontSize: '14px' }}>
                            Estoque por dimensao
                          </p>
                        </div>

                        {disponibilidadePorSolicitacao.length === 0 ? (
                          <p className="text-text-muted" style={{ fontSize: '12px' }}>
                            Nenhum painel fabricado e autorizado disponivel para esta obra.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {disponibilidadePorSolicitacao.map(item => (
                              <div key={item.solicitacaoId} className="rounded-xl border border-border bg-surface-container-low" style={{ padding: '12px' }}>
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div>
                                    <p className="font-bold text-text-primary" style={{ fontSize: '13px' }}>
                                      {item.dimensao}
                                    </p>
                                    <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                                      Solicitacao #{item.solicitacaoId} - {item.tipoPainel}
                                    </p>
                                  </div>
                                  <span
                                    className="rounded-full border border-border bg-white text-text-muted"
                                    style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700 }}
                                  >
                                    {item.disponivel} livres
                                  </span>
                                </div>
                                <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '8px' }}>
                                  Fabricado: {item.fabricado} - Reservado em outros carregamentos: {item.reservado}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                {!formObraId ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface-container-lowest" style={{ padding: '42px 28px' }}>
                    <EmptyState message="Selecione uma obra para abrir o simulador do carregamento" icon="Truck" />
                  </div>
                ) : availablePanels.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface-container-lowest" style={{ padding: '42px 28px' }}>
                    <EmptyState message="Nenhum painel livre para montar um novo carregamento nesta obra" icon="Boxes" />
                  </div>
                ) : (
                  <SimuladorCarregamento
                    availablePanels={availablePanels}
                    vehicle={formVeiculo}
                    onVehicleChange={setFormVeiculo}
                    resetKey={simulatorResetKey}
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
