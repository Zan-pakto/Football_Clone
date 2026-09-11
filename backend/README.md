# Jolloftips AI Football Predictions Backend (Node.js & Express)

A dedicated, scalable Node.js + Express backend powering the Jolloftips AI Football Intelligence and Predictions platform.

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
│   │   ├── db/                    # Prisma client & PostgreSQL MatchStore
│   │   ├── email/                 # Email templates & transactional dispatcher
│   │   ├── football/              # Bzzoiro Sports API integration, mock provider, fixture service
│   │   ├── predictions/           # AI statistical prediction engine & settlement ledger
│   │   ├── subscriptions/         # Access control & server-side paywall quota filtering
│   │   ├── types.ts               # Core domain TypeScript interfaces
│   │   └── utils.ts               # Date math, match status & formatting utilities
│   ├── routes/
│   │   ├── admin.routes.ts        # GET/POST /api/admin
│   │   ├── auth.routes.ts         # GET/POST /api/auth, /api/auth/sessions
│   │   ├── fixtures.routes.ts     # GET /api/fixtures, /api/fixtures/live, /api/fixtures/:id
│   │   ├── health.routes.ts       # GET /api/health
│   │   ├── matches.routes.ts      # GET/POST /api/matches, /api/matches/live
│   │   └── sync.routes.ts         # GET/POST /api/sync
│   └── server.ts                  # Express application configuration & entry point
├── .env                           # Environment configuration
├── package.json
└── tsconfig.json
```

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

### 4. Build for Production
```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` or `/api/health` | Service health and uptime |
| `GET` | `/api/fixtures?d=0` | Today's grouped or flat fixtures with AI predictions and paywall filtering |
| `GET` | `/api/fixtures/live` | Current active live fixtures |
| `GET` | `/api/fixtures/:id` | Full fixture analysis by ID |
| `GET` | `/api/matches?d=0` | Converted match list |
| `POST` | `/api/matches` | Ingest match predictions to database |
| `GET` | `/api/matches/live` | Live scores and real-time game status |
| `POST` | `/api/matches/live` | Apply real-time score/event updates |
| `GET` | `/api/auth` | Verify current session and fetch user profile |
| `POST` | `/api/auth` | Actions: `register`, `login`, `logout`, `update_profile`, `change_password` |
| `GET` | `/api/auth/sessions` | List all active device sessions for authenticated user |
| `POST` | `/api/auth/sessions` | Revoke a device session |
| `GET` | `/api/admin` | Admin analytics, subscriber counts, system health, and user ledger |
| `POST` | `/api/admin` | Actions: `toggle_block`, `update_tier`, `clear_cache` |
| `GET` | `/api/sync?d=0` | Database synchronization status |
| `POST` | `/api/sync` | Trigger data synchronization |

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server listening port | `5000` |
| `DATABASE_URL` | PostgreSQL connection URL | Neon Cloud URL |
| `BZZOIRO_API_KEY` | Bzzoiro Sports API token | Configured |
| `BZZOIRO_BASE_URL` | Bzzoiro API endpoint | `https://sports.bzzoiro.com/api/v2` |
| `FOOTBALL_PROVIDER` | Provider mode (`bzzoiro` or `mock`) | `bzzoiro` |
| `JWT_SECRET` | Secret key for JWT signing | Minimum 32 characters |
| `CORS_ORIGIN` | Allowed client origin | `http://localhost:3000` |
