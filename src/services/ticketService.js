import { supabase } from '@/services/supabase';
import { API_BASE } from '@/api/client';
// Helper to obtain Authorization header with Supabase JWT
async function getAuthHeaders() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('Failed to get Supabase session:', error);
    return {};
  }
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Service for admin ticket operations.
 * Adjust table name and column names to match your Supabase schema.
 */
export const ticketService = {
  /**
   * Search a ticket by its ID.
   * Returns the ticket record or throws an error if not found.
   */
  async searchById(id) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/admin/tickets/${id}`, { headers });
      const json = await res.json();
      if (json.success) return json.data;
    } catch (e) {
      console.warn('Error fetching ticket from Laravel API:', e);
    }

    // No demo fallback – rely on real backend
    return null;
  },

  /**
   * Generic filter method for the Report Ticket page.
   * `params` can include { status, startDate, endDate, riskLevel, ... }.
   * This is a placeholder implementation that builds a dynamic query based on
   * supplied parameters. Adjust column names as needed.
   */
  async filter(params = {}) {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_BASE}/api/admin/tickets`);
    if (params.status) url.searchParams.append('status', params.status);
    if (params.startDate) url.searchParams.append('start_date', params.startDate);
    if (params.endDate) url.searchParams.append('end_date', params.endDate);
    if (params.q) url.searchParams.append('q', params.q);
    const res = await fetch(url.toString(), { headers });
    const json = await res.json();
    if (json && json.success) {
      return Array.isArray(json.data) ? json.data : [];
    }
    throw new Error(json?.message || 'Failed to fetch tickets');
  },

  /**
   * Update ticket status (e.g. for triage or progress).
   */
  async updateStatus(ticketId, status) {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE}/api/admin/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      return json.data;
    }
    const errMsg = json?.message || (json?.allowed_next ? `Transisi tidak valid. Status berikutnya yang diizinkan: ${json.allowed_next}` : 'Gagal memperbarui status tiket');
    const error = new Error(errMsg);
    error.response = json;
    error.status = res.status;
    throw error;
  },

  /**
   * Generate a CSV report of tickets.
   * Returns a Blob that can be downloaded by the caller.
   */
  async downloadReport() {
    const headers = await getAuthHeaders();
    const url = `${API_BASE}/api/admin/tickets/export/csv`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gagal mengunduh CSV (${res.status}): ${errText || 'Terjadi kesalahan'}`);
    }
    const blob = await res.blob();
    return blob;
  },
};
