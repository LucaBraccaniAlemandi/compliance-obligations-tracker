# Compliance Obligations Tracker

Track and manage regulatory compliance obligations.

## Structure

- `backend/` — FastAPI + SQLAlchemy + Alembic API (PostgreSQL)
- `frontend/` — Next.js application

## Getting started

### Backend

```bash
cd backend
cp .env.example .env
docker compose up --build
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at http://localhost:3000, backend API at http://localhost:8000.
