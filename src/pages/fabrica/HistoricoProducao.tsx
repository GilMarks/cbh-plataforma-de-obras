import { useState, useEffect, useMemo } from 'react';
import { Search, FileDown, Filter, MoreVertical, ChevronLeft, ChevronRight, X } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { solicitacoes as solicitacoesApi } from '../../lib/api';
import type { Solicitacao } from '../../lib/types';

interface RegistroHistorico {
  data: string;
  tipo: string;
  id: string;
  status: string;
  especificacao: string;
  obraDestino: string;
  responsavel: string;
  qtdProduzida: number;
}

const ITEMS_PER_PAGE = 10;

export default function HistoricoProducao() {
  const [search, setSearch] = useState('');
  const [filtroObra, setFiltroObra] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedObra, setAppliedObra] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);

  useEffect(() => {
    solicitacoesApi.listar().then(setSolicitacoes).catch(() => {});
  }, []);

  const registros = useMemo<RegistroHistorico[]>(() => {
    const items: RegistroHistorico[] = [];
    solicitacoes.forEach(sol => {
      sol.historicoPainel.forEach(h => {
        items.push({
          data: h.data, tipo: 'Painel', id: `PNL-${String(sol.id).padStart(4, '0')}`,
          status: sol.statusPainel, especificacao: `Painel ${sol.painelComp}x${sol.painelAlt}m — ${sol.tipoPainel} — T20`,
          obraDestino: sol.obraNome, responsavel: h.responsavel, qtdProduzida: h.qtd,
        });
      });
      sol.historicoPilar.forEach(h => {
        items.push({
          data: h.data, tipo: 'Pilar', id: `PLR-${String(sol.id).padStart(4, '0')}`,
          status: sol.statusPilar, especificacao: `Pilar Estrutural ${sol.pilarAlt}m`,
          obraDestino: sol.obraNome, responsavel: h.responsavel, qtdProduzida: h.qtd,
        });
      });
      sol.historicoSapata.forEach(h => {
        items.push({
          data: h.data, tipo: 'Sapata', id: `SPT-${String(sol.id).padStart(4, '0')}`,
          status: sol.statusSapata, especificacao: `Sapata ${sol.tamanhoSapata} — ${sol.tipoSapata}`,
          obraDestino: sol.obraNome, responsavel: h.responsavel, qtdProduzida: h.qtd,
        });
      });
    });
    return items.sort((a, b) => b.data.localeCompare(a.data));
  }, [solicitacoes]);

  // Filtered by applied filters only (click "Aplicar")
  const filtered = useMemo(() => {
    return registros.filter(r => {
      const matchSearch = !appliedSearch ||
        r.id.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        r.obraDestino.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        r.responsavel.toLowerCase().includes(appliedSearch.toLowerCase());
      const matchObra = !appliedObra || r.obraDestino === appliedObra;
      return matchSearch && matchObra;
    });
  }, [registros, appliedSearch, appliedObra]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  const obras = [...new Set(registros.map(r => r.obraDestino))];
  const totalProduzido = filtered.reduce((s, r) => s + r.qtdProduzida, 0);
  const totalPaineis = filtered.filter(r => r.tipo === 'Painel').reduce((s, r) => s + r.qtdProduzida, 0);
  const totalPilares = filtered.filter(r => r.tipo === 'Pilar').reduce((s, r) => s + r.qtdProduzida, 0);
  const totalSapatas = filtered.filter(r => r.tipo === 'Sapata').reduce((s, r) => s + r.qtdProduzida, 0);

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedObra(filtroObra);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setFiltroObra('');
    setAppliedSearch('');
    setAppliedObra('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    console.log('[HistoricoProducao] Exportando CSV...', { total: filtered.length });
  };

  const handleExportPDF = () => {
    console.log('[HistoricoProducao] Exportando PDF...', { total: filtered.length });
  };

  const hasActiveFilters = appliedSearch !== '' || appliedObra !== '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap" style={{ gap: '16px' }}>
        <div>
          <p
            className="text-text-muted uppercase tracking-widest font-extrabold"
            style={{ fontSize: '11px' }}
          >
            Auditoria & Rastreio
          </p>
          <h1
            className="font-extrabold text-text-primary tracking-tight"
            style={{ fontSize: '28px', lineHeight: 1.2, marginTop: '6px' }}
          >
            Historico de Producao
          </h1>
          <p
            className="text-text-secondary font-medium"
            style={{ fontSize: '14px', marginTop: '6px' }}
          >
            Acompanhe e audite as pecas produzidas por obra, data e responsavel
          </p>
        </div>
        <div className="flex" style={{ gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            className="flex items-center text-text-secondary hover:bg-surface-container-high/50 transition-colors"
            style={{
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
            }}
          >
            <FileDown size={16} /> Exportar CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center bg-primary text-white font-bold hover:bg-primary-dark transition-all"
            style={{
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '10px',
              fontSize: '13px',
            }}
          >
            <FileDown size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* ── KPIs — compact single row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Produzido', value: totalProduzido, color: 'text-primary' },
          { label: 'Paineis', value: totalPaineis, color: 'text-info' },
          { label: 'Pilares', value: totalPilares, color: 'text-success' },
          { label: 'Sapatas', value: totalSapatas, color: 'text-warning' },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="bg-surface-container-lowest"
            style={{
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              padding: '16px 20px',
            }}
          >
            <p className="font-extrabold text-text-muted uppercase tracking-widest" style={{ fontSize: '10px' }}>
              {kpi.label}
            </p>
            <p
              className={`font-extrabold tabular-nums tracking-tight ${kpi.color}`}
              style={{ fontSize: '22px', lineHeight: 1.2, marginTop: '6px' }}
            >
              {kpi.value.toLocaleString('pt-BR')}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div
        className="bg-surface-container-lowest flex items-center flex-wrap"
        style={{
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '20px 24px',
          gap: '12px',
        }}
      >
        <div className="relative" style={{ flex: 1, minWidth: '220px' }}>
          <Search
            size={18}
            className="absolute text-text-muted pointer-events-none"
            style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
            placeholder="Pesquisar por ID, obra ou responsavel..."
            className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted
              focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            style={{
              padding: '12px 20px 12px 48px',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
            }}
          />
        </div>
        <select
          value={filtroObra}
          onChange={e => setFiltroObra(e.target.value)}
          className="bg-surface-container-low text-text-primary
            focus:outline-none focus:ring-2 focus:ring-primary/15"
          style={{
            padding: '12px 20px',
            fontSize: '14px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            minWidth: '200px',
          }}
        >
          <option value="">Todas as Obras</option>
          {obras.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <button
          onClick={handleApplyFilters}
          className="flex items-center bg-primary text-white font-bold hover:bg-primary-dark transition-colors"
          style={{
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '13px',
          }}
        >
          <Filter size={14} /> Aplicar Filtros
        </button>
        <button
          onClick={handleClearFilters}
          className={`flex items-center transition-colors ${
            hasActiveFilters
              ? 'text-danger hover:bg-danger-bg'
              : 'text-text-secondary hover:bg-surface-container-high/50'
          }`}
          style={{
            gap: '6px',
            padding: '12px 20px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            fontSize: '13px',
          }}
        >
          <X size={14} /> Limpar
        </button>
      </div>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="flex items-center flex-wrap" style={{ gap: '8px', marginTop: '-12px' }}>
          <span className="text-text-muted font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>
            Filtros ativos:
          </span>
          {appliedSearch && (
            <span
              className="inline-flex items-center bg-primary-bg text-primary font-bold"
              style={{ gap: '6px', padding: '4px 12px', borderRadius: '6px', fontSize: '11px' }}
            >
              Busca: "{appliedSearch}"
              <button onClick={() => { setAppliedSearch(''); setSearch(''); setCurrentPage(1); }}>
                <X size={12} />
              </button>
            </span>
          )}
          {appliedObra && (
            <span
              className="inline-flex items-center bg-primary-bg text-primary font-bold"
              style={{ gap: '6px', padding: '4px 12px', borderRadius: '6px', fontSize: '11px' }}
            >
              Obra: {appliedObra}
              <button onClick={() => { setAppliedObra(''); setFiltroObra(''); setCurrentPage(1); }}>
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div
        className="bg-surface-container-lowest overflow-hidden"
        style={{
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '32px' }}><EmptyState message="Nenhum registro de producao encontrado" /></div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full" style={{ minWidth: '1000px' }}>
              <thead>
                <tr className="bg-surface-container-low">
                  {[
                    { label: 'Data', align: 'left' },
                    { label: 'ID Peca', align: 'left' },
                    { label: 'Tipo', align: 'left' },
                    { label: 'Especificacao', align: 'left' },
                    { label: 'Obra Destino', align: 'left' },
                    { label: 'Responsavel', align: 'left' },
                    { label: 'Qtd.', align: 'right' },
                    { label: '', align: 'center' },
                  ].map((col, i) => (
                    <th
                      key={i}
                      className={`font-extrabold text-text-muted uppercase tracking-widest text-${col.align}`}
                      style={{
                        padding: '14px 24px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((r, i) => (
                  <tr
                    key={`${r.id}-${r.data}-${i}`}
                    className="hover:bg-table-hover transition-colors"
                    style={{
                      borderBottom: i < paginatedData.length - 1
                        ? '1px solid var(--color-border)'
                        : 'none',
                    }}
                  >
                    <td
                      className="text-text-secondary tabular-nums"
                      style={{ padding: '16px 24px', fontSize: '14px', whiteSpace: 'nowrap' }}
                    >
                      {new Date(r.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div className="flex items-center" style={{ gap: '10px' }}>
                        <span className="font-bold text-primary tabular-nums" style={{ fontSize: '14px' }}>{r.id}</span>
                        <StatusBadge status={r.status} />
                      </div>
                    </td>
                    <td className="text-text-primary font-medium" style={{ padding: '16px 24px', fontSize: '14px' }}>{r.tipo}</td>
                    <td className="text-text-secondary" style={{ padding: '16px 24px', fontSize: '13px', maxWidth: '220px' }}>
                      <span className="truncate block">{r.especificacao}</span>
                    </td>
                    <td className="font-medium text-text-primary" style={{ padding: '16px 24px', fontSize: '14px', whiteSpace: 'nowrap' }}>{r.obraDestino}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div className="flex items-center" style={{ gap: '10px' }}>
                        <div
                          className="bg-primary-container flex items-center justify-center text-white font-bold"
                          style={{ width: '28px', height: '28px', borderRadius: '8px', fontSize: '11px', flexShrink: 0 }}
                        >
                          {r.responsavel.charAt(0)}
                        </div>
                        <span className="text-text-primary" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{r.responsavel}</span>
                      </div>
                    </td>
                    <td
                      className="font-bold text-text-primary tabular-nums text-right"
                      style={{ padding: '16px 24px', fontSize: '14px' }}
                    >
                      {String(r.qtdProduzida).padStart(2, '0')}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button
                        className="flex items-center justify-center hover:bg-surface-container transition-colors"
                        style={{ width: '32px', height: '32px', borderRadius: '8px', margin: '0 auto' }}
                      >
                        <MoreVertical size={16} className="text-text-muted" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {filtered.length > 0 && (
          <div
            className="flex items-center justify-between text-text-muted"
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--color-border)',
              fontSize: '13px',
            }}
          >
            <span className="tabular-nums">
              Mostrando <span className="font-bold text-text-primary">{startIdx}</span> a{' '}
              <span className="font-bold text-text-primary">{endIdx}</span> de{' '}
              <span className="font-bold text-text-primary">{filtered.length}</span> registros
            </span>

            <div className="flex items-center" style={{ gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center text-text-secondary hover:bg-surface-container-high/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '12px',
                }}
              >
                <ChevronLeft size={14} /> Anterior
              </button>

              {/* Page numbers */}
              <div className="flex items-center" style={{ gap: '4px' }}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex items-center justify-center font-bold tabular-nums transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-surface-container-high/50'
                      }`}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', fontSize: '12px' }}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center text-text-secondary hover:bg-surface-container-high/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '12px',
                }}
              >
                Proximo <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
