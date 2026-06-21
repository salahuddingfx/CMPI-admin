import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoLogout } from "../hooks/useAutoLogout";
import { AlertTriangle, LogOut } from "lucide-react";

const SESSION_MINUTES = 30;
const WARNING_MINUTES = 2;

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    localStorage.removeItem("cmpi-admin-token");
    localStorage.removeItem("cmpi-admin-user");
    navigate("/login", { replace: true });
  }, [navigate]);

  const { triggerLogout } = useAutoLogout({
    timeoutMinutes: SESSION_MINUTES,
    warningMinutes: WARNING_MINUTES,
    onLogout: handleLogout,
  });

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setRemainingMs(e.detail.remainingMs);
      setShowWarning(true);
    };
    window.addEventListener("session-warning", handler as EventListener);
    return () => window.removeEventListener("session-warning", handler as EventListener);
  }, []);

  const extendSession = () => {
    setShowWarning(false);
    window.dispatchEvent(new Event("mousedown")); // reset timer
  };

  const remainingMinutes = Math.ceil(remainingMs / 60000);

  return (
    <>
      {children}

      {/* Session Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-black text-foreground">Session Expiring Soon</h3>
                <p className="text-xs text-muted-foreground">Auto-logout in {remainingMinutes} minute{remainingMinutes !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Your session will expire due to inactivity. All unsaved changes will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={extendSession}
                className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black px-4 py-2.5 text-sm transition"
              >
                Stay Logged In
              </button>
              <button
                onClick={triggerLogout}
                className="flex items-center gap-2 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive hover:text-white px-4 py-2.5 text-sm font-bold transition"
              >
                <LogOut className="h-4 w-4" />
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
