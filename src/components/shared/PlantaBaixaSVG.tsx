/**
 * PlantaBaixaSVG — Vista top-down do carregamento (Munck ou Carreta)
 *
 * Layout Munck (vista de cima):
 *   [CABINE]  ┌──────────────────────────────────────────────┐
 *             │  ┌── LADO ESQUERDO (fileiras externas→internas)──┐  │
 *             │  ╠══════════ CAVALETE (centro) ══════════╣  │
 *             │  └── LADO DIREITO (fileiras externas→internas)──┘  │
 *             └──────────────────────────────────────────────┘
 *
 * Layout Carreta (vista de cima):
 *   [CABINE]  ┌──────── PRANCHA ÚNICA ─────────────────────┐
 *             └────────────────────────────────────────────┘
 *
 * Camada 1 = face externa (borda do caminhão), Camada N = interna (cavalete).
 */

import { agruparPlanoCarregamento } from '../../lib/carregamento';
import type { ModoCarregamento } from '../../lib/carregamento';
import type { PainelCarregamento } from '../../lib/types';

// ─── Constantes de layout SVG ─────────────────────────────────────────────────
const CABINE_W = 60;
const CABINE_GAP = 10;
const SVG_PAD = 12;

// Pixels por metro (escala base)
const PX_PER_M = 60;

// Altura de cada camada (profundidade visual = largura do painel na vista top-down)
const LAYER_H = 36;
const LAYER_GAP = 4;
const CAVALETE_H = 20;
const SECTION_GAP = 6;

// Margem interna da carroceria
const CARROC_PAD_X = 16;
const CARROC_PAD_Y = 20;

// Paleta de cores por camada (index 0 = camada 1 = externa)
const LAYER_COLORS = [
  { fill: 'var(--color-success-bg)', stroke: 'var(--color-success)', text: 'var(--color-success-text)' },
  { fill: 'var(--color-info-bg)', stroke: 'var(--color-info)', text: 'var(--color-info-text)' },
  { fill: 'var(--color-warning-bg)', stroke: 'var(--color-warning)', text: 'var(--color-warning-text)' },
  { fill: 'var(--color-primary-bg, var(--color-primary-fixed))', stroke: 'var(--color-primary)', text: 'var(--color-primary)' },
  { fill: 'var(--color-danger-bg)', stroke: 'var(--color-danger)', text: 'var(--color-danger-text)' },
  { fill: 'var(--color-surface-container)', stroke: 'var(--color-text-secondary)', text: 'var(--color-text-secondary)' },
];

function getLayerColor(camadaIndex: number) {
  return LAYER_COLORS[camadaIndex % LAYER_COLORS.length];
}

interface Props {
  paineis: PainelCarregamento[];
  veiculo: ModoCarregamento;
  highlightId?: string;
  compact?: boolean;
}

