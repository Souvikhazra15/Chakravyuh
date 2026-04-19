# 🚀 AI Predictive Maintenance System for Schools

## 📌 Overview

This project is an **AI-powered predictive maintenance system** designed to transform how government school infrastructure is monitored and maintained.

Instead of reacting after failures occur, the system:

* Collects **weekly condition reports**
* Uses **machine learning to predict failures**
* Generates a **prioritized maintenance queue**
* Enables **real-time decision-making**

---

## 🎯 Problem Statement

Gujarat has over **30,000 government school buildings**, many with:

* Broken toilets 🚽
* Faulty electrical systems ⚡
* Structural damage 🏚

Current system:
❌ Reactive
❌ Poor prioritization
❌ Delayed repairs

---

## 💡 Solution

Our system introduces a **data-driven, AI-based workflow**:

```
Peon → Principal → AI Analysis → DEO → Contractor → Completion
```

* Predict failures **30–60 days in advance**
* Prioritize based on **student impact**
* Provide **explainable AI insights**
* Enable **end-to-end maintenance workflow**

---

## 🧠 Key Features

### 🔹 1. Weekly Reporting

* Simple 2-minute form
* Dropdown-based input
* Optional photo upload

---

### 🔹 2. AI-Based Prediction

* Uses trained `.pkl` model
* Generates:

  * Risk Score (0–1)
  * Days to Failure
  * Priority Score

---

### 🔹 3. Priority Calculation

[
\text{Priority Score} = \text{Risk Score} \times \text{Category Weight}
]

| Category   | Weight |
| ---------- | ------ |
| Structural | 5.0    |
| Electrical | 4.5    |
| Classroom  | 4.0    |
| Plumbing   | 3.5    |
| Others     | 2.0    |

---

### 🔹 4. Priority Levels

| Score | Level       |
| ----- | ----------- |
| ≥ 3.5 | 🔴 Critical |
| ≥ 2.5 | 🟠 High     |
| ≥ 1.5 | 🔵 Medium   |
| < 1.5 | 🟢 Low      |

---

### 🔹 5. Explainable AI

* Shows **why an issue is critical**
* Not a black-box system

---

### 🔹 6. Role-Based Dashboards

#### 👷 Peon

* Submit weekly reports
* Upload photos
* Track status

#### 🧑‍🏫 Principal

* Verify submissions
* Run AI analysis
* View school insights

#### 🏢 DEO

* View district-level priority queue
* Assign contractors
* Track work progress

#### 🔧 Contractor

* Receive tasks
* Update status
* Upload completion proof

---

### 🔹 7. AI Chatbot Assistant 🤖

* Query system data:

  * “Top critical issues”
  * “Why is this school critical?”
  * “What should DEO do next?”
* Provides **decision support**

---

## 🏗️ System Architecture

```
Frontend (React)
    ↓
FastAPI Backend
    ↓
ML Model (.pkl)
    ↓
Priority Engine
    ↓
Dashboard + Chatbot
```

---

## ⚙️ Tech Stack

### Frontend

* React.js
* Tailwind CSS

### Backend

* FastAPI
* Python

### Machine Learning

* Scikit-learn / Isolation Forest
* Pandas / NumPy

### Other

* REST APIs
* JWT Authentication (optional)

---

## 🔄 Workflow

1. Peon submits report
2. Principal verifies
3. AI analyzes data
4. DEO prioritizes issues
5. Contractor completes work
6. System updates automatically

---

## 📊 Example Output

```
Total Issues: 67

Critical: 2
High: 8
Medium: 47
Low: 10
```

---

## 🧨 Challenges Solved

* ❌ Static dashboards → ✅ Dynamic AI-driven insights
* ❌ No prioritization → ✅ Smart ranking system
* ❌ Delayed repairs → ✅ Predictive alerts
* ❌ No transparency → ✅ Full workflow tracking

---

## 🚀 Future Improvements

* Dynamic weight learning using ML
* Real-time IoT sensor integration
* Mobile app for field staff
* Advanced anomaly detection

---

## 🎤 Demo Highlights

* End-to-end workflow
* Real-time AI analysis
* Priority-based decision making
* Chatbot for intelligent queries

---

## 🏁 Conclusion

This system transforms maintenance from:

❌ Reactive → ✅ Predictive
❌ Manual → ✅ Intelligent
❌ Delayed → ✅ Proactive

---

## 💬 Final Line

> “A complete closed-loop AI system — from ground-level data to real-world action.”

---

## 👨‍💻 Authors

Team VisionForge 🚀
