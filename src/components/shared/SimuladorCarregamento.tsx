import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, GripVertical } from 'lucide-react';
import {
  CARRETA_MAX_COMP,
  MUNCK_MAX_COMP,
  criarPlanoLado,
  criarPlanoZona,
  formatMeters,
  type PainelEstoqueCarregamento,
} from '../../lib/carregamento';
import type { PainelCarregamento } from '../../lib/types';

type VehicleType = 'Munck' | 'Carreta';
type ZoneId = 'inventory' | 'esquerdo' | 'direito' | 'prancha';

interface SimuladorCarregamentoProps {
  availablePanels: PainelEstoqueCarregamento[];
  vehicle: VehicleType;
  onVehicleChange: (vehicle: VehicleType) => void;
  resetKey: string;
  onConfirm: (plano: PainelCarregamento[]) => void;
  onCancel: () => void;
}

interface ZoneState {
  inventory: PainelEstoqueCarregamento[];
  esquerdo: PainelEstoqueCarregamento[];
  direito: PainelEstoqueCarregamento[];
  prancha: PainelEstoqueCarregamento[];
}

interface DragPayload {
  item: PainelEstoqueCarregamento;
  zone: ZoneId;
}

interface VehicleConfig {
  key: VehicleType;
  label: string;
  maxLayerLength: number;
  canvasHeightPx: number;
  minColumns: number;
  layerPlacement: 'prepend' | 'append';
  boardLabel: string;
  boardDescription: string;
}

interface LayerGroup {
  items: PainelEstoqueCarregamento[];
  totalMeters: number;
}

interface ZoneMetrics {
  layers: LayerGroup[];
  activeLayerMeters: number;
  totalMeters: number;
  pieceCount: number;
  canvasHeightPx: number;
  canvasWidthPx: number;
  columnSlots: number;
}

const PIXELS_PER_METER = 50;
const COLUMN_WIDTH_PX = 88;
const PANEL_HANDLE_WIDTH_PX = 18;
const INVENTORY_CARD_WIDTH_PX = 220;
const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-wider text-slate-500';
const NUMERIC_CLASS = 'tabular-nums tracking-tight font-medium';
const BLUEPRINT_GRID = {
  backgroundImage:
    'linear-gradient(to right, rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)',
  backgroundSize: `${COLUMN_WIDTH_PX}px ${PIXELS_PER_METER}px`,
};

const VEHICLE_CONFIG: Record<VehicleType, VehicleConfig> = {
  Munck: {
    key: 'Munck',
    label: 'Caminhao Munck (6m)',
    maxLayerLength: MUNCK_MAX_COMP,
    canvasHeightPx: MUNCK_MAX_COMP * PIXELS_PER_METER,
    minColumns: 3,
    layerPlacement: 'prepend',
    boardLabel: 'Workbench do Munck',
    boardDescription: 'Cabine, guindaste e cavalete central com carga equilibrada em duas pistas laterais.',
  },
  Carreta: {
    key: 'Carreta',
    label: 'Carreta Prancha (12m)',
    maxLayerLength: CARRETA_MAX_COMP,
    canvasHeightPx: CARRETA_MAX_COMP * PIXELS_PER_METER,
    minColumns: 5,
    layerPlacement: 'append',
    boardLabel: 'Workbench da Prancha',
    boardDescription: 'Prancha unica com faixas sequenciais do cabecalho para a traseira.',
  },
};

function sortInventoryPanels(panels: PainelEstoqueCarregamento[]) {
  return [...panels].sort((a, b) => {
    if (a.comp !== b.comp) return b.comp - a.comp;
    if (a.alt !== b.alt) return b.alt - a.alt;
    return a.codigo.localeCompare(b.codigo);
  });
}