export default function PlantaBaixaSVG({ paineis, veiculo, highlightId, compact = false }: Props) {
  const plano = agruparPlanoCarregamento(paineis);
  const scale = compact ? 0.7 : 1;
  const maxComp = plano.maxComp;
  const areaUtilW = maxComp * PX_PER_M * scale;
  const layerH = LAYER_H * scale;
  const layerGap = LAYER_GAP * scale;
  const cavaleteH = CAVALETE_H * scale;
  const sectionGap = SECTION_GAP * scale;
  const carrocPadX = CARROC_PAD_X * scale;
  const carrocPadY = CARROC_PAD_Y * scale;
  const cabineW = compact ? 50 * scale : CABINE_W * scale;
  const cabineGap = CABINE_GAP * scale;
  const svgPad = SVG_PAD * scale;

  // Calcula altura total da área útil baseada no número de camadas
  let areaUtilH: number;
  if (veiculo === 'Munck') {
    const nEsq = Math.max(plano.esquerdo.length, 1);
    const nDir = Math.max(plano.direito.length, 1);
    areaUtilH =
      nEsq * (layerH + layerGap) - layerGap +
      sectionGap + cavaleteH + sectionGap +
      nDir * (layerH + layerGap) - layerGap;
  } else {
    const nPrancha = Math.max(plano.prancha.length, 1);
    areaUtilH = nPrancha * (layerH + layerGap) - layerGap;
  }

  const carrocW = areaUtilW + carrocPadX * 2;
  const carrocH = areaUtilH + carrocPadY * 2;
  const cabineH = Math.min(carrocH, 100 * scale);

  const svgW = svgPad + cabineW + cabineGap + carrocW + svgPad;
  const svgH = svgPad + Math.max(carrocH, cabineH) + svgPad + 18 * scale;

  const carrocX = svgPad + cabineW + cabineGap;
  const carrocY = svgPad + (Math.max(carrocH, cabineH) - carrocH) / 2;
  const cabineX = svgPad;
  const cabineY = svgPad + (Math.max(carrocH, cabineH) - cabineH) / 2;

  const areaX = carrocX + carrocPadX;
  const areaY = carrocY + carrocPadY;

  // Renderiza painéis de uma camada horizontalmente
  const renderPaineisCamada = (
    camada: typeof plano.esquerdo[number],
    baseY: number,
    highlight?: string,
  ) => {
    const cor = getLayerColor(camada.camada - 1);
    let xCursor = areaX;

    return camada.itens.map((painel, pi) => {
      const comp = painel.comp ?? 1;
      const pW = Math.max((comp / maxComp) * areaUtilW - (pi > 0 ? 2 : 0), 6);
      const x = xCursor + (pi > 0 ? 2 : 0);
      xCursor += (comp / maxComp) * areaUtilW;
      const isHighlighted = highlight ? painel.itemId === highlight : false;
      const label = painel.dimensao;
      const showLabel = pW > 40 * scale;

      return (
        <g key={painel.itemId ?? `${painel.solicitacaoId}-${pi}`}>
          <rect
            x={x}
            y={baseY}
            width={Math.max(pW, 4)}
            height={layerH}
            rx={3 * scale}
            fill={isHighlighted ? cor.stroke : cor.fill}
            stroke={cor.stroke}
            strokeWidth={isHighlighted ? 2.5 : 1.5}
            opacity={isHighlighted ? 1 : 0.9}
          />
          {showLabel && (
            <text
              x={x + pW / 2}
              y={baseY + layerH / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.max(8 * scale, 7)}
              fontWeight="600"
              fill={isHighlighted ? 'white' : cor.text}
              fontFamily="monospace"
            >
              {label}
            </text>
          )}
          {/* Número de sequência */}
          <text
            x={x + 3 * scale}
            y={baseY + 3 * scale}
            dominantBaseline="hanging"
            fontSize={Math.max(6 * scale, 6)}
            fontWeight="700"
            fill={cor.stroke}
            fontFamily="monospace"
            opacity={0.7}
          >
            {painel.posicaoCarregamento}
          </text>
        </g>
      );
    });
  };

  // ── Cálculo das posições Y para Munck ──────────────────────────────────────
  const renderMunck = () => {
    const elements: React.ReactNode[] = [];

    // Lado Esquerdo: camada 1 = topo (externa), camada N = mais próxima do cavalete
    let yAcc = areaY;
    plano.esquerdo.forEach((camada, ci) => {
      elements.push(...renderPaineisCamada(camada, yAcc, highlightId));

      // Label da camada
      elements.push(
        <text
          key={`esq-label-${ci}`}
          x={areaX + areaUtilW + 4 * scale}
          y={yAcc + layerH / 2}
          dominantBaseline="middle"
          fontSize={Math.max(7 * scale, 6)}
          fill="var(--color-text-muted)"
          fontFamily="monospace"
        >
          E{camada.camada}
        </text>,
      );

      yAcc += layerH + layerGap;
    });

    if (plano.esquerdo.length === 0) {
      // placeholder vazio para Esquerdo
      elements.push(
        <rect
          key="esq-empty"
          x={areaX}
          y={areaY}
          width={areaUtilW}
          height={layerH}
          rx={3 * scale}
          fill="var(--color-surface-container-low)"
          stroke="var(--color-border)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />,
      );
      yAcc += layerH + layerGap;
    }

    // Cavalete central
    const cavaleteY = areaY + plano.esquerdo.length * (layerH + layerGap) + sectionGap - (plano.esquerdo.length === 0 ? 0 : layerGap) + (plano.esquerdo.length === 0 ? layerH + layerGap : 0);
    const realCavaleteY = yAcc + sectionGap - layerGap;
    elements.push(
      <g key="cavalete">
        <rect
          x={areaX + areaUtilW * 0.1}
          y={realCavaleteY}
          width={areaUtilW * 0.8}
          height={cavaleteH}
          rx={cavaleteH / 2}
          fill="var(--color-surface-container-high)"
          stroke="var(--color-border)"
          strokeWidth={1.5}
        />
        <text
          x={areaX + areaUtilW / 2}
          y={realCavaleteY + cavaleteH / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(7 * scale, 6)}
          fontWeight="700"
          fill="var(--color-text-muted)"
          fontFamily="monospace"
        >
          CAVALETE
        </text>
      </g>,
    );
    void cavaleteY; // suprime unused

    // Lado Direito: camada 1 = logo abaixo do cavalete (externa), N = borda inferior
    const dirStartY = realCavaleteY + cavaleteH + sectionGap;
    plano.direito.forEach((camada, ci) => {
      const rowY = dirStartY + ci * (layerH + layerGap);
      elements.push(...renderPaineisCamada(camada, rowY, highlightId));

      elements.push(
        <text
          key={`dir-label-${ci}`}
          x={areaX + areaUtilW + 4 * scale}
          y={rowY + layerH / 2}
          dominantBaseline="middle"
          fontSize={Math.max(7 * scale, 6)}
          fill="var(--color-text-muted)"
          fontFamily="monospace"
        >
          D{camada.camada}
        </text>,
      );
    });

    if (plano.direito.length === 0) {
      elements.push(
        <rect
          key="dir-empty"
          x={areaX}
          y={dirStartY}
          width={areaUtilW}
          height={layerH}
          rx={3 * scale}
          fill="var(--color-surface-container-low)"
          stroke="var(--color-border)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />,
      );
    }

    return elements;
  };

  // ── Carreta: prancha única ─────────────────────────────────────────────────
  const renderCarreta = () => {
    return plano.prancha.map((camada, ci) => {
      const rowY = areaY + ci * (layerH + layerGap);
      return [
        ...renderPaineisCamada(camada, rowY, highlightId),
        <text
          key={`prancha-label-${ci}`}
          x={areaX + areaUtilW + 4 * scale}
          y={rowY + layerH / 2}
          dominantBaseline="middle"
          fontSize={Math.max(7 * scale, 6)}
          fill="var(--color-text-muted)"
          fontFamily="monospace"
        >
          F{camada.camada}
        </text>,
      ];
    });
  };

  const isEmpty = paineis.length === 0;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      aria-label={`Planta baixa — ${veiculo}`}
    >
      {/* Cabine */}
      <rect
        x={cabineX}
        y={cabineY}
        width={cabineW}
        height={cabineH}
        rx={6 * scale}
        fill="var(--color-success-bg)"
        stroke="var(--color-success)"
        strokeWidth={2}
      />
      <text
        x={cabineX + cabineW / 2}
        y={cabineY + cabineH / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.max(10 * scale, 9)}
        fontWeight="700"
        fill="var(--color-success)"
        fontFamily="Arial, sans-serif"
      >
        CABINE
      </text>

      {/* Carroceria */}
      <rect
        x={carrocX}
        y={carrocY}
        width={carrocW}
        height={carrocH}
        rx={8 * scale}
        fill="var(--color-surface-container-lowest)"
        stroke="var(--color-border)"
        strokeWidth={1.5}
      />

      {/* Área útil (vazia) */}
      {isEmpty && (
        <>
          <rect
            x={areaX}
            y={areaY}
            width={areaUtilW}
            height={areaUtilH}
            rx={6 * scale}
            fill="var(--color-warning-bg)"
            stroke="var(--color-warning)"
            strokeWidth={1.5}
            strokeDasharray="6 5"
          />
          <text
            x={areaX + areaUtilW / 2}
            y={areaY + areaUtilH / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.max(11 * scale, 9)}
            fill="var(--color-text-muted)"
            fontFamily="Arial, sans-serif"
            opacity={0.6}
          >
            Adicione painéis para visualizar
          </text>
        </>
      )}

      {/* Painéis */}
      {!isEmpty && (veiculo === 'Munck' ? renderMunck() : renderCarreta())}

      {/* Marcadores de metro */}
      {Array.from({ length: maxComp + 1 }, (_, i) => (
        <text
          key={`m${i}`}
          x={areaX + (i / maxComp) * areaUtilW}
          y={carrocY + carrocH + 13 * scale}
          textAnchor="middle"
          fontSize={Math.max(8 * scale, 6)}
          fill="var(--color-text-muted)"
          fontFamily="monospace"
        >
          {i}m
        </text>
      ))}
    </svg>
  );
}
