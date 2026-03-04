import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import * as Y from 'yjs'

import ufoStudioRoutes from '../Nexus ORM/routes/index'

const app = express()
app.use(cors())
app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'UFO Server running' })
})

app.use('/ufo-studio', ufoStudioRoutes)

const server = createServer(app)

// --- Yjs WebSocket collaboration server ---
const wss = new WebSocketServer({ noServer: true })

const rooms = new Map<string, { doc: Y.Doc; conns: Set<WebSocket>; awareness: Map<number, any> }>()

function getRoom(roomName: string) {
  if (!rooms.has(roomName)) {
    const doc = new Y.Doc()
    rooms.set(roomName, { doc, conns: new Set(), awareness: new Map() })
  }
  return rooms.get(roomName)!
}

function broadcastToRoom(roomName: string, data: Uint8Array, exclude?: WebSocket) {
  const room = rooms.get(roomName)
  if (!room) return
  const msg = Buffer.from(data)
  room.conns.forEach((ws) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(msg)
    }
  })
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const roomName = url.searchParams.get('room') || 'default'
  const room = getRoom(roomName)
  room.conns.add(ws)

  const clientId = Math.floor(Math.random() * 2147483647)

  const syncStep1 = Y.encodeStateAsUpdate(room.doc)
  const msgType = new Uint8Array([0]) // sync message type
  const syncMsg = new Uint8Array(1 + syncStep1.length)
  syncMsg.set(msgType)
  syncMsg.set(syncStep1, 1)
  ws.send(syncMsg)

  // Send existing awareness states
  if (room.awareness.size > 0) {
    const awarenessMsg = encodeAwarenessUpdate(room.awareness)
    ws.send(awarenessMsg)
  }

  ws.on('message', (data: Buffer) => {
    const msg = new Uint8Array(data)
    if (msg.length === 0) return

    const msgType = msg[0]
    if (msgType === 0) {
      // Sync update
      const update = msg.slice(1)
      Y.applyUpdate(room.doc, update)
      broadcastToRoom(roomName, msg, ws)
    } else if (msgType === 1) {
      // Awareness update
      try {
        const decoder = new TextDecoder()
        const json = JSON.parse(decoder.decode(msg.slice(1)))
        if (json.clientId !== undefined && json.state !== undefined) {
          if (json.state === null) {
            room.awareness.delete(json.clientId)
          } else {
            room.awareness.set(json.clientId, json.state)
          }
        }
      } catch {}
      broadcastToRoom(roomName, msg, ws)
    }
  })

  ws.on('close', () => {
    room.conns.delete(ws)
    room.awareness.delete(clientId)
    // Broadcast removal
    const removeMsg = encodeAwarenessRemoval(clientId)
    broadcastToRoom(roomName, removeMsg)
    if (room.conns.size === 0) {
      rooms.delete(roomName)
    }
  })
})

function encodeAwarenessUpdate(awareness: Map<number, any>): Uint8Array {
  const encoder = new TextEncoder()
  const states: any[] = []
  awareness.forEach((state, clientId) => {
    states.push({ clientId, state })
  })
  const json = JSON.stringify(states)
  const encoded = encoder.encode(json)
  const msg = new Uint8Array(1 + encoded.length)
  msg[0] = 1
  msg.set(encoded, 1)
  return msg
}

function encodeAwarenessRemoval(clientId: number): Uint8Array {
  const encoder = new TextEncoder()
  const json = JSON.stringify({ clientId, state: null })
  const encoded = encoder.encode(json)
  const msg = new Uint8Array(1 + encoded.length)
  msg[0] = 1
  msg.set(encoded, 1)
  return msg
}

// --- File content sync (plain JSON broadcast, no Yjs) ---
const fileSyncRooms = new Map<string, Set<WebSocket>>()

function getFileSyncRoom(name: string) {
  if (!fileSyncRooms.has(name)) {
    fileSyncRooms.set(name, new Set())
  }
  return fileSyncRooms.get(name)!
}

function broadcastFileSync(roomName: string, data: object, exclude?: WebSocket) {
  const conns = fileSyncRooms.get(roomName)
  if (!conns) return
  const msg = JSON.stringify(data)
  conns.forEach((ws) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(msg)
    }
  })
}

const fileSyncWss = new WebSocketServer({ noServer: true })
fileSyncWss.on('connection', (ws, req) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const roomName = url.searchParams.get('room') || 'default'
  const room = getFileSyncRoom(roomName)
  room.add(ws)

  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString())
      if (msg.type === 'file-content' && msg.filePath && msg.content !== undefined) {
        broadcastFileSync(roomName, msg, ws)
      }
    } catch {}
  })

  ws.on('close', () => {
    room.delete(ws)
    if (room.size === 0) fileSyncRooms.delete(roomName)
  })
})

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  if (url.pathname === '/yjs') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  } else if (url.pathname === '/file-sync') {
    fileSyncWss.handleUpgrade(req, socket, head, (ws) => {
      fileSyncWss.emit('connection', ws, req)
    })
  } else {
    socket.destroy()
  }
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`UFO Server listening on port ${PORT}`)
  console.log(`Yjs WebSocket server available at ws://localhost:${PORT}/yjs`)
})
