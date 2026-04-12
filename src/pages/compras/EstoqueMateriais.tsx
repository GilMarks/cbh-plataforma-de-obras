import { useState, useMemo } from 'react';
import { Search, Plus, X, ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { getAll, create, update } from '../../lib/storage';
import { getCurrentUser } from '../../lib/storage';
import { STORAGE_KEYS, type Insumo, type MovimentacaoEstoque, type Obra } from '../../lib/types';

export default function EstoqueMateriais() {
  const [insumos, setInsumos] = useState(() => getAll<Insumo>(STORAGE_KEYS.INSUMOS));
  const obras = useMemo(() => getAll<Obra>(STORAGE_KEYS.OBRAS), []);
  const user = getCurrentUser();
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'Entrada' | 'Saida'>('Entrada');
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [movQtd, setMovQtd] = useState('');
  const [movObra, setMovObra] = useState('');
  const [movObs, setMovObs] = useState('');

  const refresh = () => setInsumos(getAll<Insumo>(STORAGE_KEYS.INSUMOS));

  const filtered = useMemo(() => {
    if (!search) return insumos;
    return insumos.filter(i => i.nome.toLowerCase().includes(search.toLowerCase()));
  }, [insumos, search]);

  const totalItens = insumos.length;
  const alertaBaixo = insumos.filter(i => i.estoqueAtual <= i.estoqueMinimo).length;

  const openMov = (insumo: Insumo, tipo: 'Entrada' | 'Saida') => {
    setSelectedInsumo(insumo);
    setModalTipo(tipo);
    setMovQtd('');
    setMovObra('');
    setMovObs('');
    setModalOpen(true);
  };

  const handleSaveMov = () => {
    if (!selectedInsumo || !movQtd) return;
    const qty = Number(movQtd);
    if (qty <= 0) return;

    create<MovimentacaoEstoque>(STORAGE_KEYS.MOVIMENTACOES_ESTOQUE, {
      insumoId: selectedInsumo.id,
      insumoNome: selectedInsumo.nome,
      tipo: modalTipo,
      quantidade: qty,
      obraDestino: modalTipo === 'Saida' ? movObra : '',
      data: new Date().toISOString().split('T')[0],
      responsavel: user?.login || '',
      observacoes: movObs,
    } as Omit<MovimentacaoEstoque, 'id'>);

    const novoEstoque = modalTipo === 'Entrada'
      ? selectedInsumo.estoqueAtual + qty
      : Math.max(0, selectedInsumo.estoqueAtual - qty);

    update<Insumo>(STORAGE_KEYS.INSUMOS, selectedInsumo.id, { estoqueAtual: novoEstoque });
    refresh();
    setModalOpen(false);
  };

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>Compras</p>
      <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Estoque de Materiais</h1>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Controle de entrada e saida de materias-primas</p>

      <div className="grid-kpi" style={{ marginTop: '28px' }}>
        <KPICard title="Total Itens" value={totalItens} icon="Package" color="primary" />
        <KPICard title="Estoque Baixo" value={alertaBaixo} icon="AlertTriangle" color="danger" subtitle="Abaixo do minimo" />
      </div>

      <div className="border border-border rounded-xl" style={{ marginTop: '28px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute text-text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Buscar material..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-surface-container-low border border-border text-text-primary" style={{ padding: '12px 20px 12px 44px', borderRadius: '10px', fontSize: '14px' }} />
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden" style={{ marginTop: '20px' }}>
        {filtered.length === 0 ? (
          <EmptyState message="Nenhum material encontrado" icon="Package" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full" style={{ fontSize: '13px' }}>
              <thead>
                <tr className="bg-surface-container-low text-text-muted uppercase tracking-wider" style={{ fontSize: '11px' }}>
                  <th className="text-left font-extrabold" style={{ padding: '14px 20px' }}>Material</th>
                  <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Unidade</th>
                  <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Estoque Atual</th>
                  <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Estoque Min.</th>
                  <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Status</th>
                  <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => {
                  const baixo = i.estoqueAtual <= i.estoqueMinimo;
                  return (
                    <tr key={i.id} className="border-t border-border hover:bg-surface-container-low/50">
                      <td className="font-semibold text-text-primary" style={{ padding: '14px 20px' }}>{i.nome}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{i.unidade}</td>
                      <td className={`font-bold ${baixo ? 'text-danger' : 'text-text-primary'}`} style={{ padding: '14px 16px' }}>
                        {i.estoqueAtual}
                        {baixo && <AlertTriangle size={14} className="inline ml-1 text-danger" />}
                      </td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{i.estoqueMinimo}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={baixo ? 'Alta' : 'Disponivel'} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex gap-2">
                          <button onClick={() => openMov(i, 'Entrada')} className="flex items-center gap-1 text-success font-bold text-xs hover:bg-success-bg rounded-lg transition-colors" style={{ padding: '6px 12px' }}>
                            <ArrowDown size={14} /> Entrada
                          </button>
                          <button onClick={() => openMov(i, 'Saida')} className="flex items-center gap-1 text-warning-text font-bold text-xs hover:bg-warning-bg rounded-lg transition-colors" style={{ padding: '6px 12px' }}>
                            <ArrowUp size={14} /> Saida
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && selectedInsumo && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '480px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>Registrar {modalTipo}</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="bg-surface-container-low rounded-xl" style={{ padding: '16px', marginBottom: '20px' }}>
              <p className="font-bold text-text-primary">{selectedInsumo.nome}</p>
              <p className="text-text-muted" style={{ fontSize: '12px' }}>Estoque atual: {selectedInsumo.estoqueAtual} {selectedInsumo.unidade}</p>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Quantidade ({selectedInsumo.unidade})</label>
                <input type="number" value={movQtd} onChange={e => setMovQtd(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
              </div>
              {modalTipo === 'Saida' && (
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Obra Destino</label>
                  <select value={movObra} onChange={e => setMovObra(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                    <option value="">Selecione</option>
                    {obras.map(o => <option key={o.id} value={o.nome}>{o.nome}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Observacoes</label>
                <input type="text" value={movObs} onChange={e => setMovObs(e.target.value)} placeholder="Ex: NF 12345, Concretagem lote 2..." className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
              </div>
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: '24px' }}>
              <button onClick={() => setModalOpen(false)} className="text-text-secondary font-bold" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Cancelar</button>
              <button onClick={handleSaveMov} className={`text-white font-bold hover:opacity-90 ${modalTipo === 'Entrada' ? 'bg-success' : 'bg-warning-text'}`} style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Confirmar {modalTipo}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
