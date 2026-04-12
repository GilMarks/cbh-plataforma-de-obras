# Workflows e Fluxos de Status - CBH

## Diagramas dos principais processos do sistema

---

## 1. Fluxo de Processo de Compra

O principal workflow do sistema. Controla o ciclo de vida de uma solicitacao de compra, desde a criacao ate o pagamento.

```
  +--------------+
  | SOLICITADO   |  <-- Criado por: Mestre, Compras (via Compra Obra/Fabrica)
  +--------------+
        |
        v
  +--------------+
  | EM ORCAMENTO |  <-- Compras adiciona cotacoes e fornecedores
  +--------------+
        |
        v
  +------------------------+
  | AGUARDANDO_AUTORIZACAO |  <-- Compras envia para aprovacao
  +------------------------+
        |
        +----------+----------+
        |                     |
        v                     v
  +-----------+        +----------+
  | AUTORIZADO|        |  NEGADO  |  <-- Master aprova ou nega
  +-----------+        +----------+
        |                  (fim)
        v
  +----------------+
  | NO_FINANCEIRO  |  <-- Encaminhado para o setor financeiro
  +----------------+
        |
        v
  +------+
  | PAGO |  <-- Financeiro confirma pagamento
  +------+
    (fim)
```

---

## 7. Fluxo de Gestao de Materiais e Estoque

Controla entrada, saida e estoque de materias-primas/insumos.

```
  +-------------------+
  | Cadastro Insumo   |  <-- Nome, unidade de medida (SEM historico no cadastro)
  +-------------------+
        |
        v
  +-------------------+
  | Material Recebido |  <-- Registra quando material chega na fabrica
  | (Entrada)         |     Soma ao estoque atual
  +-------------------+
        |
        v
  +-------------------+
  | Estoque Atual     |  <-- Quantidade disponivel por insumo
  +-------------------+
        |
        v
  +-------------------+
  | Consumo de        |  <-- Subtrai quantidade do estoque
  | Material (Saida)  |     Registra obra de destino
  +-------------------+
        |
        v
  +-------------------+
  | Historico de      |  <-- Todas movimentacoes (entradas/saidas)
  | Consumo           |     com data, responsavel, obra
  +-------------------+
```

### Regras de Negocio (Call)

- Cadastro de insumos inclui **nome, unidade de medida** e historico de compras
- **Historico de materiais NAO deve aparecer no cadastro** para evitar poluicao visual
- Cadastro de fornecedor registra **nome e telefone** do contato
- Material recebido e registrado quando **chega na fabrica**
- Consumo de material **subtrai quantidade do estoque** e registra **obra de destino**

---

## 8. Fluxo de Rastreio de Ferramentas

Controla emprestimo e devolucao de ferramentas.

```
  +-------------------+
  | Cadastro          |  <-- Nome, codigo da ferramenta
  | Ferramenta        |     Status: Disponivel
  +-------------------+
        |
        v
  +-------------------+
  | Emprestimo        |  <-- Registra: quem pegou, data
  |                   |     Status: Emprestada
  +-------------------+
        |
        v
  +-------------------+
  | Em Uso            |  <-- Ferramenta com responsavel atual
  +-------------------+
        |
        v
  +-------------------+
  | Devolucao         |  <-- Registra data de devolucao
  |                   |     Status: Disponivel
  +-------------------+
        |
        v
  +-------------------+
  | Historico de Uso  |  <-- Quem pegou, quando, se foi devolvido
  +-------------------+
```

### Regras de Negocio (Call)

- Rastreio de ferramentas registra **quem pegou, quando e se foi devolvido**
- Historico completo de uso por ferramenta

### Regras de Negocio (Call)

- Compras adiciona **fornecedor, valor, forma de pagamento e imagem da cotacao** para autorizacao
- Autorizacao aprova ou nega solicitacao **antes** de enviar ao setor financeiro
- Financeiro registra: **fornecedor, centro de custo, valor, vencimento e status de pagamento**
- Solicitacao de orcamento vai direto para menu compras com **acesso restrito ao setor**

### Detalhes de cada transicao

