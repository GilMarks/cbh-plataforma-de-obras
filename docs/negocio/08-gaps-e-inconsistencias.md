# Gaps e Inconsistencias Identificados

Este documento lista funcionalidades incompletas, bugs de negocio e inconsistencias identificadas durante o estudo das telas.

---

## Funcionalidades Decorativas (sem logica implementada)

| Tela | Elemento | Status |
|---|---|---|
| Login | "Lembrar deste dispositivo" (checkbox) | Sem logica |
| Login | "Esqueceu a senha?" (link) | Sem acao |
| Configuracoes | "Alterar Foto" | Sem handler |
| Configuracoes | "Descartar Alteracoes" | Sem handler |
| Configuracoes | Campos Email, Telefone, Senha, Tema, Notificacoes | Coletados mas nao salvos |
| Historico Producao | Export CSV e Export PDF | apenas `console.log` |
| Historico Producao | Botao "..." por linha | Sem handler |
| Estoque Pecas | "Expedir N Pecas Selecionadas" | Sem handler |
| Estoque Pecas | "Nova Expedicao em Lote" | Sem handler |
| Estoque Pecas | Aba "Relatorios" | Sem efeito diferente |
| Contas Pagas | "Exportar Excel" | Sem handler |
| Contas Pagas | "Gerar Relatorio" | Sem handler |
| Contas Pagas | "Baixar Arquivo Original" (modal) | Sem handler |
| Cadastro Bancario | Select "Instituicao Financeira" | Sem binding de estado |

---

## Dados Coletados Mas Nao Persistidos

| Tela | Campos |
|---|---|
| Cadastro Bancario | Instituicao Financeira, Tipo de Conta, Chave PIX, Saldo Inicial, Conta Ativa |
| Contas a Pagar | dataPagamento, valorPago, contaOrigem (apenas `status: 'Pago'` e salvo) |
| Contas Pagas | Sistema de comprovante/arquivo (sempre exibe "Nenhum arquivo anexado") |

---

## Inconsistencias de Status

| Problema | Localizacao |
|---|---|
| `'EM ORCAMENTO'` (com espaco) vs `'EM_ORCAMENTO'` (com underscore) | `StatusCompras.tsx` usa espaco; todas as outras telas usam underscore |
| Cards de banco exibem "Conta Corrente PJ" e "Ativa" hardcoded | `CadastroBancario.tsx` |

---

## Seguranca

| Problema | Severidade |
|---|---|
| Senhas armazenadas em texto plano no localStorage | Alta |
| Sem hash ou criptografia de senhas | Alta |
| Sessao armazenada como JSON sem assinatura no localStorage | Media |
| Sem timeout de sessao | Baixa |

---

## Dados Calculados com Simulacao (nao refletem dados reais)

| Tela | Campo | Comportamento |
|---|---|---|
| Dashboard | Grafico de fluxo de caixa (Jan-Mar) | Valores hardcoded |
| Financeiro Geral | Grafico de barras | Dados simulados |
| Financeiro Geral | Percentuais de variacao (+12.4%, +8.1%) | Valores hardcoded |
| Financeiro Geral | Seletor de periodo | Aplica multiplicador ficticio, nao filtra por data |

---

## Paginacao Incompleta

| Tela | Problema |
|---|---|
| Contas Pagas | Exibe apenas total e botao fixo "pagina 1" |

---

## Integridade Referencial

Nenhuma tela verifica dependencias antes de deletar:
- Deletar Fornecedor nao verifica se esta em uso em `SolicitacaoCompra`
- Deletar Insumo nao verifica `MovimentacaoEstoque`
- Deletar Obra nao verifica `Solicitacao` ou `Carregamento`
- Deletar Funcionario nao verifica referencias
