# Football Predictions Platform (Full-Stack Monorepo)

A high-performance AI Football Intelligence and Predictions platform consisting of a Next.js frontend and a Node.js + Express backend.

## Project Structure

```
.
├── backend/                  # Node.js + Express + Prisma Backend
│   ├── src/                  # Express routes, controllers, services
│   ├── prisma/               # PostgreSQL database schema
│   ├── package.json
│   └── README.md
└── my-app/                   # Next.js 16 (Turbopack) Frontend
    ├── app/                  # Next.js App Router pages
    ├── components/           # React UI components
    ├── lib/                  # Shared utilities & types
    └── package.json
```

## Getting Started

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
Runs on `http://localhost:5000`.

### 2. Start Frontend App
```bash
cd my-app
npm install
npm run dev
```
Runs on `http://localhost:3000`.
