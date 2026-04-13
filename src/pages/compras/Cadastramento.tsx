import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Database } from 'lucide-react';
import EmptyState from '../../components/shared/EmptyState';
import { insumos as insumosApi, fornecedores as fornecedoresApi } from '../../lib/api';
import type { Insumo, Fornecedor } from '../../lib/types';

type Tab = 'insumos' | 'fornecedores';

export default function Cadastramento() {
  const [activeTab, setActiveTab] = useState<Tab>('insumos');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  useEffect(() => {
    refreshInsumos();
    refreshFornecedores();
  }, []);

  // Insumo modal
  const [insModalOpen, setInsModalOpen] = useState(false);
  const [insEditId, setInsEditId] = useState<number | null>(null);
  const [insNome, setInsNome] = useState('');
  const [insUnidade, setInsUnidade] = useState('un');
  const [insEstoqueMinimo, setInsEstoqueMinimo] = useState('0');

  // Fornecedor modal
  const [fornModalOpen, setFornModalOpen] = useState(false);
  const [fornEditId, setFornEditId] = useState<number | null>(null);
  const [fornNome, setFornNome] = useState('');
  const [fornFone, setFornFone] = useState('');

  const refreshInsumos = () => { insumosApi.listar().then(setInsumos).catch(() => {}); };
  const refreshFornecedores = () => { fornecedoresApi.listar().then(setFornecedores).catch(() => {}); };

  // Insumo handlers
  const openNewInsumo = () => { setInsEditId(null); setInsNome(''); setInsUnidade('un'); setInsEstoqueMinimo('0'); setInsModalOpen(true); };
  const openEditInsumo = (i: Insumo) => { setInsEditId(i.id); setInsNome(i.nome); setInsUnidade(i.unidade); setInsEstoqueMinimo(String(i.estoqueMinimo)); setInsModalOpen(true); };
  const handleSaveInsumo = () => {
    if (!insNome.trim()) return;
    const promise = insEditId
      ? insumosApi.atualizar(insEditId, { nome: insNome, unidade: insUnidade, estoqueMinimo: Number(insEstoqueMinimo) })
      : insumosApi.criar({ nome: insNome, unidade: insUnidade, coeficiente: 0, estoqueAtual: 0, estoqueMinimo: Number(insEstoqueMinimo) });
    promise.then(() => { refreshInsumos(); setInsModalOpen(false); }).catch(() => {});
  };
  const handleDeleteInsumo = (id: number) => { if (confirm('Excluir este insumo?')) { insumosApi.remover(id).then(() => refreshInsumos()).catch(() => {}); } };

  // Fornecedor handlers
  const openNewForn = () => { setFornEditId(null); setFornNome(''); setFornFone(''); setFornModalOpen(true); };
  const openEditForn = (f: Fornecedor) => { setFornEditId(f.id); setFornNome(f.nome); setFornFone(f.fone); setFornModalOpen(true); };
  const handleSaveForn = () => {
    if (!fornNome.trim()) return;
    const promise = fornEditId
      ? fornecedoresApi.atualizar(fornEditId, { nome: fornNome, fone: fornFone })
      : fornecedoresApi.criar({ nome: fornNome, fone: fornFone });
    promise.then(() => { refreshFornecedores(); setFornModalOpen(false); }).catch(() => {});
  };
  const handleDeleteForn = (id: number) => { if (confirm('Excluir este fornecedor?')) { fornecedoresApi.remover(id).then(() => refreshFornecedores()).catch(() => {}); } };

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>Compras</p>
      <div className="flex items-center gap-3">
        <Database size={28} className="text-primary" />
        <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Cadastramento</h1>
      </div>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Cadastro de insumos e fornecedores</p>

      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginTop: '28px' }}>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('insumos')} className={`font-bold ${activeTab === 'insumos' ? 'bg-primary text-white' : 'bg-surface-container-low text-text-secondary border border-border'}`} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}>Insumos ({insumos.length})</button>
          <button onClick={() => setActiveTab('fornecedores')} className={`font-bold ${activeTab === 'fornecedores' ? 'bg-primary text-white' : 'bg-surface-container-low text-text-secondary border border-border'}`} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}>Fornecedores ({fornecedores.length})</button>
        </div>
        <button onClick={activeTab === 'insumos' ? openNewInsumo : openNewForn} className="bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>
          <Plus size={16} /> Novo {activeTab === 'insumos' ? 'Insumo' : 'Fornecedor'}
        </button>
      </div>

      {/* Insumos Grid */}
      {activeTab === 'insumos' && (
        <div className="grid-cards" style={{ marginTop: '20px' }}>
          {insumos.length === 0 ? <EmptyState message="Nenhum insumo cadastrado" icon="Package" /> : insumos.map(i => (
            <div key={i.id} className="border border-border rounded-xl" style={{ padding: '24px' }}>
              <div className="flex items-start justify-between" style={{ marginBottom: '16px' }}>
                <div>
                  <h3 className="font-extrabold text-text-primary" style={{ fontSize: '16px' }}>{i.nome}</h3>
                  <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>Unidade: {i.unidade}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditInsumo(i)} className="text-text-muted hover:text-primary"><Pencil size={16} /></button>
                  <button onClick={() => handleDeleteInsumo(i.id)} className="text-text-muted hover:text-danger"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-lg" style={{ padding: '10px 14px' }}>
                  <p className="text-text-muted font-bold uppercase" style={{ fontSize: '10px' }}>Em Estoque</p>
                  <p className="font-extrabold text-text-primary" style={{ fontSize: '18px' }}>{i.estoqueAtual} <span className="text-text-muted" style={{ fontSize: '12px' }}>{i.unidade}</span></p>
                </div>
                <div className="bg-surface-container-low rounded-lg" style={{ padding: '10px 14px' }}>
                  <p className="text-text-muted font-bold uppercase" style={{ fontSize: '10px' }}>Estoque Min.</p>
                  <p className={`font-extrabold ${i.estoqueAtual <= i.estoqueMinimo ? 'text-danger' : 'text-text-primary'}`} style={{ fontSize: '18px' }}>{i.estoqueMinimo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fornecedores Grid */}
      {activeTab === 'fornecedores' && (
        <div className="grid-cards" style={{ marginTop: '20px' }}>
          {fornecedores.length === 0 ? <EmptyState message="Nenhum fornecedor cadastrado" icon="Users" /> : fornecedores.map(f => (
            <div key={f.id} className="border border-border rounded-xl" style={{ padding: '24px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-text-primary" style={{ fontSize: '16px' }}>{f.nome}</h3>
                  <p className="text-text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>{f.fone || 'Sem telefone'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditForn(f)} className="text-text-muted hover:text-primary"><Pencil size={16} /></button>
                  <button onClick={() => handleDeleteForn(f.id)} className="text-text-muted hover:text-danger"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Insumo */}
      {insModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '480px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>{insEditId ? 'Editar' : 'Novo'} Insumo</h2>
              <button onClick={() => setInsModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Nome</label>
                <input type="text" value={insNome} onChange={e => setInsNome(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Unidade</label>
                  <select value={insUnidade} onChange={e => setInsUnidade(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                    <option value="un">Unidade</option><option value="kg">Kg</option><option value="m">Metro</option><option value="m2">m²</option><option value="m3">m³</option><option value="saco">Saco</option><option value="litro">Litro</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Estoque Minimo</label>
                  <input type="number" value={insEstoqueMinimo} onChange={e => setInsEstoqueMinimo(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: '24px' }}>
              <button onClick={() => setInsModalOpen(false)} className="text-text-secondary font-bold" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Cancelar</button>
              <button onClick={handleSaveInsumo} className="bg-primary text-white font-bold hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fornecedor */}
      {fornModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '480px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>{fornEditId ? 'Editar' : 'Novo'} Fornecedor</h2>
              <button onClick={() => setFornModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Nome</label>
                <input type="text" value={fornNome} onChange={e => setFornNome(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Telefone</label>
                <input type="text" value={fornFone} onChange={e => setFornFone(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} placeholder="(11) 9999-9999" />
              </div>
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: '24px' }}>
              <button onClick={() => setFornModalOpen(false)} className="text-text-secondary font-bold" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Cancelar</button>
              <button onClick={handleSaveForn} className="bg-primary text-white font-bold hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
