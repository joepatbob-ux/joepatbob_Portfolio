import { ErrorBoundary } from '@/components/ErrorBoundary'
import { lazy, Suspense, type ComponentType } from 'react'

type DynamicOptions = {
  loading?: () => React.ReactNode
  ssr?: boolean
  /** Resolve this chunk before hydrating a prerendered document. The prerender
   * snapshot bakes the lazy subtree's full HTML but carries no Suspense
   * markers, so hydrating an unresolved boundary renders the fallback against
   * that content and React discards it (#418). Preloaded components render
   * synchronously at hydration and match the snapshot instead. Only for the
   * small chapter chunks — never for the 3D stack. */
  preloadForHydration?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>

const hydrationPreloads: Array<() => Promise<void>> = []

/** Resolve every preloadForHydration chunk (best-effort) before hydrateRoot. */
export function preloadDynamicsForHydration(): Promise<void> {
  return Promise.all(hydrationPreloads.map((fn) => fn().catch(() => {}))).then(
    () => undefined,
  )
}

/** Lazy component boundary: React.lazy + Suspense + ErrorBoundary, with an optional sized loading shell. */
export default function dynamic(
  loader: () => Promise<{ default: AnyComponent }>,
  options?: DynamicOptions,
): AnyComponent {
  const Lazy = lazy(loader)
  const Loading = options?.loading

  // Set once the preload resolves — from then on the component renders
  // synchronously (no Suspense pass), which is what lets a prerendered
  // boundary hydrate against its baked HTML.
  let Loaded: AnyComponent | null = null
  if (options?.preloadForHydration) {
    hydrationPreloads.push(() =>
      loader().then((m) => {
        Loaded = m.default
      }),
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function DynamicComponent(props: any) {
    if (Loaded) {
      return (
        <ErrorBoundary label="Chapter">
          <Loaded {...props} />
        </ErrorBoundary>
      )
    }
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
