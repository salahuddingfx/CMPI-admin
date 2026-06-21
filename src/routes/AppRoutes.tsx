import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import { SessionGuard } from "../components/common/SessionGuard";

// Lazy loading pages
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Notices = lazy(() => import("../pages/Notices"));
const Events = lazy(() => import("../pages/Events"));
const Blogs = lazy(() => import("../pages/Blogs"));
const Faculty = lazy(() => import("../pages/Faculty"));
const Departments = lazy(() => import("../pages/Departments"));
const Admissions = lazy(() => import("../pages/Admissions"));
const Users = lazy(() => import("../pages/Users"));
const BtebResults = lazy(() => import("../pages/BtebResults"));
const InstituteResults = lazy(() => import("../pages/InstituteResults"));
const ClassRoutines = lazy(() => import("../pages/ClassRoutines"));
const Bills = lazy(() => import("../pages/Bills"));
const Subjects = lazy(() => import("../pages/Subjects"));
const Reports = lazy(() => import("../pages/Reports"));
const SocialLinks = lazy(() => import("../pages/SocialLinks"));
const SiteSettings = lazy(() => import("../pages/SiteSettings"));
const HeroSlides = lazy(() => import("../pages/HeroSlides"));
const SystemStatus = lazy(() => import("../pages/SystemStatus"));

// Auth Guard Component
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("cmpi-admin-token");
  const userStr = localStorage.getItem("cmpi-admin-user");
  const location = useLocation();

  if (!token || !userStr) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      localStorage.removeItem("cmpi-admin-token");
      localStorage.removeItem("cmpi-admin-user");
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    localStorage.removeItem("cmpi-admin-token");
    localStorage.removeItem("cmpi-admin-user");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading panel...</p>
    </div>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Authenticated Admin Dashboard Routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <SessionGuard>
                <AdminLayout />
              </SessionGuard>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="notices" element={<Notices />} />
          <Route path="events" element={<Events />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="faculty" element={<Faculty />} />
          <Route path="departments" element={<Departments />} />
          <Route path="admissions" element={<Admissions />} />
          <Route path="users" element={<Users />} />
          <Route path="results" element={<BtebResults />} />
          <Route path="institute-results" element={<InstituteResults />} />
          <Route path="class-routines" element={<ClassRoutines />} />
          <Route path="bills" element={<Bills />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="reports" element={<Reports />} />
          <Route path="social-links" element={<SocialLinks />} />
          <Route path="hero-slides" element={<HeroSlides />} />
          <Route path="site-settings" element={<SiteSettings />} />
          <Route path="system-status" element={<SystemStatus />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
