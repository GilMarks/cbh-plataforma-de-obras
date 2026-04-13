import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, History } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import EmptyState from '../../components/shared/EmptyState';
import { montagens as montagensApi, obras as obrasApi } from '../../lib/api';
import type { Montagem, Obra } from '../../lib/types';

const ITEMS_PER_PAGE = 10;

export default function HistoricoMontagem() {
  const [montagens, setMontagens] = useState<Montagem[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);

  useEffect(() => {
    montagensApi.listar().then(setMontagens).catch(() => {});
    obrasApi.listar().then(setObras).catch(() => {});
  }, []);
  const [search, setSearch] = useState('');
  const [filterObra, setFilterObra] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return montagens.filter(m => {
      const matchSearch = !search ||
        m.obraNome.toLowerCase().includes(search.toLowerCase()) ||
        m.equipeResponsavel.toLowerCase().includes(search.toLowerCase()) ||
        m.painelId.toLowerCase().includes(search.toLowerCase());
      const matchObra = !filterObra || m.obraId === Number(filterObra);
      return matchSearch && matchObra;
    });
  }, [montagens, search, filterObra]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>Obra</p>
      <div className="flex items-center gap-3">
        <History size={28} className="text-primary" />
        <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Historico de Montagem</h1>
      </div>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Registro de todas as montagens realizadas</p>

      <div className="grid-kpi" style={{ marginTop: '28px' }}>
        <KPICard title="Total Montagens" value={montagens.length} icon="CheckSquare" color="primary" />
      </div>

      <div className="border border-border rounded-xl" style={{ marginTop: '28px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="relative flex-1" style={{ minWidth: '200px' }}>
          <Search size={16} className="absolute text-text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Buscar por obra, equipe ou peca..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full bg-surface-container-low border border-border text-text-primary" style={{ padding: '12px 20px 12px 44px', borderRadius: '10px', fontSize: '14px' }} />
        </div>
        <select value={filterObra} onChange={e => { setFilterObra(e.target.value); setCurrentPage(1); }} className="bg-surface-container-low border border-border text-text-secondary" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}>
          <option value="">Todas as Obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
      </div>

      <div className="border border-border rounded-xl overflow-hidden" style={{ marginTop: '20px' }}>
        {filtered.length === 0 ? (
          <EmptyState message="Nenhuma montagem registrada" icon="History" />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full" style={{ fontSize: '13px' }}>
                <thead>
                  <tr className="bg-surface-container-low text-text-muted uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    <th className="text-left font-extrabold" style={{ padding: '14px 20px' }}>Data</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Peca</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Tipo</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Dimensao</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Obra</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Equipe</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(m => (
                    <tr key={m.id} className="border-t border-border hover:bg-surface-container-low/50">
                      <td className="text-text-secondary" style={{ padding: '14px 20px' }}>{m.dataMontagem}</td>
                      <td className="font-semibold text-text-primary" style={{ padding: '14px 16px' }}>{m.painelId}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{m.tipo}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{m.dimensao}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{m.obraNome}</td>
                      <td className="font-semibold text-text-primary" style={{ padding: '14px 16px' }}>{m.equipeResponsavel}</td>
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
