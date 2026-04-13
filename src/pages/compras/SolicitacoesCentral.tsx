import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, X, ChevronLeft, ChevronRight, Eye, Send, FileText } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { solicitacoesCompra as solicitacoesCompraApi, obras as obrasApi, fornecedores as fornecedoresApi } from '../../lib/api';
import { getCurrentUser } from '../../lib/storage';
import type { SolicitacaoCompra, Obra, Fornecedor } from '../../lib/types';

const ITEMS_PER_PAGE = 10;

export default function SolicitacoesCentral() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCompra[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const user = getCurrentUser();

  useEffect(() => {
    solicitacoesCompraApi.listar().then(setSolicitacoes).catch(() => {});
    obrasApi.listar().then(setObras).catch(() => {});
    fornecedoresApi.listar().then(setFornecedores).catch(() => {});
  }, []);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterObra, setFilterObra] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal nova solicitacao
  const [modalOpen, setModalOpen] = useState(false);
  const [formObraId, setFormObraId] = useState('');
  const [formItem, setFormItem] = useState('');
  const [formQtd, setFormQtd] = useState('');
  const [formUnidade, setFormUnidade] = useState('un');
  const [formPrioridade, setFormPrioridade] = useState<'Baixa' | 'Media' | 'Alta'>('Media');
  const [formObs, setFormObs] = useState('');

  // Modal orcamento
  const [orcModalOpen, setOrcModalOpen] = useState(false);
  const [selectedSolic, setSelectedSolic] = useState<SolicitacaoCompra | null>(null);
  const [orcFornecedor, setOrcFornecedor] = useState('');
  const [orcValor, setOrcValor] = useState('');
  const [orcPagamento, setOrcPagamento] = useState('');
  const [orcImagem, setOrcImagem] = useState('');

  // Modal detalhes
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailSolic, setDetailSolic] = useState<SolicitacaoCompra | null>(null);

  const refresh = () => solicitacoesCompraApi.listar().then(setSolicitacoes).catch(() => {});

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const filtered = useMemo(() => {
    return solicitacoes.filter(s => {
      const matchSearch = !search ||
        s.item.toLowerCase().includes(search.toLowerCase()) ||
        s.obraNome.toLowerCase().includes(search.toLowerCase()) ||
        s.solicitante.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || s.statusFluxo === filterStatus;
      const matchObra = !filterObra || s.obraId === Number(filterObra);
      return matchSearch && matchStatus && matchObra;
    });
  }, [solicitacoes, search, filterStatus, filterObra]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  const totalSolicitacoes = solicitacoes.length;
  const emOrcamento = solicitacoes.filter(s => s.statusFluxo === 'EM_ORCAMENTO').length;
  const aguardandoAut = solicitacoes.filter(s => s.statusFluxo === 'AGUARDANDO_AUTORIZACAO').length;

  const handleNovaSolicitacao = () => {
    if (!formObraId || !formItem.trim() || !formQtd) return;
    const obra = obras.find(o => o.id === Number(formObraId));
    if (!obra) return;

    solicitacoesCompraApi.criar({
      obraId: obra.id,
      obraNome: obra.nome,
      setor: 'Obra',
      item: formItem,
      quantidade: Number(formQtd),
      unidade: formUnidade,
      prioridade: formPrioridade,
      observacoes: formObs,
      solicitante: user?.login || '',
      data: new Date().toISOString().split('T')[0],
      status: 'SOLICITADO',
      fornecedor: '',
      valor: 0,
      pagamento: '',
      imagemOrcamento: '',
      statusFluxo: 'SOLICITADO',
    }).then(() => refresh()).catch(() => {});

    setModalOpen(false);
    setFormObraId(''); setFormItem(''); setFormQtd(''); setFormUnidade('un'); setFormPrioridade('Media'); setFormObs('');
  };

  const openOrcamento = (s: SolicitacaoCompra) => {
    setSelectedSolic(s);
    setOrcFornecedor(s.fornecedor);
    setOrcValor(s.valor ? s.valor.toString() : '');
    setOrcPagamento(s.pagamento);
    setOrcImagem('');
    setOrcModalOpen(true);
  };

  const handleSalvarOrcamento = () => {
    if (!selectedSolic || !orcFornecedor.trim()) return;
    solicitacoesCompraApi.salvarCotacao(selectedSolic.id, {
      fornecedor: orcFornecedor,
      valor: Number(orcValor) || 0,
      pagamento: orcPagamento,
      imagemOrcamento: orcImagem,
    }).then(() => refresh()).catch(() => {});
    setOrcModalOpen(false);
  };

  const handleEnviarAutorizacao = (s: SolicitacaoCompra) => {
    solicitacoesCompraApi.enviarAutorizacao(s.id)
      .then(() => refresh())
      .catch(() => {});
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setOrcImagem(reader.result as string);
    reader.readAsDataURL(file);
  };


  return (
    <div>
      {/* Header */}
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
        Compras
      </p>
      <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>
        Solicitacoes de Compra
      </h1>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>
        Central de solicitacoes, orcamentos e acompanhamento de compras
      </p>

      {/* KPIs */}
      <div className="grid-kpi" style={{ marginTop: '28px' }}>
        <KPICard title="Total" value={totalSolicitacoes} icon="FileText" color="primary" />
        <KPICard title="Em Orcamento" value={emOrcamento} icon="Clock" color="info" />
        <KPICard title="Aguardando Autorizacao" value={aguardandoAut} icon="AlertTriangle" color="warning" />
      </div>

      {/* Toolbar */}
      <div
        className="border border-border rounded-xl"
        style={{ marginTop: '28px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}
      >
        <div className="relative flex-1" style={{ minWidth: '200px' }}>
          <Search size={16} className="absolute text-text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por item, obra ou solicitante..."
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
          <option value="SOLICITADO">Solicitado</option>
          <option value="EM_ORCAMENTO">Em Orcamento</option>
          <option value="AGUARDANDO_AUTORIZACAO">Aguard. Autorizacao</option>
          <option value="AUTORIZADO">Autorizado</option>
          <option value="NO_FINANCEIRO">No Financeiro</option>
          <option value="PAGO">Pago</option>
          <option value="NEGADO">Negado</option>
        </select>
        <select
          value={filterObra}
          onChange={e => { setFilterObra(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-low border border-border text-text-secondary"
          style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}
        >
          <option value="">Todas as Obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}
        >
          <Plus size={16} /> Nova Solicitacao
        </button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden" style={{ marginTop: '20px' }}>
        {filtered.length === 0 ? (
          <EmptyState message="Nenhuma solicitacao encontrada" icon="FileText" />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full" style={{ fontSize: '13px' }}>
                <thead>
                  <tr className="bg-surface-container-low text-text-muted uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    <th className="text-left font-extrabold" style={{ padding: '14px 20px' }}>Item</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Obra</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Qtd</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Prioridade</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Fornecedor</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Valor</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Status</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(s => (
                    <tr key={s.id} className="border-t border-border hover:bg-surface-container-low/50 transition-colors">
                      <td className="font-semibold text-text-primary" style={{ padding: '14px 20px' }}>{s.item}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{s.obraNome}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{s.quantidade} {s.unidade}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={s.prioridade} /></td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{s.fornecedor || '—'}</td>
                      <td className="font-semibold text-text-primary" style={{ padding: '14px 16px' }}>{s.valor ? formatCurrency(s.valor) : '—'}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={s.statusFluxo} /></td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setDetailSolic(s); setDetailModalOpen(true); }}
                            className="text-text-muted hover:text-primary transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          {s.statusFluxo === 'SOLICITADO' && (
                            <button
                              onClick={() => openOrcamento(s)}
                              className="text-text-muted hover:text-info transition-colors"
                              title="Adicionar orcamento"
                            >
                              <FileText size={16} />
                            </button>
                          )}
                          {s.statusFluxo === 'EM_ORCAMENTO' && (
                            <button
                              onClick={() => handleEnviarAutorizacao(s)}
                              className="text-text-muted hover:text-success transition-colors"
                              title="Enviar para autorizacao"
                            >
                              <Send size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="border-t border-border flex items-center justify-between" style={{ padding: '12px 20px' }}>
              <span className="text-text-muted" style={{ fontSize: '12px' }}>
                {startIdx}-{endIdx} de {filtered.length}
              </span>
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

      {/* Modal Nova Solicitacao */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '560px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>Nova Solicitacao de Compra</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Obra</label>
                <select value={formObraId} onChange={e => setFormObraId(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                  <option value="">Selecione a obra</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Material / Item</label>
                <input type="text" value={formItem} onChange={e => setFormItem(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} placeholder="Ex: Cimento CP-V ARI" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Quantidade</label>
                  <input type="number" value={formQtd} onChange={e => setFormQtd(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
                </div>
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Unidade</label>
                  <select value={formUnidade} onChange={e => setFormUnidade(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                    <option value="un">Unidade</option>
                    <option value="kg">Kg</option>
                    <option value="m">Metro</option>
                    <option value="m2">m²</option>
                    <option value="m3">m³</option>
                    <option value="saco">Saco</option>
                    <option value="litro">Litro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Prioridade</label>
                <select value={formPrioridade} onChange={e => setFormPrioridade(e.target.value as 'Baixa' | 'Media' | 'Alta')} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                  <option value="Baixa">Baixa</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Observacoes</label>
                <textarea value={formObs} onChange={e => setFormObs(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px', minHeight: '80px', resize: 'vertical' }} />
              </div>
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: '24px' }}>
              <button onClick={() => setModalOpen(false)} className="text-text-secondary font-bold hover:bg-surface-container-high/60" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Cancelar</button>
              <button onClick={handleNovaSolicitacao} className="bg-primary text-white font-bold hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Criar Solicitacao</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Orcamento */}
      {orcModalOpen && selectedSolic && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '560px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>Adicionar Orcamento</h2>
              <button onClick={() => setOrcModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="bg-surface-container-low rounded-xl" style={{ padding: '16px', marginBottom: '20px' }}>
              <p className="font-bold text-text-primary" style={{ fontSize: '14px' }}>{selectedSolic.item}</p>
              <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>{selectedSolic.obraNome} — {selectedSolic.quantidade} {selectedSolic.unidade}</p>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Fornecedor</label>
                <select value={orcFornecedor} onChange={e => setOrcFornecedor(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                  <option value="">Selecione</option>
                  {fornecedores.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Valor (R$)</label>
                  <input type="number" value={orcValor} onChange={e => setOrcValor(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
                </div>
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Forma de Pagamento</label>
                  <select value={orcPagamento} onChange={e => setOrcPagamento(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                    <option value="">Selecione</option>
                    <option value="Boleto">Boleto</option>
                    <option value="PIX">PIX</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Cartao">Cartao</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Imagem da Cotacao</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
                {orcImagem && <img src={orcImagem} alt="Cotacao" className="rounded-lg border border-border" style={{ marginTop: '8px', maxHeight: '120px', objectFit: 'contain' }} />}
              </div>
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: '24px' }}>
              <button onClick={() => setOrcModalOpen(false)} className="text-text-secondary font-bold" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Cancelar</button>
              <button onClick={handleSalvarOrcamento} className="bg-primary text-white font-bold hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Salvar Orcamento</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {detailModalOpen && detailSolic && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '480px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>Detalhes da Solicitacao</h2>
              <button onClick={() => setDetailModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-3" style={{ fontSize: '14px' }}>
              <div className="flex justify-between"><span className="text-text-muted">Item:</span><span className="font-bold text-text-primary">{detailSolic.item}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Obra:</span><span className="text-text-primary">{detailSolic.obraNome}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Quantidade:</span><span className="text-text-primary">{detailSolic.quantidade} {detailSolic.unidade}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Prioridade:</span><StatusBadge status={detailSolic.prioridade} /></div>
              <div className="flex justify-between"><span className="text-text-muted">Solicitante:</span><span className="text-text-primary">{detailSolic.solicitante}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Data:</span><span className="text-text-primary">{detailSolic.data}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Status:</span><StatusBadge status={detailSolic.statusFluxo} /></div>
              {detailSolic.fornecedor && <div className="flex justify-between"><span className="text-text-muted">Fornecedor:</span><span className="text-text-primary">{detailSolic.fornecedor}</span></div>}
              {detailSolic.valor > 0 && <div className="flex justify-between"><span className="text-text-muted">Valor:</span><span className="font-bold text-text-primary">{formatCurrency(detailSolic.valor)}</span></div>}
              {detailSolic.observacoes && <div><span className="text-text-muted">Observacoes:</span><p className="text-text-primary" style={{ marginTop: '4px' }}>{detailSolic.observacoes}</p></div>}
              {detailSolic.imagemOrcamento && <div><span className="text-text-muted">Cotacao:</span><img src={detailSolic.imagemOrcamento} alt="Cotacao" className="rounded-lg border border-border" style={{ marginTop: '8px', maxHeight: '200px', objectFit: 'contain' }} /></div>}
            </div>
            <div className="flex justify-end" style={{ marginTop: '24px' }}>
              <button onClick={() => setDetailModalOpen(false)} className="bg-primary text-white font-bold" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
