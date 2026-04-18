# Dashboard Features & Use Cases

## Overview

Four role-based dashboards for the AI Predictive Maintenance System:

```
┌─────────────────────────────────────────────────────────┐
│         AI Predictive Maintenance System                 │
│              (Chakravyuh)                                │
├─────────────────────────────────────────────────────────┤
│  Peon/Watchman  │  Principal  │  DEO  │  Contractor     │
│   (Data Input)  │ (Approval)  │(Dist) │  (Execution)    │
└─────────────────────────────────────────────────────────┘
```

---

## 1. PEON / WATCHMAN DASHBOARD

**Purpose**: Submit weekly facility condition reports

### Use Case
- School watchman/peon inspects facility weekly
- Reports condition of different areas
- Provides input for ML pipeline

### Key Features
```
┌─────────────────────────────────┐
│  Weekly Facility Report Form     │
├─────────────────────────────────┤
│ Category: [Dropdown]            │
│   • Plumbing                    │
│   • Electrical                  │
│   • Structural                  │
│   • Classroom                   │
│   • Toilet                      │
│                                 │
│ Condition: [Dropdown]           │
│   • Good                        │
│   • Minor Issue                 │
│   • Major Issue                 │
│                                 │
│ Notes: [Text Area]              │
│ (Describe issues...)            │
│                                 │
│ [Upload Photo] (Optional)       │
│                                 │
│ [Submit Report] ← 2 min workflow│
└─────────────────────────────────┘
```

### User Flow
```
Peon Login
    ↓
Enter Weekly Report
    ├─ Category: Plumbing
    ├─ Condition: Major Issue
    ├─ Notes: Water leak in hallway
    └─ (Optional) Photo
    ↓
Submit → Backend Processing
    ├─ Data validation
    ├─ Stored in database
    └─ Triggers ML pipeline
    ↓
Confirmation Message
```

### API Call
```javascript
POST /api/v1/reports/submit
{
  school_id,
  category,
  condition,
  notes,
  submitted_by
}
```

---

## 2. PRINCIPAL DASHBOARD

**Purpose**: View school status and approve urgent repairs

### Use Case
- Principal monitors school infrastructure
- Views risk assessment and priority queue
- Approves repairs that affect students

### Key Features

#### A. Summary Cards
```
┌──────────────────────────────────────┐
│  Total Issues: 8  │ Critical: 2 │ Resolved: 65% │
└──────────────────────────────────────┘
```

#### B. Issues Table
```
┌─────────────────────────────────────────────────────────┐
│ Category │ Condition   │ Risk │ Priority │ Days │ Action │
├─────────────────────────────────────────────────────────┤
│ Toilets  │ Major Issue │ 0.85 │ Critical │ 15   │Approve │
│ Plumbing │ Minor Issue │ 0.65 │ High     │ 20   │Approve │
│ Electrical│Minor Issue │ 0.45 │ Medium   │ 30   │Approve │
│ Classroom│ Good        │ 0.20 │ Low      │ 60   │Approve │
└─────────────────────────────────────────────────────────┘
```

### User Flow
```
Principal Login
    ↓
View School Dashboard
    ├─ See summary stats
    ├─ See all issues in table
    └─ Color-coded by priority
    ↓
Select Issue
    ├─ Click "Approve" button
    └─ Creates work order
    ↓
Work Order sent to DEO
    └─ For contractor assignment
```

### API Calls
```javascript
// Fetch issues
GET /api/v1/school/issues

// Approve repair
POST /api/v1/principal/approve-repair
{
  issue_id,
  approved_by
}
```

---

## 3. DEO DASHBOARD (★ MOST IMPORTANT)

**Purpose**: District-wide maintenance queue prioritization

### Use Case
- DEO sees all schools in district
- Prioritized by AI ML model
- Assigns contractors efficiently
- Focuses on critical issues first
- Resource optimization

### Key Features

#### A. District Statistics
```
┌────────────────┬─────────────┬──────────┬────────┐
│ Total: 45      │ Critical: 5 │ High: 12 │Med: 18 │
└────────────────┴─────────────┴──────────┴────────┘
   (Red)            (Yellow)     (Blue)      (Green)
```

