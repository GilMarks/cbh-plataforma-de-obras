# Entidades de Dados - CBH

## Schema completo das 15 tabelas do sistema

---

## 1. usuarios

**Descricao:** Usuarios do sistema com credenciais e permissoes.  
**Endpoint:** `GET/POST /api/usuarios` | `GET/PUT/DELETE /api/usuarios/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| login | TEXT | Sim | - | Nome de usuario (UNIQUE) |
| senha | TEXT | Sim | - | Senha (texto puro - migrar para bcrypt) |
| tipo | TEXT | Sim | 'Usuario' | Tipo de acesso: 'Master' ou 'Usuario' |
| cargo | TEXT | Sim | '' | Cargo/perfil: Master, Encarregado, Compras, Financeiro, Mestre, Meio-profissional, Ferreiro, Betoneiro, Servente, RH |
| ativo | INTEGER | Sim | 1 | Status ativo (0/1 = boolean) |
| foto | TEXT | Nao | '' | Foto em base64 |

**Seed:** Login 'Walason', tipo 'Master', cargo 'Master'

---

## 2. obras

**Descricao:** Projetos/obras de construcao de muros.  
**Endpoint:** `GET/POST /api/obras` | `GET/PUT/DELETE /api/obras/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| nome | TEXT | Sim | - | Nome da obra |
| cliente | TEXT | Sim | '' | Nome do cliente |
| local_ | TEXT | Sim | '' | Localizacao (mapeado para 'local' na API) |
| observacoes | TEXT | Nao | '' | Observacoes gerais |
| paineisMin | INTEGER | Sim | 0 | Minimo de paineis requeridos |
| pilaresMin | INTEGER | Sim | 0 | Minimo de pilares requeridos |
| sapatasMin | INTEGER | Sim | 0 | Minimo de sapatas requeridas |

**Nota:** O campo `local_` e mapeado para `local` na API por causa de palavra reservada SQL.

---

## 3. solicitacoes

