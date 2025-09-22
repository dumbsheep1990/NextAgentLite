# Repository Guidelines

## Project Structure & Module Organization
- Core apps:
  - `lite-backend` — Python FastAPI service (`api/`, `service/`, `models/`, `migrations/`, `main.py`).
  - `lite-qa` — Vite + React + TypeScript UI (`src/`, `public/`, `vite.config.ts`).
- Supporting folders: `scripts/`, `docs/`, `design/`, `logs/`, `database-backup/`.

## Build, Test, and Development Commands
Backend (FastAPI):
- Setup: `cd lite-backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`.
- Dev server: `python main.py` (uses `.env`/`.env.local`).
- Tests: `pytest -v` (or `npm run test` alias).
- Lint/Format/Type: `flake8`, `black . --line-length 127`, `mypy .`.
- DB migrations: `python -m alembic upgrade head`.

Frontend (Vite React):
- Setup: `cd lite-qa && npm i`.
- Dev server: `npm run dev` (Vite, default port 3000).
- Build/Preview: `npm run build` / `npm run preview`.
- Lint: `npm run lint`.

PM2 (optional): run from each app: `npm run pm2:dev`, `npm run pm2:prod`, `npm run pm2:logs`.

## Coding Style & Naming Conventions
- Python: Black (127 cols), Flake8, Mypy. Use `snake_case` for functions/modules, `PascalCase` for classes. Group imports: stdlib → third‑party → local.
- TypeScript/React: ESLint. Components `PascalCase` in `src/components`; hooks start with `use...`; files `.ts/.tsx`. Keep utilities in `src/lib` or `src/utils`.
- Config: Do not commit secrets. Copy `lite-backend/env.example` to `.env.local` and adjust.

## Testing Guidelines
- Backend: name tests `test_*.py`; keep next to code in `lite-backend/` or under `lite-backend/test/`. Run `pytest --maxfail=1 -q`. Use fixtures for IO and temp DB. Coverage: `pytest --cov=./ --cov-report=html`.
- Frontend: no dedicated runner configured; add lightweight checks or integration tests as needed.

## Commit & Pull Request Guidelines
- Commits: short, imperative subject; optional scope (e.g., `backend: fix chunking edge case`).
- PRs: clear description, steps to test, linked issues, and screenshots/GIFs for UI. Keep changes focused; update docs when behavior or config changes.

## Security & Configuration Tips
- Environment: `MAT_QA_ENV` controls mode; prefer `.env.local` for overrides. Exclude DB files and large logs.
- Logs: `lite-backend/logs/`, `lite-qa/logs/` are for runtime output; avoid committing them.

