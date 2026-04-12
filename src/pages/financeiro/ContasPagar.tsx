import { useState, useMemo } from 'react';
import { Search, DollarSign, Clock, AlertTriangle, X, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import EmptyState from '../../components/shared/EmptyState';
import { getAll, update } from '../../lib/storage';
import { STORAGE_KEYS, type LancamentoFinanceiro, type Banco } from '../../lib/types';

const ITEMS_PER_PAGE = 10;

function getVencimentoStatus(vencimento: string, status: string): { label: string; classes: string } {
  if (status === 'Pago') return { label: 'Pago', classes: 'bg-success-bg text-success-text' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento + 'T00:00:00');
  const diffDays = Math.ceil((venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Atrasado', classes: 'bg-danger-bg text-danger-text' };
  if (diffDays === 0) return { label: 'Vence Hoje', classes: 'bg-warning-bg text-warning-text' };
  if (diffDays <= 7) return { label: `${diffDays}d`, classes: 'bg-warning-bg text-warning-text' };
  return { label: 'A Vencer', classes: 'bg-surface-container text-text-secondary' };
}

export default function ContasPagar() {
  const [lancamentos, setLancamentos] = useState(() =>
    getAll<LancamentoFinanceiro>(STORAGE_KEYS.LANCAMENTOS).filter(l => l.status !== 'Pago' && l.tipo === 'Despesa')
  );
  const bancos = useMemo(() => getAll<Banco>(STORAGE_KEYS.BANCOS), []);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Payment modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState<LancamentoFinanceiro | null>(null);
  const [contaOrigem, setContaOrigem] = useState('');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [valorPago, setValorPago] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const filtered = useMemo(() => {
    return lancamentos.filter(l => {
      const matchSearch = !search ||
        l.descricao.toLowerCase().includes(search.toLowerCase()) ||
        l.fornecedor.toLowerCase().includes(search.toLowerCase()) ||
        `CP-${String(l.procId).padStart(5, '0')}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || l.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [lancamentos, search, filterStatus]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  const totalPendente = lancamentos.filter(l => l.status === 'Pendente').reduce((s, l) => s + l.valor, 0);
  const totalVencido = lancamentos.filter(l => l.status === 'Vencido').reduce((s, l) => s + l.valor, 0);

  const openPayModal = (lancamento: LancamentoFinanceiro) => {
    setSelectedLancamento(lancamento);
    setValorPago(lancamento.valor.toString());
    setContaOrigem('');
    setDataPagamento(new Date().toISOString().split('T')[0]);
    setModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedLancamento || !contaOrigem) return;

    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      update<LancamentoFinanceiro>(STORAGE_KEYS.LANCAMENTOS, selectedLancamento.id, { status: 'Pago' });
      setSuccessId(selectedLancamento.id);
      setIsProcessing(false);
      setModalOpen(false);
      setSelectedLancamento(null);

      // Show success flash on the row, then remove from list
      setTimeout(() => {
        setLancamentos(prev => prev.filter(l => l.id !== successId));
        setLancamentos(getAll<LancamentoFinanceiro>(STORAGE_KEYS.LANCAMENTOS).filter(l => l.status !== 'Pago' && l.tipo === 'Despesa'));
        setSuccessId(null);
      }, 1500);
    }, 1200);
  };

  const hasActiveFilters = search || filterStatus;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Page Header ── */}
      <div>
        <p
          className="text-text-muted uppercase tracking-widest font-extrabold"
          style={{ fontSize: '11px' }}
        >
          Tesouraria
        </p>
        <h1
          className="font-extrabold text-text-primary tracking-tight"
          style={{ fontSize: '28px', lineHeight: 1.2, marginTop: '6px' }}
        >
          Contas a Pagar
        </h1>
        <p
          className="text-text-secondary font-medium"
          style={{ fontSize: '14px', marginTop: '6px' }}
        >
          Gerencie todas as obrigacoes financeiras e efetive pagamentos pendentes.
        </p>
      </div>

      {/* ── KPIs — compact ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <KPICard title="Total Pendente" value={formatCurrency(totalPendente)} icon={<Clock size={24} />} color="text-warning" />
        <KPICard title="Total Vencido" value={formatCurrency(totalVencido)} icon={<AlertTriangle size={24} />} color="text-danger" />
        <KPICard title="Total Geral" value={formatCurrency(totalPendente + totalVencido)} icon={<DollarSign size={24} />} color="text-primary" />
      </div>

      {/* ── Filters / Toolbar ── */}
      <div
        className="bg-surface-container-lowest flex items-center flex-wrap"
        style={{
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '20px 24px',
          gap: '12px',
        }}
      >
        <div className="relative" style={{ flex: 1, minWidth: '260px' }}>
          <Search
            size={18}
            className="absolute text-text-muted pointer-events-none"
            style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar por fornecedor, descricao ou CP..."
            className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            style={{ padding: '12px 20px 12px 48px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)', minWidth: '160px' }}
        >
          <option value="">Todos Status</option>
          <option value="Pendente">Pendente</option>
          <option value="Vencido">Vencido</option>
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setCurrentPage(1); }}
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

      {/* ── Table ── */}
      <div
        className="bg-surface-container-lowest overflow-hidden"
        style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '32px' }}>
            <EmptyState message="Nenhuma conta a pagar encontrada" />
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full" style={{ minWidth: '1050px' }}>
              <thead>
                <tr className="bg-surface-container-low">
                  {[
                    { label: 'CP / Processo', align: 'left', minW: '130px' },
                    { label: 'Descricao', align: 'left', minW: '180px' },
                    { label: 'Fornecedor', align: 'left', minW: '160px' },
                    { label: 'Centro', align: 'left', minW: '140px' },
                    { label: 'Vencimento', align: 'right', minW: '120px' },
                    { label: 'Situacao', align: 'center', minW: '100px' },
                    { label: 'Valor (R$)', align: 'right', minW: '120px' },
                    { label: 'Acao', align: 'center', minW: '90px' },
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
                {paginatedData.map((l, idx) => {
                  const vencStatus = getVencimentoStatus(l.vencimento, l.status);
                  const isSuccess = successId === l.id;

                  return (
                    <tr
                      key={l.id}
                      className={`transition-colors ${isSuccess ? '' : 'hover:bg-table-hover'}`}
                      style={{
                        borderBottom: idx < paginatedData.length - 1 ? '1px solid var(--color-border)' : 'none',
                        backgroundColor: isSuccess ? 'rgba(22, 163, 74, 0.08)' : undefined,
                      }}
                    >
                      {/* CP */}
                      <td
                        className="font-bold text-primary tabular-nums tracking-tight"
                        style={{ padding: '16px 24px', fontSize: '14px', whiteSpace: 'nowrap' }}
                      >
                        CP-{String(l.procId).padStart(5, '0')}
                      </td>

                      {/* Descricao */}
                      <td style={{ padding: '16px 24px' }}>
                        <p className="font-medium text-text-primary" style={{ fontSize: '14px' }}>{l.descricao}</p>
                        <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>{l.formaPagamento}</p>
                      </td>

                      {/* Fornecedor */}
                      <td className="text-text-primary font-medium" style={{ padding: '16px 24px', fontSize: '14px' }}>
                        {l.fornecedor}
                      </td>

                      {/* Centro */}
                      <td className="text-text-secondary" style={{ padding: '16px 24px', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        {l.centro}
                      </td>

                      {/* Vencimento — right-aligned */}
                      <td
                        className="text-right tabular-nums tracking-tight"
                        style={{ padding: '16px 24px', fontSize: '14px', whiteSpace: 'nowrap' }}
                      >
                        <span className={`font-medium ${l.status === 'Vencido' ? 'text-danger' : 'text-text-secondary'}`}>
                          {new Date(l.vencimento).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      {/* Situacao badge */}
                      <td className="text-center" style={{ padding: '16px 24px' }}>
                        {isSuccess ? (
                          <span
                            className="inline-flex items-center font-bold bg-success-bg text-success-text uppercase"
                            style={{ gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '10px' }}
                          >
                            <Check size={12} /> Pago
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center font-bold uppercase ${vencStatus.classes}`}
                            style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px' }}
                          >
                            {vencStatus.label}
                          </span>
                        )}
                      </td>

                      {/* Valor — right-aligned */}
                      <td
                        className="font-bold text-right tabular-nums tracking-tight"
                        style={{
                          padding: '16px 24px',
                          fontSize: '14px',
                          color: l.status === 'Vencido' ? 'var(--color-danger)' : 'var(--color-text-primary)',
                        }}
                      >
                        {formatCurrency(l.valor)}
                      </td>

                      {/* Acao */}
                      <td className="text-center" style={{ padding: '16px 24px' }}>
                        {isSuccess ? (
                          <Check size={18} className="text-success" style={{ margin: '0 auto' }} />
                        ) : (
                          <button
                            onClick={() => openPayModal(l)}
                            className="font-bold text-white transition-all hover:opacity-90"
                            style={{
                              padding: '8px 20px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              backgroundColor: '#16a34a',
                            }}
                          >
                            Pagar
                          </button>
                        )}
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
              <span className="font-bold text-text-primary">{filtered.length}</span> registros
            </span>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center text-text-secondary hover:bg-surface-container-high/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px' }}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <div className="flex items-center" style={{ gap: '4px' }}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) page = i + 1;
                  else if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex items-center justify-center font-bold tabular-nums transition-colors ${
                        currentPage === page ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-container-high/50'
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
                style={{ gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px' }}
              >
                Proximo <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Payment Modal ── */}
      {modalOpen && selectedLancamento && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 'var(--z-modal)', padding: '16px' }}
        >
          <div
            className="bg-surface-container-lowest w-full"
            style={{ maxWidth: '560px', borderRadius: '16px', border: '1px solid var(--color-border)' }}
          >
            {/* Modal Header */}
            <div style={{ padding: '32px 32px 0 32px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                <h3 className="font-extrabold text-text-primary tracking-tight" style={{ fontSize: '20px' }}>
                  Efetivar Pagamento
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex items-center justify-center hover:bg-surface-container transition-colors"
                  style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                >
                  <X size={20} className="text-text-muted" />
                </button>
              </div>
              <p className="text-text-secondary" style={{ fontSize: '14px', marginBottom: '24px' }}>
                Confirme os detalhes da transacao financeira
              </p>

              {/* Bill summary card */}
              <div
                className="bg-surface-container-low"
                style={{ borderRadius: '10px', padding: '20px 24px', marginBottom: '28px' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <p className="text-text-muted uppercase tracking-widest font-bold" style={{ fontSize: '10px' }}>Fornecedor</p>
                    <p className="font-bold text-text-primary" style={{ fontSize: '13px', marginTop: '4px' }}>
                      {selectedLancamento.fornecedor}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted uppercase tracking-widest font-bold" style={{ fontSize: '10px' }}>Vencimento</p>
                    <p className="font-medium text-text-primary tabular-nums tracking-tight" style={{ fontSize: '13px', marginTop: '4px' }}>
                      {new Date(selectedLancamento.vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-muted uppercase tracking-widest font-bold" style={{ fontSize: '10px' }}>Valor Original</p>
                    <p className="font-extrabold text-primary tabular-nums tracking-tight" style={{ fontSize: '18px', marginTop: '4px' }}>
                      {formatCurrency(selectedLancamento.valor)}
                    </p>
                  </div>
                </div>
                <div
                  className="bg-surface-container-high"
                  style={{ height: '1px', margin: '16px 0', opacity: 0.5 }}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted" style={{ fontSize: '12px' }}>{selectedLancamento.descricao}</p>
                  </div>
                  <span
                    className="font-bold text-primary tabular-nums tracking-tight"
                    style={{ fontSize: '11px' }}
                  >
                    CP-{String(selectedLancamento.procId).padStart(5, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Form fields */}
            <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
                  Conta Bancaria de Origem *
                </label>
                <select
                  value={contaOrigem}
                  onChange={e => setContaOrigem(e.target.value)}
                  className="w-full bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                >
                  <option value="">Selecione uma conta...</option>
                  {bancos.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nome} — Ag {b.agencia} CC {b.conta}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
                    Data Pagamento
                  </label>
                  <input
                    type="date"
                    value={dataPagamento}
                    onChange={e => setDataPagamento(e.target.value)}
                    className="w-full bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15 tabular-nums"
                    style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
                    Valor Pago (R$)
                  </label>
                  <input
                    type="number"
                    value={valorPago}
                    onChange={e => setValorPago(e.target.value)}
                    className="w-full bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15 tabular-nums tracking-tight"
                    style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                  />
                  {valorPago && Number(valorPago) !== selectedLancamento.valor && (
                    <p
                      className="text-text-muted"
                      style={{ fontSize: '11px', marginTop: '6px' }}
                    >
                      {Number(valorPago) > selectedLancamento.valor
                        ? `Juros/multa: +${formatCurrency(Number(valorPago) - selectedLancamento.valor)}`
                        : `Desconto: -${formatCurrency(selectedLancamento.valor - Number(valorPago))}`
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              className="flex items-center justify-end"
              style={{ padding: '28px 32px', gap: '12px', marginTop: '8px' }}
            >
              <button
                onClick={() => setModalOpen(false)}
                disabled={isProcessing}
                className="text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                style={{ padding: '12px 20px', fontSize: '13px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing || !contaOrigem}
                className="flex items-center font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  backgroundColor: isProcessing ? '#737686' : '#16a34a',
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processando...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Confirmar Pagamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
