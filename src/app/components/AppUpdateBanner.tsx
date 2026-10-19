import { useEffect, useState } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";

declare const __APP_BUILD_TIME__: string;

interface VersionPayload {
  version?: string;
  builtAt?: string;
}

export function AppUpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // The version baked into this running javascript bundle at build time
  const bundledVersion = typeof __APP_BUILD_TIME__ !== "undefined" ? __APP_BUILD_TIME__ : "dev";

  useEffect(() => {
    let isMounted = true;

    async function checkVersion() {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });

        if (!response.ok) return;
        const data: VersionPayload = await response.json();
        const serverVersion = data.version?.trim();

        if (!serverVersion) return;

        // If the server's build timestamp is different from the bundle that loaded this page,
        // an update has been deployed!
        if (bundledVersion !== "dev" && serverVersion !== bundledVersion) {
          if (isMounted) {
            setHasUpdate(true);
          }
        }
      } catch {
        // Silently ignore network blips or offline state
      }
    }

    // 1. Initial check on mount
    checkVersion();

    // 2. Periodic poll every 35 seconds
    const intervalId = setInterval(checkVersion, 35_000);

    // 3. Check when user switches back to this tab
    function handleVisibilityOrFocus() {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    }

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    // Provide window helper for testing and demonstration
    if (typeof window !== "undefined") {
      (window as any).__triggerAppUpdateBanner = () => {
        setIsDismissed(false);
        setHasUpdate(true);
      };
    }

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [bundledVersion]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force clean reload
    window.location.reload();
  };

  if (!hasUpdate || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="New update notification"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[120] max-w-sm w-[calc(100vw-2.5rem)] animate-in slide-in-from-bottom-5 fade-in duration-300"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="bg-card/95 backdrop-blur-md border border-accent/40 shadow-2xl rounded-2xl p-4 text-foreground relative overflow-hidden">
        {/* Subtle accent glow top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-emerald-400 to-accent" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/25">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              New Update
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            title="Dismiss for now"
            aria-label="Dismiss update notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-accent mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              New version available
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              A newer version of Anovra has been deployed. Refresh to load the latest improvements and updates.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-75"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh now"}
          </button>
        </div>
      </div>
    </aside>
  );
}
