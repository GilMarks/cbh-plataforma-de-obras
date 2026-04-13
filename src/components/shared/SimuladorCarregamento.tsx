/**
 * SimuladorCarregamento — Versão 5
 *
 * Lógica baseada no HTML MVP feito pelo cliente (docs/MVP_FEITO_PELO_CLIENTE.html).
 *
 * ALGORITMO DO CLIENTE:
 * - Painéis são divididos em TOPO (índices pares: 1º, 3º...) e BASE (ímpares: 2º, 4º...)
 * - BASE é invertida para criar simetria borda→centro
 * - Painéis são CENTRADOS horizontalmente dentro da área útil
 * - Largura de cada painel ∝ comprimento real (escala: ~127px/m para 6m)
 * - Altura das fileiras: fixa entre 28-38px (cap do cliente: 14-34px)
 *
 * ESTRUTURA SVG (dimensões do cliente):
 * [CABINE]  [══════════════ CARROCERIA ══════════════════]
 *           [  ┌─ ─ ─ Área útil (amarela tracejada) ─ ─┐ ]
 *           [  │     ┌──── Painel 5 x 3m ────────────┐  │ ]
 *           [  │     │  Carregamento Munck            │  │ ]
 *           [  │     └────────────────────────────────┘  │ ]
 *           [  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ ]
 *           [══════════════════════════════════════════════]
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
import { formatMeters, type PainelEstoqueCarregamento, criarPlanoZona } from '../../lib/carregamento';
import type { PainelCarregamento } from '../../lib/types';

// ─── Dimensões físicas ────────────────────────────────────────────────────────
const MUNCK_COMP_M   = 6;
const CARRETA_COMP_M = 12;

// ─── Escala (do cliente: 760px / 6m ≈ 127px/m) ───────────────────────────────
const PX_PER_M_MUNCK   = 127;   // 6m  → 762px
const PX_PER_M_CARRETA = 63;    // 12m → 756px

// ─── Dimensões do SVG (proporcionais ao cliente) ──────────────────────────────
// Cliente: cabine 160×300, carroceria 980×360, área útil 760×300
// Usamos ~85% dessas dimensões para caber bem em telas menores
const CABINE_W   = 130;
const CABINE_H   = 250;
const CABINE_GAP = 12;

// Carroceria: margem lateral = 80px de cada lado além da área útil
// Margem vertical = 30px de cada lado
const CARROC_MARGIN_X = 80;
const CARROC_MARGIN_Y = 30;

// Área útil: margem interna de 20px horizontal, 20px vertical
const AREA_MARGIN_X = 20;
const AREA_MARGIN_Y = 20;

// Altura das fileiras: fixo entre 28–38px (cliente: 14–34px, escalado)
const ROW_H_MIN = 28;
const ROW_H_MAX = 38;
const ROW_GAP   = 6;

const SVG_PAD = 14;

function getVParams(v: 'Munck' | 'Carreta') {
  const maxComp = v === 'Carreta' ? CARRETA_COMP_M : MUNCK_COMP_M;
  const pxPerM  = v === 'Carreta' ? PX_PER_M_CARRETA : PX_PER_M_MUNCK;
  const areaUtilW = maxComp * pxPerM;
  return { maxComp, pxPerM, areaUtilW };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface PainelOrdenado extends PainelEstoqueCarregamento {
  ordem: number;
}

// ─── Paleta de cores por fileira ─────────────────────────────────────────────
const FILEIRA_CORES = [
  { fill: '#dcfce7', stroke: '#16a34a', text: '#14532d' }, // verde
  { fill: '#dbeafe', stroke: '#2563eb', text: '#1e3a8a' }, // azul
  { fill: '#fef9c3', stroke: '#ca8a04', text: '#713f12' }, // amarelo
  { fill: '#fce7f3', stroke: '#db2777', text: '#831843' }, // rosa
  { fill: '#f3e8ff', stroke: '#9333ea', text: '#581c87' }, // roxo
  { fill: '#ffedd5', stroke: '#ea580c', text: '#7c2d12' }, // laranja
  { fill: '#cffafe', stroke: '#0891b2', text: '#164e63' }, // ciano
  { fill: '#fee2e2', stroke: '#dc2626', text: '#7f1d1d' }, // vermelho
];
function getFileiraCor(fi: number) {
  return FILEIRA_CORES[fi % FILEIRA_CORES.length];
}

// ─── Algoritmo greedy bin-packing por fileiras ────────────────────────────────
// - Painéis são empilhados LADO A LADO horizontalmente
// - Quando soma dos comp > maxComp, nova fileira começa
// - 1ª fileira = borda (topo), última = centro (fundo)
// - Cada fileira tem altura proporcional ao maior painel (alt) da fileira
// - Painéis alinhados à esquerda da área útil

interface Fileira {
  paineis: PainelOrdenado[];
  compTotal: number;
  altMax: number;      // metros — define espessura visual da fileira
  yPx: number;         // posição Y absoluta no SVG
  hPx: number;         // altura em px da fileira
}

interface BlocoSvg {
  painel: PainelOrdenado;
  fileira: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

function calcFileiras(paineis: PainelOrdenado[], maxComp: number): Fileira[] {
  const rows: Fileira[] = [];
  let i = 0;
  while (i < paineis.length) {
    const grupo: PainelOrdenado[] = [];
    let comp = 0;
    while (i < paineis.length) {
      const p = paineis[i];
      const c = p.comp > 0 ? p.comp : 1;
      if (grupo.length > 0 && comp + c > maxComp + 0.001) break;
      grupo.push(p); comp += c; i++;
    }
    const altMax = Math.max(...grupo.map(p => p.alt > 0 ? p.alt : 2.3));
    rows.push({ paineis: grupo, compTotal: comp, altMax, yPx: 0, hPx: 0 });
  }
  return rows;
}

function calcBlocos(
  paineis: PainelOrdenado[],
  maxComp: number,
  pxPerM: number,
  areaUtilW: number,
  _areaUtilH: number,
  origemX: number,   // X do lado esquerdo da área útil (onde painéis começam)
  origemY: number,   // Y do topo da área útil
): BlocoSvg[] {
  if (paineis.length === 0) return [];

  const fileiras = calcFileiras(paineis, maxComp);

  // Calcula altura proporcional: 1 metro de alt = ROW_H_MIN px mínimo
  // Escala: queremos que 3m de alt → ~38px, 2m → ~26px
  const PX_PER_ALT = 13; // px por metro de altura do painel
  const MIN_H = ROW_H_MIN;
  const MAX_H = ROW_H_MAX;

  // Acumula posição Y
  let yAcc = origemY + AREA_MARGIN_Y;
  for (const row of fileiras) {
    row.hPx = Math.max(MIN_H, Math.min(MAX_H, row.altMax * PX_PER_ALT));
    row.yPx = yAcc;
    yAcc += row.hPx + ROW_GAP;
  }

  const blocos: BlocoSvg[] = [];
  fileiras.forEach((row, fi) => {
    let xCursor = origemX + AREA_MARGIN_X;
    row.paineis.forEach((p, pi) => {
      const pComp = p.comp > 0 ? p.comp : 1;
      const w = pComp * pxPerM - (pi > 0 ? 2 : 0);
      blocos.push({
        painel: p,
        fileira: fi,
        x: xCursor + (pi > 0 ? 2 : 0),
        y: row.yPx,
        w: Math.max(w, 4),
        h: row.hPx,
      });
      xCursor += pComp * pxPerM;
    });
  });

  // Suprime warning de unused areaUtilW
  void areaUtilW;

  return blocos;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG PlantaBaixa — estrutura exata do cliente
// ─────────────────────────────────────────────────────────────────────────────
function PlantaBaixa({
  paineis,
  veiculo,
}: {
  paineis: PainelOrdenado[];
  veiculo: 'Munck' | 'Carreta';
}) {
  const { maxComp, pxPerM, areaUtilW } = getVParams(veiculo);

  // Calcula fileiras para determinar altura dinâmica da área útil
  const fileiras = calcFileiras(paineis, maxComp);
  const PX_PER_ALT = 13;
  const conteudoH = fileiras.length === 0
    ? ROW_H_MAX * 3  // altura mínima quando vazio
    : fileiras.reduce((s, r) => s + Math.max(ROW_H_MIN, Math.min(ROW_H_MAX, r.altMax * PX_PER_ALT)) + ROW_GAP, 0) - ROW_GAP;

  const areaUtilH = Math.max(conteudoH + AREA_MARGIN_Y * 2, 140);

  // Carroceria: envolve área útil com margens
  const carrocW = areaUtilW + CARROC_MARGIN_X * 2;
  const carrocH = areaUtilH + CARROC_MARGIN_Y * 2;

  const svgW = SVG_PAD + CABINE_W + CABINE_GAP + carrocW + SVG_PAD;
  const svgH = SVG_PAD + Math.max(carrocH, CABINE_H) + SVG_PAD + 22;

  const cabineX = SVG_PAD;
  const cabineY = SVG_PAD + (Math.max(carrocH, CABINE_H) - CABINE_H) / 2;

  const carrocX = SVG_PAD + CABINE_W + CABINE_GAP;
  const carrocY = SVG_PAD + (Math.max(carrocH, CABINE_H) - carrocH) / 2;

  const areaX = carrocX + CARROC_MARGIN_X;
  const areaY = carrocY + CARROC_MARGIN_Y;

  // Blocos dos painéis (alinhados à esquerda, lado a lado)
  const blocos = calcBlocos(
    paineis, maxComp, pxPerM, areaUtilW, areaUtilH,
    areaX, areaY,
  );

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      aria-label={`Planta baixa do carregamento — ${veiculo}`}
    >
      {/* ── Cabine (verde, fora da carroceria) ── */}
      <rect
        x={cabineX} y={cabineY}
        width={CABINE_W} height={CABINE_H}
        rx={8}
        fill="#dcfce7" stroke="#166534" strokeWidth={2}
      />
      <text
        x={cabineX + CABINE_W / 2}
        y={cabineY + CABINE_H / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={15} fontWeight="700" fill="#166534"
        fontFamily="Arial, sans-serif"
      >
        CABINE
      </text>

      {/* ── Carroceria (branca, borda cinza arredondada) ── */}
      <rect
        x={carrocX} y={carrocY}
        width={carrocW} height={carrocH}
        rx={10}
        fill="#ffffff" stroke="#111827" strokeWidth={2}
      />

      {/* ── Área útil de carregamento (amarela tracejada) ── */}
      <rect
        x={areaX} y={areaY}
        width={areaUtilW} height={areaUtilH}
        rx={8}
        fill="#fef3c7"
        stroke="#d97706"
        strokeWidth={2}
        strokeDasharray="8 6"
      />

      {/* Label "Área útil de carregamento" */}
      <text
        x={areaX + areaUtilW / 2}
        y={areaY - 10}
        textAnchor="middle"
        fontSize={12} fill="#92400e" fontWeight="600"
        fontFamily="Arial, sans-serif"
      >
        Área útil de carregamento
      </text>

      {/* Label central do veículo (placeholder quando vazio) */}
      {paineis.length === 0 && (
        <text
          x={areaX + areaUtilW / 2}
          y={areaY + areaUtilH / 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={14} fill="#92400e" fontWeight="500"
          fontFamily="Arial, sans-serif"
          opacity={0.35}
        >
          Adicione painéis para visualizar
        </text>
      )}

      {/* ── Painéis ── */}
      {blocos.map(({ painel, fileira, x, y, w, h }) => {
        const dimLabel = `${painel.comp > 0 ? painel.comp : '?'} x ${painel.alt > 0 ? painel.alt : '?'}m`;
        const showLabel = w > 50 && h >= ROW_H_MIN;
        const nFileiras = [...new Set(blocos.map(b => b.fileira))].length;
        const par = Math.min(fileira, nFileiras - 1 - fileira);
        const cor = getFileiraCor(par);
        return (
          <g key={painel.itemId}>
            <rect
              x={x} y={y}
              width={Math.max(w, 8)} height={h}
              rx={4}
              fill={cor.fill} stroke={cor.stroke} strokeWidth={2}
            />
            {showLabel && (
              <text
                x={x + w / 2}
                y={y + h / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.min(14, Math.max(10, w / 7))}
                fontWeight="600" fill={cor.text}
                fontFamily="Arial, sans-serif"
              >
                {dimLabel}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Marcadores de metro (alinhados ao início da área útil) ── */}
      {Array.from({ length: maxComp + 1 }, (_, i) => (
        <text
          key={`m${i}`}
          x={areaX + AREA_MARGIN_X + i * pxPerM}
          y={carrocY + carrocH + 15}
          textAnchor="middle"
          fontSize={9} fill="#64748b"
          fontFamily="monospace"
        >
          {i}m
        </text>
      ))}

    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card sortable na lista de sequência
// ─────────────────────────────────────────────────────────────────────────────
function PainelCard({
  painel,
  index,
  fileira,
  maxMetros,
  onRemover,
}: {
  painel: PainelOrdenado;
  index: number;
  fileira: number;
  maxMetros: number;
  onRemover: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: painel.itemId,
  });

  const paleta = getFileiraCor(fileira);
  const cor = { bg: paleta.fill, border: paleta.stroke, text: paleta.text };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, borderColor: cor.border, background: cor.bg }}
      className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-shadow hover:shadow-sm"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-slate-300 hover:text-slate-500 active:cursor-grabbing"
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

      <span className="min-w-0 flex-1 font-mono text-xs font-bold tabular-nums text-slate-800">
        {painel.dimensao}
      </span>

      <div className="hidden w-12 shrink-0 sm:block">
        <div className="h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min((painel.comp / maxMetros) * 100, 100)}%`, background: cor.border }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemover(painel.itemId)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
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
          ? 'border-slate-100 bg-slate-50 opacity-40'
          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50'
      }`}
    >
      <span className="min-w-0 flex-1 font-mono text-xs font-bold tabular-nums text-slate-700">
        {painel.dimensao}
      </span>
      <span className="shrink-0 font-mono text-[10px] text-slate-400">
        {formatMeters(painel.comp)}
      </span>
      <button
        type="button"
        disabled={excede}
        onClick={() => onAdicionar(painel)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-blue-200 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        title={excede ? 'Painel excede o limite do veículo' : 'Adicionar'}
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lista legenda abaixo do SVG
// ─────────────────────────────────────────────────────────────────────────────
function ListaLegenda({ paineis }: { paineis: PainelOrdenado[] }) {
  if (paineis.length === 0) return null;
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="mb-2 font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
        Detalhamento dos painéis
      </p>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {paineis.map((p, i) => {
          return (
            <div
              key={p.itemId}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5"
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-extrabold text-white bg-slate-700"
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 font-mono text-[11px] font-bold text-slate-700 truncate">
                {p.dimensao}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-slate-400">
                {formatMeters(p.comp)} × {formatMeters(p.alt || 0)}
              </span>
            </div>
          );
        })}
      </div>
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
  const [sequencia, setSequencia]       = useState<PainelOrdenado[]>([]);
  const [estoque, setEstoque]           = useState<PainelEstoqueCarregamento[]>(() =>
    [...availablePanels].sort((a, b) => b.comp - a.comp || b.alt - a.alt),
  );
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const resetRef = useRef<string | null>(null);

  const { maxComp: maxMetros } = getVParams(vehicle);

  // Calculado cedo para usar em handleAdicionar
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

  // Mapa itemId → índice de "par" de descarga
  // Par = Math.min(fi, total-1-fi): fileira 0 e última = par 0, fileira 1 e penúltima = par 1, etc.
  const fileiraMap = useMemo<Record<string, number>>(() => {
    const fileiras = calcFileiras(sequenciaOrdenada, maxMetros);
    const n = fileiras.length;
    const map: Record<string, number> = {};
    fileiras.forEach((row, fi) => {
      const par = Math.min(fi, n - 1 - fi);
      row.paineis.forEach(p => { map[p.itemId] = par; });
    });
    return map;
  }, [sequenciaOrdenada, maxMetros]);

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
    // Bloqueia apenas se o painel individualmente não cabe numa fileira
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
    const zona = vehicle === 'Carreta' ? ('Prancha' as const) : ('Esquerdo' as const);
    onConfirm(criarPlanoZona(zona, sequenciaOrdenada, maxMetros));
  };

  const activeDragPanel = activeDragId ? sequencia.find(p => p.itemId === activeDragId) : null;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Simulador de carregamento
          </p>
          <h3 className="mt-1 text-base font-extrabold text-slate-900">
            Sequência de montagem — {vehicle}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400">
            Arraste para reordenar a sequência de montagem.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 gap-1">
          {(['Munck', 'Carreta'] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => handleVehicleChange(v)}
              className={`rounded-md px-4 py-1.5 font-mono text-xs font-bold transition-all ${
                vehicle === v ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {v === 'Munck' ? `Munck · ${MUNCK_COMP_M}m` : `Carreta · ${CARRETA_COMP_M}m`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Layout 2 colunas ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">

        {/* Coluna esquerda: lista + estoque */}
        <div className="flex flex-col gap-4">

          {/* Sequência */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs font-extrabold text-slate-700">Sequência de montagem</p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                  {sequencia.length} painel(s) · {totalMetros.toFixed(1)}m
                </p>
              </div>
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-slate-900 px-2 font-mono text-[11px] font-extrabold text-white">
                {sequencia.length}
              </span>
            </div>

            {/* Barra de ocupação da fileira atual */}
            {sequencia.length > 0 && (() => {
              const fs = calcFileiras(sequenciaOrdenada, maxMetros);
              const ultimaFileira = fs[fs.length - 1];
              const ocupacao = ultimaFileira ? ultimaFileira.compTotal : 0;
              const pct = (ocupacao / maxMetros) * 100;
              return (
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400">
                      Fileira atual ({fs.length}ª)
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-600">
                      {ocupacao.toFixed(1)}m / {maxMetros}m
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: pct >= 100 ? '#16a34a' : pct >= 60 ? '#2563eb' : '#f59e0b',
                      }}
                    />
                  </div>
                  <p className="mt-0.5 font-mono text-[9px] text-slate-400">
                    {fs.length} fileira(s) · {sequencia.length} painel(s) · {totalMetros.toFixed(1)}m total
                  </p>
                </div>
              );
            })()}

            {sequencia.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-7 text-center">
                <p className="font-mono text-xs font-bold text-slate-400">Nenhum painel</p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-300">Selecione painéis abaixo</p>
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
                        fileira={fileiraMap[painel.itemId] ?? 0}
                        maxMetros={maxMetros}
                        onRemover={handleRemover}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay dropAnimation={null}>
                  {activeDragPanel ? (
                    <div className="flex items-center gap-2 rounded-lg border border-blue-400 bg-white px-3 py-2 shadow-xl ring-2 ring-blue-200">
                      <GripVertical size={12} className="text-slate-400" />
                      <span className="font-mono text-xs font-extrabold text-slate-900">
                        {activeDragPanel.dimensao}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {sequencia.length > 1 && (() => {
              // Avisa se alguma fileira ficou com menos de 40% de ocupação
              const fs = calcFileiras(sequenciaOrdenada, maxMetros);
              const temFolga = fs.some(f => f.compTotal < maxMetros * 0.4 && fs.length > 1);
              return temFolga ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                  <AlertCircle size={12} className="mt-0.5 shrink-0 text-amber-500" />
                  <p className="font-mono text-[10px] text-amber-700">
                    Fileira com menos de 40% de ocupação. Reordene para otimizar o espaço.
                  </p>
                </div>
              ) : null;
            })()}
          </div>

          {/* Estoque */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <p className="font-mono text-xs font-extrabold text-slate-700">Painéis disponíveis</p>
              <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                {estoque.length} livre(s) para esta obra
              </p>
            </div>

            {estoque.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
                <span className="font-mono text-[10px] font-bold text-emerald-700">
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
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-mono text-xs font-extrabold text-slate-700">
                Planta baixa do carregamento
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                Vista top-down · proporção real
              </p>
            </div>
            {sequencia.length > 0 && (
              <span className="font-mono text-[10px] font-bold text-slate-500">
                {sequencia.length} painel(s) · {totalMetros.toFixed(1)}m
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg bg-slate-50 p-3">
            <PlantaBaixa paineis={sequenciaOrdenada} veiculo={vehicle} />
          </div>

          <ListaLegenda paineis={sequenciaOrdenada} />
        </div>
      </div>

      {/* ── Rodapé ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Confirmar plano
          </p>
          <p className="mt-1 font-mono text-xs text-slate-600">
            {sequencia.length === 0
              ? 'Adicione pelo menos um painel para salvar.'
              : `${sequencia.length} painel(s) · ${totalMetros.toFixed(1)}m`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-mono text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={sequencia.length === 0}
            className="rounded-lg bg-slate-900 px-5 py-2 font-mono text-xs font-extrabold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
          >
            Salvar plano de carregamento
          </button>
        </div>
      </div>
    </div>
  );
}
