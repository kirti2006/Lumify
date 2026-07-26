import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const getCached = async (url: string, bypassCache = false) => {
  if (!bypassCache && cache.has(url)) {
    const cached = cache.get(url)!
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
  }
  const res = await api.get(url)
  cache.set(url, { data: res, timestamp: Date.now() })
  return res
}

export const clearCache = (url?: string) => {
  if (url) cache.delete(url)
  else cache.clear()
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error)
  }
)
