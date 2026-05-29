// #region agent log
const DEBUG_ENDPOINT =
  'http://127.0.0.1:7497/ingest/81923cc0-6178-4290-b585-3ed9fb72ddc8'
const DEBUG_SESSION = '5bd555'

export function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = 'pre-fix',
) {
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': DEBUG_SESSION,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      location,
      message,
      data,
      hypothesisId,
      runId,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
}
// #endregion
