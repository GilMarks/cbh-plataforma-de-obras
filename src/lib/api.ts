/**
 * api.ts — Camada REST para o backend CBH (FastAPI).
 *
 * Responsabilidades:
 *  - Gerenciar tokens JWT (access em memória, refresh em localStorage)
 *  - Auto-refresh ao receber 401
 *  - Converter snake_case do backend → camelCase do frontend
 *  - Expor métodos tipados por módulo
 */

import type {
  Usuario, Obra, Solicitacao, SolicitacaoCompra, Processo,
  LancamentoFinanceiro, Banco, Insumo, Fornecedor, Carregamento,
  Montagem, MovimentacaoEstoque, Ferramenta, FuncionarioRH,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Token management ─────────────────────────────────────────────────────────

let accessToken: string | null = null;

// Promise de inicialização — restaura accessToken via refresh token.
// Reutiliza a mesma promise enquanto uma tentativa estiver em andamento.
let _sessionPromise: Promise<void> | null = null;

function doRefresh(): Promise<void> {
  const rt = localStorage.getItem('cbh_refresh_token');
  if (!rt) return Promise.resolve();
  return fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
  }).then(res => {
    if (res.ok) {
      return res.json().then((data: { access_token: string }) => {
        accessToken = data.access_token;
      });
    } else {
      localStorage.removeItem('cbh_refresh_token');
      localStorage.removeItem('cbh_current_user');
    }
  }).catch(() => {
    // sem conexão — mantém estado atual
  });
}

// Inicialização no carregamento do módulo
_sessionPromise = doRefresh().finally(() => { _sessionPromise = null; });

export function ensureSession(): Promise<void> {
  // Se já temos accessToken, nada a fazer
  if (accessToken) return Promise.resolve();
  // Se já há uma tentativa em andamento, aguarda
  if (_sessionPromise) return _sessionPromise;
  // Tenta restaurar via refresh token
  _sessionPromise = doRefresh().finally(() => { _sessionPromise = null; });
  return _sessionPromise;
}

export function hasAccessToken(): boolean {
  return !!accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('cbh_refresh_token');
}

function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem('cbh_refresh_token', token);
  } else {
    localStorage.removeItem('cbh_refresh_token');
  }
}

export function clearAuth() {
  setAccessToken(null);
  setRefreshToken(null);
  localStorage.removeItem('cbh_current_user');
}

// ─── Conversores snake_case ↔ camelCase ───────────────────────────────────────

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toSnake(s: string): string {
  return s.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function mapKeys(obj: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(obj)) return obj.map(v => mapKeys(v, fn));
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [fn(k), mapKeys(v, fn)])
    );
  }
  return obj;
}

const fromApi = <T>(data: unknown): T => mapKeys(data, toCamel) as T;
const toApi = (data: unknown): unknown => mapKeys(data, toSnake);

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: getRefreshToken() }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.access_token);
    return true;
  } catch {
    return false;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  await ensureSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } else {
      clearAuth();
      window.location.href = '/login';
      throw new Error('Sessao expirada');
    }
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  const raw = await response.json();
  return fromApi<T>(raw);
}

function body(data: unknown): string {
  return JSON.stringify(toApi(data));
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(loginStr: string, senha: string): Promise<Usuario> {
  const raw = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginStr, senha }),
  });

  if (!raw.ok) {
    const err = await raw.json().catch(() => ({ detail: 'Credenciais inválidas' }));
    throw new Error(err.detail || 'Credenciais inválidas');
  }

  const data = await raw.json();
  setAccessToken(data.access_token);
  setRefreshToken(data.refresh_token);

  // Mapeia o usuário e persiste para AppLayout / Topbar
  const user = fromApi<Usuario>(data.user);
  localStorage.setItem('cbh_current_user', JSON.stringify(user));
  return user;
}

export async function apiLogout() {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  clearAuth();
}

// ─── Obras ────────────────────────────────────────────────────────────────────

export const obras = {
  listar: () => apiFetch<Obra[]>('/obras'),
  buscar: (id: number) => apiFetch<Obra>(`/obras/${id}`),
  criar: (data: Omit<Obra, 'id'>) => apiFetch<Obra>('/obras', { method: 'POST', body: body(data) }),
  atualizar: (id: number, data: Partial<Obra>) =>
    apiFetch<Obra>(`/obras/${id}`, { method: 'PUT', body: body(data) }),
  remover: (id: number) => apiFetch<{ ok: boolean }>(`/obras/${id}`, { method: 'DELETE' }),
  progresso: (id: number) => apiFetch<unknown>(`/obras/${id}/progresso`),
};

