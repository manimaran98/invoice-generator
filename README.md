# Invoice Generator — Implementation Plan

This document is the **build spec** for the system. Implementation should follow this plan unless we explicitly revise it.

---

## 1. Goals

- Web UI for **multi-tenant** use: each **organization** is an isolated tenant; users belong to one or more orgs via **membership**.
- **Invoices** with clients, line items, statuses, and **PDF** output — all scoped to the **active organization**.
- **PostgreSQL** as the source of truth.
- **Docker** for local and deployment-shaped environments.
- **Async PDF** via **BullMQ + Redis** (not synchronous in-request generation for MVP).

---

## 2. Stack (locked)

| Concern | Choice |
|--------|--------|
| Tenancy model | **Organization** = tenant; **Membership** links **User** ↔ **Organization** with a **role**; every domain row includes `organizationId` |
| Frontend | **Next.js** (App Router, TypeScript) |
| Backend | **NestJS** (TypeScript) |
| Database | **PostgreSQL** |
| ORM & migrations | **Prisma** (live in `apps/api`, single schema) |
| Auth | **Email + password**; **Nest** issues **JWT** embedding **user id + active `organizationId`**; **Next** BFF sets **httpOnly** cookie |
| Job queue | **BullMQ** (Node/Nest-native job retries, backoff, stalled recovery). **Redis** is the broker/backing store — see **§7.1** vs RabbitMQ |
| PDF rendering | **pdf-lib** (pure JS) + **code-defined invoice layout** in the API — template spec in **§7.2** |
| Process model | Browser → **Next** only for HTML; privileged calls **Next Route Handlers / Server Actions** → **Nest** with `Authorization: Bearer …` from cookie |

**Intentionally omitted for MVP:** OAuth, separate Python service. **Invites / SSO** can follow in a later phase.

---

## 3. Security model (auth + tenancy)

### Login / register

1. User submits email/password on Next (login/register pages).
2. Next calls Nest (`POST /auth/login`, `POST /auth/register`).
3. **Register (MVP):** create **User**, create a default **Organization**, create **Membership** with role `OWNER` for that org (user is never “org-less”).
4. Nest returns `{ accessToken }`. JWT payload includes at minimum: `sub` (user id), `orgId` (active organization id), `role` (role in that org for quick guards).
5. Next **sets** `httpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/` cookie (e.g. name `access_token`). **Do not** expose the token to client JS.
6. Subsequent server-side requests: Next reads the cookie, attaches `Authorization: Bearer <token>` to Nest.
7. Nest validates JWT (`JwtAuthGuard`) and **tenant scope**: for every org-scoped route, **`orgId` from JWT must match** the `organizationId` on the resource (or the body/list filter).

### Switching organizations

- `POST /auth/switch-organization` with `{ organizationId }` body (or Next BFF equivalent).
- Nest verifies the user has a **Membership** for target org; issues a **new JWT** with updated `orgId` / `role`.
- Next replaces the httpOnly cookie.

### Authorization (roles)

MVP roles (enum): **`OWNER`**, **`MEMBER`** (extend later: `BILLING`, `READ_ONLY`, etc.).

- **OWNER:** manage org profile, membership (future), all invoices/clients.
- **MEMBER:** CRUD clients/invoices per product rules (MVP: same as OWNER unless we restrict deletes).

