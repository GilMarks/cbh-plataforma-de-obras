# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Vite)
pnpm build        # Type-check + production build (tsc -b && vite build)
pnpm lint         # ESLint
pnpm preview      # Preview production build
```

No test framework is configured in this project.

## Architecture

This is a **React 19 SPA** (Vite + TypeScript + Tailwind CSS 4) with **zero backend** — all data lives in `localStorage`.

### Data Layer (`src/lib/`)

- **`types.ts`** — All TypeScript interfaces and `STORAGE_KEYS` constants (prefixed `cbh_`).
- **`storage.ts`** — Generic CRUD helpers (`getAll`, `create`, `update`, `remove`) that read/write localStorage. Also handles session (`getCurrentUser`, `setCurrentUser`, `clearCurrentUser`) and seed data (`seedDatabase` — versioned via `cbh_seeded` key, re-seeds on version bump).
- **`permissions.ts`** — Role-based access control. `temAcesso(cargo, rota)` checks if a role can access a route. `getMenuFiltrado(cargo)` filters sidebar items. `getPrimeiraRotaPermitida(cargo)` returns the first allowed route after login.
- **`carregamento.ts`** — Loading/carregamento-specific business logic.

### Auth Flow

1. `seedDatabase()` runs on app start and populates localStorage with demo users if not already seeded.
2. Login page validates credentials against `localStorage[cbh_usuarios]` and stores the authenticated user in `localStorage[cbh_current_user]`.
3. `AppLayout` reads `getCurrentUser()` on every render — redirects to `/login` if null.
4. After login, user is redirected to `getPrimeiraRotaPermitida(cargo)`.

### Routing (`src/router.tsx`)

Two top-level routes:
- `/login` — public, standalone page.
- `/` — protected, wrapped in `AppLayout` (which enforces auth). All app routes are children of this.

### Roles & Permissions

Roles defined in `permissions.ts`: `Master` (all access), `Mestre`, `Encarregado`, `Financeiro`, `Compras`, `RH`, `Meio-profissional`, `Ferreiro`, `Betoneiro`, `Servente`. Master uses `'*'` wildcard. All others have explicit route allowlists.

### UI Structure

- `AppLayout` = `Sidebar` + `Topbar` + `<Outlet />`
- `SidebarContext` manages open/collapsed state
- Icons come from `lucide-react`; charts from `recharts`; drag-and-drop from `@dnd-kit`
- Pages are organized by domain under `src/pages/`: `fabrica/`, `obra/`, `compras/`, `financeiro/`, `rh/`

### Adding a New Page

1. Create component in the appropriate `src/pages/<domain>/` folder.
2. Import and add the route in `src/router.tsx`.
3. Add the menu item to `menuStructure` in `src/lib/permissions.ts`.
4. Add route permissions for each relevant cargo in `permissoesPorCargo`.
