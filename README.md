# Layerwise.ai

AI-powered construction blueprint takeoff application that extracts quantities and measurements from architectural drawings using computer vision and LLMs.

## Live Demo

**URL:** [layerwise.ai](https://layerwise-ai.vercel.app)

---

## Features

- **Automated Blueprint Analysis** - Upload PDF blueprints, get itemized takeoff results
- **Multi-Category Extraction** - Count (doors, windows), Linear (walls, pipes), Area (floors, roofing), Volume (concrete, excavation)
- **Auto Scale Detection** - AI agent detects drawing scale from legend/title block
- **Real-time Streaming** - SSE-based progress updates as analysis runs
- **PDF Processing** - Multi-page PDF support with per-page image conversion
- **CSV Export** - Download results as structured spreadsheet
- **Authentication** - Clerk-based user management with protected routes

---

## Architecture

```
User → Next.js 16 (Vercel)
         │
         ├── Upload PDF → Vercel Blob (CDN storage)
         ├── Auth → Clerk
         │
         └── Analyze → Python FastAPI (Vercel Serverless)
                          │
                          ├── PDF → Images (pypdfium2)
                          ├── Scale Detection Agent (Gemini Vision)
                          ├── Takeoff Agent (Gemini Vision)
                          └── SSE Stream → Client
```

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TailwindCSS, shadcn/ui |
| Auth | Clerk |
| Storage | Vercel Blob |
| Backend | Python FastAPI (Vercel Serverless) |
| AI | Gemini 2.5 Flash via Pydantic AI (OpenAI-compat) |
| PDF Processing | pypdfium2 |
| Streaming | SSE (sse-starlette) |
| Deployment | Vercel (hybrid Next.js + Python) |

---

## Project Structure

```
layerwise/
├── src/                          # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/              # Clerk auth pages
│   │   ├── dashboard/           # Protected dashboard
│   │   ├── takeoff/             # Blueprint analysis page
│   │   └── api/upload/          # Vercel Blob upload route
│   ├── components/takeoff/
│   │   ├── upload-zone.tsx      # Drag-and-drop file upload
│   │   ├── results-table.tsx    # Sortable takeoff results
│   │   ├── progress-bar.tsx     # Real-time progress indicator
│   │   └── scale-input.tsx      # Scale selection with presets
│   └── hooks/
│       └── use-takeoff-stream.ts # SSE connection hook
├── api/                          # Vercel Python Entry Point
│   └── py.py                    # FastAPI ASGI export
├── python_api/                   # Python Backend
│   ├── agents/
│   │   ├── takeoff_agent.py    # Main vision agent (Gemini)
│   │   └── scale_detector.py   # Scale detection agent
│   ├── models/
│   │   ├── takeoff.py          # TakeoffItem, TakeoffResult
│   │   └── blueprint.py        # BlueprintMeta, ScaleInfo
│   ├── services/
│   │   ├── pdf_service.py      # PDF → images conversion
│   │   └── stream_service.py   # SSE helpers
│   └── routers/
│       └── takeoffs.py         # API endpoints
└── resources/                   # Domain documentation
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/python/takeoff/stream` | Stream takeoff results via SSE |
| `POST` | `/python/takeoff/analyze` | Analyze blueprint (non-streaming) |
| `POST` | `/python/takeoff/detect-scale` | Auto-detect blueprint scale |
| `GET` | `/python/health` | Health check |

### SSE Events

| Event | Description |
|-------|-------------|
| `progress` | Analysis progress (0-100%) |
| `scale` | Scale detection result |
| `item` | Individual takeoff item extracted |
| `complete` | Final summary with all items |
| `error` | Error information |

---

## Getting Started

### Prerequisites

- Node.js 18+, Python 3.10+, pnpm

### Frontend

```bash
pnpm install
cp .env.example .env.local  # Add Clerk + Blob keys
pnpm dev
```

### Backend

```bash
cd python_api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn python_api._main:app --reload --port 8000
```

### Environment Variables

```env
# Frontend
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
GOOGLE_API_KEY=AIza...
```

---

## Deployment

Deploys as a hybrid app on Vercel:
- **Next.js** handles frontend + `/api/upload` route
- **Python FastAPI** runs as serverless function via `api/py.py`
- Vercel rewrites `/python/*` to the Python function

---

## Tech Highlights

- **Dual-language full-stack** — TypeScript frontend + Python AI backend on single Vercel deployment
- **Pydantic AI agents** — Structured output with automatic validation and retry
- **Construction domain expertise** — Handles count, linear, area, and volume measurements with proper units
- **SSE streaming UX** — Results appear incrementally as the AI processes each page
