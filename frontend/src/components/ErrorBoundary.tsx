import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props  { children: ReactNode }
interface State  { hasError: boolean; error: Error | null }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          height:          '100vh',
          gap:             16,
          background:      '#F5F3EE',
          fontFamily:      "'DM Sans', sans-serif",
          color:           '#1A1814',
        }}>
          <div style={{ fontSize: 40 }}>⚠</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Kutilmagan xato yuz berdi</div>
          <div style={{ fontSize: 13, color: '#6B6559', maxWidth: 400, textAlign: 'center' }}>
            {this.state.error?.message ?? 'Noma\'lum xato'}
          </div>
          <button
            style={{
              marginTop:    8,
              padding:      '9px 20px',
              background:   '#C17F3E',
              color:        '#fff',
              border:       'none',
              borderRadius: 8,
              fontSize:     13,
              fontWeight:   600,
              cursor:       'pointer',
              fontFamily:   'inherit',
            }}
            onClick={() => window.location.href = '/'}
          >
            Bosh sahifaga qaytish
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
