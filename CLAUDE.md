# Layerwise - Blueprint Takeoff Application

## Project Overview

AI-powered construction blueprint takeoff application that extracts quantities and measurements from architectural drawings using computer vision and LLMs.

## Tech Stack

### Frontend (Next.js 16)
| Package | Purpose |
|---------|---------|
| `next` | React framework with App Router |
| `@clerk/nextjs` | Authentication |
| `@vercel/blob` | File storage |
| `tailwindcss` | Styling |
| `shadcn/ui` | Component library (new-york style) |

### Backend (Python FastAPI)
| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `pydantic-ai-slim[openai]` | AI agent orchestration (Gemini via OpenAI-compat) |
| `pypdfium2` | PDF processing (lightweight) |
| `sse-starlette` | Server-Sent Events |
| `httpx` | HTTP client |

## Project Structure

```
layerwise/
├── src/                          # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/              # Clerk auth pages
│   │   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── sign-up/[[...sign-up]]/
│   │   ├── dashboard/           # Protected dashboard
│   │   ├── layout.tsx           # Root layout (ClerkProvider)
│   │   └── page.tsx             # Landing page
│   ├── middleware.ts            # Auth middleware
│   ├── types/                   # TypeScript types
│   │   └── takeoff.ts          # Mirrors Python models
│   └── lib/utils.ts
├── api/                          # Vercel Serverless Entry Point
│   ├── py.py                    # Entry point (imports python_api app)
│   └── requirements.txt         # Python deps for Vercel builder
├── python_api/                   # Python FastAPI Backend
│   ├── _main.py                 # FastAPI app entry
│   ├── agents/
│   │   ├── takeoff_agent.py    # Main vision agent
│   │   └── scale_detector.py   # Scale detection agent
│   ├── models/
│   │   ├── takeoff.py          # TakeoffItem, TakeoffResult
│   │   └── blueprint.py        # BlueprintMeta, ScaleInfo
│   ├── services/
│   │   ├── pdf_service.py      # PDF → images conversion
│   │   └── stream_service.py   # SSE helpers
│   ├── routers/
│   │   └── takeoffs.py         # API endpoints
│   └── requirements.txt         # Canonical deps list
├── resources/                   # Documentation
│   ├── pydantic-ai.md          # Pydantic AI patterns
│   └── takeoff-guide.md        # Construction domain knowledge
└── CLAUDE.md                   # This file
```

## Key Concepts

### Blueprint Takeoff Categories

| Category | Description | Units | Examples |
|----------|-------------|-------|----------|
| **Count** | Individual items | ea, pcs | Doors, windows, outlets |
| **Linear** | Length measurements | LF, m | Walls, pipes, trim |
| **Area** | Surface measurements | SF, m² | Floors, walls, roofing |
| **Volume** | Cubic measurements | CF, CY | Concrete, excavation |

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Trade Focus | General (all trades) | Broader applicability |
| Scale Detection | Auto + Manual override | Best of both worlds |
| Storage | Vercel Blob | CDN, easy integration |
| Processing | Real-time SSE streaming | Better UX |

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/python/takeoff/analyze` | Analyze blueprint (non-streaming) |
| `POST` | `/python/takeoff/stream` | Stream takeoff results via SSE |
| `POST` | `/python/takeoff/detect-scale` | Auto-detect blueprint scale |
| `GET` | `/python/health` | Health check |
| `GET` | `/python/` | API info |

### SSE Events (streaming endpoint)

| Event | Description |
|-------|-------------|
| `progress` | Analysis progress (0-100%) |
| `info` | Document info (type, page count) |
| `scale` | Scale detection result |
| `chunk` | Partial AI response text |
| `item` | Individual takeoff item |
| `complete` | Final summary |
| `error` | Error information |

## Pydantic Models

### TakeoffItem
```python
class TakeoffItem(BaseModel):
    name: str           # e.g., "Interior Door 3x7"
    category: str       # count, linear, area, volume
    quantity: float     # Measured value
    unit: str          # ea, LF, SF, CF
    location: str | None
    confidence: float   # 0.0 - 1.0
