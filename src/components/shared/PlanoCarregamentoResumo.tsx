import {
  agruparPlanoCarregamento,
  formatMeters,
  getMaxComprimentoCamada,
} from '../../lib/carregamento';
import type { PainelCarregamento } from '../../lib/types';

interface Props {
  paineis: PainelCarregamento[];
  compact?: boolean;
  titulo?: string;
  subtitulo?: string;
  vazioLabel?: string;
}

export default function PlanoCarregamentoResumo({
  paineis,
  compact = false,
  titulo = 'Plano do carregamento',
  subtitulo = 'Camada 1 = face externa. Ultima camada = encostada no cavalete ou no cabecalho da prancha.',
  vazioLabel = 'Nenhum painel posicionado.',
}: Props) {
  const plano = agruparPlanoCarregamento(paineis);
  const maxComp = getMaxComprimentoCamada(paineis);
  const semPaineis = paineis.length === 0;
  const padding = compact ? '16px' : '20px';

  const renderCamadas = (
    tituloSecao: string,
    accent: string,
    layers: typeof plano.esquerdo,
    prefixo: 'Camada' | 'Faixa',
  ) => {
    if (layers.length === 0) {
      return (
        <div
          className="rounded-xl border border-dashed border-border bg-white text-text-muted"
          style={{
            minHeight: compact ? '120px' : '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontSize: compact ? '12px' : '13px',
          }}
        >
          Sem paineis nesta secao
        </div>
      );
    }

    return (
      <div>
        <p
          className="font-extrabold uppercase tracking-wider"
          style={{
            fontSize: '11px',
            color: accent,
            marginBottom: '8px',
          }}
        >
          {tituloSecao}
        </p>

        <div className="flex flex-col gap-3">
          {layers.map(layer => (
            <div
              key={`${tituloSecao}-${layer.camada}`}
              className="rounded-xl border bg-white"
              style={{
                borderColor: `${accent}33`,
                padding: compact ? '12px' : '14px',
              }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap" style={{ marginBottom: '10px' }}>
                <div>
                  <p
                    className="font-extrabold uppercase tracking-wider"
                    style={{
                      fontSize: compact ? '10px' : '11px',
                      color: accent,
                    }}
                  >
                    {prefixo} {layer.camada}
                  </p>
                  <p className="text-text-secondary" style={{ fontSize: compact ? '12px' : '13px', marginTop: '2px' }}>
                    {formatMeters(layer.comprimentoTotal)} usados
                  </p>
                </div>
                <span
                  className="rounded-full border bg-surface-container-low text-text-muted"
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  Livre {formatMeters(layer.folga)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {layer.itens.map(painel => (
                  <div
                    key={painel.itemId ?? `${painel.solicitacaoId}-${painel.posicaoCarregamento}`}
                    className="rounded-lg border bg-surface-container-low"
                    style={{
                      borderColor: `${accent}2a`,
                      padding: compact ? '8px 10px' : '10px 12px',
                      minWidth: compact ? '120px' : '138px',
                    }}
                  >
                    <p className="font-bold text-text-primary" style={{ fontSize: compact ? '12px' : '13px' }}>
                      {painel.dimensao}
                    </p>
                    <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                      {painel.codigo ?? `P${painel.posicaoCarregamento}`}
                    </p>
                    <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                      Pos. {painel.posicaoCarregamento} - Faixa {painel.posicaoNaCamada ?? 1}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="rounded-2xl border border-border bg-surface-container-low"
      style={{ padding }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap" style={{ marginBottom: compact ? '14px' : '18px' }}>
        <div>
          <p className="font-extrabold text-text-primary" style={{ fontSize: compact ? '16px' : '18px' }}>
            {titulo}
          </p>
          <p className="text-text-muted" style={{ fontSize: compact ? '12px' : '13px', marginTop: '4px' }}>
            {subtitulo}
          </p>
        </div>
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900"
          style={{
            padding: compact ? '10px 12px' : '12px 14px',
            minWidth: compact ? '180px' : '220px',
          }}
        >
          <p className="font-extrabold uppercase tracking-wider" style={{ fontSize: '10px' }}>
            Area util de carga
          </p>
          <p style={{ fontSize: compact ? '13px' : '14px', fontWeight: 700, marginTop: '4px' }}>
            {formatMeters(maxComp)} x 2.3m
          </p>
        </div>
      </div>

      {semPaineis ? (
        <div
          className="rounded-xl border border-dashed border-border bg-white text-text-muted"
          style={{
            padding: compact ? '24px 16px' : '36px 20px',
            textAlign: 'center',
            fontSize: compact ? '12px' : '13px',
          }}
        >
          {vazioLabel}
        </div>
      ) : plano.modo === 'Munck' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1fr) 150px minmax(0, 1fr)',
            gap: compact ? '14px' : '18px',
            alignItems: compact ? 'stretch' : 'start',
          }}
        >
          {renderCamadas('Lado esquerdo', 'var(--color-primary)', plano.esquerdo, 'Camada')}

          {!compact && (
            <div
              className="rounded-2xl border border-border bg-white"
              style={{
                alignSelf: 'stretch',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 14px',
                minHeight: '100%',
              }}
            >
              <div
                style={{
                  width: '58px',
                  height: '78px',
                  clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                  background: 'linear-gradient(180deg, #d9dde4 0%, #bcc3ce 100%)',
                  border: '1px solid var(--color-border)',
                }}
              />
              <p
                className="text-text-muted font-extrabold uppercase tracking-wider text-center"
                style={{ fontSize: '10px', marginTop: '10px', lineHeight: 1.4 }}
              >
                Cavalete central
              </p>
            </div>
          )}

          {renderCamadas('Lado direito', 'var(--color-tertiary-container)', plano.direito, 'Camada')}
        </div>
      ) : (
        renderCamadas('Prancha unica', 'var(--color-primary)', plano.prancha, 'Faixa')
      )}
    </div>
  );
}
