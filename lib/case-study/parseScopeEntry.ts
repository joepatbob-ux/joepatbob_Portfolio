import type { OverviewMetaItem } from '@/lib/types'

/** Split "Name (detail)" scope lines into cell title + optional subtitle. */
export function parseScopeEntry(entry: string): { name: string; detail?: string } {
  const match = entry.match(/^(.+?)\s*\((.+)\)\s*$/)
  if (match) {
    return { name: match[1].trim(), detail: match[2].trim() }
  }
  return { name: entry.trim() }
}

/** @deprecated Legacy overviewMeta → scope items only. */
export function scopeEntriesFromMeta(
  items: readonly OverviewMetaItem[],
): readonly string[] {
  const scope = items.find((item) => item.label === 'Scope') ?? items[0]
  if (!scope) return []
  if (scope.items?.length) return scope.items
  if (scope.value?.trim()) {
    return scope.value.split('\n').map((line) => line.trim()).filter(Boolean)
  }
  return []
}
