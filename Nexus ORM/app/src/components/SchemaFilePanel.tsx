import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFileSync } from '@/hooks/useFileSync'
import type { CollaboratorInfo, EditorCursor, EditorSelection } from '@/hooks/useCollaboration'
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  FilePlus,
  Save,
  Database,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  X,
} from 'lucide-react'
import { fetchSchemaFiles, fetchSchemaFile, saveSchemaFile, validateSchema } from '@/api/schema'
import { toast } from 'sonner'
import Editor from '@monaco-editor/react'
import { useTheme } from '@/context/ThemeContext'

interface SchemaFilePanelProps {
  onClose: () => void
  onFileChange: (filePath: string, content: string) => void
  activeFileFromSync?: string | null
  onActiveFileChange?: (filePath: string) => void
  roomId?: string
  others?: CollaboratorInfo[]
  setEditorState?: (cursor: EditorCursor | null, selection: EditorSelection | null) => void
}

export function SchemaFilePanel({ onClose, onFileChange, activeFileFromSync, onActiveFileChange, roomId, others = [], setEditorState }: SchemaFilePanelProps) {
  const { theme } = useTheme()
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [treeOpen, setTreeOpen] = useState(true)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors?: string } | null>(null)
  const [showAddModelInfo, setShowAddModelInfo] = useState(false)
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const editorRef = useRef<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remoteDecorationsRef = useRef<string[]>([])
  const editorStateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorDisposablesRef = useRef<{ dispose: () => void }[]>([])
  const selectedFileRef = useRef(selectedFile)
  selectedFileRef.current = selectedFile

  const hexToRgba = (hex: string, alpha: number) => {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (!m) return `rgba(99, 102, 241, ${alpha})`
    return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`
  }

  const { data: files } = useQuery({
    queryKey: ['schema-files'],
    queryFn: fetchSchemaFiles,
  })

  const { broadcastFileContent, subscribeToFile } = useFileSync(roomId || 'default')

  const loadFile = useCallback(async (filePath: string, skipBroadcast?: boolean) => {
    try {
      const content = await fetchSchemaFile(filePath)
      setEditorContent(content)
      setSelectedFile(filePath)
      setIsDirty(false)
      if (!skipBroadcast) onActiveFileChange?.(filePath)
    } catch (e) {
      toast.error('Failed to load file')
    }
  }, [onActiveFileChange])

  useEffect(() => {
    if (files && files.length > 0 && !selectedFile) {
      const main = files.find((f) => f.name === 'schema.prisma')
      loadFile(main?.path ?? files[0].path, true)
    }
  }, [files, selectedFile, loadFile])

  useEffect(() => {
    if (activeFileFromSync && activeFileFromSync !== selectedFile && files?.some((f) => f.path === activeFileFromSync)) {
      loadFile(activeFileFromSync, true)
    }
  }, [activeFileFromSync, selectedFile, files, loadFile])

  const applyingRemoteRef = useRef(false)
  useEffect(() => {
    if (!selectedFile || !roomId) return
    return subscribeToFile(selectedFile, (content) => {
      applyingRemoteRef.current = true
      setEditorContent(content)
      onFileChange(selectedFile, content)
      applyingRemoteRef.current = false
    })
  }, [selectedFile, roomId, subscribeToFile, onFileChange])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined) return
    setEditorContent(value)
    setIsDirty(true)

    if (selectedFile) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onFileChange(selectedFile, value)
        if (roomId) broadcastFileContent(selectedFile, value)
      }, 300)
    }
  }, [selectedFile, onFileChange, roomId, broadcastFileContent])

  const handleSave = useCallback(async () => {
    if (!selectedFile || !isDirty) return
    setSaving(true)
    try {
      await saveSchemaFile(selectedFile, editorContent)
      setIsDirty(false)
      queryClient.invalidateQueries({ queryKey: ['schema'] })
      queryClient.invalidateQueries({ queryKey: ['schema-files'] })
      toast.success('File saved')
      const result = await validateSchema()
      setValidationResult(result)
      if (!result.valid) toast.error('Schema has errors')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [selectedFile, editorContent, isDirty, queryClient])

  const handleValidate = useCallback(async () => {
    try {
      const result = await validateSchema()
      setValidationResult(result)
      if (result.valid) {
        toast.success('Schema is valid')
      } else {
        toast.error('Schema has errors')
      }
    } catch {
      toast.error('Validation failed')
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  const handleEditorMount = useCallback((editor: any) => {
    editorRef.current = editor
    editorDisposablesRef.current.forEach((d) => d.dispose())
    editorDisposablesRef.current = []
    if (!setEditorState) return
    const broadcastState = () => {
      const file = selectedFileRef.current
      if (!file) return
      const pos = editor.getPosition()
      const sel = editor.getSelection()
      if (!pos || !sel) return
      if (sel.isEmpty()) {
        setEditorState({ line: pos.lineNumber, column: pos.column, filePath: file }, null)
      } else {
        setEditorState(
          { line: sel.startLineNumber, column: sel.startColumn, filePath: file },
          {
            startLine: sel.startLineNumber,
            startColumn: sel.startColumn,
            endLine: sel.endLineNumber,
            endColumn: sel.endColumn,
            filePath: file,
          }
        )
      }
    }
    editorDisposablesRef.current = [
      editor.onDidChangeCursorPosition(() => {
        if (editorStateDebounceRef.current) clearTimeout(editorStateDebounceRef.current)
        editorStateDebounceRef.current = setTimeout(broadcastState, 80)
      }),
      editor.onDidChangeCursorSelection(() => {
        if (editorStateDebounceRef.current) clearTimeout(editorStateDebounceRef.current)
        editorStateDebounceRef.current = setTimeout(broadcastState, 80)
      }),
    ]
    broadcastState()
  }, [setEditorState])

  useEffect(() => {
    const editor = editorRef.current
    if (editor && setEditorState && selectedFile) {
      const pos = editor.getPosition()
      const sel = editor.getSelection()
      if (pos && sel) {
        if (sel.isEmpty()) {
          setEditorState({ line: pos.lineNumber, column: pos.column, filePath: selectedFile }, null)
        } else {
          setEditorState(
            { line: sel.startLineNumber, column: sel.startColumn, filePath: selectedFile },
            {
              startLine: sel.startLineNumber,
              startColumn: sel.startColumn,
              endLine: sel.endLineNumber,
              endColumn: sel.endColumn,
              filePath: selectedFile,
            }
          )
        }
      }
    } else if (setEditorState && !selectedFile) {
      setEditorState(null, null)
    }
  }, [selectedFile, setEditorState])

  useEffect(() => {
    return () => {
      editorDisposablesRef.current.forEach((d) => d.dispose())
      editorDisposablesRef.current = []
      if (editorStateDebounceRef.current) clearTimeout(editorStateDebounceRef.current)
      setEditorState?.(null, null)
    }
  }, [setEditorState])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !selectedFile) return
    const model = editor.getModel()
    if (!model) return
    const othersInFile = others.filter(
      (u) => (u.editorCursor?.filePath === selectedFile || u.editorSelection?.filePath === selectedFile)
    )
    const newDecos: Array<{ range: any; options: any }> = []
    const cursorStyles: string[] = []
    const selectionStyles: string[] = []
    othersInFile.forEach((user) => {
      const color = user.color || '#6366f1'
      const cursorClass = `remote-cursor-${user.clientId}`
      const selectionClass = `remote-selection-${user.clientId}`
      cursorStyles.push(`.${cursorClass} { border-left-color: ${color} !important; }`)
      selectionStyles.push(`.${selectionClass} { background-color: ${hexToRgba(color, 0.25)} !important; }`)
      if (user.editorCursor && user.editorCursor.filePath === selectedFile) {
        const { line, column } = user.editorCursor
        const lineCount = model.getLineCount()
        if (line >= 1 && line <= lineCount) {
          const lineLength = model.getLineLength(line)
          const col = Math.max(1, Math.min(column, lineLength + 1))
          const labelClass = `remote-cursor-label-${user.clientId}`
          cursorStyles.push(`.${labelClass} { background: ${color}; color: white !important; padding: 0 4px; border-radius: 2px; font-size: 10px; margin-left: 2px; font-weight: 500; }`)
          newDecos.push(
            {
              range: { startLineNumber: line, startColumn: col, endLineNumber: line, endColumn: col },
              options: {
                before: {
                  content: '\u200b',
                  inlineClassName: cursorClass,
                  inlineClassNameAffectsLetterSpacing: false,
                },
              },
            },
            {
              range: { startLineNumber: line, startColumn: col, endLineNumber: line, endColumn: col },
              options: {
                after: {
                  content: ' ' + user.name,
                  inlineClassName: labelClass,
                  inlineClassNameAffectsLetterSpacing: false,
                },
              },
            }
          )
        }
      }
      if (user.editorSelection && user.editorSelection.filePath === selectedFile) {
        const { startLine, startColumn, endLine, endColumn } = user.editorSelection
        const lineCount = model.getLineCount()
        if (startLine >= 1 && endLine <= lineCount) {
          newDecos.push({
            range: { startLineNumber: startLine, startColumn: startColumn, endLineNumber: endLine, endColumn: endColumn },
            options: {
              className: selectionClass,
            },
          })
        }
      }
    })
    let styleEl = document.getElementById('nexus-remote-cursor-styles')
    if (cursorStyles.length > 0 || selectionStyles.length > 0) {
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = 'nexus-remote-cursor-styles'
        document.head.appendChild(styleEl)
      }
      styleEl.textContent = [
        '.remote-cursor, [class^="remote-cursor-"] { border-left: 2px solid; margin-left: -1px; pointer-events: none; display: inline-block; width: 0; }',
        '.remote-selection, [class^="remote-selection-"] { pointer-events: none; }',
        ...cursorStyles,
        ...selectionStyles,
      ].join('\n')
    } else if (styleEl) {
      styleEl.textContent = ''
    }
    try {
      remoteDecorationsRef.current = editor.deltaDecorations(remoteDecorationsRef.current, newDecos)
    } catch {
      remoteDecorationsRef.current = []
    }
  }, [others, selectedFile])


  const handleCreateFile = useCallback(async () => {
    const name = newFileName.trim().replace(/\.prisma$/, '') || 'model'
    const fileName = `${name}.prisma`
    const schemaDir = 'prisma/schema'
    const filePath = `${schemaDir}/${fileName}`
    try {
      await saveSchemaFile(filePath, `model ${name.charAt(0).toUpperCase() + name.slice(1)} {\n  id Int @id @default(autoincrement())\n}\n`)
      queryClient.invalidateQueries({ queryKey: ['schema-files'] })
      queryClient.invalidateQueries({ queryKey: ['schema'] })
      setShowNewFileInput(false)
      setNewFileName('')
      loadFile(filePath)
      toast.success(`Created ${fileName}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create file')
    }
  }, [newFileName, saveSchemaFile, queryClient, loadFile])

  const fileName = selectedFile?.split('/').pop() ?? ''

  return (
    <div className="h-full w-full min-w-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Schema Files</span>
          <div className="relative">
            <button
              onClick={() => setShowAddModelInfo(!showAddModelInfo)}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
              title="How to add a model"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {showAddModelInfo && (
              <>
                <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-lg bg-slate-800 dark:bg-slate-900 border border-slate-600 shadow-xl px-3 py-2 text-xs text-slate-200">
                  <p>To add a model: create a new <code className="px-0.5 rounded bg-slate-700">model_name.prisma</code> file or add a <code className="px-0.5 rounded bg-slate-700">model ModelName &#123; ... &#125;</code> block to an existing file.</p>
                </div>
                <div className="fixed inset-0 z-40" onClick={() => setShowAddModelInfo(false)} aria-hidden="true" />
              </>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* File tree */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTreeOpen(!treeOpen)}
            className="flex items-center gap-1 flex-1 min-w-0 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {treeOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            prisma/schema
          </button>
          <button
            onClick={() => { setShowNewFileInput(true); setNewFileName('') }}
            className="p-1.5 mr-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            title="Create new file"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
        </div>
        {showNewFileInput && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="model_name.prisma"
              className="flex-1 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile()
                if (e.key === 'Escape') { setShowNewFileInput(false); setNewFileName('') }
              }}
              autoFocus
            />
            <button
              onClick={handleCreateFile}
              className="px-2 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Create
            </button>
            <button
              onClick={() => { setShowNewFileInput(false); setNewFileName('') }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        {treeOpen && files && (
          <div className="pb-2 max-h-48 overflow-y-auto">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => loadFile(file.path)}
                className={`flex items-center gap-2 w-full px-6 py-1.5 text-xs transition-colors ${
                  selectedFile === file.path
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                {file.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 truncate">
          {fileName}
          {isDirty && <span className="ml-1 text-amber-500">*</span>}
        </span>
        <button
          onClick={handleValidate}
          className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 transition-colors"
          title="Validate schema"
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Validation result */}
      {validationResult && (
        <div className={`px-4 py-2 text-xs border-b ${
          validationResult.valid
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-1">
            {validationResult.valid ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            <span>{validationResult.valid ? 'Schema is valid' : 'Validation errors'}</span>
          </div>
          {validationResult.errors && (
            <pre className="mt-1 text-[10px] whitespace-pre-wrap max-h-24 overflow-y-auto opacity-80">
              {validationResult.errors}
            </pre>
          )}
        </div>
      )}

      {/* Monaco editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="graphql"
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={editorContent}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 12 },
            renderLineHighlight: 'line',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            acceptSuggestionOnCommitCharacter: false,
            acceptSuggestionOnEnter: 'off',
            quickSuggestions: false,
          }}
        />
      </div>
    </div>
  )
}
