<div align="center">
  <h1>📚 Study Tracker 3.O</h1>
  <p>
    <strong>A high-performance, beautifully designed academic and habit-tracking dashboard.</strong>
  </p>
  <p>
    <a href="https://tracker-3-o.vercel.app/">View Live Web App</a>
    ·
    <a href="#-android-app">Download Android App</a>
    ·
    <a href="https://github.com/rupamkgp/tracker-3.O/issues">Report Bug</a>
  </p>
  
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
  ![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
  ![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black)
  ![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
</div>

<br />

## 🌟 Overview

Study Tracker 3.O is a comprehensive dashboard engineered to track daily study goals, manage academic and technical subjects, generate automated study plans, and provide detailed curriculum roadmaps for software engineering and quantitative finance.

It features a premium, responsive glassmorphism design with a full authentication flow and a dedicated backend database.

## ✨ Key Features

* **Daily Target Tracking:** Set minute-by-minute study goals and track your completion status with a dynamic progress bar and visual Daily Score.
* **Automated Planning:** Select a subject, date range, and daily target, and the app automatically generates scheduled tasks.
* **Weekly Timetable:** Configure your recurring college classes or commitments.
* **Weekly Review:** Automatically aggregates your study hours, outputs, and performance metrics over a rolling 7-day window.
* **Curriculum Roadmaps:** Fully documented, interactive syllabuses integrated directly into the platform (DSA, System Design, AI Engineering, Quant Trading, etc).
* **Cross-Platform:** Available as a responsive Web Application and a native Android App.

## 🛠️ Tech Stack

### Frontend
* **React 19 & Vite** for rapid rendering and state management.
* **Vanilla CSS** with glassmorphism aesthetics, CSS Grid, and Flexbox.
* **Lucide React** for modern iconography.

### Backend & Database
* **Express.js & Serverless** hosted on Vercel.
* **Neon Serverless Postgres** for a globally distributed, autoscaling database.
* **Neon Auth** (Better Auth) for secure user authentication and sessions.

### Mobile
* **Capacitor** to compile the web experience into a performant, native Android application.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
* Node.js (v18+)
* A Neon account and project for database/auth integration.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rupamkgp/tracker-3.O.git
   cd tracker-3.O
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Neon credentials:
   ```env
   DATABASE_URL="postgres://..."
   VITE_NEON_AUTH_BASE_URL="https://..."
   BETTER_AUTH_SECRET="your-secret"
   BETTER_AUTH_URL="http://localhost:5173"
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:5173`*

---

## 📱 Android App

The project has been converted into a native Android app using Capacitor. 

### Testing on your Phone
You don't need to build it yourself! A GitHub Action automatically compiles the APK on every push.
1. Go to the [GitHub Actions Tab](https://github.com/rupamkgp/tracker-3.O/actions).
2. Click on the latest successful `Build Android APK` run.
3. Download the **StudyTracker-Debug.apk** from the Artifacts section.
4. Transfer it to your Android device and install it.

### Building Locally (Requires Android Studio)
If you wish to build the Android app locally:
```bash
# Build the production web assets
npm run build

# Sync the assets to the native Android project
npx cap sync android

# Open Android Studio to compile the APK
npx cap open android
```

---

## 🎨 Design Philosophy
The UI relies heavily on modern aesthetics, utilizing deep space/dark-mode color palettes with vibrant indigo, emerald, and pink accents. Micro-animations and hover effects bring the dashboard to life, ensuring seamless usability across desktop, tablet, and mobile devices.

<div align="center">
  <sub>Built with ❤️ by Rupam Haldar</sub>
</div>
