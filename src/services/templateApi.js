export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  `${window.location.protocol}//${window.location.hostname}:5005`

const API_BASE_URL = `${API_ORIGIN}/api`

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Terjadi kesalahan API.')
  }

  return result.data
}

export function resolveTemplateAssetUrl(url) {
  if (!url) return ''
  if (url.startsWith('data:')) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  return `${API_ORIGIN}${url}`
}

export function getTemplates(sessionId = null) {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''
  return request(`/templates${query}`)
}

export function getSessionTemplates(sessionId) {
  return request(`/templates/session/${sessionId}`)
}

export function createTemplate(payload) {
  return request('/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTemplate(id, payload) {
  return request(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function duplicateTemplate(id, sessionId) {
  return request(`/templates/${id}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
}

export function deleteTemplate(id, sessionId = null) {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''

  return request(`/templates/${id}${query}`, {
    method: 'DELETE',
  })
}
