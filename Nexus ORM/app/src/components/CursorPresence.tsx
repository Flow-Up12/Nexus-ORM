import { useEffect, useCallback, useRef } from 'react'
import type { CollaboratorInfo } from '@/hooks/useCollaboration'

interface CursorPresenceProps {
  awareness: {
    setLocalStateField: (field: string, value: any) => void
    getLocalState: () => any
    on: (event: string, cb: () => void) => void
    off: (event: string, cb: () => void) => void
  } | null
  others: CollaboratorInfo[]
}

export function CursorPresence({ awareness, others }: CursorPresenceProps) {
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!awareness) return
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    const currentState = awareness.getLocalState()?.user ?? {}
    awareness.setLocalStateField('user', {
      ...currentState,
      cursor: { x: e.clientX, y: e.clientY },
    })
  }, [awareness])

  const handlePointerLeave = useCallback((e: PointerEvent) => {
    if (!awareness) return
    if (e.relatedTarget === null) {
      lastPosRef.current = null
      const currentState = awareness.getLocalState()?.user ?? {}
      awareness.setLocalStateField('user', {
        ...currentState,
        cursor: null,
      })
    }
  }, [awareness])

  useEffect(() => {
    const opts = { capture: true }
    document.addEventListener('pointermove', handlePointerMove, opts)
    document.addEventListener('pointerleave', handlePointerLeave, opts)
    return () => {
      document.removeEventListener('pointermove', handlePointerMove, opts)
      document.removeEventListener('pointerleave', handlePointerLeave, opts)
    }
  }, [handlePointerMove, handlePointerLeave])

  useEffect(() => {
    if (!awareness) return
    const interval = setInterval(() => {
      if (lastPosRef.current && document.hasFocus()) {
        const currentState = awareness.getLocalState()?.user ?? {}
        awareness.setLocalStateField('user', {
          ...currentState,
          cursor: lastPosRef.current,
        })
      }
    }, 500)
    return () => clearInterval(interval)
  }, [awareness])

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {others.map((user) => {
        if (!user.cursor) return null
        return (
          <div
            key={user.clientId}
            className="absolute transition-all duration-100 ease-out"
            style={{
              left: user.cursor.x,
              top: user.cursor.y,
              transform: 'translate(-2px, -2px)',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            >
              <path
                d="M3 2L17 10L10 11.5L7 18L3 2Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            <div
              className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-[11px] font-medium text-white whitespace-nowrap shadow-md"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
