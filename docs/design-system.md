# Design System - CBH

## Sistema visual padrao para toda a aplicacao

---

## 1. Paleta de Cores

### Cores Primarias (Marca CBH)

| Token | Hex | Uso |
|-------|-----|-----|
| `primary` | `#2563eb` | Botoes principais, links, menu ativo, destaques |
| `primary-dark` | `#1d4ed8` | Hover de botoes, gradientes |
| `primary-light` | `#dbeafe` | Badges, tags, backgrounds suaves |
| `primary-bg` | `#eff6ff` | Header de tabelas, backgrounds de secao |

### Cores Neutras

| Token | Hex | Uso |
|-------|-----|-----|
| `background` | `#eef2f7` | Fundo geral da aplicacao |
| `surface` | `#ffffff` | Cards, modais, formularios |
| `surface-alt` | `#f8fafc` | Backgrounds alternativos (paineis, canvas) |
| `surface-muted` | `#f9fafb` | Info items, backgrounds de detalhe |
| `sidebar` | `#111827` | Background da sidebar |
| `sidebar-sub` | `#0f172a` | Menu parent na sidebar |
| `sidebar-item` | `#0b1220` | Submenu items |
| `text-primary` | `#111827` | Texto principal |
| `text-secondary` | `#6b7280` | Texto secundario, labels, notas |
| `text-muted` | `#64748b` | Texto muito discreto, placeholders |
| `border` | `#e5e7eb` | Bordas de cards, tabelas, inputs |
| `border-light` | `#d1d5db` | Bordas de inputs, divisores |

### Cores Semanticas

| Token | Hex | Background | Texto | Uso |
|-------|-----|-----------|-------|-----|
| `success` | `#16a34a` | `#dcfce7` | `#166534` | Fabricado, pago, aprovado |
| `success-bright` | `#22c55e` | - | - | Botao pagar |
| `warning` | `#d97706` | `#fef3c7` | `#92400e` | Pendente, alerta |
| `warning-bright` | `#f59e0b` | - | - | Botao editar, alertas |
| `danger` | `#dc2626` | `#fee2e2` | `#991b1b` | Negado, vencido, excluir |
| `danger-bright` | `#ef4444` | - | - | Badge de notificacao, borda financeiro |
| `info` | `#0ea5e9` | `#e0e7ff` | `#3730a3` | Aguardando, informativo |
| `partial` | `#9a3412` | `#ffedd5` | `#9a3412` | Status parcial |

---

## 2. Tipografia

### Fonte
- **Familia:** `'Inter', sans-serif`
- **Origem:** Google Fonts
- **Pesos:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Escala Tipografica

| Elemento | Tamanho | Peso | Uso |
|----------|---------|------|-----|
| h1 (titulo de pagina) | 24px | 700 | Titulos principais de cada tela |
| h2 (subtitulo) | 20px | 700 | Secoes dentro de telas |
| h3 (titulo de card) | 18px | 700 | Headers de cards e paineis |
| Titulo de card (ordem) | 16px | 700 | Titulos de ordens/solicitacoes |
| Body | 14px | 400 | Texto geral, labels, inputs |
| Small / Meta | 13px | 400-500 | Submenu items, itens de tabela |
| Micro / Note | 12px | 400-700 | Notas, badges, tags, contadores |
| Badge / Pill | 11px | 700 | Status badges em tabelas |

---

## 3. Espacamento e Dimensoes

### Border Radius

| Componente | Radius |
|-----------|--------|
| Inputs, botoes | 10px |
| Cards, paineis | 14px |
| Modais, login box | 18px |
| Badges, pills | 999px (circular) |
| Tabela wrap | 14px |

### Padding

| Componente | Padding |
|-----------|---------|
| Cards | 16-18px |
| Inputs | 11px 12px |
| Botoes | 12px 16px |
| Botoes pequenos (toggle) | 8px 14px |
| Badges | 4px 10px |
| Container | 25px |
| Content area | 30px |

### Gap (espacamento entre itens)

| Contexto | Gap |
|----------|-----|
| Grids gerais | 15px |
| Grid 3 colunas | 12px |
| Info list | 8px 12px |
| Botoes em grupo | 10px |
| Menu items | 8px (margin-bottom) |

---

## 4. Layout

### Estrutura Principal

```
+------------------+------------------------------------------+
|                  |  Topbar (fixed, top:15px, right:25px)    |
|    Sidebar       +------------------------------------------+
|    300px         |                                          |
|    fixed         |         Content Area                     |
|    #111827       |         padding: 30px                    |
|                  |         min-width: 1200px                |
|                  |                                          |
|                  |                                          |
+------------------+------------------------------------------+
```

- **Sidebar:** 300px fixo, `position: sticky`, `height: 100vh`, scroll vertical
- **Content:** `flex: 0 0 auto`, `min-width: 1200px`
- **Topbar:** `position: fixed`, `top: 15px`, `right: 25px`, `z-index: 9999`

### Grids Responsivos

| Grid | Colunas | Min-width coluna |
|------|---------|-----------------|
| `.grid` | auto-fit | 250px |
| `.grid-3` | 3 fixas | - |
| `.controle-grid` | auto-fit | 360px |
| `.info-list` | 2 fixas | - |
| `.config-panel` | 2 fixas | - |
| `.finance-grid` | 4 fixas | - |

### Breakpoints

| Breakpoint | Comportamento |
|-----------|---------------|
| `< 1100px` | Carregamento layout: 1 coluna |
| `< 900px` | Sidebar 280px, todos os grids: 1 coluna |

