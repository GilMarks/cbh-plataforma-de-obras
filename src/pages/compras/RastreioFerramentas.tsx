import { useState } from 'react';
import { Plus, X, Wrench, ArrowLeftRight } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import KPICard from '../../components/shared/KPICard';
import { getAll, create, update } from '../../lib/storage';
import { getCurrentUser } from '../../lib/storage';
import { STORAGE_KEYS, type Ferramenta } from '../../lib/types';

export default function RastreioFerramentas() {
  const [ferramentas, setFerramentas] = useState(() => getAll<Ferramenta>(STORAGE_KEYS.FERRAMENTAS));
  const user = getCurrentUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formCodigo, setFormCodigo] = useState('');

  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [selectedFerr, setSelectedFerr] = useState<Ferramenta | null>(null);
  const [empResponsavel, setEmpResponsavel] = useState('');

  const refresh = () => setFerramentas(getAll<Ferramenta>(STORAGE_KEYS.FERRAMENTAS));

  const today = new Date().toISOString().split('T')[0];
  const disponiveis = ferramentas.filter(f => f.status === 'Disponivel').length;
  const emprestadas = ferramentas.filter(f => f.status === 'Emprestada').length;

  const handleCriar = () => {
    if (!formNome.trim()) return;
    create<Ferramenta>(STORAGE_KEYS.FERRAMENTAS, {
      nome: formNome, codigo: formCodigo, status: 'Disponivel',
      responsavelAtual: '', dataEmprestimo: '', dataDevolvida: '',
      historicoUso: [],
    } as Omit<Ferramenta, 'id'>);
    refresh(); setModalOpen(false); setFormNome(''); setFormCodigo('');
  };

  const openEmprestimo = (f: Ferramenta) => {
    setSelectedFerr(f); setEmpResponsavel(''); setEmpModalOpen(true);
  };

  const handleEmprestar = () => {
    if (!selectedFerr || !empResponsavel.trim()) return;
    update<Ferramenta>(STORAGE_KEYS.FERRAMENTAS, selectedFerr.id, {
      status: 'Emprestada',
      responsavelAtual: empResponsavel,
      dataEmprestimo: today,
      dataDevolvida: '',
    });
    refresh(); setEmpModalOpen(false);
  };

  const handleDevolver = (f: Ferramenta) => {
    const hist = [...f.historicoUso, { responsavel: f.responsavelAtual, dataRetirada: f.dataEmprestimo, dataDevolucao: today }];
    update<Ferramenta>(STORAGE_KEYS.FERRAMENTAS, f.id, {
      status: 'Disponivel',
      responsavelAtual: '',
      dataDevolvida: today,
      historicoUso: hist,
    });
    refresh();
  };

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>Compras</p>
      <div className="flex items-center gap-3">
        <Wrench size={28} className="text-primary" />
        <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Rastreio de Ferramentas</h1>
      </div>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Controle de emprestimo e devolucao de ferramentas</p>

      <div className="grid-kpi" style={{ marginTop: '28px' }}>
        <KPICard title="Total" value={ferramentas.length} icon="Wrench" color="primary" />
        <KPICard title="Disponiveis" value={disponiveis} icon="CheckCircle" color="success" />
        <KPICard title="Emprestadas" value={emprestadas} icon="ArrowLeftRight" color="warning" />
      </div>

      <div className="flex justify-end" style={{ marginTop: '28px' }}>
        <button onClick={() => setModalOpen(true)} className="bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>
          <Plus size={16} /> Nova Ferramenta
        </button>
      </div>

      <div className="grid-cards" style={{ marginTop: '20px' }}>
        {ferramentas.length === 0 ? <EmptyState message="Nenhuma ferramenta cadastrada" icon="Wrench" /> : ferramentas.map(f => (
          <div key={f.id} className="border border-border rounded-xl" style={{ padding: '24px' }}>
            <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
              <div>
                <h3 className="font-extrabold text-text-primary" style={{ fontSize: '16px' }}>{f.nome}</h3>
                <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>Codigo: {f.codigo}</p>
              </div>
              <StatusBadge status={f.status} />
            </div>
            {f.status === 'Emprestada' && (
              <div className="bg-warning-bg rounded-lg" style={{ padding: '10px 14px', marginBottom: '12px' }}>
                <p className="text-warning-text font-bold" style={{ fontSize: '12px' }}>Com: {f.responsavelAtual}</p>
                <p className="text-warning-text" style={{ fontSize: '11px' }}>Desde: {f.dataEmprestimo}</p>
              </div>
            )}
            <div className="flex gap-2">
              {f.status === 'Disponivel' && (
                <button onClick={() => openEmprestimo(f)} className="flex-1 flex items-center justify-center gap-2 text-primary font-bold border border-primary/30 hover:bg-primary-bg rounded-lg transition-colors" style={{ padding: '10px', fontSize: '12px' }}>
                  <ArrowLeftRight size={14} /> Emprestar
                </button>
              )}
              {f.status === 'Emprestada' && (
                <button onClick={() => handleDevolver(f)} className="flex-1 flex items-center justify-center gap-2 text-white font-bold bg-success hover:opacity-90 rounded-lg transition-opacity" style={{ padding: '10px', fontSize: '12px' }}>
                  Devolver
                </button>
              )}
            </div>
            {f.historicoUso.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <p className="text-text-muted font-bold uppercase" style={{ fontSize: '10px', marginBottom: '6px' }}>Historico</p>
                {f.historicoUso.slice(-3).map((h, i) => (
                  <p key={i} className="text-text-muted" style={{ fontSize: '11px' }}>
                    {h.responsavel}: {h.dataRetirada} → {h.dataDevolucao}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Nova Ferramenta */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '480px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>Nova Ferramenta</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Nome</label>
                <input type="text" value={formNome} onChange={e => setFormNome(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Codigo</label>
                <input type="text" value={formCodigo} onChange={e => setFormCodigo(e.target.value)} placeholder="Ex: FER-004" className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
              </div>
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: '24px' }}>
              <button onClick={() => setModalOpen(false)} className="text-text-secondary font-bold" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Cancelar</button>
              <button onClick={handleCriar} className="bg-primary text-white font-bold hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Emprestimo */}
      {empModalOpen && selectedFerr && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '480px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>Registrar Emprestimo</h2>
              <button onClick={() => setEmpModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="bg-surface-container-low rounded-xl" style={{ padding: '16px', marginBottom: '20px' }}>
              <p className="font-bold text-text-primary">{selectedFerr.nome}</p>
              <p className="text-text-muted" style={{ fontSize: '12px' }}>Codigo: {selectedFerr.codigo}</p>
            </div>
            <div>
              <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Quem vai pegar</label>
              <input type="text" value={empResponsavel} onChange={e => setEmpResponsavel(e.target.value)} placeholder="Nome do responsavel" className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: '24px' }}>
              <button onClick={() => setEmpModalOpen(false)} className="text-text-secondary font-bold" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Cancelar</button>
              <button onClick={handleEmprestar} className="bg-primary text-white font-bold hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
