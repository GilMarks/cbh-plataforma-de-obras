const statusStyles: Record<string, string> = {
  Pendente: 'bg-warning-bg text-warning-text border-warning-bg',
  Fabricado: 'bg-success-bg text-success-text border-success-bg',
  Parcial: 'bg-partial-bg text-partial border-partial-bg',
  Aguardando: 'bg-info-bg text-info-text border-info-bg',
  Autorizado: 'bg-success-bg text-success-text border-success-bg',
  Negado: 'bg-danger-bg text-danger-text border-danger-bg',
  Vencido: 'bg-danger-bg text-danger-text border-danger-bg',
  Pago: 'bg-success-bg text-success-text border-success-bg',
  SOLICITADO: 'bg-warning-bg text-warning-text border-warning-bg',
  'EM ORCAMENTO': 'bg-info-bg text-info-text border-info-bg',
  AGUARDANDO_AUTORIZACAO: 'bg-warning-bg text-warning-text border-warning-bg',
  AUTORIZADO: 'bg-success-bg text-success-text border-success-bg',
  NO_FINANCEIRO: 'bg-primary-bg text-primary border-primary-bg',
  PAGO: 'bg-success-bg text-success-text border-success-bg',
  NEGADO: 'bg-danger-bg text-danger-text border-danger-bg',
  // Carregamento
  'Em Carregamento': 'bg-info-bg text-info-text border-info-bg',
  Carregado: 'bg-primary-bg text-primary border-primary-bg',
  Entregue: 'bg-success-bg text-success-text border-success-bg',
  // Materiais
  Entrada: 'bg-success-bg text-success-text border-success-bg',
  Saida: 'bg-warning-bg text-warning-text border-warning-bg',
  // Ferramentas
  Disponivel: 'bg-success-bg text-success-text border-success-bg',
  Emprestada: 'bg-warning-bg text-warning-text border-warning-bg',
  Manutencao: 'bg-danger-bg text-danger-text border-danger-bg',
  // Prioridade
  Baixa: 'bg-info-bg text-info-text border-info-bg',
  Media: 'bg-warning-bg text-warning-text border-warning-bg',
  Alta: 'bg-danger-bg text-danger-text border-danger-bg',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-surface-container text-text-secondary border-surface-container';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${style} ${className}`}>
      {status}
    </span>
  );
}
