import { ErrorBoundary } from '@/components/ErrorBoundary'
import { lazy, Suspense, type ComponentType } from 'react'

type DynamicOptions = {
  loading?: () => React.ReactNode
  ssr?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>

/** Lazy component boundary: React.lazy + Suspense + ErrorBoundary, with an optional sized loading shell. */
export default function dynamic(
  loader: () => Promise<{ default: AnyComponent }>,
  options?: DynamicOptions,
): AnyComponent {
  const Lazy = lazy(loader)
  const Loading = options?.loading

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function DynamicComponent(props: any) {
    return (
      <ErrorBoundary label="Chapter">
        <Suspense fallback={Loading ? <Loading /> : null}>
          <Lazy {...props} />
        </Suspense>
      </ErrorBoundary>
    )
  }

  return DynamicComponent
}
