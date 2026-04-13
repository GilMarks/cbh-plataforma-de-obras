import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Landmark } from 'lucide-react';
import EmptyState from '../../components/shared/EmptyState';
import { bancos as bancosApi } from '../../lib/api';
import type { Banco } from '../../lib/types';

const BANK_COLORS = ['bg-primary', 'bg-danger', 'bg-tertiary', 'bg-secondary', 'bg-success'];

export default function CadastroBancario() {
  const [bancos, setBancos] = useState<Banco[]>([]);

  useEffect(() => { refresh(); }, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [tipoConta, setTipoConta] = useState('Conta Corrente PJ');
  const [chavePix, setChavePix] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('0,00');
  const [contaAtiva, setContaAtiva] = useState(true);

  const refresh = () => { bancosApi.listar().then(setBancos).catch(() => {}); };

  const openNew = () => {
    setEditingId(null);
    setNome('');
    setAgencia('');
    setConta('');
    setTipoConta('Conta Corrente PJ');
    setChavePix('');
    setSaldoInicial('0,00');
    setContaAtiva(true);
    setModalOpen(true);
  };

  const openEdit = (banco: Banco) => {
    setEditingId(banco.id);
    setNome(banco.nome);
    setAgencia(banco.agencia);
    setConta(banco.conta);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!nome.trim()) return;
    const promise = editingId
      ? bancosApi.atualizar(editingId, { nome, agencia, conta })
      : bancosApi.criar({ nome, agencia, conta });
    promise.then(() => { refresh(); setModalOpen(false); }).catch(() => {});
  };

  const handleDelete = (id: number) => {
    if (!confirm('Deseja excluir esta conta bancaria?')) return;
    bancosApi.remover(id).then(() => refresh()).catch(() => {});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap" style={{ gap: '16px' }}>
        <div>
          <p
            className="text-text-muted uppercase tracking-widest font-extrabold"
            style={{ fontSize: '11px' }}
          >
            Bank Accounts
          </p>
          <h1
            className="font-extrabold text-text-primary tracking-tight"
            style={{ fontSize: '28px', lineHeight: 1.2, marginTop: '6px' }}
          >
            Contas Bancarias e Caixas
          </h1>
          <p
            className="text-text-secondary font-medium"
            style={{ fontSize: '14px', marginTop: '6px' }}
          >
            Gerencie as contas ativas para controle e rastreabilidade de pagamentos.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center bg-primary text-white font-bold hover:bg-primary-dark transition-all"
          style={{ gap: '8px', padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}
        >
          <Plus size={16} /> Nova Conta
        </button>
      </div>

      {/* ── Cards ── */}
      {bancos.length === 0 ? (
        <EmptyState message="Nenhuma conta bancaria cadastrada" />
      ) : (
        <div className="grid-cards">
          {bancos.map((banco, i) => (
            <div
              key={banco.id}
              className="bg-surface-container-lowest hover:bg-table-hover transition-colors"
              style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center" style={{ gap: '14px' }}>
                  <div
                    className={`${BANK_COLORS[i % BANK_COLORS.length]} flex items-center justify-center text-white`}
                    style={{ width: '44px', height: '44px', borderRadius: '10px' }}
                  >
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary" style={{ fontSize: '15px' }}>{banco.nome}</h4>
                    <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '3px' }}>Conta Corrente PJ</p>
                  </div>
                </div>
                <span
                  className="inline-flex items-center font-bold bg-success-bg text-success-text uppercase"
                  style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px' }}
                >
                  Ativa
                </span>
              </div>

              {/* Card Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Agencia', value: banco.agencia },
                  { label: 'Conta', value: banco.conta },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between" style={{ fontSize: '14px' }}>
                    <span className="text-text-muted">{item.label}:</span>
                    <span className="font-medium text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Card Actions */}
              <div
                className="flex"
                style={{ gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(195, 198, 215, 0.15)' }}
              >
                <button
                  onClick={() => openEdit(banco)}
                  className="flex-1 flex items-center justify-center text-primary font-medium hover:bg-surface-container-high/50 transition-colors"
                  style={{ gap: '6px', padding: '12px', borderRadius: '10px', fontSize: '13px' }}
                >
                  <Pencil size={14} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(banco.id)}
                  className="flex-1 flex items-center justify-center text-danger font-medium hover:bg-danger-bg transition-colors"
                  style={{ gap: '6px', padding: '12px', borderRadius: '10px', fontSize: '13px' }}
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 'var(--z-modal)', padding: '16px' }}
        >
          <div
            className="bg-surface-container-lowest w-full"
            style={{ maxWidth: '560px', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '32px' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
              <h3 className="font-extrabold text-text-primary tracking-tight" style={{ fontSize: '20px' }}>
                {editingId ? 'Editar Conta' : 'Cadastrar Nova Conta'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="flex items-center justify-center hover:bg-surface-container transition-colors"
                style={{ width: '36px', height: '36px', borderRadius: '50%' }}
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>
            <p className="text-text-secondary" style={{ fontSize: '14px', marginBottom: '28px' }}>
              Preencha os dados bancarios para integracao financeira.
            </p>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Nome */}
              <div>
                <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
                  Nome de Identificacao
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Itau - Folha de Pagamento"
                  className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                  style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                />
              </div>

              {/* Instituicao + Tipo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
                    Instituicao Financeira
                  </label>
                  <select
                    className="w-full bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                    style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                  >
                    <option>Selecione o banco...</option>
                    <option>Itau Unibanco</option>
                    <option>Bradesco</option>
                    <option>Caixa Economica</option>
                    <option>Banco do Brasil</option>
                    <option>Santander</option>
                  </select>
                </div>
                <div>
                  <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
                    Tipo de Conta
                  </label>
                  <select
                    value={tipoConta}
                    onChange={e => setTipoConta(e.target.value)}
                    className="w-full bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                    style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                  >
                    <option>Conta Corrente PJ</option>
                    <option>Conta Poupanca</option>
                    <option>Caixa Interno</option>
                  </select>
                </div>
              </div>

              {/* Agencia + Conta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
                    Agencia
                  </label>
                  <input
                    type="text"
                    value={agencia}
                    onChange={e => setAgencia(e.target.value)}
                    placeholder="0000-0"
                    className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                    style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
                    Numero da Conta
                  </label>
                  <input
                    type="text"
                    value={conta}
                    onChange={e => setConta(e.target.value)}
                    placeholder="00.000-0"
                    className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                    style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              {/* Chave Pix */}
              <div>
                <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
                  Chave Pix
                </label>
                <input
                  type="text"
                  value={chavePix}
                  onChange={e => setChavePix(e.target.value)}
                  placeholder="CNPJ, E-mail, Celular ou Chave Aleatoria"
                  className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                  style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                />
              </div>

              {/* Saldo Inicial + Toggle */}
              <div className="flex items-end justify-between">
                <div>
                  <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
                    Saldo Inicial
                  </label>
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <span className="text-text-muted" style={{ fontSize: '14px' }}>R$</span>
                    <input
                      type="text"
                      value={saldoInicial}
                      onChange={e => setSaldoInicial(e.target.value)}
                      className="bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                      style={{ width: '120px', padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </div>
                <div className="flex items-center" style={{ gap: '12px' }}>
                  <span className="text-text-secondary" style={{ fontSize: '14px' }}>Conta Ativa</span>
                  <button
                    onClick={() => setContaAtiva(!contaAtiva)}
                    className={`transition-colors ${contaAtiva ? 'bg-primary' : 'bg-surface-container-high'}`}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', position: 'relative' }}
                  >
                    <div
                      className="bg-white"
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: contaAtiva ? '22px' : '2px',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end" style={{ gap: '12px', marginTop: '28px' }}>
              <button
                onClick={() => setModalOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
                style={{ padding: '12px 20px', fontSize: '13px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="bg-primary hover:bg-primary-dark text-white font-bold transition-all"
                style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}
              >
                Salvar Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
