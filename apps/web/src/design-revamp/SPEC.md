# SpotFix Web V2 — Design & Migration Specification

## Design Read

Civic-tech multi-role product (Public Reporter → Supervisor → Cleaner → Master Admin) undergoing a targeted evolution (Strangler Fig) with trust-first / public-sector language, leaning toward shadcn/ui + Tailwind v4 + MapLibre GL + TanStack Query, with role-specific density (mobile-first PWA for field roles, desktop-dense for supervisors/admins).

## Dial Configuration

| Dial | Value | Role Override |
|------|-------|---------------|
| DESIGN_VARIANCE | 5 | — |
| MOTION_INTENSITY | 4 | — |
| VISUAL_DENSITY | 3 | Public / Cleaner |
| | 6 | Supervisor / Admin |

## Tech Stack

| Layer | Choice |
|-------|--------|
| UI Primitives | shadcn/ui (owned code) |
| Styling | Tailwind v4 |
| Animation | Motion (motion/react) |
| Scroll/Parallax | GSAP + ScrollTrigger (leaf components) |
| Maps | MapLibre GL JS + react-map-gl |
| Data Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| PWA | vite-plugin-pwa (Workbox) |
| Icons | Phosphor Icons |
| Fonts | Geist + Geist Mono (self-hosted) |

## Token Recalibration

Source: `apps/web/src/styles.css` → Target: `design-revamp/tokens/`

### Color System

- Base neutrals: cool slate (light/dark compatible)
- Single brand accent: trust-blue (#3b82f6 primary)
- Semantic status colors: reported (red), assigned (blue), inProgress (orange), resolved (green), urgent (plum)
- Role accents for hero metrics only

### Spacing & Sizing

- Baseline 4px grid
- Touch targets: minHeight 48px, minWidth 48px, comfortable 56px
- Section rhythm: mobile py-16 px-4, desktop py-32 px-6

### Typography

- Geist (sans) + Geist Mono
- Mobile-first fluid scaling with clamp()

### Border Radius

- sm: 6, md: 10, lg: 16, xl: 24, pill: 9999

### Elevation

- 5 levels, tinted to neutral slate (dark-mode ready)

## Component Inventory

Phase 1 primitives: button, input, textarea, select, label, card, badge, separator, scroll-area, dialog, sheet, toast, tooltip, popover, tabs

Phase 2 composites: form, table, data-table

Phase 3 custom: MapPicker, PhotoUploader, ReportRow, StatusMetricCard, TaskDetailPanel, CleanerTaskCard, AuthLayout, PortalLayout

## Route Map

| Legacy (hash) | New (pathname) | Role |
|---------------|----------------|------|
| #/ (auth) | /login | All |
| #/ (register) | /register | Public |
| #/ (master) | /login/master | Admin |
| #/ (public-status) | /status | Public (unauth) |
| #/ (public portal) | /dashboard | Public |
| #/ (submit) | /submit | Public |
| #/ (my-reports) | /my-reports | Public |
| #/ (supervisor) | /supervisor | Supervisor |
| #/ (task-board) | /supervisor/tasks | Supervisor |
| #/ (workforce) | /supervisor/workforce | Supervisor |
| #/ (cleaner) | /cleaner | Cleaner |
| #/ (my-tasks) | /cleaner/tasks | Cleaner |
| #/ (admin) | /admin | Admin |
| #/ (overview) | /admin/overview | Admin |
| #/ (registry) | /admin/users | Admin |
| #/monitor | /monitor | Keep as-is |

## Migration Phases

### Phase 1: Foundation
- Install Tailwind v4 + shadcn/ui + deps
- Extract & recalibrate tokens
- Build primitive wrappers
- Configure TanStack Query + API layer
- Set up MapLibre GL
- Configure Vite PWA plugin
- Set up routing + providers

### Phase 2: Public Reporter V2
- /login, /register, /submit, /status, /my-reports, /dashboard
- PWA: install prompt, offline shell, Background Sync

### Phase 3: Cleaner V2
- /cleaner/tasks, /cleaner/account
- PWA: Background Sync for resolution photos, push notifications

### Phase 4: Supervisor/Admin V2
- /supervisor/*, /admin/*
- Dense data tables, sticky detail panels, map dashboard

## Accessibility (WCAG 2.2 AA)

- Color contrast: text 4.5:1, large text 3:1, UI 3:1
- Focus rings: 2px solid brand-500, offset 2px
- Touch targets: min 44x44px (48x48px comfortable)
- Reduced motion support
- Semantic HTML, alt text, ARIA labels

## Performance Budgets

| Metric | Public/Cleaner | Supervisor/Admin |
|--------|----------------|-------------------|
| LCP | < 2.5s | < 2.0s |
| INP | < 200ms | < 150ms |
| CLS | < 0.1 | < 0.05 |
| JS gz | < 120KB | < 180KB |
| CSS gz | < 25KB | < 30KB |

## Approved Decisions

1. Framework: Stay Vite SPA
2. Map style: Custom MapTiler/Protomaps style
3. Testing: Vitest + Playwright
4. Analytics: Plausible
5. State: TanStack Query only (no Zustand)
6. Offline: Background Sync API + IndexedDB fallback
