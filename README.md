# 🤟 SIBI Master: AI-Based Gesture Classification System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-00B4EB?style=for-the-badge)
![scikit-learn](https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white)
![ONNX](https://img.shields.io/badge/ONNX-005CED?style=for-the-badge&logo=onnx&logoColor=white)

## 📌 Overview
SIBI Master is an end-to-end interactive educational gamification platform designed to teach **Sistem Isyarat Bahasa Indonesia (SIBI)**. At its core, the application integrates a robust **Machine Learning** architecture that captures user gestures in real-time via a web camera and provides immediate classification feedback.

This project successfully achieved a **98.92% accuracy rate** and was officially published in the Sinta 4 indexed journal *(Indonesian Journal of Digital Business, April 2026)*.

## 🧠 AI & Machine Learning Architecture
The AI pipeline is engineered for high accuracy and low latency in a web environment:
*   **Feature Extraction:** Utilizes **MediaPipe Hand Tracking** to extract 21 3D hand landmarks (x, y, z coordinates) per frame.
*   **Classification Model:** A **Support Vector Machine (SVM)** algorithm trained with Scikit-learn to classify complex spatial data of sign language alphabets.
*   **Web Deployment:** The trained Python model is exported and optimized using **ONNX Runtime Web**, allowing the heavy ML inference to run entirely on the client-side browser without server lag.

### 🎯 Real-Time Gesture Detection (MediaPipe + SVM in Action)
*(Observe the precise hand landmark mapping and real-time AI classification on the bottom right)*
![AI Detection](documentation/Screenshot%202026-04-23%20121230.png)

## 💻 Software Development & UI/UX
Beyond the AI model, this project is a fully functional web application demonstrating strong frontend capabilities.

### Interactive Dashboard & Gamification
Features an adaptive learning map, streak tracking, and XP accumulation to ensure high user retention.
![Dashboard](documentation/Screenshot%202026-04-23%20120757.png)

### Comprehensive SIBI Dictionary
A visually engaging, custom-built UI component for users to study A-Z hand movements before entering the AI evaluation phase.
![Dictionary](documentation/Screenshot%202026-04-23%20124134.png)

### Session Summary & Analytics
Calculates real-time precision and reaction time to provide dynamic feedback to the user after each stage.
![Summary](documentation/Screenshot%202026-04-23%20122201.png)

## 🛠️ Tech Stack
*   **AI/ML:** Python, MediaPipe, Support Vector Machine (SVM), Scikit-learn, ONNX Runtime Web.
*   **Frontend:** React.js, TypeScript, Vite, Tailwind CSS.
*   **Backend/BaaS:** Firebase Authentication & Firestore (for user progression and leaderboard).

## 🚀 How to Run Locally
1. Clone the repository: `git clone https://github.com/RenoNilams/sibi-game-ai-gesture-classification.git`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open `http://localhost:5173` in your browser.