Enforcement: Nest **guard** checks JWT `role` + route metadata; optional **CASL**/**policy** layer later.

**Future:** refresh tokens, CSRF strategy if we add unsafe cookie patterns, rate limits on `/auth/*`, **email invites** to join an org.

---

## 4. Repository layout (monorepo)

```
invoice-generator/
  apps/
    web/                 # Next.js
    api/                 # NestJS + Prisma + BullMQ processors
  docker/
    Dockerfile.web
    Dockerfile.api
  docker-compose.yml
  .env.example
  PLAN.md                # this file
```

Optional later: `packages/shared` for Zod/DTO types if duplication hurts.

Root **`package.json`**: npm **workspaces** (`apps/*`) unless we standardize on pnpm later.

---

## 5. Docker Compose (conceptual)

Services:

| Service | Role |
|---------|------|
| `db` | PostgreSQL 16+, named volume, healthcheck |
| `redis` | **Redis** — BullMQ backing store (job queue); RabbitMQ **not** in compose for MVP |
| `api` | NestJS; depends on `db` + `redis`; runs migrations before or on start |
| `web` | Next.js; depends on `api`; **server-only** env for internal API base URL |

Networking:

- Single internal network.
- Expose **`web`** (e.g. `:3000`) to the host for the browser.
- **`api`** on internal port (e.g. `3001`); reachable from `web` as `http://api:3001` (or compose service name).
- **Do not** require the browser to call Nest directly for MVP (reduces CORS and token leakage).

Environment:

- `.env.example` lists: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `API_INTERNAL_URL` (web → NEST), `NEXT_PUBLIC_*` only if truly public (prefer zero for secrets).

---

## 6. Data model (MVP, multi-tenant)

Prisma models (adjust naming to taste). **Rule:** all tenant-owned entities reference **`organizationId`**; queries always filter by JWT `orgId` (never trust client-sent org id alone without membership check).

- **User** — `id`, `email` (unique globally), `passwordHash`, timestamps.
- **Organization** — `id`, **branding / legal fields** (legal name, address JSON or text, tax ID, optional `logoUrl`), `invoicePrefix` (e.g. `INV-`), optional **invoice sequence** counter (or separate `InvoiceSequence` table with `FOR UPDATE`), timestamps.
- **Membership** — `userId`, `organizationId`, `role` (`OWNER` | `MEMBER`), `createdAt`; **`@@unique([userId, organizationId])`**.
- **Client** — `organizationId`, name, email, billing address fields.
- **Invoice** — `organizationId`, `clientId`, human-readable `number` (**unique per organization**), `status` (`DRAFT` | `SENT` | `PAID` | `VOID`), `currency`, `issueDate`, `dueDate`, `notes`, **stored** `subtotalCents`, `taxCents`, `totalCents` (recomputed on server on write), optional `createdByUserId` for auditing.
- **InvoiceLineItem** — `invoiceId`, `description`, `quantity`, `unitPriceCents`, `sortOrder`.
- **PdfJob** — `organizationId`, `invoiceId`, Bull job id, `status` (`QUEUED` | `PROCESSING` | `DONE` | `FAILED`), optional `storagePath` or object key, `errorMessage`.

**Invoice numbering:** allocate inside a DB transaction scoped to **`organizationId`** (per-org counter on **Organization** or dedicated row with `FOR UPDATE`).

**Indexes:** `(organizationId, …)` on list endpoints; unique `(organizationId, number)` on **Invoice**.

---

## 7. NestJS module map

- **PrismaModule** — global Prisma client.
- **AuthModule** — `register` (user + default org + owner membership), `login`, `switch-organization`, Passport local + JWT strategy; JWT payload includes `orgId` + `role`.
- **UsersModule** — `GET /users/me`, list user’s orgs (from **Membership**).
- **OrganizationsModule** — `GET/PATCH /organizations/current` (resolve by JWT `orgId`); update legal/branding/invoice prefix for active org.
- **MembershipModule** (or under Organizations) — list members of current org (MVP read-only or OWNER-only); **invites later**.
- **ClientsModule** — CRUD; **organizationId** from JWT only.
- **InvoicesModule** — CRUD; status transitions; totals recomputed server-side; always scope by JWT `orgId`.
- **PdfModule** — enqueue Bull job; `POST /invoices/:id/pdf`, `GET .../pdf/status`, `GET .../pdf/download`; verify invoice belongs to JWT org.

Shared **TenantGuard** / interceptor pattern: attach `organizationId` from JWT to request context; services never accept raw `organizationId` from client without verifying membership (except switch-org endpoint).

### 7.1 Job queue: BullMQ vs RabbitMQ (decision)

| | **BullMQ + Redis** | **RabbitMQ** |
|--|-------------------|--------------|
| **Fit** | First-class **jobs** in Node (attempts, delay, backoff, priorities) | General **messaging** (routing, pub/sub, polyglot consumers) |
| **Infra** | Reuses **Redis** already planned for the stack | Extra broker service + ops |
| **Nest** | **`@nestjs/bullmq`** aligns with processors | `amqplib` / microservices; more hand-rolled job semantics |
| **MVP PDF** | Enqueue → worker → file; good enough | Overkill unless non-Node consumers or org-wide AMQP standard |

**Decision:** **BullMQ + Redis** for MVP. Revisit **RabbitMQ** only if we need multi-language workers or enterprise messaging patterns.

### 7.2 BullMQ worker (PDF queue)

- Queue name e.g. `pdf`.
- **Processor:** load invoice + line items + **Organization** (legal/branding) + **Client**; call the **PDF template renderer** (§7.3); write bytes to volume/temp; update **PdfJob** (`organizationId`-scoped).

### 7.3 PDF template (invoice layout)

**Approach (MVP):** one **versioned, code-defined** template in `apps/api` — a small module (e.g. `InvoicePdfTemplateService`) that accepts a **DTO** (`organization`, `client`, `invoice`, `lineItems[]`) and returns a **PDF `Uint8Array`** via **pdf-lib**.

**Layout contents (minimum):**

- Header: organization legal name, address, tax ID, **optional logo** (`logoUrl` fetched or skipped on failure).
- Meta: invoice number, issue date, due date, currency, status (display only).
- Bill-to: client name and address.
- Table: columns **Description**, **Qty**, **Unit price**, **Line total** (consistent with stored cents / decimals).
- Footer: subtotal, tax, **total**; optional notes block.

**Formatting rules:**

- Money: format from **integer cents** (or minor units) + ISO currency code; no floating-point drift in totals (totals match persisted invoice fields).
- Pagination: if many lines, **pdf-lib** multi-page continuation with repeated header or simple “continued” footers (MVP: reasonable line limit + overflow page is enough).

**Evolution (post-MVP):**

- **Template variants** per org (`organization.invoiceTemplate` enum: `default` | `compact`) — same engine, different drawing code paths.
- **HTML + headless Chromium** (e.g. Puppeteer) only if marketing needs designer-driven HTML/CSS; heavier in Docker and ops.

**Out-of-scope for MVP:** user-uploaded arbitrary HTML/PDF merge, full white-label theme editors.

### 7.4 File layout (API, suggested)

```
apps/api/src/pdf/
  pdf.module.ts
  pdf.processor.ts          # BullMQ consumer → template service → fs
  invoice-pdf.template.ts   # pdf-lib layout + DTO mapping
```

---

## 8. Next.js responsibilities

- **Pages:** login, register, **org switcher** (if user has multiple memberships), dashboard, invoice list/detail/edit (iterative).
- **Route Handlers:** `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `POST /api/auth/switch-organization`; generic `GET|POST|PATCH|DELETE /api/backend/...` **optional** catch-all that forwards path + method + body + cookie → Nest.
- **No** storing JWT in `localStorage`.
- **Middleware** (optional): redirect unauthenticated users away from `/dashboard` (cookie presence check is coarse; fine for MVP).

---

## 9. Implementation phases

### Phase 0 — Tooling

- [ ] Monorepo workspaces, root scripts (`dev:web`, `dev:api`, `docker:up`).
- [ ] Dockerfiles + `docker-compose.yml` + `.env.example`.
- [ ] Prisma schema (**User**, **Organization**, **Membership**, domain models) + first migration.

### Phase 1 — Auth + tenancy

- [ ] Nest: register (user + org + owner membership), login, **switch-organization**, JWT with `orgId` + `role`, `GET /auth/me` or `/users/me` + **list orgs**.
- [ ] Nest: **TenantGuard** / consistent org scoping on services.
- [ ] Next: login/register UI + BFF cookie flow + logout + **org switch** UI.

### Phase 2 — Core domain

- [ ] Organization profile (legal/branding/prefix) + clients CRUD (API + minimal UI).
- [ ] Invoices + line items; status rules; **per-org** numbering.

### Phase 3 — PDF pipeline

- [ ] Redis + BullMQ registration in Nest.
- [ ] **§7.3** `InvoicePdfTemplateService` (pdf-lib) + **§7.4** processor wiring.
- [ ] Pdf processor + storage path + job status API (**org-scoped**).
- [ ] Next: trigger PDF + poll/download UI.

### Phase 4 — Hardening

- [ ] Validation (class-validator / DTOs), error shape consistency.
- [ ] Basic E2E happy path: register → default org active → create invoice → enqueue PDF → download.
- [ ] **Optional:** second user added to org (manual DB or invite flow) to validate membership + switch-org.
- [ ] Document production env (secrets, HTTPS, cookie `Secure`).

---

## 10. Open decisions (minor, decide during build)

- Exact **JWT expiry** and whether to add refresh tokens in Phase 4.
- **PDF storage:** local volume vs S3-compatible (MVP: volume under `api` service).
- **Template:** extra org-level variants vs single layout until demand is clear (see **§7.3** evolution).
- **Next** proxy: one catch-all vs explicit routes (explicit is easier to debug early).
- **Invitations:** token table vs magic link vs admin-only “add member by email” post-MVP.

---

## 11. Success criteria (MVP done)

- User can register (gets a **default organization** as **OWNER**), log in, and stay authenticated via httpOnly cookie.
- User can **switch active organization** when they belong to more than one (manual creation of second membership is acceptable for testing until invites exist).
- CRUD **organization profile**, clients, invoices with line items — **no cross-tenant data leakage** (manual or automated test).
- Invoice PDF is generated **asynchronously**; user can see job status and download when ready.
- `docker compose up` brings up DB, Redis, API, and web with documented env vars.

---

*Last updated: multi-tenant orgs + memberships; Nest JWT + Next BFF cookies; BullMQ + Redis (not RabbitMQ MVP); pdf-lib code-defined invoice template (**§7.3**).*
