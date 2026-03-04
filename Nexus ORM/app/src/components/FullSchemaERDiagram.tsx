import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ParsedModel } from '@/types/schema'
import type { NormalizedRelation } from '@/utils/erdCardinality'
import { parseRelations, toCrowsFootString } from '@/utils/erdCardinality'
import { ZoomIn, ZoomOut, Maximize2, Grid3X3, Home, HelpCircle } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

interface FullSchemaERDiagramProps {
  schema: { parsed: { models: ParsedModel[] } }
  height?: string
  onModelClick?: (modelName: string) => void
  remoteModelPositions?: Record<string, { x: number; y: number }> | null
  onModelPositionsChange?: (positions: Record<string, { x: number; y: number }>) => void
}

interface TooltipData {
  x: number
  y: number
  content: React.ReactNode
}

export function FullSchemaERDiagram({ schema, height = '600px', onModelClick, remoteModelPositions, onModelPositionsChange }: FullSchemaERDiagramProps) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const models = schema?.parsed?.models ?? []
  const [modelPositions, setModelPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.8)
  const [pan, setPan] = useState({ x: 50, y: 50 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showHelp, setShowHelp] = useState(false)
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    model: string | null
    offset: { x: number; y: number }
  }>({ isDragging: false, model: null, offset: { x: 0, y: 0 } })
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const relationships = useMemo((): NormalizedRelation[] => parseRelations(models), [models])

  const calculateInitialPositions = useCallback(() => {
    if (models.length === 0) return {}
    const positions: Record<string, { x: number; y: number }> = {}
    const cols = Math.ceil(Math.sqrt(models.length * 1.2))
    const rows = Math.ceil(models.length / cols)
    const hSpacing = 280
    const vSpacing = 200
    const totalWidth = (cols - 1) * hSpacing
    const totalHeight = (rows - 1) * vSpacing
    const startX = -totalWidth / 2
    const startY = -totalHeight / 2
    models.forEach((model, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      positions[model.name] = {
        x: startX + col * hSpacing + (Math.random() - 0.5) * 20,
        y: startY + row * vSpacing + (Math.random() - 0.5) * 20,
      }
    })
    return positions
  }, [models])

  useEffect(() => {
    if (dragState.isDragging) return
    if (remoteModelPositions && Object.keys(remoteModelPositions).length > 0 && models.every((m) => remoteModelPositions[m.name])) {
      setModelPositions(remoteModelPositions)
      return
    }
    const saved = localStorage.getItem('ufoStudioErDiagramPositions')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const hasAll = models.every((m) => parsed[m.name])
        if (hasAll) {
          setModelPositions(parsed)
          return
        }
      } catch {
        /* ignore */
      }
    }
    setModelPositions(calculateInitialPositions())
  }, [models, calculateInitialPositions, remoteModelPositions, dragState.isDragging])

  const lastDragPositionsRef = useRef<Record<string, { x: number; y: number }>>({})
  useEffect(() => {
    if (Object.keys(modelPositions).length > 0) {
      localStorage.setItem('ufoStudioErDiagramPositions', JSON.stringify(modelPositions))
      lastDragPositionsRef.current = modelPositions
    }
  }, [modelPositions])

  const fitToScreen = useCallback(() => {
    if (!containerRef.current || models.length === 0) return
    const rect = containerRef.current.getBoundingClientRect()
    const cols = Math.ceil(Math.sqrt(models.length * 1.2))
    const rows = Math.ceil(models.length / cols)
    const totalWidth = (cols - 1) * 280 + 200
    const totalHeight = (rows - 1) * 200 + 120
    const scaleX = (rect.width - 160) / totalWidth
    const scaleY = (rect.height - 160) / totalHeight
    const optimalZoom = Math.min(1.2, Math.max(0.3, Math.min(scaleX, scaleY)))
    setZoom(optimalZoom)
    setPan({ x: rect.width / 2 - 400 * optimalZoom, y: rect.height / 2 - 300 * optimalZoom })
  }, [models.length])

  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('.model-group')) return
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    setIsPanning(true)
    setPanStart({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging && dragState.model) {
        if (!svgRef.current) return
        const rect = svgRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - pan.x) / zoom
        const y = (e.clientY - rect.top - pan.y) / zoom
        setModelPositions((prev) => {
          const next = {
            ...prev,
            [dragState.model!]: {
              x: x - dragState.offset.x,
              y: y - dragState.offset.y,
            },
          }
          lastDragPositionsRef.current = next
          return next
        })
      } else if (isPanning) {
        const currentX = e.clientX - (svgRef.current?.getBoundingClientRect().left ?? 0)
        const currentY = e.clientY - (svgRef.current?.getBoundingClientRect().top ?? 0)
        const deltaX = currentX - panStart.x
        const deltaY = currentY - panStart.y
        setPan((p) => ({ x: p.x + deltaX, y: p.y + deltaY }))
        setPanStart({ x: currentX, y: currentY })
      }
    },
    [dragState, pan, zoom, isPanning, panStart]
  )

  const handleMouseUp = useCallback(() => {
    const wasDragging = dragState.isDragging
    setDragState({ isDragging: false, model: null, offset: { x: 0, y: 0 } })
    setIsPanning(false)
    if (wasDragging && Object.keys(lastDragPositionsRef.current).length > 0) {
      onModelPositionsChange?.(lastDragPositionsRef.current)
    }
  }, [dragState.isDragging, onModelPositionsChange])

  useEffect(() => {
    if (dragState.isDragging || isPanning) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, isPanning, handleMouseMove, handleMouseUp])

  const FIRST_ROW_TOP = 55
  const ROW_HEIGHT = 16

  const getFieldAnchor = useCallback(
    (
      modelName: string,
      fieldName: string | undefined,
      modelPos: { x: number; y: number },
      targetPos: { x: number; y: number }
    ): { x: number; y: number } => {
      const model = models.find((m) => m.name === modelName)
      if (!model || !fieldName) return modelPos

      const boxWidth = Math.max(180, model.name.length * 10 + 60)
      const boxHeight = Math.max(100, 60 + Math.min(model.fields?.length ?? 0, 8) * ROW_HEIGHT)
      const fieldIndex = model.fields?.findIndex((f) => f.name === fieldName) ?? -1

      const rowY =
        fieldIndex >= 0
          ? modelPos.y - boxHeight / 2 + FIRST_ROW_TOP + fieldIndex * ROW_HEIGHT + ROW_HEIGHT / 2
          : modelPos.y

      const left = modelPos.x - boxWidth / 2
      const right = modelPos.x + boxWidth / 2
      const top = modelPos.y - boxHeight / 2
      const bottom = modelPos.y + boxHeight / 2

      const dx = targetPos.x - modelPos.x
      const dy = targetPos.y - rowY

      if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return { x: modelPos.x, y: rowY }

      if (Math.abs(dx) >= Math.abs(dy)) {
        return { x: dx > 0 ? right : left, y: rowY }
      }
      return { x: modelPos.x, y: dy > 0 ? bottom : top }
    },
    [models]
  )

  const renderRelationship = (rel: NormalizedRelation) => {
    const fromPos = modelPositions[rel.fromModel]
    const toPos = modelPositions[rel.toModel]
    if (!fromPos || !toPos) return null

    const pkModel = rel.pkModel ?? rel.fromModel
    const fkModel = rel.fkModel ?? rel.toModel
    const pkFieldName = rel.pkFieldName ?? 'id'
    const fkFieldName = rel.fkFieldName ?? rel.fkField

    const useFieldAnchors = rel.fkModel && rel.pkModel && fkFieldName

    const pkPos = modelPositions[pkModel]
    const fkPos = modelPositions[fkModel]
    if (!pkPos || !fkPos) return null

    const dirX = toPos.x - fromPos.x
    const dirY = toPos.y - fromPos.y
    const fallbackDist = Math.sqrt(dirX * dirX + dirY * dirY) || 1
    const uxFallback = dirX / fallbackDist
    const uyFallback = dirY / fallbackDist
    const boxSize = 75

    const startPos = useFieldAnchors
      ? getFieldAnchor(pkModel, pkFieldName, pkPos, fkPos)
      : { x: fromPos.x + uxFallback * boxSize, y: fromPos.y + uyFallback * boxSize }
    const endPos = useFieldAnchors
      ? getFieldAnchor(fkModel, fkFieldName, fkPos, pkPos)
      : { x: toPos.x - uxFallback * boxSize, y: toPos.y - uyFallback * boxSize }

    const startX = startPos.x
    const startY = startPos.y
    const endX = endPos.x
    const endY = endPos.y

    const dx = endX - startX
    const dy = endY - startY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return null

    const ux = dx / dist
    const uy = dy / dist

    const { fromEnd, toEnd } = rel
    const strokeColor = fromEnd.min === 0 || toEnd.min === 0 ? '#94a3b8' : '#4f46e5'
    const perpX = -uy
    const perpY = ux
    const prongLen = 8
    const spread = 4

    const fromMany = fromEnd.max === 'many'
    const toMany = toEnd.max === 'many'
    const fromOptional = fromEnd.min === 0
    const toOptional = toEnd.min === 0

    const crowsFootStr = toCrowsFootString(rel)
    const handleRelHover = (e: React.MouseEvent) => {
      setTooltip({
        x: e.clientX + 12,
        y: e.clientY - 8,
        content: (
          <div>
            <p className="font-semibold">{rel.fromModel} → {rel.toModel}</p>
            <p className="text-slate-400 mt-0.5">via field: <span className="text-indigo-400">{rel.field}</span></p>
            <p className="mt-1 text-slate-300">{crowsFootStr}</p>
            <p className="text-slate-500 mt-1 text-[10px]">Crow&apos;s Foot notation</p>
          </div>
        ),
      })
    }

    return (
      <g
        key={`${rel.fromModel}-${rel.toModel}-${rel.field}`}
        className="cursor-pointer"
        onMouseEnter={handleRelHover}
        onMouseMove={handleRelHover}
        onMouseLeave={() => setTooltip(null)}
      >
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="transparent"
          strokeWidth={12}
          className="pointer-events-auto"
        />
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={strokeColor}
          strokeWidth={2}
          strokeDasharray={fromOptional || toOptional ? '5,5' : undefined}
          className="hover:stroke-indigo-600 transition-colors pointer-events-none"
        />
        {/* FROM end: many = crow, one = bar; optional = circle */}
        {fromMany ? (
          <path
            d={`M ${startX + perpX * spread} ${startY + perpY * spread} L ${startX + ux * prongLen} ${startY + uy * prongLen} L ${startX - perpX * spread} ${startY - perpY * spread}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <line
            x1={startX + perpX * prongLen}
            y1={startY + perpY * prongLen}
            x2={startX - perpX * prongLen}
            y2={startY - perpY * prongLen}
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
        {fromOptional && <circle cx={startX} cy={startY} r={5} fill="none" stroke={strokeColor} strokeWidth={2} />}
        {/* TO end: many = crow, one = bar; optional = circle */}
        {toOptional && <circle cx={endX} cy={endY} r={5} fill="none" stroke={strokeColor} strokeWidth={2} />}
        {toMany ? (
          <path
            d={`M ${endX + perpX * spread} ${endY + perpY * spread} L ${endX - ux * prongLen} ${endY - uy * prongLen} L ${endX - perpX * spread} ${endY - perpY * spread}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <line
            x1={endX + perpX * prongLen}
            y1={endY + perpY * prongLen}
            x2={endX - perpX * prongLen}
            y2={endY - perpY * prongLen}
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
        <text
          x={(startX + endX) / 2 + perpX * 12}
          y={(startY + endY) / 2 + perpY * 12}
          textAnchor="middle"
          fill={isDark ? '#94a3b8' : '#475569'}
          className="text-[10px] pointer-events-none"
        >
          {rel.field}
        </text>
      </g>
    )
  }

  const boxBg = isDark ? '#334155' : 'white'
  const boxHeaderBg = isDark ? '#475569' : '#f8fafc'
  const boxStroke = isDark ? '#475569' : '#e5e7eb'
  const boxText = isDark ? '#f1f5f9' : '#0f172a'
  const boxTextMuted = isDark ? '#94a3b8' : '#64748b'

  const renderModel = (model: ParsedModel) => {
    const pos = modelPositions[model.name]
    if (!pos) return null

    const isSelected = selectedModel === model.name
    const fieldCount = model.fields?.length ?? 0
    const boxHeight = Math.max(100, 60 + Math.min(fieldCount, 8) * 16)
    const boxWidth = Math.max(180, model.name.length * 10 + 60)

    const relCount = relationships.filter((r) => r.fromModel === model.name || r.toModel === model.name).length
    const pkFields = model.fields?.filter((f) => f.type.includes('@id')) ?? []
    const fkFields = model.fields?.filter((f) =>
      f.name.endsWith('Id') && model.fields?.some(
        (of) => of.name === f.name.replace(/Id$/, '') && models.some((m) => m.name === of.type.split(' ')[0].replace('[]', '').replace('?', ''))
      )
    ) ?? []

    const handleModelHover = (e: React.MouseEvent) => {
      if (dragState.isDragging) return
      setTooltip({
        x: e.clientX + 12,
        y: e.clientY - 8,
        content: (
          <div>
            <p className="font-semibold text-sm">{model.name}</p>
            <p className="text-slate-400 mt-1">{fieldCount} fields · {relCount} relationships</p>
            {pkFields.length > 0 && (
              <p className="mt-1">Primary key: <span className="text-indigo-400">{pkFields.map((f) => f.name).join(', ')}</span></p>
            )}
            {fkFields.length > 0 && (
              <p>Foreign keys: <span className="text-amber-400">{fkFields.map((f) => f.name).join(', ')}</span></p>
            )}
            <p className="text-slate-500 mt-1 text-[10px]">Double-click to view data · Drag to reposition</p>
          </div>
        ),
      })
    }

    return (
      <g
        key={model.name}
        className="model-group cursor-pointer"
        transform={`translate(${pos.x}, ${pos.y})`}
        onMouseEnter={handleModelHover}
        onMouseMove={handleModelHover}
        onMouseLeave={() => setTooltip(null)}
        onMouseDown={(e) => {
          e.stopPropagation()
          setTooltip(null)
          setDragState({
            isDragging: true,
            model: model.name,
            offset: {
              x: (e.clientX - (svgRef.current?.getBoundingClientRect().left ?? 0) - pan.x) / zoom - pos.x,
              y: (e.clientY - (svgRef.current?.getBoundingClientRect().top ?? 0) - pan.y) / zoom - pos.y,
            },
          })
        }}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedModel(model.name)
          onModelClick?.(model.name)
        }}
        onDoubleClick={() => navigate(`/model/${model.name}/data`)}
      >
        <rect
          x={-boxWidth / 2 + 2}
          y={-boxHeight / 2 + 2}
          width={boxWidth}
          height={boxHeight}
          fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}
          rx={12}
        />
        <rect
          x={-boxWidth / 2}
          y={-boxHeight / 2}
          width={boxWidth}
          height={boxHeight}
          fill={boxBg}
          stroke={isSelected ? '#4f46e5' : boxStroke}
          strokeWidth={isSelected ? 3 : 2}
          rx={12}
          className="transition-all"
        />
        <rect
          x={-boxWidth / 2}
          y={-boxHeight / 2}
          width={boxWidth}
          height={40}
          fill={isSelected ? '#4f46e5' : boxHeaderBg}
          rx={12}
        />
        <text
          x={-boxWidth / 2 + 36}
          y={-boxHeight / 2 + 26}
          fill={isSelected ? 'white' : boxText}
          className="text-sm font-bold"
        >
          {model.name}
        </text>
        <circle cx={boxWidth / 2 - 20} cy={-boxHeight / 2 + 20} r={12} fill="#4f46e5" />
        <text
          x={boxWidth / 2 - 20}
          y={-boxHeight / 2 + 25}
          textAnchor="middle"
          fill="white"
          className="text-xs font-medium"
        >
          {fieldCount}
        </text>
        {model.fields?.slice(0, 8).map((field, i) => {
          const isFk = field.name.endsWith('Id') && model.fields?.some(
            (f) => f.name === field.name.replace(/Id$/, '') && (f.type.includes('@relation') || models.some((m) => m.name === f.type.split(' ')[0].replace('[]', '').replace('?', '')))
          )
          const label = field.type.includes('@id') ? `${field.name} PK` : isFk ? `${field.name} FK` : field.name
          return (
            <text
              key={field.name}
              x={-boxWidth / 2 + 28}
              y={-boxHeight / 2 + 55 + i * 16}
              fill={boxText}
              className="text-xs"
            >
              {label}
            </text>
          )
        })}
        {fieldCount > 8 && (
          <text x={0} y={boxHeight / 2 - 12} textAnchor="middle" fill={boxTextMuted} className="text-xs">
            +{fieldCount - 8} more
          </text>
        )}
      </g>
    )
  }

  if (models.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500 dark:text-slate-400">
        <p>No models in schema</p>
      </div>
    )
  }

  const gridStroke = isDark ? '#475569' : '#e5e7eb'
  const svgBg = isDark ? 'from-slate-800 to-slate-900' : 'from-slate-50 to-slate-100'

  return (
    <div ref={containerRef} className="relative overflow-hidden" style={{ height }}>
      <div className="absolute top-20 left-4 z-10 flex gap-2">
        <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <button
            onClick={() => setZoom((z) => Math.max(0.1, z / 1.2))}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 min-w-[50px] flex items-center justify-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <button onClick={fitToScreen} className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400">
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setModelPositions(calculateInitialPositions())}
          className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
          className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
        >
          <Home className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`p-2 rounded-lg border text-slate-600 dark:text-slate-400 ${showHelp ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className={`bg-gradient-to-br ${svgBg} ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={(e) => {
          e.preventDefault()
          setZoom((z) => Math.max(0.1, Math.min(3, z * (e.deltaY > 0 ? 0.9 : 1.1))))
        }}
        onMouseDown={handleBackgroundMouseDown}
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={gridStroke} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <g>{relationships.map(renderRelationship)}</g>
          <g>{models.map(renderModel)}</g>
        </g>
      </svg>

      <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg px-4 py-2 border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-400">
        {models.length} models · {relationships.length} relations
        {selectedModel && <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">Selected: {selectedModel}</span>}
      </div>

      {showHelp && (
        <div className="absolute bottom-20 right-4 z-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg px-4 py-3 border border-slate-200 dark:border-slate-600 max-w-xs text-xs text-slate-600 dark:text-slate-400">
          <p className="font-medium text-slate-900 dark:text-slate-100 mb-2">Crow&apos;s Foot Notation</p>
          <p><span className="font-mono">|</span> = One (exactly one)</p>
          <p><span className="font-mono">⋈</span> = Many (zero or more)</p>
          <p><span className="font-mono">○</span> = Optional (zero or one)</p>
          <p className="mt-2 text-slate-500">Dashed lines indicate optional relationships</p>
          <p className="mt-2 font-medium text-slate-900 dark:text-slate-100">Keys</p>
          <p><span className="text-indigo-500 font-medium">PK</span> = Primary Key (unique identifier)</p>
          <p><span className="text-amber-500 font-medium">FK</span> = Foreign Key (references another table)</p>
          <p className="mt-2 font-medium text-slate-900 dark:text-slate-100">Controls</p>
          <p>Hover → see relationship details</p>
          <p>Double-click model → view structure</p>
          <p>Drag model → reposition</p>
          <p>Drag background → pan canvas</p>
          <p>Scroll → zoom in/out</p>
        </div>
      )}

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="bg-slate-900 text-slate-200 rounded-lg shadow-xl px-3 py-2 text-xs max-w-xs border border-slate-700">
            {tooltip.content}
          </div>
        </div>
      )}
    </div>
  )
}