**Descricao:** Solicitacoes de fabricacao de pecas (paineis, pilares, sapatas).  
**Endpoint:** `GET/POST /api/solicitacoes` | `GET/PUT/DELETE /api/solicitacoes/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| obraId | INTEGER | FK | - | Referencia a obras(id) |
| obraNome | TEXT | Nao | '' | Nome da obra (desnormalizado) |
| clienteNome | TEXT | Nao | '' | Nome do cliente (desnormalizado) |
| **Paineis** | | | | |
| paineis | INTEGER | Nao | 0 | Quantidade de paineis solicitados |
| painelComp | REAL | Nao | 0 | Comprimento do painel (metros) |
| painelAlt | REAL | Nao | 0 | Altura do painel (metros) |
| tipoPainel | TEXT | Nao | '' | Tipo: 'Liso' ou 'Carimbado' |
| raPainel | TEXT | Nao | '' | Tipo de rabo-de-andorinha |
| statusPainel | TEXT | Nao | 'Pendente' | Status: Pendente, Fabricado, Parcial |
| fabricadoPainel | INTEGER | Nao | 0 | Quantidade fabricada |
| saldoPainel | INTEGER | Nao | 0 | Saldo restante |
| historicoPainel | TEXT (JSON) | Nao | '[]' | Historico de fabricacao (array JSON) |
| **Pilares** | | | | |
| pilares | INTEGER | Nao | 0 | Quantidade de pilares solicitados |
| pilarAlt | REAL | Nao | 0 | Altura do pilar (metros) |
| bainhaPilar | REAL | Nao | 0 | Bainha: com ou sem |
| statusPilar | TEXT | Nao | 'Pendente' | Status: Pendente, Fabricado, Parcial |
| fabricadoPilar | INTEGER | Nao | 0 | Quantidade fabricada |
| saldoPilar | INTEGER | Nao | 0 | Saldo restante |
| historicoPilar | TEXT (JSON) | Nao | '[]' | Historico de fabricacao |
| **Sapatas** | | | | |
| sapatas | INTEGER | Nao | 0 | Quantidade de sapatas solicitadas |
| tamanhoSapata | TEXT | Nao | '' | Tamanho: 'Pequena' (70x50x50) ou 'Grande' (90x80x80) |
| tipoSapata | TEXT | Nao | '' | Tipo: Normal, Canto, Excentrica |
| statusSapata | TEXT | Nao | 'Pendente' | Status: Pendente, Fabricado, Parcial |
| fabricadoSapata | INTEGER | Nao | 0 | Quantidade fabricada |
| saldoSapata | INTEGER | Nao | 0 | Saldo restante |
| historicoSapata | TEXT (JSON) | Nao | '[]' | Historico de fabricacao |
| **Gerais** | | | | |
| data | TEXT | Nao | '' | Data solicitada para fabricacao |
| observacoes | TEXT | Nao | '' | Observacoes da solicitacao |
| solicitante | TEXT | Nao | '' | Nome do solicitante |
| cargoSolicitante | TEXT | Nao | '' | Cargo do solicitante |
| dataSolicitacaoRegistro | TEXT | Nao | '' | Data de registro da solicitacao |
| statusAutorizacao | TEXT | Nao | 'Aguardando' | Status: Aguardando, Autorizado, Negado |
| autorizadoPor | TEXT | Nao | '' | Quem autorizou |
| dataAutorizacao | TEXT | Nao | '' | Data da autorizacao |

---

## 4. solicitacoes_compra

**Descricao:** Solicitacoes de compra de materiais/insumos.  
**Endpoint:** `GET/POST /api/solicitacoes-compra` | `GET/PUT/DELETE /api/solicitacoes-compra/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| obraId | INTEGER | FK | - | Referencia a obras(id) |
| obraNome | TEXT | Nao | '' | Nome da obra (desnormalizado) |
| setor | TEXT | Nao | '' | Setor solicitante: 'Obra' ou 'Fabrica' |
| item | TEXT | Nao | '' | Item/insumo solicitado |
| quantidade | REAL | Nao | 0 | Quantidade solicitada |
| unidade | TEXT | Nao | '' | Unidade: un, m, m2, m3, kg, saco |
| prioridade | TEXT | Nao | '' | Prioridade: Baixa, Media, Alta |
| observacoes | TEXT | Nao | '' | Observacoes |
| solicitante | TEXT | Nao | '' | Nome do solicitante |
| data | TEXT | Nao | '' | Data da solicitacao |
| status | TEXT | Nao | 'Aberta' | Status da solicitacao |
| fornecedor | TEXT | Nao | '' | Fornecedor selecionado |
| valor | REAL | Nao | 0 | Valor total |
| pagamento | TEXT | Nao | '' | Forma de pagamento |
| imagemOrcamento | TEXT | Nao | '' | Imagem da cotacao em base64 (anexada por Compras para autorizacao) |
| statusFluxo | TEXT | Nao | '' | Status no fluxo de aprovacao |

---

## 5. lancamentos_financeiros

**Descricao:** Registros financeiros (contas a pagar/pagas).  
**Endpoint:** `GET/POST /api/lancamentos` | `GET/PUT/DELETE /api/lancamentos/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| tipo | TEXT | Nao | '' | Tipo: 'Despesa' ou 'Receita' |
| centro | TEXT | Nao | '' | Centro de custo (nome da obra) |
| descricao | TEXT | Nao | '' | Descricao do lancamento |
| fornecedor | TEXT | Nao | '' | Fornecedor ou cliente |
| valor | REAL | Nao | 0 | Valor monetario (R$) |
| formaPagamento | TEXT | Nao | '' | Forma de pagamento |
| status | TEXT | Nao | 'Pendente' | Status: Pendente, Vencido, Pago |
| procId | INTEGER | Nao | 0 | ID do processo vinculado |
| data | TEXT | Nao | '' | Data do lancamento |
| emissao | TEXT | Nao | '' | Data de emissao do documento |
| vencimento | TEXT | Nao | '' | Data de vencimento |

---

## 6. bancos

**Descricao:** Cadastro de contas bancarias.  
**Endpoint:** `GET/POST /api/bancos` | `GET/PUT/DELETE /api/bancos/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| nome | TEXT | Sim | - | Nome do banco |
| agencia | TEXT | Nao | '' | Numero da agencia |
| conta | TEXT | Nao | '' | Numero da conta |

