import { STORAGE_KEYS, type Usuario, type Obra, type Solicitacao, type LancamentoFinanceiro, type Banco, type Processo, type SolicitacaoCompra, type Fornecedor, type Insumo, type Carregamento, type Montagem, type MovimentacaoEstoque, type Ferramenta, type FuncionarioRH } from './types';

// === CRUD Generico ===

export function getAll<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function getById<T extends { id: number }>(key: string, id: number): T | undefined {
  return getAll<T>(key).find(item => item.id === id);
}

function getNextId<T extends { id: number }>(key: string): number {
  const items = getAll<T>(key);
  if (items.length === 0) return 1;
  return Math.max(...items.map(i => i.id)) + 1;
}

export function create<T extends { id: number }>(key: string, item: Omit<T, 'id'>): T {
  const items = getAll<T>(key);
  const newItem = { ...item, id: getNextId<T>(key) } as T;
  items.push(newItem);
  localStorage.setItem(key, JSON.stringify(items));
  return newItem;
}

export function update<T extends { id: number }>(key: string, id: number, updates: Partial<T>): T | undefined {
  const items = getAll<T>(key);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return undefined;
  items[index] = { ...items[index], ...updates };
  localStorage.setItem(key, JSON.stringify(items));
  return items[index];
}

export function remove<T extends { id: number }>(key: string, id: number): boolean {
  const items = getAll<T>(key);
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length === items.length) return false;
  localStorage.setItem(key, JSON.stringify(filtered));
  return true;
}

// === Sessao ===

export function getCurrentUser(): Usuario | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function setCurrentUser(user: Usuario): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// === Seed ===

const SEED_VERSION = '6';

