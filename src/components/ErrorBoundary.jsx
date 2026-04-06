import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VSE Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
          <div className="text-center p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-bright)' }}>Something went wrong</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded text-sm font-bold"
              style={{ background: 'var(--up-color)', color: 'white' }}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
