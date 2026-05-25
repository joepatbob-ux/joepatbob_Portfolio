import { lazy, Suspense, type ComponentType } from 'react'

type DynamicOptions = {
  loading?: () => React.ReactNode
  ssr?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>

/** Vite shim for `next/dynamic`. */
export default function dynamic(
  loader: () => Promise<{ default: AnyComponent }>,
  options?: DynamicOptions,
): AnyComponent {
  const Lazy = lazy(loader)
  const Loading = options?.loading

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function DynamicComponent(props: any) {
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <Lazy {...props} />
      </Suspense>
    )
  }

  return DynamicComponent
}