| De | Para | Quem executa | Onde acontece |
|----|------|-------------|---------------|
| (novo) | SOLICITADO | Mestre/Compras | Compra Obra ou Compra Fabrica |
| SOLICITADO | EM ORCAMENTO | Compras | Solicitacoes Central |
| EM ORCAMENTO | AGUARDANDO_AUTORIZACAO | Compras | Status Compras |
| AGUARDANDO_AUTORIZACAO | AUTORIZADO | Master | Autorizacao |
| AGUARDANDO_AUTORIZACAO | NEGADO | Master | Autorizacao |
| AUTORIZADO | NO_FINANCEIRO | Sistema (auto) | Status Compras |
| NO_FINANCEIRO | PAGO | Financeiro | Contas a Pagar |

### Registro na Timeline

Cada transicao gera uma entrada no campo `timeline` (JSON) do processo:

```json
{
  "data": "2026-04-09",
  "status": "AUTORIZADO",
  "responsavel": "Walason"
}
```

---

## 2. Fluxo de Fabricacao

Controla o ciclo de vida de uma solicitacao de fabricacao de pecas.

```
  +--------------------+
  | Solicitacao Criada  |  <-- Mestre cria via "Solicitacao de Fabricacao"
  +--------------------+
        |
        v
  +--------------------+
  | Aguardando         |  <-- statusAutorizacao = 'Aguardando'
  | Autorizacao        |
  +--------------------+
        |
        +----------+----------+
        |                     |
        v                     v
  +-----------+        +----------+
  | Autorizado|        |  Negado  |
  +-----------+        +----------+
        |                  (fim)
        v
  +--------------------+
  | Em Producao        |  <-- Aparece no Controle de Fabricacao
  +--------------------+
        |
        v (registro parcial ou total)
  +--------------------+
  | Fabricacao Parcial  |  <-- statusPainel/Pilar/Sapata = 'Parcial'
  | ou Completa        |     ou 'Fabricado'
  +--------------------+
        |
        v
  +--------------------+
  | Estoque de Pecas   |  <-- Pecas prontas aparecem no estoque
  +--------------------+
        |
        v
  +--------------------+
  | Carregamento       |  <-- Pecas sao alocadas em caminhoes
  +--------------------+
        |
        v
  +--------------------+
  | Montagem na Obra   |  <-- Registro de paineis montados
  +--------------------+
        |
        v
  +--------------------+
  | Historico          |  <-- Registro em Historico de Montagem
  +--------------------+
```

### Regras de Negocio (Call)

- Solicitacao de fabricacao sai da obra para autorizacao do master
- Solicitacao especifica: **obra, tipo de peca, quantidade, dimensoes e caracteristicas do painel**
- Apos autorizacao, informacoes vao para controle de fabricacao do setor da fabrica
- Fabrica lanca **producao diaria** com identificacao da peca e data de conclusao
- **Status parcial** aparece quando quantidade fabricada e menor que solicitada
- **Solicitacoes concluidas devem ficar OCULTAS** no menu de fabricacao pendente
- **Novas solicitacoes devem ser criadas** para aumentar quantidade apos autorizacao (nao e permitido alterar quantidade depois de autorizado)

### Status por tipo de peca

Cada solicitacao tem 3 tipos de peca com status independente:

| Status | Significado |
|--------|------------|
| Pendente | Nenhuma peca fabricada ainda |
| Parcial | Parte das pecas ja foi fabricada (fabricado < solicitado) |
| Fabricado | Todas as pecas foram fabricadas (fabricado >= solicitado) |

---

## 3. Fluxo de Autorizacao (Master)

Tela centralizada onde o Master aprova/nega solicitacoes pendentes.

```
  Solicitacoes de Fabricacao     Solicitacoes de Compra     Carregamentos
  (statusAutorizacao =           (status =                  (pendentes)
   'Aguardando')                  'AGUARDANDO_AUTORIZACAO')
        |                              |                        |
        +------------------------------+------------------------+
                                |
                                v
                    +-------------------+
                    | Tela Autorizacao  |  <-- Master only
                    +-------------------+
                         |         |
                         v         v
                    Autorizar    Negar
```

---

## 4. Fluxo de Carregamento e Montagem

Logistica de envio de pecas da fabrica para a obra e montagem no local.

