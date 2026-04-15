import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Eye, Send, FileText } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import Slideout from '../../components/shared/Slideout';
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

      {/* Slideout Nova Solicitação */}
      <Slideout
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Solicitação de Compra"
        subtitle="Preencha os dados para abrir a solicitação"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Cancelar
            </button>
            <button onClick={handleNovaSolicitacao} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              className="hover:opacity-90 transition-opacity">
              Criar solicitação
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {[
            { label: 'Obra', node: (
              <select value={formObraId} onChange={e => setFormObraId(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">Selecione a obra</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            )},
            { label: 'Material / Item', node: (
              <input type="text" value={formItem} onChange={e => setFormItem(e.target.value)} placeholder="Ex: Cimento CP-V ARI" className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }} />
            )},
          ].map(({ label, node }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{label}</label>
              {node}
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Quantidade</label>
              <input type="number" value={formQtd} onChange={e => setFormQtd(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Unidade</label>
              <select value={formUnidade} onChange={e => setFormUnidade(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>
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
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Prioridade</label>
            <select value={formPrioridade} onChange={e => setFormPrioridade(e.target.value as 'Baixa' | 'Media' | 'Alta')} className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>
              <option value="Baixa">Baixa</option>
              <option value="Media">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Observações</label>
            <textarea value={formObs} onChange={e => setFormObs(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px', minHeight: '80px', resize: 'vertical' }} />
          </div>
        </div>
      </Slideout>

      {/* Slideout Orçamento */}
      <Slideout
        open={orcModalOpen && !!selectedSolic}
        onClose={() => setOrcModalOpen(false)}
        title="Adicionar Orçamento"
        subtitle={selectedSolic ? `${selectedSolic.item} — ${selectedSolic.obraNome}` : ''}
        footer={
          <>
            <button onClick={() => setOrcModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Cancelar
            </button>
            <button onClick={handleSalvarOrcamento} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              className="hover:opacity-90 transition-opacity">
              Salvar orçamento
            </button>
          </>
        }
      >
        {selectedSolic && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '14px 16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedSolic.item}</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px' }}>{selectedSolic.obraNome} · {selectedSolic.quantidade} {selectedSolic.unidade}</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Fornecedor</label>
              <select value={orcFornecedor} onChange={e => setOrcFornecedor(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">Selecione</option>
                {fornecedores.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Valor (R$)</label>
                <input type="number" value={orcValor} onChange={e => setOrcValor(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Forma de Pagamento</label>
                <select value={orcPagamento} onChange={e => setOrcPagamento(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="">Selecione</option>
                  <option value="Boleto">Boleto</option>
                  <option value="PIX">PIX</option>
                  <option value="Transferencia">Transferência</option>
                  <option value="Cartao">Cartão</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Imagem da Cotação</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }} />
              {orcImagem && <img src={orcImagem} alt="Cotação" className="rounded-lg border border-border" style={{ marginTop: '8px', maxHeight: '120px', objectFit: 'contain' }} />}
            </div>
          </div>
        )}
      </Slideout>

      {/* Slideout Detalhes */}
      <Slideout
        open={detailModalOpen && !!detailSolic}
        onClose={() => setDetailModalOpen(false)}
        title="Detalhes da Solicitação"
        width={440}
        footer={
          <button onClick={() => setDetailModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Fechar
          </button>
        }
      >
        {detailSolic && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: 'Item', value: detailSolic.item, bold: true },
              { label: 'Obra', value: detailSolic.obraNome },
              { label: 'Quantidade', value: `${detailSolic.quantidade} ${detailSolic.unidade}` },
              { label: 'Solicitante', value: detailSolic.solicitante },
              { label: 'Data', value: detailSolic.data },
              ...(detailSolic.fornecedor ? [{ label: 'Fornecedor', value: detailSolic.fornecedor }] : []),
              ...(detailSolic.valor > 0 ? [{ label: 'Valor', value: formatCurrency(detailSolic.valor), bold: true }] : []),
            ].map(({ label, value, bold }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{label}</span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: bold ? 600 : 400 }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Prioridade</span>
              <StatusBadge status={detailSolic.prioridade} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Status</span>
              <StatusBadge status={detailSolic.statusFluxo} />
            </div>
            {detailSolic.observacoes && (
              <div style={{ padding: '12px 0' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Observações</p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{detailSolic.observacoes}</p>
              </div>
            )}
            {detailSolic.imagemOrcamento && (
              <div style={{ padding: '12px 0' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Cotação</p>
                <img src={detailSolic.imagemOrcamento} alt="Cotação" className="rounded-lg border border-border" style={{ maxHeight: '200px', objectFit: 'contain' }} />
              </div>
            )}
          </div>
        )}
      </Slideout>
    </div>
  );
}
