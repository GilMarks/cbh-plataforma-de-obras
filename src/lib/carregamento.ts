import type { Carregamento, PainelCarregamento } from './types';

export const TRUCK_MAX_COMP = 6;
export const MUNCK_MAX_COMP = 6;
export const CARRETA_MAX_COMP = 12;

export type ZonaCarregamento = 'Esquerdo' | 'Direito' | 'Prancha';
export type ModoCarregamento = 'Munck' | 'Carreta';

export interface PainelEstoqueCarregamento {
  itemId: string;
  codigo: string;
  solicitacaoId: number;
  tipo: string;
  dimensao: string;
  comp: number;
  alt: number;
}

export interface CamadaCarregamento<T> {
  camada: number;
  itens: T[];
  comprimentoTotal: number;
  folga: number;
  externa: boolean;
  interna: boolean;
}

export interface PlanoAgrupadoCarregamento {
  modo: ModoCarregamento;
  maxComp: number;
  esquerdo: CamadaCarregamento<PainelCarregamento>[];
  direito: CamadaCarregamento<PainelCarregamento>[];
  prancha: CamadaCarregamento<PainelCarregamento>[];
}

export interface EtapaOperacionalCarregamento {
  id: string;
  lado: ZonaCarregamento;
  camada: number;
  ordemExecucao: number;
  titulo: string;
  descricao: string;
  paineis: PainelCarregamento[];
}

interface PainelBaseNormalizado {
  itemId: string;
  codigo: string;
  solicitacaoId: number;
  tipo: string;
  dimensao: string;
  comp: number;
  alt: number;
  comprimentoMaximoCamada?: number;
  ordemZona: number;
}

function formatDecimal(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, '');
}

export function formatDimensaoPainel(comp: number, alt: number): string {
  return `${formatDecimal(comp)}x${formatDecimal(alt)}m`;
}

export function formatMeters(value: number): string {
  return `${formatDecimal(value)}m`;
}

export function getMaxComprimentoCamada(
  paineis: Array<{ comprimentoMaximoCamada?: number }> | PainelCarregamento[],
): number {
  const maxComp = paineis[0]?.comprimentoMaximoCamada;
  return typeof maxComp === 'number' ? maxComp : TRUCK_MAX_COMP;
}

export function inferModoCarregamento(
  paineis: Array<{ lado?: ZonaCarregamento; comprimentoMaximoCamada?: number }> | PainelCarregamento[],
): ModoCarregamento {
  if (paineis.some(painel => painel.lado === 'Prancha')) {
    return 'Carreta';
  }

  return getMaxComprimentoCamada(paineis) > MUNCK_MAX_COMP ? 'Carreta' : 'Munck';
}

export function formatPainelCodigo(painel: PainelCarregamento): string {
  return painel.codigo ?? `P${painel.posicaoCarregamento}`;
}

export function parseDimensaoPainel(dimensao: string): { comp: number; alt: number } {
  const normalized = dimensao.toLowerCase().replace(/\s+/g, '');
  const pairMatch = normalized.match(/(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)/);

  if (pairMatch) {
    return {
      comp: Number(pairMatch[1].replace(',', '.')),
      alt: Number(pairMatch[2].replace(',', '.')),
    };
  }

  const singleMatch = normalized.match(/(\d+(?:[.,]\d+)?)/);
  if (singleMatch) {
    return {
      comp: Number(singleMatch[1].replace(',', '.')),
      alt: 0,
    };
  }

  return { comp: 0, alt: 0 };
}

export function buildCamadasCarregamento<T extends { comp: number }>(
  paineis: T[],
  maxComp = TRUCK_MAX_COMP,
): CamadaCarregamento<T>[] {
  const camadasBrutas: T[][] = [];
  let camadaAtual: T[] = [];
  let comprimentoAtual = 0;

  for (const painel of paineis) {
    const ultrapassaLimite = camadaAtual.length > 0 && comprimentoAtual + painel.comp > maxComp;

    if (ultrapassaLimite) {
      camadasBrutas.push(camadaAtual);
      camadaAtual = [painel];
      comprimentoAtual = painel.comp;
      continue;
    }

    camadaAtual.push(painel);
    comprimentoAtual += painel.comp;
  }

  if (camadaAtual.length > 0) {
    camadasBrutas.push(camadaAtual);
  }

  return camadasBrutas.map((itens, index) => {
    const comprimentoTotal = itens.reduce((total, item) => total + item.comp, 0);
    return {
      camada: index + 1,
      itens,
      comprimentoTotal,
      folga: Math.max(maxComp - comprimentoTotal, 0),
      externa: index === 0,
      interna: index === camadasBrutas.length - 1,
    };
  });
}

function getZonasAtivas(modo: ModoCarregamento): ZonaCarregamento[] {
  return modo === 'Munck' ? ['Esquerdo', 'Direito'] : ['Prancha'];
}