#### B. Prioritized Queue (Main Feature)
```
┌──────────────────────────────────────────────────────────────┐
│ CRITICAL (Red) - Needs Immediate Action (< 30 days)         │
├──────────────────────────────────────────────────────────────┤
│ School_001 │ Girls Toilet   │ 3.75 │ 15 days │ [Assign]     │
│ School_005 │ Structural     │ 3.60 │ 18 days │ [Assign]     │
├──────────────────────────────────────────────────────────────┤
│ HIGH (Yellow) - Schedule Within 1 Week                       │
├──────────────────────────────────────────────────────────────┤
│ School_002 │ Electrical     │ 2.93 │ 20 days │ [Assign]     │
│ School_007 │ Plumbing       │ 2.75 │ 22 days │ [Assign]     │
├──────────────────────────────────────────────────────────────┤
│ MEDIUM (Blue) - Schedule Within 1 Month                      │
├──────────────────────────────────────────────────────────────┤
│ School_003 │ Classroom      │ 1.85 │ 35 days │ [Assign]     │
└──────────────────────────────────────────────────────────────┘
```

#### C. Sorting Options
- Sort by Priority (default)
- Sort by School
- Sort by Days to Failure

### Priority Calculation (Backend)
```
Priority Score = Risk Score × Impact Weight

Impact Weights:
  • Girls' Toilet: 5.0 (highest)
  • Structural: 5.0 (highest)
  • Electrical: 4.5
  • Classroom: 4.0
  • Plumbing: 3.5
  • Other: 2.0

Thresholds:
  • Critical: ≥ 3.5
  • High: ≥ 2.5
  • Medium: ≥ 1.5
  • Low: < 1.5
```

### User Flow
```
DEO Login
    ↓
View District Queue
    ├─ Sorted by priority automatically
    ├─ Color-coded by urgency
    └─ Stats dashboard at top
    ↓
Select Issue (Click Row)
    ↓
Click [Assign] Button
    ├─ Select Contractor from list
    └─ Set deadline
    ↓
Work Order Created
    └─ Sent to Contractor Dashboard
    ↓
Track Progress
    └─ Status updates in real-time
```

### API Calls
```javascript
// Fetch priority queue
GET /api/v1/deo/queue
→ Returns sorted by priority

// Assign contractor
POST /api/v1/deo/assign-contractor
{
  queue_id,
  contractor_id,
  assigned_by
}
```

### Why This Dashboard is Most Important
1. **District-Wide Visibility**: Sees all schools at once
2. **AI-Powered Prioritization**: Uses ML model scores
3. **Resource Allocation**: Matches work to contractors
4. **Risk Mitigation**: Critical issues get attention first
5. **Data-Driven Decisions**: Objective priority scores
6. **Accountability**: Track who assigned what

---

## 4. CONTRACTOR DASHBOARD

**Purpose**: Manage assigned work and complete jobs

### Use Case
- Contractor receives work assignments
- Manages work queue
- Updates progress
- Documents completion with photos & GPS

### Key Features

#### A. Statistics
```
┌────────────────┬─────────────────┬────────────┐
│ Total: 12      │ In Progress: 4  │ Completed: 8 │
└────────────────┴─────────────────┴────────────┘
```

#### B. Work Orders List
```
┌─────────────────────────────────────────────────┐
│ SCHOOL_001 - Girls Toilet                       │
│ Status: [Pending] [In Progress] [Completed]     │
│ Priority: Critical                              │
│ Issue: Structural damage in facility            │
├─────────────────────────────────────────────────┤
│ SCHOOL_002 - Electrical                         │
│ Status: [In Progress]                           │
│ Priority: High                                  │
│ Issue: Faulty wiring in classroom               │
└─────────────────────────────────────────────────┘
```

#### C. Completion Form (Side Panel)
```
┌──────────────────────────────┐
│ Complete Work Order          │
├──────────────────────────────┤
│ School: SCHOOL_001           │
│ Category: Girls Toilet       │
│                              │
│ Work Notes:                  │
│ [Replaced broken pipe...]    │
│                              │
│ Photo Evidence:              │
│ [Upload Photo]               │
│                              │
│ GPS Location:                │
│ [Get Current Location]       │
│ Lat: 40.7128                 │
│ Lon: -74.0060                │
│                              │
│ [Mark as Completed]          │
└──────────────────────────────┘
```

