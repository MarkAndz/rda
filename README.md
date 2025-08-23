## Quick start

- Requirements: Node 20+, npm
- Clone and open in VS Code (trust the workspace)

### Setup

Install dependencies:

```bash
npm install
```

Create `.env` for local SQLite database:

```bash
printf 'DATABASE_URL="file:./dev.db"\n' > .env
```

Apply Prisma migrations and generate client:

```bash
npx prisma migrate dev
npx prisma generate
```

### Run

Dev server (http://localhost:3000):

```bash
npm run dev
```

Build and start:

```bash
npm run build
npm start
```

### Tests and coverage

Run tests:

```bash
npm test
```

Run coverage (HTML at `coverage/index.html`):

```bash
npm run test:cov
```

Coverage scope is focused on `src/{lib,utils,server,services,hooks}` and excludes UI/config files. Global thresholds: lines 80%, functions 80%, branches 70%, statements 80%.

### Lint and format

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### Optional tools

Open Prisma Studio (browse local DB):

```bash
npx prisma studio
```

Recommended VS Code extensions: ESLint, Prettier, Tailwind CSS IntelliSense. Format on save is supported.

### CI

GitHub Actions runs tests with coverage on every push and pull request, and uploads the coverage report as an artifact. See `.github/workflows/test.yml`.