function normalizarPainelEstoqueBase(
  painel: PainelEstoqueCarregamento,
  index: number,
  maxComp: number,
): PainelBaseNormalizado {
  return {
    ...painel,
    comprimentoMaximoCamada: maxComp,
    ordemZona: index + 1,
  };
}

function normalizarPainelCarregamentoBase(
  painel: PainelCarregamento,
  index: number,
  zona: ZonaCarregamento,
): PainelBaseNormalizado {
  const parsed = parseDimensaoPainel(painel.dimensao);
  const itemId = painel.itemId
    ? painel.itemId
    : `${zona.toLowerCase()}-${painel.solicitacaoId}-${index + 1}-${painel.dimensao}`;
  const codigo = painel.codigo
    ? painel.codigo
    : `${painel.tipo.slice(0, 1).toUpperCase()}-${String(painel.solicitacaoId).padStart(2, '0')}-${String(index + 1).padStart(3, '0')}`;
  const comp = typeof painel.comp === 'number' ? painel.comp : parsed.comp;
  const alt = typeof painel.alt === 'number' ? painel.alt : parsed.alt;

  return {
    solicitacaoId: painel.solicitacaoId,
    tipo: painel.tipo,
    dimensao: painel.dimensao,
    itemId,
    codigo,
    comp,
    alt,
    comprimentoMaximoCamada: painel.comprimentoMaximoCamada,
    ordemZona: index + 1,
  };
}

function sortPaineisZona(
  paineis: PainelCarregamento[],
  zona: ZonaCarregamento,
  modo: ModoCarregamento,
): PainelCarregamento[] {
  const source =
    modo === 'Carreta' && zona === 'Prancha'
      ? paineis.some(painel => painel.lado === 'Prancha')
        ? paineis.filter(painel => painel.lado === 'Prancha')
        : paineis
      : paineis.filter(painel => painel.lado === zona);

  return [...source].sort((a, b) => {
    if (a.posicaoCarregamento !== b.posicaoCarregamento) {
      return a.posicaoCarregamento - b.posicaoCarregamento;
    }
    if ((a.camada ?? 0) !== (b.camada ?? 0)) {
      return (a.camada ?? 0) - (b.camada ?? 0);
    }
    if ((a.posicaoNaCamada ?? 0) !== (b.posicaoNaCamada ?? 0)) {
      return (a.posicaoNaCamada ?? 0) - (b.posicaoNaCamada ?? 0);
    }
    return (a.codigo ?? '').localeCompare(b.codigo ?? '');
  });
}

function normalizePaineisGrupo(paineis: PainelCarregamento[]) {
  return paineis.map(painel => {
    const parsed = parseDimensaoPainel(painel.dimensao);
    return {
      ...painel,
      comp: painel.comp ?? parsed.comp,
      alt: painel.alt ?? parsed.alt,
    };
  });
}

export function criarPlanoZona(
  zona: ZonaCarregamento,
  paineis: PainelEstoqueCarregamento[],
  maxComp = TRUCK_MAX_COMP,
): PainelCarregamento[] {
  const base = paineis.map((painel, index) => normalizarPainelEstoqueBase(painel, index, maxComp));
  const camadas = buildCamadasCarregamento(base, maxComp);

  return camadas.flatMap(camada =>
    camada.itens.map((painel, index) => ({
      itemId: painel.itemId,
      codigo: painel.codigo,
      solicitacaoId: painel.solicitacaoId,
      tipo: painel.tipo,
      dimensao: painel.dimensao,
      comp: painel.comp,
      alt: painel.alt,
      comprimentoMaximoCamada: maxComp,
      posicaoCarregamento: painel.ordemZona,
      lado: zona,
      camada: camada.camada,
      posicaoNaCamada: index + 1,
      externo: zona === 'Prancha' ? camada.camada > 1 : camada.externa,
      encostadoNoCavalete: zona === 'Prancha' ? camada.camada === 1 : camada.interna,
    })),
  );
}

export function criarPlanoLado(
  lado: Extract<ZonaCarregamento, 'Esquerdo' | 'Direito'>,
  paineis: PainelEstoqueCarregamento[],
  maxComp = TRUCK_MAX_COMP,
): PainelCarregamento[] {
  return criarPlanoZona(lado, paineis, maxComp);
}

