/** Split "Name (detail)" scope lines into cell title + optional subtitle. */
export function parseScopeEntry(entry: string): { name: string; detail?: string } {
  const match = entry.match(/^(.+?)\s*\((.+)\)\s*$/)
  if (match) {
    return { name: match[1].trim(), detail: match[2].trim() }
  }
  return { name: entry.trim() }
}
