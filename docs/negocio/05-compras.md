# Modulo Compras

## Telas
- `/compras/solicitacoes` - Solicitacoes Central
- `/compras/status` - Status de Processos
- `/compras/estoque` - Estoque de Materiais
- `/compras/cadastramento` - Cadastro de Insumos e Fornecedores
- `/compras/historico-consumo` - Historico de Consumo
- `/compras/ferramentas` - Rastreio de Ferramentas

## Acesso
Compras, Mestre, Encarregado (e Master). `fabrica/estoque` tambem disponivel para Compras.

---

## Tela: Solicitacoes Central (`/compras/solicitacoes`)

### Proposito
Origem do fluxo de compras: cria solicitacoes, anexa cotacoes e envia para autorizacao.

### Fluxo de Status (State Machine)

```
SOLICITADO  -->  EM_ORCAMENTO  -->  AGUARDANDO_AUTORIZACAO
                                            |
                              AUTORIZADO <--+-- NEGADO
                                  |
                             NO_FINANCEIRO
                                  |
                                PAGO
```

### Transicoes Disponiveis Nesta Tela

| De | Para | Acao | Condicoes |
|---|---|---|---|
| SOLICITADO | EM_ORCAMENTO | Salvar cotacao | fornecedor obrigatorio |
| EM_ORCAMENTO | AGUARDANDO_AUTORIZACAO | Enviar para autorizacao | - |

### Ao Enviar para Autorizacao

1. Atualiza `SolicitacaoCompra.statusFluxo` para `'AGUARDANDO_AUTORIZACAO'`.
2. Cria novo `Processo`:
   - `numero`: formato `CP-XXXXX` (zero-padding 5 digitos, contador em `cbh_config['numeroProcesso']`)
   - `obra`, `item`, `qtd`, `valor`, `formaPagamento`
   - `status: 'AGUARDANDO_AUTORIZACAO'`
   - `timeline`: `[{ data: hoje, status: 'AGUARDANDO_AUTORIZACAO', responsavel: user.login }]`

### Upload de Imagem de Cotacao
- FileReader.readAsDataURL -> base64 armazenado diretamente no localStorage (sem limite de tamanho explicitado).

### Campos da Solicitacao

| Campo | Obrig. | Opcoes |
|---|---|---|
| Obra | Sim | select de obras cadastradas |
| Material/Item | Sim | texto livre |
| Quantidade | Sim | numero |
| Unidade | Nao | un/kg/m/m2/m3/saco/litro |
| Prioridade | Nao | Baixa/Media(default)/Alta |
| Observacoes | Nao | textarea |

### Campos da Cotacao (EM_ORCAMENTO)

| Campo | Obrig. | Obs |
|---|---|---|
| Fornecedor | Sim | select de fornecedores cadastrados |
| Valor | Nao | numero (default 0 se invalido) |
| Forma de Pagamento | Nao | Boleto/PIX/Transferencia/Cartao |
| Imagem da Cotacao | Nao | upload de arquivo, preview base64 |

---

## Tela: Status de Processos (`/compras/status`)

### Proposito
Rastreio visual do ciclo de vida dos processos de compra com timeline grafica.

### Regras de Negocio

- Apenas leitura.
- Ordem de status: `SOLICITADO -> EM ORCAMENTO -> AGUARDANDO_AUTORIZACAO -> AUTORIZADO -> NO_FINANCEIRO -> PAGO -> NEGADO`
- **Inconsistencia**: Status usa `'EM ORCAMENTO'` (com espaco) nesta tela, enquanto outras usam `'EM_ORCAMENTO'` (com underscore).
- Etapas concluidas exibidas com circulo verde; pendentes com circulo cinza/borda.
- `NEGADO` e excluido das etapas pendentes (nao mostrado como proximo passo).

---

## Tela: Estoque de Materiais (`/compras/estoque`)

### Proposito
Controle de estoque de insumos com lancamento de entradas e saidas.

### Regras de Negocio

1. Quantidade > 0 obrigatoria para movimentar.
2. **Entrada**: `novoEstoque = estoqueAtual + qty`
3. **Saida**: `novoEstoque = Math.max(0, estoqueAtual - qty)` (estoque nao pode ficar negativo, mas nao ha validacao de saldo antes de subtrair)
4. `obraDestino` gravado apenas em movimentacoes do tipo Saida.
5. `responsavel` = login do usuario logado.

### Alerta de Estoque Baixo
`estoqueAtual <= estoqueMinimo` -> badge "Alta" (alerta) na coluna Status

### KPIs
- Total de Itens cadastrados
- Itens em Alerta (abaixo do minimo)

---

## Tela: Cadastramento (`/compras/cadastramento`)

### Proposito
CRUD de Insumos e Fornecedores (dados mestres).

### Insumos

- `nome` obrigatorio.
- Criado com `coeficiente: 0`, `estoqueAtual: 0`.
- Edicao atualiza apenas `nome`, `unidade`, `estoqueMinimo` (nao altera `estoqueAtual`).
- Alerta visual: card vermelho se `estoqueAtual <= estoqueMinimo`.
- Unidades: `un, kg, m, m2, m3, saco, litro`.

### Fornecedores

- `nome` obrigatorio.
- Campos: `nome`, `fone`.
- Exclusao nao verifica referencias (pode deletar fornecedor em uso em solicitacoes).

---

## Tela: Historico de Consumo (`/compras/historico-consumo`)

### Proposito
Log de auditoria de todas as movimentacoes de estoque. Apenas leitura.

### KPIs
- Total Entradas, Total Saidas, Total Movimentacoes

---

## Tela: Rastreio de Ferramentas (`/compras/ferramentas`)

### Proposito
Controle de emprestimo e devolucao de ferramentas/equipamentos.

### Estado das Ferramentas

```
Disponivel  <-->  Emprestada
```

### Regras de Negocio

1. Criacao: `nome` obrigatorio. `codigo` livre (sugestao de formato: "FER-004").
2. **Emprestar**: `responsavel` (nome de quem pegou) obrigatorio. Registra `dataEmprestimo: hoje`.
3. **Devolver**: sem modal, acao direta. Appenda em `historicoUso`: `{ responsavel, dataRetirada, dataDevolucao: hoje }`. Limpa `responsavelAtual`.

### KPIs
- Total de ferramentas
- Disponiveis (verde)
- Emprestadas (laranja)

### Historico
Exibe os ultimos 3 registros de `historicoUso` por ferramenta com formato `responsavel: dataRetirada -> dataDevolucao`.
