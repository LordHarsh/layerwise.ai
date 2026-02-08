# Code Review Report - Layerwise

**Date:** February 2026
**Reviewers:** Frontend, Backend, and Deployment Review Agents

---

## Executive Summary

A thorough review of the Layerwise blueprint takeoff application uncovered **5 critical**, **8 high**, **12 medium**, and **14 low** severity issues across the frontend and backend. The most urgent problems are a broken deployment configuration (directory mismatch), SSRF vulnerability, missing API authentication, and a CSV injection vulnerability in the export feature.

**Overall Assessment:** The application is **not production-ready** in its current state. Critical security and deployment issues must be resolved before any public-facing deployment.

---

## Critical Issues (5)

### C1. Broken Directory Structure — Deployment Will Fail (**RESOLVED**)
- **Area:** Backend
- **Files:** `vercel.json`, `api/py.py`, `python_api/**`
- **Description:** The backend code directory conflicted with Next.js's `/api/*` route handling. Multiple issues: wrong entry point naming, incorrect ASGI export, and outdated pydantic-ai API usage.
- **Resolution:** Code lives in `python_api/`, entry point is `api/py.py` (exports `app` from `python_api._main`), Vercel rewrites `/python/*` to `/api/py`. All Python imports use `python_api.*` prefix. See "Deployment Review Findings" section for full details.

### C2. Server-Side Request Forgery (SSRF) via `blueprint_url`
- **Area:** Backend
- **Files:** `api/routers/takeoffs.py:25, 80, 170`, `api/services/pdf_service.py:16-21`
- **Description:** The `blueprint_url` parameter accepts arbitrary URLs. `FileService.fetch_file()` fetches any URL without validation. An attacker can scan internal networks (e.g., AWS metadata at `http://169.254.169.254/`), access internal services, or perform port scanning. No URL allowlist, no scheme restriction (`file://` allowed).
- **Impact:** Full SSRF — internal network reconnaissance, credential theft from cloud metadata services.
- **Fix:** Validate that URLs match the expected Vercel Blob hostname. Block private IP ranges and non-HTTPS schemes.

### C3. No Authentication on API Endpoints
- **Area:** Backend
- **Files:** `api/routers/takeoffs.py` (all endpoints), `api/_main.py`
- **Description:** Despite the frontend using Clerk authentication, the Python API has zero authentication. Any client can call `/takeoff/analyze`, `/takeoff/stream`, or `/takeoff/detect-scale` directly.
- **Impact:** Unlimited access to expensive Gemini API calls, no user-level rate limiting, no audit trail.
- **Fix:** Implement API authentication — either verify Clerk JWT tokens in the backend or use an API key passed from the authenticated frontend.

### C4. CSV Injection Vulnerability in Export
- **Area:** Frontend
- **File:** `src/app/takeoff/page.tsx:48-57`
- **Description:** CSV export directly concatenates AI-generated data (takeoff item fields like `name`, `location`) into CSV without escaping. Values starting with `=`, `+`, `-`, or `@` will be interpreted as formulas when opened in Excel/Google Sheets.
- **Impact:** Arbitrary formula execution in spreadsheet software — can exfiltrate data or execute commands.
- **Fix:** Wrap cell values in double quotes, escape embedded double quotes, and prefix cells starting with formula characters with a single quote.

### C5. SSE Hook Stale Closure Bug
- **Area:** Frontend
- **File:** `src/hooks/use-takeoff-stream.ts:142`
- **Description:** `startTakeoff` uses `handleEvent` but does not include it in its `useCallback` dependency array (only lists `[apiUrl]`). The `handleEvent` function is closed over a stale reference. Currently works by accident because `handleEvent` has no dependencies, but is fragile — any future dependency addition will silently break streaming.
- **Impact:** Potential for silent data loss or incorrect UI state during SSE streaming if dependencies change.
- **Fix:** Include `handleEvent` in `startTakeoff`'s dependency array or use a ref pattern.

---

## High Severity Issues (8)

### H1. API Key Read at Module Import Time
- **Area:** Backend
- **Files:** `api/agents/takeoff_agent.py:23`, `api/agents/scale_detector.py:28`
- **Description:** `OpenAIModel` is instantiated at module level with `os.environ.get("GOOGLE_API_KEY")`. If `load_dotenv()` hasn't run yet (runs in `_main.py:19`), the API key will be `None`. Import order in serverless environments may cause this race condition. Both agent files duplicate this instantiation.
- **Fix:** Lazy-initialize the model or ensure `load_dotenv()` runs before agent imports.

