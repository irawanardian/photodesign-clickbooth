const API_ORIGIN =
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

export function savePhoto(payload) {
  return request('/photos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getPhotosBySession(sessionId) {
  return request(`/photos/session/${sessionId}`)
}

export function buildPhotoUrl(imageUrl) {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl

  return `${API_ORIGIN}${imageUrl}`
}
