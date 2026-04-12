# Matriz de Permissoes - CBH

## Acesso por tela para cada cargo do sistema

---

## Legenda

- **X** = Acesso total
- **P** = Acesso parcial (somente leitura ou funcoes limitadas)
- **-** = Sem acesso

---

## Matriz Completa

| # | Tela | ID | Master | Mestre | Financeiro | Compras | RH | Usuario |
|---|------|----|--------|--------|-----------|---------|-----|---------|
| **Sistema** | | | | | | | | |
| 01 | Login | loginPage | X | X | X | X | X | X |
| 02 | Dashboard Executivo | dashboard | X | - | - | - | - | - |
| 03 | Autorizacao | autorizacao | X | - | - | - | - | - |
| 26 | Usuarios | usuarios | X | X | X | X | X | - |
| 27 | Configuracoes | painelConfiguracoes | X | - | - | - | - | - |
| **Fabrica** | | | | | | | | |
| 04 | Resumo da Fabrica | fabrica | X | X | - | - | - | - |
| 05 | Controle de Fabricacao | controle | X | X | - | - | - | X |
| 06 | Estoque de Pecas | estoquePecas | X | X | - | - | - | - |
| 07 | Solicitacao de Orcamento (Fabrica) | compraFabrica | X | X | - | - | - | - |
| 08 | Carregamento (Fabrica) | carregamentoFabrica | X | X | - | - | - | - |
| **Obra** | | | | | | | | |
| 09 | Visao Geral | obras | X | X | - | - | - | - |
| 10 | Solicitacao de Fabricacao | fabricacao | X | X | - | - | - | - |
| 11 | Solicitacao de Orcamento (Obra) | compraObra | X | X | - | - | - | - |
| 12 | Carregamento (Obra) | carregamentoObra | X | X | - | - | - | - |
| 13 | Paineis Montados | paineisMontados | X | X | - | - | - | - |
| 14 | Historico de Montagem | historicoMontagem | X | X | - | - | - | - |
| **Compras / Almoxarifado** | | | | | | | | |
| 15 | Estoque de Materiais | estoque | X | X | - | X | - | - |
| 16 | Solicitacoes | solicitacoesCentral | X | X | - | X | - | - |
| 17 | Status | statusCompras | X | X | - | X | - | - |
| 18 | Cadastramento | cadastramento | X | - | - | X | - | - |
| 19 | Historico de Consumo | historicoConsumo | X | - | - | X | - | - |
| 29 | Rastreio de Ferramentas | ferramentas | X | - | - | X | - | - |
| **Financeiro** | | | | | | | | |
| 20 | Contas a Pagar | financeiroContas | X | - | X | - | - | - |
| 21 | Contas Pagas | financeiroContasPagas | X | - | X | - | - | - |
| 22 | Cadastros Bancarios | financeiroTesouraria | X | - | X | - | - | - |
| 23 | Geral | financeiroGeral | X | - | X | - | - | - |
| **RH** | | | | | | | | |
| 24 | Cadastrar Funcionario | rhCadastro | X | - | - | - | X | - |
| 25 | Funcionarios Cadastrados | rhLista | X | - | - | - | X | - |
| **Auxiliar** | | | | | | | | |
| 28 | Assistente IA | iaBotWrap | X | X | X | X | X | X |

---

## Resumo por Cargo

### Master (Administrador)
- **Total de telas:** 29 (todas)
- **Acoes exclusivas:** Aprovar/negar solicitacoes, cadastrar obras, gerenciar configuracoes

### Mestre (Mestre de Obra/Fabrica)
- **Total de telas:** 16
- **Modulos:** Fabrica (todas), Obra (todas), Compras (estoque, solicitacoes, status), Usuarios

### Financeiro
- **Total de telas:** 6
- **Modulos:** Financeiro (todas), Usuarios

### Compras
- **Total de telas:** 8
- **Modulos:** Compras/Almoxarifado (todas incluindo Rastreio de Ferramentas), Usuarios

### RH (Recursos Humanos)
- **Total de telas:** 4
- **Modulos:** RH (todas), Usuarios

### Usuario (Operador Basico)
- **Total de telas:** 2
- **Modulos:** Controle de Fabricacao apenas + IA

---

## Cargos Disponiveis no Cadastro

Os seguintes cargos podem ser atribuidos na tela de Usuarios:

| Cargo | Perfil de acesso |
|-------|-----------------|
| Master | Administrador (acesso total) |
| Encarregado | Mestre |
| Compras | Compras |
| Financeiro | Financeiro |
| Mestre | Mestre |
| Meio-profissional | Usuario |
| Ferreiro | Usuario |
| Betoneiro | Usuario |
| Servente | Usuario |
| RH | RH |

---

## Implementacao no Front-end

A verificacao de acesso deve ser implementada como middleware no layout do Next.js App Router:

```typescript
// Exemplo de middleware de permissao
const permissoesPorCargo: Record<string, string[]> = {
  'Master': ['*'], // acesso total
  'Mestre': ['fabrica/*', 'obra/*', 'compras/estoque', 'compras/solicitacoes', 'compras/status', 'usuarios'],
  'Encarregado': ['fabrica/*', 'obra/*', 'compras/estoque', 'compras/solicitacoes', 'compras/status', 'usuarios'],
  'Financeiro': ['financeiro/*', 'usuarios'],
  'Compras': ['compras/*', 'usuarios'],
  'RH': ['rh/*', 'usuarios'],
  // demais cargos: apenas 'fabrica/controle'
};
```

### Sidebar Navigation

A sidebar deve renderizar apenas os menus acessiveis ao cargo do usuario logado. Grupos de menu inteiros devem ser ocultados se nenhum submenu for acessivel.
