'use client'

import { debugLog } from '@/lib/phone-swap/debugLog'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

/** Keep Mobile Sensi slide alive if WebGL / model load fails. */
export class PhoneSwapBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // #region agent log
    debugLog(
      'PhoneSwapBoundary.tsx:componentDidCatch',
      'PhoneSwap error boundary caught',
      {
        errorMessage: error.message,
        errorName: error.name,
        componentStack: info.componentStack?.slice(0, 400),
      },
      'A',
    )
    // #endregion
    if (import.meta.env.DEV) {
      console.warn('[PhoneSwap]', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="phone-swap__fallback">
          3D preview could not load.
          {import.meta.env.DEV && this.state.errorMessage ? (
            <>
              {' '}
              <span className="phone-swap__fallback-detail">
                ({this.state.errorMessage})
              </span>
            </>
          ) : (
            <>
              {' '}
              Check model files in <code>public/models/</code>.
            </>
          )}
        </p>
      )
    }

    return this.props.children
  }
}