---

## 7. insumos

**Descricao:** Catalogo de materias-primas/insumos com controle de estoque.  
**Endpoint:** `GET/POST /api/insumos` | `GET/PUT/DELETE /api/insumos/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| nome | TEXT | Sim | - | Nome do material |
| unidade | TEXT | Nao | 'un' | Unidade de medida (un, kg, m, m2, m3, saco, litro) |
| coeficiente | REAL | Nao | 0 | Coeficiente de uso (unidade por peca) |
| estoqueAtual | REAL | Nao | 0 | Quantidade atual em estoque |
| estoqueMinimo | REAL | Nao | 0 | Quantidade minima para alerta |

**Nota:** O historico de compras NAO deve aparecer no cadastro de insumos para evitar poluicao visual (regra de negocio). O historico fica na entidade `movimentacoes_estoque`.

---

## 8. fornecedores

**Descricao:** Cadastro de fornecedores.  
**Endpoint:** `GET/POST /api/fornecedores` | `GET/PUT/DELETE /api/fornecedores/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| nome | TEXT | Sim | - | Nome do fornecedor |
| fone | TEXT | Nao | '' | Telefone de contato |

---

## 9. processos

**Descricao:** Processos de compra com numero sequencial e workflow de aprovacao.  
**Endpoint:** `GET/POST /api/processos` | `GET/PUT/DELETE /api/processos/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| numero | TEXT | Sim | - | Numero do processo (formato CP-XXXXX) |
| obra | TEXT | Nao | '' | Nome da obra |
| item | TEXT | Nao | '' | Item/material |
| qtd | REAL | Nao | 0 | Quantidade |
| valor | REAL | Nao | 0 | Valor total |
| formaPagamento | TEXT | Nao | '' | Forma de pagamento |
| status | TEXT | Nao | 'SOLICITADO' | Status no workflow |
| timeline | TEXT (JSON) | Nao | '[]' | Historico de transicoes (array JSON com data e responsavel) |

**Status possiveis:** SOLICITADO, EM ORCAMENTO, AGUARDANDO_AUTORIZACAO, AUTORIZADO, NO_FINANCEIRO, PAGO, NEGADO

---

## 10. funcionarios_rh

**Descricao:** Cadastro completo de funcionarios (RH).  
**Endpoint:** `GET/POST /api/funcionarios-rh` | `GET/PUT/DELETE /api/funcionarios-rh/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| **Dados Pessoais** | | | | |
| codigoInterno | TEXT | Nao | '' | Codigo interno do funcionario |
| nome | TEXT | Sim | - | Primeiro nome |
| sobrenome | TEXT | Nao | '' | Sobrenome |
| apelido | TEXT | Nao | '' | Apelido |
| admissao | TEXT | Nao | '' | Data de admissao |
| nacionalidade | TEXT | Nao | '' | Nacionalidade |
| nascimento | TEXT | Nao | '' | Data de nascimento |
| sexo | TEXT | Nao | '' | Sexo: Masculino, Feminino, Outro |
| **Documentos** | | | | |
| cpf | TEXT | Nao | '' | CPF |
| rg | TEXT | Nao | '' | RG |
| pis | TEXT | Nao | '' | PIS |
| **Contato** | | | | |
| email | TEXT | Nao | '' | E-mail |
| telefone | TEXT | Nao | '' | Telefone |
| notificacao | INTEGER | Nao | 0 | Permite notificacao (0/1) |
| whatsapp | INTEGER | Nao | 0 | Possui WhatsApp (0/1) |
| **Endereco** | | | | |
| cep | TEXT | Nao | '' | CEP |
| rua | TEXT | Nao | '' | Rua/Avenida |
| bairro | TEXT | Nao | '' | Bairro |
| numero | TEXT | Nao | '' | Numero |
| complemento | TEXT | Nao | '' | Complemento |
| estado | TEXT | Nao | '' | Estado |
| cidade | TEXT | Nao | '' | Cidade |
| **Profissional** | | | | |
| escolaridade | TEXT | Nao | '' | Nivel de escolaridade |
| cei | TEXT | Nao | '' | CEI (Cadastro Especifico INSS) |
| fornecedor | TEXT | Nao | '' | Empresa fornecedora |
| ocupacao | TEXT | Nao | '' | Ocupacao/funcao |
| tiposDocumentos | TEXT | Nao | '' | Tipos de documentos (ex: "RG, CPF, CTPS, ASO") |
| certificacoes | TEXT | Nao | '' | Certificacoes (ex: "NR10, NR35") |
| **Midia** | | | | |
| foto | TEXT | Nao | '' | Foto em base64 |
| documentos | TEXT (JSON) | Nao | '[]' | Documentos anexados (array JSON) |

