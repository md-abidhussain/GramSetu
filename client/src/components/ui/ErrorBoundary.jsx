import React from 'react';
import { Button } from './Button.jsx';

// When a render throws, React unmounts the whole tree, which is what used to
// leave people looking at a white page with nothing to click. This catches the
// throw and shows them something they can act on instead.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { failed: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    // There is no error reporting service wired up yet, so the browser console
    // is the only record of what happened. Keep this until one exists.
    console.error('A page failed to render.', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-3 max-w-sm text-sm text-slate-600">
          This page could not be displayed. Nothing you submitted has been lost.
          Reloading usually fixes it.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => window.location.reload()}>Reload the page</Button>
          {/* A plain link, not a router link: if the crash is in this route,
              staying inside the app would just render the same broken page. */}
          <a
            href="/"
            className="text-sm font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            Go to the start
          </a>
        </div>
        {/* Only while developing. A citizen has no use for a stack trace. */}
        {import.meta.env.DEV && (
          <p className="mt-8 max-w-lg font-mono text-xs text-slate-500">{this.state.message}</p>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;
