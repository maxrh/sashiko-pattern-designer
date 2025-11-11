import React from 'react';
import { AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.state = {
      hasError: true,
      error: error,
      errorInfo: errorInfo
    };
  }

  copyErrorToClipboard = () => {
    const errorText = `Error: ${this.state.error?.toString()}\n\nStack: ${this.state.error?.stack}\n\nComponent Stack: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error details copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy error:', err);
    });
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <div className="max-w-2xl w-full bg-card border border-destructive/50 rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Something went wrong
                </h2>
                <p className="text-muted-foreground mb-4">
                  An error occurred while rendering the pattern. This might be due to invalid pattern data or a rendering issue.
                </p>
                
                {this.state.error && (
                  <div className="bg-muted rounded-md p-4 mb-4 overflow-auto max-h-48">
                    <p className="text-sm font-mono text-destructive mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={this.handleReset}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reload Page
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={this.copyErrorToClipboard}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Error Details
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <p className="text-sm text-foreground">
                    <strong>Tip:</strong> If this error persists, try creating a new pattern or loading a different saved pattern.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