---

## 11. config

**Descricao:** Armazenamento de configuracoes chave-valor.  
**Endpoint:** `GET /api/config/:chave` | `PUT /api/config/:chave`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| chave | TEXT | Sim (PK) | - | Chave da configuracao |
| valor | TEXT | Sim | - | Valor da configuracao |

**Chaves conhecidas:**
- `numeroProcesso` - Contador sequencial para gerar numeros CP-XXXXX

---

## 12. carregamentos

**Descricao:** Registros de carregamento de pecas da fabrica para a obra.  
**Endpoint:** `GET/POST /api/carregamentos` | `GET/PUT/DELETE /api/carregamentos/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| obraId | INTEGER | FK | - | Referencia a obras(id) |
| obraNome | TEXT | Nao | '' | Nome da obra destino (desnormalizado) |
| veiculo | TEXT | Nao | '' | Tipo de veiculo: 'Munck' ou 'Carreta' |
| paineis | TEXT (JSON) | Nao | '[]' | Array de paineis no carregamento (JSON) |
| sequenciaMontagem | TEXT (JSON) | Nao | '[]' | Sequencia de montagem definida pelo mestre (JSON) |
| statusAutorizacao | TEXT | Nao | 'Aguardando' | Status: Aguardando, Autorizado, Negado |
| autorizadoPor | TEXT | Nao | '' | Quem autorizou |
| dataAutorizacao | TEXT | Nao | '' | Data da autorizacao |
| dataSolicitacao | TEXT | Nao | '' | Data da solicitacao |
| solicitante | TEXT | Nao | '' | Nome do solicitante |
| executadoPor | TEXT | Nao | '' | Encarregado que executou o carregamento |
| dataExecucao | TEXT | Nao | '' | Data da execucao do carregamento |
| status | TEXT | Nao | 'Pendente' | Status geral: Pendente, Autorizado, Em Carregamento, Carregado, Entregue |

**Regras:**
- Caminhao munck/carreta carrega **max 8 paineis** (4 por lado)
- Paineis de tamanhos diferentes podem combinar para **preencher 5m**
- Sequencia de carregamento e **INVERSA** da sequencia de montagem
- Mestre define montagem das **extremidades para dentro**

**Estrutura JSON `paineis`:**
```json
[{
  "solicitacaoId": 1,
  "tipo": "Painel",
  "dimensao": "5x3m",
  "posicaoCarregamento": 1,
  "lado": "Esquerdo"
}]
```

---

## 13. montagens

**Descricao:** Registro de montagem de pecas na obra.  
**Endpoint:** `GET/POST /api/montagens` | `GET/PUT/DELETE /api/montagens/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| obraId | INTEGER | FK | - | Referencia a obras(id) |
| obraNome | TEXT | Nao | '' | Nome da obra (desnormalizado) |
| carregamentoId | INTEGER | FK | - | Referencia a carregamentos(id) |
| painelId | TEXT | Nao | '' | Identificacao da peca |
| tipo | TEXT | Nao | '' | Tipo da peca: Painel, Pilar, Sapata |
| dimensao | TEXT | Nao | '' | Dimensoes da peca |
| equipeResponsavel | TEXT | Nao | '' | Nome da equipe que realizou a montagem |
| dataMontagem | TEXT | Nao | '' | Data da montagem |
| observacoes | TEXT | Nao | '' | Observacoes |

