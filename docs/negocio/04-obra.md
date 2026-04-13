# Modulo Obra

## Telas
- `/obra/visao-geral` - Gestao de Obras
- `/obra/fabricacao` - Solicitacao de Fabricacao
- `/obra/orcamento` - Solicitacao de Orcamento
- `/obra/carregamento` - Planejamento de Carregamento
- `/obra/paineis-montados` - Registro de Montagem
- `/obra/historico-montagem` - Historico de Montagem

## Acesso
Mestre, Encarregado (e Master)

---

## Tela: Visao Geral das Obras (`/obra/visao-geral`)

### Proposito
CRUD de obras (canteiros) com acompanhamento de progresso por tipo de peca.

### Regras de Negocio

1. `nome` obrigatorio para salvar.
2. Exclusao requer `confirm()`.
3. Cada obra define metas minimas: `paineisMin`, `pilaresMin`, `sapatasMin`.

### Calculo de Progresso por Obra

```
Para cada obra:
  totalP  = soma(s.paineis)  para todas as solicitacoes da obra
  fabP    = soma(s.fabricadoPainel) para as mesmas solicitacoes
  progresso = Math.min(100, (fabP / (totalP || paineisMin || 1)) * 100)
```

Fallback: usa `paineisMin` se nao houver solicitacoes; usa `1` para evitar divisao por zero.

### Campos da Obra
`nome (req), cliente, local, observacoes, paineisMin, pilaresMin, sapatasMin`

---

## Tela: Solicitacao de Fabricacao (`/obra/fabricacao`)

### Proposito
Criacao de pedidos de fabricacao de pecas (paineis, pilares, sapatas) para a fabrica produzir.

### Regras de Negocio

1. Obra deve ser selecionada (`formObraId` nao vazio e deve existir no storage).
2. Pelo menos um tipo de peca deve ter quantidade > 0 (`paineis + pilares + sapatas > 0`).
3. Solicitacao criada sempre com `statusAutorizacao: 'Aguardando'`.
4. Registra `solicitante` (login) e `cargoSolicitante` do usuario logado.

### Estado Inicial de uma Nova Solicitacao

- Todos os tipos: `status: 'Pendente'`, `fabricado: 0`, `saldo: quantidade`
- Historico de cada tipo: array vazio `[]`
- `data` e `dataSolicitacaoRegistro`: data de hoje

### Valores Default do Formulario

| Campo | Default |
|---|---|
| painelComp | 5 |
| painelAlt | 3 |
| tipoPainel | 'Liso' |
| pilarAlt | 3 |
| tamanhoSapata | 'Grande' |
| tipoSapata | 'Normal' |

### Classificacao "Concluida"

Uma solicitacao e concluida quando:
- `statusAutorizacao === 'Autorizado'`
- Para cada tipo com quantidade > 0: `status{Tipo} === 'Fabricado'`

### KPIs
- Total Solicitacoes
- Total Pecas (soma de todos os tipos em todas as solicitacoes)
- Aguardando Autorizacao (count)

---

## Tela: Solicitacao de Orcamento (`/obra/orcamento`)

### Proposito
Criar pedidos de cotacao de materiais para a obra.

### Regras de Negocio

1. Obra, item e quantidade obrigatorios.
2. Criado sempre com `status: 'SOLICITADO'` e `statusFluxo: 'SOLICITADO'`.
3. Campos financeiros inicializados a zero/vazio: `fornecedor: ''`, `valor: 0`, `pagamento: ''`.

### Valores de Prioridade
`Baixa`, `Media` (default), `Alta`

### Valores de Unidade
`un`, `kg`, `m`, `m3`, `saco`

> Obs: Este fluxo continua na tela `compras/solicitacoes` onde a cotacao e preenchida e o processo avanca para autorizacao.

---

## Tela: Carregamento Obra (`/obra/carregamento`)

