import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, Calendar } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { lancamentos as lancamentosApi } from '../../lib/api';
import type { LancamentoFinanceiro } from '../../lib/types';

type DateRange = 'mes-atual' | 'ultimos-30' | 'ano-atual';

const CHART_SUCCESS = 'var(--color-success)';
const CHART_DANGER = 'var(--color-danger)';
const CHART_PRIMARY = 'var(--color-primary)';
const CHART_SECONDARY = 'var(--color-text-secondary)';
const CHART_WARNING = 'var(--color-warning)';
const CHART_INFO = 'var(--color-info)';
const CHART_TICK = 'var(--color-text-muted)';
const CHART_GRID = 'var(--color-border)';

const DONUT_COLORS = [CHART_PRIMARY, CHART_SECONDARY, CHART_SUCCESS, CHART_DANGER, CHART_INFO, CHART_WARNING];

const DATE_LABELS: Record<DateRange, string> = {
  'mes-atual': 'Este Mes',
  'ultimos-30': 'Ultimos 30 dias',
  'ano-atual': 'Ano Atual',
};

// Simulated cash-flow data per range
function getFluxoData(range: DateRange) {
  if (range === 'ano-atual') {
    return [
      { name: 'Jan', entradas: 95000, saidas: 72000 },
      { name: 'Fev', entradas: 110000, saidas: 88000 },
      { name: 'Mar', entradas: 145000, saidas: 105000 },
      { name: 'Abr', entradas: 130000, saidas: 98000 },
      { name: 'Mai', entradas: 160000, saidas: 112000 },
      { name: 'Jun', entradas: 140000, saidas: 95000 },
    ];
  }
  if (range === 'ultimos-30') {
    return [
      { name: 'Sem 1', entradas: 38000, saidas: 26000 },
      { name: 'Sem 2', entradas: 42000, saidas: 31000 },
      { name: 'Sem 3', entradas: 35000, saidas: 28000 },
      { name: 'Sem 4', entradas: 45000, saidas: 33000 },
    ];
  }
  return [
    { name: '01-07', entradas: 32000, saidas: 22000 },
    { name: '08-14', entradas: 28000, saidas: 19000 },
    { name: '15-21', entradas: 41000, saidas: 30000 },
    { name: '22-30', entradas: 38000, saidas: 25000 },
  ];
}

