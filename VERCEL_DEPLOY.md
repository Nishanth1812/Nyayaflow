# Deploying NyayaFlow to Vercel (Frontend + Backend Together)

This repo is ready for a single Vercel project that hosts:
- **Next.js frontend** (`web/`) via `@vercel/next` builder
- **FastAPI backend** (`app/` via `api/index.py`) via `@vercel/python`

## How it works

```
Browser → Vercel Edge
        ├─ /health, /cases, /diagnose, /route, /diagnostic-rules, /metrics, /evidence-check, /static/*, /api/* → api/index.py (FastAPI)
        └─ /* (everything else, including /, /_next/*) → web/* (Next.js)
```

- `vercel.json` (`H:\Personal\Hackathons\NyayaFlow\vercel.json:1`) declares both builds and routes.
- `api/index.py` (`H:\Personal\Hackathons\NyayaFlow\api\index.py:1`) re-exports `app.main:app`.
- `app/database.py` (`H:\Personal\Hackathons\NyayaFlow\app\database.py:1`) auto-switches SQLite path to `/tmp/nyayaflow.db` when `VERCEL=1` (ephemeral filesystem).
- `app/main.py` (`H:\Personal\Hackathons\NyayaFlow\app\main.py:1`) allows `https://*.vercel.app` preview deployments via `ALLOW_ORIGIN_REGEX`.
- `web/lib/api.ts` (`H:\Personal\Hackathons\NyayaFlow\web\lib\api.ts:14`) uses `NEXT_PUBLIC_API_BASE=""` for same-origin prod fetch.
- `web/next.config.ts` (`H:\Personal\Hackathons\NyayaFlow\web\next.config.ts:1`) proxies to `http://localhost:8000` only in local dev.

## One-time setup

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "nyayaflow: vercel ready"
   git push origin main
   ```

2. **Import to Vercel**
   - https://vercel.com/new → Import GitHub repo
   - Framework Preset: **Other** (vercel.json overrides)
   - Root Directory: `./` (keep default; vercel.json handles `web/` via builds)

3. **Environment Variables (Vercel Dashboard → Settings → Environment Variables)**
   | Name | Value | Notes |
   |------|-------|-------|
   | `NEXT_PUBLIC_API_BASE` | `""` (empty string) | Frontend uses same-origin → `vercel.json` routes to Python |
   | `NYAYAFLOW_DATABASE_URL` | `sqlite:////tmp/nyayaflow.db` or `postgresql+psycopg://...` | For production, use Neon/Supabase Postgres; otherwise `/tmp` with seeding each cold start |
   | `NYAYAFLOW_CORS_ORIGINS` | `https://your-domain.vercel.app,http://localhost:3000` | Auto-adds `VERCEL_URL` |
   | `NYAYAFLOW_LOG_LEVEL` | `INFO` | Optional |

   > `VERCEL` and `VERCEL_URL` are injected automatically — do not set manually.

4. **Deploy**
   - Click Deploy. Vercel builds both `api/index.py` and `web/`.
   - Visit `https://your-project.vercel.app` → Next.js UI.
   - `https://your-project.vercel.app/health` → `{"status":"ok","service":"NyayaFlow-engine"}` from FastAPI.

## Local dev vs Vercel prod

| | Local | Vercel |
|---|---|---|
| Frontend | `cd web && npm run dev` (:3000) | Built via `web/package.json` builder |
| Backend | `uv run uvicorn app.main:app --reload` (:8000) | `api/index.py` serverless |
| API base | `NEXT_PUBLIC_API_BASE=http://localhost:8000` | `NEXT_PUBLIC_API_BASE=""` (relative) |
| DB | `./nyayaflow.db` (persistent) | `/tmp/nyayaflow.db` (ephemeral) or Postgres if `NYAYAFLOW_DATABASE_URL` set |
| CORS | localhost | `*.vercel.app` via regex |

## Local verification before deploy

```powershell
# Backend
uv sync
uv run python -m pytest -v   # 59 passed
uv run python -c "from api.index import app; print(app.title)"

# Frontend
cd web
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

- **500 on `/health`**: Check Vercel Function Logs → Python runtime `python3.12` mismatch? Ensure `runtime.txt` = `python-3.12` and `requirements.txt` at root.
- **CORS error in preview**: Ensure `NYAYAFLOW_CORS_ORIGIN_REGEX` is `https://.*\.vercel\.app` (default when `VERCEL=1`) or set explicitly.
- **Next.js 404 for `_next` assets**: Ensure `vercel.json` routes fallback `/(.*) → web/$1` is last.
- **DB locked**: SQLite on `/tmp` is per-instance; use Postgres for concurrent writes.

## Why both builds in one `vercel.json`?

- `builds` with `@vercel/python` + `@vercel/next` is the documented pattern for FastAPI + Next.js monorepos (single project, two runtimes).
- Modern `functions` + `rewrites` + `buildCommand` approach also works if you prefer to set Root Directory to `web`; see `vercel.json` comments.