```
  +-------------------+
  | Pecas em Estoque  |  <-- Pecas fabricadas disponiveis na fabrica
  +-------------------+
        |
        v
  +-------------------+
  | Obra solicita     |  <-- Mestre solicita carregamento via menu carregamento
  | Carregamento      |
  +-------------------+
        |
        v
  +-------------------+
  | Definir Sequencia |  <-- Mestre define sequencia de MONTAGEM
  | de Montagem       |     (das extremidades para dentro)
  +-------------------+
        |
        v
  +-------------------+
  | Sistema Inverte   |  <-- Sequencia de carregamento = INVERSA da montagem
  | Sequencia         |     (ultimo a montar = primeiro a carregar)
  +-------------------+
        |
        v
  +-------------------+
  | Gerar Desenho SVG |  <-- Visualizacao no canvas do caminhao
  +-------------------+
        |
        v
  +-------------------+
  | Enviar para       |  <-- Requer autorizacao do Master
  | Autorizacao       |
  +-------------------+
        |
        v
  +-------------------+
  | Encarregado       |  <-- Encarregado da fabrica executa carregamento
  | Executa           |     conforme sequencia solicitada
  +-------------------+
        |
        v
  +-------------------+
  | Paineis aparecem  |  <-- Automaticamente no menu da obra
  | na Obra           |
  +-------------------+
        |
        v
  +-------------------+
  | Mestre registra   |  <-- Registra montagem com nome da equipe responsavel
  | Montagem          |
  +-------------------+
        |
        v
  +-------------------+
  | Historico de      |  <-- Registro permanente
  | Montagem          |
  +-------------------+
```

### Regras de Negocio (Call)

- Obra solicita carregamento de **paineis estocados na fabrica** atraves do menu carregamento
- Mestre da obra define **sequencia de montagem das extremidades para dentro** do veiculo
- **Sequencia de carregamento e INVERSA** da sequencia de montagem
- Caminhao **munck ou carreta** carrega **8 paineis, 4 de cada lado**
- Paineis de **tamanhos diferentes podem ser combinados** para preencher espaco de 5 metros
- Carregamento vai para **autorizacao do master** antes de ser executado
- **Encarregado da fabrica** executa carregamento conforme sequencia solicitada
- Apos carregamento, **paineis aparecem automaticamente** no menu da obra
- Mestre **registra montagem realizada** com nome da equipe responsavel

---

## 5. Fluxo de Login e Acesso

```
  +-------------------+
  | Tela de Login     |  <-- login + senha
  +-------------------+
        |
        v
  +-------------------+
  | Validar usuario   |  <-- Compara com tabela usuarios
  +-------------------+
        |
        +-----+-----+
        |           |
        v           v
    Valido      Invalido --> Mensagem de erro
        |
        v
  +-------------------+
  | Carregar dados    |  <-- 10 endpoints em paralelo
  | da API            |     (usuarios, obras, solicitacoes, etc.)
  +-------------------+
        |
        v
  +-------------------+
  | Verificar cargo   |  <-- cargoTemAcesso()
  +-------------------+
        |
        v
  +-------------------+
  | Exibir menus      |  <-- Apenas menus permitidos para o cargo
  | autorizados       |
  +-------------------+
        |
        v
  +-------------------+
  | Redirecionar      |  <-- Primeira tela permitida
  +-------------------+
```

---

## 6. Fluxo Financeiro

```
  Processo AUTORIZADO
  (do fluxo de compra)
        |
        v
  +-------------------+
  | Lancamento criado |  <-- Status 'Pendente', vinculado ao procId
  | em lancamentos    |
  +-------------------+
        |
        v
  +-------------------+
  | Contas a Pagar    |  <-- Lista lancamentos pendentes/vencidos
  +-------------------+
        |
        +------+------+
        |             |
        v             v
  Vencimento     Pagamento
  ultrapassado   registrado
        |             |
        v             v
  +-----------+  +----------+
  | Vencido   |  |  Pago    |
  +-----------+  +----------+
        |             |
        |             v
        |        +-------------------+
        +------> | Contas Pagas      |
                 | (historico)       |
                 +-------------------+
```
