import { API_BASE } from '@/api/client';
import { authService } from '@/services/authService';

function getAuthHeaders(includeJson = false) {
  const token = authService.session.value?.access_token;

  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export async function fetchIoTNodes() {
  const response = await fetch(`${API_BASE}/api/admin/nodes`, {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch IoT nodes');
  }

  return json.data;
}

export async function createIoTNode(payload) {
  const response = await fetch(`${API_BASE}/api/admin/nodes`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Failed to create IoT node');
  }

  return json.data;
}