import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Check, Factory } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import { fabrica as fabricaApi } from '../../lib/api';
import type { Solicitacao } from '../../lib/types';

type TabType = 'Paineis' | 'Pilares' | 'Sapatas';

export default function ControleFabricacao() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('Paineis');
  const [search, setSearch] = useState('');
  const [lancamentos, setLancamentos] = useState<Record<number, number>>({});
  const [lancadoState, setLancadoState] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fabricaApi.listarProducao().then(setSolicitacoes).catch(() => {});
  }, []);
  const today = new Date();
  const dayName = today.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  const filtered = useMemo(() => {
    return solicitacoes.filter(s => {
      const matchSearch = s.obraNome.toLowerCase().includes(search.toLowerCase()) ||
        s.clienteNome.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [solicitacoes, search]);

  const getStatus = (sol: Solicitacao) => {
    if (activeTab === 'Paineis') return sol.statusPainel;
    if (activeTab === 'Pilares') return sol.statusPilar;
    return sol.statusSapata;
  };

  const getFabricado = (sol: Solicitacao) => {
    if (activeTab === 'Paineis') return sol.fabricadoPainel;
    if (activeTab === 'Pilares') return sol.fabricadoPilar;
    return sol.fabricadoSapata;
  };

  const getMeta = (sol: Solicitacao) => {
    if (activeTab === 'Paineis') return sol.paineis;
    if (activeTab === 'Pilares') return sol.pilares;
    return sol.sapatas;
  };

  const getSpec = (sol: Solicitacao) => {
    if (activeTab === 'Paineis') return `Painel ${sol.painelComp}x${sol.painelAlt}m — ${sol.tipoPainel}`;
    if (activeTab === 'Pilares') return `Pilar ${sol.pilarAlt}m — ${sol.bainhaPilar ? 'Com bainha' : 'Sem bainha'}`;
    return `Sapata ${sol.tamanhoSapata} — ${sol.tipoSapata}`;
  };

  const handleIncrement = (solId: number) => {
    const sol = solicitacoes.find(s => s.id === solId);
    if (!sol) return;
    const fabricado = getFabricado(sol);
    const meta = getMeta(sol);
    const current = lancamentos[solId] || 0;
    if (fabricado + current >= meta) return;
    setLancamentos(prev => ({ ...prev, [solId]: current + 1 }));
  };

  const handleDecrement = (solId: number) => {
    setLancamentos(prev => ({ ...prev, [solId]: Math.max(0, (prev[solId] || 0) - 1) }));
  };

  const handleInputChange = (solId: number, value: string) => {
    const sol = solicitacoes.find(s => s.id === solId);
    if (!sol) return;
    const fabricado = getFabricado(sol);
    const meta = getMeta(sol);
    const parsed = Math.max(0, parseInt(value) || 0);
    const clamped = Math.min(parsed, meta - fabricado);
    setLancamentos(prev => ({ ...prev, [solId]: clamped }));
  };

  const handleLancar = (solId: number) => {
    const qtd = lancamentos[solId] || 0;
    if (qtd <= 0) return;

    const tipo = activeTab === 'Paineis' ? 'painel' : activeTab === 'Pilares' ? 'pilar' : 'sapata';

    // Feedback imediato
    setLancadoState(prev => ({ ...prev, [solId]: true }));
    setLancamentos(prev => ({ ...prev, [solId]: 0 }));

    fabricaApi.lancarProducao(solId, tipo, qtd)
      .then(() => fabricaApi.listarProducao())
      .then(setSolicitacoes)
      .catch(() => {})
      .finally(() => {
        setTimeout(() => {
          setLancadoState(prev => ({ ...prev, [solId]: false }));
        }, 1500);
      });
  };

  const totalLancadoHoje = solicitacoes.reduce((sum, sol) => {
    const hist = (activeTab === 'Paineis' ? sol.historicoPainel : activeTab === 'Pilares' ? sol.historicoPilar : sol.historicoSapata) ?? [];
    return sum + hist.filter(h => h.data === new Date().toISOString().split('T')[0]).reduce((s, h) => s + h.qtd, 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap" style={{ gap: '16px' }}>
        <div>
          <p
            className="text-text-muted uppercase tracking-widest font-extrabold"
            style={{ fontSize: '11px' }}
          >
            Chao de Fabrica
          </p>
          <h1
            className="font-extrabold text-text-primary tracking-tight"
            style={{ fontSize: '28px', lineHeight: 1.2, marginTop: '6px' }}
          >
            Producao Diaria
          </h1>
          <p
            className="text-text-secondary font-medium capitalize"
            style={{ fontSize: '14px', marginTop: '6px' }}
          >
            {dayName}, {dateStr}
          </p>
        </div>

        {/* Summary pill — top right */}
        <div
          className="flex items-center bg-surface-container-lowest"
          style={{
            gap: '14px',
            padding: '16px 24px',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            className="bg-primary-bg flex items-center justify-center"
            style={{ width: '40px', height: '40px', borderRadius: '10px' }}
          >
            <Factory size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-text-muted font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>
              Lancado Hoje
            </p>
            <p className="font-extrabold text-primary tabular-nums tracking-tight" style={{ fontSize: '22px', lineHeight: 1.2 }}>
              {totalLancadoHoje}
              <span className="text-text-muted font-medium" style={{ fontSize: '12px', marginLeft: '6px' }}>
                pecas
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs + Search ── */}
      <div
        className="bg-surface-container-lowest flex items-center flex-wrap"
        style={{
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '20px 24px',
          gap: '16px',
        }}
      >
        {/* Tabs */}
        <div
          className="flex bg-surface-container-low"
          style={{
            borderRadius: '10px',
            padding: '4px',
            gap: '2px',
          }}
        >
          {(['Paineis', 'Pilares', 'Sapatas'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high/50'
              }`}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            >
              {tab}
              <span className="tabular-nums" style={{ marginLeft: '8px', opacity: 0.7 }}>
                {filtered.reduce((s, sol) => s + getMeta(sol), 0)}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative" style={{ flex: 1, minWidth: '240px' }}>
          <Search
            size={18}
            className="absolute text-text-muted pointer-events-none"
            style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por Ordem, Obra ou Peca..."
            className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted
              focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            style={{
              padding: '12px 20px 12px 48px',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
            }}
          />
        </div>
      </div>

      {/* ── Production Cards ── */}
      <div className="grid-cards">
        {filtered.map(sol => {
          const meta = getMeta(sol);
          if (meta === 0) return null;
          const fabricado = getFabricado(sol);
          const status = getStatus(sol);
          const qtd = lancamentos[sol.id] || 0;
          const isLancado = lancadoState[sol.id] || false;
          const remaining = meta - fabricado;
          const isMaxed = remaining <= 0;
          const isIncrementDisabled = fabricado + qtd >= meta;

          // Progress: base (confirmed) + preview (pending)
          const baseProgress = meta > 0 ? Math.min((fabricado / meta) * 100, 100) : 0;
          const previewProgress = meta > 0 ? Math.min(((fabricado + qtd) / meta) * 100, 100) : 0;
          const previewPercent = Math.round(previewProgress);

          return (
            <div
              key={sol.id}
              className="bg-surface-container-lowest"
              style={{
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Card Header */}
              <div
                className="flex items-start justify-between"
                style={{ padding: '24px 24px 0 24px' }}
              >
                <div>
                  <p
                    className="text-text-muted font-bold uppercase tracking-wider tabular-nums"
                    style={{ fontSize: '11px' }}
                  >
                    #ORD-{String(sol.id).padStart(4, '0')}
                  </p>
                  <h4
                    className="font-bold text-text-primary tracking-tight"
                    style={{ fontSize: '16px', marginTop: '6px' }}
                  >
                    {sol.obraNome}
                  </h4>
                </div>
                <StatusBadge status={status} />
              </div>

              {/* Spec */}
              <p
                className="text-text-secondary"
                style={{ fontSize: '13px', padding: '12px 24px 0 24px', lineHeight: 1.5 }}
              >
                {getSpec(sol)} | Reforco Malha Q92
              </p>

              {/* Progress Section */}
              <div style={{ padding: '20px 24px' }}>
                <div className="flex items-end justify-between" style={{ marginBottom: '10px' }}>
                  <div className="flex items-center" style={{ gap: '28px' }}>
                    <div>
                      <span
                        className="text-text-muted font-bold uppercase tracking-wider"
                        style={{ fontSize: '10px' }}
                      >
                        Produzido
                      </span>
                      <p
                        className="font-extrabold text-primary tabular-nums tracking-tight"
                        style={{ fontSize: '22px', lineHeight: 1.1 }}
                      >
                        {fabricado}
                      </p>
                    </div>
                    <div>
                      <span
                        className="text-text-muted font-bold uppercase tracking-wider"
                        style={{ fontSize: '10px' }}
                      >
                        Meta
                      </span>
                      <p
                        className="font-extrabold text-text-primary tabular-nums tracking-tight"
                        style={{ fontSize: '22px', lineHeight: 1.1 }}
                      >
                        {meta}
                      </p>
                    </div>
                    {qtd > 0 && (
                      <div>
                        <span
                          className="text-text-muted font-bold uppercase tracking-wider"
                          style={{ fontSize: '10px' }}
                        >
                          Pendente
                        </span>
                        <p
                          className="font-extrabold tabular-nums tracking-tight"
                          style={{ fontSize: '22px', lineHeight: 1.1, color: '#16a34a' }}
                        >
                          +{qtd}
                        </p>
                      </div>
                    )}
                  </div>
                  <span
                    className={`font-bold tabular-nums tracking-tight ${qtd > 0 ? 'text-primary' : 'text-text-muted'}`}
                    style={{ fontSize: '13px' }}
                  >
                    {previewPercent}%
                  </span>
                </div>

                {/* Progress bar — flat, industrial */}
                <div
                  className="bg-surface-container-high overflow-hidden"
                  style={{ height: '8px', borderRadius: '2px', position: 'relative' }}
                >
                  {/* Base progress (confirmed) */}
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{
                      width: `${baseProgress}%`,
                      borderRadius: '2px',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                  {/* Preview progress (pending) — striped overlay */}
                  {qtd > 0 && (
                    <div
                      className="h-full transition-all duration-200"
                      style={{
                        width: `${previewProgress}%`,
                        borderRadius: '2px',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        background: `repeating-linear-gradient(
                          -45deg,
                          rgba(0, 74, 198, 0.35),
                          rgba(0, 74, 198, 0.35) 3px,
                          rgba(0, 74, 198, 0.15) 3px,
                          rgba(0, 74, 198, 0.15) 6px
                        )`,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Quantity Control — bottom section */}
              <div
                style={{
                  padding: '20px 24px',
                  borderTop: '1px solid rgba(195, 198, 215, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {/* Minus button */}
                <button
                  onClick={() => handleDecrement(sol.id)}
                  disabled={qtd <= 0}
                  className="flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    flexShrink: 0,
                  }}
                >
                  <Minus size={18} />
                </button>

                {/* Quantity input */}
                <input
                  type="number"
                  value={qtd}
                  onChange={e => handleInputChange(sol.id, e.target.value)}
                  className="text-center font-extrabold bg-surface-container-lowest tabular-nums tracking-tight focus:outline-none focus:ring-2 focus:ring-primary/15"
                  min="0"
                  max={remaining}
                  style={{
                    width: '64px',
                    height: '48px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                />

                {/* Plus button */}
                <button
                  onClick={() => handleIncrement(sol.id)}
                  disabled={isIncrementDisabled || isMaxed}
                  className="flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={18} />
                </button>

                {/* Lancar button */}
                <button
                  onClick={() => handleLancar(sol.id)}
                  disabled={qtd <= 0 || isLancado}
                  className={`flex-1 flex items-center justify-center font-bold transition-all ${
                    isLancado
                      ? 'text-white'
                      : qtd > 0
                        ? 'text-white hover:opacity-90'
                        : 'text-white opacity-40 cursor-not-allowed'
                  }`}
                  style={{
                    height: '48px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    gap: '8px',
                    backgroundColor: isLancado ? '#16a34a' : '#16a34a',
                  }}
                >
                  <Check size={18} />
                  {isLancado ? 'Lancado!' : 'Lancar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
