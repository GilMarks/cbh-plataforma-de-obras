import { useState, useMemo } from 'react';
import { Search, Package, AlertCircle, CheckCircle, Truck, ChevronLeft, ChevronRight, X } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { getAll } from '../../lib/storage';
import { STORAGE_KEYS, type Solicitacao } from '../../lib/types';

type TabView = 'Visao Geral' | 'Relatorios';
interface PecaEstoque {
  id: string;
  tipo: string;
  especificacao: string;
  obra: string;
  qtdFabricada: number;
  qtdSolicitada: number;
  status: string;
}

const ITEMS_PER_PAGE = 10;

export default function EstoquePecas() {
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroObra, setFiltroObra] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [activeView, setActiveView] = useState<TabView>('Visao Geral');
  const [selectedPieces, setSelectedPieces] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const solicitacoes = useMemo(() => getAll<Solicitacao>(STORAGE_KEYS.SOLICITACOES), []);

  const pecas = useMemo<PecaEstoque[]>(() => {
    const items: PecaEstoque[] = [];
    solicitacoes.forEach(sol => {
      if (sol.paineis > 0) {
        items.push({
          id: `PNL-${String(sol.id).padStart(4, '0')}-A`,
          tipo: 'Painel',
          especificacao: `${sol.painelComp}x${sol.painelAlt}m — ${sol.tipoPainel}`,
          obra: sol.obraNome,
          qtdFabricada: sol.fabricadoPainel,
          qtdSolicitada: sol.paineis,
          status: sol.statusPainel,
        });
      }
      if (sol.pilares > 0) {
        items.push({
          id: `PLR-${String(sol.id).padStart(4, '0')}-A`,
          tipo: 'Pilar',
          especificacao: `${sol.pilarAlt}m — ${sol.bainhaPilar ? 'Com' : 'Sem'} bainha`,
          obra: sol.obraNome,
          qtdFabricada: sol.fabricadoPilar,
          qtdSolicitada: sol.pilares,
          status: sol.statusPilar,
        });
      }
      if (sol.sapatas > 0) {
        items.push({
          id: `SPT-${String(sol.id).padStart(4, '0')}-A`,
          tipo: 'Sapata',
          especificacao: `${sol.tamanhoSapata} — ${sol.tipoSapata}`,
          obra: sol.obraNome,
          qtdFabricada: sol.fabricadoSapata,
          qtdSolicitada: sol.sapatas,
          status: sol.statusSapata,
        });
      }
    });
    return items;
  }, [solicitacoes]);

  const filtered = useMemo(() => {
    return pecas.filter(p => {
      const matchSearch = !search ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.tipo.toLowerCase().includes(search.toLowerCase()) ||
        p.obra.toLowerCase().includes(search.toLowerCase());
      const matchTipo = !filtroTipo || p.tipo === filtroTipo;
      const matchObra = !filtroObra || p.obra === filtroObra;
      const matchStatus = !filtroStatus || p.status === filtroStatus;
      return matchSearch && matchTipo && matchObra && matchStatus;
    });
  }, [pecas, search, filtroTipo, filtroObra, filtroStatus]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  // Selection logic
  const allPageSelected = paginatedData.length > 0 && paginatedData.every(p => selectedPieces.has(p.id));
  const somePageSelected = paginatedData.some(p => selectedPieces.has(p.id));

  const toggleSelectAll = () => {
    setSelectedPieces(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        paginatedData.forEach(p => next.delete(p.id));
      } else {
        paginatedData.forEach(p => next.add(p.id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedPieces(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedPieces(new Set());

  const handleClearFilters = () => {
    setSearch('');
    setFiltroTipo('');
    setFiltroObra('');
    setFiltroStatus('');
    setCurrentPage(1);
  };

  const obras = [...new Set(pecas.map(p => p.obra))];
  const totalPecas = pecas.reduce((s, p) => s + p.qtdFabricada, 0);
  const totalCarregando = pecas.filter(p => p.status === 'Parcial').length;
  const totalDisponivel = pecas.filter(p => p.status === 'Fabricado').reduce((s, p) => s + p.qtdFabricada, 0);
  const hasActiveFilters = search || filtroTipo || filtroObra || filtroStatus;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap" style={{ gap: '16px' }}>
        <div>
          <div className="flex items-center" style={{ gap: '16px', marginBottom: '8px' }}>
            <span
              className="font-extrabold text-text-muted uppercase tracking-widest"
              style={{ fontSize: '11px' }}
            >
              Logistica & Patio
            </span>

            {/* Tab switcher */}
            <div
              className="flex bg-surface-container-low"
              style={{
                borderRadius: '10px',
                padding: '4px',
                gap: '2px',
              }}
            >
              {(['Visao Geral', 'Relatorios'] as TabView[]).map(view => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`font-bold transition-all ${
                    activeView === view
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high/50'
                  }`}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <h1
            className="font-extrabold text-text-primary tracking-tight"
            style={{ fontSize: '28px', lineHeight: 1.2 }}
          >
            Estoque de Pecas e Patio
          </h1>
          <p
            className="text-text-secondary font-medium"
            style={{ fontSize: '14px', marginTop: '6px' }}
          >
            Gerencie o inventario de pecas fabricadas e rastreie a expedicao em lote.
          </p>
        </div>

        {/* Dynamic action button */}
        {selectedPieces.size > 0 ? (
          <div className="flex items-center" style={{ gap: '10px' }}>
            <button
              onClick={clearSelection}
              className="flex items-center text-text-secondary hover:bg-surface-container-high/50 transition-colors"
              style={{
                gap: '6px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
              }}
            >
              <X size={14} /> Limpar
            </button>
            <button
              className="flex items-center font-bold text-white transition-all hover:opacity-90"
              style={{
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                backgroundColor: '#16a34a',
              }}
            >
              <Truck size={16} />
              Expedir {selectedPieces.size} {selectedPieces.size === 1 ? 'Peca' : 'Pecas'} Selecionada{selectedPieces.size > 1 ? 's' : ''}
            </button>
          </div>
        ) : (
          <button
            className="flex items-center bg-primary text-white font-bold hover:bg-primary-dark transition-all"
            style={{
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '10px',
              fontSize: '13px',
            }}
          >
            <Truck size={16} /> Nova Expedicao em Lote
          </button>
        )}
      </div>

      {/* ── KPIs — compact single row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total em Estoque', value: totalPecas.toLocaleString('pt-BR'), icon: <Package size={20} />, color: 'text-primary' },
          { label: 'Carregamento / Expedicao', value: totalCarregando, icon: <AlertCircle size={20} />, color: 'text-warning' },
          { label: 'Pecas Disponiveis', value: totalDisponivel.toLocaleString('pt-BR'), icon: <CheckCircle size={20} />, color: 'text-success' },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="bg-surface-container-lowest"
            style={{
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div className={`opacity-40 ${kpi.color}`}>{kpi.icon}</div>
            <div>
              <p className="font-extrabold text-text-muted uppercase tracking-widest" style={{ fontSize: '10px' }}>
                {kpi.label}
              </p>
              <p
                className={`font-extrabold tabular-nums tracking-tight ${kpi.color}`}
                style={{ fontSize: '22px', lineHeight: 1.2, marginTop: '4px' }}
              >
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div
        className="bg-surface-container-lowest flex items-center flex-wrap"
        style={{
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '20px 24px',
          gap: '12px',
        }}
      >
        <div className="relative" style={{ flex: 1, minWidth: '240px' }}>
          <Search
            size={18}
            className="absolute text-text-muted pointer-events-none"
            style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar por Codigo, Tipo ou Obra..."
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
          value={filtroTipo}
          onChange={e => { setFiltroTipo(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          style={{
            padding: '12px 20px',
            fontSize: '14px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            minWidth: '150px',
          }}
        >
          <option value="">Todos os Tipos</option>
          <option value="Painel">Painel</option>
          <option value="Pilar">Pilar</option>
          <option value="Sapata">Sapata</option>
        </select>

        <select
          value={filtroObra}
          onChange={e => { setFiltroObra(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          style={{
            padding: '12px 20px',
            fontSize: '14px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            minWidth: '180px',
          }}
        >
          <option value="">Todas as Obras</option>
          {obras.map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        <select
          value={filtroStatus}
          onChange={e => { setFiltroStatus(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          style={{
            padding: '12px 20px',
            fontSize: '14px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            minWidth: '150px',
          }}
        >
          <option value="">Todos os Status</option>
          <option value="Fabricado">Fabricado</option>
          <option value="Parcial">Parcial</option>
          <option value="Pendente">Pendente</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center text-danger hover:bg-danger-bg transition-colors"
            style={{
              gap: '6px',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
            }}
          >
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {/* ── Selection bar ── */}
      {selectedPieces.size > 0 && (
        <div
          className="flex items-center justify-between"
          style={{
            padding: '14px 24px',
            borderRadius: '10px',
            border: '2px solid #16a34a',
            background: 'rgba(22, 163, 74, 0.06)',
            marginTop: '-12px',
          }}
        >
          <div className="flex items-center" style={{ gap: '10px' }}>
            <div
              className="flex items-center justify-center text-white font-bold"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                backgroundColor: '#16a34a',
                fontSize: '12px',
              }}
            >
              {selectedPieces.size}
            </div>
            <span className="font-bold text-text-primary" style={{ fontSize: '13px' }}>
              {selectedPieces.size === 1 ? 'peca selecionada' : 'pecas selecionadas'} para expedicao
            </span>
          </div>
          <button
            onClick={clearSelection}
            className="text-text-muted hover:text-text-primary transition-colors"
            style={{ fontSize: '13px' }}
          >
            Desmarcar todas
          </button>
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
          <div style={{ padding: '32px' }}><EmptyState /></div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full" style={{ minWidth: '950px' }}>
              <thead>
                <tr className="bg-surface-container-low">
                  <th style={{ width: '48px', padding: '14px 16px' }}>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                      onChange={toggleSelectAll}
                      className="rounded"
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--color-primary)',
                        cursor: 'pointer',
                      }}
                    />
                  </th>
                  {[
                    { label: 'Codigo', align: 'left', minW: '140px' },
                    { label: 'Especificacao', align: 'left', minW: '200px' },
                    { label: 'Obra', align: 'left', minW: '140px' },
                    { label: 'Status', align: 'left', minW: '100px' },
                    { label: 'Fabricado', align: 'right', minW: '90px' },
                    { label: 'Solicitado', align: 'right', minW: '90px' },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`font-extrabold text-text-muted uppercase tracking-widest text-${col.align}`}
                      style={{
                        padding: '14px 24px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        minWidth: col.minW,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((peca, idx) => {
                  const isSelected = selectedPieces.has(peca.id);
                  return (
                    <tr
                      key={peca.id}
                      onClick={() => toggleSelect(peca.id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary-bg'
                          : 'hover:bg-table-hover'
                      }`}
                      style={{
                        borderBottom: idx < paginatedData.length - 1
                          ? '1px solid var(--color-border)'
                          : 'none',
                      }}
                    >
                      <td style={{ padding: '16px 16px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(peca.id)}
                          onClick={e => e.stopPropagation()}
                          className="rounded"
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: 'var(--color-primary)',
                            cursor: 'pointer',
                          }}
                        />
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span
                          className="font-bold text-primary tabular-nums"
                          style={{ fontSize: '14px' }}
                        >
                          {peca.id}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <p className="font-medium text-text-primary" style={{ fontSize: '14px' }}>
                          {peca.tipo} Estrutural
                        </p>
                        <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '3px' }}>
                          {peca.especificacao}
                        </p>
                      </td>
                      <td
                        className="text-text-secondary"
                        style={{ padding: '16px 24px', fontSize: '14px', whiteSpace: 'nowrap' }}
                      >
                        {peca.obra}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <StatusBadge status={peca.status} />
                      </td>
                      <td
                        className="font-bold text-text-primary text-right tabular-nums"
                        style={{ padding: '16px 24px', fontSize: '14px' }}
                      >
                        {peca.qtdFabricada}
                      </td>
                      <td
                        className="text-text-secondary text-right tabular-nums font-medium"
                        style={{ padding: '16px 24px', fontSize: '14px' }}
                      >
                        {peca.qtdSolicitada}
                      </td>
                    </tr>
                  );
                })}
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
              <span className="font-bold text-text-primary">{filtered.length}</span> pecas
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
