# 🧱 Block-Drop: Infinite Merge

<div align="center">

<img src="public/logo.png" width="180" alt="Block-Drop Logo" />

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black&style=for-the-badge)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vite.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.2-38B2AC?logo=tailwindcss&logoColor=white&style=for-the-badge)](https://tailwindcss.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.1-119EFF?logo=capacitor&logoColor=white&style=for-the-badge)](https://capacitorjs.com/)

**The ultimate infinite puzzle experience. Merge, Grow, and Conquer the Grid.**

[Guida Android](README_ANDROID.md) •
[Segnala Bug](https://github.com/KekkoCoppola/Block-Drop/issues)

</div>

---

## ✨ Overview

**Block-Drop** is a high-performance, cross-platform puzzle game where strategy
meets fluid animations. Built with **React 19** and **Capacitor**, it delivers
a premium native feel on both web and mobile devices.

### 🎯 Key Features

* **🕹️ Intuitive Gameplay**: Smooth drag-and-drop mechanics with precision
  column snapping.
* **⛓️ Chain Combos**: Advanced recursive merge logic with visual "hit-stop"
  effects for satisfying combos.
* **📳 Haptic Feedback**: Fully integrated vibration patterns for every drop
  and merge (iOS/Android).
* **💾 Auto-Save**: Seamless persistence of your high score and grid state via
  LocalStorage.
* **🎨 Glassmorphism UI**: A stunning dark-mode aesthetic with vibrant
  high-saturation blocks.

---

## 🛠️ Tech Stack

| Core | Styles & Motion | Mobile Native |
| :--- | :--- | :--- |
| **React 19** | **Tailwind CSS 4** | **Capacitor 8** |
| **Vite 6** | **Framer Motion 12** | **Native Haptics** |
| **TypeScript 5.8** | **Lucide Icons** | **Safe Area Support** |

---

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18 or higher)
*   **npm** or **pnpm**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/KekkoCoppola/Block-Drop.git
   cd Block-Drop
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Launch the development server**

   ```bash
   npm run dev
   ```

   *The app will be available at `http://localhost:5173`*

---

## 🧠 Architecture Insights

The application follows a **Hook-Centric Architecture**:

* **`useGameLogic.ts`**: The brain of the game. Handles the recursive merge
  algorithm, gravity simulation, and score calculation.
* **`soundManager.ts`**: A dedicated utility for Web Audio and Capacitor
  Haptics synchronization.
* **Component Composition**: Atomic UI components styled with Tailwind 4 and
  animated with Framer Motion Layout IDs.

---

## 📱 Mobile Deployment

This project uses **Capacitor** to target Android. Detailed instructions for
building the APK can be found in the [Guida Android](README_ANDROID.md).

```bash
# Sync web changes to native project
npm run cap:sync

# Open in Android Studio
npm run cap:open
```

---

Made with ❤️ by KekkoCoppola
