import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // Could send to telemetry here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>应用出错了</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c' }}>{String(this.state.error)}</pre>
          <div>请打开开发者工具查看详细信息。</div>
        </div>
      );
    }
    return this.props.children;
  }
}