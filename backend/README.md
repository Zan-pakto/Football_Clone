# Jolloftips AI Football Predictions Backend (Node.js & Express)

A dedicated, high-performance Node.js + Express backend powering the Jolloftips AI Football Intelligence and Predictions platform.

## Architecture

```
backend/
├── prisma/
│   └── schema.prisma              # PostgreSQL database models (Users, Fixtures, Predictions, Settlements)
├── src/
│   ├── lib/
│   │   ├── admin/                 # Admin operations (tier management, blocking, analytics)
│   │   ├── auth/                  # JWT auth, password hashing, and session management (max 5 devices)
│   │   ├── cache/                 # In-memory caching with TTL invalidation
│   │   ├── db/                    # Prisma client & PostgreSQL MatchStore (in-memory fallback)
│   │   ├── email/                 # Email templates & transactional dispatcher
│   │   ├── football/              # Provider hub (ScraperFootballProvider, Bzzoiro, Mock)
│   │   │   ├── scraper-provider.ts # PRIMARY PROVIDER: Native NerdyTips scraper adapter
│   │   │   ├── fixture-service.ts  # Fixture caching, grouped query & settlement tracking
│   │   │   └── types.ts           # Football domain types & interfaces
│   │   ├── predictions/           # AI statistical prediction engine & settlement ledger
│   │   ├── scraper/               # LIVE SCRAPING ENGINE (NerdyTips)
│   │   │   ├── nerdytips-scraper.ts    # HTTP crawler, match block parser & match insight reader
│   │   │   ├── nerdytips-auth.ts       # Automated session login, CSRF & logout lifecycle
│   │   │   ├── nerdytips-normalizer.ts # Data normalization into unified schema
│   │   │   └── scraper-scheduler.ts    # Automated 12-hour recurring background sync
│   │   ├── subscriptions/         # Access control & server-side paywall quota filtering
│   │   ├── types.ts               # Core domain TypeScript interfaces
│   │   └── utils.ts               # Date math, match status & formatting utilities
│   ├── routes/
│   │   ├── admin.routes.ts        # GET/POST /api/admin
│   │   ├── auth.routes.ts         # GET/POST /api/auth, /api/auth/sessions
│   │   ├── fixtures.routes.ts     # GET /api/fixtures, /api/fixtures/live, /api/fixtures/:id
│   │   ├── health.routes.ts       # GET /api/health (uptime, provider, sync status)
│   │   ├── matches.routes.ts      # GET/POST /api/matches, /api/matches/live
│   │   ├── payment.routes.ts      # Checkout sessions & Stripe webhooks
│   │   ├── rollovers.routes.ts    # Rollover challenge management
│   │   └── sync.routes.ts         # GET/POST /api/sync, POST /api/sync/nerdytips
│   └── server.ts                  # Express application configuration & entry point
├── .env                           # Environment configuration
├── .env.example                   # Environment configuration template
├── package.json
└── tsconfig.json
```

## Scraping Engine & Live Server Deployment

- **Primary Provider**: Scraping (`FOOTBALL_PROVIDER="nerdytips"`) is the primary data source. No paid third-party API subscription is required.
- **Cold-Start Auto-Scraping**: If the database or cache is empty on server startup, the backend automatically performs an on-demand live scrape so visitors never see an empty screen.
- **Automated 12-Hour Background Scheduler**: Synchronizes yesterday, today, and tomorrow (`["-1", "0", "1"]`) every 12 hours automatically.
- **On-Demand Manual Sync**: Trigger background or synchronous scraping anytime via `POST /api/sync/nerdytips`.
- **Zero-Crash Resilience**: If PostgreSQL is temporarily unreachable on a live server, the in-memory fallback store maintains full functionality without crashing.

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run in Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

### 4. Build and Run for Production
```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` or `/api/health` | Service health, provider status, and sync metrics |
| `GET` | `/api/fixtures?d=0` | Today's grouped or flat fixtures with AI predictions and paywall filtering |
| `GET` | `/api/fixtures/live` | Current active live fixtures |
| `GET` | `/api/fixtures/:id` | Full fixture analysis by ID with deep AI insight |
| `GET` | `/api/fixtures/:id/insight` | Detailed match tactical preview article and predicted/actual stats |
| `GET` | `/api/fixtures/track-record` | Settled match outcomes with verified win rate |
| `GET` | `/api/matches?d=0` | Converted match list |
| `POST` | `/api/matches` | Ingest match predictions to database |
| `GET` | `/api/matches/live` | Live scores and real-time game status |
| `POST` | `/api/matches/live` | Apply real-time score/event updates |
| `POST` | `/api/sync/nerdytips` | Trigger on-demand NerdyTips multi-day synchronization |
| `GET` | `/api/sync/nerdytips/status` | Check timestamp and counts of last sync run |
| `GET` | `/api/auth` | Verify current session and fetch user profile |
| `POST` | `/api/auth` | Actions: `register`, `login`, `logout`, `update_profile`, `change_password` |
| `GET` | `/api/auth/sessions` | List all active device sessions for authenticated user |
| `POST` | `/api/auth/sessions` | Revoke a device session |
| `GET` | `/api/admin` | Admin analytics, subscriber counts, system health, and user ledger |
| `POST` | `/api/admin` | Actions: `toggle_block`, `update_tier`, `clear_cache` |

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server listening port | `5000` |
| `FOOTBALL_PROVIDER` | Provider mode (`nerdytips`, `bzzoiro`, `mock`) | `nerdytips` |
| `DATABASE_URL` | PostgreSQL connection URL | Neon Cloud URL |
| `NERDYTIPS_USERNAME` | Optional NerdyTips login (for VIP tips) | `""` |
| `NERDYTIPS_PASSWORD` | Optional NerdyTips password (for VIP tips) | `""` |
| `JWT_SECRET` | Secret key for JWT signing | Minimum 32 characters |
| `CORS_ORIGIN` | Allowed client origin | `http://localhost:3000` |
| `PAYMENT_PROVIDER` | Payment processor (`stripe`) | `stripe` |
| `STRIPE_SECRET_KEY` | Stripe secret API key | Test key |