export function hidratarPlanoCarregamento(paineis: PainelCarregamento[]): PainelCarregamento[] {
  const modo = inferModoCarregamento(paineis);
  const maxComp = getMaxComprimentoCamada(paineis);

  return getZonasAtivas(modo).flatMap(zona => {
    const paineisZona = sortPaineisZona(paineis, zona, modo);
    const base = paineisZona.map((painel, index) => normalizarPainelCarregamentoBase(painel, index, zona));
    const camadas = buildCamadasCarregamento(base, maxComp);

    return camadas.flatMap<PainelCarregamento>(camada =>
      camada.itens.map((painel, index) => ({
        itemId: painel.itemId,
        codigo: painel.codigo,
        solicitacaoId: painel.solicitacaoId,
        tipo: painel.tipo,
        dimensao: painel.dimensao,
        comp: painel.comp,
        alt: painel.alt,
        comprimentoMaximoCamada: maxComp,
        lado: zona,
        posicaoCarregamento: painel.ordemZona,
        camada: camada.camada,
        posicaoNaCamada: index + 1,
        externo: zona === 'Prancha' ? camada.camada > 1 : camada.externa,
        encostadoNoCavalete: zona === 'Prancha' ? camada.camada === 1 : camada.interna,
      })),
    );
  });
}

export function agruparPlanoCarregamento(paineis: PainelCarregamento[]): PlanoAgrupadoCarregamento {
  const plano = hidratarPlanoCarregamento(paineis);
  const modo = inferModoCarregamento(plano);
  const maxComp = getMaxComprimentoCamada(plano);

  const buildGroup = (zona: ZonaCarregamento): CamadaCarregamento<PainelCarregamento>[] => {
    const paineisZona = normalizePaineisGrupo(sortPaineisZona(plano, zona, modo));
    return buildCamadasCarregamento(paineisZona, maxComp);
  };

  return {
    modo,
    maxComp,
    esquerdo: modo === 'Munck' ? buildGroup('Esquerdo') : [],
    direito: modo === 'Munck' ? buildGroup('Direito') : [],
    prancha: modo === 'Carreta' ? buildGroup('Prancha') : [],
  };
}

export function agruparPlanoPorLado(paineis: PainelCarregamento[]) {
  return agruparPlanoCarregamento(paineis);
}

export function carregamentoReservaEstoque(carregamento: Carregamento): boolean {
  return carregamento.statusAutorizacao !== 'Negado';
}

export function listarEtapasOperacionaisCarregamento(
  paineis: PainelCarregamento[],
): EtapaOperacionalCarregamento[] {
  const plano = agruparPlanoCarregamento(paineis);
  let ordemExecucao = 0;

  const grupos =
    plano.modo === 'Munck'
      ? [
          { lado: 'Esquerdo' as const, camadas: [...plano.esquerdo].reverse() },
          { lado: 'Direito' as const, camadas: [...plano.direito].reverse() },
        ]
      : [{ lado: 'Prancha' as const, camadas: plano.prancha }];

  return grupos.flatMap(grupo =>
    grupo.camadas.map(camada => {
      ordemExecucao += 1;

      return {
        id: `${grupo.lado}-${camada.camada}`,
        lado: grupo.lado,
        camada: camada.camada,
        ordemExecucao,
        titulo:
          grupo.lado === 'Prancha'
            ? `Prancha - faixa ${camada.camada}`
            : `${grupo.lado} - etapa ${ordemExecucao}`,
        descricao:
          grupo.lado === 'Prancha'
            ? camada.camada === 1
              ? 'Comece pela faixa frontal encostada no cabecalho da prancha.'
              : 'Siga abrindo as faixas para a traseira da carreta.'
            : camada.interna
              ? 'Comece encostando esta camada no cavalete.'
              : camada.externa
                ? 'Finalize com a camada externa para manter o LIFO da montagem.'
                : 'Camada intermediaria entre o cavalete e a face externa.',
        paineis: camada.itens,
      };
    }),
  );
}

function resumirCodigosPainel(paineis: PainelCarregamento[], maxItens = 2): string {
  const codigos = paineis.map(formatPainelCodigo);
  if (codigos.length <= maxItens) return codigos.join(', ');
  return `${codigos.slice(0, maxItens).join(', ')} +${codigos.length - maxItens}`;
}

export function criarResumoSequenciaCarregamento(
  paineis: PainelCarregamento[],
  maxEtapas = 3,
): string {
  const etapas = listarEtapasOperacionaisCarregamento(paineis);
  if (etapas.length === 0) return 'Sem plano definido';

  const resumo = etapas
    .slice(0, maxEtapas)
    .map(etapa =>
      etapa.lado === 'Prancha'
        ? `Pra F${etapa.camada}: ${resumirCodigosPainel(etapa.paineis)}`
        : `${etapa.lado === 'Esquerdo' ? 'Esq' : 'Dir'} C${etapa.camada}: ${resumirCodigosPainel(etapa.paineis)}`,
    )
    .join(' -> ');

  return etapas.length > maxEtapas ? `${resumo} ...` : resumo;
}

export function criarSequenciaMontagem(paineis: PainelCarregamento[]): number[] {
  return paineis.map((_, index) => paineis.length - index);
}

export function totalCamadasNoPlano(paineis: PainelCarregamento[]): number {
  const plano = agruparPlanoCarregamento(paineis);
  return plano.modo === 'Carreta'
    ? plano.prancha.length
    : Math.max(plano.esquerdo.length, plano.direito.length, 0);
}