// ─── Solicitações de Fabricação ───────────────────────────────────────────────

export const solicitacoes = {
  listar: (params?: { obraId?: number; statusAutorizacao?: string }) => {
    const q = new URLSearchParams();
    if (params?.obraId) q.set('obra_id', String(params.obraId));
    if (params?.statusAutorizacao) q.set('status_autorizacao', params.statusAutorizacao);
    return apiFetch<Solicitacao[]>(`/solicitacoes?${q}`);
  },
  buscar: (id: number) => apiFetch<Solicitacao>(`/solicitacoes/${id}`),
  criar: (data: unknown) =>
    apiFetch<Solicitacao>('/solicitacoes', { method: 'POST', body: body(data) }),
  remover: (id: number) =>
    apiFetch<{ ok: boolean }>(`/solicitacoes/${id}`, { method: 'DELETE' }),
};

// ─── Fábrica ──────────────────────────────────────────────────────────────────

export const fabrica = {
  listarProducao: () => apiFetch<Solicitacao[]>('/fabrica/producao'),
  lancarProducao: (solicitacaoId: number, tipo: string, quantidade: number) =>
    apiFetch<Solicitacao>(`/fabrica/producao/${solicitacaoId}/lancar`, {
      method: 'POST',
      body: JSON.stringify({ tipo, quantidade }),
    }),
  historico: (params?: { tipo?: string; dataInicio?: string; dataFim?: string }) => {
    const q = new URLSearchParams();
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.dataInicio) q.set('data_inicio', params.dataInicio);
    if (params?.dataFim) q.set('data_fim', params.dataFim);
    return apiFetch<unknown[]>(`/fabrica/historico?${q}`);
  },
  estoque: (params?: { obraId?: number; tipo?: string }) => {
    const q = new URLSearchParams();
    if (params?.obraId) q.set('obra_id', String(params.obraId));
    if (params?.tipo) q.set('tipo', params.tipo);
    return apiFetch<unknown[]>(`/fabrica/estoque?${q}`);
  },
};

// ─── Carregamentos ────────────────────────────────────────────────────────────

export const carregamentos = {
  listar: (params?: { obraId?: number; status?: string; statusAutorizacao?: string }) => {
    const q = new URLSearchParams();
    if (params?.obraId) q.set('obra_id', String(params.obraId));
    if (params?.status) q.set('status', params.status);
    if (params?.statusAutorizacao) q.set('status_autorizacao', params.statusAutorizacao);
    return apiFetch<Carregamento[]>(`/carregamentos?${q}`);
  },
  buscar: (id: number) => apiFetch<Carregamento>(`/carregamentos/${id}`),
  criar: (data: unknown) =>
    apiFetch<Carregamento>('/carregamentos', { method: 'POST', body: body(data) }),
  executar: (id: number) =>
    apiFetch<Carregamento>(`/carregamentos/${id}/executar`, { method: 'POST' }),
  fabrica: () => apiFetch<Carregamento[]>('/carregamentos/fabrica'),
  disponiveis: (obraId: number) =>
    apiFetch<unknown[]>(`/carregamentos/disponiveis?obra_id=${obraId}`),
};

// ─── Montagens ────────────────────────────────────────────────────────────────

export const montagens = {
  listar: (params?: { obraId?: number; carregamentoId?: number }) => {
    const q = new URLSearchParams();
    if (params?.obraId) q.set('obra_id', String(params.obraId));
    if (params?.carregamentoId) q.set('carregamento_id', String(params.carregamentoId));
    return apiFetch<Montagem[]>(`/montagens?${q}`);
  },
  registrar: (data: unknown) =>
    apiFetch<Montagem[]>('/montagens', { method: 'POST', body: body(data) }),
  carregamentosDisponiveis: () => apiFetch<Carregamento[]>('/montagens/carregamentos-disponiveis'),
};

// ─── Autorização ──────────────────────────────────────────────────────────────

