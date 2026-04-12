# PRD - CBH (Construction Business Hub)

## Sistema de Gestao de Muros Pre-Fabricados

**Versao:** 1.0  
**Data:** 2026-04-09  
**Status:** Em desenvolvimento

---

## 1. Visao Geral

O **CBH** e um sistema CRM/ERP completo para gestao de empresas de muros pre-fabricados de concreto. A ferramenta abrange todo o ciclo de vida operacional: desde a solicitacao de fabricacao de pecas (paineis, pilares e sapatas), passando pelo controle de producao e carregamento logistico, ate a gestao financeira, compras, almoxarifado e recursos humanos.

### 1.1 Identidade Visual

| Item | Valor |
|------|-------|
| Nome | CBH - Construction Business Hub |
| Logo | Icone hexagonal geometrico em azul e cinza escuro |
| Cor primaria | `#2563eb` (azul) |
| Cor secundaria | `#334155` (cinza escuro) |
| Fonte | Inter (Google Fonts) |
| Estilo | Moderno, minimalista, profissional |

### 1.2 Escopo do Sistema

| Metrica | Valor |
|---------|-------|
| Total de telas | 28 |
| Modulos | 8 (Sistema, Fabrica, Obra, Compras, Financeiro, RH, Autorizacao, IA) |
| Entidades de dados | 11 tabelas |
| Perfis de usuario | 6 cargos |
| Idioma | Portugues (Brasil) |

---

## 2. Personas e Papeis de Usuario

### 2.1 Master (Administrador Geral)
- **Descricao:** Dono/gestor da empresa. Acesso total ao sistema.
- **Acesso:** Todas as 28 telas, incluindo Dashboard, Autorizacao e Configuracoes.
- **Acoes exclusivas:** Aprovar/negar solicitacoes, cadastrar obras, gerenciar usuarios.

### 2.2 Mestre (Mestre de Obra/Fabrica)
- **Descricao:** Responsavel pela producao e operacao em campo.
- **Acesso:** Fabrica (todas), Obra (todas), Compras (estoque, solicitacoes, status), Usuarios.

### 2.3 Financeiro
- **Descricao:** Responsavel pelo controle financeiro.
- **Acesso:** Financeiro (todas as telas), Usuarios.

### 2.4 Compras
- **Descricao:** Responsavel por compras e almoxarifado.
- **Acesso:** Compras/Almoxarifado (todas as telas), Usuarios.

### 2.5 RH (Recursos Humanos)
- **Descricao:** Responsavel pela gestao de funcionarios.
- **Acesso:** RH (cadastro e lista), Usuarios.

### 2.6 Usuario (Operador Basico)
- **Descricao:** Trabalhador com acesso limitado.
- **Acesso:** Apenas Controle de Fabricacao.

---

## 3. Arquitetura de Navegacao

```
Login
|
App (Sidebar 300px + Area de conteudo)
|
+-- Dashboard Executivo .................. [Master]
+-- Autorizacao .......................... [Master]
|
+-- Fabrica/
|   +-- Resumo da Fabrica
|   +-- Controle de Fabricacao
|   +-- Estoque de Pecas
|   +-- Solicitacao de Orcamento
|   +-- Carregamento
|
+-- Obra/
|   +-- Visao Geral
|   +-- Solicitacao de Fabricacao
|   +-- Solicitacao de Orcamento
|   +-- Carregamento
|   +-- Paineis Montados
|   +-- Historico de Montagem
|
+-- Compras / Almoxarifado/
|   +-- Estoque
|   +-- Solicitacoes
|   +-- Status
|   +-- Cadastramento
|   +-- Historico de Consumo
|
+-- Financeiro/
|   +-- Contas a Pagar
|   +-- Contas Pagas
|   +-- Cadastros Bancarios
|   +-- Geral
|
+-- RH/
|   +-- Cadastrar Funcionario
|   +-- Funcionarios Cadastrados
|
+-- Usuarios
+-- Configuracoes ........................ [Master, topbar]
+-- Assistente IA ........................ [Floating panel]
```

### Topbar (fixa no topo)
- Foto do usuario logado
- Botao Configuracoes (Master only)
- Botao Perfil
- Botao Sair

---

## 4. Stack Tecnologica

### 4.1 Front-end (Novo)

| Tecnologia | Funcao |
|------------|--------|
| Next.js 14+ (App Router) | Framework React com roteamento por arquivos |
| TypeScript | Tipagem estatica |
| Tailwind CSS | Estilizacao utilitaria |
| Shadcn/ui | Componentes base (Button, Input, Select, Card, Dialog, Table, Tabs) |
| Zustand | Gerenciamento de estado global (stores por dominio) |
| React Hook Form + Zod | Formularios com validacao |
| TanStack Table | Tabelas avancadas com ordenacao, filtro, paginacao |
| TanStack Query | Cache e sincronizacao de dados com API |
| Recharts | Graficos e visualizacoes |
| Lucide React | Icones |

### 4.2 Back-end (Existente)

| Tecnologia | Funcao |
|------------|--------|
| Node.js + Express 5 | Servidor HTTP |
| TypeScript | Tipagem |
| better-sqlite3 | Banco de dados SQLite |
| CORS | Cross-origin habilitado |

### 4.3 Estrutura de Rotas Next.js (proposta)

