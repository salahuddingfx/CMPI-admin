import { useEffect, useState } from "react";
import { Loader2, Globe, Monitor, Smartphone, Tablet, Eye, Users, MapPin, Calendar, BarChart3 } from "lucide-react";
import { getVisits, getVisitStats } from "../services/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

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

const PIE_COLORS = ["#06b6d4", "#facc15", "#ec4899", "#84cc16"];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((item: any, index: number) => (
        <p key={index} className="font-semibold" style={{ color: item.stroke || item.fill }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

const getPathname = (urlStr: string) => {
  try {
    return new URL(urlStr).pathname;
  } catch {
    return urlStr;
  }
};

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

  // Process traffic trend (Total visits & unique visitors per day)
  const getTrafficData = () => {
    if (visits.length === 0) return [];
    
    const datesMap: Record<string, { date: string; dateObj: Date; visits: number; uniques: Set<string> }> = {};
    
    visits.forEach((v) => {
      if (!v.created_at) return;
      const dateObj = new Date(v.created_at);
      // Format as Month Day (e.g. Jun 28)
      const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      if (!datesMap[dateStr]) {
        datesMap[dateStr] = {
          date: dateStr,
          dateObj: dateObj,
          visits: 0,
          uniques: new Set<string>(),
        };
      }
      
      datesMap[dateStr].visits += 1;
      if (v.visitor_id) {
        datesMap[dateStr].uniques.add(v.visitor_id);
      }
    });

    // Convert to sorted array
    return Object.values(datesMap)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map((item) => ({
        date: item.date,
        "Total Visits": item.visits,
        "Unique Visitors": item.uniques.size,
      }));
  };

  const trafficData = getTrafficData();

  // Top Pages data structure
  const topPagesData = stats?.top_pages.map((p) => ({
    name: getPathname(p.page_url),
    visits: p.visits,
  })) || [];

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
          {/* Numerical Stats row */}
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

          {/* Visitor Traffic Tracker (Daily trend area chart) */}
          {trafficData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <Eye className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Visitor Traffic Tracker (Daily)</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="Total Visits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                    <Area type="monotone" dataKey="Unique Visitors" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUnique)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Breakdown Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top Countries BarChart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Top Countries</h3>
              </div>
              {stats.top_countries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">No country data yet</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.top_countries} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="country" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="visits" name="Visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Pages Horizontal BarChart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Top Pages</h3>
              </div>
              {topPagesData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">No page data yet</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPagesData} layout="vertical" margin={{ top: 5, right: 5, left: 15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} width={80} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="visits" name="Visits" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Device Breakdown PieChart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <Monitor className="h-4 w-4 text-pink-600" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Device Breakdown</h3>
              </div>
              {stats.device_breakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">No device data yet</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.device_breakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="device_type"
                      >
                        {stats.device_breakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend 
                        formatter={(value) => <span className="text-[10px] font-bold capitalize text-muted-foreground">{value}</span>}
                        iconSize={8}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Control filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-border p-1 bg-background">
          {["", "desktop", "mobile", "tablet"].map((d) => (
            <button
              key={d}
              onClick={() => setDeviceFilter(d)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                deviceFilter === d ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "" ? "All Devices" : d.charAt(0).toUpperCase() + d.slice(1)}
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

      {/* Visitor tracking details table */}
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
                    {v.page_url ? getPathname(v.page_url) : "—"}
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
