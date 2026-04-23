"use client";

import { AlertTriangle } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type State = { hasError: boolean };

export class ChatErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // AUDIT FIX: Suppress ESLint no-unused-vars by removing typed params — the
  // method signature is required by React but no implementation is needed here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(error: Error, info: ErrorInfo) {
    // Intentionally empty — errors are caught in getDerivedStateFromError.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-4 rounded-xl border border-border bg-card p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-amber-500" />
          <p className="text-sm text-muted-foreground">Chat crashed unexpectedly.</p>
          <Button className="mt-3" onClick={() => this.setState({ hasError: false })}>
            Reconnect
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
