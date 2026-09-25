import { Component, type ErrorInfo, type ReactNode } from 'react'

export default class ErrorBoundary extends Component<{children:ReactNode},{hasError:boolean}> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Veloura UI]', error, info)
    window.dispatchEvent(new CustomEvent('veloura-ui-error',{detail:{message:error.message}}))
  }

  render() {
    if (this.state.hasError) return <div className="error-boundary container"><span className="empty-mark">V</span><h2>Veloura hit a snag.</h2><p>The storefront could not render this view cleanly.</p><button className="button primary" onClick={() => window.location.reload()}>Reload page</button></div>
    return this.props.children
  }
}
