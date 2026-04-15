import { useState, useEffect } from 'react';
import { DollarSign, Package, Building2, TrendingDown, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import KPICard from '../components/shared/KPICard';
import StatusBadge from '../components/shared/StatusBadge';
import { lancamentos as lancamentosApi, obras as obrasApi, solicitacoes as solicitacoesApi } from '../lib/api';
import type { LancamentoFinanceiro, Solicitacao, Obra } from '../lib/types';

const CHART_PRIMARY = 'var(--color-primary)';
const CHART_SECONDARY = 'var(--color-text-secondary)';
const CHART_TICK = 'var(--color-text-muted)';
const CHART_GRID = 'var(--color-border)';

const TOOLTIP_STYLE = {
  background: 'var(--color-surface-container-lowest)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
  color: 'var(--color-text-primary)',
  fontSize: '13px',
};
const TOOLTIP_LABEL_STYLE = { color: 'var(--color-text-muted)', fontWeight: 600 };
const TOOLTIP_ITEM_STYLE = { color: 'var(--color-text-primary)' };

function getObraStatus(obra: Obra, solicitacoes: Solicitacao[]): string {
  const obraSols = solicitacoes.filter(s => s.obraId === obra.id);
  const fabricado = obraSols.reduce((s, sol) => s + sol.fabricadoPainel + sol.fabricadoPilar + sol.fabricadoSapata, 0);
  const total = obraSols.reduce((s, sol) => s + sol.paineis + sol.pilares + sol.sapatas, 0);
  if (total === 0) return 'Aguardando';
  if (fabricado === 0) return 'Aguardando';
  if (fabricado >= total) return 'Concluida';
  return 'Em Andamento';
}

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

  const totalPaineis = solicitacoes.reduce((s, sol) => s + sol.paineis, 0);
  const totalPilares = solicitacoes.reduce((s, sol) => s + sol.pilares, 0);
  const totalSapatas = solicitacoes.reduce((s, sol) => s + sol.sapatas, 0);
  const fabPaineis = solicitacoes.reduce((s, sol) => s + sol.fabricadoPainel, 0);
  const fabPilares = solicitacoes.reduce((s, sol) => s + sol.fabricadoPilar, 0);
  const fabSapatas = solicitacoes.reduce((s, sol) => s + sol.fabricadoSapata, 0);

  const producaoBarData = [
    { name: 'Paineis', fabricado: fabPaineis, total: totalPaineis },
    { name: 'Pilares', fabricado: fabPilares, total: totalPilares },
    { name: 'Sapatas', fabricado: fabSapatas, total: totalSapatas },
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
          icon={<TrendingDown size={24} />}
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
          icon={<Building2 size={24} />}
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
                  <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_SECONDARY} stopOpacity={0.08} />
                  <stop offset="95%" stopColor={CHART_SECONDARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART_TICK, fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 11, fill: CHART_TICK }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
              <Area type="monotone" dataKey="receitas" stroke={CHART_PRIMARY} strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceitas)" />
              <Area type="monotone" dataKey="despesas" stroke={CHART_SECONDARY} strokeWidth={2.5} strokeDasharray="8 4" fillOpacity={1} fill="url(#colorDespesas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Producao por Tipo */}
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
            Producao por Tipo
          </h3>
          <p
            className="text-text-secondary"
            style={{ fontSize: '13px', marginTop: '4px', marginBottom: '24px' }}
          >
            Fabricado vs solicitado por categoria
          </p>

          <div className="flex-1 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={producaoBarData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: CHART_TICK }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: CHART_TICK, fontWeight: 600 }} width={70} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}
                />
                <Bar dataKey="fabricado" name="Fabricado" fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} />
                <Bar dataKey="total" name="Solicitado" fill={CHART_GRID} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Radar: Produção por Obra ── */}
      {obras.length > 0 && (() => {
        const radarData = [
          { metric: 'Painéis', ...Object.fromEntries(obras.slice(0, 5).map(o => {
            const sols = solicitacoes.filter(s => s.obraId === o.id);
            return [o.nome.slice(0, 12), sols.reduce((sum, s) => sum + s.fabricadoPainel, 0)];
          })) },
          { metric: 'Pilares', ...Object.fromEntries(obras.slice(0, 5).map(o => {
            const sols = solicitacoes.filter(s => s.obraId === o.id);
            return [o.nome.slice(0, 12), sols.reduce((sum, s) => sum + s.fabricadoPilar, 0)];
          })) },
          { metric: 'Sapatas', ...Object.fromEntries(obras.slice(0, 5).map(o => {
            const sols = solicitacoes.filter(s => s.obraId === o.id);
            return [o.nome.slice(0, 12), sols.reduce((sum, s) => sum + s.fabricadoSapata, 0)];
          })) },
        ];
        const RADAR_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#0ea5e9'];
        const obraNames = obras.slice(0, 5).map(o => o.nome.slice(0, 12));
        return (
          <div
            className="bg-surface-container-lowest"
            style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '28px 32px' }}
          >
            <div style={{ marginBottom: '24px' }}>
              <h3 className="font-bold text-text-primary" style={{ fontSize: '18px' }}>Produção por Obra</h3>
              <p className="text-text-secondary" style={{ fontSize: '13px', marginTop: '4px' }}>
                Comparativo de peças fabricadas entre obras ativas — painéis, pilares e sapatas
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={CHART_GRID} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: CHART_TICK, fontWeight: 600 }} />
                  {obraNames.map((name, i) => (
                    <Radar key={name} name={name} dataKey={name} stroke={RADAR_COLORS[i % RADAR_COLORS.length]} fill={RADAR_COLORS[i % RADAR_COLORS.length]} fillOpacity={0.08} strokeWidth={2} dot={{ r: 3, fill: RADAR_COLORS[i % RADAR_COLORS.length] }} />
                  ))}
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Legenda manual */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {obraNames.map((name, i) => {
                  const sols = solicitacoes.filter(s => s.obraId === obras[i]?.id);
                  const paineis = sols.reduce((sum, s) => sum + s.fabricadoPainel, 0);
                  const pilares = sols.reduce((sum, s) => sum + s.fabricadoPilar, 0);
                  const sapatas = sols.reduce((sum, s) => sum + s.fabricadoSapata, 0);
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: RADAR_COLORS[i % RADAR_COLORS.length], flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{obras[i]?.nome}</p>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {paineis}P · {pilares}Pi · {sapatas}S fabricados
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

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
          <table className="w-full" style={{ minWidth: '800px' }}>
            <thead>
              <tr className="bg-surface-container-low">
                {['Obra', 'Cliente', 'Local', 'Paineis', 'Pilares', 'Sapatas', 'Status'].map(col => (
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
              {obras.map((obra, idx) => {
                const status = getObraStatus(obra, solicitacoes);
                return (
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
                    <td style={{ padding: '18px 32px' }}>
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                );
              })}
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
