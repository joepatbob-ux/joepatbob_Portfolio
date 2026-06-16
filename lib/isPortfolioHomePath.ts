/** True for the single-page portfolio route (`/`). */
export function isPortfolioHomePath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return normalized === '/'
}
