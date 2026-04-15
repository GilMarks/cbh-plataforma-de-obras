/**
 * SimuladorCarregamento — v6
 *
 * Refatorado para usar:
 * - distribuirOutsideIn() para distribuição nos dois lados do Munck
 * - PlantaBaixaSVG como componente compartilhado (view top-down)
 *
 * Fluxo:
 * 1. Usuário seleciona painéis 1-a-1 (click no estoque ou já pre-selecionados)
 * 2. Reordena a sequência de montagem via DnD
 * 3. Ao salvar, distribuirOutsideIn() aloca nos lados Esq/Dir automaticamente
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  formatMeters,
  distribuirOutsideIn,
  buildCamadasCarregamento,
  type PainelEstoqueCarregamento,
  MUNCK_MAX_COMP,
  CARRETA_MAX_COMP,
} from '../../lib/carregamento';
import PlantaBaixaSVG from './PlantaBaixaSVG';
import type { PainelCarregamento } from '../../lib/types';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface PainelOrdenado extends PainelEstoqueCarregamento {
  ordem: number;
}

// ─── Paleta de cores por fileira (via CSS vars do design system) ─────────────
const FILEIRA_CORES = [
  { fill: 'var(--color-success-bg)', stroke: 'var(--color-success)', text: 'var(--color-success-text)' },
  { fill: 'var(--color-info-bg)', stroke: 'var(--color-info)', text: 'var(--color-info-text)' },
  { fill: 'var(--color-warning-bg)', stroke: 'var(--color-warning)', text: 'var(--color-warning-text)' },
  { fill: 'var(--color-primary-bg, var(--color-primary-fixed))', stroke: 'var(--color-primary)', text: 'var(--color-primary)' },
  { fill: 'var(--color-danger-bg)', stroke: 'var(--color-danger)', text: 'var(--color-danger-text)' },
  { fill: 'var(--color-surface-container)', stroke: 'var(--color-text-secondary)', text: 'var(--color-text-secondary)' },
  { fill: 'var(--color-success-bg)', stroke: 'var(--color-info)', text: 'var(--color-info-text)' },
  { fill: 'var(--color-danger-bg)', stroke: 'var(--color-warning)', text: 'var(--color-warning-text)' },
];

function getFileiraCor(fi: number) {
  return FILEIRA_CORES[fi % FILEIRA_CORES.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Card sortable na lista de sequência
// ─────────────────────────────────────────────────────────────────────────────
function PainelCard({
  painel,
  index,
  fileira,
  maxMetros,
  highlighted,
  onRemover,
  onHover,
}: {
  painel: PainelOrdenado;
  index: number;
  fileira: number;
  maxMetros: number;
  highlighted: boolean;
  onRemover: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: painel.itemId,
  });

  const paleta = getFileiraCor(fileira);
  const cor = { bg: paleta.fill, border: paleta.stroke, text: paleta.text };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        borderColor: cor.border,
        background: highlighted ? cor.border : cor.bg,
        outline: highlighted ? `2px solid ${cor.border}` : undefined,
      }}
      className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-all hover:shadow-sm"
      onMouseEnter={() => onHover(painel.itemId)}
      onMouseLeave={() => onHover(null)}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-text-muted hover:text-text-secondary active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        tabIndex={-1}
      >
        <GripVertical size={12} />
      </button>

      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-extrabold text-white"
        style={{ background: cor.border }}
      >
        {index + 1}
      </div>

      <span className="min-w-0 flex-1 font-mono text-xs font-bold tabular-nums" style={{ color: highlighted ? 'white' : 'var(--color-text-primary)' }}>
        {painel.dimensao}
      </span>

      <div className="hidden w-12 shrink-0 sm:block">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min((painel.comp / maxMetros) * 100, 100)}%`, background: cor.border }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemover(painel.itemId)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-danger-bg hover:text-danger"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card de estoque disponível
// ─────────────────────────────────────────────────────────────────────────────
function EstoqueCard({
  painel,
  onAdicionar,
  excede,
}: {
  painel: PainelEstoqueCarregamento;
  onAdicionar: (p: PainelEstoqueCarregamento) => void;
  excede: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
        excede
          ? 'border-border bg-surface-container opacity-40'
          : 'border-border bg-surface-container-lowest hover:bg-primary-fixed hover:border-primary/30'
      }`}
    >
      <span className="min-w-0 flex-1 font-mono text-xs font-bold tabular-nums text-text-primary">
        {painel.dimensao}
      </span>
      <span className="shrink-0 font-mono text-[10px] text-text-muted">
        {formatMeters(painel.comp)}
      </span>
      <button
        type="button"
        disabled={excede}
        onClick={() => onAdicionar(painel)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-primary/30 bg-primary-fixed text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        title={excede ? 'Painel excede o limite do veículo' : 'Adicionar'}
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props + Componente principal
// ─────────────────────────────────────────────────────────────────────────────
interface SimuladorCarregamentoProps {
  availablePanels: PainelEstoqueCarregamento[];
  vehicle: 'Munck' | 'Carreta';
  onVehicleChange: (v: 'Munck' | 'Carreta') => void;
  resetKey: string;
  onConfirm: (plano: PainelCarregamento[]) => void;
  onCancel: () => void;
}

export default function SimuladorCarregamento({
  availablePanels,
  vehicle,
  onVehicleChange,
  resetKey,
  onConfirm,
  onCancel,
}: SimuladorCarregamentoProps) {
  const [sequencia, setSequencia]         = useState<PainelOrdenado[]>([]);
  const [estoque, setEstoque]             = useState<PainelEstoqueCarregamento[]>(() =>
    [...availablePanels].sort((a, b) => b.comp - a.comp || b.alt - a.alt),
  );
  const [activeDragId, setActiveDragId]   = useState<string | null>(null);
  const [hoveredId, setHoveredId]         = useState<string | null>(null);
  const resetRef = useRef<string | null>(null);

  const maxMetros = vehicle === 'Carreta' ? CARRETA_MAX_COMP : MUNCK_MAX_COMP;

  const totalMetros = sequencia.reduce((acc, p) => acc + (p.comp || 0), 0);

  useEffect(() => {
    if (resetRef.current === resetKey) return;
    resetRef.current = resetKey;
    setSequencia([]);
    setEstoque([...availablePanels].sort((a, b) => b.comp - a.comp || b.alt - a.alt));
    setActiveDragId(null);
  }, [availablePanels, resetKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const sequenciaOrdenada: PainelOrdenado[] = sequencia.map((p, i) => ({ ...p, ordem: i + 1 }));

  // Mapa itemId → camada (índice 0-based) baseado em bin-packing, para colorir os cards
  const fileiraMapSimple = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    let camadaIdx = 0;
    let compAcc = 0;
    for (const p of sequenciaOrdenada) {
      const c = p.comp || 1;
      if (compAcc + c > maxMetros && compAcc > 0) { camadaIdx++; compAcc = 0; }
      map[p.itemId] = camadaIdx;
      compAcc += c;
    }
    return map;
  }, [sequenciaOrdenada, maxMetros]);

  // Plano calculado em tempo real para o SVG (distribuirOutsideIn)
  const planoPreview = useMemo<PainelCarregamento[]>(() => {
    if (sequenciaOrdenada.length === 0) return [];
    return distribuirOutsideIn(sequenciaOrdenada, vehicle, maxMetros);
  }, [sequenciaOrdenada, vehicle, maxMetros]);

  const handleDragStart = (e: DragStartEvent) => setActiveDragId(e.active.id as string);
  const handleDragEnd   = (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setSequencia(cur => {
      const oi = cur.findIndex(p => p.itemId === active.id);
      const ni = cur.findIndex(p => p.itemId === over.id);
      return oi < 0 || ni < 0 ? cur : arrayMove(cur, oi, ni);
    });
  };

  const handleAdicionar = (painel: PainelEstoqueCarregamento) => {
    if ((painel.comp || 0) > maxMetros) return;
    setEstoque(prev => prev.filter(p => p.itemId !== painel.itemId));
    setSequencia(prev => [...prev, { ...painel, ordem: prev.length + 1 }]);
  };

  const handleRemover = (itemId: string) => {
    const painel = sequencia.find(p => p.itemId === itemId);
    if (!painel) return;
    setSequencia(prev => prev.filter(p => p.itemId !== itemId));
    setEstoque(prev => [...prev, painel].sort((a, b) => b.comp - a.comp || b.alt - a.alt));
  };

  const handleVehicleChange = (v: 'Munck' | 'Carreta') => {
    if (v === vehicle) return;
    if (sequencia.length > 0 && !window.confirm('Trocar o veículo vai limpar a sequência. Continuar?')) return;
    setSequencia([]);
    setEstoque([...availablePanels].sort((a, b) => b.comp - a.comp || b.alt - a.alt));
    onVehicleChange(v);
  };

  const handleSalvar = () => {
    onConfirm(distribuirOutsideIn(sequenciaOrdenada, vehicle, maxMetros));
  };

  const activeDragPanel = activeDragId ? sequencia.find(p => p.itemId === activeDragId) : null;

  // Alerta de fileira com baixa ocupação
  const temFileiraSub40 = useMemo(() => {
    if (sequenciaOrdenada.length <= 1) return false;
    const camadasBrutas: { comp: number }[] = sequenciaOrdenada.map(p => ({ comp: p.comp || 1 }));
    const camadas = buildCamadasCarregamento(camadasBrutas, maxMetros);
    return camadas.length > 1 && camadas.some(c => c.comprimentoTotal < maxMetros * 0.4);
  }, [sequenciaOrdenada, maxMetros]);

  // Barra de ocupação da última camada
  const barraOcupacao = useMemo(() => {
    const camadasBrutas: { comp: number }[] = sequenciaOrdenada.map(p => ({ comp: p.comp || 1 }));
    const camadas = buildCamadasCarregamento(camadasBrutas, maxMetros);
    const ultima = camadas[camadas.length - 1];
    return {
      ocupacao: ultima?.comprimentoTotal ?? 0,
      nCamadas: camadas.length,
    };
  }, [sequenciaOrdenada, maxMetros]);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Simulador de carregamento
          </p>
          <h3 className="mt-1 text-base font-extrabold text-text-primary">
            Sequência de montagem — {vehicle}
          </h3>
          <p className="mt-0.5 text-xs text-text-muted">
            {vehicle === 'Munck'
              ? 'Distribuição automática Esq/Dir (fora → dentro). Arraste para reordenar.'
              : 'Prancha única, frente para trás. Arraste para reordenar.'}
          </p>
        </div>

        <div className="inline-flex shrink-0 rounded-xl border border-border bg-surface-container-lowest p-1 gap-1">
          {(['Munck', 'Carreta'] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => handleVehicleChange(v)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                vehicle === v
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-surface-container-low hover:text-text-primary'
              }`}
            >
              {v === 'Munck' ? `Munck · ${MUNCK_MAX_COMP}m` : `Carreta · ${CARRETA_MAX_COMP}m`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Layout 2 colunas ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">

        {/* Coluna esquerda: lista + estoque */}
        <div className="flex flex-col gap-4">

          {/* Sequência */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">Sequência de montagem</p>
                <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                  {sequencia.length} painel(s) · {totalMetros.toFixed(1)}m
                </p>
              </div>
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-primary px-1.5 font-mono text-[10px] font-extrabold text-white">
                {sequencia.length}
              </span>
            </div>

            {/* Barra de ocupação da camada atual */}
            {sequencia.length > 0 && (() => {
              const { ocupacao, nCamadas } = barraOcupacao;
              const pct = (ocupacao / maxMetros) * 100;
              return (
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-text-muted">
                      Camada atual ({nCamadas}ª)
                    </span>
                    <span className="font-mono text-[10px] font-bold text-text-secondary">
                      {ocupacao.toFixed(1)}m / {maxMetros}m
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: pct >= 100 ? 'var(--color-success)' : pct >= 60 ? 'var(--color-primary)' : 'var(--color-warning)',
                      }}
                    />
                  </div>
                  <p className="mt-0.5 font-mono text-[9px] text-text-muted">
                    {nCamadas} camada(s) · {sequencia.length} painel(s) · {totalMetros.toFixed(1)}m total
                  </p>
                </div>
              );
            })()}

            {sequencia.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-container-low py-7 text-center">
                <p className="font-mono text-xs font-bold text-text-muted">Nenhum painel</p>
                <p className="mt-0.5 font-mono text-[10px] text-text-muted opacity-60">Selecione painéis abaixo</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sequencia.map(p => p.itemId)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-0.5">
                    {sequenciaOrdenada.map((painel, index) => (
                      <PainelCard
                        key={painel.itemId}
                        painel={painel}
                        index={index}
                        fileira={fileiraMapSimple[painel.itemId] ?? 0}
                        maxMetros={maxMetros}
                        highlighted={hoveredId === painel.itemId}
                        onRemover={handleRemover}
                        onHover={setHoveredId}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay dropAnimation={null}>
                  {activeDragPanel ? (
                    <div className="flex items-center gap-2 rounded-lg border border-primary bg-surface-container-lowest px-3 py-2 shadow-xl ring-2 ring-primary/20">
                      <GripVertical size={12} className="text-text-muted" />
                      <span className="font-mono text-xs font-extrabold text-text-primary">
                        {activeDragPanel.dimensao}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {temFileiraSub40 && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border bg-warning-bg px-3 py-2" style={{ borderColor: 'var(--color-warning)' }}>
                <AlertCircle size={12} className="mt-0.5 shrink-0 text-warning-text" />
                <p className="font-mono text-[10px] text-warning-text">
                  Camada com menos de 40% de ocupação. Reordene para otimizar o espaço.
                </p>
              </div>
            )}
          </div>

          {/* Estoque */}
          <div>
            <div className="mb-3">
              <p className="text-sm font-semibold text-text-primary">Painéis disponíveis</p>
              <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                {estoque.length} livre(s) para esta obra
              </p>
            </div>

            {estoque.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed bg-success-bg px-3 py-2.5" style={{ borderColor: 'var(--color-success)' }}>
                <CheckCircle2 size={12} className="shrink-0 text-success" />
                <span className="font-mono text-[10px] font-bold text-success-text">
                  Todos os painéis adicionados
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                {estoque.map(painel => (
                  <EstoqueCard
                    key={painel.itemId}
                    painel={painel}
                    onAdicionar={handleAdicionar}
                    excede={painel.comp > maxMetros}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita: visualização */}
        <div className="rounded-xl border border-border bg-surface-container-lowest p-5">
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-mono text-xs font-extrabold text-text-primary">
                Planta baixa do carregamento
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                Vista top-down · distribuição {vehicle === 'Munck' ? 'Esq/Dir (fora→dentro)' : 'prancha frente→trás'}
              </p>
            </div>
            {sequencia.length > 0 && (
              <span className="font-mono text-[10px] font-bold text-text-muted">
                {sequencia.length} painel(s) · {totalMetros.toFixed(1)}m
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg bg-surface-container-low p-3">
            <PlantaBaixaSVG
              paineis={planoPreview}
              veiculo={vehicle}
              highlightId={hoveredId ?? undefined}
            />
          </div>
        </div>
      </div>

      {/* ── Rodapé ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-container-lowest px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
            Confirmar plano
          </p>
          <p className="mt-1 font-mono text-xs text-text-secondary">
            {sequencia.length === 0
              ? 'Adicione pelo menos um painel para salvar.'
              : `${sequencia.length} painel(s) · ${totalMetros.toFixed(1)}m`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, border: '1.5px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-container-low)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={sequencia.length === 0}
            style={{ padding: '9px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, background: 'var(--color-primary)', color: '#fff', cursor: sequencia.length === 0 ? 'not-allowed' : 'pointer', opacity: sequencia.length === 0 ? 0.4 : 1, border: 'none', transition: 'opacity 0.15s', letterSpacing: '-0.01em' }}
          >
            Salvar plano de carregamento
          </button>
        </div>
      </div>
    </div>
  );
}