function groupIntoLayers(items: PainelEstoqueCarregamento[], maxLength: number): PainelEstoqueCarregamento[][] {
  const layers: PainelEstoqueCarregamento[][] = [];
  let currentLayer: PainelEstoqueCarregamento[] = [];
  let currentLength = 0;

  for (const item of items) {
    if (item.comp > maxLength) continue;

    if (currentLayer.length > 0 && currentLength + item.comp > maxLength) {
      layers.push(currentLayer);
      currentLayer = [item];
      currentLength = item.comp;
      continue;
    }

    currentLayer.push(item);
    currentLength += item.comp;
  }

  if (currentLayer.length > 0) {
    layers.push(currentLayer);
  }

  return layers;
}

function sumLayerMeters(items: PainelEstoqueCarregamento[]) {
  return items.reduce((total, item) => total + item.comp, 0);
}

function panelHeightPx(panel: PainelEstoqueCarregamento) {
  return panel.comp * PIXELS_PER_METER;
}

function getZoneWidthPx(layerCount: number, minColumns: number) {
  return Math.max(layerCount, minColumns) * COLUMN_WIDTH_PX + 24;
}

function buildZoneMetrics(panels: PainelEstoqueCarregamento[], config: VehicleConfig): ZoneMetrics {
  const layers = groupIntoLayers(panels, config.maxLayerLength).map(items => ({
    items,
    totalMeters: sumLayerMeters(items),
  }));
  const activeLayer =
    config.layerPlacement === 'prepend' ? layers[0] : layers[layers.length - 1];

  return {
    layers,
    activeLayerMeters: activeLayer?.totalMeters ?? 0,
    totalMeters: panels.reduce((total, panel) => total + panel.comp, 0),
    pieceCount: panels.length,
    canvasHeightPx: config.canvasHeightPx,
    canvasWidthPx: getZoneWidthPx(layers.length, config.minColumns),
    columnSlots: Math.max(layers.length, config.minColumns),
  };
}

function insertIntoZone(
  currentPanels: PainelEstoqueCarregamento[],
  movingPanel: PainelEstoqueCarregamento,
  config: VehicleConfig,
): PainelEstoqueCarregamento[] {
  if (movingPanel.comp > config.maxLayerLength) return currentPanels;

  const layers = groupIntoLayers(currentPanels, config.maxLayerLength);
  if (layers.length === 0) return [movingPanel];

  const activeLayer =
    config.layerPlacement === 'prepend' ? layers[0] : layers[layers.length - 1];

  if (sumLayerMeters(activeLayer) + movingPanel.comp <= config.maxLayerLength) {
    if (config.layerPlacement === 'prepend') {
      const insertIndex = activeLayer.length;
      return [
        ...currentPanels.slice(0, insertIndex),
        movingPanel,
        ...currentPanels.slice(insertIndex),
      ];
    }

    return [...currentPanels, movingPanel];
  }

  return config.layerPlacement === 'prepend'
    ? [movingPanel, ...currentPanels]
    : [...currentPanels, movingPanel];
}

function useDropZone(zone: ZoneId) {
  return useDroppable({
    id: zone,
    data: { zone },
  });
}

