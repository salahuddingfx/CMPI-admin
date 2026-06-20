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
  Share2,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  ChevronRight
} from "lucide-react";
import { logout } from "../../services/api";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
    { name: "Social Links", path: "/social-links", icon: Share2 },
    { name: "Site Settings", path: "/site-settings", icon: Settings },
  ];

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
          {menuItems.map((item) => {
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 text-secondary-dark font-black">
              {adminUser.name[0].toUpperCase()}
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
              className="rounded-xl border border-border p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 shadow-sm"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            {/* Quick action buttons */}
            <div className="relative">
              <button className="rounded-xl border border-border p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 shadow-sm">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-secondary ring-2 ring-card animate-pulse"></span>
              </button>
            </div>

            {/* Quick Status badge */}
            <div className="hidden md:flex items-center gap-2 border border-primary/20 rounded-xl px-3 py-1.5 bg-primary/5 text-primary text-xs font-bold shadow-sm">
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
