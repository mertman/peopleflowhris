# 🌐 PeopleFlow HRIS - System Architecture & Status Overview

> **Note for AI Assistant / Agents**: Read this file at the start of any turn or new conversation session to immediately understand the project architecture, active tech stack, live endpoints, database schema, and recent system updates.

---

## 📍 Live Deployment URLs & Infrastructure

- **Live Web Application**: [https://peopleflow.meeranbreseeg.com](https://peopleflow.meeranbreseeg.com)
- **Production Backend API**: `https://peopleflow-api-4vsk.onrender.com/api`
- **Health Check Endpoint**: `https://peopleflow-api-4vsk.onrender.com/health`
- **GitHub Repository**: `https://github.com/mertman/peopleflowhris.git` (Branch: `main`)
- **Database**: Supabase PostgreSQL (`aws-0-eu-central-1.pooler.supabase.com:5432/postgres`)

---

## 🛠️ Complete Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | High-fidelity UI inspired by SAP SuccessFactors Employee Central (SFEC) & SAP Fiori |
| **Build Tooling & Bundler** | Vite 8 | Fast ESM bundler with production assets in `peopleflow-web/dist` |
| **Styling & Icons** | Tailwind CSS + Lucide Icons | Custom color palette, glassmorphism, responsive modals & slide-overs |
| **Routing & HTTP** | React Router (Hash Router) + Axios | Dynamic hash routing (`/#/login`, `/#/employees`), centralized API interceptors in `utils/api.ts` |
| **Backend API** | Node.js + Express + TypeScript | Modular REST API with JWT authentication middleware (`peopleflow-api/src/server.ts`) |
| **Database & ORM** | Prisma ORM 5 + PostgreSQL | Hosted on Supabase Cloud, managed via `prisma/schema.prisma` |
| **Authentication & Tokens** | JWT (jsonwebtoken) + BcryptJS | 8-hour session tokens, Google OAuth 2.0 Identity Services (GSI), and Mock Demo Tokens |
| **Hosting Platforms** | Render (API) + Web Hosting | API deployed on Render (`peopleflow-api-4vsk.onrender.com`), Web hosted on custom domain |

---

## ⚙️ Core System Architecture & Features

### 1. 🔐 Multi-Tenant Sandbox & Authentication System
- **Google OAuth 2.0 Integration**: Sign in using standard Google accounts.
- **Google-Free Demo Mode**:
  - **1-Click Instant Access**: Generates a guest demo admin (`demo.guest.<id>@peopleflow.demo`) and seeds a full sample HR database instantly.
  - **7 Industry Starter Datasets**: Option to select Global Enterprise (125 employees across NYC, London, Tokyo, Madrid), Tech Company, Healthcare Clinic, Manufacturing Plant, Hospitality Resort, Retail Stores, or Small Business.
  - **Sample Personas**: Quick login as John Doe (HR Admin), Jane Smith (Manager), or custom user profiles.
- **System Creator Permanent Workspace**: Dedicated admin environment for `meeranbreseeg@gmail.com` (`tenantId: "system-creator"`).
- **Self-Healing Sandboxes**: Automatically cleans up and re-seeds expired or incomplete multi-tenant databases.

### 2. 👥 Employee Central (SFEC Core HR Master Data)
- **Entity Models**: `Employee`, `PersonalInfo`, `JobInfo`, `JobHistory`, `Position`, `WorkflowRequest`, `AutomationLog`.
- **Effective-Dated Job History**: Tracks historical audit trails for promotions, transfers, and salary revisions.
- **Decoupled Position Management**: Manages corporate positions (`POS-<code-id>`) independently of incumbents, automatically setting positions to **Vacant** when staff exit.
- **Interactive Hierarchy Org Chart**: Traverses supervisor/manager relationships to render a live organizational hierarchy tree.

### 3. 🛡️ Security, RBP & Impersonation ("Proxy As")
- **Role-Based Permissions (RBP)**: Enforces access controls across `System Creator`, `Superadmin`, `Administrator`, `Manager`, and `Employee`.
- **User Impersonation (Proxy Session)**: Superadmins can "Proxy As" any employee to experience the system from their permission context. Supports seamless revert to original admin session (`POST /api/auth/exit-proxy`).
- **SFEC Learning Mode**: Toggleable interface overlay explaining SAP SuccessFactors concepts (RBP, Propagation Rules, MDF Objects) inline.

### 4. 🤖 Workflows & Integration Center (n8n Webhooks)
- **Staged MDF Workflows**: Sensitive adjustments (e.g. salary revisions >15% or over $70k) are held in an approval queue with side-by-side comparative diff cards (Old Value vs. Proposed Value).
- **Automation & Integration Center**: Live dashboard showing n8n integration paths, webhook endpoints, candidate onboarding contracts, DocuSign signature simulation, and real-time execution logs.

---

## 📝 Recent Change Log (Last 3 System Updates)

### 🟢 Change 1: Google-Free Demo Sandbox Login & Production API Routing Fix (July 2026)
- **What Was Done**:
  1. Built zero-friction Demo Sandbox options on `Login.tsx`: Added **"Try Live Demo (1-Click Instant Access)"**, **"Choose Industry"**, and **"Sample Account"**.
  2. Fixed fresh browser React state timing issue: Implemented automatic fallback mock token generation (`credToUse`, `emailToUse`) so guest logins never fail due to empty state.
  3. Fixed production API URL resolution in `utils/api.ts`: Updated default production fallback to point directly to live Render backend (`https://peopleflow-api-4vsk.onrender.com/api`), resolving HTTP 404 cross-origin/proxy errors.
  4. Updated backend `POST /api/auth/register-google` in `auth.routes.ts` to automatically generate mock credentials for demo requests.
- **Impact**: Anyone visiting `peopleflow.meeranbreseeg.com` from any device (Mac, Windows, Mobile) can instantly explore the system with full dummy data without a Google account.

---

### 🟢 Change 2: User Impersonation ("Proxy As") & System Creator Console (July 2026)
- **What Was Done**:
  1. Created backend proxy endpoints (`POST /api/auth/proxy` and `POST /api/auth/exit-proxy`) to issue proxy JWT tokens containing `originalUser` session context.
  2. Implemented "Proxy As" selector in top Header dropdown and Sidebar allowing admins to view the app as any staff member.
  3. Reserved permanent tenant workspace (`system-creator`) for `meeranbreseeg@gmail.com`.
  4. Integrated global floating Feedback Widget and Google Tag Manager (GTM) analytics script (`G-N60EELCWRM`).
- **Impact**: Superadmins can test RBP permissions from any employee perspective and revert back with 1 click.

---

### 🟢 Change 3: 7 Industry Starter Dataset Sandboxes & SFEC Learning Mode (July 2026)
- **What Was Done**:
  1. Developed `seedSandboxTemplate` utility in `starterTemplates.ts` supporting 7 industry dataset configurations (Global Enterprise with 125 employees across 6 global hubs, Tech Company, Healthcare Clinic, Manufacturing Plant, Hospitality Resort, Retail Stores, Small Business).
  2. Added dynamic department, position, workflow, and supervisor/manager tree generators for realistic HR testing.
  3. Added interactive SFEC Learning Mode toggle in top Header to highlight SAP SuccessFactors architectural concepts inline.
- **Impact**: Provides instant realistic HR enterprise datasets tailored to different business sectors.

---

## 📌 How to Start & Develop Locally

### 1. Install Dependencies
```bash
# In the repository root
npm run install:all
```

### 2. Start Servers
- **Backend API (Port 5000)**:
  ```bash
  cd peopleflow-api
  npm run dev
  ```
- **Web App (Port 5173)**:
  ```bash
  cd peopleflow-web
  npm run dev
  ```

### 3. Deploying Updates to Live Production
```bash
git add .
git commit -m "Your commit message"
git push origin main
```
- **Render** automatically rebuilds and deploys the Node API server at `https://peopleflow-api-4vsk.onrender.com/api`.
- The Web App builds with `npm run build` in `peopleflow-web/dist`.
