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
const Gallery = lazy(() => import("../pages/Gallery"));
const CookieConsents = lazy(() => import("../pages/CookieConsents"));
const Analytics = lazy(() => import("../pages/Analytics"));
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

// Require Module-level Permission Guard
const RequirePermission = ({ children, module }: { children: React.ReactNode; module: string }) => {
  const userStr = localStorage.getItem("cmpi-admin-user");
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    const subRole = user.sub_role;
    // Super admins (empty sub_role or 'super_admin') have access to everything
    if (!subRole || subRole === "super_admin") {
      return <>{children}</>;
    }

    let isAllowed = false;
    switch (subRole) {
      case "academic_editor":
        isAllowed = ["subjects", "routines", "results", "departments"].includes(module);
        break;
      case "content_manager":
        isAllowed = ["notices", "events", "blogs", "hero_slides", "social_links", "gallery", "cookie_consents"].includes(module);
        break;
      case "admission_officer":
        isAllowed = ["admissions", "faculty"].includes(module);
        break;
      case "accountant":
        isAllowed = ["bills", "reports"].includes(module);
        break;
    }

    if (!isAllowed) {
      // Redirect to Dashboard if they try to access restricted route directly
      return <Navigate to="/" replace />;
    }
  } catch (e) {
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
          <Route path="notices" element={<RequirePermission module="notices"><Notices /></RequirePermission>} />
          <Route path="events" element={<RequirePermission module="events"><Events /></RequirePermission>} />
          <Route path="blogs" element={<RequirePermission module="blogs"><Blogs /></RequirePermission>} />
          <Route path="faculty" element={<RequirePermission module="faculty"><Faculty /></RequirePermission>} />
          <Route path="departments" element={<RequirePermission module="departments"><Departments /></RequirePermission>} />
          <Route path="admissions" element={<RequirePermission module="admissions"><Admissions /></RequirePermission>} />
          <Route path="users" element={<RequirePermission module="users"><Users /></RequirePermission>} />
          <Route path="results" element={<RequirePermission module="results"><BtebResults /></RequirePermission>} />
          <Route path="institute-results" element={<RequirePermission module="results"><InstituteResults /></RequirePermission>} />
          <Route path="class-routines" element={<RequirePermission module="routines"><ClassRoutines /></RequirePermission>} />
          <Route path="bills" element={<RequirePermission module="bills"><Bills /></RequirePermission>} />
          <Route path="subjects" element={<RequirePermission module="subjects"><Subjects /></RequirePermission>} />
          <Route path="reports" element={<RequirePermission module="reports"><Reports /></RequirePermission>} />
          <Route path="social-links" element={<RequirePermission module="social_links"><SocialLinks /></RequirePermission>} />
          <Route path="gallery" element={<RequirePermission module="gallery"><Gallery /></RequirePermission>} />
          <Route path="cookie-consents" element={<RequirePermission module="cookie_consents"><CookieConsents /></RequirePermission>} />
          <Route path="analytics" element={<RequirePermission module="analytics"><Analytics /></RequirePermission>} />
          <Route path="hero-slides" element={<RequirePermission module="hero_slides"><HeroSlides /></RequirePermission>} />
          <Route path="site-settings" element={<RequirePermission module="site_settings"><SiteSettings /></RequirePermission>} />
          <Route path="system-status" element={<RequirePermission module="system_status"><SystemStatus /></RequirePermission>} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
