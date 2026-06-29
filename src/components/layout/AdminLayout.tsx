import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BookOpen,
  Users,
  Layers,
  GraduationCap,
  Award,
  FileCheck,
  CalendarClock,
  Share2,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  ChevronRight,
  DollarSign,
  Check,
  Sliders,
  BookMarked,
  Activity,
  Image,
  Cookie,
  ChartBarBig,
  MessageSquare
} from "lucide-react";
import { logout, getNotifications, markAllNotificationsRead, markNotificationRead } from "../../services/api";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  interface NotificationItem {
    id: number;
    title: string;
    description: string;
    type: string;
    is_read: boolean;
    created_at: string;
    updated_at: string;
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("cmpi-admin-theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const userStr = localStorage.getItem("cmpi-admin-user");
  const adminUser = userStr ? JSON.parse(userStr) : { name: "Admin", email: "admin@cmpi.edu.bd" };

  const menuItems: MenuItem[] = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Notices", path: "/notices", icon: FileText },
    { name: "Events Calendar", path: "/events", icon: Calendar },
    { name: "Blogs & News", path: "/blogs", icon: BookOpen },
    { name: "Faculty Directory", path: "/faculty", icon: Users },
    { name: "Departments", path: "/departments", icon: Layers },
    { name: "Admissions Applications", path: "/admissions", icon: GraduationCap },
    { name: "User Management", path: "/users", icon: UserIcon },
    { name: "BTEB Results Board", path: "/results", icon: Award },
    { name: "Institute Results", path: "/institute-results", icon: FileCheck },
    { name: "Subjects", path: "/subjects", icon: BookMarked },
    { name: "Class Routines", path: "/class-routines", icon: CalendarClock },
    { name: "Academic Calendar", path: "/academic-calendar", icon: CalendarClock },
    { name: "Feedback Moderation", path: "/feedbacks", icon: MessageSquare },
    { name: "Desk Messages", path: "/messages", icon: FileText },
    { name: "Bills & Payments", path: "/bills", icon: DollarSign },
    { name: "Reports", path: "/reports", icon: FileText },
    { name: "Social Links", path: "/social-links", icon: Share2 },
    { name: "Gallery", path: "/gallery", icon: Image },
    { name: "Cookie Consents", path: "/cookie-consents", icon: Cookie },
    { name: "Hero Slides", path: "/hero-slides", icon: Sliders },
    { name: "Site Settings", path: "/site-settings", icon: Settings },
    { name: "Analytics", path: "/analytics", icon: ChartBarBig },
    { name: "System Status", path: "/system-status", icon: Activity },
  ];

  const hasMenuPermission = (itemName: string): boolean => {
    const subRole = adminUser.sub_role;
    if (!subRole || subRole === "super_admin") {
      return true;
    }

    switch (subRole) {
      case "academic_editor":
        return ["Dashboard", "Subjects", "Class Routines", "Institute Results", "BTEB Results Board", "Departments", "Academic Calendar"].includes(itemName);
      case "content_manager":
        return ["Dashboard", "Notices", "Events Calendar", "Blogs & News", "Hero Slides", "Social Links", "Gallery", "Cookie Consents", "Academic Calendar", "Feedback Moderation", "Desk Messages"].includes(itemName);
      case "admission_officer":
        return ["Dashboard", "Admissions Applications", "Faculty Directory"].includes(itemName);
      case "accountant":
        return ["Dashboard", "Bills & Payments", "Reports"].includes(itemName);
      default:
        return ["Dashboard"].includes(itemName);
    }
  };

  const handleLogout = async () => {
    if (await window.customConfirm("Are you sure you want to log out?")) {
      await logout();
      navigate("/login");
    }
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header Logo */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src="/CMPI.png" alt="CMPI Logo" className="h-10 w-10 object-contain" />
            <div>
              <span className="text-lg font-black tracking-tight text-foreground block">CMPI Admin</span>
              <span className="text-[10px] text-muted-foreground block -mt-1 uppercase tracking-widest font-extrabold">Control Panel</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          {menuItems.filter((item) => hasMenuPermission(item.name)).map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${active ? "" : "text-muted-foreground group-hover:text-foreground"}`} />
                  <span>{item.name}</span>
                </div>
                {active && <ChevronRight className="h-4 w-4 opacity-80" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Logged In User Info */}
        <div className="border-t border-border p-4 bg-muted/40">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 text-secondary-dark font-black overflow-hidden">
              {adminUser.avatar ? (
                <img src={adminUser.avatar} alt={adminUser.name} className="h-full w-full object-cover" />
              ) : (
                adminUser.name[0].toUpperCase()
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-foreground truncate">{adminUser.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{adminUser.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 hover:border-destructive bg-destructive/5 hover:bg-destructive text-destructive hover:text-white px-4 py-2.5 text-sm font-semibold transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-20 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-border p-2 text-foreground hover:bg-muted lg:hidden shadow-sm"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-base font-extrabold text-foreground tracking-tight">Cox's Bazar Model Polytechnic Institute</h2>
              <p className="text-xs text-muted-foreground font-medium">Official Administrative Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark mode toggle */}
            <button
              onClick={() => {
                document.documentElement.classList.toggle("dark");
                const isDark = document.documentElement.classList.contains("dark");
                localStorage.setItem("cmpi-admin-theme", isDark ? "dark" : "light");
              }}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 shadow-sm"
            >
              <Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            {/* Quick action buttons / Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 shadow-sm"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-card animate-pulse"></span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setNotificationsOpen(false)}
                  />
                  {/* Dropdown Card */}
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-4 shadow-2xl z-40 transition-all">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                          <Bell className="h-8 w-8 opacity-40" />
                          <p className="text-xs font-semibold">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors cursor-pointer ${
                              n.is_read ? "hover:bg-muted/50" : "bg-primary/5 hover:bg-primary/10 border border-primary/10"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className={`text-xs font-extrabold truncate ${n.is_read ? "text-foreground" : "text-primary"}`}>
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                                  {formatTimeAgo(n.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {n.description}
                              </p>
                            </div>
                            {!n.is_read && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n.id);
                                }}
                                className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-primary/20 text-primary shrink-0 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Admin User Profile Bubble */}
            <div className="flex items-center gap-3 pl-3 border-l border-border/80">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm overflow-hidden border border-border animate-fade-in">
                {adminUser.avatar ? (
                  <img src={adminUser.avatar} alt={adminUser.name} className="h-full w-full object-cover" />
                ) : adminUser.name ? (
                  adminUser.name.charAt(0).toUpperCase()
                ) : (
                  "A"
                )}
              </div>
              <div className="hidden sm:block text-left max-w-[120px]">
                <p className="text-xs font-bold text-foreground truncate">{adminUser.name}</p>
                <p className="text-[9px] text-muted-foreground uppercase font-semibold">Admin</p>
              </div>
            </div>

            {/* Quick Status badge */}
            <div className="hidden lg:flex items-center gap-2 border border-primary/20 rounded-xl px-3 py-1.5 bg-primary/5 text-primary text-xs font-bold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
              <span>System Live</span>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Container */}
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