### H2. Unbounded File Size Fetching
- **Area:** Backend
- **File:** `api/services/pdf_service.py:16-21`
- **Description:** No file size limit on `fetch_file()`. An attacker can provide a URL to a multi-GB file, exhausting memory in the 512MB serverless function. The entire file is loaded into memory.
- **Fix:** Add a `Content-Length` check before downloading, stream the response with a size cap, or use `httpx` streaming with a byte limit.

### H3. Sensitive Error Information Leaked in SSE Stream
- **Area:** Backend
- **File:** `api/routers/takeoffs.py:154-155`
- **Description:** Raw exception messages are sent to the client via SSE (`str(e)`). Can leak internal paths, API keys, or connection strings.
- **Fix:** Send generic error messages to clients, log full errors server-side.

### H4. `detect-scale` Uses Query Parameter for Sensitive URL
- **Area:** Backend
- **File:** `api/routers/takeoffs.py:160-163`
- **Description:** POST endpoint takes `blueprint_url` as a query parameter instead of request body. Query parameters are logged in server access logs, browser history, and proxy logs — potentially exposing tokens/SAS signatures in the URL.
- **Fix:** Move `blueprint_url` to the request body.

### H5. No SSE Stream Timeout / Hang Detection
- **Area:** Frontend
- **File:** `src/hooks/use-takeoff-stream.ts:91-123`
- **Description:** The SSE read loop (`while (true) { await reader.read(); }`) has no timeout. If the backend hangs or stops sending data without closing the connection, the frontend will sit in "streaming" state indefinitely.
- **Fix:** Add `AbortSignal.timeout()` or a manual timeout. Show a "connection stalled" message after N seconds of silence.

### H6. Upload Route Error Response Leaks Internals
- **Area:** Frontend
- **File:** `src/app/api/upload/route.ts:36-40`
- **Description:** The catch block returns `(error as Error).message` directly to the client. Could expose internal file paths, SDK internals, or stack info. Status code is always 400 regardless of actual error type.
- **Fix:** Map known errors to user-friendly messages with appropriate HTTP status codes (401, 413, 500).

### H7. Missing `onUploadCompleted` Error Handling
- **Area:** Frontend
- **File:** `src/app/api/upload/route.ts:30-32`
- **Description:** The `onUploadCompleted` callback only does `console.log`. Errors in this callback can bubble up as generic 400s. Vercel Blob calls this asynchronously — errors may go unnoticed.
- **Fix:** Add try/catch inside `onUploadCompleted`, integrate with monitoring.

### H8. No AbortController Cleanup on Component Unmount
- **Area:** Frontend
- **File:** `src/hooks/use-takeoff-stream.ts`
- **Description:** If `TakeoffPage` unmounts while a stream is active (user navigates away), the `abortControllerRef` is never aborted. Causes state updates on unmounted components, potential memory leaks.
- **Fix:** Add a `useEffect` cleanup that calls `abortControllerRef.current?.abort()` on unmount.

---

## Medium Severity Issues (12)

### M1. Duplicate Router Mounting
- **Area:** Backend
- **File:** `api/_main.py:62-63`
- **Description:** Same router mounted at `/python/takeoff/*` and `/takeoff/*`. Doubles the attack surface, creates route ambiguity.

### M2. `pypdfium2` Missing from `requirements.txt`
- **Area:** Backend
- **File:** `api/requirements.txt`
- **Description:** Documented dependency not in requirements file. Additionally, no versions are pinned (uses `>=` instead of `==`), making builds non-reproducible.

### M3. Blueprint Data Held in Memory Multiple Times
- **Area:** Backend
- **File:** `api/routers/takeoffs.py:74-152`
- **Description:** 3-4 copies of file data in memory simultaneously during streaming. In a 512MB serverless function, this limits max blueprint size.

### M4. `TakeoffDeps.blueprint_data` Never Used by Agent
- **Area:** Backend
- **Files:** `api/agents/takeoff_agent.py:14`, `api/routers/takeoffs.py:36-41`
- **Description:** `blueprint_data: bytes` stored in deps but never accessed by any agent tool. Blueprint is passed as `BinaryContent` in messages, wasting memory.

### M5. `response.stream()` May Not Yield Text Chunks as Expected
- **Area:** Backend
- **File:** `api/routers/takeoffs.py:131-133`
- **Description:** With structured output (`output_type=TakeoffResult`), streaming yields partial Pydantic model instances, not text strings. Wrapping in `{"text": chunk}` likely produces unhelpful output.

### M6. CORS Allows All Methods and All Headers
- **Area:** Backend
- **File:** `api/_main.py:51-57`
- **Description:** `allow_methods=["*"]` and `allow_headers=["*"]` combined with `allow_credentials=True` is overly permissive.

