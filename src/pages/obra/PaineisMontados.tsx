import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, CheckSquare, Search, Truck, X } from 'lucide-react';
import { carregamentos as carregamentosApi, montagens as montagensApi, obras as obrasApi } from '../../lib/api';
import type { Carregamento, Obra } from '../../lib/types';

const ACTIVE_STATUSES: Array<Carregamento['status']> = ['Carregado', 'Entregue'];

export default function PaineisMontados() {
  const [carregamentos, setCarregamentos] = useState<Carregamento[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const navigate = useNavigate();

  const refresh = () => {
    carregamentosApi.listar().then(data => setCarregamentos(data.filter(item => ACTIVE_STATUSES.includes(item.status)))).catch(() => {});
  };

  useEffect(() => {
    refresh();
    obrasApi.listar().then(setObras).catch(() => {});
  }, []);

  const [search, setSearch] = useState('');
  const [filterObra, setFilterObra] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCarreg, setSelectedCarreg] = useState<Carregamento | null>(null);
  const [equipe, setEquipe] = useState('');

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return carregamentos.filter(carregamento => {
      const matchSearch =
        normalizedSearch.length === 0 ||
        carregamento.obraNome.toLowerCase().includes(normalizedSearch) ||
        carregamento.veiculo.toLowerCase().includes(normalizedSearch) ||
        carregamento.executadoPor.toLowerCase().includes(normalizedSearch) ||
        carregamento.paineis.some(
          painel =>
            painel.dimensao.toLowerCase().includes(normalizedSearch) ||
            (painel.codigo ?? '').toLowerCase().includes(normalizedSearch),
        );

      const matchObra = !filterObra || carregamento.obraId === Number(filterObra);
      const matchStatus = !filterStatus || carregamento.status === filterStatus;

      return matchSearch && matchObra && matchStatus;
    });
  }, [carregamentos, filterObra, filterStatus, search]);

  const totalCarregamentos = filtered.length;
  const totalPaineisCarregados = filtered.reduce((total, carregamento) => total + carregamento.paineis.length, 0);
  const emRota = filtered.filter(carregamento => carregamento.status === 'Carregado').length;

  const openNovoCarregamento = () => navigate('/obra/carregamento');

  const openMontagem = (carregamento: Carregamento) => {
    setSelectedCarreg(carregamento);
    setEquipe('');
    setModalOpen(true);
  };

  const handleRegistrarMontagem = () => {
    if (!selectedCarreg || !equipe.trim()) return;

    const today = new Date().toISOString().split('T')[0];

    montagensApi.registrar({
      carregamentoId: selectedCarreg.id,
      equipeResponsavel: equipe,
      dataMontagem: today,
      observacoes: '',
    }).then(() => {
      refresh();
      setModalOpen(false);
    }).catch(() => {});
  };

  const kpis = [
    { title: 'Total de Carregamentos', value: totalCarregamentos, icon: <Truck size={18} /> },
    { title: 'Paineis Carregados', value: totalPaineisCarregados, icon: <Boxes size={18} /> },
    { title: 'Em Rota', value: emRota, icon: <CheckSquare size={18} /> },
  ];

  return (
    <div>
      <p
        className="text-text-muted uppercase tracking-widest font-extrabold"
        style={{ fontSize: '11px', marginBottom: '8px' }}
      >
        Obra
      </p>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Truck size={28} className="text-primary" />
            <h1 className="text-text-primary leading-tight" style={{ fontSize: '28px', fontWeight: 800 }}>
              Carregamento e Montagem
            </h1>
          </div>
          <p className="mt-1.5 text-text-secondary" style={{ fontSize: '14px' }}>
            Acompanhe os carregamentos enviados para obra e registre a montagem quando a carga chegar ao destino.
          </p>
        </div>

        <button
          onClick={openNovoCarregamento}
          className="bg-primary text-white font-bold hover:bg-primary-dark transition-all inline-flex items-center gap-2"
          style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}
        >
          + Novo Carregamento
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3">
        {kpis.map(kpi => (
          <div
            key={kpi.title}
            className="bg-surface-container-lowest"
            style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '16px 24px' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-text-muted uppercase tracking-widest font-extrabold"
                style={{ fontSize: '11px' }}
              >
                {kpi.title}
              </span>
              <span className="text-text-muted">{kpi.icon}</span>
            </div>
            <div className="text-text-primary tabular-nums" style={{ fontSize: '30px', fontWeight: 700 }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search / Filter toolbar */}
      <div
        className="mt-7 mb-6 bg-surface-container-lowest flex flex-wrap items-center gap-4"
        style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px 24px' }}
      >
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar por obra, veiculo ou painel..."
            className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            style={{ padding: '12px 20px 12px 48px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
          />
        </div>

        <select
          value={filterObra}
          onChange={event => setFilterObra(event.target.value)}
          className="bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
        >
          <option value="">Todas as Obras</option>
          {obras.map(obra => (
            <option key={obra.id} value={obra.id}>
              {obra.nome}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={event => setFilterStatus(event.target.value)}
          className="bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
        >
          <option value="">Todos os Status</option>
          <option value="Carregado">Em Rota</option>
          <option value="Entregue">Montado</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="bg-surface-container-lowest overflow-hidden"
        style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Truck size={48} className="mb-4 text-text-muted" style={{ opacity: 0.4 }} />
            <h3 className="mb-1 text-text-primary" style={{ fontSize: '16px', fontWeight: 700 }}>
              Nenhum carregamento programado
            </h3>
            <p className="mb-6 max-w-md text-text-muted" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              Voce ainda nao possui nenhum carregamento ou montagem registrada para os filtros selecionados.
            </p>
            <button
              onClick={openNovoCarregamento}
              className="bg-primary text-white font-bold hover:bg-primary-dark transition-all inline-flex items-center gap-2"
              style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}
            >
              + Novo Carregamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="bg-surface-container-low" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Obra', 'Veiculo', 'Paineis', 'Data de Carga', 'Status', 'Acao'].map(col => (
                    <th
                      key={col}
                      className="text-text-muted uppercase tracking-widest font-extrabold"
                      style={{
                        padding: '14px 24px',
                        fontSize: '11px',
                        textAlign: col === 'Acao' ? 'right' : 'left',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(carregamento => (
                  <tr
                    key={carregamento.id}
                    className="hover:bg-table-hover transition-colors"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      <div className="text-text-primary" style={{ fontSize: '14px', fontWeight: 600 }}>
                        {carregamento.obraNome}
                      </div>
                      <div className="mt-1 text-text-muted" style={{ fontSize: '12px' }}>
                        Solicitado por {carregamento.solicitante || '-'} | Executado por {carregamento.executadoPor || '-'}
                      </div>
                    </td>
                    <td className="text-text-primary" style={{ padding: '16px 24px', verticalAlign: 'top', fontSize: '14px' }}>
                      {carregamento.veiculo}
                    </td>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      <div className="text-text-primary tabular-nums" style={{ fontSize: '14px', fontWeight: 600 }}>
                        {carregamento.paineis.length}
                      </div>
                      <div className="mt-1 text-text-muted" style={{ fontSize: '12px' }}>
                        {carregamento.paineis
                          .slice(0, 2)
                          .map(painel => painel.codigo ?? painel.dimensao)
                          .join(', ')}
                        {carregamento.paineis.length > 2 ? ' ...' : ''}
                      </div>
                    </td>
                    <td className="text-text-primary tabular-nums" style={{ padding: '16px 24px', verticalAlign: 'top', fontSize: '14px' }}>
                      {carregamento.dataExecucao || '-'}
                    </td>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      {carregamento.status === 'Entregue' ? (
                        <span
                          className="bg-success-bg text-success-text inline-flex items-center font-extrabold uppercase tracking-widest"
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}
                        >
                          Montado
                        </span>
                      ) : (
                        <span
                          className="bg-info-bg text-info-text inline-flex items-center font-extrabold uppercase tracking-widest"
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}
                        >
                          Em Rota
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top', textAlign: 'right' }}>
                      {carregamento.status === 'Carregado' ? (
                        <button
                          onClick={() => openMontagem(carregamento)}
                          className="bg-surface-container-lowest text-text-primary hover:bg-surface-container-low transition-colors inline-flex items-center gap-2"
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}
                        >
                          <CheckSquare size={15} /> Registrar Montagem
                        </button>
                      ) : (
                        <span className="text-text-muted" style={{ fontSize: '13px', fontWeight: 500 }}>
                          Montagem concluida
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && selectedCarreg && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 'var(--z-modal)', padding: '16px' }}
        >
          <div
            className="bg-surface-container-lowest w-full"
            style={{ maxWidth: '520px', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '32px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-text-primary" style={{ fontSize: '18px', fontWeight: 700 }}>
                  Registrar Montagem
                </h2>
                <p className="mt-1 text-text-secondary" style={{ fontSize: '14px' }}>
                  Confirme a equipe responsavel para finalizar a entrega desta carga na obra.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="mt-6 bg-surface-container-low"
              style={{ borderRadius: '10px', border: '1px solid var(--color-border)', padding: '12px 16px' }}
            >
              <div className="text-text-primary" style={{ fontSize: '14px', fontWeight: 600 }}>
                {selectedCarreg.obraNome}
              </div>
              <div className="mt-1 text-text-muted tabular-nums" style={{ fontSize: '12px' }}>
                {selectedCarreg.paineis.length} paineis | {selectedCarreg.veiculo} | {selectedCarreg.dataExecucao || '-'}
              </div>
            </div>

            <div className="mt-5">
              <label
                className="text-text-muted uppercase tracking-widest font-extrabold"
                style={{ fontSize: '11px' }}
              >
                Equipe responsavel
              </label>
              <input
                type="text"
                value={equipe}
                onChange={event => setEquipe(event.target.value)}
                placeholder="Nome da equipe"
                className="mt-2 w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="bg-surface-container-lowest text-text-primary hover:bg-surface-container-low transition-colors"
                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarMontagem}
                className="bg-primary text-white font-bold hover:bg-primary-dark transition-all"
                style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}
              >
                Confirmar Montagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
