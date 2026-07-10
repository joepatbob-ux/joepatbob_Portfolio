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
    if (import.meta.env.DEV) {
      console.warn('[PhoneSwap]', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      const detail = this.state.errorMessage.trim()
      const hint = detail.includes('.hdr')
        ? 'Lighting environment failed to download — retry or check network.'
        : detail.includes('/models/')
          ? 'A model or texture under /models/ did not load.'
          : 'WebGL or scene setup failed.'

      return (
        <p className="phone-swap__fallback">
          3D preview could not load. {hint}
          {detail ? (
            <>
              {' '}
              <span className="phone-swap__fallback-detail">({detail})</span>
            </>
          ) : null}
        </p>
      )
    }

    return this.props.children
  }
}
