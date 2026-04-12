import { useMemo, useState } from 'react';
import { Boxes, ChevronDown, Plus, Truck, X } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import EmptyState from '../../components/shared/EmptyState';
import SimuladorCarregamento from '../../components/shared/SimuladorCarregamento';
import { create, getAll, getCurrentUser } from '../../lib/storage';
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
import {
  STORAGE_KEYS,
  type Carregamento,
  type Obra,
  type PainelCarregamento,
  type Solicitacao,
} from '../../lib/types';

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

function OverviewField({
  label,
  value,
  mono = false,
  emphasis = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className={LABEL_CLASS}>{label}</div>
      <div
        className={`mt-1 truncate text-sm text-slate-700 ${mono ? NUMERIC_CLASS : ''} ${
          emphasis ? 'font-medium text-slate-900' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function CapacityBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-slate-500">
        Capacidade: <span className={`text-slate-700 ${NUMERIC_CLASS}`}>{percent}%</span>
      </span>
    </div>
  );
}

function StatusPill({ carregamento }: { carregamento: Carregamento }) {
  const status = getDisplayStatus(carregamento);

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${status.className}`}
    >
      {status.label}
    </span>
  );
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
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className={LABEL_CLASS}>Planta baixa do carregamento</div>
          <p className="mt-1 text-sm text-slate-600">
            {resumo.modo === 'Munck'
              ? 'Visual compacto do munck com duas pistas laterais.'
              : 'Visual compacto da prancha com faixas sequenciais.'}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className={LABEL_CLASS}>Total ocupado</div>
          <div className={`mt-1 text-sm text-slate-700 ${NUMERIC_CLASS}`}>{formatMeters(resumo.totalMeters)}</div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-300 bg-slate-50 p-3">
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

function CarregamentoAccordionRow({ carregamento }: { carregamento: Carregamento }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const resumo = getCapacidadeResumo(carregamento);
  const resumoSequencia = criarResumoSequenciaCarregamento(carregamento.paineis);

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setIsExpanded(value => !value)}
        className="w-full cursor-pointer px-4 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-4 xl:grid-cols-4">
            <OverviewField label="Carregamento" value={`#${carregamento.id}`} mono emphasis />
            <OverviewField label="Data" value={carregamento.dataSolicitacao || '-'} mono />
            <OverviewField label="Veiculo" value={carregamento.veiculo} />
            <OverviewField label="Destino" value={carregamento.obraNome} emphasis />
          </div>

          <div className="xl:min-w-[220px]">
            <CapacityBar percent={resumo.capacidadePercentual} />
          </div>

          <div className="flex items-center justify-between gap-3 xl:min-w-[180px] xl:justify-end">
            <StatusPill carregamento={carregamento} />
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
              <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </span>
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
              <div className={LABEL_CLASS}>Paineis</div>
              <div className={`mt-1 text-sm text-slate-900 ${NUMERIC_CLASS}`}>{carregamento.paineis.length}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
              <div className={LABEL_CLASS}>Camadas</div>
              <div className={`mt-1 text-sm text-slate-900 ${NUMERIC_CLASS}`}>{resumo.profundidade}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
              <div className={LABEL_CLASS}>Distribuicao</div>
              <div className={`mt-1 text-sm text-slate-900 ${NUMERIC_CLASS}`}>
                {resumo.modo === 'Munck'
                  ? `E ${resumo.totalEsquerdo} | D ${resumo.totalDireito}`
                  : `${resumo.totalPrancha} na prancha`}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
              <div className={LABEL_CLASS}>Solicitante</div>
              <div className="mt-1 truncate text-sm font-medium text-slate-700">{carregamento.solicitante || '-'}</div>
            </div>
          </div>

          <div className="mb-4 rounded-md border border-slate-200 bg-white px-3 py-3">
            <div className={LABEL_CLASS}>Sequencia de carregamento</div>
            <div className="mt-1 text-sm text-slate-700">{resumoSequencia}</div>
          </div>

          <CompactTruckPreview carregamento={carregamento} />
        </div>
      ) : null}
    </div>
  );
}

export default function CarregamentoObra() {
  const [carregamentos, setCarregamentos] = useState(() => getAll<Carregamento>(STORAGE_KEYS.CARREGAMENTOS));
  const obras = useMemo(() => getAll<Obra>(STORAGE_KEYS.OBRAS), []);
  const solicitacoes = useMemo(
    () => getAll<Solicitacao>(STORAGE_KEYS.SOLICITACOES).filter(item => item.statusAutorizacao === 'Autorizado'),
    [],
  );
  const user = getCurrentUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [formObraId, setFormObraId] = useState('');
  const [formVeiculo, setFormVeiculo] = useState<'Munck' | 'Carreta'>('Munck');

  const refresh = () => setCarregamentos(getAll<Carregamento>(STORAGE_KEYS.CARREGAMENTOS));

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

    create<Carregamento>(STORAGE_KEYS.CARREGAMENTOS, {
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
    } as Omit<Carregamento, 'id'>);

    refresh();
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
      <div className="flex items-center gap-3">
        <Truck size={28} className="text-primary" />
        <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>
          Carregamento
        </h1>
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

      <div className="flex justify-end" style={{ marginTop: '28px' }}>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90"
          style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}
        >
          <Plus size={16} /> Novo Plano de Carregamento
        </button>
      </div>

      <div className="flex flex-col gap-4" style={{ marginTop: '20px' }}>
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
          style={{
            zIndex: 'var(--z-modal)',
            background: 'rgba(15, 23, 42, 0.36)',
            padding: '16px',
          }}
        >
          <div className="modal-card w-full overflow-y-auto" style={{ maxWidth: '1600px', maxHeight: '94vh', padding: '28px 32px' }}>
            <div className="flex items-start justify-between gap-4" style={{ marginBottom: '24px' }}>
              <div>
                <h2 className="font-extrabold text-text-primary" style={{ fontSize: '24px' }}>
                  Novo plano de carregamento
                </h2>
                <p className="text-text-muted" style={{ fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
                  Escolha a obra, confira o estoque fabricado e monte o plano com arrastar e soltar na mesma logica de montagem.
                </p>
              </div>
              <button onClick={closeModal} className="text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-border bg-surface-container-low" style={{ padding: '20px' }}>
                <p className="font-extrabold text-text-primary" style={{ fontSize: '15px', marginBottom: '16px' }}>
                  Dados da solicitacao
                </p>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>
                      Obra
                    </label>
                    <select
                      value={formObraId}
                      onChange={event => setFormObraId(event.target.value)}
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
