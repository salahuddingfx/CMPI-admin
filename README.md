# ⚙️ CMPI Admin Panel — Staff Management Console

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/License-GPL%20v3-blue?style=for-the-badge" alt="License">
</p>

---

## 🏛️ Overview

The **CMPI Admin Panel** is the primary control deck for administrative staff at the **Cox's Bazar Model Polytechnic Institute**. Developed with React 18, TypeScript, Vite, and styled with a custom Tailwind CSS system, it provides a fast, secure, and interactive interface to manage the CMPI ecosystem.

This application includes custom route guards and dynamic sidebar filters based on fine-grained administrative sub-roles.

---

## ✨ Core Features

*   **🔐 Dynamic Staff RBAC**: UI options and client routes are dynamically locked or unlocked depending on the staff member's `sub_role`:
    *   *Super Admin*: User manager, role manager, full system settings.
    *   *Academic Editor*: Subjects editor, Class Routine manager.
    *   *PR & Content Manager*: Notices CRUD, Event manager, Blogs editor, Hero Slider configuration, Social Links.
    *   *Admissions Officer*: Online student applications review and registration list.
    *   *Financial Accountant*: Student bills, invoicing status, transaction logs.
*   **👥 User Management**: CRUD operations for student and admin accounts, status overrides (pending, active, suspended), and CSV bulk import wizard.
*   **📢 Notices & Events**: Advanced content editor to release institutional announcements, attach PDF files, and setup upcoming campus events with banners.
*   **📑 Admission Tracker**: Visual reviews of submitted student admission forms, search filters, and status toggles.
*   **⚙️ System Configurations**: Unified forms to update institute stats, hero page videos, maps coordinates, contact links, and institutional profiles.

---

## 🛠️ Project Structure

```text
admin/
├── public/                 # Static assets
└── src/
    ├── components/
    │   ├── common/         # Inputs, Buttons, Loaders
    │   ├── features/       # StatCards, charts, tables
    │   └── layout/         # AdminLayout, Navigation links
    ├── pages/
    │   ├── Dashboard.tsx   # Panel analytics overview
    │   ├── Users.tsx       # Staff and student account manager
    │   ├── Notices.tsx     # Announcement publisher
    │   ├── Admissions.tsx  # Admission application tracker
    │   └── ...             # Other module management pages
    ├── routes/
    │   └── AppRoutes.tsx   # React Router tree protected by guards
    └── main.tsx            # App bootstrap point
```

---

## 🚀 Getting Started

### 📋 Prerequisites
*   **Node.js**: `18.x` or higher
*   **Backend Server**: A running [CMPI Backend API](../backend) server.

### ⚙️ Setup & Installation
1.  Navigate to the admin folder:
    ```bash
    cd admin
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Configure environment:
    ```bash
    cp .env.example .env
    ```
    *Ensure `VITE_API_URL` points to your backend instance (e.g. `http://localhost:8000/api/v1`).*
4.  Launch development environment:
    ```bash
    npm run dev
    ```
    The admin console will open on `http://localhost:5174`.

---

## 🛡️ License & Contributing
Licensed under the **GNU General Public License v3.0** (see [LICENSE](LICENSE)). Contributors should verify TypeScript builds with `npx tsc --noEmit` before submitting pull requests (see [CONTRIBUTING.md](CONTRIBUTING.md)).
