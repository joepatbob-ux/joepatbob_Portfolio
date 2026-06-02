/** Read lab routing from ?query and from hash fragments (#foo?touch2-playground=1). */
export function readProtoDebugSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()

  const fromSearch = new URLSearchParams(window.location.search)
  if ([...fromSearch.keys()].length > 0) return fromSearch

  const hash = window.location.hash
  const q = hash.indexOf('?')
  if (q >= 0) return new URLSearchParams(hash.slice(q + 1))

  return fromSearch
}

export type ProtoDebugMode =
  | 'portfolio'
  | 'sma-proto'
  | 'phone-debug'
  | 'touch2-playground'

export function resolveProtoDebugMode(
  params: URLSearchParams,
): { mode: ProtoDebugMode; layoutMode: boolean } {
  if (params.has('sma-proto')) {
    return { mode: 'sma-proto', layoutMode: false }
  }
  if (params.has('touch2-playground') || params.has('touch2')) {
    return { mode: 'touch2-playground', layoutMode: false }
  }
  if (params.has('phone-debug') || params.has('phone-layout')) {
    return {
      mode: 'phone-debug',
      layoutMode: params.has('phone-layout'),
    }
  }
  return { mode: 'portfolio', layoutMode: false }
}

export function readProtoDebugMode(): {
  mode: ProtoDebugMode
  layoutMode: boolean
} {
  return resolveProtoDebugMode(readProtoDebugSearchParams())
}
