# PeopleFlow - AI-Powered HR Operations Platform

PeopleFlow is an advanced Human Resource Information System (HRIS) inspired by the core data structures and concepts of **SAP SuccessFactors Employee Central (SFEC)**.

This repository serves as a portfolio showcase demonstrating deep functional knowledge of enterprise HR master data management, role-based permissions (RBP), effective dating, position management, staged workflow approvals, and n8n webhooks automation.

---

## 🚀 Sprint Features Overview

### 🏁 Sprint 1: Foundation (Core HR IS)
- **Vite + React 19 + TypeScript Frontend**: A high-fidelity, premium interface matching modern enterprise styles (combining SAP Fiori and Workday aesthetics).
- **Express API + Prisma ORM Backend**: Node.js REST API with automated routing, middleware, and database validation.
- **Employee Central Data Models**: Mapped `Employee`, `PersonalInfo`, `JobInfo`, and `JobHistory` relationships.
- **SFEC Learning Mode**: A toggleable visual simulator mode explaining SFEC configuration concepts (RBP, Propagation, MDF Object Models) inline.
- **Quick Demo Login**: One-click authentication as **HR Administrator** (Sarah Connor), **Manager** (John Smith), or **Employee** (Emily Watson).

### ⚡ Sprint 2: Position Management & Staged Workflows
- **MDF Position Management**: Decoupled corporate positions (`Position` model) from individual employee records. Tracks position codes, departments, and locations, highlighting **Vacant** nodes.
- **Workflow Approvals Engine**: Diverts sensitive adjustments (e.g. salary changes >15% or above $70k) into a `WorkflowRequest` approval queue.
- **Interactive Comparative Diff**: Displays proposed changes side-by-side (Old vs. New value cards) for Manager and HR sign-off.
- **Dynamic Hierarchy Org Chart**: Renders a live reporting structure tree of the organization by traversing active database supervisor links.
- **Compliance Business Rules**: Real-time evaluation triggers (e.g., auto-assigning 180-day probation for Madrid-based employees).

### 🤖 Sprint 3: Automation Layer & n8n Integration
- **n8n Automation Center**: Visual dashboard detailing integration node paths, webhooks configuration, and mock API schemas.
- **Live Logs Terminal**: A dark-theme console rendering integration steps (DocuSign signings, Google Drive folder provisioning, Google Calendar scheduling, and Slack alerts) in real-time.
- **Mock DocuSign signature flow**: Profiles pending signature display an overlay candidate agreement contract. Clicking "Sign" triggers webhook callbacks to complete candidate onboarding.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios, React Router.
- **Backend**: Node.js, Express, TypeScript, JWT (jsonwebtoken), BcryptJS.
- **Database**: Prisma ORM, SQLite.

---

## ⚙️ Quick Start

Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Install Dependencies
Run the installation script from the root folder:
```bash
# In the root folder of the project
npm run install:all
```

### 2. Set Up Database & Seed Data
Initialize database migrations and seed corporate profiles, positions, and pending workflow requests:
```bash
cd peopleflow-api
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 3. Start Development Servers
Run the backend and frontend in separate terminals:
- **API Server** (Port 5000):
  ```bash
  npm run dev:api
  ```
- **Web App** (Port 5173):
  ```bash
  npm run dev:web
  ```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 💡 Employee Central Concepts Showcased

### 1. Effective-Dated Job History
Updates to key fields (like promotions or department transfers) append a new row to `JobHistory` with an effective date, preserving historical audit trails.

### 2. Role-Based Permissions (RBP)
System permissions align with authentication roles:
- **Administrator**: Full CRUD and master data purge permissions.
- **HR Specialist**: Access to add new hires, terminate records, and edit details.
- **Manager**: View permissions for team members, with specific HR actions blocked.
- **Employee**: Self-service profile viewing with sensitive fields (like salary) masked.

### 3. Decoupled Position Objects
Hiring involves assigning staff to pre-existing corporate positions. When an employee leaves, the position reverts to **Vacant**, ready for succession planning.

### 4. MDF Workflow Approvals
Transactions matching specific parameters (like salary thresholds) are staged in a database queue and require multi-stage approval (Manager ➔ HR) before modifying active records.
