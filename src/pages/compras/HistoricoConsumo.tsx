import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { movimentacoesEstoque } from '../../lib/api';
import type { MovimentacaoEstoque } from '../../lib/types';

const ITEMS_PER_PAGE = 10;

export default function HistoricoConsumo() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);

  useEffect(() => {
    movimentacoesEstoque.historico().then(setMovimentacoes).catch(() => {});
  }, []);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return movimentacoes.filter(m => {
      const matchSearch = !search ||
        m.insumoNome.toLowerCase().includes(search.toLowerCase()) ||
        m.responsavel.toLowerCase().includes(search.toLowerCase()) ||
        m.obraDestino.toLowerCase().includes(search.toLowerCase());
      const matchTipo = !filterTipo || m.tipo === filterTipo;
      return matchSearch && matchTipo;
    });
  }, [movimentacoes, search, filterTipo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  const totalEntradas = movimentacoes.filter(m => m.tipo === 'Entrada').length;
  const totalSaidas = movimentacoes.filter(m => m.tipo === 'Saida').length;

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>Compras</p>
      <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Historico de Consumo</h1>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Registro de todas as movimentacoes de estoque</p>

      <div className="grid-kpi" style={{ marginTop: '28px' }}>
        <KPICard title="Total Movimentacoes" value={movimentacoes.length} icon="History" color="primary" />
        <KPICard title="Entradas" value={totalEntradas} icon="ArrowDown" color="success" />
        <KPICard title="Saidas" value={totalSaidas} icon="ArrowUp" color="warning" />
      </div>

      <div className="border border-border rounded-xl" style={{ marginTop: '28px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="relative flex-1" style={{ minWidth: '200px' }}>
          <Search size={16} className="absolute text-text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Buscar por material, responsavel ou obra..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full bg-surface-container-low border border-border text-text-primary" style={{ padding: '12px 20px 12px 44px', borderRadius: '10px', fontSize: '14px' }} />
        </div>
        <select value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setCurrentPage(1); }} className="bg-surface-container-low border border-border text-text-secondary" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}>
          <option value="">Todos os Tipos</option>
          <option value="Entrada">Entrada</option>
          <option value="Saida">Saida</option>
        </select>
      </div>

      <div className="border border-border rounded-xl overflow-hidden" style={{ marginTop: '20px' }}>
        {filtered.length === 0 ? (
          <EmptyState message="Nenhuma movimentacao encontrada" icon="History" />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full" style={{ fontSize: '13px' }}>
                <thead>
                  <tr className="bg-surface-container-low text-text-muted uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    <th className="text-left font-extrabold" style={{ padding: '14px 20px' }}>Data</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Material</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Tipo</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Quantidade</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Obra Destino</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Responsavel</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Obs</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(m => (
                    <tr key={m.id} className="border-t border-border hover:bg-surface-container-low/50">
                      <td className="text-text-secondary" style={{ padding: '14px 20px' }}>{m.data}</td>
                      <td className="font-semibold text-text-primary" style={{ padding: '14px 16px' }}>{m.insumoNome}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={m.tipo} /></td>
                      <td className="font-bold text-text-primary" style={{ padding: '14px 16px' }}>{m.quantidade}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{m.obraDestino || '—'}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{m.responsavel}</td>
                      <td className="text-text-muted" style={{ padding: '14px 16px', maxWidth: '150px' }}>
                        <span className="truncate block">{m.observacoes || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border flex items-center justify-between" style={{ padding: '12px 20px' }}>
              <span className="text-text-muted" style={{ fontSize: '12px' }}>{startIdx}-{endIdx} de {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-surface-container-high/60 disabled:opacity-30"><ChevronLeft size={16} /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold ${p === currentPage ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-container-high/60'}`}>{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-surface-container-high/60 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
