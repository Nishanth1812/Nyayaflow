# NyayaFlow web demo

NyayaFlow is a mobile-first Next.js + Tailwind PWA for filing citizen grievances. The frontend talks to the Python FastAPI engine in `../app` for diagnostics, routing, evidence checks, case storage, and appeal generation. `lib/api.ts` is the real backend client; `lib/mockApi.ts` keeps the pure local helpers (sample data, complaint-draft text, status translations) and acts as an offline fallback when the API is unreachable.

## Run locally

Start the backend engine (from the repo root):

    python -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

The backend is served from http://localhost:8000 and already allows CORS from http://localhost:3000.

In a second terminal, run the frontend:

    npm install
    npm run dev

Open http://localhost:3000.

If the backend runs somewhere other than http://localhost:8000, point the client at it with the `NEXT_PUBLIC_API_BASE` environment variable (e.g. create `.env.local` with `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000`).

The flow starts with four issue categories:

- PM-KISAN payment stopped
- EPFO PF claim rejected
- Income tax refund delayed
- Scholarship payment stuck

Each category uses the same intake, diagnostic, draft, evidence, submission, status, and resolution screens. `fetchDiagnosticRules(category)` calls `GET /diagnostic-rules/{category}`; diagnosis, routing, case creation, and resolution confirmation all use the corresponding engine endpoints, so submitted cases persist in the backend and appeals are generated server-side.

## Checks

    npm test -- --run
    npm run typecheck
    npm run lint
    npm run build
