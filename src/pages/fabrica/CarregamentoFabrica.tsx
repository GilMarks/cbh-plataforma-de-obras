import { useState, useEffect } from 'react';
import { Check, Truck } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import PlanoCarregamentoResumo from '../../components/shared/PlanoCarregamentoResumo';
import PlantaBaixaSVG from '../../components/shared/PlantaBaixaSVG';
import { carregamentos as carregamentosApi } from '../../lib/api';
import { inferModoCarregamento, listarEtapasOperacionaisCarregamento, totalCamadasNoPlano } from '../../lib/carregamento';
import type { Carregamento } from '../../lib/types';

export default function CarregamentoFabrica() {
  const [carregamentos, setCarregamentos] = useState<Carregamento[]>([]);

  const refresh = () => {
    carregamentosApi.fabrica().then(setCarregamentos).catch(() => {});
  };

  useEffect(() => { refresh(); }, []);

  const handleExecutar = (id: number) => {
    carregamentosApi.executar(id).then(() => refresh()).catch(() => {});
  };

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
        Fabrica
      </p>
      <div className="flex items-center gap-3">
        <Truck size={28} className="text-primary" />
        <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>
          Carregamento
        </h1>
      </div>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>
        Execute os carregamentos autorizados exatamente conforme o plano vindo da obra.
      </p>

      <div className="flex flex-col gap-4" style={{ marginTop: '28px' }}>
        {carregamentos.length === 0 ? (
          <EmptyState message="Nenhum carregamento pendente de execucao" icon="Truck" />
        ) : (
          carregamentos.map(carregamento => {
            const etapas = listarEtapasOperacionaisCarregamento(carregamento.paineis);
            const totalCamadas = totalCamadasNoPlano(carregamento.paineis);

            const modo = inferModoCarregamento(carregamento.paineis);

            return (
              <div key={carregamento.id} className="border border-border rounded-2xl bg-surface-container-lowest" style={{ padding: '24px' }}>
                <div className="flex items-start justify-between gap-4 flex-wrap" style={{ marginBottom: '18px' }}>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-extrabold text-text-primary" style={{ fontSize: '18px' }}>
                        {carregamento.obraNome}
                      </span>
                      <StatusBadge status={carregamento.status} />
                    </div>
                    <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '8px' }}>
                      Veiculo: {carregamento.veiculo} - Solicitante: {carregamento.solicitante} - Autorizado por {carregamento.autorizadoPor} em {carregamento.dataAutorizacao}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="rounded-full border border-border bg-surface-container-low text-text-muted"
                      style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 700 }}
                    >
                      {carregamento.paineis.length} paineis
                    </span>
                    <span
                      className="rounded-full border border-border bg-surface-container-low text-text-muted"
                      style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 700 }}
                    >
                      {totalCamadas} camadas
                    </span>
                  </div>
                </div>

                {/* Vista top-down do layout */}
                <div className="mb-5 overflow-x-auto rounded-xl border border-border bg-surface-container-low p-4">
                  <p className="mb-3 font-mono text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                    Layout do carregamento — vista top-down
                  </p>
                  <PlantaBaixaSVG
                    paineis={carregamento.paineis}
                    veiculo={modo}
                    compact
                  />
                </div>

                <PlanoCarregamentoResumo
                  paineis={carregamento.paineis}
                  compact
                  titulo="Plano liberado para carga"
                  subtitulo="Carregue primeiro as camadas internas e finalize na face externa do caminhao."
                />

                <div style={{ marginTop: '18px' }}>
                  <p className="font-extrabold text-text-primary uppercase tracking-wider" style={{ fontSize: '11px', marginBottom: '10px' }}>
                    Etapas praticas da carga
                  </p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {etapas.map(etapa => (
                      <div key={etapa.id} className="rounded-xl border border-border bg-surface-container-low" style={{ padding: '14px' }}>
                        <p className="font-bold text-text-primary" style={{ fontSize: '13px' }}>
                          {etapa.titulo}
                        </p>
                        <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '6px', lineHeight: 1.5 }}>
                          {etapa.descricao}
                        </p>
                        <p className="text-text-secondary" style={{ fontSize: '11px', marginTop: '10px', lineHeight: 1.5 }}>
                          {etapa.paineis.map(painel => `${painel.codigo ?? `P${painel.posicaoCarregamento}`} (${painel.dimensao})`).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end" style={{ marginTop: '18px' }}>
                  <button
                    onClick={() => handleExecutar(carregamento.id)}
                    className="flex items-center gap-2 text-white font-bold bg-success hover:opacity-90 transition-opacity"
                    style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}
                  >
                    <Check size={16} /> Marcar como executado
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
