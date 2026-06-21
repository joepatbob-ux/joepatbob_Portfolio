import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  label?: string
  onError?: (error: Error) => void
}

type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error)
    if (import.meta.env.DEV) {
      console.error(
        `[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`,
        error,
        info.componentStack,
      )
    }
  }

  private retry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="chapter-error" role="alert">
          <p className="chapter-error__title">
            {this.props.label
              ? `${this.props.label} failed to load`
              : 'This section failed to load'}
          </p>
          <p className="chapter-error__detail">
            Refresh the page or try again.
          </p>
          <div className="chapter-error__actions">
            <button type="button" className="chapter-error__btn" onClick={this.retry}>
              Try again
            </button>
            <button
              type="button"
              className="chapter-error__btn chapter-error__btn--secondary"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