---

## 5. Componentes Base

### 5.1 Botoes

| Variante | Background | Cor | Uso |
|----------|-----------|-----|-----|
| Primary (default) | `#2563eb` | branco | Acoes principais (Entrar, Salvar, Enviar) |
| Secondary | `#374151` | branco | Acoes secundarias (Limpar, Cancelar) |
| Success | `#16a34a` | branco | Acoes positivas (Gerar, Finalizar) |
| Warning | `#d97706` | branco | Acoes de atencao (Editar, Imprimir) |
| Danger | `#dc2626` | branco | Acoes destrutivas (Excluir) |
| Gray | `#6b7280` | branco | Acoes neutras |
| Outline | branco | `#111827` | Acoes terciarias |
| Toggle | `#111827` | branco | Expandir/Minimizar secoes |
| Link | transparente | `#2563eb` | Links textuais (Cadastrar, Esqueci senha) |

### 5.2 Inputs

- **Border:** 1px solid `#d1d5db`
- **Focus:** border `#2563eb` + box-shadow `0 0 0 3px rgba(37,99,235,0.12)`
- **Padding:** 11px 12px
- **Border-radius:** 10px
- **Font-size:** 14px
- **Textarea:** min-height 100px, resize vertical

### 5.3 Cards

- **Background:** `#ffffff`
- **Border:** 1px solid `#e5e7eb`
- **Border-radius:** 14px
- **Padding:** 16px
- **Margin-top:** 14px

**Variante Finance Card:**
- Box-shadow: `0 10px 25px rgba(0,0,0,0.08)`
- Border-left: `6px solid #ef4444`
- Hover: `translateY(-3px)`

### 5.4 Tabelas Profissionais

- **Container:** `.table-wrap` com border e border-radius 14px
- **Header:** background `#eff6ff`, cor `#1e3a8a`, uppercase, letter-spacing 0.04em
- **Celulas:** padding 12px, font-size 13px
- **Hover:** background `#f8fbff`
- **Min-width:** 950px (scroll horizontal em telas menores)

### 5.5 Status Pills/Badges

| Status | Background | Cor | CSS Class |
|--------|-----------|-----|-----------|
| Pendente | `#fef3c7` | `#92400e` | `.status-pendente` |
| Fabricado | `#dcfce7` | `#166534` | `.status-fabricado` |
| Aguardando | `#e0e7ff` | `#3730a3` | `.status-aguardando` |
| Negado | `#fee2e2` | `#991b1b` | `.status-negado` |
| Parcial | `#ffedd5` | `#9a3412` | `.status-parcial` |
| Vencido | `#fee2e2` | `#b91c1c` | `.status-vencido` |

### 5.6 Notificacao Badge

- Background: `#ef4444`
- Cor: branco
- Font-size: 12px
- Padding: 2px 8px
- Border-radius: 20px

### 5.7 Alertas

- Background: `#fef3c7`
- Border: 1px solid `#f59e0b`
- Padding: 10px
- Border-radius: 10px

### 5.8 Mensagens (Toast)

| Tipo | Background | Border | Cor |
|------|-----------|--------|-----|
| Erro | `#fee2e2` | `#ef4444` | `#991b1b` |
| Sucesso | `#dcfce7` | `#22c55e` | `#166534` |

### 5.9 Vazio (Empty State)

- Text-align: center
- Padding: 30px
- Border: 1px dashed `#cbd5e1`
- Border-radius: 12px
- Background: `#f8fafc`
- Cor: `#64748b`

---

## 6. Icones

Usar **Lucide React** como biblioteca de icones. Mapeamento sugerido:

| Funcao | Icone |
|--------|-------|
| Dashboard | `LayoutDashboard` |
| Fabrica | `Factory` |
| Obra | `Building2` |
| Compras | `ShoppingCart` |
| Financeiro | `DollarSign` |
| RH | `Users` |
| Autorizacao | `ShieldCheck` |
| Configuracoes | `Settings` |
| Perfil | `User` |
| Sair | `LogOut` |
| Adicionar | `Plus` |
| Editar | `Pencil` |
| Excluir | `Trash2` |
| Visualizar | `Eye` |
| Filtrar | `Filter` |
| Buscar | `Search` |
| Expandir | `ChevronRight` |
| Notificacao | `Bell` |
| Chat/IA | `MessageCircle` |

---

## 7. Animacoes e Transicoes

| Elemento | Transicao |
|----------|-----------|
| Menu arrow (rotate) | `transition: 0.2s` |
| Menu hover | `transition: 0.2s` |
| Finance card hover | `transform: translateY(-3px)`, `transition: 0.2s` |
| Focus de input | box-shadow com transicao suave |

---

## 8. Mapeamento Shadcn/ui

| Componente CBH | Componente Shadcn/ui |
|----------------|---------------------|
| Botoes | `Button` (variants: default, secondary, destructive, outline, ghost) |
| Inputs | `Input` |
| Selects | `Select` |
| Cards | `Card`, `CardHeader`, `CardContent` |
| Tabelas | `Table` + TanStack Table |
| Modais | `Dialog` |
| Badges/Pills | `Badge` |
| Menus collapsiveis | `Collapsible` |
| Tabs | `Tabs` |
| Tooltips | `Tooltip` |
| Toasts | `Toast` (sonner) |
| Formularios | `Form` (React Hook Form integration) |
| Sidebar | `Sidebar` (Shadcn sidebar component) |