function VehicleTabs({
  vehicle,
  onChange,
}: {
  vehicle: VehicleType;
  onChange: (next: VehicleType) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
      {(Object.values(VEHICLE_CONFIG) as VehicleConfig[]).map(option => {
        const active = option.key === vehicle;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active ? 'border border-slate-200 bg-white text-slate-900' : 'border border-transparent text-slate-600'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className={LABEL_CLASS}>{label}</div>
      <div className={`mt-1 text-sm text-slate-900 ${NUMERIC_CLASS}`}>{value}</div>
    </div>
  );
}

function InventoryPanelCard({
  panel,
  vehicleConfig,
  dragHandleProps,
  isDragging = false,
  disabled = false,
}: {
  panel: PainelEstoqueCarregamento;
  vehicleConfig: VehicleConfig;
  dragHandleProps?: {
    attributes?: object;
    listeners?: object;
  };
  isDragging?: boolean;
  disabled?: boolean;
}) {
  const ratio = Math.min(panel.comp / vehicleConfig.maxLayerLength, 1);

  return (
    <article
      className={`overflow-hidden rounded-xl border ${
        disabled ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-300 bg-white text-slate-700'
      }`}
      style={{
        width: `${INVENTORY_CARD_WIDTH_PX}px`,
        minWidth: `${INVENTORY_CARD_WIDTH_PX}px`,
        opacity: isDragging ? 0.45 : 1,
      }}
    >
      <div className="flex h-full items-stretch">
        <div
          {...(dragHandleProps?.attributes ?? {})}
          {...(dragHandleProps?.listeners ?? {})}
          className={`flex w-10 shrink-0 items-center justify-center ${
            disabled
              ? 'cursor-not-allowed border-r border-slate-200 bg-slate-100 text-slate-300'
              : 'cursor-grab border-r border-slate-200 bg-slate-50 text-slate-400 active:cursor-grabbing'
          }`}
          style={{ touchAction: 'none' }}
        >
          <GripVertical size={14} />
        </div>

        <div className="min-w-0 flex-1 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={`truncate text-sm text-slate-900 ${NUMERIC_CLASS}`}>{panel.codigo}</div>
              <div className="mt-1 text-xs text-slate-500">{panel.dimensao}</div>
            </div>
            <span
              className={`rounded-full border px-2 py-1 text-[11px] ${
                disabled ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
              } ${NUMERIC_CLASS}`}
            >
              {formatMeters(panel.comp)}
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={disabled ? 'h-full bg-slate-300' : 'h-full bg-slate-700'}
              style={{ width: `${Math.max(ratio * 100, 8)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>Solicitacao #{panel.solicitacaoId}</span>
            <span>{disabled ? 'Excede o limite deste veiculo' : 'Pronto para arrastar'}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function DraggableInventoryPanel({
  panel,
  vehicleConfig,
}: {
  panel: PainelEstoqueCarregamento;
  vehicleConfig: VehicleConfig;
}) {
  const disabled = panel.comp > vehicleConfig.maxLayerLength;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: panel.itemId,
    data: { item: panel, zone: 'inventory' } satisfies DragPayload,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className="shrink-0"
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition: isDragging ? 'none' : 'transform 120ms ease',
      }}
    >
      <InventoryPanelCard
        panel={panel}
        vehicleConfig={vehicleConfig}
        disabled={disabled}
        isDragging={isDragging}
        dragHandleProps={{ attributes: attributes as object, listeners: listeners as object | undefined }}
      />
    </div>
  );
}

function CanvasPanelBlock({
  panel,
  handlePosition = 'right',
  dragHandleProps,
  isDragging = false,
}: {
  panel: PainelEstoqueCarregamento;
  handlePosition?: 'left' | 'right';
  dragHandleProps?: {
    attributes?: object;
    listeners?: object;
  };
  isDragging?: boolean;
}) {
  const grip = (
    <div
      {...(dragHandleProps?.attributes ?? {})}
      {...(dragHandleProps?.listeners ?? {})}
      className={`flex h-full shrink-0 cursor-grab items-center justify-center bg-slate-50 text-slate-400 active:cursor-grabbing ${
        handlePosition === 'left' ? 'border-r border-slate-200' : 'border-l border-slate-200'
      }`}
      style={{
        width: `${PANEL_HANDLE_WIDTH_PX}px`,
        touchAction: 'none',
      }}
    >
      <GripVertical size={12} />
    </div>
  );

  return (
    <article
      className="overflow-hidden rounded-md border border-slate-300 bg-white text-slate-700"
      style={{
        width: `${COLUMN_WIDTH_PX - 8}px`,
        minWidth: `${COLUMN_WIDTH_PX - 8}px`,
        height: `${panelHeightPx(panel)}px`,
        minHeight: `${panelHeightPx(panel)}px`,
        opacity: isDragging ? 0.45 : 1,
      }}
      title={`${panel.codigo} - ${formatMeters(panel.comp)}`}
    >
      <div className="flex h-full items-stretch">
        {handlePosition === 'left' ? grip : null}
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 text-center">
          <div className={`w-full truncate text-[11px] text-slate-800 ${NUMERIC_CLASS}`}>{panel.codigo}</div>
          <div className={`mt-1 w-full truncate text-[10px] text-slate-500 ${NUMERIC_CLASS}`}>
            {formatMeters(panel.comp)}
          </div>
        </div>
        {handlePosition === 'right' ? grip : null}
      </div>
    </article>
  );
}

function DraggableCanvasPanel({
  panel,
  zone,
}: {
  panel: PainelEstoqueCarregamento;
  zone: Exclude<ZoneId, 'inventory'>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: panel.itemId,
    data: { item: panel, zone } satisfies DragPayload,
  });

  return (
    <div
      ref={setNodeRef}
      className="shrink-0"
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition: isDragging ? 'none' : 'transform 120ms ease',
      }}
    >
      <CanvasPanelBlock
        panel={panel}
        handlePosition={zone === 'direito' ? 'left' : 'right'}
        isDragging={isDragging}
        dragHandleProps={{ attributes: attributes as object, listeners: listeners as object | undefined }}
      />
    </div>
  );
}

function EmptyColumn({
  borderClass,
  heightPx,
}: {
  borderClass: string;
  heightPx: number;
}) {
  return (
    <div
      className={`shrink-0 border-dashed ${borderClass}`}
      style={{
        width: `${COLUMN_WIDTH_PX}px`,
        minWidth: `${COLUMN_WIDTH_PX}px`,
        height: `${heightPx}px`,
      }}
    />
  );
}

function CanvasColumn({
  items,
  zone,
  borderClass,
  heightPx,
}: {
  items: PainelEstoqueCarregamento[];
  zone: Exclude<ZoneId, 'inventory'>;
  borderClass: string;
  heightPx: number;
}) {
  return (
    <div
      className={`shrink-0 ${borderClass}`}
      style={{
        width: `${COLUMN_WIDTH_PX}px`,
        minWidth: `${COLUMN_WIDTH_PX}px`,
        height: `${heightPx}px`,
      }}
    >
      <div className="flex h-full w-full flex-col-reverse items-center justify-start gap-px px-[4px]">
        {items.map(panel => (
          <DraggableCanvasPanel key={panel.itemId} panel={panel} zone={zone} />
        ))}
      </div>
    </div>
  );
}

function InventoryRail({
  inventory,
  vehicleConfig,
}: {
  inventory: PainelEstoqueCarregamento[];
  vehicleConfig: VehicleConfig;
}) {
  const validCount = inventory.filter(panel => panel.comp <= vehicleConfig.maxLayerLength).length;
  const blockedCount = inventory.length - validCount;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className={LABEL_CLASS}>Inventario de embarque</div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Painel picking rail</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            O estoque fica em fichas compactas. O palco e que obedece a escala fisica de {PIXELS_PER_METER}px por metro.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <MetricChip label="Fichas" value={inventory.length} />
          <MetricChip label="Compativeis" value={validCount} />
          <MetricChip label="Bloqueadas" value={blockedCount} />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {inventory.length === 0 ? (
          <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <div>
              <div className={LABEL_CLASS}>Estoque distribuido</div>
              <p className="mt-2 text-sm text-slate-600">Todas as pecas livres desta obra ja foram posicionadas no plano.</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            {inventory.map(panel => (
              <DraggableInventoryPanel key={panel.itemId} panel={panel} vehicleConfig={vehicleConfig} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MunckSideDropZone({
  label,
  zone,
  metrics,
  vehicleConfig,
}: {
  label: string;
  zone: 'esquerdo' | 'direito';
  metrics: ZoneMetrics;
  vehicleConfig: VehicleConfig;
}) {
  const dropZone = useDropZone(zone);
  const visibleLayers = [...metrics.layers].reverse();
  const placeholderCount = Math.max(metrics.columnSlots - visibleLayers.length, 0);
  const reverse = zone === 'esquerdo';

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className={LABEL_CLASS}>{label}</div>
        <div className={`text-sm text-slate-700 ${NUMERIC_CLASS}`}>
          {formatMeters(metrics.activeLayerMeters)} / {formatMeters(vehicleConfig.maxLayerLength)}
        </div>
      </div>

      <div
        ref={dropZone.setNodeRef}
        className={`rounded-2xl border-2 border-dashed p-4 transition-colors ${
          dropZone.isOver ? 'border-amber-300 bg-amber-50/80' : 'border-slate-300 bg-slate-50'
        }`}
      >
        <div
          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-2 py-4"
          style={{ ...BLUEPRINT_GRID, height: `${metrics.canvasHeightPx}px` }}
        >
          {visibleLayers.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
              <div>
                <div className={LABEL_CLASS}>Solte no lado {label.toLowerCase()}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  A primeira camada nasce encostada no cavalete. Quando fechar {formatMeters(vehicleConfig.maxLayerLength)}, a nova camada abre para fora.
                </p>
              </div>
            </div>
          ) : null}

          <div className={`relative flex h-full items-stretch ${reverse ? 'flex-row-reverse justify-start' : 'flex-row justify-start'}`}>
            {visibleLayers.map((layer, index) => (
              <CanvasColumn
                key={`${zone}-layer-${index + 1}-${layer.items.map(item => item.itemId).join('-')}`}
                items={layer.items}
                zone={zone}
                borderClass={reverse ? 'border-r border-slate-300' : 'border-l border-slate-300'}
                heightPx={metrics.canvasHeightPx}
              />
            ))}

            {Array.from({ length: placeholderCount }, (_, index) => (
              <EmptyColumn
                key={`${zone}-placeholder-${index + 1}`}
                borderClass={reverse ? 'border-r border-slate-300' : 'border-l border-slate-300'}
                heightPx={metrics.canvasHeightPx}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MunckWorkbench({
  leftMetrics,
  rightMetrics,
  vehicleConfig,
}: {
  leftMetrics: ZoneMetrics;
  rightMetrics: ZoneMetrics;
  vehicleConfig: VehicleConfig;
}) {
  const rackHeight = Math.max(leftMetrics.canvasHeightPx, rightMetrics.canvasHeightPx);
  const stageWidth = leftMetrics.canvasWidthPx + rightMetrics.canvasWidthPx + 84;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_180px]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className={LABEL_CLASS}>Frente do veiculo</div>
            <p className="mt-1 text-sm font-semibold text-slate-900">Cabine / eixo dianteiro</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">A leitura parte do cavalete central para as faces externas.</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
            <div className={LABEL_CLASS}>Guindaste e estrutura</div>
            <p className="mt-1 text-sm font-semibold text-amber-900">Munck com cavalete central e balanceamento critico</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className={LABEL_CLASS}>Leitura tecnica</div>
            <p className="mt-1 text-sm font-semibold text-slate-900">Duas pistas laterais independentes</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">Camada interna junto ao cavalete. Proxima camada abre para fora.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div
            className="grid items-start gap-5"
            style={{
              width: 'max-content',
              minWidth: `${stageWidth}px`,
              gridTemplateColumns: `${leftMetrics.canvasWidthPx}px 44px ${rightMetrics.canvasWidthPx}px`,
            }}
          >
            <MunckSideDropZone label="Esquerda" zone="esquerdo" metrics={leftMetrics} vehicleConfig={vehicleConfig} />

            <div className="flex flex-col items-center">
              <div className={LABEL_CLASS}>Cavalete</div>
              <div className="mt-3 w-2 rounded-full border border-amber-300 bg-amber-400" style={{ height: `${rackHeight}px` }} />
              <div className="mt-3 text-center text-[11px] text-slate-500">Eixo de apoio e retirada segura</div>
            </div>

            <MunckSideDropZone label="Direita" zone="direito" metrics={rightMetrics} vehicleConfig={vehicleConfig} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CarretaWorkbench({
  pranchaMetrics,
  vehicleConfig,
}: {
  pranchaMetrics: ZoneMetrics;
  vehicleConfig: VehicleConfig;
}) {
  const dropZone = useDropZone('prancha');
  const placeholderCount = Math.max(pranchaMetrics.columnSlots - pranchaMetrics.layers.length, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_180px]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className={LABEL_CLASS}>Cabecalho da prancha</div>
            <p className="mt-1 text-sm font-semibold text-slate-900">Engate / quinta roda</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">A primeira faixa nasce junto ao cabecalho e as demais avancam para a traseira.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
            <div className={LABEL_CLASS}>Prancha continua</div>
            <p className="mt-1 text-sm font-semibold text-slate-900">Faixas unicas de ate {formatMeters(vehicleConfig.maxLayerLength)}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className={LABEL_CLASS}>Leitura tecnica</div>
            <p className="mt-1 text-sm font-semibold text-slate-900">Sem divisao esquerda/direita</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">Uma unica prancha com ocupacao da frente para tras.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className={LABEL_CLASS}>Prancha ativa</div>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Faixa atual {formatMeters(pranchaMetrics.activeLayerMeters)} / {formatMeters(vehicleConfig.maxLayerLength)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricChip label="Faixas abertas" value={pranchaMetrics.layers.length} />
              <MetricChip label="Metros ocupados" value={formatMeters(pranchaMetrics.totalMeters)} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-4">
              <div
                className="h-10 w-24 rounded-l-[28px] rounded-r-md border border-slate-300 bg-slate-100"
                style={{ clipPath: 'polygon(0 50%, 18% 0, 100% 0, 100% 100%, 18% 100%)' }}
              />
              <div>
                <div className={LABEL_CLASS}>Frente da carreta</div>
                <p className="mt-1 text-sm font-semibold text-slate-900">Cabecalho e engate</p>
              </div>
            </div>

            <div
              ref={dropZone.setNodeRef}
              className={`rounded-2xl border-2 border-dashed p-4 transition-colors ${
                dropZone.isOver ? 'border-amber-300 bg-amber-50/80' : 'border-slate-300 bg-slate-50'
              }`}
            >
              <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
                <div className="rounded-xl border border-slate-300 bg-slate-100 p-3">
                  <div className={LABEL_CLASS}>Cabeceira</div>
                  <div className="mt-2 text-xs leading-5 text-slate-600">Ponto de referencia da primeira faixa.</div>
                </div>

                <div className="overflow-x-auto">
                  <div
                    className="relative rounded-xl border border-slate-200 bg-white px-2 py-4"
                    style={{
                      ...BLUEPRINT_GRID,
                      width: `${pranchaMetrics.canvasWidthPx}px`,
                      minWidth: `${pranchaMetrics.canvasWidthPx}px`,
                      height: `${pranchaMetrics.canvasHeightPx}px`,
                    }}
                  >
                    {pranchaMetrics.layers.length === 0 ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
                        <div>
                          <div className={LABEL_CLASS}>Solte na prancha</div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Cada faixa acomoda ate {formatMeters(vehicleConfig.maxLayerLength)}. Quando fechar, a proxima faixa abre para a traseira.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex h-full items-stretch justify-start">
                      {pranchaMetrics.layers.map((layer, index) => (
                        <CanvasColumn
                          key={`prancha-layer-${index + 1}-${layer.items.map(item => item.itemId).join('-')}`}
                          items={layer.items}
                          zone="prancha"
                          borderClass="border-l border-slate-300"
                          heightPx={pranchaMetrics.canvasHeightPx}
                        />
                      ))}

                      {Array.from({ length: placeholderCount }, (_, index) => (
                        <EmptyColumn
                          key={`prancha-placeholder-${index + 1}`}
                          borderClass="border-l border-slate-300"
                          heightPx={pranchaMetrics.canvasHeightPx}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex gap-3">
                <div className="h-4 w-4 rounded-full border border-slate-300 bg-slate-200" />
                <div className="h-4 w-4 rounded-full border border-slate-300 bg-slate-200" />
                <div className="h-4 w-4 rounded-full border border-slate-300 bg-slate-200" />
              </div>
              <div className="text-right text-[11px] text-slate-500">Traseira / descarregamento sequencial</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InventoryDropWrapper({
  inventory,
  vehicleConfig,
}: {
  inventory: PainelEstoqueCarregamento[];
  vehicleConfig: VehicleConfig;
}) {
  const inventoryDrop = useDropZone('inventory');

  return (
    <div
      ref={inventoryDrop.setNodeRef}
      className={`rounded-2xl border border-dashed p-1 transition-colors ${
        inventoryDrop.isOver ? 'border-slate-300 bg-slate-50' : 'border-transparent bg-transparent'
      }`}
    >
      <InventoryRail inventory={inventory} vehicleConfig={vehicleConfig} />
    </div>
  );
}

export default function SimuladorCarregamento({
  availablePanels,
  vehicle,
  onVehicleChange,
  resetKey,
  onConfirm,
  onCancel,
}: SimuladorCarregamentoProps) {
  const [zones, setZones] = useState<ZoneState>(() => ({
    inventory: sortInventoryPanels(availablePanels),
    esquerdo: [],
    direito: [],
    prancha: [],
  }));
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);
  const resetRef = useRef<string | null>(null);

  const vehicleConfig = VEHICLE_CONFIG[vehicle];

  useEffect(() => {
    if (resetRef.current === resetKey) return;
    resetRef.current = resetKey;
    setZones({
      inventory: sortInventoryPanels(availablePanels),
      esquerdo: [],
      direito: [],
      prancha: [],
    });
    setActiveDrag(null);
  }, [availablePanels, resetKey]);

  const hasPlacedPanels = zones.esquerdo.length > 0 || zones.direito.length > 0 || zones.prancha.length > 0;
  const leftMetrics = useMemo(() => buildZoneMetrics(zones.esquerdo, VEHICLE_CONFIG.Munck), [zones.esquerdo]);
  const rightMetrics = useMemo(() => buildZoneMetrics(zones.direito, VEHICLE_CONFIG.Munck), [zones.direito]);
  const pranchaMetrics = useMemo(() => buildZoneMetrics(zones.prancha, VEHICLE_CONFIG.Carreta), [zones.prancha]);

  const selectedCount = vehicle === 'Munck' ? leftMetrics.pieceCount + rightMetrics.pieceCount : pranchaMetrics.pieceCount;
  const selectedMeters = vehicle === 'Munck' ? leftMetrics.totalMeters + rightMetrics.totalMeters : pranchaMetrics.totalMeters;

  const generatedPlan = useMemo(() => {
    if (vehicle === 'Carreta') {
      return criarPlanoZona('Prancha', zones.prancha, vehicleConfig.maxLayerLength);
    }

    return [
      ...criarPlanoLado('Esquerdo', zones.esquerdo, vehicleConfig.maxLayerLength),
      ...criarPlanoLado('Direito', zones.direito, vehicleConfig.maxLayerLength),
    ];
  }, [vehicle, vehicleConfig.maxLayerLength, zones.direito, zones.esquerdo, zones.prancha]);

  const munckBalanceRisk =
    vehicle === 'Munck' &&
    ((leftMetrics.totalMeters === 0 && rightMetrics.totalMeters > 0) ||
      (rightMetrics.totalMeters === 0 && leftMetrics.totalMeters > 0) ||
      (leftMetrics.totalMeters > 0 &&
        rightMetrics.totalMeters > 0 &&
        Math.max(leftMetrics.totalMeters, rightMetrics.totalMeters) >
          Math.min(leftMetrics.totalMeters, rightMetrics.totalMeters) * 1.2));

  const handleVehicleSwitch = (nextVehicle: VehicleType) => {
    if (nextVehicle === vehicle) return;

    if (hasPlacedPanels) {
      const confirmed =
        typeof window === 'undefined'
          ? true
          : window.confirm('Trocar o veiculo reinicia o canvas atual e devolve todas as pecas ao inventario. Deseja continuar?');
      if (!confirmed) return;
    }

    setZones(current => ({
      inventory: sortInventoryPanels([
        ...current.inventory,
        ...current.esquerdo,
        ...current.direito,
        ...current.prancha,
      ]),
      esquerdo: [],
      direito: [],
      prancha: [],
    }));
    setActiveDrag(null);
    onVehicleChange(nextVehicle);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const payload = event.active.data.current as DragPayload | undefined;
    if (!payload) return;
    setActiveDrag(payload);
  };

  const handleDragCancel = () => {
    setActiveDrag(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const payload = event.active.data.current as DragPayload | undefined;
    const targetZone = event.over?.data.current?.zone as ZoneId | undefined;
    setActiveDrag(null);

    if (!payload || !targetZone || payload.zone === targetZone) return;

    setZones(current => {
      const sourceItems = current[payload.zone];
      const movingItem = sourceItems.find(item => item.itemId === payload.item.itemId);
      if (!movingItem) return current;

      const nextSource = sourceItems.filter(item => item.itemId !== movingItem.itemId);

      if (targetZone === 'inventory') {
        return {
          ...current,
          [payload.zone]: nextSource,
          inventory: sortInventoryPanels([...current.inventory, movingItem]),
        };
      }

      const targetConfig = targetZone === 'prancha' ? VEHICLE_CONFIG.Carreta : VEHICLE_CONFIG.Munck;
      const nextTarget = insertIntoZone(current[targetZone], movingItem, targetConfig);
      if (nextTarget === current[targetZone]) return current;

      return {
        ...current,
        [payload.zone]: nextSource,
        [targetZone]: nextTarget,
      };
    });
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className="flex h-full w-full flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className={LABEL_CLASS}>Simulador operacional</div>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">{vehicleConfig.boardLabel}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{vehicleConfig.boardDescription}</p>
              <div className="mt-4">
                <VehicleTabs vehicle={vehicle} onChange={handleVehicleSwitch} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricChip label="Selecionados" value={selectedCount} />
              <MetricChip label="Metros" value={formatMeters(selectedMeters)} />
              <MetricChip label="Capacidade por faixa" value={formatMeters(vehicleConfig.maxLayerLength)} />
              <MetricChip label="Escala do palco" value={`1m = ${PIXELS_PER_METER}px`} />
            </div>
          </div>
        </header>

        {vehicle === 'Munck' ? (
          munckBalanceRisk ? (
            <div className="flex items-center gap-2 rounded-2xl border border-orange-500 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 animate-pulse">
              <AlertTriangle size={16} />
              <span>ALERTA DE BALANCEAMENTO: risco de tombamento no eixo do Munck. Redistribua as camadas antes de salvar.</span>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              Balanceamento dentro da faixa segura do Munck. Mantenha as camadas espelhadas para proteger o eixo.
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
            A carreta trabalha com prancha unica. Use faixas de ate 12m e avance do cabecalho para a traseira.
          </div>
        )}

        {vehicle === 'Munck' ? (
          <MunckWorkbench leftMetrics={leftMetrics} rightMetrics={rightMetrics} vehicleConfig={vehicleConfig} />
        ) : (
          <CarretaWorkbench pranchaMetrics={pranchaMetrics} vehicleConfig={vehicleConfig} />
        )}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className={LABEL_CLASS}>Area de devolucao</div>
          <p className="mt-1 text-sm text-slate-600">Arraste qualquer painel de volta para o estoque para remover do plano atual.</p>
        </div>

        <InventoryDropWrapper inventory={zones.inventory} vehicleConfig={vehicleConfig} />

        <footer className="flex flex-col gap-4 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className={LABEL_CLASS}>Saida operacional</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              O plano salvo leva o tipo de veiculo, a geometria do canvas e a ordem de montagem para fabrica e autorizacao.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(generatedPlan)}
              disabled={generatedPlan.length === 0}
              className="rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              Salvar plano de carregamento
            </button>
          </div>
        </footer>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDrag ? <CanvasPanelBlock panel={activeDrag.item} handlePosition={activeDrag.zone === 'direito' ? 'left' : 'right'} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
