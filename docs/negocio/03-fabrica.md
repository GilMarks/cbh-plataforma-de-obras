# Modulo Fabrica

## Telas
- `/fabrica/controle` - Controle de Fabricacao
- `/fabrica/historico` - Historico de Producao
- `/fabrica/estoque` - Estoque de Pecas
- `/fabrica/carregamento` - Carregamento (execucao)

## Acesso
- Controle: Mestre, Encarregado, Meio-profissional, Ferreiro, Betoneiro, Servente (e Master)
- Historico, Estoque, Carregamento: Mestre, Encarregado (e Master)

---

## Tela: Controle de Fabricacao (`/fabrica/controle`)

### Proposito
Registro diario da producao de pecas contra as solicitacoes autorizadas.

### Filtro de Dados
`cbh_solicitacoes` onde `statusAutorizacao === 'Autorizado'`

### Regras de Negocio

1. Solicitacoes nao autorizadas nao aparecem na tela de producao.
2. Abas separadas por tipo: Paineis, Pilares, Sapatas.
3. Fichas com `meta === 0` para o tipo ativo sao ocultadas.
4. **Incremento bloqueado** quando `fabricado + qtd_atual >= meta`.
5. **Decremento** limitado a minimo 0 (`Math.max(0, ...)`).
6. **Input direto**: clamped a `Math.min(digitado, meta - fabricado)`.
7. Botao "Lancar" desabilitado quando `qtd <= 0` ou durante feedback de 1.5s.

### Calculo de Status por Peca

```
newFab = fabricadoAtual + qtdLancada
saldo  = meta - newFab

Se newFab >= meta -> status = 'Fabricado'
Se newFab < meta  -> status = 'Parcial'
```

O status parte sempre de 'Pendente' (definido na criacao da solicitacao).

### Campos Atualizados no Save

Para cada tipo (Painel/Pilar/Sapata):
- `fabricado{Tipo}`: nova quantidade acumulada
- `saldo{Tipo}`: meta - newFab
- `status{Tipo}`: 'Parcial' ou 'Fabricado'
- `historico{Tipo}`: append de `{ data: hoje, qtd: qtdLancada, responsavel: user.login }`

### Calculos da UI

- `totalLancadoHoje`: soma dos lancamentos de hoje em todas as solicitacoes para o tipo ativo.
- Barra de progresso dual: camada solida (confirmado) + overlay listrado (preview do que sera lancado).
- `baseProgress = Math.min((fabricado / meta) * 100, 100)`
- `previewProgress = Math.min(((fabricado + qtd) / meta) * 100, 100)`

---

## Tela: Historico de Producao (`/fabrica/historico`)

### Proposito
Log de auditoria de toda producao. Apenas leitura.

### Regras de Negocio

- Achata `historicoPainel`, `historicoPilar`, `historicoSapata` de todas as solicitacoes em linhas individuais.
- Prefixos de ID: `PNL-`, `PLR-`, `SPT-` + ID da solicitacao com zero-padding.
- Ordenacao: data decrescente.
- Filtros sao aplicados explicitamente (botao "Aplicar Filtros" ou Enter).

### KPIs
- Total Produzido (soma de `qtdProduzida` de todos os registros filtrados)
- Totais por tipo: Paineis, Pilares, Sapatas

### Funcionalidades Nao Implementadas
- Export CSV: apenas `console.log`
- Export PDF: apenas `console.log`
- Botao "..." por linha: sem handler

---

## Tela: Estoque de Pecas (`/fabrica/estoque`)

### Proposito
Visualizacao do estoque de pecas fabricadas no patio. Selecao para expedicao em lote.

### Regras de Negocio

- Gera uma linha por tipo de peca por solicitacao (apenas se quantidade > 0).
- IDs: `PNL-{id}-A`, `PLR-{id}-A`, `SPT-{id}-A`.
- Filtros em tempo real (sem botao de aplicar).

### KPIs
- `totalPecas`: soma de `qtdFabricada` em todas as pecas.
- `totalCarregando`: count de pecas com status `'Parcial'`.
- `totalDisponivel`: soma de `qtdFabricada` onde status `'Fabricado'`.

### Funcionalidades Nao Implementadas
- "Expedir N Pecas Selecionadas": botao sem handler
- "Nova Expedicao em Lote": botao sem handler
- Aba "Relatorios": sem efeito diferente

---

## Tela: Carregamento Fabrica (`/fabrica/carregamento`)

### Proposito
Execucao fisica dos planos de carregamento autorizados pelo Master.

### Filtro de Dados
`cbh_carregamentos` onde `statusAutorizacao === 'Autorizado' AND status !== 'Carregado' AND status !== 'Entregue'`

### Regras de Negocio

- Apenas carregamentos autorizados e nao finalizados aparecem.
- Ao marcar como executado: `status: 'Carregado'`, `executadoPor: user.login`, `dataExecucao: hoje`.

### Fluxo de Status do Carregamento (visao fabrica)

```
Pendente / Autorizado / Em Carregamento  -->  Carregado  (acao da fabrica)
```

### Exibicao

- Etapas operacionais geradas por `listarEtapasOperacionaisCarregamento()`.
- Contagem de camadas via `totalCamadasNoPlano()`.
- Componente `PlanoCarregamentoResumo` exibe o plano visualmente.
