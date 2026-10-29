# Ratio Web Dashboard 📊🦾

> A modern, MacroFactor-inspired SaaS web application providing analytical visualizations for hypertrophy volume progression, real-time macro allocation tracking, and InBody body composition modeling.

[![React](https://img.shields.io/badge/React-18.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![CoreUI](https://img.shields.io/badge/CoreUI-Free_React-321C72?style=for-the-badge&logo=coreui&logoColor=white)](https://coreui.io/react/)
[![Supabase](https://img.shields.io/badge/Supabase_JS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## 🌐 Live Application
* **Production Web Dashboard:** [https://your-dashboard-domain.com](https://your-dashboard-domain.com)
* **Backend API Repository:** [https://github.com/your-username/fitness-bot-backend](https://github.com/your-username/fitness-bot-backend)

---

## 🎯 Problem & Solution

### The Problem
Most fitness interfaces suffer from fragmented data presentation—isolating workout progress from daily nutritional adherence and structural body composition changes. Furthermore, frontend applications often fail to handle client-side time zones correctly, causing data logged late in the evening to bleed into the following calendar day.

### The Solution
Ratio Web Dashboard provides a single, high-density visualization engine built with React and CoreUI. It synchronizes with Supabase via realtime data fetching polling, provides a local-time-aware date state engine (`Intl.DateTimeFormat` locked to `America/Chicago`), and renders macro progress bars and body composition limb segment analyses in a clean dark-mode UI.

---

## 🎨 Key Features & UI Highlights

* **Time-Zone-Aware Date Filtering:** Client state uses `en-CA` locale formatting locked to `America/Chicago` to prevent UTC date rollovers from distorting evening meal or set logs.
* **MacroFactor-Style Visual Meters:** Proportional macro progress bars tracking real-time daily calories, protein, carbohydrates, and fats against target profile thresholds.
* **Exercise Volume & Progression Charts:** Interactive historical progression graphs displaying load and volume changes across custom training phases.
* **InBody Segmental Lean Visualizer:** Vector human model interface mapping upper and lower extremity lean mass percentages.
* **Optimistic UI Updates & Polling:** Real-time synchronization interval updating exercise tables and food logs directly from Supabase changes every 5 seconds.

---

## 🏗️ Technical Architecture & Data Management

```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard Component                  │
│                                                         │
│  ┌───────────────────┐  ┌────────────────────────────┐  │
│  │ Local Date State  │  │   Selected Exercise State  │  │
│  │ (America/Chicago) │  │  ('Flat Dumbbell Press')   │  │
│  └─────────┬─────────┘  └─────────────┬──────────────┘  │
└────────────┼──────────────────────────┼─────────────────┘
             │                          │
             ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase Web SDK Client                │
│                                                         │
│  • food_logs (gte / lte Day Range Filters)              │
│  • exercise_logs (Historical Load Analytics)            │
│  • user_profiles (Dynamic Macro Target Thresholds)      │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Local Setup Instructions

### Prerequisites
* **Node.js:** `v16.x` or `v18.x`
* **npm:** `v8.x` or higher

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/coreui-free-react-admin-template-cra.git
cd coreui-free-react-admin-template-cra
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_SUPABASE_URL=https://your-supabase-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Run the Development Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.