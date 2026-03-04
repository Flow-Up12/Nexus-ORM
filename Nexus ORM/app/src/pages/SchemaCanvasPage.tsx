import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FullSchemaERDiagram } from '@/components/FullSchemaERDiagram'
import { MermaidERDiagram } from '@/components/MermaidERDiagram'
import { SchemaFilePanel } from '@/components/SchemaFilePanel'
import { CursorPresence } from '@/components/CursorPresence'
import { LoadingSpinner } from '@/ui'
import { useSchema } from '@/hooks'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useLiveSchema } from '@/hooks/useLiveSchema'
import { fetchModelFiles } from '@/api/schema'
import {
  PanelLeft,
  ArrowLeft,
  Users,
  Sun,
  Moon,
  Share2,
  GitBranch,
  FileText,
  Settings2,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { toast } from 'sonner'

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 10)
}

export function SchemaCanvasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [filePanelOpen, setFilePanelOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'interactive' | 'mermaid'>('interactive')
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [remoteModelPositions, setRemoteModelPositions] = useState<Record<string, { x: number; y: number }> | null>(null)
  const [syncUI, setSyncUI] = useState(true)
  const [showSyncOptions, setShowSyncOptions] = useState(false)

  const roomId = searchParams.get('room') || ''
  useEffect(() => {
    if (!roomId) {
      setSearchParams({ room: generateRoomId() }, { replace: true })
    }
  }, [roomId, setSearchParams])

  const { schema, isLoading } = useSchema()
  const collaboration = useCollaboration(roomId || 'default', {
    syncUI,
    uiState: { filePanelOpen, viewMode, activeFile: activeFile ?? undefined },
    onRemoteUI: (state) => {
      if (syncUI && state) {
        if (state.filePanelOpen !== undefined) setFilePanelOpen(state.filePanelOpen)
        if (state.viewMode !== undefined) setViewMode(state.viewMode)
        if (state.activeFile !== undefined) setActiveFile(state.activeFile || null)
        if (state.modelPositions && Object.keys(state.modelPositions).length > 0) setRemoteModelPositions(state.modelPositions)
      }
    },
  })
  const { liveSchema, updateFileContent } = useLiveSchema(roomId || 'default')

  const displaySchema = liveSchema ?? schema ?? null

  const handleFileChange = useCallback((filePath: string, content: string) => {
    updateFileContent(filePath, content)
  }, [updateFileContent])

  const handleShareSession = useCallback(() => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Session link copied to clipboard')
    })
  }, [])

  const handleTogglePanel = useCallback(() => {
    const next = !filePanelOpen
    setFilePanelOpen(next)
    if (syncUI) collaboration.broadcastUI({ filePanelOpen: next, viewMode, activeFile: activeFile ?? undefined })
  }, [filePanelOpen, viewMode, activeFile, syncUI, collaboration.broadcastUI])

  const handleViewModeChange = useCallback((mode: 'interactive' | 'mermaid') => {
    setViewMode(mode)
    if (syncUI) collaboration.broadcastUI({ filePanelOpen, viewMode: mode, activeFile: activeFile ?? undefined })
  }, [filePanelOpen, activeFile, syncUI, collaboration.broadcastUI])

  const handleClosePanel = useCallback(() => {
    setFilePanelOpen(false)
    if (syncUI) collaboration.broadcastUI({ filePanelOpen: false, viewMode, activeFile: activeFile ?? undefined })
  }, [viewMode, activeFile, syncUI, collaboration.broadcastUI])

  const handleActiveFileChange = useCallback((filePath: string) => {
    setActiveFile(filePath)
    if (syncUI) collaboration.broadcastUI({ filePanelOpen, viewMode, activeFile: filePath })
  }, [filePanelOpen, viewMode, syncUI, collaboration.broadcastUI])

  const handleModelPositionsChange = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      if (syncUI) collaboration.broadcastUI({ filePanelOpen, viewMode, activeFile: activeFile ?? undefined, modelPositions: positions })
    },
    [syncUI, filePanelOpen, viewMode, activeFile, collaboration.broadcastUI]
  )

  const handleModelClick = useCallback(
    async (modelName: string) => {
      try {
        const modelFiles = await fetchModelFiles()
        const filePath = modelFiles[modelName]
        if (filePath) {
          setFilePanelOpen(true)
          setActiveFile(filePath)
          if (syncUI) collaboration.broadcastUI({ filePanelOpen: true, viewMode, activeFile: filePath })
        }
      } catch {
        // Model file not found, ignore
      }
    },
    [syncUI, viewMode, collaboration.broadcastUI]
  )

  const MIN_SIDEBAR_WIDTH = 280
  const MAX_SIDEBAR_WIDTH = 800
  const DEFAULT_SIDEBAR_WIDTH = 420
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus-schema-sidebar-width')
      if (saved) {
        const w = parseInt(saved, 10)
        if (w >= MIN_SIDEBAR_WIDTH && w <= MAX_SIDEBAR_WIDTH) return w
      }
    } catch {}
    return DEFAULT_SIDEBAR_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(0)

  useEffect(() => {
    localStorage.setItem('nexus-schema-sidebar-width', String(sidebarWidth))
  }, [sidebarWidth])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    resizeStartX.current = e.clientX
    resizeStartWidth.current = sidebarWidth
  }, [sidebarWidth])

  useEffect(() => {
    if (!isResizing) return
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, resizeStartWidth.current + delta))
      setSidebarWidth(newWidth)
    }
    const onUp = () => setIsResizing(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  if (isLoading && !displaySchema) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner />
      </div>
    )
  }

  const others = collaboration.others

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 relative flex flex-col">
      <CursorPresence
        awareness={collaboration.awareness}
        others={others}
      />

      {/* Top bar: Files, Back, View toggle, Sync, Share, Theme */}
      <div
        className="flex-shrink-0 z-[60] flex items-center gap-4 overflow-x-auto px-4 py-4 transition-all duration-300"
      >
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTogglePanel}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Toggle file editor"
          >
            <PanelLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Files</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Back to app"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-600 shrink-0" />

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">View:</span>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-1 shrink-0">
            <button
              onClick={() => handleViewModeChange('interactive')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'interactive'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Interactive
            </button>
            <button
              onClick={() => handleViewModeChange('mermaid')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'mermaid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Static (Mermaid)
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-4" />

        <div className="flex items-center gap-2 shrink-0 ml-auto">
        {/* Sync options dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSyncOptions(!showSyncOptions)}
            className={`p-2 rounded-lg border transition-colors ${
              syncUI ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title="Session sync options"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          {showSyncOptions && (
            <>
              <div className="absolute inset-0 -inset-y-20" onClick={() => setShowSyncOptions(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-xl py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sync session (Google Docs style)</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">When on, sidebar, view mode, and active file sync across users</p>
                </div>
                <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncUI}
                    onChange={(e) => setSyncUI(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Sync UI state</span>
                </label>
              </div>
            </>
          )}
        </div>

        {others.length > 0 && (
          <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg">
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <div className="flex -space-x-1 ml-1">
              {others.slice(0, 5).map((user) => (
                <div
                  key={user.clientId}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-800"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name.charAt(0)}
                </div>
              ))}
              {others.length > 5 && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 border-2 border-white dark:border-slate-800">
                  +{others.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
              {others.length + 1} online
            </span>
          </div>
        )}
        <button
          onClick={handleShareSession}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-colors"
          title="Share session link"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        </div>
      </div>

      {/* Main area: sidebar + canvas (sidebar shrinks canvas, does not overlay) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {filePanelOpen && (
          <>
            <div
              className="flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              style={{ width: sidebarWidth }}
            >
              <SchemaFilePanel
                onClose={handleClosePanel}
                onFileChange={handleFileChange}
                activeFileFromSync={activeFile}
                onActiveFileChange={handleActiveFileChange}
                roomId={roomId}
                others={others}
                setEditorState={collaboration.setEditorState}
              />
            </div>
            <div
              className={`flex-shrink-0 w-1 flex flex-col items-center cursor-col-resize hover:bg-indigo-500/30 transition-colors group ${
                isResizing ? 'bg-indigo-500/50' : 'bg-transparent'
              }`}
              onMouseDown={handleResizeStart}
              title="Drag to resize"
            >
              <div className="w-1 h-full min-h-[40px] group-hover:bg-indigo-400/50 rounded" />
            </div>
          </>
        )}

        {/* Canvas - shrinks when sidebar is open */}
        <div className="flex-1 min-w-0 flex flex-col relative">
          {displaySchema && (
            viewMode === 'interactive' ? (
              <FullSchemaERDiagram
                schema={displaySchema}
                height="100%"
                remoteModelPositions={remoteModelPositions}
                onModelPositionsChange={handleModelPositionsChange}
                onModelClick={handleModelClick}
              />
            ) : (
              <div className="flex-1 min-h-0 overflow-auto pt-4">
                <MermaidERDiagram schema={displaySchema} height="100%" onModelClick={handleModelClick} />
              </div>
            )
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="flex-shrink-0 absolute bottom-4 right-4 z-30">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-600 shadow-lg text-xs text-slate-600 dark:text-slate-400">
          <div className={`w-2 h-2 rounded-full ${collaboration.connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{collaboration.connected ? 'Connected' : 'Disconnected'}</span>
          {roomId && (
            <span className="text-slate-400 dark:text-slate-500">
              Room: {roomId}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
