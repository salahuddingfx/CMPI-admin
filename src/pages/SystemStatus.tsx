import { useState, useEffect, useCallback } from "react";
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  Clock, 
  Server, 
  RefreshCw, 
  Terminal, 
  Layers, 
  Users, 
  FileText, 
  GraduationCap 
} from "lucide-react";
import { getSystemStatus } from "../services/api";
 
interface PerformanceTick {
  time: string;
  requests: number;
  db_queries: number;
  response_time: number;
}
 
interface SystemData {
  system: {
    os: string;
    php_version: string;
    laravel_version: string;
    server_software: string;
    server_time: string;
  };
  cpu: {
    cores: number;
    usage_percent: number;
  };
  memory: {
    total_bytes: number;
    used_bytes: number;
    free_bytes: number;
    usage_percent: number;
  };
  database: {
    driver: string;
    version: string;
    size_bytes: number;
    size_human: string;
  };
  records: {
    total_users: number;
    total_results: number;
    total_admissions: number;
    total_notices: number;
  };
  performance: {
    current_requests_per_sec: number;
    avg_response_time_ms: number;
    chart_data: PerformanceTick[];
  };
}
 
export default function SystemStatus() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [historicalData, setHistoricalData] = useState<PerformanceTick[]>([]);
 
  const fetchStatus = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const responseData = await getSystemStatus();
      setData(responseData);
      setError(null);
 
      // Update historical data chart
      setHistoricalData(prev => {
        const newTicks = responseData.performance.chart_data;
        if (prev.length === 0) {
          return newTicks;
        }
        // Take the latest tick and append it
        const latestTick = newTicks[newTicks.length - 1];
        // Ensure we don't add duplicate times
        if (prev[prev.length - 1]?.time === latestTick.time) {
          return prev;
        }
        const updated = [...prev, latestTick];
        if (updated.length > 15) {
          updated.shift();
        }
        return updated;
      });
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch system metrics. Check if server is reachable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
 
  useEffect(() => {
    fetchStatus();
    // Poll every 5 seconds for real-time monitoring feel
    const interval = setInterval(() => {
      fetchStatus(true);
    }, 5000);
 
    return () => clearInterval(interval);
  }, [fetchStatus]);
 
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
 
  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">Gathering server metrics...</p>
        </div>
      </div>
    );
  }
 
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-4 max-w-md mx-auto my-12">
        <Activity className="h-12 w-12 text-destructive mx-auto animate-bounce" />
        <h3 className="text-lg font-black text-foreground">Monitoring Unavailable</h3>
        <p className="text-sm text-muted-foreground font-semibold">{error || "Something went wrong."}</p>
        <button 
          onClick={() => { setLoading(true); fetchStatus(); }}
          className="rounded-xl bg-primary text-primary-foreground font-black px-5 py-2.5 text-xs shadow-md shadow-primary/20 hover:bg-primary-dark transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }
 
  // SVG Chart Helper calculations
  const chartHeight = 120;
  const chartWidth = 500;
  const padding = 15;
 
  const maxReq = Math.max(...historicalData.map(d => d.requests), 60);
  const maxDb = Math.max(...historicalData.map(d => d.db_queries), 200);
 
  const pointsReq = historicalData.map((d, index) => {
    const x = padding + (index / (historicalData.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.requests / maxReq) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(" ");
 
  const pointsDb = historicalData.map((d, index) => {
    const x = padding + (index / (historicalData.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.db_queries / maxDb) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(" ");
 
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">System Status Monitor</h1>
          <p className="text-sm text-muted-foreground font-semibold">Real-time hardware performance, database load, and environment diagnostics</p>
        </div>
        <button 
          onClick={() => fetchStatus()}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-black hover:bg-muted text-foreground transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
          <span>{refreshing ? "Syncing..." : "Force Sync"}</span>
        </button>
      </div>
 
      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 
        {/* CPU Monitor Card */}
        <div className="glass-card p-6 border space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Processor</h3>
                  <p className="text-xs text-muted-foreground font-semibold">{data.cpu.cores} Cores Detected</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
 
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-xs text-muted-foreground font-bold uppercase">CPU Utilization</span>
                <span className="text-3xl font-black text-foreground font-mono">
                  {data.cpu.usage_percent}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    data.cpu.usage_percent > 80 ? "bg-destructive animate-pulse" : 
                    data.cpu.usage_percent > 60 ? "bg-secondary" : "bg-primary"
                  }`}
                  style={{ width: `${data.cpu.usage_percent}%` }}
                />
              </div>
            </div>
          </div>
 
          <div className="border-t border-border pt-4 mt-4 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>OS Kernel:</span>
            <span className="text-foreground font-bold">{data.system.os}</span>
          </div>
        </div>
 
        {/* Memory Monitor Card */}
        <div className="glass-card p-6 border space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <HardDrive className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Memory (RAM)</h3>
                  <p className="text-xs text-muted-foreground font-semibold">{formatBytes(data.memory.total_bytes)} System RAM</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                Dynamic
              </span>
            </div>
 
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-xs text-muted-foreground font-bold uppercase">Memory Usage</span>
                <span className="text-3xl font-black text-foreground font-mono">
                  {data.memory.usage_percent}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    data.memory.usage_percent > 85 ? "bg-destructive animate-pulse" : 
                    data.memory.usage_percent > 65 ? "bg-secondary" : "bg-primary"
                  }`}
                  style={{ width: `${data.memory.usage_percent}%` }}
                />
              </div>
            </div>
          </div>
 
          <div className="border-t border-border pt-4 mt-4 flex justify-between text-[11px] text-muted-foreground font-semibold">
            <span>Allocated: {formatBytes(data.memory.used_bytes)}</span>
            <span>Free: {formatBytes(data.memory.free_bytes)}</span>
          </div>
        </div>
 
        {/* Database Stats Card */}
        <div className="glass-card p-6 border space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Database Engine</h3>
                  <p className="text-xs text-muted-foreground font-semibold">Driver: {data.database.driver.toUpperCase()}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full capitalize">
                {data.database.driver}
              </span>
            </div>
 
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-bold uppercase">Storage Footprint</p>
              <p className="text-3xl font-black text-foreground font-mono">
                {data.database.size_human}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold">Total size of tables and indexes in db</p>
            </div>
          </div>
 
          <div className="border-t border-border pt-4 mt-4 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>DB Version:</span>
            <span className="text-foreground font-bold truncate max-w-[150px]" title={data.database.version}>{data.database.version}</span>
          </div>
        </div>
 
      </div>
 
      {/* Live Graph & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
        {/* SVG Performance Chart */}
        <div className="glass-card p-6 border lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-base font-black text-foreground">Live Server Performance</h3>
            </div>
            <div className="flex gap-4 text-[10px] font-bold">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="h-2.5 w-2.5 rounded bg-primary"></span>
                <span>Requests/Sec (Max: {maxReq})</span>
              </div>
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="h-2.5 w-2.5 rounded bg-secondary"></span>
                <span>DB Queries/Sec (Max: {maxDb})</span>
              </div>
            </div>
          </div>
 
          {historicalData.length > 1 ? (
            <div className="relative">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-44 overflow-visible"
              >
                {/* Horizontal gridlines */}
                {[0, 0.5, 1].map((r, i) => {
                  const y = padding + r * (chartHeight - padding * 2);
                  return (
                    <line 
                      key={i} 
                      x1={padding} 
                      y1={y} 
                      x2={chartWidth - padding} 
                      y2={y} 
                      className="stroke-border/40 stroke-1" 
                    />
                  );
                })}
 
                {/* DB Queries Line (Secondary Color) */}
                <polyline
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsDb}
                />
 
                {/* Requests Line (Primary Color) */}
                <polyline
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsReq}
                />
 
                {/* Labels under graph */}
                {historicalData.map((d, index) => {
                  if (index % 3 !== 0 && index !== historicalData.length - 1) return null;
                  const x = padding + (index / (historicalData.length - 1)) * (chartWidth - padding * 2);
                  return (
                    <text 
                      key={index} 
                      x={x} 
                      y={chartHeight - 2} 
                      textAnchor="middle" 
                      className="fill-muted-foreground text-[8px] font-mono font-bold"
                    >
                      {d.time}
                    </text>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="flex h-36 w-full items-center justify-center text-xs text-muted-foreground font-semibold">
              Analyzing metrics window...
            </div>
          )}
 
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-4 text-center">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Avg Latency</p>
              <p className="text-xl font-black text-foreground font-mono">{data.performance.avg_response_time_ms} ms</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">RPS</p>
              <p className="text-xl font-black text-primary font-mono">{data.performance.current_requests_per_sec} req/s</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Queries/sec</p>
              <p className="text-xl font-black text-secondary font-mono">{historicalData[historicalData.length - 1]?.db_queries ?? 0}</p>
            </div>
          </div>
        </div>
 
        {/* Server & Environment Info */}
        <div className="glass-card p-6 border space-y-6">
          <div className="flex items-center gap-2.5 border-b border-border pb-4">
            <Server className="h-5 w-5 text-primary" />
            <h3 className="text-base font-black text-foreground">Server Diagnostics</h3>
          </div>
 
          <div className="space-y-4 text-xs font-semibold">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">PHP Version</span>
              <span className="text-foreground font-bold font-mono">{data.system.php_version}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Laravel Framework</span>
              <span className="text-foreground font-bold font-mono">v{data.system.laravel_version}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">HTTP Daemon</span>
              <span className="text-foreground font-bold font-mono truncate max-w-[150px]" title={data.system.server_software}>
                {data.system.server_software}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Host OS Family</span>
              <span className="text-foreground font-bold">{data.system.os}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Server Time</span>
              </span>
              <span className="text-foreground font-bold font-mono">
                {new Date(data.system.server_time).toLocaleTimeString()}
              </span>
            </div>
          </div>
 
          {/* Quick CLI tip */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5 text-[10px] leading-relaxed text-primary font-bold">
            <Terminal className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              All diagnostic parameters represent real-time OS process monitoring fetched dynamically from the Laravel server host.
            </span>
          </div>
        </div>
 
      </div>
 
      {/* Database stats roster overview */}
      <div className="glass-card p-6 border space-y-4 bg-muted/20">
        <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Roster Database Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Users</p>
              <p className="text-sm font-black text-foreground font-mono">{data.records.total_users}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">BTEB Results</p>
              <p className="text-sm font-black text-foreground font-mono">{data.records.total_results.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Admissions</p>
              <p className="text-sm font-black text-foreground font-mono">{data.records.total_admissions}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Notices</p>
              <p className="text-sm font-black text-foreground font-mono">{data.records.total_notices}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
