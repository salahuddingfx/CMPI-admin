import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  FileText,
  Calendar,
  Award,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  DollarSign
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getDashboardStats, updateAdmissionStatus, getChartData } from "../services/api";

interface StatsState {
  usersCount: number;
  studentsCount: number;
  adminsCount: number;
  admissionsCount: number;
  pendingAdmissionsCount: number;
  noticesCount: number;
  eventsCount: number;
  blogsCount: number;
  facultyCount: number;
  departmentsCount: number;
  recentAdmissions: any[];
  recentNotices: any[];
}

interface ChartData {
  admissions: { month: string; count: number }[];
  notices: { month: string; count: number }[];
  blogs: { month: string; count: number }[];
  studentsByDept: { department: string; count: number }[];
  btebByDept: { department: string; count: number }[];
  btebBySemester: { semester: string; count: number }[];
  billsByStatus: { status: string; count: number; total: number }[];
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-foreground">{label}</p>
      <p className="text-xs font-semibold text-muted-foreground">{payload[0].value} items</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsState | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, charts] = await Promise.all([getDashboardStats(), getChartData()]);
      setStats(statsData);
      setChartData(charts);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch dashboard statistics. Make sure the Laravel server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleAdmissionAction = async (id: number, status: "Approved" | "Rejected") => {
    if (await window.customConfirm(`Are you sure you want to update this applicant status to ${status}?`)) {
      setUpdatingId(id);
      try {
        await updateAdmissionStatus(id, status);
        // Refresh local stats
        await fetchStats();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to update admission status");
      } finally {
        setUpdatingId(null);
      }
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground font-semibold">Loading stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive p-6 font-semibold shadow-sm">
        <p className="mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 rounded-xl bg-destructive hover:bg-destructive-foreground hover:text-destructive text-white border border-transparent hover:border-destructive px-4 py-2 text-sm transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Students",
      value: stats?.studentsCount || 0,
      description: `Total accounts: ${stats?.usersCount || 0}`,
      icon: Users,
      color: "text-primary bg-primary/10 border-primary/20",
    },
    {
      title: "Admissions Applications",
      value: stats?.admissionsCount || 0,
      description: `${stats?.pendingAdmissionsCount || 0} applications pending review`,
      icon: GraduationCap,
      color: "text-secondary-dark bg-secondary/15 border-secondary/20",
    },
    {
      title: "Notices Board",
      value: stats?.noticesCount || 0,
      description: "Published official circulars",
      icon: FileText,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Upcoming Events",
      value: stats?.eventsCount || 0,
      description: "Seminars, workshops, sports",
      icon: Calendar,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground font-semibold">Real-time statistics & administration workspace</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted shadow-sm transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Numerical Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="glass-panel p-6 border transition hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-muted-foreground uppercase tracking-wider">{card.title}</span>
                <div className={`rounded-xl p-2.5 border ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-foreground">{card.value}</span>
                <p className="text-xs font-semibold text-muted-foreground mt-1.5">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      {chartData && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="glass-card p-5 border">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Admissions (12mo)</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.admissions} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="hsl(164, 100%, 21%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card p-5 border">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Notices (12mo)</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.notices} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card p-5 border">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Blogs (12mo)</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.blogs} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="#9333ea" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Additional Analytics Charts */}
      {chartData && chartData.studentsByDept && chartData.studentsByDept.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Students by Department */}
          <div className="glass-card p-5 border">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Students by Department</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.studentsByDept} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="department" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="hsl(164, 100%, 21%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BTEB Results by Department */}
          <div className="glass-card p-5 border">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">BTEB Results by Dept</h3>
            </div>
            <div className="h-48">
              {chartData.btebByDept.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.btebByDept} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="department" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No BTEB data</div>
              )}
            </div>
          </div>

          {/* BTEB Results by Semester */}
          <div className="glass-card p-5 border">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-orange-500" />
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">BTEB by Semester</h3>
            </div>
            <div className="h-48">
              {chartData.btebBySemester.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.btebBySemester} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="semester" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No BTEB data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bill Collection Summary */}
      {chartData && chartData.billsByStatus && chartData.billsByStatus.length > 0 && (
        <div className="glass-card p-5 border">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Bill Collection Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {chartData.billsByStatus.map((bill) => (
              <div key={bill.status} className="rounded-lg border bg-muted/30 p-4 text-center">
                <span className={`text-xs font-bold uppercase ${bill.status === 'paid' ? 'text-green-600' : bill.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'}`}>{bill.status}</span>
                <div className="mt-2 text-xl font-black">{bill.count}</div>
                <div className="text-xs text-muted-foreground">৳{(bill.total || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Recent Admissions + Quick Navigation */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Recent Admissions list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-foreground">Recent Admission Applications</h3>
                <p className="text-xs font-semibold text-muted-foreground">Approve applicants to convert them to students</p>
              </div>
              <Link
                to="/admissions"
                className="flex items-center gap-1 text-xs font-black text-primary hover:text-primary-dark"
              >
                <span>View All</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {stats && stats.recentAdmissions.length === 0 ? (
              <p className="text-sm font-medium text-muted-foreground py-8 text-center bg-muted/30 rounded-xl">
                No recent admission applications found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                      <th className="pb-3 pl-2">Applicant</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {stats?.recentAdmissions.map((adm) => (
                      <tr key={adm.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 pl-2">
                          <div>
                            <p className="font-extrabold text-foreground">{adm.name}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold">{adm.email}</p>
                          </div>
                        </td>
                        <td className="py-3.5 text-muted-foreground font-semibold">{adm.department}</td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              adm.status === "Approved"
                                ? "bg-primary/10 text-primary"
                                : adm.status === "Rejected"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-secondary/15 text-secondary-dark"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                adm.status === "Approved"
                                  ? "bg-primary"
                                  : adm.status === "Rejected"
                                  ? "bg-destructive"
                                  : "bg-secondary-dark"
                              }`}
                            ></span>
                            <span>{adm.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          {adm.status === "Pending" && (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleAdmissionAction(adm.id, "Approved")}
                                disabled={updatingId === adm.id}
                                className="rounded-lg p-1 text-primary hover:bg-primary/10 transition"
                                title="Approve applicant"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleAdmissionAction(adm.id, "Rejected")}
                                disabled={updatingId === adm.id}
                                className="rounded-lg p-1 text-destructive hover:bg-destructive/10 transition"
                                title="Reject applicant"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Links & Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="glass-card p-6 border bg-muted/30">
            <h3 className="text-lg font-black text-foreground mb-4">Quick Administrative Tools</h3>
            <div className="space-y-3">
              <Link
                to="/results"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-emerald-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">Import BTEB Results</h4>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Parse student results PDF sheets</p>
                </div>
              </Link>

              <Link
                to="/notices"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-2 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">Post a New Notice</h4>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Publish exam routines, events or notices</p>
                </div>
              </Link>

              <Link
                to="/users"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="rounded-lg bg-purple-50 border border-purple-100 p-2 text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">Create User Accounts</h4>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Add student profiles manually</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Notice Widget */}
          <div className="glass-card p-6 border">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">Latest Notices</h3>
            <div className="space-y-4">
              {stats?.recentNotices.slice(0, 3).map((notice) => (
                <div key={notice.id} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground line-clamp-1 hover:text-primary">
                      <Link to="/notices">{notice.title}</Link>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-semibold">{notice.date} • {notice.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
