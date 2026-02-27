/**
 * Export tabular data to CSV or JSON and trigger download.
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  filename = 'export.csv'
): void {
  if (data.length === 0) {
    downloadFile('', filename, 'text/csv')
    return
  }
  const headers = Object.keys(data[0])
  const escape = (v: unknown): string => {
    if (v == null) return ''
    const s =
      typeof v === 'object'
        ? JSON.stringify(v)
        : String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const rows = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]
  downloadFile(rows.join('\n'), filename, 'text/csv')
}

export function exportToJson(
  data: unknown,
  filename = 'export.json'
): void {
  const content = JSON.stringify(data, null, 2)
  downloadFile(content, filename, 'application/json')
}

export function exportToSql(content: string, filename = 'query.sql'): void {
  downloadFile(content, filename, 'text/plain')
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