```

### TakeoffResult
```python
class TakeoffResult(BaseModel):
    items: list[TakeoffItem]
    summary: dict[str, float]
    notes: list[str]
    scale_used: str | None
    page_count: int
```

## Development

### Prerequisites
- Node.js 18+
- Python 3.10+
- pnpm

### Frontend Setup
```bash
pnpm install
pnpm dev  # http://localhost:3000
```

### Backend Setup
```bash
cd python_api
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Unix
pip install -r requirements.txt
cd ..
uvicorn python_api._main:app --reload --port 8000
```

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
BLOB_READ_WRITE_TOKEN=vercel_blob_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (python_api/.env)
```env
GOOGLE_API_KEY=AIza...
HOST=0.0.0.0
PORT=8000
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```

## Implementation Status

### Phase 1 - Core Setup (Complete)
- [x] Project structure setup
- [x] Next.js with Clerk authentication
- [x] Landing page and dashboard UI
- [x] Python FastAPI backend structure
- [x] Pydantic AI agents (takeoff + scale detection)
- [x] PDF processing service
- [x] SSE streaming service
- [x] API endpoints with proper error handling
- [x] TypeScript types matching Python models
- [x] Comprehensive documentation

### Phase 2 - Upload & Analysis (Complete)
- [x] Blueprint upload component (`src/components/takeoff/upload-zone.tsx`)
- [x] Vercel Blob upload API route (`src/app/api/upload/route.ts`)
- [x] SSE streaming hook (`src/hooks/use-takeoff-stream.ts`)
- [x] Results table component (`src/components/takeoff/results-table.tsx`)
- [x] Progress bar component (`src/components/takeoff/progress-bar.tsx`)
- [x] Scale input component (`src/components/takeoff/scale-input.tsx`)
- [x] Full takeoff page (`src/app/takeoff/page.tsx`)
- [x] CSV export functionality

### Phase 3 - Enhancements (Pending)
- [ ] Blueprint viewer with react-pdf
- [ ] Project persistence (database)
- [ ] Rate limiting middleware
- [ ] Request size limits

## New Components

### Frontend Components (`src/components/takeoff/`)

| Component | Description |
|-----------|-------------|
| `UploadZone` | Drag-and-drop file upload with Vercel Blob |
| `ResultsTable` | Sortable table showing takeoff items |
| `ProgressBar` | Real-time progress indicator |
| `ScaleInput` | Scale selection with presets and custom input |

### Hooks (`src/hooks/`)

| Hook | Description |
|------|-------------|
| `useTakeoffStream` | SSE connection to Python API for real-time results |

### API Routes (`src/app/api/`)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/upload` | POST | Upload files to Vercel Blob |

## Vercel Deployment Architecture

The project deploys as a hybrid Next.js + Python serverless app on Vercel:

- **Next.js** handles frontend and `/api/upload` route
- **Python FastAPI** runs as a separate serverless function at `api/py.py`
- Vercel rewrites `/python/*` to the Python function via `vercel.json`
- Clerk middleware allows `/python/*` as public routes

### Key Deployment Constraints

| Constraint | Solution |
|------------|----------|
| Next.js intercepts `/api/*` routes | Python entry named `api/py.py` (not `api/index.py`) |
| Vercel Python runtime expects `app` or `handler` | Export `app` (ASGI), NOT `handler = app` |
| `pydantic-ai` v1.56+ uses provider pattern | Use `OpenAIProvider(base_url=..., api_key=...)` |
| `includeFiles` needed for python_api/ | Set in `vercel.json` functions config |

### vercel.json Configuration

```json
{
  "framework": "nextjs",
  "functions": {
    "api/py.py": {
      "runtime": "@vercel/python@6.1.6",
      "maxDuration": 60,
      "includeFiles": "python_api/**/*.py"
    }
  },
  "rewrites": [
    { "source": "/python/:path*", "destination": "/api/py" }
  ]
}
```

## Reference Documentation

- [Pydantic AI Patterns](resources/pydantic-ai.md)
- [Construction Takeoff Guide](resources/takeoff-guide.md)
- [Code Review Report](resources/code-review.md)
