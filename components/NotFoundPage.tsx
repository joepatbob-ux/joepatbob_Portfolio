import { useEffect } from 'react'

const PAGE_TITLE = '404 — Page not found'

export function NotFoundPage() {
  useEffect(() => {
    const previous = document.title
    document.title = PAGE_TITLE
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="not-found-page">
      <p className="not-found-page__code">404</p>
      <h1 className="not-found-page__title">Page not found</h1>
      <p className="not-found-page__body">
        That URL doesn&apos;t exist — or it moved.
      </p>
      <a href="/" className="not-found-page__link">
        Back home
      </a>
    </div>
  )
}
