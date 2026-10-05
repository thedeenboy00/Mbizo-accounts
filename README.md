# Mbizo High School — Accounts System

Integrated Accounts Payment & Cash-Book Automation System.
Built with Next.js 16 (App Router), Prisma ORM, PostgreSQL, TypeScript, Tailwind v4.

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure the database
Copy `.env.example` to `.env` and set your `DATABASE_URL`:

**Supabase:**
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

**Local PostgreSQL:**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/mbizo_accounts"
```

### 3. Run migrations
```bash
npm run db:migrate
```

### 4. Seed the admin user
```bash
npm run db:seed
# Creates: admin / admin123
```

### 5. Start the dev server
```bash
npm run dev
# → http://localhost:3000
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client + build for production |
| `npm run db:migrate` | Apply all pending migrations |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:seed` | Seed default admin user |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript type check |

---

## Payment Categories
BEAM · PLAN · HIGHERLIFE · CAMFED · CHILDCARE · SELF

## Features (Prototype)
- Single-entry transaction → auto-posts to cash book + general ledger
- Cash book filterable by category with running balance
- Trial balance with balanced/out-of-balance indicator
- Dashboard with receipt/payment totals and category breakdown
- Cookie-based sessions with bcrypt password hashing

## Database Schema
See `prisma/schema.prisma` and `prisma/migrations/` for full schema and migration SQL.
