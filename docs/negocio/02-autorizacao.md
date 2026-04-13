# Autorizacao

## Tela: Autorizacao (`/autorizacao`)

### Proposito
Central de aprovacoes do Master. Concentra todas as solicitacoes pendentes de tres dominios: Compras, Fabricacao e Logistica.

### Acesso
Apenas Master.

### Indicadores

- Badge de contagem por aba com total de pendencias.
- Banner de alerta mostrando o total geral de pendencias.

---

## Aba: Compras

### Filtro de Dados
`cbh_solicitacoes_compra` onde `statusFluxo === 'AGUARDANDO_AUTORIZACAO'`

### Ao Negar
1. Atualiza `SolicitacaoCompra`: `statusFluxo: 'NEGADO'`, `status: 'NEGADO'`

### Ao Aprovar
1. Atualiza `SolicitacaoCompra`: `statusFluxo: 'AUTORIZADO'`, `status: 'AUTORIZADO'`
2. Busca `Processo` correspondente (match por `item === s.item AND obra === s.obraNome`)
3. Se encontrado: atualiza `Processo.status` para `'NO_FINANCEIRO'` e adiciona 2 entradas na timeline:
   - `{ status: 'AUTORIZADO', responsavel: user.login, data: hoje }`
   - `{ status: 'NO_FINANCEIRO', responsavel: 'Sistema', data: hoje }`
4. **Sempre cria um novo `LancamentoFinanceiro`**:
   - `tipo: 'Despesa'`
   - `centro: obraNome`
   - `descricao: item`
   - `fornecedor: s.fornecedor`
   - `valor: s.valor`
   - `formaPagamento: s.pagamento`
   - `status: 'Pendente'`
   - `procId: processo.id ?? 0`
   - `data/emissao: hoje`
   - `vencimento: ''` (vazio)

---

## Aba: Fabricacao

### Filtro de Dados
`cbh_solicitacoes` onde `statusAutorizacao === 'Aguardando'`

### Ao Negar
- `statusAutorizacao: 'Negado'`, `autorizadoPor: user.login`, `dataAutorizacao: hoje`

### Ao Aprovar
- `statusAutorizacao: 'Autorizado'`, `autorizadoPor: user.login`, `dataAutorizacao: hoje`

---

## Aba: Logistica

### Filtro de Dados
`cbh_carregamentos` onde `statusAutorizacao === 'Aguardando'`

### Ao Negar
- `statusAutorizacao: 'Negado'`, `autorizadoPor: user.login`, `dataAutorizacao: hoje`

### Ao Aprovar
- `statusAutorizacao: 'Autorizado'`, `autorizadoPor: user.login`, `dataAutorizacao: hoje`
- `status: 'Autorizado'`

---

## Experiencia da UI

- Drawer lateral (460px) ao clicar em uma solicitacao de compra, exibe todos os detalhes incluindo imagem de cotacao (base64).
- Toast de feedback (3.8s) apos cada decisao.
- Animacao de dismiss (320ms fade+slide) antes de remover o item da lista.
- Codigos de prioridade: Alta=vermelho, Media=amarelo, Baixa=indigo.
