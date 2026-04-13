import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, UserCog } from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { usuarios as usuariosApi } from '../lib/api';
import type { Usuario } from '../lib/types';

const CARGOS = ['Master', 'Mestre', 'Encarregado', 'Compras', 'Financeiro', 'RH', 'Meio-profissional', 'Ferreiro', 'Betoneiro', 'Servente'];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => { refresh(); }, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [cargo, setCargo] = useState('Mestre');

  const refresh = () => { usuariosApi.listar().then(setUsuarios).catch(() => {}); };

  const openNew = () => { setEditId(null); setLogin(''); setSenha(''); setCargo('Mestre'); setModalOpen(true); };
  const openEdit = (u: Usuario) => { setEditId(u.id); setLogin(u.login); setSenha(''); setCargo(u.cargo); setModalOpen(true); };

  const handleSave = () => {
    if (!login.trim()) return;
    const tipo = (cargo === 'Master') ? 'Master' : 'Usuario';
    let promise: Promise<unknown>;
    if (editId) {
      const updates: Partial<Usuario> = { login, cargo, tipo };
      if (senha) updates.senha = senha;
      promise = usuariosApi.atualizar(editId, updates);
    } else {
      if (!senha) return;
      promise = usuariosApi.criar({ login, senha, tipo, cargo, ativo: 1, foto: '' });
    }
    promise.then(() => { refresh(); setModalOpen(false); }).catch(() => {});
  };

  const handleToggleAtivo = (u: Usuario) => {
    usuariosApi.toggleAtivo(u.id).then(() => refresh()).catch(() => {});
  };

  const handleDelete = (id: number) => {
    if (confirm('Excluir este usuario?')) { usuariosApi.remover(id).then(() => refresh()).catch(() => {}); }
  };

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>Sistema</p>
      <div className="flex items-center gap-3">
        <UserCog size={28} className="text-primary" />
        <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Usuarios</h1>
      </div>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Gerencie os usuarios do sistema</p>

      <div className="flex justify-end" style={{ marginTop: '28px' }}>
        <button onClick={openNew} className="bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>
          <Plus size={16} /> Novo Usuario
        </button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden" style={{ marginTop: '20px' }}>
        {usuarios.length === 0 ? <EmptyState message="Nenhum usuario cadastrado" icon="UserCog" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full" style={{ fontSize: '13px' }}>
              <thead>
                <tr className="bg-surface-container-low text-text-muted uppercase tracking-wider" style={{ fontSize: '11px' }}>
                  <th className="text-left font-extrabold" style={{ padding: '14px 20px' }}>Usuario</th>
                  <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Cargo</th>
                  <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Tipo</th>
                  <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Status</th>
                  <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-t border-border hover:bg-surface-container-low/50">
                    <td style={{ padding: '14px 20px' }}>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary flex items-center justify-center text-white font-bold" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                          {u.login.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-text-primary">{u.login}</span>
                      </div>
                    </td>
                    <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{u.cargo}</td>
                    <td style={{ padding: '14px 16px' }}><StatusBadge status={u.tipo === 'Master' ? 'Autorizado' : 'Pendente'} /></td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => handleToggleAtivo(u)} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${u.ativo ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)} className="text-text-muted hover:text-primary"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(u.id)} className="text-text-muted hover:text-danger"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="modal-card w-full" style={{ maxWidth: '480px', padding: '32px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h2 className="font-extrabold text-text-primary" style={{ fontSize: '20px' }}>{editId ? 'Editar' : 'Novo'} Usuario</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Login</label>
                <input type="text" value={login} onChange={e => setLogin(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Senha {editId && '(deixe vazio para manter)'}</label>
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }} />
              </div>
              <div>
                <label className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px' }}>Cargo</label>
                <select value={cargo} onChange={e => setCargo(e.target.value)} className="w-full bg-surface-container-low border border-border" style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '14px', marginTop: '6px' }}>
                  {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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