```
app/
├── (auth)/
│   └── login/page.tsx
├── (app)/
│   ├── layout.tsx              # Sidebar + Topbar + auth guard
│   ├── dashboard/page.tsx
│   ├── autorizacao/page.tsx
│   ├── fabrica/
│   │   ├── resumo/page.tsx
│   │   ├── controle/page.tsx
│   │   ├── estoque/page.tsx
│   │   ├── compra/page.tsx
│   │   └── carregamento/page.tsx
│   ├── obra/
│   │   ├── visao-geral/page.tsx
│   │   ├── fabricacao/page.tsx
│   │   ├── orcamento/page.tsx
│   │   ├── carregamento/page.tsx
│   │   ├── paineis-montados/page.tsx
│   │   └── historico-montagem/page.tsx
│   ├── compras/
│   │   ├── estoque/page.tsx
│   │   ├── solicitacoes/page.tsx
│   │   ├── status/page.tsx
│   │   ├── cadastramento/page.tsx
│   │   └── historico-consumo/page.tsx
│   ├── financeiro/
│   │   ├── contas-pagar/page.tsx
│   │   ├── contas-pagas/page.tsx
│   │   ├── bancos/page.tsx
│   │   └── geral/page.tsx
│   ├── rh/
│   │   ├── cadastro/page.tsx
│   │   └── lista/page.tsx
│   ├── usuarios/page.tsx
│   └── configuracoes/page.tsx
```

---

## 5. Roadmap de Desenvolvimento

### Fase 1 - Fundacao ✅ CONCLUIDA
- ~~Setup Next.js + TypeScript + Tailwind + Shadcn/ui~~ (React + Vite + TailwindCSS)
- ~~Design system: tokens de cores, tipografia, espacamento~~
- ~~Layout base: Sidebar (300px) + area de conteudo responsiva~~
- ~~Componentes reutilizaveis: Button, Input, Select, Card, Badge, Table, Dialog~~
- ~~Sistema de autenticacao (login/logout)~~
- ~~Middleware de permissoes por cargo~~
- API client com TanStack Query (pendente - usando localStorage)

### Fase 2 - Modulos Administrativos ⚠️ PARCIAL
- Tela de Usuarios (CRUD completo com upload de foto) -- **PENDENTE**
- ~~Tela de Configuracoes~~
- ~~Dashboard Executivo com KPIs e graficos Recharts~~

### Fase 3 - Modulo Compras/Almoxarifado 🔜 PROXIMA
- Cadastramento (CRUD de insumos + fornecedores)
- Estoque de Materiais (tabela + entrada/saida + rastreio de ferramentas)
- Solicitacoes de compra centralizadas
- Status de processos com timeline visual
- Historico de consumo
- **NOVO:** Rastreio de Ferramentas (quem pegou, quando, devolucao)

### Fase 4 - Modulo Fabrica ⚠️ PARCIAL
- Resumo da Fabrica (KPIs operacionais) -- **PENDENTE**
- ~~Controle de Fabricacao (secoes collapsiveis por tipo de peca)~~
- ~~Estoque de Pecas~~
- Solicitacao de Orcamento -- **PENDENTE**
- Carregamento com visualizacao SVG -- **PENDENTE**
- ~~Historico de Producao~~

### Fase 5 - Modulo Obra 🔜
- Visao Geral (cards por obra com CRUD)
- Solicitacao de Fabricacao (formulario multi-secao + regras: ocultar concluidas, nao alterar qtd apos autorizacao)
- Solicitacao de Orcamento
- Carregamento (layout 2 colunas + canvas SVG + sequencia inversa montagem)
- Paineis Montados (registro automatico apos carregamento + montagem com equipe)
- Historico de Montagem

### Fase 6 - Modulo Financeiro ✅ CONCLUIDA
- ~~Contas a Pagar (cards profissionais com acoes)~~
- ~~Contas Pagas (filtros avancados + exportacao Excel)~~
- ~~Cadastros Bancarios~~
- ~~Geral (dashboard financeiro com KPIs)~~

### Fase 7 - Modulo RH 🔜
- Cadastro de Funcionario (formulario extenso 30+ campos)
- Lista de Funcionarios (tabela com acoes)

### Fase 8 - Autorizacao + IA 🔜
- Tela de Autorizacao (workflow de aprovacao Master-only: 3 tabs - Fabricacao, Compras, Carregamento)
- Painel de Assistente IA (floating chatbot)

### Fase 9 - Polimento e Seguranca
- Autenticacao JWT (substituir senhas em texto puro por bcrypt)
- Upload de arquivos com storage (substituir base64 inline)
- Paginacao nos endpoints da API
- Responsividade mobile completa
- Testes E2E

---

## 6. Problemas Conhecidos (versao atual)

| # | Problema | Severidade | Solucao Proposta |
|---|----------|-----------|------------------|
| 1 | Senhas armazenadas em texto puro | Critica | Implementar bcrypt + JWT |
| 2 | `salvarDados()` faz delete-all + re-insert | Alta | Operacoes atomicas por entidade |
| 3 | HTML duplicado (historicoMontagem) | Media | Eliminar na migracao |
| 4 | Funcoes JS duplicadas (renderDashboard, renderHistoricoConsumo) | Media | Componentizacao React |
| 5 | Sem paginacao nos endpoints | Media | Adicionar LIMIT/OFFSET na API |
| 6 | Fotos em base64 no SQLite | Media | Migrar para file storage |
| 7 | localStorage como fallback dessincronizado | Baixa | Remover; usar apenas API |

---

## 7. Documentos Complementares

| Documento | Descricao |
|-----------|-----------|
| [design-system.md](design-system.md) | Paleta de cores, tipografia, componentes visuais |
| [entidades.md](entidades.md) | Schema completo das 11 tabelas e endpoints API |
| [workflows.md](workflows.md) | Fluxos de status e processos de aprovacao |
| [permissoes.md](permissoes.md) | Matriz de permissoes por cargo (28 telas x 6 cargos) |
| [telas/](telas/) | Especificacao detalhada de cada uma das 28 telas |
