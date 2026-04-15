const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Pendente:               { bg: '#fef3c7', text: '#92400e', dot: '#d97706' },
  Fabricado:              { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  Parcial:                { bg: '#ffedd5', text: '#9a3412', dot: '#ea580c' },
  Aguardando:             { bg: '#e0e7ff', text: '#3730a3', dot: '#0ea5e9' },
  Autorizado:             { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  Negado:                 { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  Vencido:                { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  Pago:                   { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  SOLICITADO:             { bg: '#fef3c7', text: '#92400e', dot: '#d97706' },
  'EM ORCAMENTO':         { bg: '#e0e7ff', text: '#3730a3', dot: '#0ea5e9' },
  AGUARDANDO_AUTORIZACAO: { bg: '#fef3c7', text: '#92400e', dot: '#d97706' },
  AUTORIZADO:             { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  NO_FINANCEIRO:          { bg: '#eff6ff', text: '#1e40af', dot: '#2563eb' },
  PAGO:                   { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  NEGADO:                 { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  // Carregamento
  'Em Carregamento':      { bg: '#e0e7ff', text: '#3730a3', dot: '#0ea5e9' },
  Carregado:              { bg: '#eff6ff', text: '#1e40af', dot: '#2563eb' },
  Entregue:               { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  // Materiais
  Entrada:                { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  Saida:                  { bg: '#fef3c7', text: '#92400e', dot: '#d97706' },
  // Ferramentas
  Disponivel:             { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  Emprestada:             { bg: '#fef3c7', text: '#92400e', dot: '#d97706' },
  Manutencao:             { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  // Obras
  'Em Andamento':         { bg: '#fef3c7', text: '#92400e', dot: '#d97706' },
  Concluida:              { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  // Prioridade
  Baixa:                  { bg: '#e0e7ff', text: '#3730a3', dot: '#0ea5e9' },
  Media:                  { bg: '#fef3c7', text: '#92400e', dot: '#d97706' },
  Alta:                   { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
};

const DEFAULT = { bg: '#f3f4f6', text: '#374151', dot: '#6b7280' };

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const s = statusStyles[status] ?? DEFAULT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      style={{
        padding: '2px 8px 2px 7px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: '18px',
        background: s.bg,
        color: s.text,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: s.dot,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {status}
    </span>
  );
}
