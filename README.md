## RDA • Developer setup (first time)

This is a Next.js 15 App Router project using Auth.js (NextAuth v5) and Prisma with SQLite for local development.

What you’ll get locally:
- Public restaurant catalog and details
- Auth via GitHub/Google (requires OAuth app keys)
- Profile with order history (filters/sort/export)
- Buy flow: add item to checkout and place order

### 1) Requirements
- Node 20+ and npm
- VS Code (recommended). Trust the workspace when prompted.

Recommended VS Code extensions:
- ESLint, Prettier, Tailwind CSS IntelliSense

### 2) Install dependencies

```bash
npm install
```

### 3) Environment variables

Copy the example file and fill in values (Next.js reads `.env.local`):

```bash
cp env.example .env.local
```

Required minimum for local dev:
- `DATABASE_URL` — keep default `file:./dev.db` for SQLite
- `NEXTAUTH_SECRET` — generate a random string
- `NEXTAUTH_URL` — `http://localhost:3000`

Generate a secret (either command works):

```bash
# OpenSSL
openssl rand -base64 32

# or Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Optional (to sign in with OAuth):
- GitHub: `GITHUB_ID`, `GITHUB_SECRET`
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

OAuth callback URLs you’ll need to set in the provider config:
- GitHub callback: `http://localhost:3000/api/auth/callback/github`
- Google callback: `http://localhost:3000/api/auth/callback/google`

If you skip OAuth setup, protected pages will redirect to sign in and you won’t be able to place orders.

### 4) Database (Prisma + SQLite)

Create/update the local database and generate the Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

Optional: open Prisma Studio to add sample data (restaurants, items):

```bash
npx prisma studio
```

Minimal data to test the buy flow:
- Create a Restaurant (set `isActive = true`).
- Create at least one Item for that restaurant with:
	- `discountedPriceCents > 0`
	- `quantityAvailable > 0`
	- `expiresAt` in the future

### 5) Run the app

Dev server (Turbopack):

```bash
npm run dev
```

Open http://localhost:3000

Build and start:

```bash
npm run build
npm start
```

### 6) Tests and coverage

Run tests:

```bash
npm test
```

Run coverage (HTML report at `coverage/index.html`):

```bash
npm run test:cov
```

Coverage thresholds: lines 80%, functions 80%, branches 70%, statements 80%.

### 7) Lint and format

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### 8) Common issues & fixes

- Missing `NEXTAUTH_SECRET` or provider keys → 401/redirect loop on protected routes. Set env vars in `.env.local` and restart `npm run dev`.
- OAuth redirect mismatch → ensure provider callback URL matches the values above and that `NEXTAUTH_URL` is `http://localhost:3000`.
- Prisma migration errors or drift in dev → reset the local DB (will delete `dev.db`):

```bash
npx prisma migrate reset --force
```

- Port already in use → stop other Next.js processes or run dev on a different port.

### 9) Project tech at a glance

- Next.js 15 (App Router), React 19
- Auth.js (NextAuth v5) with Prisma Adapter (SQLite in dev)
- Tailwind CSS
- Vitest + Testing Library (jsdom)

Happy hacking!
