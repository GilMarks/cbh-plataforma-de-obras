/**
 * TruckPreviewMini — Miniatura visual de um carregamento.
 *
 * Extraído de CompactTruckPreview (CarregamentoObra.tsx).
 * Renderiza colunas de painéis para Munck (E / Cavalete / D) ou Carreta (Prancha).
 */

import { agruparPlanoCarregamento, formatMeters, getMaxComprimentoCamada, parseDimensaoPainel } from '../../lib/carregamento';
import type { PainelCarregamento } from '../../lib/types';

const PREVIEW_PX_PER_M = 24;
const COL_W = 14;

interface Props {
  paineis: PainelCarregamento[];
  compact?: boolean;
}

function getPainelComp(painel: PainelCarregamento): number {
  if (typeof painel.comp === 'number') return painel.comp;
  return parseDimensaoPainel(painel.dimensao).comp;
}

export default function TruckPreviewMini({ paineis, compact = false }: Props) {
  const plano = agruparPlanoCarregamento(paineis);
  const maxLayerLength = getMaxComprimentoCamada(paineis);
  const stageHeight = maxLayerLength * PREVIEW_PX_PER_M;

  const totalMeters = paineis.reduce((sum, p) => sum + getPainelComp(p), 0);

  const renderColumn = (
    items: typeof plano.esquerdo[number]['itens'],
    key: string,
    borderClass: string,
  ) => (
    <div
      key={key}
      className={borderClass}
      style={{ width: `${COL_W}px`, minWidth: `${COL_W}px`, height: `${stageHeight}px` }}
    >
      <div className="flex h-full w-full flex-col-reverse items-center justify-start gap-px">
        {items.map(painel => (
          <div
            key={painel.itemId ?? `${painel.solicitacaoId}-${painel.posicaoCarregamento}`}
            className="w-full rounded-sm border border-border bg-surface-container-high"
            style={{ height: `${getPainelComp(painel) * PREVIEW_PX_PER_M}px` }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {!compact && (
        <div className="mb-2 flex items-center justify-end">
          <span className="text-xs text-text-muted tabular-nums tracking-tight font-medium">
            Total: <strong className="text-text-primary">{formatMeters(totalMeters)}</strong>
          </span>
        </div>
      )}

      <div
        className="max-h-40 overflow-auto rounded-lg bg-surface-container-low p-3"
        style={{ border: '1px solid var(--color-border)' }}
      >
        {plano.modo === 'Munck' ? (
          <div
            className="grid items-start gap-3 overflow-x-auto"
            style={{
              gridTemplateColumns: `${Math.max(plano.esquerdo.length, 2) * COL_W}px 12px ${Math.max(plano.direito.length, 2) * COL_W}px`,
            }}
          >
            {/* Esquerdo */}
            <div
              className="rounded-md bg-surface-container-lowest px-2 py-2"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <div className="mb-2 text-center text-[10px] text-text-muted tabular-nums tracking-tight font-medium">
                E {formatMeters(plano.esquerdo[0]?.comprimentoTotal ?? 0)}
              </div>
              <div className="flex h-full flex-row-reverse justify-start">
                {[...plano.esquerdo].reverse().map((layer, i) =>
                  renderColumn(layer.itens, `esq-${i}`, 'border-r border-border'),
                )}
              </div>
            </div>

            {/* Cavalete */}
            <div className="flex flex-col items-center self-stretch">
              <div
                className="w-3 rounded-full bg-warning"
                style={{ minHeight: `${stageHeight}px`, height: `${stageHeight}px`, maxHeight: '150px' }}
              />
            </div>

            {/* Direito */}
            <div
              className="rounded-md bg-surface-container-lowest px-2 py-2"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <div className="mb-2 text-center text-[10px] text-text-muted tabular-nums tracking-tight font-medium">
                D {formatMeters(plano.direito[0]?.comprimentoTotal ?? 0)}
              </div>
              <div className="flex h-full justify-start">
                {[...plano.direito].reverse().map((layer, i) =>
                  renderColumn(layer.itens, `dir-${i}`, 'border-l border-border'),
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Carreta — Prancha única */
          <div
            className="rounded-md bg-surface-container-lowest p-3"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Prancha</div>
                {!compact && (
                  <p className="mt-1 text-xs text-text-secondary">
                    Cabecalho à esquerda, descarregamento pela traseira.
                  </p>
                )}
              </div>
              <div className="text-xs text-text-primary tabular-nums tracking-tight font-medium">
                {formatMeters(maxLayerLength)} por faixa
              </div>
            </div>

            <div className="flex items-start gap-3 overflow-x-auto">
              <div
                className="mt-1 h-8 w-14 rounded-l-full rounded-r-md bg-surface-container-high"
                style={{ border: '1px solid var(--color-border)' }}
              />
              <div
                className="flex rounded-md bg-surface-container-low px-2 py-2"
                style={{ border: '1px solid var(--color-border)' }}
              >
                {plano.prancha.map((layer, i) =>
                  renderColumn(layer.itens, `prancha-${i}`, 'border-l border-border'),
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