### M7. SSE Parser — Fragile Multi-Line Event Handling
- **Area:** Frontend
- **File:** `src/hooks/use-takeoff-stream.ts:99-122`
- **Description:** SSE parsing does not handle multi-line `data:` fields, comments, `id:` fields, or blank-line event terminators per the SSE spec. Events may be silently dropped or misinterpreted.

### M8. `UploadZone` — `uploadFile` Not Memoized
- **Area:** Frontend
- **File:** `src/components/takeoff/upload-zone.tsx:33, 70-83, 85-95`
- **Description:** `uploadFile` is a plain function used inside `useCallback`-wrapped handlers without being in their dependency arrays. If props like `onUploadComplete` change, stale callbacks will be used.

### M9. `UploadZone` — `clearFile` Does Not Notify Parent
- **Area:** Frontend
- **File:** `src/components/takeoff/upload-zone.tsx:97-103`
- **Description:** Removing an uploaded file resets internal state but doesn't notify the parent. Parent still holds the old `blueprintUrl`, so analysis could start on a "cleared" file.

### M10. `ResultsTable` — `item.notes` Type Mismatch with Python Model
- **Area:** Frontend
- **File:** `src/components/takeoff/results-table.tsx:110-112`
- **Description:** TypeScript type includes `notes?: string | null` but the Python `TakeoffItem` model does not define `notes`. Model inconsistency between frontend and backend.

### M11. Deprecated `afterSignOutUrl` Prop
- **Area:** Frontend
- **Files:** `src/app/dashboard/page.tsx:37`, `src/app/takeoff/page.tsx:87`
- **Description:** `<UserButton afterSignOutUrl="/" />` uses a prop deprecated in Clerk v5+. May be removed in future versions.

### M12. `TakeoffPage` — No Explicit Auth Guard
- **Area:** Frontend
- **File:** `src/app/takeoff/page.tsx`
- **Description:** Client component relies entirely on middleware for auth. No server-side auth check or fallback. If middleware matcher fails to match `/takeoff`, the page is unprotected.

---

## Low Severity Issues (14)

### L1. Pydantic v1 `class Config` Style (Backend)
- **Files:** `api/models/takeoff.py:28,57,98`, `api/models/blueprint.py:22,47`
- Models use deprecated `class Config:` instead of Pydantic v2 `model_config = ConfigDict(...)`.

### L2. Missing `__init__.py` in `api/` Root (Backend)
- **File:** `api/` directory
- No package init file, confusing for local development.

### L3. Hardcoded `project_id="temp"` (Backend)
- **Files:** `api/routers/takeoffs.py:37, 114`
- Always `"temp"` — should be populated or removed.

### L4. Logging Uses f-strings Instead of Lazy Formatting (Backend)
- **Files:** `api/routers/takeoffs.py:55, 182`
- Should use `logger.error("msg: %s", e)` for lazy evaluation.

### L5. No Request Timeout for AI Agent Calls (Backend)
- **Files:** `api/routers/takeoffs.py:50, 127`
- Agent calls have no timeout or retry configuration.

### L6. `FileService` Name Mismatch with Module Name (Backend)
- **File:** `api/services/pdf_service.py`
- File named `pdf_service.py` but class is `FileService` with no PDF-specific logic.

### L7. `cn()` Utility Defined but Never Used (Frontend)
- **File:** `src/lib/utils.ts`
- Dead code, minor bundle bloat.

### L8. `/projects` Links Point to Non-Existent Route (Frontend)
- **Files:** `src/app/dashboard/page.tsx:30-33, 85-90`
- Dead links that show 404.

### L9. Missing Error Boundary (Frontend)
- **File:** `src/app/layout.tsx`
- No `error.tsx` anywhere. Rendering errors crash the entire app.

### L10. Missing `loading.tsx` for Route Transitions (Frontend)
- **Files:** `src/app/takeoff/`, `src/app/dashboard/`
- No loading indicators during navigation.

### L11. `ScaleInput` — `isCustom` State Not Reset on External Changes (Frontend)
- **File:** `src/components/takeoff/scale-input.tsx:28`
- Local state desyncs from controlled `value` prop when parent resets.

### L12. React Compiler Enabled (Experimental) (Frontend)
- **Files:** `next.config.ts:5`, `package.json:29`
- `reactCompiler: true` is experimental. May affect memoization behavior unpredictably.

### L13. `UserButton` — No Signed-Out Fallback (Frontend)
- **File:** `src/app/takeoff/page.tsx:87`
- If session expires, `UserButton` renders null but page remains interactive. User gets cryptic errors attempting analysis.

