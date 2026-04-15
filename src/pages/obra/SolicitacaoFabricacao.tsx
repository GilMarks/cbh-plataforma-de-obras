import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import Slideout from '../../components/shared/Slideout';
import { solicitacoes as solicitacoesApi, obras as obrasApi } from '../../lib/api';
import { getCurrentUser } from '../../lib/storage';
import type { Solicitacao, Obra } from '../../lib/types';

const ITEMS_PER_PAGE = 10;

export default function SolicitacaoFabricacao() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const user = getCurrentUser();

  useEffect(() => {
    solicitacoesApi.listar().then(setSolicitacoes).catch(() => {});
    obrasApi.listar().then(setObras).catch(() => {});
  }, []);
  const [activeTab, setActiveTab] = useState<'pendentes' | 'concluidas'>('pendentes');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  // Form fields
  const [formObraId, setFormObraId] = useState('');
  const [formPaineis, setFormPaineis] = useState('0');
  const [formPainelComp, setFormPainelComp] = useState('5');
  const [formPainelAlt, setFormPainelAlt] = useState('3');
  const [formTipoPainel, setFormTipoPainel] = useState('Liso');
  const [formRaPainel, _setFormRaPainel] = useState('');
  const [formPilares, setFormPilares] = useState('0');
  const [formPilarAlt, setFormPilarAlt] = useState('3');
  const [formBainhaPilar, _setFormBainhaPilar] = useState('0');
  const [formSapatas, setFormSapatas] = useState('0');
  const [formTamanhoSapata, setFormTamanhoSapata] = useState('Grande');
  const [formTipoSapata, _setFormTipoSapata] = useState('Normal');
  const [formObs, setFormObs] = useState('');

  const refresh = () => solicitacoesApi.listar().then(setSolicitacoes).catch(() => {});

  const isConcluida = (s: Solicitacao) => {
    const pOk = s.paineis === 0 || s.statusPainel === 'Fabricado';
    const pilOk = s.pilares === 0 || s.statusPilar === 'Fabricado';
    const sapOk = s.sapatas === 0 || s.statusSapata === 'Fabricado';
    return pOk && pilOk && sapOk && s.statusAutorizacao === 'Autorizado';
  };

  const pendentes = solicitacoes.filter(s => !isConcluida(s));
  const concluidas = solicitacoes.filter(s => isConcluida(s));
  const list = activeTab === 'pendentes' ? pendentes : concluidas;

  const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
  const paginatedData = list.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalPecas = solicitacoes.reduce((s, sol) => s + sol.paineis + sol.pilares + sol.sapatas, 0);
  const aguardando = solicitacoes.filter(s => s.statusAutorizacao === 'Aguardando').length;

  const handleCriar = () => {
    if (!formObraId) return;
    const obra = obras.find(o => o.id === Number(formObraId));
    if (!obra) return;
    const paineis = Number(formPaineis) || 0;
    const pilares = Number(formPilares) || 0;
    const sapatas = Number(formSapatas) || 0;
    if (paineis + pilares + sapatas === 0) return;

    solicitacoesApi.criar({
      obraId: obra.id, obraNome: obra.nome, clienteNome: obra.cliente,
      paineis, painelComp: Number(formPainelComp), painelAlt: Number(formPainelAlt),
      tipoPainel: formTipoPainel, raPainel: formRaPainel,
      statusPainel: 'Pendente', fabricadoPainel: 0, saldoPainel: paineis, historicoPainel: [],
      pilares, pilarAlt: Number(formPilarAlt), bainhaPilar: Number(formBainhaPilar),
      statusPilar: 'Pendente', fabricadoPilar: 0, saldoPilar: pilares, historicoPilar: [],
      sapatas, tamanhoSapata: formTamanhoSapata, tipoSapata: formTipoSapata,
      statusSapata: 'Pendente', fabricadoSapata: 0, saldoSapata: sapatas, historicoSapata: [],
      data: new Date().toISOString().split('T')[0], observacoes: formObs,
      solicitante: user?.login || '', cargoSolicitante: user?.cargo || '',
      dataSolicitacaoRegistro: new Date().toISOString().split('T')[0],
      statusAutorizacao: 'Aguardando', autorizadoPor: '', dataAutorizacao: '',
    }).then(() => refresh()).catch(() => {});

    setModalOpen(false);
    setFormObraId(''); setFormPaineis('0'); setFormPilares('0'); setFormSapatas('0'); setFormObs('');
  };

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>Obra</p>
      <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Solicitacao de Fabricacao</h1>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Solicite fabricacao de pecas para suas obras</p>

      <div className="grid-kpi" style={{ marginTop: '28px' }}>
        <KPICard title="Total Solicitacoes" value={solicitacoes.length} icon="FileText" color="primary" />
        <KPICard title="Total Pecas" value={totalPecas} icon="Package" color="info" />
        <KPICard title="Aguardando Autorizacao" value={aguardando} icon="Clock" color="warning" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginTop: '28px' }}>
        <div className="flex gap-2">
          <button onClick={() => { setActiveTab('pendentes'); setCurrentPage(1); }} className={`font-bold ${activeTab === 'pendentes' ? 'bg-primary text-white' : 'bg-surface-container-low text-text-secondary border border-border'}`} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}>
            Pendentes ({pendentes.length})
          </button>
          <button onClick={() => { setActiveTab('concluidas'); setCurrentPage(1); }} className={`font-bold ${activeTab === 'concluidas' ? 'bg-primary text-white' : 'bg-surface-container-low text-text-secondary border border-border'}`} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}>
            Concluidas ({concluidas.length})
          </button>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>
          <Plus size={16} /> Nova Solicitacao
        </button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden" style={{ marginTop: '20px' }}>
        {list.length === 0 ? (
          <EmptyState message={activeTab === 'pendentes' ? 'Nenhuma solicitacao pendente' : 'Nenhuma solicitacao concluida'} icon="FileText" />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full" style={{ fontSize: '13px' }}>
                <thead>
                  <tr className="bg-surface-container-low text-text-muted uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    <th className="text-left font-extrabold" style={{ padding: '14px 20px' }}>Obra</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Paineis</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Pilares</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Sapatas</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Solicitante</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Data</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Autorizacao</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(s => (
                    <tr key={s.id} className="border-t border-border hover:bg-surface-container-low/50">
                      <td className="font-semibold text-text-primary" style={{ padding: '14px 20px' }}>{s.obraNome}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {s.paineis > 0 ? (
                          <div><span className="font-bold">{s.fabricadoPainel}/{s.paineis}</span> <StatusBadge status={s.statusPainel} className="ml-1" /></div>
                        ) : <span className="text-text-muted">—</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {s.pilares > 0 ? (
                          <div><span className="font-bold">{s.fabricadoPilar}/{s.pilares}</span> <StatusBadge status={s.statusPilar} className="ml-1" /></div>
                        ) : <span className="text-text-muted">—</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {s.sapatas > 0 ? (
                          <div><span className="font-bold">{s.fabricadoSapata}/{s.sapatas}</span> <StatusBadge status={s.statusSapata} className="ml-1" /></div>
                        ) : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{s.solicitante}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{s.dataSolicitacaoRegistro}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={s.statusAutorizacao} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border flex items-center justify-between" style={{ padding: '12px 20px' }}>
              <span className="text-text-muted" style={{ fontSize: '12px' }}>{((currentPage-1)*ITEMS_PER_PAGE)+1}-{Math.min(currentPage*ITEMS_PER_PAGE, list.length)} de {list.length}</span>
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

      <Slideout
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Solicitação de Fabricação"
        subtitle="Preencha os dados da solicitação para a obra"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="text-text-secondary font-medium hover:text-text-primary transition-colors" style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleCriar} className="bg-primary text-white font-semibold hover:opacity-90 transition-opacity" style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', border: 'none', cursor: 'pointer' }}>
              Criar solicitação
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Obra */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Obra</label>
            <select value={formObraId} onChange={e => setFormObraId(e.target.value)} className="w-full bg-surface-container-lowest border border-border-light" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px', color: 'var(--color-text-primary)' }}>
              <option value="">Selecione a obra</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome} — {o.cliente}</option>)}
            </select>
          </div>

          {/* Paineis */}
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>Painéis</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Quantidade', type: 'number', value: formPaineis, onChange: (v: string) => setFormPaineis(v) },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>{f.label}</label>
                  <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '14px' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Tipo</label>
                <select value={formTipoPainel} onChange={e => setFormTipoPainel(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="Liso">Liso</option>
                  <option value="Carimbado">Carimbado</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Comprimento (m)</label>
                <input type="number" step="0.1" value={formPainelComp} onChange={e => setFormPainelComp(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Altura (m)</label>
                <input type="number" step="0.1" value={formPainelAlt} onChange={e => setFormPainelAlt(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '14px' }} />
              </div>
            </div>
          </div>

          {/* Pilares */}
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>Pilares</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Quantidade</label>
                <input type="number" value={formPilares} onChange={e => setFormPilares(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Altura (m)</label>
                <input type="number" step="0.1" value={formPilarAlt} onChange={e => setFormPilarAlt(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '14px' }} />
              </div>
            </div>
          </div>

          {/* Sapatas */}
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>Sapatas</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Quantidade</label>
                <input type="number" value={formSapatas} onChange={e => setFormSapatas(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Tamanho</label>
                <select value={formTamanhoSapata} onChange={e => setFormTamanhoSapata(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="Grande">Grande (90×80×80)</option>
                  <option value="Pequena">Pequena (70×50×50)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Observações</label>
            <textarea value={formObs} onChange={e => setFormObs(e.target.value)} className="w-full border border-border-light bg-white" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '14px', minHeight: '80px', resize: 'vertical' }} />
          </div>
        </div>
      </Slideout>
    </div>
  );
}