export function seedDatabase(): void {
  if (localStorage.getItem('cbh_seeded') === SEED_VERSION) return;
  // Limpa dados antigos ao atualizar seed
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  localStorage.removeItem('cbh_seeded');

  // Usuarios
  const usuarios: Usuario[] = [
    { id: 1, login: 'admin', senha: 'admin123', tipo: 'Master', cargo: 'Master', ativo: 1, foto: '' },
    { id: 5, login: 'Walason', senha: '123456', tipo: 'Master', cargo: 'Master', ativo: 1, foto: '' },
    { id: 2, login: 'Carlos', senha: '123456', tipo: 'Usuario', cargo: 'Mestre', ativo: 1, foto: '' },
    { id: 3, login: 'Ana', senha: '123456', tipo: 'Usuario', cargo: 'Financeiro', ativo: 1, foto: '' },
    { id: 4, login: 'Pedro', senha: '123456', tipo: 'Usuario', cargo: 'Compras', ativo: 1, foto: '' },
    { id: 6, login: 'Joao', senha: '123456', tipo: 'Usuario', cargo: 'Ferreiro', ativo: 1, foto: '' },
    { id: 7, login: 'Maria', senha: '123456', tipo: 'Usuario', cargo: 'Betoneira', ativo: 1, foto: '' },
  ];
  localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));

  // Obras (5 total: 3 ativas, 1 nova, 1 concluida)
  const obras: Obra[] = [
    { id: 1, nome: 'Residencial Aurora', cliente: 'Construtora Alpha', local: 'Sao Paulo, SP', observacoes: 'Prazo: 6 meses', paineisMin: 120, pilaresMin: 60, sapatasMin: 60 },
    { id: 2, nome: 'Edificio Horizon', cliente: 'Beta Engenharia', local: 'Campinas, SP', observacoes: '', paineisMin: 200, pilaresMin: 100, sapatasMin: 100 },
    { id: 3, nome: 'Centro Logistico Sul', cliente: 'LogTech Brasil', local: 'Curitiba, PR', observacoes: 'Fase 2', paineisMin: 80, pilaresMin: 40, sapatasMin: 40 },
    { id: 4, nome: 'Parque Empresarial Norte', cliente: 'GrupoNB', local: 'Brasilia, DF', observacoes: 'Inicio previsto: Mai/2026', paineisMin: 160, pilaresMin: 80, sapatasMin: 80 },
    { id: 5, nome: 'Condominio Villa Verde', cliente: 'Incorporadora Verde', local: 'Porto Alegre, RS', observacoes: 'Obra concluida', paineisMin: 90, pilaresMin: 45, sapatasMin: 45 },
  ];
  localStorage.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(obras));

  // Solicitacoes (5 total — cobrem todos os estados do workflow de fabricacao)
  const solicitacoes: Solicitacao[] = [
    // Sol 1: Aurora — fabricacao em andamento (Parcial)
    {
      id: 1, obraId: 1, obraNome: 'Residencial Aurora', clienteNome: 'Construtora Alpha',
      paineis: 120, painelComp: 5, painelAlt: 3, tipoPainel: 'Liso', raPainel: 'T20',
      statusPainel: 'Parcial', fabricadoPainel: 64, saldoPainel: 56,
      historicoPainel: [
        { data: '2026-03-15', qtd: 20, responsavel: 'Carlos' },
        { data: '2026-03-22', qtd: 22, responsavel: 'Carlos' },
        { data: '2026-04-01', qtd: 12, responsavel: 'Joao' },
        { data: '2026-04-08', qtd: 10, responsavel: 'Carlos' },
      ],
      pilares: 60, pilarAlt: 3, bainhaPilar: 1,
      statusPilar: 'Parcial', fabricadoPilar: 36, saldoPilar: 24,
      historicoPilar: [
        { data: '2026-03-20', qtd: 20, responsavel: 'Joao' },
        { data: '2026-04-03', qtd: 16, responsavel: 'Carlos' },
      ],
      sapatas: 60, tamanhoSapata: 'Grande', tipoSapata: 'Normal',
      statusSapata: 'Parcial', fabricadoSapata: 45, saldoSapata: 15,
      historicoSapata: [
        { data: '2026-03-18', qtd: 25, responsavel: 'Maria' },
        { data: '2026-03-28', qtd: 20, responsavel: 'Maria' },
      ],
      data: '2026-04-08', observacoes: 'Urgente — prazo apertado', solicitante: 'Carlos', cargoSolicitante: 'Mestre',
      dataSolicitacaoRegistro: '2026-03-10', statusAutorizacao: 'Autorizado',
      autorizadoPor: 'Walason', dataAutorizacao: '2026-03-11',
    },
    // Sol 2: Horizon — aguardando autorizacao do Master
    {
      id: 2, obraId: 2, obraNome: 'Edificio Horizon', clienteNome: 'Beta Engenharia',
      paineis: 80, painelComp: 4, painelAlt: 2.5, tipoPainel: 'Carimbado', raPainel: 'T30',
      statusPainel: 'Pendente', fabricadoPainel: 0, saldoPainel: 80,
      historicoPainel: [],
      pilares: 40, pilarAlt: 2.5, bainhaPilar: 0,
      statusPilar: 'Pendente', fabricadoPilar: 0, saldoPilar: 40,
      historicoPilar: [],
      sapatas: 40, tamanhoSapata: 'Pequena', tipoSapata: 'Canto',
      statusSapata: 'Pendente', fabricadoSapata: 0, saldoSapata: 40,
      historicoSapata: [],
      data: '2026-04-10', observacoes: '', solicitante: 'Carlos', cargoSolicitante: 'Mestre',
      dataSolicitacaoRegistro: '2026-04-05', statusAutorizacao: 'Aguardando',
      autorizadoPor: '', dataAutorizacao: '',
    },
    // Sol 3: Centro Logistico — autorizado, fabricacao iniciada
    {
      id: 3, obraId: 3, obraNome: 'Centro Logistico Sul', clienteNome: 'LogTech Brasil',
      paineis: 80, painelComp: 6, painelAlt: 3, tipoPainel: 'Liso', raPainel: 'T20',
      statusPainel: 'Parcial', fabricadoPainel: 20, saldoPainel: 60,
      historicoPainel: [
        { data: '2026-04-07', qtd: 10, responsavel: 'Carlos' },
        { data: '2026-04-09', qtd: 10, responsavel: 'Joao' },
      ],
      pilares: 40, pilarAlt: 3.5, bainhaPilar: 1,
      statusPilar: 'Pendente', fabricadoPilar: 0, saldoPilar: 40,
      historicoPilar: [],
      sapatas: 40, tamanhoSapata: 'Grande', tipoSapata: 'Normal',
      statusSapata: 'Parcial', fabricadoSapata: 12, saldoSapata: 28,
      historicoSapata: [
        { data: '2026-04-08', qtd: 12, responsavel: 'Maria' },
      ],
      data: '2026-04-09', observacoes: 'Fase 2 do contrato', solicitante: 'Carlos', cargoSolicitante: 'Mestre',
      dataSolicitacaoRegistro: '2026-04-01', statusAutorizacao: 'Autorizado',
      autorizadoPor: 'Walason', dataAutorizacao: '2026-04-02',
    },
    // Sol 4: Parque Empresarial — aguardando autorizacao
    {
      id: 4, obraId: 4, obraNome: 'Parque Empresarial Norte', clienteNome: 'GrupoNB',
      paineis: 160, painelComp: 5, painelAlt: 4, tipoPainel: 'Liso', raPainel: 'T30',
      statusPainel: 'Pendente', fabricadoPainel: 0, saldoPainel: 160,
      historicoPainel: [],
      pilares: 80, pilarAlt: 4, bainhaPilar: 1,
      statusPilar: 'Pendente', fabricadoPilar: 0, saldoPilar: 80,
      historicoPilar: [],
      sapatas: 80, tamanhoSapata: 'Grande', tipoSapata: 'Excentrica',
      statusSapata: 'Pendente', fabricadoSapata: 0, saldoSapata: 80,
      historicoSapata: [],
      data: '2026-04-11', observacoes: 'Aguardando inicio da obra no local', solicitante: 'Carlos', cargoSolicitante: 'Mestre',
      dataSolicitacaoRegistro: '2026-04-11', statusAutorizacao: 'Aguardando',
      autorizadoPor: '', dataAutorizacao: '',
    },
    // Sol 5: Villa Verde — 100% fabricado (historico concluido)
    {
      id: 5, obraId: 5, obraNome: 'Condominio Villa Verde', clienteNome: 'Incorporadora Verde',
      paineis: 90, painelComp: 4, painelAlt: 2.8, tipoPainel: 'Carimbado', raPainel: 'T20',
      statusPainel: 'Fabricado', fabricadoPainel: 90, saldoPainel: 0,
      historicoPainel: [
        { data: '2026-01-10', qtd: 30, responsavel: 'Carlos' },
        { data: '2026-01-20', qtd: 30, responsavel: 'Joao' },
        { data: '2026-01-28', qtd: 30, responsavel: 'Carlos' },
      ],
      pilares: 45, pilarAlt: 2.8, bainhaPilar: 0,
      statusPilar: 'Fabricado', fabricadoPilar: 45, saldoPilar: 0,
      historicoPilar: [
        { data: '2026-01-12', qtd: 25, responsavel: 'Joao' },
        { data: '2026-01-22', qtd: 20, responsavel: 'Carlos' },
      ],
      sapatas: 45, tamanhoSapata: 'Pequena', tipoSapata: 'Normal',
      statusSapata: 'Fabricado', fabricadoSapata: 45, saldoSapata: 0,
      historicoSapata: [
        { data: '2026-01-08', qtd: 25, responsavel: 'Maria' },
        { data: '2026-01-18', qtd: 20, responsavel: 'Maria' },
      ],
      data: '2026-01-28', observacoes: 'Obra concluida em Jan/2026', solicitante: 'Carlos', cargoSolicitante: 'Mestre',
      dataSolicitacaoRegistro: '2025-12-15', statusAutorizacao: 'Autorizado',
      autorizadoPor: 'Walason', dataAutorizacao: '2025-12-16',
    },
  ];
  localStorage.setItem(STORAGE_KEYS.SOLICITACOES, JSON.stringify(solicitacoes));

  // Lancamentos Financeiros (12 total — receitas e despesas, varios status)
  const lancamentos: LancamentoFinanceiro[] = [
    { id: 1, tipo: 'Despesa', centro: 'Residencial Aurora', descricao: 'Cimento CP-V ARI', fornecedor: 'Votorantim Cimentos S.A.', valor: 12450, formaPagamento: 'Boleto', status: 'Pendente', procId: 1, data: '2026-04-01', emissao: '2026-03-28', vencimento: '2026-04-15' },
    { id: 2, tipo: 'Despesa', centro: 'Edificio Horizon', descricao: 'Aco CA-50', fornecedor: 'Gerdau Acos', valor: 28900, formaPagamento: 'Transferencia', status: 'Pendente', procId: 2, data: '2026-04-03', emissao: '2026-04-01', vencimento: '2026-04-20' },
    { id: 3, tipo: 'Despesa', centro: 'Centro Logistico Sul', descricao: 'Areia Media', fornecedor: 'Mineracao Sul', valor: 5600, formaPagamento: 'PIX', status: 'Vencido', procId: 3, data: '2026-03-20', emissao: '2026-03-18', vencimento: '2026-04-01' },
    { id: 4, tipo: 'Receita', centro: 'Residencial Aurora', descricao: 'Medicao Parcial 1', fornecedor: 'Construtora Alpha', valor: 85000, formaPagamento: 'Transferencia', status: 'Pago', procId: 0, data: '2026-03-15', emissao: '2026-03-10', vencimento: '2026-03-30' },
    { id: 5, tipo: 'Despesa', centro: 'Residencial Aurora', descricao: 'Transporte de Pecas', fornecedor: 'Logistica Transul', valor: 3200, formaPagamento: 'Boleto', status: 'Pago', procId: 4, data: '2026-03-22', emissao: '2026-03-20', vencimento: '2026-04-05' },
    { id: 6, tipo: 'Despesa', centro: 'Edificio Horizon', descricao: 'Brita Graduada', fornecedor: 'Pedreira Norte', valor: 8750, formaPagamento: 'Boleto', status: 'Vencido', procId: 5, data: '2026-04-05', emissao: '2026-04-03', vencimento: '2026-04-08' },
    { id: 7, tipo: 'Receita', centro: 'Edificio Horizon', descricao: 'Medicao Parcial 1', fornecedor: 'Beta Engenharia', valor: 120000, formaPagamento: 'Transferencia', status: 'Pago', procId: 0, data: '2026-02-28', emissao: '2026-02-25', vencimento: '2026-03-10' },
    { id: 8, tipo: 'Receita', centro: 'Centro Logistico Sul', descricao: 'Antecipacao Contratual', fornecedor: 'LogTech Brasil', valor: 45000, formaPagamento: 'Transferencia', status: 'Pago', procId: 0, data: '2026-03-05', emissao: '2026-03-01', vencimento: '2026-03-15' },
    { id: 9, tipo: 'Despesa', centro: 'Residencial Aurora', descricao: 'Arame Recozido', fornecedor: 'Distribuidora Sul', valor: 1850, formaPagamento: 'PIX', status: 'Pago', procId: 8, data: '2026-03-12', emissao: '2026-03-10', vencimento: '2026-03-20' },
    { id: 10, tipo: 'Despesa', centro: 'Condominio Villa Verde', descricao: 'Aco CA-50', fornecedor: 'Gerdau Acos', valor: 18400, formaPagamento: 'Transferencia', status: 'Pago', procId: 0, data: '2026-01-05', emissao: '2026-01-03', vencimento: '2026-01-15' },
    { id: 11, tipo: 'Receita', centro: 'Residencial Aurora', descricao: 'Medicao Parcial 2', fornecedor: 'Construtora Alpha', valor: 92000, formaPagamento: 'Transferencia', status: 'Pendente', procId: 0, data: '2026-04-10', emissao: '2026-04-08', vencimento: '2026-04-25' },
    { id: 12, tipo: 'Despesa', centro: 'Parque Empresarial Norte', descricao: 'Projeto Executivo', fornecedor: 'Eng. e Consultoria ABC', valor: 9500, formaPagamento: 'Transferencia', status: 'Pendente', procId: 0, data: '2026-04-11', emissao: '2026-04-09', vencimento: '2026-04-30' },
  ];
  localStorage.setItem(STORAGE_KEYS.LANCAMENTOS, JSON.stringify(lancamentos));

  // Bancos
  const bancos: Banco[] = [
    { id: 1, nome: 'Itau Unibanco', agencia: '0412', conta: '99042-1' },
    { id: 2, nome: 'Bradesco', agencia: '1234', conta: '56789-0' },
    { id: 3, nome: 'Caixa Economica', agencia: '0001', conta: '12345-6' },
  ];
  localStorage.setItem(STORAGE_KEYS.BANCOS, JSON.stringify(bancos));

  // Processos (8 total — todos os estagios do workflow CP)
  const processos: Processo[] = [
    { id: 1, numero: 'CP-00001', obra: 'Residencial Aurora', item: 'Cimento CP-V ARI', qtd: 500, valor: 12450, formaPagamento: 'Boleto', status: 'NO_FINANCEIRO', timeline: [
      { data: '2026-03-25', status: 'SOLICITADO', responsavel: 'Carlos' },
      { data: '2026-03-26', status: 'EM_ORCAMENTO', responsavel: 'Pedro' },
      { data: '2026-03-27', status: 'AGUARDANDO_AUTORIZACAO', responsavel: 'Pedro' },
      { data: '2026-03-28', status: 'AUTORIZADO', responsavel: 'Walason' },
      { data: '2026-03-28', status: 'NO_FINANCEIRO', responsavel: 'Sistema' },
    ]},
    { id: 2, numero: 'CP-00002', obra: 'Edificio Horizon', item: 'Aco CA-50', qtd: 2000, valor: 28900, formaPagamento: 'Transferencia', status: 'AUTORIZADO', timeline: [
      { data: '2026-03-30', status: 'SOLICITADO', responsavel: 'Carlos' },
      { data: '2026-04-01', status: 'EM_ORCAMENTO', responsavel: 'Pedro' },
      { data: '2026-04-02', status: 'AGUARDANDO_AUTORIZACAO', responsavel: 'Pedro' },
      { data: '2026-04-03', status: 'AUTORIZADO', responsavel: 'Walason' },
    ]},
    { id: 3, numero: 'CP-00003', obra: 'Centro Logistico Sul', item: 'Areia Media', qtd: 30, valor: 5600, formaPagamento: 'PIX', status: 'PAGO', timeline: [
      { data: '2026-03-10', status: 'SOLICITADO', responsavel: 'Carlos' },
      { data: '2026-03-11', status: 'EM_ORCAMENTO', responsavel: 'Pedro' },
      { data: '2026-03-12', status: 'AGUARDANDO_AUTORIZACAO', responsavel: 'Pedro' },
      { data: '2026-03-13', status: 'AUTORIZADO', responsavel: 'Walason' },
      { data: '2026-03-13', status: 'NO_FINANCEIRO', responsavel: 'Sistema' },
      { data: '2026-03-20', status: 'PAGO', responsavel: 'Ana' },
    ]},
    { id: 4, numero: 'CP-00004', obra: 'Residencial Aurora', item: 'Cabo PFNP 4mm2', qtd: 300, valor: 4860, formaPagamento: 'Boleto', status: 'NEGADO', timeline: [
      { data: '2026-04-02', status: 'SOLICITADO', responsavel: 'Pedro' },
      { data: '2026-04-03', status: 'EM_ORCAMENTO', responsavel: 'Pedro' },
      { data: '2026-04-04', status: 'AGUARDANDO_AUTORIZACAO', responsavel: 'Pedro' },
      { data: '2026-04-05', status: 'NEGADO', responsavel: 'Walason' },
    ]},
    { id: 5, numero: 'CP-00005', obra: 'Edificio Horizon', item: 'Brita Graduada', qtd: 40, valor: 8750, formaPagamento: 'Boleto', status: 'AGUARDANDO_AUTORIZACAO', timeline: [
      { data: '2026-04-06', status: 'SOLICITADO', responsavel: 'Carlos' },
      { data: '2026-04-07', status: 'EM_ORCAMENTO', responsavel: 'Pedro' },
      { data: '2026-04-08', status: 'AGUARDANDO_AUTORIZACAO', responsavel: 'Pedro' },
    ]},
    { id: 6, numero: 'CP-00006', obra: 'Residencial Aurora', item: 'Prego 17x27', qtd: 50, valor: 0, formaPagamento: '', status: 'EM_ORCAMENTO', timeline: [
      { data: '2026-04-09', status: 'SOLICITADO', responsavel: 'Carlos' },
      { data: '2026-04-10', status: 'EM_ORCAMENTO', responsavel: 'Pedro' },
    ]},
    { id: 7, numero: 'CP-00007', obra: 'Centro Logistico Sul', item: 'Aditivo Plastificante', qtd: 120, valor: 0, formaPagamento: '', status: 'SOLICITADO', timeline: [
      { data: '2026-04-11', status: 'SOLICITADO', responsavel: 'Carlos' },
    ]},
    { id: 8, numero: 'CP-00008', obra: 'Condominio Villa Verde', item: 'Arame Recozido', qtd: 80, valor: 1850, formaPagamento: 'PIX', status: 'PAGO', timeline: [
      { data: '2026-03-05', status: 'SOLICITADO', responsavel: 'Carlos' },
      { data: '2026-03-06', status: 'EM_ORCAMENTO', responsavel: 'Pedro' },
      { data: '2026-03-07', status: 'AGUARDANDO_AUTORIZACAO', responsavel: 'Pedro' },
      { data: '2026-03-08', status: 'AUTORIZADO', responsavel: 'Walason' },
      { data: '2026-03-08', status: 'NO_FINANCEIRO', responsavel: 'Sistema' },
      { data: '2026-03-12', status: 'PAGO', responsavel: 'Ana' },
    ]},
  ];
  localStorage.setItem(STORAGE_KEYS.PROCESSOS, JSON.stringify(processos));

  // Fornecedores (8 total)
  const fornecedores: Fornecedor[] = [
    { id: 1, nome: 'Votorantim Cimentos S.A.', fone: '(11) 3585-4700' },
    { id: 2, nome: 'Gerdau Acos', fone: '(51) 3323-2000' },
    { id: 3, nome: 'Mineracao Sul', fone: '(41) 3322-8800' },
    { id: 4, nome: 'Pedreira Norte', fone: '(41) 3344-5500' },
    { id: 5, nome: 'Logistica Transul', fone: '(41) 3299-1100' },
    { id: 6, nome: 'Eletrica Sao Paulo', fone: '(11) 2244-8800' },
    { id: 7, nome: 'Quimicos Parana', fone: '(41) 3355-2200' },
    { id: 8, nome: 'Distribuidora Sul', fone: '(51) 3388-7700' },
  ];
  localStorage.setItem(STORAGE_KEYS.FORNECEDORES, JSON.stringify(fornecedores));

  // Insumos (estoques realistas pos-movimentacoes)
  const insumos: Insumo[] = [
    { id: 1, nome: 'Cimento CP-V ARI', unidade: 'saco', coeficiente: 0.3, estoqueAtual: 180, estoqueMinimo: 100 },
    { id: 2, nome: 'Aco CA-50', unidade: 'kg', coeficiente: 0.15, estoqueAtual: 820, estoqueMinimo: 500 },
    { id: 3, nome: 'Areia Media', unidade: 'm3', coeficiente: 0.5, estoqueAtual: 14, estoqueMinimo: 10 },
    { id: 4, nome: 'Brita Graduada', unidade: 'm3', coeficiente: 0.4, estoqueAtual: 9, estoqueMinimo: 8 },
    { id: 5, nome: 'Prego 17x27', unidade: 'kg', coeficiente: 0.02, estoqueAtual: 22, estoqueMinimo: 10 },
    { id: 6, nome: 'Arame Recozido', unidade: 'kg', coeficiente: 0.05, estoqueAtual: 35, estoqueMinimo: 15 },
  ];
  localStorage.setItem(STORAGE_KEYS.INSUMOS, JSON.stringify(insumos));

  // Solicitacoes de Compra (10 total — cobrem todos os processos)
  const solicitacoesCompra: SolicitacaoCompra[] = [
    { id: 1, obraId: 1, obraNome: 'Residencial Aurora', setor: 'Producao', item: 'Cimento CP-V ARI', quantidade: 500, unidade: 'Saco 50kg', prioridade: 'Alta', observacoes: 'Urgente para concretagem', solicitante: 'Carlos', data: '2026-03-25', status: 'PAGO', fornecedor: 'Votorantim Cimentos S.A.', valor: 12450, pagamento: 'Boleto', imagemOrcamento: '', statusFluxo: 'PAGO' },
    { id: 2, obraId: 2, obraNome: 'Edificio Horizon', setor: 'Producao', item: 'Aco CA-50', quantidade: 2000, unidade: 'kg', prioridade: 'Alta', observacoes: '', solicitante: 'Carlos', data: '2026-03-30', status: 'AUTORIZADO', fornecedor: 'Gerdau Acos', valor: 28900, pagamento: 'Transferencia', imagemOrcamento: '', statusFluxo: 'AUTORIZADO' },
    { id: 3, obraId: 3, obraNome: 'Centro Logistico Sul', setor: 'Producao', item: 'Areia Media', quantidade: 30, unidade: 'm3', prioridade: 'Media', observacoes: 'Para base de fundacao', solicitante: 'Carlos', data: '2026-03-10', status: 'PAGO', fornecedor: 'Mineracao Sul', valor: 5600, pagamento: 'PIX', imagemOrcamento: '', statusFluxo: 'PAGO' },
    { id: 4, obraId: 1, obraNome: 'Residencial Aurora', setor: 'Manutencao', item: 'Prego 17x27', quantidade: 50, unidade: 'kg', prioridade: 'Baixa', observacoes: '', solicitante: 'Pedro', data: '2026-04-09', status: 'EM_ORCAMENTO', fornecedor: '', valor: 0, pagamento: '', imagemOrcamento: '', statusFluxo: 'EM_ORCAMENTO' },
    { id: 5, obraId: 2, obraNome: 'Edificio Horizon', setor: 'Producao', item: 'Brita Graduada', quantidade: 40, unidade: 'm3', prioridade: 'Media', observacoes: 'Entrega parcelada', solicitante: 'Carlos', data: '2026-04-06', status: 'AGUARDANDO_AUTORIZACAO', fornecedor: 'Pedreira Norte', valor: 8750, pagamento: 'Boleto', imagemOrcamento: '', statusFluxo: 'AGUARDANDO_AUTORIZACAO' },
    { id: 6, obraId: 1, obraNome: 'Residencial Aurora', setor: 'Eletrica', item: 'Cabo PFNP 4mm2', quantidade: 300, unidade: 'metro', prioridade: 'Alta', observacoes: 'Instalacao eletrica das formas', solicitante: 'Pedro', data: '2026-04-02', status: 'NEGADO', fornecedor: 'Eletrica Sao Paulo', valor: 4860, pagamento: 'Boleto', imagemOrcamento: '', statusFluxo: 'NEGADO' },
    { id: 7, obraId: 3, obraNome: 'Centro Logistico Sul', setor: 'Producao', item: 'Aditivo Plastificante', quantidade: 120, unidade: 'litro', prioridade: 'Baixa', observacoes: '', solicitante: 'Carlos', data: '2026-04-11', status: 'SOLICITADO', fornecedor: '', valor: 0, pagamento: '', imagemOrcamento: '', statusFluxo: 'SOLICITADO' },
    { id: 8, obraId: 5, obraNome: 'Condominio Villa Verde', setor: 'Producao', item: 'Arame Recozido', quantidade: 80, unidade: 'kg', prioridade: 'Media', observacoes: '', solicitante: 'Carlos', data: '2026-03-05', status: 'PAGO', fornecedor: 'Distribuidora Sul', valor: 1850, pagamento: 'PIX', imagemOrcamento: '', statusFluxo: 'PAGO' },
    { id: 9, obraId: 4, obraNome: 'Parque Empresarial Norte', setor: 'Producao', item: 'Cimento CP-V ARI', quantidade: 800, unidade: 'Saco 50kg', prioridade: 'Alta', observacoes: 'Primeiro pedido da obra', solicitante: 'Carlos', data: '2026-04-11', status: 'SOLICITADO', fornecedor: '', valor: 0, pagamento: '', imagemOrcamento: '', statusFluxo: 'SOLICITADO' },
    { id: 10, obraId: 1, obraNome: 'Residencial Aurora', setor: 'Producao', item: 'Areia Media', quantidade: 20, unidade: 'm3', prioridade: 'Media', observacoes: 'Reposicao de estoque', solicitante: 'Carlos', data: '2026-04-10', status: 'NO_FINANCEIRO', fornecedor: 'Mineracao Sul', valor: 3800, pagamento: 'PIX', imagemOrcamento: '', statusFluxo: 'NO_FINANCEIRO' },
  ];
  localStorage.setItem(STORAGE_KEYS.SOLICITACOES_COMPRA, JSON.stringify(solicitacoesCompra));

  // Carregamentos (6 total — todos os status do workflow logistico)
  const carregamentos: Carregamento[] = [
    // Carg 1: Aurora — Entregue (alimenta montagens)
    {
      id: 1, obraId: 1, obraNome: 'Residencial Aurora', veiculo: 'Munck',
      paineis: [
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 1, lado: 'Esquerdo' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 2, lado: 'Esquerdo' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 3, lado: 'Esquerdo' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 4, lado: 'Esquerdo' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 1, lado: 'Direito' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 2, lado: 'Direito' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 3, lado: 'Direito' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 4, lado: 'Direito' },
      ],
      sequenciaMontagem: [8, 7, 6, 5, 4, 3, 2, 1],
      statusAutorizacao: 'Autorizado', autorizadoPor: 'Walason', dataAutorizacao: '2026-03-30',
      dataSolicitacao: '2026-03-28', solicitante: 'Carlos',
      executadoPor: 'Carlos', dataExecucao: '2026-04-01', status: 'Entregue',
    },
    // Carg 2: Horizon — Pendente (aguardando autorizacao)
    {
      id: 2, obraId: 2, obraNome: 'Edificio Horizon', veiculo: 'Carreta',
      paineis: [
        { solicitacaoId: 2, tipo: 'Painel', dimensao: '4x2.5m', posicaoCarregamento: 1, lado: 'Esquerdo' },
        { solicitacaoId: 2, tipo: 'Painel', dimensao: '4x2.5m', posicaoCarregamento: 2, lado: 'Esquerdo' },
        { solicitacaoId: 2, tipo: 'Painel', dimensao: '4x2.5m', posicaoCarregamento: 3, lado: 'Esquerdo' },
        { solicitacaoId: 2, tipo: 'Painel', dimensao: '4x2.5m', posicaoCarregamento: 4, lado: 'Esquerdo' },
        { solicitacaoId: 2, tipo: 'Painel', dimensao: '4x2.5m', posicaoCarregamento: 5, lado: 'Esquerdo' },
        { solicitacaoId: 2, tipo: 'Painel', dimensao: '4x2.5m', posicaoCarregamento: 1, lado: 'Direito' },
        { solicitacaoId: 2, tipo: 'Painel', dimensao: '4x2.5m', posicaoCarregamento: 2, lado: 'Direito' },
        { solicitacaoId: 2, tipo: 'Painel', dimensao: '4x2.5m', posicaoCarregamento: 3, lado: 'Direito' },
      ],
      sequenciaMontagem: [8, 7, 6, 5, 4, 3, 2, 1],
      statusAutorizacao: 'Aguardando', autorizadoPor: '', dataAutorizacao: '',
      dataSolicitacao: '2026-04-09', solicitante: 'Carlos',
      executadoPor: '', dataExecucao: '', status: 'Pendente',
    },
    // Carg 3: Logistico — Pendente
    {
      id: 3, obraId: 3, obraNome: 'Centro Logistico Sul', veiculo: 'Munck',
      paineis: [
        { solicitacaoId: 3, tipo: 'Painel', dimensao: '6x3m', posicaoCarregamento: 1, lado: 'Esquerdo' },
        { solicitacaoId: 3, tipo: 'Painel', dimensao: '6x3m', posicaoCarregamento: 2, lado: 'Esquerdo' },
        { solicitacaoId: 3, tipo: 'Painel', dimensao: '6x3m', posicaoCarregamento: 1, lado: 'Direito' },
        { solicitacaoId: 3, tipo: 'Painel', dimensao: '6x3m', posicaoCarregamento: 2, lado: 'Direito' },
      ],
      sequenciaMontagem: [4, 3, 2, 1],
      statusAutorizacao: 'Aguardando', autorizadoPor: '', dataAutorizacao: '',
      dataSolicitacao: '2026-04-10', solicitante: 'Pedro',
      executadoPor: '', dataExecucao: '', status: 'Pendente',
    },
    // Carg 4: Aurora — Em Carregamento (em andamento agora)
    {
      id: 4, obraId: 1, obraNome: 'Residencial Aurora', veiculo: 'Munck',
      paineis: [
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 1, lado: 'Esquerdo' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 2, lado: 'Esquerdo' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 3, lado: 'Esquerdo' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 1, lado: 'Direito' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 2, lado: 'Direito' },
        { solicitacaoId: 1, tipo: 'Painel', dimensao: '5x3m', posicaoCarregamento: 3, lado: 'Direito' },
      ],
      sequenciaMontagem: [6, 5, 4, 3, 2, 1],
      statusAutorizacao: 'Autorizado', autorizadoPor: 'Walason', dataAutorizacao: '2026-04-10',
      dataSolicitacao: '2026-04-09', solicitante: 'Carlos',
      executadoPor: 'Carlos', dataExecucao: '2026-04-11', status: 'Em Carregamento',
    },
    // Carg 5: Villa Verde — Entregue (historico concluido)
    {
      id: 5, obraId: 5, obraNome: 'Condominio Villa Verde', veiculo: 'Carreta',
      paineis: [
        { solicitacaoId: 5, tipo: 'Painel', dimensao: '4x2.8m', posicaoCarregamento: 1, lado: 'Esquerdo' },
        { solicitacaoId: 5, tipo: 'Painel', dimensao: '4x2.8m', posicaoCarregamento: 2, lado: 'Esquerdo' },
        { solicitacaoId: 5, tipo: 'Painel', dimensao: '4x2.8m', posicaoCarregamento: 3, lado: 'Esquerdo' },
        { solicitacaoId: 5, tipo: 'Painel', dimensao: '4x2.8m', posicaoCarregamento: 1, lado: 'Direito' },
        { solicitacaoId: 5, tipo: 'Painel', dimensao: '4x2.8m', posicaoCarregamento: 2, lado: 'Direito' },
        { solicitacaoId: 5, tipo: 'Painel', dimensao: '4x2.8m', posicaoCarregamento: 3, lado: 'Direito' },
      ],
      sequenciaMontagem: [6, 5, 4, 3, 2, 1],
      statusAutorizacao: 'Autorizado', autorizadoPor: 'Walason', dataAutorizacao: '2026-01-25',
      dataSolicitacao: '2026-01-24', solicitante: 'Carlos',
      executadoPor: 'Carlos', dataExecucao: '2026-01-26', status: 'Entregue',
    },
    // Carg 6: Aurora — Carregado (em transito)
    {
      id: 6, obraId: 1, obraNome: 'Residencial Aurora', veiculo: 'Carreta',
      paineis: [
        { solicitacaoId: 1, tipo: 'Pilar', dimensao: '3m bainhas', posicaoCarregamento: 1, lado: 'Esquerdo' },
        { solicitacaoId: 1, tipo: 'Pilar', dimensao: '3m bainhas', posicaoCarregamento: 2, lado: 'Esquerdo' },
        { solicitacaoId: 1, tipo: 'Pilar', dimensao: '3m bainhas', posicaoCarregamento: 3, lado: 'Esquerdo' },
        { solicitacaoId: 1, tipo: 'Pilar', dimensao: '3m bainhas', posicaoCarregamento: 1, lado: 'Direito' },
        { solicitacaoId: 1, tipo: 'Pilar', dimensao: '3m bainhas', posicaoCarregamento: 2, lado: 'Direito' },
        { solicitacaoId: 1, tipo: 'Pilar', dimensao: '3m bainhas', posicaoCarregamento: 3, lado: 'Direito' },
      ],
      sequenciaMontagem: [6, 5, 4, 3, 2, 1],
      statusAutorizacao: 'Autorizado', autorizadoPor: 'Walason', dataAutorizacao: '2026-04-06',
      dataSolicitacao: '2026-04-05', solicitante: 'Carlos',
      executadoPor: 'Carlos', dataExecucao: '2026-04-07', status: 'Carregado',
    },
  ];
  localStorage.setItem(STORAGE_KEYS.CARREGAMENTOS, JSON.stringify(carregamentos));

  // Montagens (14 total — Carg 1 Aurora + Carg 5 Villa Verde)
  const montagens: Montagem[] = [
    { id: 1,  obraId: 1, obraNome: 'Residencial Aurora',    carregamentoId: 1, painelId: 'P-AUR-001', tipo: 'Painel', dimensao: '5x3m',   equipeResponsavel: 'Carlos', dataMontagem: '2026-04-02', observacoes: 'Fachada Norte' },
    { id: 2,  obraId: 1, obraNome: 'Residencial Aurora',    carregamentoId: 1, painelId: 'P-AUR-002', tipo: 'Painel', dimensao: '5x3m',   equipeResponsavel: 'Carlos', dataMontagem: '2026-04-02', observacoes: 'Fachada Norte' },
    { id: 3,  obraId: 1, obraNome: 'Residencial Aurora',    carregamentoId: 1, painelId: 'P-AUR-003', tipo: 'Painel', dimensao: '5x3m',   equipeResponsavel: 'Carlos', dataMontagem: '2026-04-03', observacoes: 'Fachada Leste' },
    { id: 4,  obraId: 1, obraNome: 'Residencial Aurora',    carregamentoId: 1, painelId: 'P-AUR-004', tipo: 'Painel', dimensao: '5x3m',   equipeResponsavel: 'Joao',   dataMontagem: '2026-04-03', observacoes: 'Fachada Leste' },
    { id: 5,  obraId: 1, obraNome: 'Residencial Aurora',    carregamentoId: 1, painelId: 'P-AUR-005', tipo: 'Painel', dimensao: '5x3m',   equipeResponsavel: 'Carlos', dataMontagem: '2026-04-04', observacoes: 'Fachada Sul' },
    { id: 6,  obraId: 1, obraNome: 'Residencial Aurora',    carregamentoId: 1, painelId: 'P-AUR-006', tipo: 'Painel', dimensao: '5x3m',   equipeResponsavel: 'Joao',   dataMontagem: '2026-04-04', observacoes: 'Fachada Sul' },
    { id: 7,  obraId: 1, obraNome: 'Residencial Aurora',    carregamentoId: 1, painelId: 'P-AUR-007', tipo: 'Painel', dimensao: '5x3m',   equipeResponsavel: 'Carlos', dataMontagem: '2026-04-05', observacoes: 'Fachada Oeste' },
    { id: 8,  obraId: 1, obraNome: 'Residencial Aurora',    carregamentoId: 1, painelId: 'P-AUR-008', tipo: 'Painel', dimensao: '5x3m',   equipeResponsavel: 'Carlos', dataMontagem: '2026-04-05', observacoes: 'Fachada Oeste — concluida' },
    { id: 9,  obraId: 5, obraNome: 'Condominio Villa Verde', carregamentoId: 5, painelId: 'P-VV-001',  tipo: 'Painel', dimensao: '4x2.8m', equipeResponsavel: 'Carlos', dataMontagem: '2026-01-27', observacoes: 'Bloco A' },
    { id: 10, obraId: 5, obraNome: 'Condominio Villa Verde', carregamentoId: 5, painelId: 'P-VV-002',  tipo: 'Painel', dimensao: '4x2.8m', equipeResponsavel: 'Carlos', dataMontagem: '2026-01-27', observacoes: 'Bloco A' },
    { id: 11, obraId: 5, obraNome: 'Condominio Villa Verde', carregamentoId: 5, painelId: 'P-VV-003',  tipo: 'Painel', dimensao: '4x2.8m', equipeResponsavel: 'Joao',   dataMontagem: '2026-01-28', observacoes: 'Bloco B' },
    { id: 12, obraId: 5, obraNome: 'Condominio Villa Verde', carregamentoId: 5, painelId: 'P-VV-004',  tipo: 'Painel', dimensao: '4x2.8m', equipeResponsavel: 'Joao',   dataMontagem: '2026-01-28', observacoes: 'Bloco B' },
    { id: 13, obraId: 5, obraNome: 'Condominio Villa Verde', carregamentoId: 5, painelId: 'P-VV-005',  tipo: 'Painel', dimensao: '4x2.8m', equipeResponsavel: 'Carlos', dataMontagem: '2026-01-29', observacoes: 'Bloco C' },
    { id: 14, obraId: 5, obraNome: 'Condominio Villa Verde', carregamentoId: 5, painelId: 'P-VV-006',  tipo: 'Painel', dimensao: '4x2.8m', equipeResponsavel: 'Carlos', dataMontagem: '2026-01-29', observacoes: 'Bloco C — obra concluida' },
  ];
  localStorage.setItem(STORAGE_KEYS.MONTAGENS, JSON.stringify(montagens));

  // Movimentacoes de Estoque (14 total — todos os 6 insumos com Entrada e Saida)
  const movimentacoes: MovimentacaoEstoque[] = [
    // Cimento (3 entradas, 3 saidas)
    { id: 1,  insumoId: 1, insumoNome: 'Cimento CP-V ARI', tipo: 'Entrada', quantidade: 300, obraDestino: '',                    data: '2026-03-28', responsavel: 'Pedro',  observacoes: 'Recebimento NF 12345' },
    { id: 2,  insumoId: 1, insumoNome: 'Cimento CP-V ARI', tipo: 'Saida',   quantidade: 40,  obraDestino: 'Residencial Aurora',   data: '2026-04-01', responsavel: 'Carlos', observacoes: 'Concretagem lote 1' },
    { id: 3,  insumoId: 1, insumoNome: 'Cimento CP-V ARI', tipo: 'Entrada', quantidade: 200, obraDestino: '',                    data: '2026-04-08', responsavel: 'Pedro',  observacoes: 'Reposicao estoque NF 12490' },
    { id: 4,  insumoId: 1, insumoNome: 'Cimento CP-V ARI', tipo: 'Saida',   quantidade: 35,  obraDestino: 'Centro Logistico Sul', data: '2026-04-07', responsavel: 'Carlos', observacoes: 'Concretagem pilares' },
    { id: 5,  insumoId: 1, insumoNome: 'Cimento CP-V ARI', tipo: 'Saida',   quantidade: 45,  obraDestino: 'Residencial Aurora',   data: '2026-04-09', responsavel: 'Carlos', observacoes: 'Concretagem lote 2' },
    // Aco (1 entrada, 2 saidas)
    { id: 6,  insumoId: 2, insumoNome: 'Aco CA-50', tipo: 'Entrada', quantidade: 1500, obraDestino: '',                    data: '2026-04-02', responsavel: 'Pedro', observacoes: 'Recebimento parcial Gerdau' },
    { id: 7,  insumoId: 2, insumoNome: 'Aco CA-50', tipo: 'Saida',   quantidade: 380,  obraDestino: 'Residencial Aurora',   data: '2026-04-04', responsavel: 'Joao',  observacoes: 'Armacao paineis lote 1' },
    { id: 8,  insumoId: 2, insumoNome: 'Aco CA-50', tipo: 'Saida',   quantidade: 300,  obraDestino: 'Centro Logistico Sul', data: '2026-04-09', responsavel: 'Joao',  observacoes: 'Armacao pilares' },
    // Areia (1 entrada, 2 saidas)
    { id: 9,  insumoId: 3, insumoNome: 'Areia Media', tipo: 'Entrada', quantidade: 25, obraDestino: '',                    data: '2026-03-15', responsavel: 'Pedro',  observacoes: 'Recebimento Mineracao Sul' },
    { id: 10, insumoId: 3, insumoNome: 'Areia Media', tipo: 'Saida',   quantidade: 6,  obraDestino: 'Residencial Aurora',   data: '2026-04-02', responsavel: 'Carlos', observacoes: 'Traco concretagem' },
    { id: 11, insumoId: 3, insumoNome: 'Areia Media', tipo: 'Saida',   quantidade: 5,  obraDestino: 'Centro Logistico Sul', data: '2026-04-08', responsavel: 'Carlos', observacoes: 'Traco sapatas' },
    // Brita (1 entrada, 1 saida)
    { id: 12, insumoId: 4, insumoNome: 'Brita Graduada', tipo: 'Entrada', quantidade: 18, obraDestino: '',                  data: '2026-03-20', responsavel: 'Pedro',  observacoes: 'Pedreira Norte NF 5588' },
    { id: 13, insumoId: 4, insumoNome: 'Brita Graduada', tipo: 'Saida',   quantidade: 9,  obraDestino: 'Residencial Aurora', data: '2026-04-03', responsavel: 'Carlos', observacoes: 'Traco concretagem fachada' },
    // Arame (1 entrada, 1 saida)
    { id: 14, insumoId: 6, insumoNome: 'Arame Recozido', tipo: 'Entrada', quantidade: 50, obraDestino: '',                  data: '2026-03-12', responsavel: 'Pedro',  observacoes: 'Recebimento Distribuidora Sul' },
    { id: 15, insumoId: 6, insumoNome: 'Arame Recozido', tipo: 'Saida',   quantidade: 15, obraDestino: 'Residencial Aurora', data: '2026-04-05', responsavel: 'Joao',   observacoes: 'Amarracao armacao' },
  ];
  localStorage.setItem(STORAGE_KEYS.MOVIMENTACOES_ESTOQUE, JSON.stringify(movimentacoes));

  // Ferramentas (8 total — Disponivel, Emprestada, Manutencao)
  const ferramentas: Ferramenta[] = [
    { id: 1, nome: 'Furadeira Bosch', codigo: 'FER-001', status: 'Disponivel', responsavelAtual: '', dataEmprestimo: '', dataDevolvida: '', historicoUso: [
      { responsavel: 'Carlos', dataRetirada: '2026-03-20', dataDevolucao: '2026-03-25' },
      { responsavel: 'Joao',   dataRetirada: '2026-04-01', dataDevolucao: '2026-04-03' },
    ]},
    { id: 2, nome: 'Martelete Dewalt', codigo: 'FER-002', status: 'Emprestada', responsavelAtual: 'Carlos', dataEmprestimo: '2026-04-08', dataDevolvida: '', historicoUso: [
      { responsavel: 'Joao', dataRetirada: '2026-03-10', dataDevolucao: '2026-03-18' },
    ]},
    { id: 3, nome: 'Serra Circular Makita', codigo: 'FER-003', status: 'Manutencao', responsavelAtual: '', dataEmprestimo: '', dataDevolvida: '', historicoUso: [
      { responsavel: 'Joao', dataRetirada: '2026-03-15', dataDevolucao: '2026-04-01' },
    ]},
    { id: 4, nome: 'Nivel a Laser Bosch', codigo: 'FER-004', status: 'Disponivel', responsavelAtual: '', dataEmprestimo: '', dataDevolvida: '', historicoUso: [
      { responsavel: 'Carlos', dataRetirada: '2026-02-10', dataDevolucao: '2026-02-15' },
      { responsavel: 'Carlos', dataRetirada: '2026-03-05', dataDevolucao: '2026-03-10' },
      { responsavel: 'Joao',   dataRetirada: '2026-04-02', dataDevolucao: '2026-04-05' },
    ]},
    { id: 5, nome: 'Compactador de Solo', codigo: 'FER-005', status: 'Emprestada', responsavelAtual: 'Joao', dataEmprestimo: '2026-04-09', dataDevolvida: '', historicoUso: [] },
    { id: 6, nome: 'Betoneira 400L', codigo: 'FER-006', status: 'Disponivel', responsavelAtual: '', dataEmprestimo: '', dataDevolvida: '', historicoUso: [
      { responsavel: 'Maria', dataRetirada: '2026-03-25', dataDevolucao: '2026-04-06' },
    ]},
    { id: 7, nome: 'Talha Manual 2T', codigo: 'FER-007', status: 'Disponivel', responsavelAtual: '', dataEmprestimo: '', dataDevolvida: '', historicoUso: [
      { responsavel: 'Carlos', dataRetirada: '2026-04-01', dataDevolucao: '2026-04-05' },
    ]},
    { id: 8, nome: 'Andaime Metalico 1.5m', codigo: 'FER-008', status: 'Manutencao', responsavelAtual: '', dataEmprestimo: '', dataDevolvida: '', historicoUso: [] },
  ];
  localStorage.setItem(STORAGE_KEYS.FERRAMENTAS, JSON.stringify(ferramentas));

  // Funcionarios RH (6 total — equipe completa)
  const funcionarios: FuncionarioRH[] = [
    {
      id: 1, codigoInterno: 'FUN-001', nome: 'Carlos', sobrenome: 'Mendes', apelido: 'Carlos',
      admissao: '2022-03-01', nacionalidade: 'Brasileira', nascimento: '1985-07-14', sexo: 'Masculino',
      cpf: '321.654.987-00', rg: '12.345.678-9', pis: '123.45678.90-1',
      email: 'carlos.mendes@cbh.com', telefone: '(11) 98765-4321', notificacao: 1, whatsapp: 1,
      cep: '01310-100', rua: 'Av. Paulista', bairro: 'Bela Vista', numero: '1500', complemento: 'Apto 42',
      estado: 'SP', cidade: 'Sao Paulo',
      escolaridade: 'Ensino Medio', cei: '', fornecedor: '', ocupacao: 'Mestre de Obras',
      tiposDocumentos: 'RG, CPF, Carteira de Trabalho', certificacoes: 'NR-18, NR-35',
      foto: '', documentos: [],
    },
    {
      id: 2, codigoInterno: 'FUN-002', nome: 'Ana', sobrenome: 'Souza', apelido: 'Ana',
      admissao: '2023-01-10', nacionalidade: 'Brasileira', nascimento: '1990-03-22', sexo: 'Feminino',
      cpf: '456.789.123-00', rg: '23.456.789-0', pis: '234.56789.01-2',
      email: 'ana.souza@cbh.com', telefone: '(11) 97654-3210', notificacao: 1, whatsapp: 0,
      cep: '04522-001', rua: 'Rua Verbo Divino', bairro: 'Chacara Santo Antonio', numero: '320', complemento: '',
      estado: 'SP', cidade: 'Sao Paulo',
      escolaridade: 'Superior Completo', cei: '', fornecedor: '', ocupacao: 'Analista Financeiro',
      tiposDocumentos: 'RG, CPF, Diploma', certificacoes: 'CRC Ativo',
      foto: '', documentos: [],
    },
    {
      id: 3, codigoInterno: 'FUN-003', nome: 'Pedro', sobrenome: 'Lima', apelido: 'Pedro',
      admissao: '2023-06-15', nacionalidade: 'Brasileira', nascimento: '1988-11-05', sexo: 'Masculino',
      cpf: '567.890.234-00', rg: '34.567.890-1', pis: '345.67890.12-3',
      email: 'pedro.lima@cbh.com', telefone: '(11) 96543-2109', notificacao: 1, whatsapp: 1,
      cep: '09060-000', rua: 'Rua das Flores', bairro: 'Centro', numero: '100', complemento: '',
      estado: 'SP', cidade: 'Santo Andre',
      escolaridade: 'Ensino Medio', cei: '', fornecedor: '', ocupacao: 'Assistente de Compras',
      tiposDocumentos: 'RG, CPF, Carteira de Trabalho', certificacoes: '',
      foto: '', documentos: [],
    },
    {
      id: 4, codigoInterno: 'FUN-004', nome: 'Joao', sobrenome: 'Ferreira', apelido: 'Joao',
      admissao: '2021-08-20', nacionalidade: 'Brasileira', nascimento: '1980-04-30', sexo: 'Masculino',
      cpf: '678.901.345-00', rg: '45.678.901-2', pis: '456.78901.23-4',
      email: '', telefone: '(11) 95432-1098', notificacao: 0, whatsapp: 1,
      cep: '09120-000', rua: 'Rua Tiradentes', bairro: 'Vila Guiomar', numero: '45', complemento: 'Casa',
      estado: 'SP', cidade: 'Santo Andre',
      escolaridade: 'Ensino Fundamental', cei: '', fornecedor: '', ocupacao: 'Ferreiro',
      tiposDocumentos: 'RG, CPF, Carteira de Trabalho', certificacoes: 'NR-18',
      foto: '', documentos: [],
    },
    {
      id: 5, codigoInterno: 'FUN-005', nome: 'Maria', sobrenome: 'Santos', apelido: 'Maria',
      admissao: '2022-11-01', nacionalidade: 'Brasileira', nascimento: '1992-09-18', sexo: 'Feminino',
      cpf: '789.012.456-00', rg: '56.789.012-3', pis: '567.89012.34-5',
      email: '', telefone: '(11) 94321-0987', notificacao: 0, whatsapp: 1,
      cep: '09190-000', rua: 'Av. Industrial', bairro: 'Jardim', numero: '200', complemento: 'Ap 12',
      estado: 'SP', cidade: 'Maua',
      escolaridade: 'Ensino Medio', cei: '', fornecedor: '', ocupacao: 'Operadora de Betoneira',
      tiposDocumentos: 'RG, CPF, Carteira de Trabalho', certificacoes: 'NR-18, NR-10',
      foto: '', documentos: [],
    },
    {
      id: 6, codigoInterno: 'FUN-006', nome: 'Rafael', sobrenome: 'Oliveira', apelido: 'Rafael',
      admissao: '2024-02-05', nacionalidade: 'Brasileira', nascimento: '1998-02-28', sexo: 'Masculino',
      cpf: '890.123.567-00', rg: '67.890.123-4', pis: '678.90123.45-6',
      email: '', telefone: '(11) 93210-9876', notificacao: 0, whatsapp: 1,
      cep: '09250-000', rua: 'Rua do Comercio', bairro: 'Vila Nova', numero: '88', complemento: '',
      estado: 'SP', cidade: 'Maua',
      escolaridade: 'Ensino Fundamental', cei: '', fornecedor: '', ocupacao: 'Servente',
      tiposDocumentos: 'RG, CPF', certificacoes: '',
      foto: '', documentos: [],
    },
  ];
  localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS_RH, JSON.stringify(funcionarios));

  // Config (proximo processo = CP-00009)
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ numeroProcesso: '9' }));

  // Marcar como seed feito
  localStorage.setItem('cbh_seeded', SEED_VERSION);
}
