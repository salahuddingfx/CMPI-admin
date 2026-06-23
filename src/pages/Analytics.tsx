import { useEffect, useState } from "react";
import { Loader2, Globe, Monitor, Smartphone, Tablet, Eye, Users, MapPin, Calendar, ArrowUpDown } from "lucide-react";
import { getVisits, getVisitStats } from "../services/api";

interface Stats {
  total: number;
  unique_visitors: number;
  unique_countries: number;
  today: number;
  this_week: number;
  top_pages: { page_url: string; visits: number }[];
  top_countries: { country: string; visits: number }[];
  device_breakdown: { device_type: string; count: number }[];
}

interface Visit {
  id: number;
  visitor_id: string;
  ip_address: string;
  country: string;
  city: string;
  region: string;
  isp: string;
  page_url: string;
  referrer: string;
  device_type: string;
  browser: string;
  os: string;
  created_at: string;
}

export default function Analytics() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [countryFilter, deviceFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (countryFilter) params.country = countryFilter;
      if (deviceFilter) params.device_type = deviceFilter;
      const [visitsData, statsData] = await Promise.all([
        getVisits(params),
        getVisitStats(),
      ]);
      setVisits(visitsData.data ?? visitsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  }

  const deviceIcon = (type: string) => {
    switch (type) {
      case "mobile": return <Smartphone className="h-3.5 w-3.5" />;
      case "tablet": return <Tablet className="h-3.5 w-3.5" />;
      default: return <Monitor className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Visitor tracking & page analytics</p>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Visits</span>
              </div>
              <p className="text-2xl font-black text-foreground">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Unique Visitors</span>
              </div>
              <p className="text-2xl font-black text-foreground">{stats.unique_visitors}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Globe className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Countries</span>
              </div>
              <p className="text-2xl font-black text-foreground">{stats.unique_countries}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Today</span>
              </div>
              <p className="text-2xl font-black text-foreground">{stats.today}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">This Week</span>
              </div>
              <p className="text-2xl font-black text-foreground">{stats.this_week}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Countries</h3>
              {stats.top_countries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.top_countries.map((c) => (
                    <div key={c.country} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.country}
                      </span>
                      <span className="text-sm font-bold text-foreground">{c.visits}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Pages</h3>
              {stats.top_pages.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.top_pages.map((p) => (
                    <div key={p.page_url} className="flex items-center justify-between">
                      <span className="truncate text-sm font-semibold max-w-[70%]">{new URL(p.page_url).pathname}</span>
                      <span className="text-sm font-bold text-foreground">{p.visits}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Device Breakdown</h3>
              {stats.device_breakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.device_breakdown.map((d) => (
                    <div key={d.device_type} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold capitalize">
                        {deviceIcon(d.device_type)}
                        {d.device_type}
                      </span>
                      <span className="text-sm font-bold text-foreground">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-border p-1 bg-background">
          {["", "desktop", "mobile", "tablet"].map((d) => (
            <button
              key={d}
              onClick={() => setDeviceFilter(d)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                deviceFilter === d ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Filter by country..."
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="w-48 rounded-xl border border-border bg-background px-4 py-1.5 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-12">
          <Eye className="h-10 w-10 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">No visits recorded yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Country</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">IP</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Page</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Device</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Browser</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">OS</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visits.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {v.country || <span className="text-muted-foreground italic">—</span>}
                    </span>
                    {v.city && <p className="text-[10px] text-muted-foreground ml-5">{v.city}{v.region ? `, ${v.region}` : ""}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.ip_address}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-xs text-muted-foreground" title={v.page_url}>
                    {v.page_url ? new URL(v.page_url).pathname : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground capitalize">
                      {deviceIcon(v.device_type)}
                      {v.device_type || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{v.browser || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{v.os || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(v.created_at).toLocaleString("en-BD")}
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
