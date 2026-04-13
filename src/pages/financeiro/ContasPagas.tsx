import { useState, useEffect } from 'react';
import { Search, FileDown, Eye, X } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { lancamentos as lancamentosApi } from '../../lib/api';
import type { LancamentoFinanceiro } from '../../lib/types';

export default function ContasPagas() {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);

  useEffect(() => {
    lancamentosApi.listar({ status: 'Pago' }).then(setLancamentos).catch(() => {});
  }, []);
  const [search, setSearch] = useState('');
  const [filtroObra, setFiltroObra] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState<LancamentoFinanceiro | null>(null);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const centros = [...new Set(lancamentos.map(l => l.centro))];

  const filtered = lancamentos.filter(l => {
    const matchSearch = l.descricao.toLowerCase().includes(search.toLowerCase()) ||
      l.fornecedor.toLowerCase().includes(search.toLowerCase());
    const matchObra = !filtroObra || l.centro === filtroObra;
    return matchSearch && matchObra;
  });

  const totalPago = filtered.reduce((s, l) => s + l.valor, 0);

  const openComprovante = (l: LancamentoFinanceiro) => {
    setSelectedLancamento(l);
    setModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap" style={{ gap: '16px' }}>
        <div>
          <h1 className="font-extrabold text-text-primary tracking-tight" style={{ fontSize: '28px', lineHeight: 1.2 }}>
            Historico de Contas Pagas
          </h1>
          <p className="text-text-secondary font-medium" style={{ fontSize: '14px', marginTop: '6px' }}>
            Consulte o historico de pagamentos realizados e comprovantes.
          </p>
        </div>
        <div className="flex" style={{ gap: '10px' }}>
          <button
            className="flex items-center text-text-secondary hover:bg-surface-container-high/50 transition-colors"
            style={{ gap: '8px', padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px' }}
          >
            <FileDown size={16} /> Exportar Excel
          </button>
          <button
            className="flex items-center bg-primary text-white font-bold hover:bg-primary-dark transition-all"
            style={{ gap: '8px', padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}
          >
            <FileDown size={16} /> Gerar Relatorio
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div
        className="bg-surface-container-lowest flex items-center flex-wrap"
        style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '24px 28px', gap: '12px' }}
      >
        <div className="relative" style={{ flex: 1, minWidth: '250px' }}>
          <Search size={18} className="absolute text-text-muted pointer-events-none" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por descricao ou fornecedor..."
            className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            style={{ padding: '12px 20px 12px 48px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
          />
        </div>
        <select
          value={filtroObra}
          onChange={e => setFiltroObra(e.target.value)}
          className="bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)', minWidth: '200px' }}
        >
          <option value="">Todos os Centros</option>
          {centros.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          className="bg-primary text-white font-bold hover:bg-primary-dark transition-colors"
          style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}
        >
          Aplicar Filtros
        </button>
      </div>

      {/* ── Summary ── */}
      <div
        className="bg-success-bg flex items-center justify-between"
        style={{ borderRadius: '10px', padding: '20px 28px', border: '1px solid rgba(22, 163, 74, 0.15)' }}
      >
        <span className="text-success-text font-bold" style={{ fontSize: '14px' }}>Total Pago no periodo:</span>
        <span className="font-extrabold text-success-text tabular-nums" style={{ fontSize: '20px' }}>{formatCurrency(totalPago)}</span>
      </div>

      {/* ── Table ── */}
      <div
        className="bg-surface-container-lowest overflow-hidden"
        style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '32px' }}><EmptyState message="Nenhuma conta paga encontrada" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '900px' }}>
              <thead>
                <tr className="bg-surface-container-low">
                  {[
                    { label: 'CP / Processo', align: 'left' },
                    { label: 'Descricao', align: 'left' },
                    { label: 'Fornecedor', align: 'left' },
                    { label: 'Centro', align: 'left' },
                    { label: 'Data Pgto', align: 'left' },
                    { label: 'Status', align: 'left' },
                    { label: 'Valor', align: 'right' },
                    { label: 'Acoes', align: 'center' },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`font-extrabold text-text-muted uppercase tracking-widest text-${col.align}`}
                      style={{ padding: '16px 32px', fontSize: '11px' }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, idx) => (
                  <tr
                    key={l.id}
                    className="hover:bg-table-hover transition-colors"
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                  >
                    <td className="font-bold text-primary tabular-nums" style={{ padding: '18px 32px', fontSize: '14px' }}>
                      CP-{String(l.procId).padStart(5, '0')}
                    </td>
                    <td className="text-text-primary" style={{ padding: '18px 32px', fontSize: '14px' }}>{l.descricao}</td>
                    <td className="text-text-secondary" style={{ padding: '18px 32px', fontSize: '14px' }}>{l.fornecedor}</td>
                    <td className="text-text-secondary" style={{ padding: '18px 32px', fontSize: '14px' }}>{l.centro}</td>
                    <td className="text-text-secondary" style={{ padding: '18px 32px', fontSize: '14px' }}>
                      {new Date(l.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '18px 32px' }}><StatusBadge status="Pago" /></td>
                    <td className="font-bold text-success text-right tabular-nums" style={{ padding: '18px 32px', fontSize: '14px' }}>
                      {formatCurrency(l.valor)}
                    </td>
                    <td className="text-center" style={{ padding: '18px 32px' }}>
                      <button
                        onClick={() => openComprovante(l)}
                        className="flex items-center justify-center hover:bg-surface-container transition-colors"
                        style={{ width: '36px', height: '36px', borderRadius: '8px', margin: '0 auto' }}
                        title="Ver Comprovante"
                      >
                        <Eye size={16} className="text-primary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div
          className="flex items-center justify-between text-text-muted"
          style={{ padding: '16px 32px', borderTop: '1px solid var(--color-border)', fontSize: '13px' }}
        >
          <span>Mostrando {filtered.length} registros</span>
          <div className="flex items-center" style={{ gap: '4px' }}>
            <button
              className="flex items-center justify-center bg-primary text-white font-bold"
              style={{ width: '32px', height: '32px', borderRadius: '8px', fontSize: '12px' }}
            >
              1
            </button>
          </div>
        </div>
      </div>

      {/* ── Comprovante Modal ── */}
      {modalOpen && selectedLancamento && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 'var(--z-modal)', padding: '16px' }}>
          <div
            className="bg-surface-container-lowest w-full"
            style={{ maxWidth: '480px', borderRadius: '16px', border: '1px solid var(--color-border)' }}
          >
            <div style={{ padding: '32px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <div className="flex items-center" style={{ gap: '10px' }}>
                  <span
                    className="inline-flex items-center font-bold bg-success-bg text-success-text uppercase"
                    style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px' }}
                  >
                    Pago
                  </span>
                  <span className="text-text-muted" style={{ fontSize: '12px' }}>
                    CP-{String(selectedLancamento.procId).padStart(5, '0')}
                  </span>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex items-center justify-center hover:bg-surface-container transition-colors"
                  style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                >
                  <X size={20} className="text-text-muted" />
                </button>
              </div>

              <h3 className="font-extrabold text-text-primary tracking-tight" style={{ fontSize: '20px', marginBottom: '24px' }}>
                Comprovante de Pagamento
              </h3>

              <div className="flex items-center" style={{ gap: '32px', marginBottom: '28px' }}>
                {[
                  { label: 'Fornecedor', value: selectedLancamento.fornecedor },
                  { label: 'Valor', value: formatCurrency(selectedLancamento.valor), primary: true },
                  { label: 'Data', value: new Date(selectedLancamento.data).toLocaleDateString('pt-BR') },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-text-muted uppercase font-bold tracking-wider" style={{ fontSize: '10px' }}>{item.label}</p>
                    <p className={`font-medium ${item.primary ? 'font-bold text-primary' : 'text-text-primary'}`} style={{ fontSize: '14px', marginTop: '4px' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-surface-container-low text-center" style={{ borderRadius: '10px', padding: '40px 24px' }}>
                <div
                  className="bg-success-bg flex items-center justify-center mx-auto"
                  style={{ width: '44px', height: '44px', borderRadius: '50%', marginBottom: '14px' }}
                >
                  <Eye size={20} className="text-success" />
                </div>
                <p className="text-text-muted" style={{ fontSize: '14px' }}>Comprovante nao disponivel</p>
                <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '6px' }}>Nenhum arquivo anexado</p>
              </div>
            </div>

            <div
              className="flex items-center justify-end"
              style={{ padding: '20px 32px', borderTop: '1px solid var(--color-border)', gap: '12px' }}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
                style={{ padding: '12px 20px', fontSize: '13px' }}
              >
                Fechar
              </button>
              <button
                className="flex items-center bg-primary text-white font-bold hover:bg-primary-dark transition-all"
                style={{ gap: '8px', padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}
              >
                <FileDown size={14} /> Baixar Arquivo Original
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
