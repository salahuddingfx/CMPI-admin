import { useEffect, useState } from "react";
import { Loader2, Search, Check, X, Globe, Mail } from "lucide-react";
import { getCookieConsents, getCookieConsentStats } from "../services/api";

interface Consent {
  id: number;
  ip_address: string;
  user_agent: string;
  email: string | null;
  consent_type: "accept" | "deny";
  created_at: string;
}

interface Stats {
  total: number;
  accepted: number;
  denied: number;
}

export default function CookieConsents() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, accepted: 0, denied: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter) params.consent_type = filter;
      if (search) params.email = search;
      const [data, statsData] = await Promise.all([
        getCookieConsents(params),
        getCookieConsentStats(),
      ]);
      setConsents(data.data ?? data);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load consents", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Cookie Consents</h1>
          <p className="text-sm text-muted-foreground">Visitor cookie preference logs</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="mt-1 text-2xl font-black text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accepted</p>
          <p className="mt-1 text-2xl font-black text-green-600">{stats.accepted}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Denied</p>
          <p className="mt-1 text-2xl font-black text-red-600">{stats.denied}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-60 rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition">Search</button>
        </form>

        <div className="flex gap-1 rounded-xl border border-border p-1 bg-background">
          {["", "accept", "deny"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filter === f ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : consents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-12">
          <Globe className="h-10 w-10 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">No consent records yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">User Agent</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {consents.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      c.consent_type === "accept"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-red-500/10 text-red-600"
                    }`}>
                      {c.consent_type === "accept" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {c.consent_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {c.email || <span className="text-muted-foreground italic">Guest</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.ip_address}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate" title={c.user_agent}>
                    {c.user_agent?.split("/")[0] || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(c.created_at).toLocaleString("en-BD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
