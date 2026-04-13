import { useState, useEffect } from 'react';
import { DollarSign, Package, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import KPICard from '../components/shared/KPICard';
import { lancamentos as lancamentosApi, obras as obrasApi, solicitacoes as solicitacoesApi } from '../lib/api';
import type { LancamentoFinanceiro, Solicitacao, Obra } from '../lib/types';

const CHART_HEX = ['#004ac6', '#f59e0b', '#16a34a', '#ef4444'];

export default function Dashboard() {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);

  useEffect(() => {
    lancamentosApi.listar().then(setLancamentos).catch(() => {});
    solicitacoesApi.listar().then(setSolicitacoes).catch(() => {});
    obrasApi.listar().then(setObras).catch(() => {});
  }, []);

  const totalReceitas = lancamentos.filter(l => l.tipo === 'Receita').reduce((s, l) => s + l.valor, 0);
  const totalDespesas = lancamentos.filter(l => l.tipo === 'Despesa').reduce((s, l) => s + l.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  const totalPecas = solicitacoes.reduce((s, sol) => s + sol.fabricadoPainel + sol.fabricadoPilar + sol.fabricadoSapata, 0);
  const totalSolicitadas = solicitacoes.reduce((s, sol) => s + sol.paineis + sol.pilares + sol.sapatas, 0);

  const fluxoData = [
    { name: 'Jan', receitas: 45000, despesas: 32000 },
    { name: 'Fev', receitas: 52000, despesas: 38000 },
    { name: 'Mar', receitas: 85000, despesas: 46000 },
    { name: 'Abr', receitas: totalReceitas, despesas: totalDespesas },
  ];

  const producaoData = [
    { name: 'Fabricado', value: totalPecas },
    { name: 'Pendente', value: Math.max(0, totalSolicitadas - totalPecas) },
  ];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Page Header ── */}
      <div>
        <h1
          className="font-extrabold text-text-primary tracking-tight"
          style={{ fontSize: '28px', lineHeight: 1.2 }}
        >
          Dashboard Executivo
        </h1>
        <p
          className="text-text-secondary font-medium"
          style={{ fontSize: '14px', marginTop: '6px' }}
        >
          Visao geral da producao e saude financeira
        </p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid-kpi">
        <KPICard
          title="Saldo Geral"
          value={formatCurrency(saldo)}
          icon={<DollarSign size={24} />}
          color="text-primary"
          subtitle={`${formatCurrency(totalReceitas)} em receitas`}
        />
        <KPICard
          title="Despesas"
          value={formatCurrency(totalDespesas)}
          icon={<TrendingUp size={24} />}
          color="text-danger"
        />
        <KPICard
          title="Pecas Produzidas"
          value={totalPecas.toLocaleString('pt-BR')}
          icon={<Package size={24} />}
          color="text-success"
          subtitle={`de ${totalSolicitadas} solicitadas`}
        />
        <KPICard
          title="Obras Ativas"
          value={obras.length}
          icon={<Users size={24} />}
          color="text-warning"
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid-charts">
        {/* Fluxo de Caixa */}
        <div
          className="bg-surface-container-lowest"
          style={{
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            padding: '32px',
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: '28px' }}
          >
            <div>
              <h3
                className="font-bold text-text-primary tracking-tight"
                style={{ fontSize: '18px' }}
              >
                Fluxo de Caixa Mensal
              </h3>
              <p
                className="text-text-secondary"
                style={{ fontSize: '13px', marginTop: '4px' }}
              >
                Analise de Receitas vs Despesas Operacionais
              </p>
            </div>
            <div className="flex items-center" style={{ gap: '20px' }}>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span
                  className="rounded-full bg-primary"
                  style={{ width: '10px', height: '10px' }}
                />
                <span
                  className="font-bold text-text-muted uppercase"
                  style={{ fontSize: '10px' }}
                >
                  Receitas
                </span>
              </div>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span
                  className="rounded-full bg-secondary"
                  style={{ width: '10px', height: '10px' }}
                />
                <span
                  className="font-bold text-text-muted uppercase"
                  style={{ fontSize: '10px' }}
                >
                  Despesas
                </span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={fluxoData}>
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#004ac6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#004ac6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#515f74" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#515f74" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(195,198,215,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#737686', fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 11, fill: '#737686' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Area type="monotone" dataKey="receitas" stroke="#004ac6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceitas)" />
              <Area type="monotone" dataKey="despesas" stroke="#515f74" strokeWidth={2.5} strokeDasharray="8 4" fillOpacity={1} fill="url(#colorDespesas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuicao de Producao */}
        <div
          className="bg-surface-container-lowest flex flex-col"
          style={{
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            padding: '32px',
          }}
        >
          <h3
            className="font-bold text-text-primary tracking-tight"
            style={{ fontSize: '18px' }}
          >
            Distribuicao de Producao
          </h3>
          <p
            className="text-text-secondary"
            style={{ fontSize: '13px', marginTop: '4px', marginBottom: '24px' }}
          >
            Volume por categoria de estrutura
          </p>

          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={producaoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {producaoData.map((_, index) => (
                    <Cell key={index} fill={CHART_HEX[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginTop: '20px',
            }}
          >
            {producaoData.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: '12px' }}>
                  <span
                    className="rounded-sm"
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: CHART_HEX[i],
                    }}
                  />
                  <span
                    className="font-semibold text-text-primary"
                    style={{ fontSize: '14px' }}
                  >
                    {entry.name}
                  </span>
                </div>
                <span
                  className="font-bold text-text-primary tabular-nums"
                  style={{ fontSize: '14px' }}
                >
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Ultimas Obras Ativas ── */}
      <div
        className="bg-surface-container-lowest overflow-hidden"
        style={{
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Table header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <h3
              className="font-bold text-text-primary tracking-tight"
              style={{ fontSize: '18px' }}
            >
              Ultimas Obras Ativas
            </h3>
            <p
              className="text-text-secondary"
              style={{ fontSize: '13px', marginTop: '4px' }}
            >
              Status de cronograma e execucao em tempo real
            </p>
          </div>
          <span
            className="font-bold text-text-muted uppercase tracking-wider"
            style={{ fontSize: '11px' }}
          >
            {obras.length} obras
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '700px' }}>
            <thead>
              <tr className="bg-surface-container-low">
                {['Obra', 'Cliente', 'Local', 'Paineis', 'Pilares', 'Sapatas'].map(col => (
                  <th
                    key={col}
                    className="text-left font-extrabold text-text-muted uppercase tracking-widest"
                    style={{ padding: '16px 32px', fontSize: '11px' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {obras.map((obra, idx) => (
                <tr
                  key={obra.id}
                  className="hover:bg-table-hover transition-colors"
                  style={{
                    borderBottom: idx < obras.length - 1
                      ? '1px solid var(--color-border)'
                      : 'none',
                  }}
                >
                  <td
                    className="font-bold text-text-primary"
                    style={{ padding: '18px 32px', fontSize: '14px' }}
                  >
                    {obra.nome}
                  </td>
                  <td
                    className="text-text-secondary"
                    style={{ padding: '18px 32px', fontSize: '14px' }}
                  >
                    {obra.cliente}
                  </td>
                  <td
                    className="text-text-secondary"
                    style={{ padding: '18px 32px', fontSize: '14px' }}
                  >
                    {obra.local}
                  </td>
                  <td
                    className="font-bold text-text-primary tabular-nums"
                    style={{ padding: '18px 32px', fontSize: '14px' }}
                  >
                    {obra.paineisMin}
                  </td>
                  <td
                    className="font-bold text-text-primary tabular-nums"
                    style={{ padding: '18px 32px', fontSize: '14px' }}
                  >
                    {obra.pilaresMin}
                  </td>
                  <td
                    className="font-bold text-text-primary tabular-nums"
                    style={{ padding: '18px 32px', fontSize: '14px' }}
                  >
                    {obra.sapatasMin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Alertas ── */}
      {lancamentos.filter(l => l.status === 'Vencido').length > 0 && (
        <div
          className="bg-warning-bg flex items-start"
          style={{
            borderRadius: '10px',
            border: '1px solid var(--color-warning-bright)',
            borderColor: 'rgba(245, 158, 11, 0.25)',
            padding: '20px 24px',
            gap: '14px',
          }}
        >
          <AlertTriangle size={22} className="text-warning shrink-0" style={{ marginTop: '1px' }} />
          <div>
            <p
              className="font-bold text-warning-text"
              style={{ fontSize: '14px' }}
            >
              Contas Vencidas
            </p>
            <p
              className="text-warning-text"
              style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}
            >
              Existem {lancamentos.filter(l => l.status === 'Vencido').length} lancamento(s) com vencimento ultrapassado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
