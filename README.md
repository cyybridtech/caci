# Christ Apostolic Church International (CACI) - Church Management System

An enterprise-grade, full-stack Church Management & Attendance Platform purpose-built for **Christ Apostolic Church International (CACI)**. Designed for church media personnel, pastors, and church administrators to streamline attendance check-ins, member profiling, financial contributions, visitor assimilation, SMS broadcasting, and executive attendance analytics.

---

## 🌟 Key Features

### 1. ⚡ High-Speed Media Desk Check-In Kiosk
- **Instant Search**: Search members in real time by Full Name, Phone Number, or Member ID (e.g., `CACI-001`).
- **One-Click Check-In**: Check in members with visual feedback and audio confirmation.
- **Group 1 & Group 2 Segmentation**: Color-coded badges (**Group 1** in Blue, **Group 2** in Purple) with instant filters and live turnout progress bars.
- **Real-Time Headcount**: Live metrics tracking Total Present, Group 1 attendees, Group 2 attendees, and overall attendance percentage.
- **Live Stream Feed**: Activity stream showing recent check-ins with timestamps and one-click undo capability.
- **Service Date Selector**: Select and audit any service date across the calendar.

### 2. 👥 Comprehensive Members Directory & Profiling
- **Rich Congregant Profiles**:
  - Profile photos with fallback avatar initials
  - **Gender** (`Male`, `Female`, `Other`)
  - **Marital Status** (`Single`, `Married`, `Widowed`, `Divorced`)
  - **Date of Birth (DOB)** and age calculations
  - **Hometown**, **Residential Address**, and **Emergency Contacts**
  - **Group 1 / Group 2** assignment and church role
- **Interactive Profile Drawer**: View full member details, attendance history, financial summary, and edit records seamlessly.
- **Add New Member Modal**: Comprehensive registration form capturing all relevant pastoral details.

### 3. 📲 Vynfy SMS Broadcast Dispatcher & Multi-Channel Messaging
- **Live Vynfy SMS Gateway Integration**: Powered by the Vynfy SMS API with automatic Ghana phone number internationalization (`+233`).
- **Audience Targeting Options**:
  - **All Registered Members**
  - **Group 1 Members Only**
  - **Group 2 Members Only**
  - **Attendees Present Today**
  - **Absentees (Missed Today's Service)**
  - **Specific Selected Members** (interactive member selector with search and quick filter chips)
- **SMS Metering**: Live character counter and SMS unit cost estimator.
- **Multi-Channel**: Supports direct Vynfy SMS delivery and instant WhatsApp (`wa.me`) click-to-chat links.
- **Recent Broadcast History**: Live dispatch logs showing delivery status, channel, recipient counts, and timestamps.

### 4. 📊 Executive Pastoral Analytics & Attendance Trends
- **Weekly & Monthly Turnout Visualizer**: Dual-bar comparison charts displaying Group 1 vs. Group 2 attendance over 8-week and 6-month timeframes.
- **Performance Comparison Tables**: Turnout rates, Group 1/2 distribution breakdown, and average service attendance.
- **Consecutive Absentee Alerts**: Flags members who missed recent services for proactive pastoral visitation and follow-up.

### 5. 💰 Church Financial Management (Ghana Cedis - GH₵)
- **Contribution Tracking**: Record **Tithes**, **Sunday Offerings**, **Welfare Dues**, **Thanksgiving Seeds**, and **Building Projects**.
- **Group Comparison**: Financial breakdown comparing contributions between Group 1 and Group 2.
- **Transaction Dates & Search**: Audit transactions by date, payment method, category, and member.
- **Printable Receipts**: Generate official branded contribution receipts with unique receipt numbers.

### 6. 🤝 First-Timer & Visitor Assimilation Pipeline
- **Kanban Follow-Up Board**: 4-stage assimilation pipeline:
  1. *First Sunday Visit*
  2. *Welcome Call Made*
  3. *Home / Pastoral Visit*
  4. *Integrated into Group 1 or Group 2*
- Quick WhatsApp links with personalized pre-filled welcome messages.

### 7. 🛡️ Official CACI Service Types
- **Sunday Divine Worship Service**
- **Midweek Teaching & Prayer Service**
- **Friday Prayer Night**
- **Special Convention Service**

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Canvas Confetti
- **Backend**: Node.js (v24), Express, TypeScript, Prisma ORM
- **Database**: MySQL (`caci_church_db`)
- **SMS Gateway**: Vynfy SMS API (`https://api.vynfy.com/v1/sms/send`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node 24 recommended)
- MySQL Server (running on `localhost:3306`)

### 1. Database Setup
Ensure MySQL is running and create the database if not already created:
```sql
CREATE DATABASE IF NOT EXISTS caci_church_db;
```

### 2. Backend Setup
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run seed     # (Optional: seeds sample members, services, and transactions)
npm run dev      # Runs API server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev      # Runs Vite dev server on http://localhost:5173
```

### 4. Environment Variables
Create `server/.env`:
```env
PORT=5000
DATABASE_URL="mysql://root:password@localhost:3306/caci_church_db"
VYNFY_API_KEY="a5a9ec5fb9c6612a0df7f953b53f4507"
VYNFY_SENDER_ID="CACI"
```

---

## 📱 Offline-First PWA Support
The platform is Progressive Web App (PWA) ready and can be installed directly onto desktop and mobile devices for uninterrupted operation even during intermittent network connectivity.

---

## 📜 License
Private & Proprietary - Christ Apostolic Church International (CACI).
