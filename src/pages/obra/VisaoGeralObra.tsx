import { useState } from 'react';
import { Plus, Pencil, Trash2, X, HardHat } from 'lucide-react';
import KPICard from '../../components/shared/KPICard';
import EmptyState from '../../components/shared/EmptyState';
import { getAll, create, update, remove } from '../../lib/storage';
import { STORAGE_KEYS, type Obra, type Solicitacao } from '../../lib/types';

export default function VisaoGeralObra() {
  const [obras, setObras] = useState(() => getAll<Obra>(STORAGE_KEYS.OBRAS));
  const solicitacoes = getAll<Solicitacao>(STORAGE_KEYS.SOLICITACOES);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [cliente, setCliente] = useState('');
  const [local, setLocal] = useState('');
  const [obs, setObs] = useState('');
  const [paineisMin, setPaineisMin] = useState('0');
  const [pilaresMin, setPilaresMin] = useState('0');
  const [sapatasMin, setSapatasMin] = useState('0');

  const refresh = () => setObras(getAll<Obra>(STORAGE_KEYS.OBRAS));

  const openNew = () => { setEditId(null); setNome(''); setCliente(''); setLocal(''); setObs(''); setPaineisMin('0'); setPilaresMin('0'); setSapatasMin('0'); setModalOpen(true); };
  const openEdit = (o: Obra) => { setEditId(o.id); setNome(o.nome); setCliente(o.cliente); setLocal(o.local); setObs(o.observacoes); setPaineisMin(String(o.paineisMin)); setPilaresMin(String(o.pilaresMin)); setSapatasMin(String(o.sapatasMin)); setModalOpen(true); };

  const handleSave = () => {
    if (!nome.trim()) return;
    const data = { nome, cliente, local, observacoes: obs, paineisMin: Number(paineisMin), pilaresMin: Number(pilaresMin), sapatasMin: Number(sapatasMin) };
    if (editId) { update<Obra>(STORAGE_KEYS.OBRAS, editId, data); } else { create<Obra>(STORAGE_KEYS.OBRAS, data as Omit<Obra, 'id'>); }
    refresh(); setModalOpen(false);
  };

  const handleDelete = (id: number) => { if (confirm('Excluir esta obra?')) { remove<Obra>(STORAGE_KEYS.OBRAS, id); refresh(); } };

  const getObraProgress = (obraId: number) => {
    const solics = solicitacoes.filter(s => s.obraId === obraId);
    const totalP = solics.reduce((a, s) => a + s.paineis, 0);
    const fabP = solics.reduce((a, s) => a + s.fabricadoPainel, 0);
    const totalPil = solics.reduce((a, s) => a + s.pilares, 0);
    const fabPil = solics.reduce((a, s) => a + s.fabricadoPilar, 0);
    const totalS = solics.reduce((a, s) => a + s.sapatas, 0);
    const fabS = solics.reduce((a, s) => a + s.fabricadoSapata, 0);
    return { totalP, fabP, totalPil, fabPil, totalS, fabS };
  };

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>Obra</p>
      <div className="flex items-center gap-3">
        <HardHat size={28} className="text-primary" />
        <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Visao Geral das Obras</h1>
      </div>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Gerencie suas obras e acompanhe o progresso</p>

      <div className="grid-kpi" style={{ marginTop: '28px' }}>
        <KPICard title="Total Obras" value={obras.length} icon="HardHat" color="primary" />
      </div>

      <div className="flex justify-end" style={{ marginTop: '28px' }}>
        <button onClick={openNew} className="bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>
          <Plus size={16} /> Nova Obra
        </button>
      </div>

      <div className="grid-cards" style={{ marginTop: '20px' }}>
        {obras.length === 0 ? <EmptyState message="Nenhuma obra cadastrada" icon="HardHat" /> : obras.map(o => {
          const prog = getObraProgress(o.id);
          return (
            <div key={o.id} className="border border-border rounded-xl" style={{ padding: '24px' }}>
              <div className="flex items-start justify-between" style={{ marginBottom: '16px' }}>
                <div>
                  <h3 className="font-extrabold text-text-primary" style={{ fontSize: '16px' }}>{o.nome}</h3>
                  <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>{o.cliente} — {o.local}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(o)} className="text-text-muted hover:text-primary"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(o.id)} className="text-text-muted hover:text-danger"><Trash2 size={16} /></button>
                </div>
              </div>
              {o.observacoes && <p className="text-text-secondary" style={{ fontSize: '12px', marginBottom: '12px' }}>{o.observacoes}</p>}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-container-low rounded-lg" style={{ padding: '10px 12px' }}>
                  <p className="text-text-muted font-bold uppercase" style={{ fontSize: '9px' }}>Paineis</p>
                  <p className="font-extrabold text-text-primary" style={{ fontSize: '16px' }}>{prog.fabP}/{prog.totalP || o.paineisMin}</p>
                  <div className="bg-border rounded-full" style={{ height: '4px', marginTop: '4px' }}>
                    <div className="bg-primary rounded-full" style={{ height: '4px', width: `${Math.min(100, (prog.fabP / (prog.totalP || o.paineisMin || 1)) * 100)}%` }} />
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-lg" style={{ padding: '10px 12px' }}>
                  <p className="text-text-muted font-bold uppercase" style={{ fontSize: '9px' }}>Pilares</p>
                  <p className="font-extrabold text-text-primary" style={{ fontSize: '16px' }}>{prog.fabPil}/{prog.totalPil || o.pilaresMin}</p>
                  <div className="bg-border rounded-full" style={{ height: '4px', marginTop: '4px' }}>
                    <div className="bg-primary rounded-full" style={{ height: '4px', width: `${Math.min(100, (prog.fabPil / (prog.totalPil || o.pilaresMin || 1)) * 100)}%` }} />
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-lg" style={{ padding: '10px 12px' }}>
                  <p className="text-text-muted font-bold uppercase" style={{ fontSize: '9px' }}>Sapatas</p>
                  <p className="font-extrabold text-text-primary" style={{ fontSize: '16px' }}>{prog.fabS}/{prog.totalS || o.sapatasMin}</p>
                  <div className="bg-border rounded-full" style={{ height: '4px', marginTop: '4px' }}>
                    <div className="bg-primary rounded-full" style={{ height: '4px', width: `${Math.min(100, (prog.fabS / (prog.totalS || o.sapatasMin || 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '560px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>{editId ? 'Editar' : 'Nova'} Obra</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Nome da Obra</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Cliente</label>
                  <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
                </div>
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Local</label>
                  <input type="text" value={local} onChange={e => setLocal(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Min. Paineis</label>
                  <input type="number" value={paineisMin} onChange={e => setPaineisMin(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
                </div>
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Min. Pilares</label>
                  <input type="number" value={pilaresMin} onChange={e => setPilaresMin(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
                </div>
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Min. Sapatas</label>
                  <input type="number" value={sapatasMin} onChange={e => setSapatasMin(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
                </div>
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Observacoes</label>
                <textarea value={obs} onChange={e => setObs(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px', minHeight: '60px', resize: 'vertical' }} />
              </div>
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: '24px' }}>
              <button onClick={() => setModalOpen(false)} className="text-text-secondary font-bold" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Cancelar</button>
              <button onClick={handleSave} className="bg-primary text-white font-bold hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