### Proposito
Planejamento do carregamento do caminhao. Seleciona paineis fabricados disponíveis e usa simulador drag-and-drop para montar o plano de carga.

### Regras de Negocio

1. Obra e pelo menos um painel no plano sao obrigatorios.
2. Novo carregamento criado com `statusAutorizacao: 'Aguardando'`, `status: 'Pendente'`.
3. **Sistema de reserva**: Paineis ja alocados em carregamentos com `statusAutorizacao !== 'Negado'` sao contados como reservados e subtraidos do estoque disponivel.
4. Formula disponibilidade: `disponivel = Math.max(fabricadoPainel - reservado, 0)`
5. Codigos de paineis: `PA-{solicitacaoId}-{numeroPainel}` (numeroPainel considera ja-reservados).
6. Tipos de veiculo: `Munck` ou `Carreta`.

### Calculos de Capacidade

- `getCapacidadeResumo()`: calcula metros ocupados e percentual de uso do caminhao.
- Munck: `profundidade * maxLayerLength * 2` (dois lados)
- Carreta: `profundidade * maxLayerLength`
- `capacidadePercentual = Math.round((totalMetros / capacidadeTotal) * 100)`, clamped 0-100.

### KPIs
- Total Carregamentos
- Aguardando Execucao
- Paineis Livres (total disponivel)
- Obras com Estoque

---

## Tela: Paineis Montados (`/obra/paineis-montados`)

### Proposito
Registrar a montagem dos paineis na obra apos recepcao do caminhao.

### Filtro de Dados
`cbh_carregamentos` onde `status === 'Carregado' OR status === 'Entregue'`

### Regras de Negocio

1. Carregamento selecionado e `equipe` (texto) obrigatorios.
2. Cria **um registro `Montagem` por painel** do carregamento (`paineis.forEach`).
3. ID do painel: `{painel.tipo}-{painel.posicaoCarregamento}-{painel.lado}`
4. Apos criar todas as montagens, atualiza o carregamento: `status: 'Entregue'`.

### Fluxo de Status

```
'Carregado' (exibido como "Em Rota")  -->  'Entregue' (exibido como "Montado")
```

### Display de Status
- `Carregado` -> badge "Em Rota" (azul)
- `Entregue` -> badge "Montado" (verde)

---

## Tela: Historico de Montagem (`/obra/historico-montagem`)

### Proposito
Log de auditoria de todas as montagens. Apenas leitura.

### Colunas da Tabela
Data (dataMontagem), Peca (painelId), Tipo, Dimensao, Obra, Equipe

---

## Logica de Carregamento (`src/lib/carregamento.ts`)

### Constantes
- `TRUCK_MAX_COMP = 6` metros (Munck)
- `CARRETA_MAX_COMP = 12` metros

### Algoritmo de Empacotamento (`buildCamadasCarregamento`)

Algoritmo greedy: adiciona paineis sequencialmente ate a proxima peca ultrapassar o `maxComp`, entao inicia nova camada. Calcula `comprimentoTotal`, `folga` e marca primeira camada como `externa` e ultima como `interna`.

### Sequencia de Montagem (`criarSequenciaMontagem`)

Implementa LIFO: ultimo carregado = primeiro montado.
`sequencia = [N, N-1, ..., 2, 1]`

### Etapas Operacionais (`listarEtapasOperacionaisCarregamento`)

Para Munck: ordem invertida das camadas (mais interna primeiro).
- Mais interna: "Comece encostando no cavalete"
- Mais externa: "Finalize com camada externa para LIFO"
- Intermediaria: "Camada intermediaria"

Para Carreta: ordem direta, primeira faixa = "frontal encostada no cabecalho".

### Reserva de Estoque (`carregamentoReservaEstoque`)

Retorna `true` se `statusAutorizacao !== 'Negado'`. Ou seja, carregamentos pendentes E autorizados reservam estoque. Apenas negados nao reservam.