### User Flow
```
Contractor Login
    ↓
View Work Orders
    ├─ All assigned work shown
    ├─ Color by status
    └─ Details on click
    ↓
Select Work Order
    ↓
Go to Site
    ├─ Location coordinates provided
    └─ Issue description shown
    ↓
Complete Work
    ├─ Add notes about repairs
    ├─ Upload before/after photos
    └─ Capture GPS location
    ↓
Submit Completion
    ↓
Status Updates to DEO
    └─ Principal notified
```

### API Calls
```javascript
// Fetch work orders
GET /api/v1/contractor/work-orders

// Complete work
POST /api/v1/contractor/complete-work
FormData:
  - work_order_id
  - contractor_id
  - notes
  - photo (file)
  - latitude
  - longitude
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Peon/Watchman                            │
│                  (Weekly Report)                            │
│                        ↓                                    │
│                   Reports Table                             │
│                        ↓                                    │
│              ML Pipeline Processing                         │
│           (Z-Score + Isolation Forest)                      │
│                        ↓                                    │
│            Risk Score + Priority Calculation                │
│                        ↓                                    │
│                   Priority Queue                            │
│                        ↓                                    │
├─────────────────────────────────────────────────────────────┤
│  Principal           →   DEO            →   Contractor     │
│  Approves                Prioritizes        Executes        │
│  Repairs              & Assigns             Completion      │
└─────────────────────────────────────────────────────────────┘
```

---

## Real-World Scenarios

### Scenario 1: Critical Safety Issue
```
Peon Reports: Girls' Toilet - Structural Damage
    ↓
ML Model: Risk Score = 0.85 (Very High)
    ↓
Priority Calculation: 0.85 × 5.0 = 4.25 (Critical)
    ↓
DEO Dashboard: Issue appears at TOP in RED
    ↓
DEO: "This is critical! Assign to Contractor A"
    ↓
Contractor A: Receives urgent work order
    ↓
Completes with photos and GPS
    ↓
Status updates to Principal
    ↓
School is safe again
```

### Scenario 2: Routine Maintenance
```
Peon Reports: Classroom - Minor Issue
    ↓
ML Model: Risk Score = 0.35 (Low)
    ↓
Priority Calculation: 0.35 × 4.0 = 1.4 (Low)
    ↓
DEO Dashboard: Appears at BOTTOM in GREEN
    ↓
DEO: "Schedule this for next month"
    ↓
Contractor B: Gets assigned later
    ↓
Completes during planned maintenance
```

---

## Key Metrics

### Peon Dashboard
- Reports submitted weekly
- Average completion time: 2 minutes

### Principal Dashboard
- Total issues visible: ALL
- Critical issues: Highlighted in RED
- Approval rate: Tracks decision-making

### DEO Dashboard ★
- District coverage: 100% of schools
- Priority distribution: Critical/High/Medium/Low
- Contractor utilization: Track assignments
- Average time to assignment: KPI
- Cost optimization: Efficient resource allocation

### Contractor Dashboard
- Work orders assigned: Real-time
- Completion rate: Track productivity
- Average completion time: Per job category
- Customer satisfaction: School feedback

---

## Color Coding System

| Priority | Color  | Action Time | Alert Level |
|----------|--------|-------------|------------|
| Critical | 🔴 Red | < 7 days    | Urgent     |
| High     | 🟡 Yellow | < 14 days | Warning    |
| Medium   | 🔵 Blue | < 30 days  | Notice     |
| Low      | 🟢 Green | Anytime    | Routine    |

---

## Integration Points

```
Frontend ←→ Backend API ←→ ML Pipeline ←→ Database
  (React)     (FastAPI)   (Python)      (SQLite)
   
Peon Form → Reports → ML Processing → Priority Queue
           ↓
        Database
           ↓
Principal Views → DEO Queue → Contractor Tasks
```
