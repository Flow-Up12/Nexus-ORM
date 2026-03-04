import { useEffect, useState, useRef, useCallback } from 'react'
import { fetchAllSchemaFileContents, parseSchemaContent } from '@/api/schema'
import type { SchemaData } from '@/types/schema'

export function useLiveSchema(_roomId: string) {
  const [liveSchema, setLiveSchema] = useState<SchemaData | null>(null)
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [fileList, setFileList] = useState<Array<{ path: string; name: string }>>([])
  const parseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileContentsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    fetchAllSchemaFileContents().then((data) => {
      if (cancelled) return
      const contents: Record<string, string> = {}
      const files: Array<{ path: string; name: string }> = []
      for (const file of data.files) {
        contents[file.path] = file.content
        files.push({ path: file.path, name: file.name })
      }
      fileContentsRef.current = contents
      setFileContents(contents)
      setFileList(files)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const reparseSchema = useCallback(async (contents: Record<string, string>, files: Array<{ path: string; name: string }>) => {
    const sorted = [...files].sort((a, b) => {
      if (a.name === 'schema.prisma') return -1
      if (b.name === 'schema.prisma') return 1
      if (a.name === 'enums.prisma') return -1
      if (b.name === 'enums.prisma') return 1
      return a.path.localeCompare(b.path)
    })

    const merged = sorted.map((f) => contents[f.path] ?? '').join('\n')
    if (!merged.trim()) return

    try {
      const parsed = await parseSchemaContent(merged)
      setLiveSchema({ raw: merged, parsed })
    } catch {
      // parse error - keep last valid
    }
  }, [])

  useEffect(() => {
    if (fileList.length > 0 && Object.keys(fileContents).length > 0) {
      if (parseTimeoutRef.current) clearTimeout(parseTimeoutRef.current)
      parseTimeoutRef.current = setTimeout(() => {
        reparseSchema(fileContents, fileList)
      }, 300)
    }
    return () => {
      if (parseTimeoutRef.current) clearTimeout(parseTimeoutRef.current)
    }
  }, [fileContents, fileList, reparseSchema])

  const updateFileContent = useCallback((filePath: string, content: string) => {
    fileContentsRef.current = { ...fileContentsRef.current, [filePath]: content }
    setFileContents((prev) => ({ ...prev, [filePath]: content }))
  }, [])

  return {
    liveSchema,
    fileContents,
    fileList,
    updateFileContent,
  }
}
