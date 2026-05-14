import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { store } from '@store/index'
import { setTokens, logout } from '@store/slices/authSlice'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || '/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// Inject access token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = store.getState().auth.tokens?.access_token
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let queue: Array<(token: string) => void> = []

const flush = (token: string) => { queue.forEach(cb => cb(token)); queue = [] }

apiClient.interceptors.response.use(
  r => r,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true

      if (isRefreshing) {
        return new Promise(resolve => {
          queue.push(token => {
            orig.headers!.Authorization = `Bearer ${token}`
            resolve(apiClient(orig))
          })
        })
      }

      isRefreshing = true

      try {
        const refreshToken = store.getState().auth.tokens?.refresh_token

        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const res = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          { refresh_token: refreshToken }
        )

        const { access_token, refresh_token } = res.data

        store.dispatch(
          setTokens({
            access_token,
            refresh_token,
            token_type: 'bearer',
          })
        )

        flush(access_token)

        orig.headers!.Authorization = `Bearer ${access_token}`

        return apiClient(orig)
      } catch {
        store.dispatch(logout())
        window.location.href = '/login'

        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
