import { Component, type ReactNode } from "react";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Anovra page failed to render:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md border border-border bg-card p-6 text-center">
          <img src="/logo.png" alt="Anovra" className="mx-auto mb-5 h-12 w-auto" />
          <h1 className="text-xl font-semibold text-foreground">This page could not be displayed</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your data is still saved. Reload the page to try again, or return to the homepage.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="border border-border px-4 py-2 text-sm font-semibold">Reload</button>
            <a href="/" className="bg-accent px-4 py-2 text-sm font-semibold text-white">Home</a>
          </div>
        </div>
      </main>
    );
  }
}
