import React, { ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RefreshCw, LogOut } from "lucide-react";
import { safeStorage } from "../lib/storage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside IT-MASTERY:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    safeStorage.removeItem("xp-theme");
    // Clear potentially corrupted local session states if any
    safeStorage.clearMatching((key) => key.startsWith("xp-") || key.includes("leaderboard"));
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center p-6 text-[#E2E8F0]">
          <div className="w-full max-w-xl border border-red-500/40 bg-[#111827] rounded-lg p-6 shadow-2xl relative overflow-hidden">
            {/* Top Red Alert Eyebrow */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />
            
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-red-500/10 text-red-400 rounded-md border border-red-500/20">
                <AlertOctagon className="w-6 h-6" />
              </div>
              
              <div className="space-y-4 flex-1">
                <div>
                  <h1 className="text-lg font-mono font-semibold tracking-tight text-red-400">
                    DIAGNOSTIC SYSTEM CRASH DETECTED
                  </h1>
                  <p className="text-xs font-sans text-stone-400 leading-relaxed mt-1">
                    An unexpected client-side scripting error occurred during your IT laboratory session. The platform prevented a full browser panic and isolated the runtime log below.
                  </p>
                </div>

                {/* Crash Details Panel */}
                <div className="bg-[#060910] border border-stone-800 p-4 rounded-md font-mono text-xs overflow-auto max-h-[160px] space-y-2 text-[#CBD5E1]">
                  <div className="text-red-400 font-semibold uppercase tracking-wider text-[10px]">
                    Error Message:
                  </div>
                  <div className="bg-red-950/20 border-l-2 border-red-500 py-1.5 px-3 rounded-sm text-red-200">
                    {this.state.error?.toString() || "Script error (Cross-Origin Iframe isolated)"}
                  </div>

                  {this.state.errorInfo?.componentStack && (
                    <>
                      <div className="text-stone-500 font-semibold uppercase tracking-wider text-[10px] mt-2">
                        System Traversal Route:
                      </div>
                      <pre className="text-[10px] leading-relaxed text-stone-400 whitespace-pre-wrap select-all">
                        {this.state.errorInfo.componentStack.split("\n").slice(0, 5).join("\n")}
                      </pre>
                    </>
                  )}
                </div>

                {/* Info Text */}
                <p className="text-[11px] font-sans text-stone-400 italic">
                  Note: If you are running IT-MASTERY within an embedded iframe frame, clearing cookies, resetting local cache, or running this applet directly in a new tab will restore full connectivity.
                </p>

                {/* Action Controls */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-500 text-white font-mono font-medium text-xs py-2 px-4 rounded-sm flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> RELOAD WORKBENCH
                  </button>
                  <button
                    onClick={this.handleReset}
                    className="bg-transparent border border-stone-700 text-stone-300 hover:border-red-500 hover:text-red-400 font-mono font-medium text-xs py-2 px-4 rounded-sm flex items-center gap-1.5 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" /> CLEAN STATE & SYSTEM BOOT
                  </button>
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
