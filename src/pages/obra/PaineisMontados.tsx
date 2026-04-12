import { type ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, CheckSquare, Search, Truck, X } from 'lucide-react';
import { create, getAll, update } from '../../lib/storage';
import { STORAGE_KEYS, type Carregamento, type Montagem, type Obra } from '../../lib/types';

const ACTIVE_STATUSES: Array<Carregamento['status']> = ['Carregado', 'Entregue'];

function KPIBlock({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <div className="text-3xl font-semibold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: Carregamento['status'] }) {
  const tone =
    status === 'Entregue'
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-blue-50 text-blue-700';

  return (
    <span
      className={`inline-flex items-center rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${tone}`}
    >
      {status === 'Carregado' ? 'Em Rota' : 'Montado'}
    </span>
  );
}

function EmptyTableState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Truck size={48} className="mb-4 text-slate-300" />
      <h3 className="mb-1 text-lg font-medium text-slate-900">Nenhum carregamento programado</h3>
      <p className="mb-6 max-w-md text-sm leading-6 text-slate-500">
        Voce ainda nao possui nenhum carregamento ou montagem registrada para os filtros selecionados.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        + Novo Carregamento
      </button>
    </div>
  );
}

export default function PaineisMontados() {
  const [carregamentos, setCarregamentos] = useState(() =>
    getAll<Carregamento>(STORAGE_KEYS.CARREGAMENTOS).filter(item => ACTIVE_STATUSES.includes(item.status)),
  );
  const obras = useMemo(() => getAll<Obra>(STORAGE_KEYS.OBRAS), []);
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterObra, setFilterObra] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCarreg, setSelectedCarreg] = useState<Carregamento | null>(null);
  const [equipe, setEquipe] = useState('');

  const refresh = () =>
    setCarregamentos(getAll<Carregamento>(STORAGE_KEYS.CARREGAMENTOS).filter(item => ACTIVE_STATUSES.includes(item.status)));

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

    selectedCarreg.paineis.forEach(painel => {
      create<Montagem>(STORAGE_KEYS.MONTAGENS, {
        obraId: selectedCarreg.obraId,
        obraNome: selectedCarreg.obraNome,
        carregamentoId: selectedCarreg.id,
        painelId: `${painel.tipo}-${painel.posicaoCarregamento}-${painel.lado}`,
        tipo: painel.tipo,
        dimensao: painel.dimensao,
        equipeResponsavel: equipe,
        dataMontagem: today,
        observacoes: '',
      } as Omit<Montagem, 'id'>);
    });

    update<Carregamento>(STORAGE_KEYS.CARREGAMENTOS, selectedCarreg.id, { status: 'Entregue' });
    refresh();
    setModalOpen(false);
  };

  return (
    <div className="bg-[#f8fafc]">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Obra</p>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Truck size={28} className="text-primary" />
            <h1 className="text-[28px] font-extrabold leading-tight text-slate-900">Carregamento e Montagem</h1>
          </div>
          <p className="mt-1.5 text-sm text-slate-600">
            Acompanhe os carregamentos enviados para obra e registre a montagem quando a carga chegar ao destino.
          </p>
        </div>

        <button
          onClick={openNovoCarregamento}
          className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + Novo Carregamento
        </button>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3">
        <KPIBlock title="Total de Carregamentos" value={totalCarregamentos} icon={<Truck size={18} />} />
        <KPIBlock title="Paineis Carregados" value={totalPaineisCarregados} icon={<Boxes size={18} />} />
        <KPIBlock title="Em Rota" value={emRota} icon={<CheckSquare size={18} />} />
      </div>

      <div className="mb-6 mt-7 flex flex-wrap items-center gap-4">
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar por obra, veiculo ou painel..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700"
          />
        </div>

        <select
          value={filterObra}
          onChange={event => setFilterObra(event.target.value)}
          className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700"
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
          className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700"
        >
          <option value="">Todos os Status</option>
          <option value="Carregado">Em Rota</option>
          <option value="Entregue">Montado</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <EmptyTableState onCreate={openNovoCarregamento} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Obra
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Veiculo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Paineis
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Data de Carga
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Acao
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(carregamento => (
                  <tr key={carregamento.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-4 align-top">
                      <div className="text-sm font-semibold text-slate-900">{carregamento.obraNome}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Solicitado por {carregamento.solicitante || '-'} | Executado por {carregamento.executadoPor || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-700">{carregamento.veiculo}</td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-sm font-semibold tabular-nums text-slate-900">{carregamento.paineis.length}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {carregamento.paineis
                          .slice(0, 2)
                          .map(painel => painel.codigo ?? painel.dimensao)
                          .join(', ')}
                        {carregamento.paineis.length > 2 ? ' ...' : ''}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm tabular-nums text-slate-700">
                      {carregamento.dataExecucao || '-'}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusPill status={carregamento.status === 'Carregado' ? 'Carregado' : 'Entregue'} />
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      {carregamento.status === 'Carregado' ? (
                        <button
                          onClick={() => openMontagem(carregamento)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <CheckSquare size={15} /> Registrar Montagem
                        </button>
                      ) : (
                        <span className="text-sm font-medium text-slate-500">Montagem concluida</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && selectedCarreg && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 'var(--z-modal)', background: 'rgba(15, 23, 42, 0.36)' }}
        >
          <div className="w-full max-w-[520px] rounded-xl border border-slate-200 bg-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Registrar Montagem</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Confirme a equipe responsavel para finalizar a entrega desta carga na obra.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 transition-colors hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">{selectedCarreg.obraNome}</div>
              <div className="mt-1 text-xs text-slate-500 tabular-nums">
                {selectedCarreg.paineis.length} paineis | {selectedCarreg.veiculo} | {selectedCarreg.dataExecucao || '-'}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Equipe responsavel</label>
              <input
                type="text"
                value={equipe}
                onChange={event => setEquipe(event.target.value)}
                placeholder="Nome da equipe"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarMontagem}
                className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
