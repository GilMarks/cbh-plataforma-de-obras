import { useState, useMemo } from 'react';
import { Plus, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { getAll, create } from '../../lib/storage';
import { getCurrentUser } from '../../lib/storage';
import { STORAGE_KEYS, type SolicitacaoCompra, type Obra } from '../../lib/types';

const ITEMS_PER_PAGE = 10;

export default function SolicitacaoOrcamentoObra() {
  const [solicitacoes, setSolicitacoes] = useState(() =>
    getAll<SolicitacaoCompra>(STORAGE_KEYS.SOLICITACOES_COMPRA).filter(s => s.setor === 'Obra')
  );
  const obras = useMemo(() => getAll<Obra>(STORAGE_KEYS.OBRAS), []);
  const user = getCurrentUser();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formObraId, setFormObraId] = useState('');
  const [formItem, setFormItem] = useState('');
  const [formQtd, setFormQtd] = useState('');
  const [formUnidade, setFormUnidade] = useState('un');
  const [formPrioridade, setFormPrioridade] = useState<'Baixa' | 'Media' | 'Alta'>('Media');
  const [formObs, setFormObs] = useState('');

  const refresh = () => setSolicitacoes(getAll<SolicitacaoCompra>(STORAGE_KEYS.SOLICITACOES_COMPRA).filter(s => s.setor === 'Obra'));

  const filtered = useMemo(() => {
    if (!search) return solicitacoes;
    return solicitacoes.filter(s => s.item.toLowerCase().includes(search.toLowerCase()) || s.obraNome.toLowerCase().includes(search.toLowerCase()));
  }, [solicitacoes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleCriar = () => {
    if (!formObraId || !formItem.trim() || !formQtd) return;
    const obra = obras.find(o => o.id === Number(formObraId));
    if (!obra) return;
    create<SolicitacaoCompra>(STORAGE_KEYS.SOLICITACOES_COMPRA, {
      obraId: obra.id, obraNome: obra.nome, setor: 'Obra', item: formItem,
      quantidade: Number(formQtd), unidade: formUnidade, prioridade: formPrioridade,
      observacoes: formObs, solicitante: user?.login || '',
      data: new Date().toISOString().split('T')[0], status: 'SOLICITADO',
      fornecedor: '', valor: 0, pagamento: '', imagemOrcamento: '', statusFluxo: 'SOLICITADO',
    } as Omit<SolicitacaoCompra, 'id'>);
    refresh(); setModalOpen(false);
    setFormObraId(''); setFormItem(''); setFormQtd(''); setFormObs('');
  };

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>Obra</p>
      <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Solicitacao de Orcamento</h1>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Solicite orcamentos de materiais para suas obras</p>

      <div className="grid-kpi" style={{ marginTop: '28px' }}>
        <KPICard title="Total Solicitacoes" value={solicitacoes.length} icon="Receipt" color="primary" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginTop: '28px' }}>
        <div className="relative" style={{ minWidth: '300px' }}>
          <Search size={16} className="absolute text-text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full bg-surface-container-low border border-border text-text-primary" style={{ padding: '12px 20px 12px 44px', borderRadius: '10px', fontSize: '14px' }} />
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>
          <Plus size={16} /> Nova Solicitacao
        </button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden" style={{ marginTop: '20px' }}>
        {filtered.length === 0 ? <EmptyState message="Nenhuma solicitacao" icon="Receipt" /> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full" style={{ fontSize: '13px' }}>
                <thead>
                  <tr className="bg-surface-container-low text-text-muted uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    <th className="text-left font-extrabold" style={{ padding: '14px 20px' }}>Item</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Obra</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Qtd</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Prioridade</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Data</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(s => (
                    <tr key={s.id} className="border-t border-border hover:bg-surface-container-low/50">
                      <td className="font-semibold text-text-primary" style={{ padding: '14px 20px' }}>{s.item}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{s.obraNome}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{s.quantidade} {s.unidade}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={s.prioridade} /></td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{s.data}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={s.statusFluxo} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border flex items-center justify-between" style={{ padding: '12px 20px' }}>
              <span className="text-text-muted" style={{ fontSize: '12px' }}>Pagina {currentPage} de {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-surface-container-high/60 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-surface-container-high/60 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '560px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>Nova Solicitacao de Orcamento</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Obra</label>
                <select value={formObraId} onChange={e => setFormObraId(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                  <option value="">Selecione</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Material / Item</label>
                <input type="text" value={formItem} onChange={e => setFormItem(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Qtd</label>
                  <input type="number" value={formQtd} onChange={e => setFormQtd(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
                </div>
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Unidade</label>
                  <select value={formUnidade} onChange={e => setFormUnidade(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                    <option value="un">un</option><option value="kg">kg</option><option value="m">m</option><option value="m3">m³</option><option value="saco">saco</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Prioridade</label>
                  <select value={formPrioridade} onChange={e => setFormPrioridade(e.target.value as 'Baixa' | 'Media' | 'Alta')} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                    <option value="Baixa">Baixa</option><option value="Media">Media</option><option value="Alta">Alta</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Observacoes</label>
                <textarea value={formObs} onChange={e => setFormObs(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px', minHeight: '60px', resize: 'vertical' }} />
              </div>
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: '24px' }}>
              <button onClick={() => setModalOpen(false)} className="text-text-secondary font-bold" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Cancelar</button>
              <button onClick={handleCriar} className="bg-primary text-white font-bold hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Criar Solicitacao</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