function getKPIMultiplier(range: DateRange) {
  if (range === 'ano-atual') return 6;
  if (range === 'ultimos-30') return 1.1;
  return 1;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatCompact = (v: number) => {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(v);
};

// Custom tooltip — Blueprint & Concrete style
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-surface-container-lowest"
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        minWidth: '160px',
      }}
    >
      <p className="font-bold text-text-primary" style={{ fontSize: '12px', marginBottom: '8px' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between" style={{ gap: '16px', marginTop: '4px' }}>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: entry.color }} />
            <span className="text-text-muted" style={{ fontSize: '11px' }}>
              {entry.name === 'entradas' ? 'Entradas' : 'Saidas'}
            </span>
          </div>
          <span className="font-bold tabular-nums tracking-tight text-text-primary" style={{ fontSize: '12px' }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-surface-container-lowest"
      style={{
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
      }}
    >
      <p className="font-bold text-text-primary" style={{ fontSize: '12px' }}>{payload[0].name}</p>
      <p className="font-bold tabular-nums tracking-tight text-primary" style={{ fontSize: '13px', marginTop: '2px' }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function VisaoGeral() {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('mes-atual');

  useEffect(() => {
    lancamentosApi.listar().then(setLancamentos).catch(() => {});
  }, []);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Animate on range change
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [dateRange]);

  const multiplier = getKPIMultiplier(dateRange);
  const totalReceitas = lancamentos.filter(l => l.tipo === 'Receita').reduce((s, l) => s + l.valor, 0) * multiplier;
  const totalDespesas = lancamentos.filter(l => l.tipo === 'Despesa').reduce((s, l) => s + l.valor, 0) * multiplier;
  const saldo = totalReceitas - totalDespesas;
  const totalAtrasado = lancamentos
    .filter(l => l.status === 'Vencido' && l.tipo === 'Despesa')
    .reduce((s, l) => s + l.valor, 0);

  const fluxoData = getFluxoData(dateRange);

  // Pie chart — expenses by centro
  const centros = lancamentos
    .filter(l => l.tipo === 'Despesa')
    .reduce<Record<string, number>>((acc, l) => {
      acc[l.centro] = (acc[l.centro] || 0) + l.valor;
      return acc;
    }, {});
  const distribuicaoData = Object.entries(centros).map(([name, value]) => ({ name, value }));
  const totalDistribuicao = distribuicaoData.reduce((s, d) => s + d.value, 0);

  // Mini-tables
  const proximasPagar = lancamentos
    .filter(l => l.tipo === 'Despesa' && l.status !== 'Pago')
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
    .slice(0, 5);

  const ultimasEntradas = lancamentos
    .filter(l => l.tipo === 'Receita')
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        opacity: isTransitioning ? 0.6 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >

      {/* ── Header + Date Filter ── */}
      <div className="flex items-start justify-between flex-wrap" style={{ gap: '16px' }}>
        <div>
          <p
            className="text-text-muted uppercase tracking-widest font-extrabold"
            style={{ fontSize: '11px' }}
          >
            Painel Financeiro
          </p>
          <h1
            className="font-extrabold text-text-primary tracking-tight"
            style={{ fontSize: '28px', lineHeight: 1.2, marginTop: '6px' }}
          >
            Visao Geral Financeira
          </h1>
        </div>

        {/* Date range selector */}
        <div
          className="flex items-center bg-surface-container-lowest"
          style={{
            gap: '8px',
            padding: '6px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
          }}
        >
          <Calendar size={16} className="text-text-muted" style={{ marginLeft: '10px' }} />
          {(['mes-atual', 'ultimos-30', 'ano-atual'] as DateRange[]).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`font-bold transition-all ${
                dateRange === range
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high/50'
              }`}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}
            >
              {DATE_LABELS[range]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {/* Saldo — hero card */}
        <div
          className="bg-surface-container-lowest"
          style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '24px' }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
            <p className="font-extrabold text-text-muted uppercase tracking-widest" style={{ fontSize: '10px' }}>
              Saldo em Contas
            </p>
            <Wallet size={18} className="text-primary opacity-40" />
          </div>
          <p
            className={`font-extrabold tabular-nums tracking-tight ${saldo >= 0 ? 'text-text-primary' : 'text-danger'}`}
            style={{ fontSize: '26px', lineHeight: 1.1 }}
          >
            {formatCurrency(saldo)}
          </p>
          <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '8px' }}>
            {DATE_LABELS[dateRange]}
          </p>
        </div>

        {/* Receitas */}
        <div
          className="bg-surface-container-lowest"
          style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '24px' }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
            <p className="font-extrabold text-text-muted uppercase tracking-widest" style={{ fontSize: '10px' }}>
              Receitas
            </p>
            <div
              className="flex items-center justify-center bg-success-bg"
              style={{ width: '28px', height: '28px', borderRadius: '8px' }}
            >
              <TrendingUp size={15} className="text-success" />
            </div>
          </div>
          <p className="font-extrabold tabular-nums tracking-tight text-success" style={{ fontSize: '22px', lineHeight: 1.1 }}>
            {formatCurrency(totalReceitas)}
          </p>
          <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '8px' }}>
            +12.4% vs periodo anterior
          </p>
        </div>

        {/* Despesas */}
        <div
          className="bg-surface-container-lowest"
          style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '24px' }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
            <p className="font-extrabold text-text-muted uppercase tracking-widest" style={{ fontSize: '10px' }}>
              Despesas
            </p>
            <div
              className="flex items-center justify-center bg-danger-bg"
              style={{ width: '28px', height: '28px', borderRadius: '8px' }}
            >
              <TrendingDown size={15} className="text-danger" />
            </div>
          </div>
          <p className="font-extrabold tabular-nums tracking-tight text-danger" style={{ fontSize: '22px', lineHeight: 1.1 }}>
            {formatCurrency(totalDespesas)}
          </p>
          <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '8px' }}>
            +8.1% vs periodo anterior
          </p>
        </div>

        {/* Inadimplencia — alert card */}
        <div
          className="bg-danger-bg"
          style={{
            borderRadius: '12px',
            border: '1px solid var(--color-danger)',
            padding: '24px',
            opacity: 0.85,
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
            <p className="font-extrabold text-danger uppercase tracking-widest" style={{ fontSize: '10px' }}>
              Atrasos
            </p>
            <AlertTriangle size={18} className="text-danger opacity-60" />
          </div>
          <p className="font-extrabold tabular-nums tracking-tight text-danger" style={{ fontSize: '22px', lineHeight: 1.1 }}>
            {formatCurrency(totalAtrasado)}
          </p>
          <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '8px' }}>
            {lancamentos.filter(l => l.status === 'Vencido').length} titulo{lancamentos.filter(l => l.status === 'Vencido').length !== 1 ? 's' : ''} vencido{lancamentos.filter(l => l.status === 'Vencido').length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Charts Row — 2/3 + 1/3 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Fluxo de Caixa — BarChart */}
        <div
          className="bg-surface-container-lowest"
          style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '28px' }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
            <div>
              <h3 className="font-bold text-text-primary tracking-tight" style={{ fontSize: '16px' }}>
                Fluxo de Caixa
              </h3>
              <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                Entradas vs Saidas — {DATE_LABELS[dateRange]}
              </p>
            </div>
            <div className="flex items-center" style={{ gap: '20px' }}>
              <div className="flex items-center" style={{ gap: '6px' }}>
                <span className="bg-success" style={{ width: '10px', height: '10px', borderRadius: '2px' }} />
                <span className="font-bold text-text-muted uppercase" style={{ fontSize: '10px' }}>Entradas</span>
              </div>
              <div className="flex items-center" style={{ gap: '6px' }}>
                <span className="bg-danger" style={{ width: '10px', height: '10px', borderRadius: '2px' }} />
                <span className="font-bold text-text-muted uppercase" style={{ fontSize: '10px' }}>Saidas</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={fluxoData} barGap={4} barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_GRID}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: CHART_TICK, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: CHART_TICK }}
                tickFormatter={formatCompact}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: CHART_GRID }} />
              <Bar dataKey="entradas" fill={CHART_SUCCESS} radius={[3, 3, 0, 0]} />
              <Bar dataKey="saidas" fill={CHART_DANGER} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuicao de Custos — Donut */}
        <div
          className="bg-surface-container-lowest flex flex-col"
          style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '28px' }}
        >
          <h3 className="font-bold text-text-primary tracking-tight" style={{ fontSize: '16px' }}>
            Despesas por Centro
          </h3>
          <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '4px', marginBottom: '20px' }}>
            Distribuicao por centro de custo
          </p>
          <div className="flex-1 flex items-center justify-center" style={{ minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={distribuicaoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {distribuicaoData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            {distribuicaoData.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] as string, flexShrink: 0 }} />
                  <span className="text-text-primary font-medium" style={{ fontSize: '13px' }}>{entry.name}</span>
                </div>
                <span className="font-bold tabular-nums tracking-tight text-text-primary" style={{ fontSize: '13px' }}>
                  {totalDistribuicao > 0 ? `${((entry.value / totalDistribuicao) * 100).toFixed(0)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Operational Widgets — 2 columns ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Proximas Contas a Pagar */}
        <div
          className="bg-surface-container-lowest overflow-hidden"
          style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}
          >
            <div>
              <h3 className="font-bold text-text-primary tracking-tight" style={{ fontSize: '15px' }}>
                Proximas Contas a Pagar
              </h3>
              <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                Obrigacoes com vencimento proximo
              </p>
            </div>
            <span
              className="font-bold text-danger tabular-nums tracking-tight bg-danger-bg"
              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px' }}
            >
              {proximasPagar.length} pendente{proximasPagar.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {[
                    { label: 'Fornecedor', align: 'left' },
                    { label: 'Vencimento', align: 'right' },
                    { label: 'Valor', align: 'right' },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`font-extrabold text-text-muted uppercase tracking-widest text-${col.align}`}
                      style={{ padding: '10px 24px', fontSize: '10px', whiteSpace: 'nowrap' }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proximasPagar.map((l, idx) => (
                  <tr
                    key={l.id}
                    className="hover:bg-table-hover transition-colors"
                    style={{
                      borderBottom: idx < proximasPagar.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <p className="font-medium text-text-primary" style={{ fontSize: '13px' }}>{l.fornecedor}</p>
                      <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '1px' }}>{l.descricao}</p>
                    </td>
                    <td
                      className={`text-right tabular-nums tracking-tight font-medium ${l.status === 'Vencido' ? 'text-danger' : 'text-text-secondary'}`}
                      style={{ padding: '14px 24px', fontSize: '13px', whiteSpace: 'nowrap' }}
                    >
                      {new Date(l.vencimento).toLocaleDateString('pt-BR')}
                      {l.status === 'Vencido' && (
                        <span
                          className="inline-flex font-bold bg-danger-bg text-danger-text uppercase"
                          style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}
                        >
                          Atrasado
                        </span>
                      )}
                    </td>
                    <td
                      className="text-right font-bold tabular-nums tracking-tight text-text-primary"
                      style={{ padding: '14px 24px', fontSize: '13px' }}
                    >
                      {formatCurrency(l.valor)}
                    </td>
                  </tr>
                ))}
                {proximasPagar.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-text-muted" style={{ padding: '32px', fontSize: '13px' }}>
                      Nenhuma conta pendente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ultimas Entradas */}
        <div
          className="bg-surface-container-lowest overflow-hidden"
          style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}
          >
            <div>
              <h3 className="font-bold text-text-primary tracking-tight" style={{ fontSize: '15px' }}>
                Ultimas Entradas
              </h3>
              <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                Receitas recentes recebidas
              </p>
            </div>
            <span
              className="font-bold text-success tabular-nums tracking-tight bg-success-bg"
              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px' }}
            >
              {ultimasEntradas.length} recebido{ultimasEntradas.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {[
                    { label: 'Cliente / Origem', align: 'left' },
                    { label: 'Data', align: 'right' },
                    { label: 'Valor', align: 'right' },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`font-extrabold text-text-muted uppercase tracking-widest text-${col.align}`}
                      style={{ padding: '10px 24px', fontSize: '10px', whiteSpace: 'nowrap' }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ultimasEntradas.map((l, idx) => (
                  <tr
                    key={l.id}
                    className="hover:bg-table-hover transition-colors"
                    style={{
                      borderBottom: idx < ultimasEntradas.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <p className="font-medium text-text-primary" style={{ fontSize: '13px' }}>{l.fornecedor}</p>
                      <p className="text-text-muted" style={{ fontSize: '11px', marginTop: '1px' }}>{l.descricao}</p>
                    </td>
                    <td
                      className="text-right tabular-nums tracking-tight font-medium text-text-secondary"
                      style={{ padding: '14px 24px', fontSize: '13px', whiteSpace: 'nowrap' }}
                    >
                      {new Date(l.data).toLocaleDateString('pt-BR')}
                      {l.status === 'Pago' && (
                        <span
                          className="inline-flex font-bold bg-success-bg text-success-text uppercase"
                          style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}
                        >
                          Recebido
                        </span>
                      )}
                    </td>
                    <td
                      className="text-right font-bold tabular-nums tracking-tight text-success"
                      style={{ padding: '14px 24px', fontSize: '13px' }}
                    >
                      +{formatCurrency(l.valor)}
                    </td>
                  </tr>
                ))}
                {ultimasEntradas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-text-muted" style={{ padding: '32px', fontSize: '13px' }}>
                      Nenhuma receita registrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
