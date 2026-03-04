import { useEffect, useState, useRef, useCallback } from 'react'
import { getGuestName, getGuestColor } from '@/utils/guestNames'

export interface EditorCursor {
  line: number
  column: number
  filePath: string
}

export interface EditorSelection {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
  filePath: string
}

export interface CollaboratorInfo {
  clientId: number
  name: string
  color: string
  cursor: { x: number; y: number } | null
  editorCursor?: EditorCursor | null
  editorSelection?: EditorSelection | null
}

export interface UIState {
  filePanelOpen?: boolean
  viewMode?: 'interactive' | 'mermaid'
  activeFile?: string
  modelPositions?: Record<string, { x: number; y: number }>
  timestamp?: number
}

export interface UseCollaborationOptions {
  syncUI?: boolean
  uiState?: UIState
  onRemoteUI?: (state: UIState) => void
}

function getWsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/yjs`
}

export function useCollaboration(roomId: string, options?: UseCollaborationOptions) {
  const [connected, setConnected] = useState(false)
  const [others, setOthers] = useState<CollaboratorInfo[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const awarenessRef = useRef<Map<number, any>>(new Map())
  const clientIdRef = useRef(Math.floor(Math.random() * 2147483647))
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nameRef = useRef(getGuestName())
  const colorRef = useRef(getGuestColor())
  const localStateRef = useRef<any>({ name: nameRef.current, color: colorRef.current, cursor: null })
  const optionsRef = useRef(options)
  optionsRef.current = options

  const sendAwareness = useCallback((state: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    const encoder = new TextEncoder()
    const json = JSON.stringify({ clientId: clientIdRef.current, state })
    const encoded = encoder.encode(json)
    const msg = new Uint8Array(1 + encoded.length)
    msg[0] = 1 // awareness message type
    msg.set(encoded, 1)
    wsRef.current.send(msg)
  }, [])

  const broadcastUI = useCallback((state: UIState) => {
    localStateRef.current = {
      ...localStateRef.current,
      ui: { ...state, timestamp: Date.now() },
    }
    sendAwareness(localStateRef.current)
  }, [sendAwareness])

  const updateOthersFromAwareness = useCallback(() => {
    const entries: CollaboratorInfo[] = []
    awarenessRef.current.forEach((state, id) => {
      if (id === clientIdRef.current) return
      entries.push({
        clientId: id,
        name: state?.name || 'Guest',
        color: state?.color || '#6366f1',
        cursor: state?.cursor || null,
        editorCursor: state?.editorCursor ?? null,
        editorSelection: state?.editorSelection ?? null,
      })
    })
    setOthers(entries)
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = `${getWsUrl()}?room=collab:${roomId}`
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      sendAwareness(localStateRef.current)
    }

    ws.onclose = () => {
      setConnected(false)
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      reconnectRef.current = setTimeout(connect, 2000)
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onmessage = (event) => {
      const data = new Uint8Array(event.data as ArrayBuffer)
      if (data.length === 0) return

      const msgType = data[0]
      if (msgType === 1) {
        try {
          const decoder = new TextDecoder()
          const json = JSON.parse(decoder.decode(data.slice(1)))
          if (Array.isArray(json)) {
            for (const entry of json) {
              if (entry.state === null) {
                awarenessRef.current.delete(entry.clientId)
              } else {
                awarenessRef.current.set(entry.clientId, entry.state)
                const opts = optionsRef.current
                if (opts?.syncUI && opts?.onRemoteUI && entry.state?.ui && entry.clientId !== clientIdRef.current) {
                  opts.onRemoteUI(entry.state.ui)
                }
              }
            }
          } else if (json.clientId !== undefined) {
            if (json.state === null) {
              awarenessRef.current.delete(json.clientId)
            } else {
              awarenessRef.current.set(json.clientId, json.state)
              const opts = optionsRef.current
              if (opts?.syncUI && opts?.onRemoteUI && json.state?.ui && json.clientId !== clientIdRef.current) {
                opts.onRemoteUI(json.state.ui)
              }
            }
          }
          updateOthersFromAwareness()
        } catch {}
      }
    }
  }, [roomId, sendAwareness, updateOthersFromAwareness])

  useEffect(() => {
    if (!roomId) return
    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
      wsRef.current = null
      awarenessRef.current.clear()
    }
  }, [roomId, connect])

  const updateCursor = useCallback((x: number, y: number) => {
    localStateRef.current = { ...localStateRef.current, cursor: { x, y } }
    sendAwareness(localStateRef.current)
  }, [sendAwareness])

  const clearCursor = useCallback(() => {
    localStateRef.current = { ...localStateRef.current, cursor: null }
    sendAwareness(localStateRef.current)
  }, [sendAwareness])

  const setEditorState = useCallback((editorCursor: EditorCursor | null, editorSelection: EditorSelection | null) => {
    localStateRef.current = {
      ...localStateRef.current,
      editorCursor,
      editorSelection,
    }
    sendAwareness(localStateRef.current)
  }, [sendAwareness])

  return {
    connected,
    others,
    updateCursor,
    clearCursor,
    setEditorState,
    broadcastUI,
    awareness: {
      getLocalState: () => ({ user: localStateRef.current }),
      setLocalStateField: (_field: string, value: any) => {
        localStateRef.current = value
        sendAwareness(localStateRef.current)
      },
      on: (_event: string, _cb: () => void) => {},
      off: (_event: string, _cb: () => void) => {},
    },
    clientId: clientIdRef.current,
  }
}