### L14. Missing `key` Warning Potential in Summary Rendering (Frontend)
- **File:** `src/app/takeoff/page.tsx:233`
- `Object.entries(summary.summary || {}).slice(0, 3).map(...)` — keys from API could theoretically be non-unique.

---

## Positive Observations

### Backend
- Clean separation of concerns (models, agents, services, routers)
- Pydantic models with proper validation and TypedDict usage
- Async/await used throughout
- SSE streaming pattern is well-structured

### Frontend
- Consistent component structure with good separation of concerns
- Proper Clerk middleware pattern for route protection
- Good TypeScript typing mirroring Python models
- File upload validation (type + size) on both client and server
- AbortController pattern for canceling in-flight SSE streams

---

## Recommended Fix Priority

| Priority | Issues | Action |
|----------|--------|--------|
| **P0 — Blocking** | ~~C1~~ | ~~Fix directory structure and imports~~ **DONE** |
| **P1 — Before Deploy** | C2, C3, C4, H2, H3 | Fix SSRF, add API auth, fix CSV injection, cap file size, sanitize errors |
| **P2 — Soon After** | C5, H1, H4, H5, H6, H8 | Fix closures, env loading, parameter types, timeouts, cleanup |
| **P3 — Next Sprint** | M1-M12 | Fix duplicate routes, memory issues, SSE parsing, component state |
| **P4 — Backlog** | L1-L14, H7 | Code quality, dead code, error boundaries, loading states |

---

## Deployment Review Findings

### Issues Discovered During Deployment Testing

#### D1. `api/index.py` Naming Conflict with Next.js (RESOLVED)
- **Severity:** Critical
- **Description:** When the Python serverless function is named `api/index.py`, Next.js intercepts all requests to `/api/index` before the Python function can handle them. Next.js claims the entire `/api/*` namespace.
- **Resolution:** Renamed to `api/py.py` so the function maps to `/api/py`, which Next.js has no route for.

#### D2. ASGI Export Variable Name (RESOLVED)
- **Severity:** Critical
- **Description:** Vercel's Python runtime checks for `handler` (expects `BaseHTTPRequestHandler` subclass) before checking for `app` (WSGI/ASGI). Setting `handler = app` with a FastAPI instance caused the runtime to try using FastAPI as a `BaseHTTPRequestHandler`, crashing with a 500.
- **Resolution:** Export only `app` (the FastAPI instance), never alias it to `handler`.

#### D3. pydantic-ai v1.56+ Breaking API Change (RESOLVED)
- **Severity:** Critical
- **Description:** `OpenAIModel(model_name, base_url=..., api_key=...)` and `OpenAIModel(model_name, openai_client=...)` are both invalid in pydantic-ai v1.56.0. The API changed to use a `provider` parameter.
- **Resolution:** Use `OpenAIProvider(base_url=..., api_key=...)` and pass to `OpenAIModel(model_name, provider=provider)`.

#### D4. Clerk Middleware Blocking Python Routes (RESOLVED)
- **Severity:** High
- **Description:** Clerk middleware intercepted rewritten `/python/*` requests with `X-Clerk-Auth-Reason: protect-rewrite`, returning 405/500 errors.
- **Resolution:** Added `/python(.*)` to the `isPublicRoute` matcher in `src/middleware.ts`.

#### D5. Vercel Deployment Protection on Preview (Informational)
- **Description:** Preview deployments have Vercel authentication enabled. Direct `curl` requests get redirected to SSO login. Must use `vercel curl` for testing authenticated preview deployments.

### Final Working Configuration

| Component | File | Purpose |
|-----------|------|---------|
| Entry point | `api/py.py` | `from python_api._main import app` |
| Dependencies | `api/requirements.txt` | Installed by Vercel Python builder |
| App code | `python_api/` | All FastAPI business logic |
| Config | `vercel.json` | `functions`, `rewrites`, `includeFiles` |
| Middleware | `src/middleware.ts` | `/python(.*)` in public routes |

## Security Checklist

- [x] Authentication implemented (Clerk — frontend only)
- [ ] **API authentication (backend has NONE)**
- [ ] **SSRF protection (URL validation)**
- [ ] **CSV injection protection**
- [x] Protected routes via middleware (partial — `/takeoff` not explicit)
- [x] CORS configured (overly permissive)
- [ ] Rate limiting
- [ ] Request size limits
- [ ] Input validation on all endpoints
- [ ] Error messages sanitized (partial — streaming leaks)
- [ ] Security headers (CSP, etc.)
- [ ] Dependency vulnerability scanning
- [x] No secrets in git (needs verification)
