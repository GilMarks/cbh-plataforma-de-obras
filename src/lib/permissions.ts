export type CargoPermission = string;

const permissoesPorCargo: Record<string, string[]> = {
  Master: ['*'],
  Mestre: [
    'dashboard',
    'fabrica/controle', 'fabrica/historico', 'fabrica/estoque',
    'fabrica/compra', 'fabrica/carregamento',
    'obra/visao-geral', 'obra/fabricacao', 'obra/orcamento',
    'obra/carregamento', 'obra/paineis-montados', 'obra/historico-montagem',
    'compras/estoque', 'compras/solicitacoes', 'compras/status',
    'usuarios',
  ],
  Encarregado: [
    'fabrica/controle', 'fabrica/historico', 'fabrica/estoque',
    'fabrica/compra', 'fabrica/carregamento',
    'obra/visao-geral', 'obra/fabricacao', 'obra/orcamento',
    'obra/carregamento', 'obra/paineis-montados', 'obra/historico-montagem',
    'compras/estoque', 'compras/solicitacoes', 'compras/status',
    'usuarios',
  ],
  Financeiro: [
    'financeiro/contas-pagar', 'financeiro/contas-pagas',
    'financeiro/bancos', 'financeiro/geral',
    'usuarios',
  ],
  Compras: [
    'compras/estoque', 'compras/solicitacoes', 'compras/status',
    'compras/cadastramento', 'compras/historico-consumo',
    'compras/ferramentas',
    'fabrica/estoque',
    'usuarios',
  ],
  RH: ['rh/cadastro', 'rh/lista', 'usuarios'],
  // Cargos operacionais - acesso minimo
  'Meio-profissional': ['fabrica/controle'],
  Ferreiro: ['fabrica/controle'],
  Betoneiro: ['fabrica/controle'],
  Servente: ['fabrica/controle'],
};

export function temAcesso(cargo: string, rota: string): boolean {
  const permissoes = permissoesPorCargo[cargo];
  if (!permissoes) return false;
  if (permissoes.includes('*')) return true;
  return permissoes.some(p => rota.startsWith(p) || rota === p);
}

export function getRotasPermitidas(cargo: string): string[] {
  return permissoesPorCargo[cargo] || [];
}

export function getPrimeiraRotaPermitida(cargo: string): string {
  const rotas = getRotasPermitidas(cargo);
  if (rotas.includes('*')) return '/dashboard';
  if (rotas.length === 0) return '/login';
  return '/' + rotas[0];
}

// Menu structure for sidebar
export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
}

export const menuStructure: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
  { id: 'autorizacao', label: 'Autorizacao', icon: 'Shield', path: '/autorizacao' },
  {
    id: 'fabrica', label: 'Fabrica', icon: 'Factory',
    children: [
      { id: 'fabrica/controle', label: 'Controle de Fabricacao', icon: 'Settings', path: '/fabrica/controle' },
      { id: 'fabrica/historico', label: 'Historico de Producao', icon: 'History', path: '/fabrica/historico' },
      { id: 'fabrica/estoque', label: 'Estoque de Pecas', icon: 'Package', path: '/fabrica/estoque' },
      { id: 'fabrica/carregamento', label: 'Carregamento', icon: 'Truck', path: '/fabrica/carregamento' },
    ],
  },
  {
    id: 'obra', label: 'Obra', icon: 'HardHat',
    children: [
      { id: 'obra/visao-geral', label: 'Visao Geral', icon: 'LayoutDashboard', path: '/obra/visao-geral' },
      { id: 'obra/fabricacao', label: 'Solicitacao de Fabricacao', icon: 'FileText', path: '/obra/fabricacao' },
      { id: 'obra/orcamento', label: 'Solicitacao de Orcamento', icon: 'Receipt', path: '/obra/orcamento' },
      { id: 'obra/carregamento', label: 'Carregamento', icon: 'Truck', path: '/obra/carregamento' },
      { id: 'obra/paineis-montados', label: 'Paineis Montados', icon: 'CheckSquare', path: '/obra/paineis-montados' },
      { id: 'obra/historico-montagem', label: 'Historico de Montagem', icon: 'History', path: '/obra/historico-montagem' },
    ],
  },
  {
    id: 'compras', label: 'Compras', icon: 'ShoppingCart',
    children: [
      { id: 'compras/solicitacoes', label: 'Solicitacoes', icon: 'FileText', path: '/compras/solicitacoes' },
      { id: 'compras/status', label: 'Status', icon: 'Activity', path: '/compras/status' },
      { id: 'compras/estoque', label: 'Estoque de Materiais', icon: 'Package', path: '/compras/estoque' },
      { id: 'compras/cadastramento', label: 'Cadastramento', icon: 'Database', path: '/compras/cadastramento' },
      { id: 'compras/historico-consumo', label: 'Historico de Consumo', icon: 'History', path: '/compras/historico-consumo' },
      { id: 'compras/ferramentas', label: 'Rastreio de Ferramentas', icon: 'Wrench', path: '/compras/ferramentas' },
    ],
  },
  {
    id: 'financeiro', label: 'Financeiro', icon: 'DollarSign',
    children: [
      { id: 'financeiro/geral', label: 'Visao Geral', icon: 'BarChart3', path: '/financeiro/geral' },
      { id: 'financeiro/contas-pagar', label: 'Contas a Pagar', icon: 'FileText', path: '/financeiro/contas-pagar' },
      { id: 'financeiro/contas-pagas', label: 'Contas Pagas', icon: 'CheckCircle', path: '/financeiro/contas-pagas' },
      { id: 'financeiro/bancos', label: 'Cadastro Bancario', icon: 'Landmark', path: '/financeiro/bancos' },
    ],
  },
  {
    id: 'rh', label: 'RH', icon: 'Users',
    children: [
      { id: 'rh/cadastro', label: 'Cadastrar Funcionario', icon: 'UserPlus', path: '/rh/cadastro' },
      { id: 'rh/lista', label: 'Funcionarios', icon: 'Users', path: '/rh/lista' },
    ],
  },
  { id: 'usuarios', label: 'Usuarios', icon: 'UserCog', path: '/usuarios' },
  { id: 'configuracoes', label: 'Configuracoes', icon: 'Settings', path: '/configuracoes' },
];

export function getMenuFiltrado(cargo: string): MenuItem[] {
  return menuStructure
    .map(item => {
      if (item.children) {
        const filteredChildren = item.children.filter(child => temAcesso(cargo, child.id));
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      if (item.path && !temAcesso(cargo, item.id)) return null;
      return item;
    })
    .filter(Boolean) as MenuItem[];
}
