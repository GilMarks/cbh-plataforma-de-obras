# Visao Geral do Negocio - CBH Plataforma de Obras

## O que e o sistema

Plataforma de gestao operacional para uma empresa de pre-fabricados de concreto (CBH). Controla o ciclo completo: desde a solicitacao de fabricacao de pecas (paineis, pilares, sapatas) ate a entrega e montagem na obra, passando por compras, financeiro e RH.

## Modulos

| Modulo | Telas | Responsavel Principal |
|---|---|---|
| Autenticacao | Login | Todos |
| Dashboard | Dashboard | Master, Mestre |
| Autorizacao | Autorizacao | Master |
| Fabrica | Controle, Historico, Estoque, Carregamento | Mestre, Encarregado, Ferreiro, Betoneiro |
| Obra | Visao Geral, Solicitacao Fabricacao, Orcamento, Carregamento, Paineis Montados, Historico Montagem | Mestre, Encarregado |
| Compras | Solicitacoes, Status, Estoque, Cadastramento, Historico Consumo, Ferramentas | Compras, Mestre |
| Financeiro | Visao Geral, Contas a Pagar, Contas Pagas, Bancos | Financeiro |
| RH | Cadastro, Lista de Funcionarios | RH |
| Admin | Usuarios, Configuracoes | Master |

## Fluxo Principal do Negocio

```
[Obra solicita fabricacao]
        |
        v
[Autorizacao pelo Master]
        |
        v
[Fabrica produz as pecas]
        |
        v
[Obra planeja carregamento]
        |
        v
[Autorizacao do carregamento]
        |
        v
[Fabrica executa o carregamento]
        |
        v
[Obra recebe e monta os paineis]
```

## Fluxo de Compras

```
[Solicitacao criada] -> [Cotacao adicionada] -> [Enviado para autorizacao]
        |
        v
[Master aprova/nega]
        |
 [Aprovado] -> [Lancamento financeiro criado automaticamente]
        |
        v
[Financeiro paga a conta]
```

## Entidades Principais

| Entidade | Storage Key | Descricao |
|---|---|---|
| Usuario | `cbh_usuarios` | Usuarios do sistema com cargo e tipo |
| Obra | `cbh_obras` | Canteiros de obra com metas de pecas |
| Solicitacao | `cbh_solicitacoes` | Pedidos de fabricacao de pecas |
| SolicitacaoCompra | `cbh_solicitacoes_compra` | Pedidos de compra de materiais |
| Processo | `cbh_processos` | Rastreio de processos de compra (CP-XXXXX) |
| LancamentoFinanceiro | `cbh_lancamentos` | Despesas e receitas financeiras |
| Banco | `cbh_bancos` | Contas bancarias da empresa |
| Insumo | `cbh_insumos` | Materiais com controle de estoque |
| Fornecedor | `cbh_fornecedores` | Cadastro de fornecedores |
| Carregamento | `cbh_carregamentos` | Planos de carregamento de caminhao |
| Montagem | `cbh_montagens` | Registros de montagem na obra |
| MovimentacaoEstoque | `cbh_movimentacoes_estoque` | Entradas e saidas de insumos |
| Ferramenta | `cbh_ferramentas` | Ferramentas com rastreio de emprestimo |
| FuncionarioRH | `cbh_funcionarios_rh` | Funcionarios cadastrados no RH |

## Papeis (Cargos) e Permissoes

| Cargo | Acesso |
|---|---|
| Master | Tudo (wildcard `*`) |
| Mestre | Dashboard, Fabrica, Obra, Compras (parcial), Usuarios |
| Encarregado | Idem Mestre |
| Financeiro | Financeiro (todas), Usuarios |
| Compras | Compras (todas), Fabrica/Estoque, Usuarios |
| RH | RH (todas), Usuarios |
| Meio-profissional, Ferreiro, Betoneiro, Servente | Apenas `fabrica/controle` |

## Dados Tecnicos

- Frontend: React 19 + Vite + TypeScript + Tailwind CSS 4
- Persistencia: 100% localStorage (sem backend)
- Seed versao atual: `6` (chave `cbh_seeded`)
- Usuarios demo: admin/admin123 (Master), Walason/123456 (Master), Carlos/123456 (Mestre), Ana/123456 (Financeiro), Pedro/123456 (Compras), Joao/123456 (Ferreiro), Maria/123456 (Betoneiro)