---

## 14. movimentacoes_estoque

**Descricao:** Registro de entradas e saidas de materiais do estoque.  
**Endpoint:** `GET/POST /api/movimentacoes-estoque` | `GET/PUT/DELETE /api/movimentacoes-estoque/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| insumoId | INTEGER | FK | - | Referencia a insumos(id) |
| insumoNome | TEXT | Nao | '' | Nome do insumo (desnormalizado) |
| tipo | TEXT | Sim | - | Tipo: 'Entrada' ou 'Saida' |
| quantidade | REAL | Sim | 0 | Quantidade movimentada |
| obraDestino | TEXT | Nao | '' | Obra destino (apenas para Saida) |
| data | TEXT | Nao | '' | Data da movimentacao |
| responsavel | TEXT | Nao | '' | Responsavel pela movimentacao |
| observacoes | TEXT | Nao | '' | Observacoes |

**Regras:**
- Entrada: soma ao `estoqueAtual` do insumo
- Saida: subtrai do `estoqueAtual` do insumo e registra obra destino

---

## 15. ferramentas

**Descricao:** Cadastro e rastreio de ferramentas.  
**Endpoint:** `GET/POST /api/ferramentas` | `GET/PUT/DELETE /api/ferramentas/:id`

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| id | INTEGER | Auto | AUTOINCREMENT | Chave primaria |
| nome | TEXT | Sim | - | Nome da ferramenta |
| codigo | TEXT | Nao | '' | Codigo de identificacao |
| status | TEXT | Nao | 'Disponivel' | Status: Disponivel, Emprestada, Manutencao |
| responsavelAtual | TEXT | Nao | '' | Quem esta com a ferramenta |
| dataEmprestimo | TEXT | Nao | '' | Data do emprestimo atual |
| dataDevolvida | TEXT | Nao | '' | Data da devolucao |
| historicoUso | TEXT (JSON) | Nao | '[]' | Historico de emprestimos (array JSON) |

**Estrutura JSON `historicoUso`:**
```json
[{
  "responsavel": "Joao",
  "dataRetirada": "2026-04-01",
  "dataDevolucao": "2026-04-05"
}]
```

---

## Campos JSON

As seguintes colunas armazenam dados em formato JSON (string):

| Tabela | Campo | Estrutura |
|--------|-------|-----------|
| solicitacoes | historicoPainel | `[{data, qtd, responsavel}]` |
| solicitacoes | historicoPilar | `[{data, qtd, responsavel}]` |
| solicitacoes | historicoSapata | `[{data, qtd, responsavel}]` |
| processos | timeline | `[{data, status, responsavel}]` |
| funcionarios_rh | documentos | `[{nome, tipo, conteudo}]` |
| carregamentos | paineis | `[{solicitacaoId, tipo, dimensao, posicaoCarregamento, lado}]` |
| carregamentos | sequenciaMontagem | `[number]` (ordem de montagem) |
| ferramentas | historicoUso | `[{responsavel, dataRetirada, dataDevolucao}]` |

O backend CRUD generico automaticamente faz parse de JSON ao ler e stringify ao salvar.

---

## Campos Boolean

Campos INTEGER que representam boolean (0 = false, 1 = true):

| Tabela | Campo |
|--------|-------|
| usuarios | ativo |
| funcionarios_rh | notificacao |
| funcionarios_rh | whatsapp |

O backend CRUD generico automaticamente converte esses campos.
