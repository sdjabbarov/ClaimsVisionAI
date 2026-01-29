# ClaimsVision AI

AI-powered vehicle damage claims assessment prototype. Review claims, view damage images and AI assessments, and submit for approval or escalate. Built with Next.js 15 (App Router), React 19, TypeScript, and Tailwind CSS.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Locally (Development)](#running-locally-development)
- [Building for Production](#building-for-production)
- [Running When Deployed (Production)](#running-when-deployed-production)
- [Deployment Platforms](#deployment-platforms)
- [Data and Persistence](#data-and-persistence)
- [Project Structure](#project-structure)
- [Scripts Reference](#scripts-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 18.18 or later (20.x LTS recommended)
- **npm** 9 or later (or yarn/pnpm)

Check your versions:

```bash
node -v   # e.g. v20.x.x
npm -v    # e.g. 10.x.x
```

---

## Installation

1. **Clone or download** the project and go into the app directory:

   ```bash
   cd ClaimsVisionAI
   ```

2. **Install dependencies** (requires network):

   ```bash
   npm install
   ```

3. **Optional:** Copy mock images into `public/images/` if you use the full mock set (see [Data and Persistence](#data-and-persistence)).

---

## Running Locally (Development)

Start the development server with hot reload:

```bash
npm run dev
```

- App: **http://localhost:3000**
- Uses Turbopack for fast rebuilds.
- Claim status and edits are persisted to `claims-state.json` in the project root (see [Data and Persistence](#data-and-persistence)).

To use a different port:

```bash
npm run dev -- -p 3001
```

Then open **http://localhost:3001**.

---

## Building for Production

Create an optimized production build:

```bash
npm run build
```

- Output goes to `.next/`.
- Ensures the app is ready for production and catches build-time errors.

---

## Running When Deployed (Production)

After you have built the app (or your CI/CD has run `npm run build`), start the production server with:

```bash
npm start
```

- Serves the app from the `.next` build.
- Default port: **3000** (override with `PORT` env var; see below).
- Use this command in your deployment environment (VM, container, PaaS) so that the app runs in production mode.

### Port and host

- **Port:** Set the `PORT` environment variable to change the port.
  - Example (Linux/macOS): `PORT=8080 npm start`
  - Example (.env): `PORT=8080`
- **Host:** By default Next.js listens on `0.0.0.0` in production, so it accepts connections from outside localhost (needed for containers and servers).

### Production checklist

1. Run **`npm install`** (or `npm ci` for reproducible installs).
2. Run **`npm run build`**.
3. Run **`npm start`**.
4. Ensure the process has **write access** to the working directory if you use file-based claim persistence (`claims-state.json`); see [Data and Persistence](#data-and-persistence).
5. Optionally set **`PORT`** (e.g. `8080` or `80` behind a reverse proxy).
6. Ensure **Node.js** version is 18.18+ (20.x LTS recommended).

### Example: systemd (Linux server)

```ini
[Unit]
Description=ClaimsVision AI
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/claims-vision-ai
ExecStart=/usr/bin/node .next/standalone/server.js
# Or if not using standalone: ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=PORT=3000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Example: Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t claims-vision-ai .
docker run -p 3000:3000 -v $(pwd)/data:/app/data claims-vision-ai
```

If you persist `claims-state.json` under `/app/data`, mount a volume there so data survives container restarts.

---

## Deployment Platforms

### Vercel (recommended for Next.js)

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Import the project in [Vercel](https://vercel.com).
3. Root directory: `ClaimsVisionAI` (if the repo root is the monorepo root).
4. Build command: `npm run build`
5. Output: use default (Next.js).
6. Deploy. Serverless functions will run the API routes; note that **file-based persistence** (`claims-state.json`) is not available on Vercel’s serverless runtime. For production you’d replace this with a database or external store.

### Other Node hosts (Railway, Render, Fly.io, VM)

1. Set build command: `npm run build`
2. Set start command: `npm start`
3. Set `PORT` if the platform assigns a port via env (e.g. `PORT=8080`).
4. If the platform gives a writable filesystem, `claims-state.json` will be written under the app’s working directory unless you change the path in code.

### Important note on serverless

On **serverless** platforms (e.g. Vercel), the filesystem is read-only and/or ephemeral. The app’s file-based claim store (`claims-state.json`) will not persist between invocations. For a real deployment there you would need to switch the store to a database (Postgres, MongoDB, etc.) or another persistent store.

---

## Data and Persistence

- **Mock data:** Initial claims come from `mock_data.json` and are transformed in `src/lib/data.ts`. Image paths point to `public/images/raw/` and `public/images/annotated/`.
- **Runtime persistence:** When users update claim status (e.g. “Send for approval”), the in-memory store is written to **`claims-state.json`** in the project’s working directory (`process.cwd()`). On restart, the app loads from this file if it exists; otherwise it falls back to mock data.
- **File location:** `claims-state.json` is created at the project root (same directory as `package.json`). The process must have write permissions there for updates to persist.
- **Git:** `claims-state.json` is in `.gitignore` so local state is not committed.

---

## Project Structure

```
ClaimsVisionAI/
├── public/                 # Static assets
│   ├── images/             # Vehicle damage images (raw, annotated, uploads)
│   └── reference_database.json
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/claims/     # GET all, GET one, PATCH one, upload, save-image
│   │   ├── claim/[id]/     # Claim detail page
│   │   ├── dashboard/      # Dashboard page
│   │   ├── layout.tsx
│   │   └── page.tsx       # Landing page
│   ├── components/        # React components
│   └── lib/               # Store, types, data loading
├── mock_data.json         # Seed claim data
├── claims-state.json      # Runtime persistence (created at run time, gitignored)
├── package.json
└── next.config.ts
```

---

## Scripts Reference

| Command           | Description                                  |
|-------------------|----------------------------------------------|
| `npm run dev`     | Start development server (Turbopack)         |
| `npm run build`   | Create production build                     |
| `npm run start`   | Run production server (after build)         |
| `npm run lint`    | Run ESLint                                  |

---

## Troubleshooting

### Port already in use

- Change port: `npm run dev -- -p 3001` or `PORT=3001 npm start`
- Or stop the process using the port (e.g. on Mac: `lsof -i :3000` then `kill -9 <PID>`).

### Claim status not updating on dashboard

- Ensure the app has write access to the project root so `claims-state.json` can be created/updated.
- Restart the server after pulling changes that affect the store (`src/lib/store.ts`).

### Build fails

- Run `npm ci` and then `npm run build`.
- Ensure Node version is 18.18+ (`node -v`).

### Images or assets 404

- Put images under `public/` (e.g. `public/images/...`). They are served from the root (e.g. `/images/...`).

---

## Features (overview)

- **Landing page:** Initiate claim review, quick start, high-level stats.
- **Dashboard:** List of claims, filters (status, search, assessed by), sortable table, stats (pending, returned, awaiting approval, escalated, low confidence).
- **Claim detail:** Policy/incident info, image upload, “Proceed with AI Assessment,” damage list with cost reference, approve/escalate/revert.
- **Persistence:** Claim status and assessment state persisted to `claims-state.json` when running in an environment with a writable filesystem.
