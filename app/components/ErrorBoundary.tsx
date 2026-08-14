'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  section?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info?.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, errorMessage: '' });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return React.createElement('div', {
        style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg, #0f172a)', padding: '2rem' }
      },
        React.createElement('div', {
          style: { maxWidth: '480px', width: '100%', background: 'var(--color-surface, #1e293b)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.5rem', padding: '2.5rem', textAlign: 'center' }
        },
          React.createElement('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '\u26A1'),
          React.createElement('h2', { style: { fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text, #f1f5f9)', marginBottom: '0.5rem' } },
            'Something went wrong' + (this.props.section ? ` in ${this.props.section}` : '')
          ),
          React.createElement('p', { style: { color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.9rem', marginBottom: '0.5rem' } }, 'An unexpected error occurred. Your data is safe.'),
          React.createElement('p', { style: { color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1.5rem', wordBreak: 'break-word' } }, this.state.errorMessage),
          React.createElement('div', { style: { display: 'flex', gap: '0.75rem', justifyContent: 'center' } },
            React.createElement('button', { onClick: this.handleReset, style: { padding: '0.6rem 1.4rem', borderRadius: '0.75rem', background: 'var(--color-accent, #6366f1)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.9rem' } }, 'Try again'),
            React.createElement('a', { href: '/dashboard', style: { padding: '0.6rem 1.4rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'none' } }, 'Go to Dashboard')
          )
        )
      );
    }
    return this.props.children;
  }
}