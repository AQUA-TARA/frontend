/**
 * src/api/client.js — AQUA-TARA API Client
 *
 * Thin HTTP client for the agreed API contract (docs/API_CONTRACT.md).
 * Points to the Mock API server during development.
 * Replace API_BASE with the real Laravel base URL when backend is ready.
 *
 * Endpoints implemented (User-facing contract only):
 *   POST /api/reports          — multipart/form-data (photo + lat/lng)
 *   GET  /api/tickets/:id      — ticket status & history
 *   GET  /api/citizen/history  — authenticated citizen history (mock: no real auth)
 *   GET  /api/map/public       — public-safe map markers
 */

// Base URL resolution: use VITE_API_URL from Vite environment if defined.
// Defaults to Laravel local development server (http://localhost:8000).
// Automatically strips trailing slashes and redundant '/api' suffix to prevent '/api/api' duplicates.
const rawApiUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://backend-nu-azure-25.vercel.app' : 'http://localhost:8000')
).trim().replace(/\/+$/, '')

export const API_BASE = rawApiUrl.endsWith('/api')
  ? rawApiUrl.slice(0, -4)
  : rawApiUrl


// ---------------------------------------------------------------------------
// POST /api/reports
// Contract: multipart/form-data with photo (File), latitude (Float), longitude (Float)
//           description (String, optional)
// Returns:  { success, message, data: { ticket_id, status: 'SUBMITTED' } }
// ---------------------------------------------------------------------------
export async function submitReport(payload) {
  let body
  if (payload instanceof FormData) {
    body = payload
  } else {
    const { photo, latitude, longitude, description, report_type } = payload
    body = new FormData()
    if (photo) body.append('photo', photo)
    if (latitude) body.append('latitude', latitude)
    if (longitude) body.append('longitude', longitude)
    if (description) body.append('description', description)
    if (report_type) body.append('report_type', report_type)
  }

  const response = await fetch(`${API_BASE}/api/reports`, {
    method: 'POST',
    // Do NOT set Content-Type manually — browser sets multipart boundary automatically
    body
  })

  const json = await response.json().catch(() => null)

  if (!response.ok || !json?.success) {
    const errorMsg = json?.message || (json?.errors ? Object.values(json.errors).flat().join(', ') : `Gagal mengirim laporan (HTTP ${response.status})`)
    const error = new Error(errorMsg)
    error.response = json
    error.status = response.status
    throw error
  }

  return json
}

// ---------------------------------------------------------------------------
// GET /api/tickets/:ticket_id
// Public endpoint for ticket tracking (DEC-002, DEC-006, DEC-009).
// Returns: { success: true, data: { ticket_id, status, display_status, created_at, updated_at } }
// On 404:  { success: false, message: 'Tiket tidak ditemukan.' }
// ---------------------------------------------------------------------------
export async function getTicket(ticketId) {
  const response = await fetch(`${API_BASE}/api/tickets/${encodeURIComponent(ticketId)}`)
  return response.json()
}

// ---------------------------------------------------------------------------
// GET /api/citizen/history
// Retrieves authenticated citizen report history using Bearer token.
// Returns: { success, data: [ { report_id, ticket_id, status, display_status, created_at, ... } ] }
// ---------------------------------------------------------------------------
export async function getCitizenHistory() {
  const headers = {}
  const { authService } = await import('@/services/authService')
  const token = authService.session.value?.access_token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}/api/citizen/history`, {
    headers
  })
  return response.json()
}

// ---------------------------------------------------------------------------
// GET /api/map/public
// Returns: { success, data: { markers: [ { id, name, lat, lng, level, updated_at }, ... ] } }
// level values: 'JERNIH' | 'WASPADA' | 'BAHAYA' (DEC-001)
// ---------------------------------------------------------------------------
export async function getPublicMap() {
  const response = await fetch(`${API_BASE}/api/map/public`)
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`)
  }
  return response.json()
}

// ---------------------------------------------------------------------------
// GET /api/admin/map
// Authenticated Admin Map endpoint.
// Returns: { success, data: { heatmap, iot_nodes, reports, pipe_network, summary } }
// ---------------------------------------------------------------------------
export async function fetchAdminMap(params = {}) {
  const headers = {}
  const { authService } = await import('@/services/authService')
  const token = authService.session.value?.access_token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = new URL(`${API_BASE}/api/admin/map`)
  if (params.mode) url.searchParams.append('mode', params.mode)
  if (params.hours) url.searchParams.append('hours', params.hours)

  const response = await fetch(url.toString(), { headers })
  if (!response.ok) {
    const errorJson = await response.json().catch(() => null)
    throw new Error(errorJson?.message || `HTTP error ${response.status}`)
  }
  return response.json()
}
