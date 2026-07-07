import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <div className="empty-state card" style={{ marginTop: 40 }}>
            <div className="emoji">⚠️</div>
            <h3>Something went wrong</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              {this.state.error.message || 'This page failed to load.'}
            </p>
            <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
