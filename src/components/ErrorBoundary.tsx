import { Component, type ReactNode } from "react";

import { resetApplication } from "@/domain/reset/resetApplication";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Class component because React error boundaries require the
// getDerivedStateFromError/componentDidCatch lifecycle — no hook equivalent
// exists. Without this, an unexpected render error (e.g. corrupted
// localStorage data) blanks the entire app with no way back except manually
// clearing browser storage.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Unhandled error:", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  handleReset = async () => {
    const confirmed = window.confirm(
      "تمام اطلاعات برنامه، جلسات ثبت‌شده و پیشرفت شما حذف می‌شود و امکان بازگردانی وجود ندارد.\n\nآیا مطمئن هستید؟"
    );

    if (!confirmed) {
      return;
    }

    await resetApplication();
    window.location.replace("/setup");
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="app-gradient-bg pt-safe relative flex min-h-screen flex-col items-center justify-center px-6">
        <div className="light-sweep" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-navy-600 bg-navy-700 p-6 text-center">
          <h1 className="text-lg font-bold text-white">
            مشکلی پیش اومد
          </h1>

          <p className="mt-2 text-sm leading-7 text-zinc-400">
            یک خطای غیرمنتظره رخ داد. می‌تونی دوباره تلاش کنی، یا اگر مشکل
            ادامه داشت، برنامه رو بازنشانی کنی.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={this.handleRetry}
              className="w-full rounded-2xl bg-emerald-500 py-3 font-bold text-black"
            >
              تلاش دوباره
            </button>

            <button
              onClick={this.handleReset}
              className="w-full rounded-2xl border border-red-900 bg-red-950/30 py-3 font-bold text-red-400"
            >
              بازنشانی کامل برنامه
            </button>
          </div>
        </div>
      </div>
    );
  }
}
