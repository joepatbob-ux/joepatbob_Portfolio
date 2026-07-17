/// <reference types="vite/client" />

import 'react'

// React 18's JSX types predate the `inert` attribute (typed natively in 19).
// Pass `inert=""` / `undefined` — a boolean would serialize as inert="false",
// which the HTML spec still treats as inert.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- merging declarations must repeat React's type parameter
  interface HTMLAttributes<T> {
    inert?: '' | undefined
  }
}
