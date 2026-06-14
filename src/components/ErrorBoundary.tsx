import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: '0 24px', background: 'var(--bg)', textAlign: 'center',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          Something went wrong
        </h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 320 }}>
          An unexpected error occurred. Reload the app to continue.
        </p>
        <button
          className="pdr-btn pdr-btn--primary"
          style={{ maxWidth: 200 }}
          onClick={() => location.reload()}
        >
          Reload
        </button>
      </div>
    )
  }
}