export const autorizacao = {
  pendencias: () => apiFetch<{ compras: number; fabricacao: number; logistica: number; total: number }>('/autorizacao/pendencias'),
  compras: () => apiFetch<SolicitacaoCompra[]>('/autorizacao/compras'),
  aprovarCompra: (id: number) =>
    apiFetch<SolicitacaoCompra>(`/autorizacao/compras/${id}/aprovar`, { method: 'POST' }),
  negarCompra: (id: number) =>
    apiFetch<SolicitacaoCompra>(`/autorizacao/compras/${id}/negar`, { method: 'POST' }),
  fabricacao: () => apiFetch<Solicitacao[]>('/autorizacao/fabricacao'),
  aprovarFabricacao: (id: number) =>
    apiFetch<Solicitacao>(`/autorizacao/fabricacao/${id}/aprovar`, { method: 'POST' }),
  negarFabricacao: (id: number) =>
    apiFetch<Solicitacao>(`/autorizacao/fabricacao/${id}/negar`, { method: 'POST' }),
  logistica: () => apiFetch<Carregamento[]>('/autorizacao/logistica'),
  aprovarLogistica: (id: number) =>
    apiFetch<Carregamento>(`/autorizacao/logistica/${id}/aprovar`, { method: 'POST' }),
  negarLogistica: (id: number) =>
    apiFetch<Carregamento>(`/autorizacao/logistica/${id}/negar`, { method: 'POST' }),
};

// ─── Solicitações de Compra ───────────────────────────────────────────────────

export const solicitacoesCompra = {
  listar: (params?: { obraId?: number; statusFluxo?: string }) => {
    const q = new URLSearchParams();
    if (params?.obraId) q.set('obra_id', String(params.obraId));
    if (params?.statusFluxo) q.set('status_fluxo', params.statusFluxo);
    return apiFetch<SolicitacaoCompra[]>(`/solicitacoes-compra?${q}`);
  },
  buscar: (id: number) => apiFetch<SolicitacaoCompra>(`/solicitacoes-compra/${id}`),
  criar: (data: unknown) =>
    apiFetch<SolicitacaoCompra>('/solicitacoes-compra', { method: 'POST', body: body(data) }),
  salvarCotacao: (id: number, data: unknown) =>
    apiFetch<SolicitacaoCompra>(`/solicitacoes-compra/${id}/cotacao`, {
      method: 'PUT', body: body(data),
    }),
  enviarAutorizacao: (id: number) =>
    apiFetch<{ solicitacao: SolicitacaoCompra; processo: Processo }>(
      `/solicitacoes-compra/${id}/enviar-autorizacao`,
      { method: 'POST' },
    ),
  remover: (id: number) =>
    apiFetch<{ ok: boolean }>(`/solicitacoes-compra/${id}`, { method: 'DELETE' }),
};

// ─── Processos ────────────────────────────────────────────────────────────────

export const processos = {
  listar: (params?: { status?: string }) => {
    const q = params?.status ? `?status=${params.status}` : '';
    return apiFetch<Processo[]>(`/processos${q}`);
  },
  buscar: (id: number) => apiFetch<Processo>(`/processos/${id}`),
};

// ─── Financeiro ───────────────────────────────────────────────────────────────

export const lancamentos = {
  listar: (params?: { tipo?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.status) q.set('status', params.status);
    return apiFetch<LancamentoFinanceiro[]>(`/lancamentos?${q}`);
  },
  buscar: (id: number) => apiFetch<LancamentoFinanceiro>(`/lancamentos/${id}`),
  criar: (data: unknown) =>
    apiFetch<LancamentoFinanceiro>('/lancamentos', { method: 'POST', body: body(data) }),
  pagar: (id: number, data: { bancoId: number; dataPagamento?: string; valorPago?: number }) =>
    apiFetch<LancamentoFinanceiro>(`/lancamentos/${id}/pagar`, {
      method: 'POST', body: body(data),
    }),
  dashboard: () => apiFetch<unknown>('/lancamentos/dashboard'),
};

// ─── Bancos ───────────────────────────────────────────────────────────────────

export const bancos = {
  listar: () => apiFetch<Banco[]>('/bancos'),
  buscar: (id: number) => apiFetch<Banco>(`/bancos/${id}`),
  criar: (data: unknown) => apiFetch<Banco>('/bancos', { method: 'POST', body: body(data) }),
  atualizar: (id: number, data: unknown) =>
    apiFetch<Banco>(`/bancos/${id}`, { method: 'PUT', body: body(data) }),
  remover: (id: number) => apiFetch<{ ok: boolean }>(`/bancos/${id}`, { method: 'DELETE' }),
};

// ─── Insumos ──────────────────────────────────────────────────────────────────

