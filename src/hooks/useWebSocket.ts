import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './useAuth'

interface UseWebSocketOptions {
  autoReconnect?: boolean
  reconnectAttemptLimit?: number
  reconnectInterval?: number
}

export function useWebSocket(
  endpointPath: string | null, // e.g., '/ws/collaboration/{tenantId}/'
  options: UseWebSocketOptions = {}
) {
  const { tokens } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Event | null>(null)
  const [lastMessage, setLastMessage] = useState<any>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)

  const {
    autoReconnect = true,
    reconnectAttemptLimit = 5,
    reconnectInterval = 3000,
  } = options

  const connect = useCallback(() => {
    if (!endpointPath || !tokens?.access_token) return

    // Ensure we don't open multiple connections
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Connect directly to Kong on port 80 instead of going through the Vite dev server proxy
    const wsUrl = `${wsProtocol}//${window.location.hostname}${endpointPath}?jwt=${tokens.access_token}`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log(`[WebSocket] Connected to ${wsUrl}`)
      setIsConnected(true)
      setError(null)
      reconnectAttempts.current = 0
    }

    ws.onmessage = (event) => {
      console.log(`[WebSocket] Message received:`, event.data)
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
      } catch (err) {
        setLastMessage(event.data)
      }
    }

    ws.onerror = (event) => {
      console.error(`[WebSocket] Error:`, event)
      setError(event)
    }

    ws.onclose = (event) => {
      console.log(`[WebSocket] Disconnected. Code: ${event.code}`)
      setIsConnected(false)
      
      // Auto-reconnect logic
      if (autoReconnect && reconnectAttempts.current < reconnectAttemptLimit) {
        reconnectAttempts.current += 1
        setTimeout(() => {
          connect()
        }, reconnectInterval * Math.pow(1.5, reconnectAttempts.current - 1)) // Exponential backoff
      }
    }

    wsRef.current = ws
  }, [endpointPath, tokens?.access_token, autoReconnect, reconnectAttemptLimit, reconnectInterval])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      // Prevent reconnect loop on intentional disconnect
      reconnectAttempts.current = reconnectAttemptLimit
      wsRef.current.close()
      wsRef.current = null
    }
  }, [reconnectAttemptLimit])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }, [])

  return { isConnected, error, lastMessage, sendMessage, reconnect: connect }
}
