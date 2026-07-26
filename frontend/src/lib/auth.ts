import { api } from './api'

export function setToken(token: string) {
  localStorage.setItem('lumify_token', token)
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function getToken() {
  return localStorage.getItem('lumify_token')
}

export function logout() {
  localStorage.removeItem('lumify_token')
  delete api.defaults.headers.common['Authorization']
}

// Initialize on load
const token = getToken()
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
