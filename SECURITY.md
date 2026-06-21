# 🛡️ Security Policy

We take security issues extremely seriously at **CMPI Admin**. We are committed to protecting user and institutional data for the **Cox's Bazar Model Polytechnic Institute** platform. This document outlines our supported versions, reporting procedures, and standard response cycles.

---

## Supported Versions

Only the latest major version of CMPI is actively supported with security updates. We strongly advise all institutional deployments to remain on the latest releases.

| Version | Supported | Notes |
| :--- | :--- | :--- |
| **v2.x (Latest)** | ✅ Yes | Active development and support. |
| **v1.x** | ❌ No | Deprecated. Please upgrade to v2.x. |

---

## 📢 Reporting a Security Vulnerability

If you discover a security vulnerability within the CMPI Admin project, please do **NOT** open a public issue or draft a public pull request. Doing so exposes the system to exploitation before a patch can be deployed.

Instead, please report security vulnerabilities directly to the Lead Developer:
*   **Contact Name**: Salah Uddin Kader
*   **Email**: **salahuddin.dev@gmail.com**
*   **Email Subject**: `[SECURITY VULNERABILITY] CMPI Admin Security Report`

### What to Include in the Report
To help us triage and resolve the issue quickly, please include:
1.  **Vulnerability Type**: (e.g., SQL Injection, CSRF, XSS, RBAC Bypass, Privilege Escalation).
2.  **Affected Component**: (e.g., Navigation menus, Router guards, token storage handlers).
3.  **Proof of Concept (PoC)**: Step-by-step instructions to reproduce the issue, including request payloads, screen captures, or code snippets.
4.  **Impact Analysis**: What data or assets could be accessed or compromised.

---

## ⏳ Our Security Process & Timeline

Once a report is submitted, we follow this coordinated disclosure schedule:
1.  **Acknowledgement (Within 48 hours)**: We will confirm receipt of your report, verify the details, and assign a severity tier.
2.  **Triage & Resolution (Within 7-10 days)**: We will work on a patch in a private branch. We may contact you for further details or verification.
3.  **Deployment & Disclosure (Within 14 days)**: A patch release will be pushed to the main repository. We will credit you in the release notes unless you prefer to remain anonymous.

---

## ⚙️ Security Guidelines for Deployments

If you are hosting CMPI Admin:
*   Ensure that browser cookies or storage variables holding auth tokens are marked secure when deployed to production.
*   Enforce HTTPS on all requests to protect Sanctum auth credentials.
