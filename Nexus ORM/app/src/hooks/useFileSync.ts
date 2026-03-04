import { useEffect, useRef, useCallback } from 'react'

function getWsUrl(path: string) {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}${path}`
}

export function useFileSync(roomId: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const listenersRef = useRef<Map<string, (content: string) => void>>(new Map())
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastBroadcastRef = useRef<Map<string, { content: string; t: number }>>(new Map())

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${getWsUrl('/file-sync')}?room=filesync:${roomId}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'file-content' && msg.filePath && msg.content !== undefined) {
          const cb = listenersRef.current.get(msg.filePath)
          if (cb) cb(msg.content)
        }
      } catch {}
    }

    ws.onclose = () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      reconnectRef.current = setTimeout(connect, 2000)
    }
  }, [roomId])

  useEffect(() => {
    if (!roomId) return
    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [roomId, connect])

  const broadcastFileContent = useCallback((filePath: string, content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    lastBroadcastRef.current.set(filePath, { content, t: Date.now() })
    wsRef.current.send(JSON.stringify({ type: 'file-content', filePath, content }))
  }, [])

  const subscribeToFile = useCallback((filePath: string, onContent: (content: string) => void) => {
    listenersRef.current.set(filePath, onContent)
    return () => {
      listenersRef.current.delete(filePath)
    }
  }, [])

  return { broadcastFileContent, subscribeToFile }
}
