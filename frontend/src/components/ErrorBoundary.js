import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to console in development
    console.error('Error Boundary Caught:', error, errorInfo);
    
    // In production, you could send this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
    
    // Optionally reload the page or navigate home
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <div style={{
            maxWidth: '600px',
            padding: '3rem',
            backgroundColor: 'var(--bg-white)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>
              😵
            </div>
            
            <h1 style={{
              fontSize: '2rem',
              marginBottom: '1rem',
              color: 'var(--text-primary)'
            }}>
              Oops! Something went wrong
            </h1>
            
            <p style={{
              fontSize: '1.1rem',
              marginBottom: '2rem',
              color: 'var(--text-secondary)'
            }}>
              {this.props.fallbackMessage || 
                "We're sorry, but something unexpected happened. Please try refreshing the page."}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginBottom: '2rem',
                textAlign: 'left',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: 'var(--danger)'
                }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      <strong>Stack Trace:</strong> {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => window.location.href = '/'}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component to wrap components with error boundary
export const withErrorBoundary = (Component, fallbackMessage) => {
  return (props) => (
    <ErrorBoundary fallbackMessage={fallbackMessage}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
