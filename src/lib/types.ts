// === Entidades do CBH ===

export interface Usuario {
  id: number;
  login: string;
  senha: string;
  tipo: 'Master' | 'Usuario';
  cargo: string;
  ativo: number; // 0 | 1
  foto: string;
}

export interface Obra {
  id: number;
  nome: string;
  cliente: string;
  local: string;
  observacoes: string;
  paineisMin: number;
  pilaresMin: number;
  sapatasMin: number;
}

export interface HistoricoFabricacao {
  data: string;
  qtd: number;
  responsavel: string;
}

export interface Solicitacao {
  id: number;
  obraId: number;
  obraNome: string;
  clienteNome: string;
  // Paineis
  paineis: number;
  painelComp: number;
  painelAlt: number;
  tipoPainel: string;
  raPainel: string;
  statusPainel: 'Pendente' | 'Fabricado' | 'Parcial';
  fabricadoPainel: number;
  saldoPainel: number;
  historicoPainel: HistoricoFabricacao[];
  // Pilares
  pilares: number;
  pilarAlt: number;
  bainhaPilar: number;
  statusPilar: 'Pendente' | 'Fabricado' | 'Parcial';
  fabricadoPilar: number;
  saldoPilar: number;
  historicoPilar: HistoricoFabricacao[];
  // Sapatas
  sapatas: number;
  tamanhoSapata: string;
  tipoSapata: string;
  statusSapata: 'Pendente' | 'Fabricado' | 'Parcial';
  fabricadoSapata: number;
  saldoSapata: number;
  historicoSapata: HistoricoFabricacao[];
  // Gerais
  data: string;
  observacoes: string;
  solicitante: string;
  cargoSolicitante: string;
  dataSolicitacaoRegistro: string;
  statusAutorizacao: 'Aguardando' | 'Autorizado' | 'Negado';
  autorizadoPor: string;
  dataAutorizacao: string;
}

export interface SolicitacaoCompra {
  id: number;
  obraId: number;
  obraNome: string;
  setor: string;
  item: string;
  quantidade: number;
  unidade: string;
  prioridade: 'Baixa' | 'Media' | 'Alta';
  observacoes: string;
  solicitante: string;
  data: string;
  status: string;
  fornecedor: string;
  valor: number;
  pagamento: string;
  imagemOrcamento: string;
  statusFluxo: string;
}

export interface LancamentoFinanceiro {
  id: number;
  tipo: 'Despesa' | 'Receita';
  centro: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  formaPagamento: string;
  status: 'Pendente' | 'Vencido' | 'Pago';
  procId: number;
  data: string;
  emissao: string;
  vencimento: string;
}

export interface Banco {
  id: number;
  nome: string;
  agencia: string;
  conta: string;
}

export interface Insumo {
  id: number;
  nome: string;
  unidade: string;
  coeficiente: number;
  estoqueAtual: number;
  estoqueMinimo: number;
}

export interface Fornecedor {
  id: number;
  nome: string;
  fone: string;
}

export interface TimelineEntry {
  data: string;
  status: string;
  responsavel: string;
}

export interface Processo {
  id: number;
  numero: string;
  obra: string;
  item: string;
  qtd: number;
  valor: number;
  formaPagamento: string;
  status: string;
  timeline: TimelineEntry[];
}

export interface FuncionarioRH {
  id: number;
  codigoInterno: string;
  nome: string;
  sobrenome: string;
  apelido: string;
  admissao: string;
  nacionalidade: string;
  nascimento: string;
  sexo: string;
  cpf: string;
  rg: string;
  pis: string;
  email: string;
  telefone: string;
  notificacao: number;
  whatsapp: number;
  cep: string;
  rua: string;
  bairro: string;
  numero: string;
  complemento: string;
  estado: string;
  cidade: string;
  escolaridade: string;
  cei: string;
  fornecedor: string;
  ocupacao: string;
  tiposDocumentos: string;
  certificacoes: string;
  foto: string;
  documentos: Array<{ nome: string; tipo: string; conteudo: string }>;
}

export interface PainelCarregamento {
  itemId?: string;
  codigo?: string;
  solicitacaoId: number;
  tipo: string;
  dimensao: string;
  comp?: number;
  alt?: number;
  comprimentoMaximoCamada?: number;
  posicaoCarregamento: number;
  lado: 'Esquerdo' | 'Direito' | 'Prancha';
  camada?: number;
  posicaoNaCamada?: number;
  externo?: boolean;
  encostadoNoCavalete?: boolean;
}

export interface Carregamento {
  id: number;
  obraId: number;
  obraNome: string;
  veiculo: 'Munck' | 'Carreta';
  paineis: PainelCarregamento[];
  sequenciaMontagem: number[];
  statusAutorizacao: 'Aguardando' | 'Autorizado' | 'Negado';
  autorizadoPor: string;
  dataAutorizacao: string;
  dataSolicitacao: string;
  solicitante: string;
  executadoPor: string;
  dataExecucao: string;
  status: 'Pendente' | 'Autorizado' | 'Em Carregamento' | 'Carregado' | 'Entregue';
}

export interface Montagem {
  id: number;
  obraId: number;
  obraNome: string;
  carregamentoId: number;
  painelId: string;
  tipo: string;
  dimensao: string;
  equipeResponsavel: string;
  dataMontagem: string;
  observacoes: string;
}

export interface MovimentacaoEstoque {
  id: number;
  insumoId: number;
  insumoNome: string;
  tipo: 'Entrada' | 'Saida';
  quantidade: number;
  obraDestino: string;
  data: string;
  responsavel: string;
  observacoes: string;
}

export interface HistoricoUsoFerramenta {
  responsavel: string;
  dataRetirada: string;
  dataDevolucao: string;
}

export interface Ferramenta {
  id: number;
  nome: string;
  codigo: string;
  status: 'Disponivel' | 'Emprestada' | 'Manutencao';
  responsavelAtual: string;
  dataEmprestimo: string;
  dataDevolvida: string;
  historicoUso: HistoricoUsoFerramenta[];
}

export interface Config {
  [chave: string]: string;
}

// Storage keys
export const STORAGE_KEYS = {
  USUARIOS: 'cbh_usuarios',
  OBRAS: 'cbh_obras',
  SOLICITACOES: 'cbh_solicitacoes',
  SOLICITACOES_COMPRA: 'cbh_solicitacoes_compra',
  LANCAMENTOS: 'cbh_lancamentos',
  BANCOS: 'cbh_bancos',
  INSUMOS: 'cbh_insumos',
  FORNECEDORES: 'cbh_fornecedores',
  PROCESSOS: 'cbh_processos',
  FUNCIONARIOS_RH: 'cbh_funcionarios_rh',
  CARREGAMENTOS: 'cbh_carregamentos',
  MONTAGENS: 'cbh_montagens',
  MOVIMENTACOES_ESTOQUE: 'cbh_movimentacoes_estoque',
  FERRAMENTAS: 'cbh_ferramentas',
  CONFIG: 'cbh_config',
  CURRENT_USER: 'cbh_current_user',
} as const;
