import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen max-w-md mx-auto bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-4xl">😵</p>
          <h1 className="text-lg font-bold text-foreground">오류가 발생했어요</h1>
          <p className="text-sm text-muted-foreground">
            잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
          >
            앱 다시 시작
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