export const insumos = {
  listar: () => apiFetch<Insumo[]>('/insumos'),
  criar: (data: unknown) => apiFetch<Insumo>('/insumos', { method: 'POST', body: body(data) }),
  atualizar: (id: number, data: unknown) =>
    apiFetch<Insumo>(`/insumos/${id}`, { method: 'PUT', body: body(data) }),
  remover: (id: number) => apiFetch<{ ok: boolean }>(`/insumos/${id}`, { method: 'DELETE' }),
  movimentar: (id: number, data: unknown) =>
    apiFetch<{ insumo: Insumo; movimentacao: MovimentacaoEstoque }>(
      `/insumos/${id}/movimentar`,
      { method: 'POST', body: body(data) },
    ),
};

// ─── Fornecedores ─────────────────────────────────────────────────────────────

export const fornecedores = {
  listar: () => apiFetch<Fornecedor[]>('/fornecedores'),
  criar: (data: unknown) =>
    apiFetch<Fornecedor>('/fornecedores', { method: 'POST', body: body(data) }),
  atualizar: (id: number, data: unknown) =>
    apiFetch<Fornecedor>(`/fornecedores/${id}`, { method: 'PUT', body: body(data) }),
  remover: (id: number) =>
    apiFetch<{ ok: boolean }>(`/fornecedores/${id}`, { method: 'DELETE' }),
};

// ─── Movimentações de Estoque ─────────────────────────────────────────────────

export const movimentacoesEstoque = {
  historico: (params?: { insumoId?: number; tipo?: string; dataInicio?: string; dataFim?: string }) => {
    const q = new URLSearchParams();
    if (params?.insumoId) q.set('insumo_id', String(params.insumoId));
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.dataInicio) q.set('data_inicio', params.dataInicio);
    if (params?.dataFim) q.set('data_fim', params.dataFim);
    return apiFetch<MovimentacaoEstoque[]>(`/movimentacoes-estoque?${q}`);
  },
  kpis: () => apiFetch<{ totalEntradas: number; totalSaidas: number; totalMovimentacoes: number }>('/movimentacoes-estoque/kpis'),
};

// ─── Ferramentas ──────────────────────────────────────────────────────────────

export const ferramentas = {
  listar: () => apiFetch<Ferramenta[]>('/ferramentas'),
  criar: (data: unknown) =>
    apiFetch<Ferramenta>('/ferramentas', { method: 'POST', body: body(data) }),
  atualizar: (id: number, data: unknown) =>
    apiFetch<Ferramenta>(`/ferramentas/${id}`, { method: 'PUT', body: body(data) }),
  remover: (id: number) =>
    apiFetch<{ ok: boolean }>(`/ferramentas/${id}`, { method: 'DELETE' }),
  emprestar: (id: number, responsavel: string) =>
    apiFetch<Ferramenta>(`/ferramentas/${id}/emprestar`, {
      method: 'POST', body: JSON.stringify({ responsavel }),
    }),
  devolver: (id: number) =>
    apiFetch<Ferramenta>(`/ferramentas/${id}/devolver`, { method: 'POST' }),
};

// ─── Funcionários RH ──────────────────────────────────────────────────────────

export const funcionariosRH = {
  listar: (busca?: string) => {
    const q = busca ? `?busca=${encodeURIComponent(busca)}` : '';
    return apiFetch<FuncionarioRH[]>(`/funcionarios-rh${q}`);
  },
  buscar: (id: number) => apiFetch<FuncionarioRH>(`/funcionarios-rh/${id}`),
  criar: (data: unknown) =>
    apiFetch<FuncionarioRH>('/funcionarios-rh', { method: 'POST', body: body(data) }),
  atualizar: (id: number, data: unknown) =>
    apiFetch<FuncionarioRH>(`/funcionarios-rh/${id}`, { method: 'PUT', body: body(data) }),
  remover: (id: number) =>
    apiFetch<{ ok: boolean }>(`/funcionarios-rh/${id}`, { method: 'DELETE' }),
};

// ─── Usuários ─────────────────────────────────────────────────────────────────

export const usuarios = {
  listar: () => apiFetch<Usuario[]>('/usuarios'),
  buscar: (id: number) => apiFetch<Usuario>(`/usuarios/${id}`),
  criar: (data: unknown) => apiFetch<Usuario>('/usuarios', { method: 'POST', body: body(data) }),
  atualizar: (id: number, data: unknown) =>
    apiFetch<Usuario>(`/usuarios/${id}`, { method: 'PUT', body: body(data) }),
  toggleAtivo: (id: number) =>
    apiFetch<Usuario>(`/usuarios/${id}/toggle-ativo`, { method: 'PATCH' }),
  remover: (id: number) => apiFetch<{ ok: boolean }>(`/usuarios/${id}`, { method: 'DELETE' }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboard = {
  geral: () => apiFetch<unknown>('/dashboard'),
};
