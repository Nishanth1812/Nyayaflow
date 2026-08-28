# Deploying NyayaFlow to Vercel (Frontend + Backend Together)

This repo is ready for a single Vercel project that hosts:
- **Next.js frontend** (`src/`) via Vercel's native Next.js detection
- **FastAPI backend** (`backend/` via `api/index.py`) via Vercel Functions

## How it works

```
Browser → Vercel Edge
        ├─ /health, /cases, /diagnose, /route, /diagnostic-rules, /metrics, /evidence-check, /static/*, /api/* → api/index.py (FastAPI)
        └─ /* (everything else, including /, /_next/*) → root Next.js app
```

- `vercel.json` declares the API routes; Vercel auto-detects `api/index.py` as Python and the root `package.json`/`src/` app as Next.js.
- `api/index.py` re-exports `backend.main:app`.
- `backend/database.py` auto-switches SQLite path to `/tmp/nyayaflow.db` when `VERCEL=1` (ephemeral filesystem).
- `backend/main.py` allows `https://*.vercel.app` preview deployments via `ALLOW_ORIGIN_REGEX`.
- `src/lib/api.ts` uses same-origin API calls in production and `http://localhost:8000` for local development.
- `next.config.ts` proxies to `http://localhost:8000` only in local dev.

## One-time setup

1. **Push to GitHub**
   ```bash
   git add -A
   git commit -m "nyayaflow: vercel ready"
   git push origin master
   ```

2. **Import to Vercel**
   - https://vercel.com/new → Import GitHub repo
   - Framework Preset: **Next.js**
   - Root Directory: `./` (keep default)
   - Settings → Environments → Production → Branch Tracking: `master`
   - `vercel.json` disables automatic deployments for every branch except `master`.

3. **Environment Variables (Vercel Dashboard → Settings → Environment Variables)**
   | Name | Value | Notes |
   |------|-------|-------|
   | `NEXT_PUBLIC_API_BASE` | Leave unset | Production defaults to same-origin API routes; local development uses `http://localhost:8000` |
   | `NYAYAFLOW_DATABASE_URL` | `sqlite:////tmp/nyayaflow.db` or `postgresql+psycopg://...` | For production, use Neon/Supabase Postgres; otherwise `/tmp` with seeding each cold start |
   | `NYAYAFLOW_CORS_ORIGINS` | `https://your-domain.vercel.app,http://localhost:3000` | Auto-adds `VERCEL_URL` |
   | `NYAYAFLOW_LOG_LEVEL` | `INFO` | Optional |

   > `VERCEL` and `VERCEL_URL` are injected automatically — do not set manually.

4. **Deploy**
   - Click Deploy. Vercel builds the root Next.js app and the root Python function as one deployment.
   - Visit `https://your-project.vercel.app` → Next.js UI.
   - `https://your-project.vercel.app/health` → `{"status":"ok","service":"NyayaFlow-engine"}` from FastAPI.

## Local dev vs Vercel prod

| | Local | Vercel |
|---|---|---|
| Frontend | `npm run dev` (:3000) | Built from the root Next.js app |
| Backend | `uv run uvicorn backend.main:app --reload` (:8000) | `api/index.py` serverless |
| API base | `NEXT_PUBLIC_API_BASE=http://localhost:8000` or automatic localhost default | Same-origin relative requests |
| DB | `./nyayaflow.db` (persistent) | `/tmp/nyayaflow.db` (ephemeral) or Postgres if `NYAYAFLOW_DATABASE_URL` set |
| CORS | localhost | `*.vercel.app` via regex |

## Local verification before deploy

```powershell
# Backend
uv sync
uv run python -m pytest -v   # 59 passed
uv run python -c "from api.index import app; print(app.title)"

# Frontend
npm install
npm run typecheck
npm run build   # or NEXT_PUBLIC_API_BASE="" npm run build for prod simulation
```

## Optional: Postgres on Vercel

Vercel ephemeral SQLite loses data on cold starts (re-seeded via `seed_database`). For real persistence:

1. Create Neon/Supabase Postgres.
2. In Vercel env, set `NYAYAFLOW_DATABASE_URL=postgresql+psycopg://user:pass@host/db`.
3. Add `psycopg[binary]` to `requirements.txt` if using Postgres driver, redeploy.

## Troubleshooting

- **Python build selects 3.14**: Ensure `pyproject.toml` keeps `requires-python = "~=3.12.0"`; this upper bound forces Vercel to use Python 3.12.
- **CORS error in preview**: Ensure `NYAYAFLOW_CORS_ORIGIN_REGEX` is `https://.*\.vercel\.app` (default when `VERCEL=1`) or set explicitly.
- **Next.js 404 for `_next` assets**: Ensure the Vercel project root is `./` and no legacy `builds` configuration is present.
- **DB locked**: SQLite on `/tmp` is per-instance; use Postgres for concurrent writes.

## Why the app is at the repository root?

Vercel can auto-detect a root Next.js app and root `api/` Python functions in one project. Keeping both runtimes in the native root layout avoids the legacy `builds` configuration that triggers immutable static-upload errors.
