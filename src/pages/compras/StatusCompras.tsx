import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { processos as processosApi } from '../../lib/api';
import type { Processo } from '../../lib/types';

const ITEMS_PER_PAGE = 10;

const STATUS_ORDER = ['SOLICITADO', 'EM ORCAMENTO', 'AGUARDANDO_AUTORIZACAO', 'AUTORIZADO', 'NO_FINANCEIRO', 'PAGO', 'NEGADO'];

export default function StatusCompras() {
  const [processos, setProcessos] = useState<Processo[]>([]);

  useEffect(() => {
    processosApi.listar().then(setProcessos).catch(() => {});
  }, []);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return processos.filter(p => {
      const matchSearch = !search ||
        p.numero.toLowerCase().includes(search.toLowerCase()) ||
        p.obra.toLowerCase().includes(search.toLowerCase()) ||
        p.item.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [processos, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
        Compras
      </p>
      <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>
        Status de Processos
      </h1>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>
        Acompanhamento do ciclo de vida dos processos de compra
      </p>

      {/* Toolbar */}
      <div className="border border-border rounded-xl" style={{ marginTop: '28px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="relative flex-1" style={{ minWidth: '200px' }}>
          <Search size={16} className="absolute text-text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por numero, obra ou item..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-surface-container-low border border-border text-text-primary"
            style={{ padding: '12px 20px 12px 44px', borderRadius: '10px', fontSize: '14px' }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-low border border-border text-text-secondary"
          style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}
        >
          <option value="">Todos os Status</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Process Cards */}
      <div className="flex flex-col gap-4" style={{ marginTop: '24px' }}>
        {paginatedData.length === 0 ? (
          <EmptyState message="Nenhum processo encontrado" icon="FileText" />
        ) : (
          paginatedData.map(processo => (
            <div key={processo.id} className="border border-border rounded-xl" style={{ padding: '24px' }}>
              {/* Process header */}
              <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '20px' }}>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-primary" style={{ fontSize: '16px' }}>{processo.numero}</span>
                    <StatusBadge status={processo.status} />
                  </div>
                  <p className="text-text-secondary" style={{ fontSize: '13px', marginTop: '4px' }}>
                    {processo.obra} — {processo.item} — {processo.qtd} un
                  </p>
                </div>
                <span className="font-extrabold text-text-primary" style={{ fontSize: '18px' }}>
                  {formatCurrency(processo.valor)}
                </span>
              </div>

              {/* Timeline */}
              <div className="flex items-start gap-0" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
                {processo.timeline.map((entry, i) => {
                  const isLast = i === processo.timeline.length - 1;
                  return (
                    <div key={i} className="flex items-start" style={{ minWidth: '140px' }}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`rounded-full flex items-center justify-center font-bold text-white ${isLast ? 'bg-primary' : 'bg-success'}`}
                          style={{ width: '28px', height: '28px', fontSize: '12px' }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex flex-col items-center" style={{ marginTop: '8px' }}>
                          <span className="font-bold text-text-primary text-center" style={{ fontSize: '11px', maxWidth: '120px' }}>
                            {entry.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>
                            {entry.data}
                          </span>
                          <span className="text-text-muted" style={{ fontSize: '10px' }}>
                            {entry.responsavel}
                          </span>
                        </div>
                      </div>
                      {!isLast && (
                        <div className="bg-success" style={{ height: '2px', flex: 1, marginTop: '14px', minWidth: '20px' }} />
                      )}
                    </div>
                  );
                })}
                {/* Pending steps */}
                {STATUS_ORDER.slice(STATUS_ORDER.indexOf(processo.status) + 1).filter(s => s !== 'NEGADO').map((s, i) => (
                  <div key={s} className="flex items-start" style={{ minWidth: '140px' }}>
                    <div className="bg-border" style={{ height: '2px', flex: 0, width: '20px', marginTop: '14px' }} />
                    <div className="flex flex-col items-center">
                      <div className="rounded-full flex items-center justify-center font-bold text-text-muted border-2 border-border bg-white" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                        {processo.timeline.length + i + 1}
                      </div>
                      <span className="text-text-muted text-center" style={{ fontSize: '11px', marginTop: '8px', maxWidth: '120px' }}>
                        {s.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between" style={{ marginTop: '20px', padding: '12px 0' }}>
          <span className="text-text-muted" style={{ fontSize: '12px' }}>{startIdx}-{endIdx} de {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-surface-container-high/60 disabled:opacity-30"><ChevronLeft size={16} /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold ${p === currentPage ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-container-high/60'}`}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-surface-container-high/60 disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
