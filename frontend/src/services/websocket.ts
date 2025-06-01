import type { WebSocketMessage, ConnectionStatus } from '../types'

class WebSocketService {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private connectionListeners: Set<(status: ConnectionStatus) => void> = new Set()
  private reconnectTimeout: NodeJS.Timeout | null = null

  connect(sessionId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.disconnect()
    }

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/connect/${sessionId}`
    
    try {
      this.socket = new WebSocket(wsUrl)
      this.setupEventHandlers(sessionId)
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.notifyConnectionListeners({
        connected: false,
        session_id: sessionId,
        error: error instanceof Error ? error.message : 'Connection failed',
      })
    }
  }

  private setupEventHandlers(sessionId: string): void {
    if (!this.socket) return

    this.socket.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.notifyConnectionListeners({
        connected: true,
        session_id: sessionId,
      })

      // Send initial connection message
      this.send('connection', {
        session_id: sessionId,
        timestamp: new Date().toISOString(),
      })
    }

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.notifyConnectionListeners({
        connected: false,
        session_id: sessionId,
        error: event.reason || 'Connection closed',
      })

      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
        console.log(`Attempting to reconnect in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        
        this.reconnectTimeout = setTimeout(() => {
          this.connect(sessionId)
        }, delay)
      }
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.notifyConnectionListeners({
        connected: false,
        session_id: sessionId,
        error: 'WebSocket error occurred',
      })
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const message: WebSocketMessage = {
          type: data.type || 'message',
          data: data.data || data,
          timestamp: data.timestamp || new Date().toISOString(),
          session_id: sessionId,
        }

        this.notifyListeners(message.type, message)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting')
      this.socket = null
    }
  }

  send(type: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString(),
      }
      this.socket.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected. Message not sent:', { type, data })
    }
  }

  on(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(eventType)
        }
      }
    }
  }

  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.connectionListeners.delete(callback)
    }
  }

  private notifyListeners(eventType: string, message: WebSocketMessage): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message)
        } catch (error) {
          console.error('Error in WebSocket event listener:', error)
        }
      })
    }
  }

  private notifyConnectionListeners(status: ConnectionStatus): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in connection status listener:', error)
      }
    })
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  get connectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      session_id: '', // Will be set when connecting
    }
  }
}

// Hook for React components
import { useState, useEffect, useCallback, useRef } from 'react'

export function useWebSocket(sessionId: string | null) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    session_id: sessionId || '',
  })
  const wsRef = useRef<WebSocketService | null>(null)

  useEffect(() => {
    if (!sessionId) return

    // Create WebSocket service instance
    wsRef.current = new WebSocketService()
    
    // Set up connection status listener
    const unsubscribe = wsRef.current.onConnectionChange(setConnectionStatus)
    
    // Connect
    wsRef.current.connect(sessionId)

    return () => {
      unsubscribe()
      wsRef.current?.disconnect()
      wsRef.current = null
    }
  }, [sessionId])

  const sendUserMessage = useCallback((message: string) => {
    if (wsRef.current) {
      wsRef.current.send('user_message', { content: message })
    }
  }, [])

  const startAgent = useCallback((agentType: string) => {
    if (wsRef.current) {
      wsRef.current.send('start_agent', { agent_type: agentType })
    }
  }, [])

  const stopAgent = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send('stop_agent', {})
    }
  }, [])

  const on = useCallback((eventType: string, callback: (data: any) => void) => {
    if (wsRef.current) {
      return wsRef.current.on(eventType, callback)
    }
    return () => {} // Empty unsubscribe function
  }, [])

  return {
    connectionStatus,
    isConnected: connectionStatus.connected,
    sendUserMessage,
    startAgent,
    stopAgent,
    on,
  }
}

export default WebSocketService
