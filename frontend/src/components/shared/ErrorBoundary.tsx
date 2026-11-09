import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// The app had no error boundary anywhere — a single uncaught error in ANY
// component (a bad API response shape, a null property access after a
// socket-driven refetch, etc.) unmounted the entire React tree, which is
// what "the screen goes blank" actually was: not a specific bug in one
// place, but the total absence of a safety net for whichever bug fires.
// This catches render-time errors app-wide and shows a recoverable screen
// with the real error message instead of a blank page — and gives us a
// concrete error to diagnose the next time this happens.
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-900">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              This page hit an unexpected error. Reloading usually fixes it — if it keeps
              happening, the technical details below help track down why.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mb-4"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
            <details className="text-left text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 mt-4">
              <summary className="cursor-pointer font-medium">Technical details</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
