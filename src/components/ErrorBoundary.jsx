import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You can also log the error to an error reporting service here
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="mt-4 text-xl font-semibold text-center text-gray-900 dark:text-gray-50">
              Oops! Something went wrong
            </h2>
            
            <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-zinc-800 rounded text-xs text-gray-700 dark:text-gray-300 font-mono overflow-auto">
                <p className="font-semibold">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                      Component Stack
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Go to Home
              </button>
            </div>

            <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;