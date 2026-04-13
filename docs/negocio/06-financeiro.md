# Modulo Financeiro

## Telas
- `/financeiro/geral` - Visao Geral Financeira
- `/financeiro/contas-pagar` - Contas a Pagar
- `/financeiro/contas-pagas` - Historico de Contas Pagas
- `/financeiro/bancos` - Cadastro Bancario

## Acesso
Financeiro (e Master)

---

## Tela: Visao Geral Financeira (`/financeiro/geral`)

### Proposito
Dashboard financeiro com KPIs, grafico de fluxo de caixa e distribuicao de despesas.

### Regras de Negocio

- Apenas leitura.
- Seletor de periodo aplica um **multiplicador simulado** (nao filtra por data real):
  - `'mes-atual'`: x1
  - `'ultimos-30'`: x1.1
  - `'ano-atual'`: x6
- Percentuais de variacao (+12.4%, +8.1%) sao valores hardcoded.
- Grafico de barras (fluxo de caixa) usa dados simulados, nao os lancamentos reais.

### Calculos

- `totalReceitas = sum(valor) where tipo === 'Receita'` * multiplicador
- `totalDespesas = sum(valor) where tipo === 'Despesa'` * multiplicador
- `saldo = totalReceitas - totalDespesas` (vermelho se negativo)
- `totalAtrasado = sum(valor) where status === 'Vencido' AND tipo === 'Despesa'`
- Distribuicao por centro: agrupa despesas por `centro`, calcula `(valor / totalDespesas) * 100`

### Proximas Contas a Pagar
Despesas onde `status !== 'Pago'`, ordenadas por `vencimento` asc, top 5.

### Ultimas Entradas
Receitas ordenadas por `data` desc, top 5.

---

## Tela: Contas a Pagar (`/financeiro/contas-pagar`)

### Proposito
Processar pagamentos de despesas pendentes.

### Filtro de Dados
`cbh_lancamentos` onde `tipo === 'Despesa' AND status !== 'Pago'`

### Regras de Negocio

1. Banco de origem obrigatorio para confirmar pagamento.
2. Delay simulado de 1200ms ao processar.
3. Flash de sucesso por 1500ms antes de remover o item da lista.
4. `valorPago` pode ser alterado pelo usuario (para incluir juros/multa ou desconto).
5. **Nao persiste** `dataPagamento`, `valorPago` nem `contaOrigem` -- apenas atualiza `status: 'Pago'`.

### Classificacao de Vencimento (`getVencimentoStatus`)

| Condicao | Label | Cor |
|---|---|---|
| status === 'Pago' | "Pago" | verde |
| diffDays < 0 | "Atrasado" | vermelho |
| diffDays === 0 | "Vence Hoje" | amarelo |
| diffDays <= 7 | "{N}d" | amarelo |
| otherwise | "A Vencer" | neutro |

### KPIs
- Total Pendente (soma de `Pendente`)
- Total Vencido (soma de `Vencido`)
- Total Geral = Pendente + Vencido

### Campos do Modal de Pagamento

| Campo | Obrig. | Obs |
|---|---|---|
| Conta Bancaria | Sim | select de bancos cadastrados |
| Data Pagamento | Nao | date, default hoje |
| Valor Pago | Nao | numero, default = valor da conta |

---

## Tela: Contas Pagas (`/financeiro/contas-pagas`)

### Proposito
Historico de contas pagas. Apenas leitura.

### Filtro de Dados
`cbh_lancamentos` onde `status === 'Pago'`

### Funcionalidades Nao Implementadas

- "Exportar Excel": botao sem handler
- "Gerar Relatorio": botao sem handler
- "Baixar Arquivo Original" (no modal de comprovante): sem handler
- Comprovante sempre exibe "Nenhum arquivo anexado" (sistema de arquivos nao implementado)
- Paginacao: apenas mostra total e botao de pagina 1 (rudimentar)

---

## Tela: Cadastro Bancario (`/financeiro/bancos`)

### Proposito
CRUD de contas bancarias usadas nos pagamentos.

### Regras de Negocio

1. `nome` obrigatorio.
2. **Campos coletados mas NAO persistidos**: Instituicao Financeira, Tipo de Conta, Chave PIX, Saldo Inicial, Conta Ativa.
3. O select "Instituicao Financeira" nao esta vinculado a nenhum estado (sem binding).
4. Cards exibem "Conta Corrente PJ" e "Ativa" hardcoded independente dos dados reais.

### Campos Efetivamente Salvos

| Campo | Tipo |
|---|---|
| nome | texto identificador |
| agencia | texto |
| conta | texto |

### Impacto
Os bancos cadastrados aparecem no select de "Conta Bancaria de Origem" na tela Contas a Pagar.
