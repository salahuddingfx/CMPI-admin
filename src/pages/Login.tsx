import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { login } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    // If token exists, direct immediately to home
    const token = localStorage.getItem("cmpi-admin-token");
    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Invalid login credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-secondary/15 blur-[80px]"></div>
      <div className="absolute -right-20 -bottom-20 h-[450px] w-[450px] rounded-full bg-primary/10 blur-[100px]"></div>

      <div className="w-full max-w-md z-10">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/CMPI.png" alt="CMPI Logo" className="h-14 w-14 object-contain mb-3 animate-bounce" />
          <h1 className="text-3xl font-black tracking-tight text-foreground text-center">
            Welcome back!
          </h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1.5 text-center">
            CMPI Administrative Portal Control Panel
          </p>
        </div>

        {/* Login Panel Card */}
        <div className="glass-card p-8 border border-border shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive p-4 text-xs font-bold leading-relaxed">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Address field */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                Administrative Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@cmpi.edu.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-11 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black tracking-wide shadow-lg shadow-primary/25 px-4 py-3.5 text-sm transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Admin</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer help */}
        <p className="text-center text-xs text-muted-foreground mt-8 font-semibold">
          For technical access issues, contact CMPI Systems Support Desk.
        </p>
      </div>
    </div>
  );
}
