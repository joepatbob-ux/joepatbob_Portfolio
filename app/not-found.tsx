import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 — Page not found',
}

export default function NotFound() {
  return (
    <div className="not-found-page">
      <p className="not-found-page__code">404</p>
      <h1 className="not-found-page__title">Page not found</h1>
      <p className="not-found-page__body">
        That URL doesn&apos;t exist — or it moved.
      </p>
      <Link href="/" className="not-found-page__link">
        Back home
      </Link>
    </div>
  )
}
