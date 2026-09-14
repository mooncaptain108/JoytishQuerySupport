# Security Notes — Jyotish Query

**Date reviewed:** 2026-05-24  
**Deployment:** FastAPI/uvicorn behind Caddy reverse proxy, LAN server with public internet exposure via Caddy.

---

## Summary

The attack surface is very small. The app holds no server-side user data, has no database, and performs no shell execution from user input. The primary risk is resource exhaustion on the muhurta search endpoint.

---

## What Was Reviewed

### Client → Server data paths

| Endpoint | Input | Handling |
|---|---|---|
| `POST /api/v1/chart` | lat, lon, date, time, tz offset | All parsed as numbers before sending; JSON body |
| `GET /api/v1/geocode?place=` | City name string | `encodeURIComponent()` on client; FastAPI `Query` typed param on server |
| `GET /api/v1/tz-offset?iana_tz=&date=` | IANA tz string, ISO date | `pytz.timezone()` raises on bad tz; `datetime.strptime` enforces date format |
| `POST /api/v1/muhurta/search` | JSON search parameters | Typed Pydantic model |

### Server-side geocode path (most likely injection vector)

`geocode_service.py` passes the place string to **geopy/Nominatim**, which makes an HTTPS call to OpenStreetMap's servers. There is no shell execution, no SQL, and no SSRF risk — the destination URL is hardcoded inside the geopy library. The response fields (`place`, `latitude`, `longitude`, `timezone`, `timezone_offset`) are returned as structured JSON.

On the client, the geocode response lands in:
- `statusEl.textContent` — safe, not innerHTML
- `input.value` fields — safe

### Client-side rendering

User-controlled strings (location names) are rendered into inline `onclick` handlers via an `esc()` function. The original function escaped `&`, `<`, `>`, and `"` but **not single quotes**, which are the delimiter used in the onclick attributes:

```html
onclick="atlasEdit('${esc(n)}')"
```

A location name like `'); alert(1)//` would have been executable. This was fixed by adding `'` → `&#39;` to `esc()`:

```javascript
function esc(s) {
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');   // ← added
}
```

**Practical risk was low** — this is a single-user localStorage app, so exploitation would be self-XSS only. The fix also resolves broken onclick handlers for legitimate place names containing apostrophes (O'Hare, Coeur d'Alene, etc.).

---

## Real Concerns with Public Internet Exposure

### 1. Muhurta search — resource exhaustion

`POST /api/v1/muhurta/search` spawns a background job using a 4-worker `ProcessPool`. A single search over 400 days takes approximately 56 seconds of CPU time. A public actor repeatedly hitting this endpoint could saturate the server.

**Mitigation:** Add IP-based rate limiting in Caddy. Example using the `rate_limit` directive:

```caddy
rate_limit {
    zone muhurta {
        match path /api/v1/muhurta/search
        key {remote_host}
        events 5
        window 1m
    }
}
```

5 requests/minute per IP would have no impact on real users while making bulk abuse impractical.

### 2. Nominatim user-agent

`geocode_service.py` identifies itself to OpenStreetMap's Nominatim service with:

```python
_geolocator = Nominatim(user_agent="vedic-jyotish-api")
```

OSM's usage policy requires a meaningful contact identifier (project URL or email) so they can reach you if your usage pattern triggers a flag, rather than silently blocking the IP. Update to something like:

```python
_geolocator = Nominatim(user_agent="jyotish-chart-saas/1.0 (your@email.com)")
```

### 3. No authentication

There is no login. Anyone who discovers the URL can submit chart and muhurta requests. For a personal or small-audience tool this is acceptable. If the audience widens, consider adding Caddy basic auth as the simplest option (one directive, no app changes required).

---

## What Is Not a Concern

- **SQL injection** — no database
- **Server-side template injection** — FastAPI returns typed JSON responses
- **Command injection** — no `subprocess`, `os.system`, or shell calls in any user-input path
- **Data theft** — all user data (charts, atlas) lives in the browser's localStorage; the server stores nothing
- **File write attacks** — no endpoint writes user-supplied content to disk
- **SSRF** — geocode proxies to Nominatim only (hardcoded in geopy); no user-controlled URL targets

---

## Caddy Notes

Caddy handles TLS automatically and acts as the public face. The uvicorn process binds to localhost and is not directly internet-reachable. This is the correct configuration. Caddy also absorbs malformed HTTP, slow-read attacks, and invalid TLS handshakes before they reach the app.
