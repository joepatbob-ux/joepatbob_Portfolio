import { NotFoundPage } from '@/components/NotFoundPage'
import { isPortfolioHomePath } from '@/lib/isPortfolioHomePath'
import { useEffect, useState } from 'react'
import App from './App'

function readPathname(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname
}

/** Portfolio shell on `/` only — unknown paths get the orange 404 page. */
export default function Root() {
  const [pathname, setPathname] = useState(readPathname)

  useEffect(() => {
    const sync = () => setPathname(readPathname())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  if (!isPortfolioHomePath(pathname)) {
    return <NotFoundPage />
  }

  return <App />
}
