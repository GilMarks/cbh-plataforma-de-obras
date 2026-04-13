import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, UserPlus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../../components/shared/KPICard';
import EmptyState from '../../components/shared/EmptyState';
import { funcionariosRH } from '../../lib/api';
import type { FuncionarioRH } from '../../lib/types';

const ITEMS_PER_PAGE = 10;

export default function ListaFuncionarios() {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<FuncionarioRH[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const refresh = () => { funcionariosRH.listar().then(setFuncionarios).catch(() => {}); };

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    if (!search) return funcionarios;
    return funcionarios.filter(f =>
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.sobrenome.toLowerCase().includes(search.toLowerCase()) ||
      f.ocupacao.toLowerCase().includes(search.toLowerCase()) ||
      f.cpf.includes(search)
    );
  }, [funcionarios, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIdx = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  const handleDelete = (id: number) => {
    if (confirm('Excluir este funcionario?')) { funcionariosRH.remover(id).then(() => refresh()).catch(() => {}); }
  };

  return (
    <div>
      <p className="text-text-muted font-extrabold uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>RH</p>
      <h1 className="font-extrabold text-text-primary" style={{ fontSize: '28px', lineHeight: 1.2 }}>Funcionarios</h1>
      <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '6px' }}>Lista de funcionarios cadastrados</p>

      <div className="grid-kpi" style={{ marginTop: '28px' }}>
        <KPICard title="Total Funcionarios" value={funcionarios.length} icon="Users" color="primary" />
      </div>

      <div className="border border-border rounded-xl" style={{ marginTop: '28px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="relative flex-1" style={{ minWidth: '200px' }}>
          <Search size={16} className="absolute text-text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Buscar por nome, ocupacao ou CPF..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full bg-surface-container-low border border-border text-text-primary" style={{ padding: '12px 20px 12px 44px', borderRadius: '10px', fontSize: '14px' }} />
        </div>
        <button onClick={() => navigate('/rh/cadastro')} className="bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90" style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}>
          <UserPlus size={16} /> Novo Funcionario
        </button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden" style={{ marginTop: '20px' }}>
        {filtered.length === 0 ? <EmptyState message="Nenhum funcionario cadastrado" icon="Users" /> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full" style={{ fontSize: '13px' }}>
                <thead>
                  <tr className="bg-surface-container-low text-text-muted uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    <th className="text-left font-extrabold" style={{ padding: '14px 20px' }}>Nome</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Ocupacao</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>CPF</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Telefone</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Admissao</th>
                    <th className="text-left font-extrabold" style={{ padding: '14px 16px' }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(f => (
                    <tr key={f.id} className="border-t border-border hover:bg-surface-container-low/50">
                      <td style={{ padding: '14px 20px' }}>
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary flex items-center justify-center text-white font-bold" style={{ width: '36px', height: '36px', fontSize: '14px', flexShrink: 0 }}>
                            {f.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{f.nome} {f.sobrenome}</p>
                            {f.apelido && <p className="text-text-muted" style={{ fontSize: '11px' }}>{f.apelido}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{f.ocupacao || '—'}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{f.cpf || '—'}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{f.telefone || '—'}</td>
                      <td className="text-text-secondary" style={{ padding: '14px 16px' }}>{f.admissao || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => handleDelete(f.id)} className="text-text-muted hover:text-danger"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border flex items-center justify-between" style={{ padding: '12px 20px' }}>
              <span className="text-text-muted" style={{ fontSize: '12px' }}>{startIdx}-{endIdx} de {filtered.length}</span>
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
    </div>
  );
}
