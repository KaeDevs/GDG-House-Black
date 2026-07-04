# SchoolSync — Project Guidelines

## Overview
**SchoolSync** is a Constituency School Resource Rationalization Engine — a hackathon MVP that ingests school-level data for a sample Indian constituency and recommends merges, teacher redistributions, and resource optimizations based on RTE Act constraints.

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Backend | FastAPI (Python 3.11+) | Fast to set up, async-ready, auto-docs |
| Frontend | React 18 + Vite + Tailwind CSS | Rapid UI, Vite for fast HMR |
| Map | Leaflet + react-leaflet | Free, open-source, great for geo demos |
| Data | Static JSON (mock) | MVP speed — no DB needed |
| CORS | FastAPI CORSMiddleware | Local dev cross-origin calls |
| Distance | Haversine formula (Python) | Simple, no external deps |

> **Production upgrade path**: Replace greedy nearest-neighbor matching with Google OR-Tools / PuLP solver, and static JSON with PostgreSQL + PostGIS.

---

## Folder Structure

```
App/
├── GUIDELINES.md          ← This file
├── design/                ← UI mockup screenshots (source of truth)
├── backend/
│   ├── main.py            ← FastAPI app entry point
│   ├── routes/
│   │   ├── schools.py     ← GET /api/schools
│   │   └── recommendations.py  ← GET /api/recommendations
│   ├── logic/
│   │   └── optimizer.py   ← Core rationalization logic (greedy NN)
│   ├── data/
│   │   └── schools.json   ← Mock dataset (20-30 schools)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   ├── components/
    │   │   ├── StatCard.jsx
    │   │   ├── SchoolMap.jsx
    │   │   ├── RecommendationCard.jsx
    │   │   └── ChatInterface.jsx
    │   ├── pages/
    │   │   ├── Landing.jsx
    │   │   └── Dashboard.jsx
    │   └── api/
    │       └── client.js
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Data Schema

### School Object (schools.json)
```json
{
  "school_id": "SCH001",
  "name": "Government Primary School Korattur",
  "lat": 13.1027,
  "lng": 80.1635,
  "enrollment": 0,
  "teacher_count": 1,
  "school_type": "primary",        // "primary" | "upper-primary"
  "block": "Ambattur",
  "district": "Chennai"
}
```

### Recommendation Object (API response)
```json
{
  "type": "merge",                  // "merge" | "redistribute"
  "source_school": { ...SchoolObject },
  "target_school": { ...SchoolObject },
  "distance_km": 0.82,
  "rte_compliant": true,
  "reasoning": "Zero-enrollment school merged into nearest primary within 1km RTE limit"
}
```

---

## Optimization Logic (Plain English)

### Step 1 — Flag Zero-Enrollment Schools
Any school with `enrollment == 0` is flagged as a **merge candidate**. These schools are essentially inactive and should be consolidated.

### Step 2 — Find Merge Targets
For each zero-enrollment school, use **haversine distance** to find the nearest school of the **same type** (`primary` → `primary`, `upper-primary` → `upper-primary`) that:
- Is NOT itself a merge candidate
- Is within RTE distance limits:
  - Primary: **≤ 1 km**
  - Upper-Primary: **≤ 3 km**
- Mark `rte_compliant = true` if found within limits, `false` otherwise (still recommend nearest, but warn)

### Step 3 — Flag Overloaded Single-Teacher Schools
Any school with `teacher_count == 1` AND `enrollment > 40` is flagged as **understaffed**.

### Step 4 — Redistribute Surplus Teachers
Schools that are being merged/closed "free up" their teachers. These freed teachers are greedily matched to the nearest understaffed school within a reasonable distance (10km cap for redistribution).

### MVP Note
This is a **greedy nearest-neighbor** algorithm — it does NOT globally optimize. For production, replace with:
- **Google OR-Tools** for vehicle routing / assignment problems
- **PuLP** for linear programming formulation

---

## RTE Act Constraints Summary
- **Primary schools** (Grades 1–5): must be within **1 km** of every student's residence
- **Upper-primary schools** (Grades 6–8): must be within **3 km** of every student's residence
- These constraints inform the maximum merge distance thresholds in our logic

---

## Color Coding (Map Markers)
| Color | Meaning |
|-------|---------|
| 🔴 Red | Zero-enrollment (merge candidate) |
| 🟠 Orange | Single-teacher overloaded (>40 students, 1 teacher) |
| 🟢 Green | Healthy school |

---

## How to Run This Demo

### Prerequisites
- Python 3.11+ with pip
- Node.js 18+ with npm

### Start Backend
```bash
cd d:\GDG\App\backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend will be live at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Start Frontend
```bash
cd d:\GDG\App\frontend
npm install
npm run dev
```
Frontend will be live at: http://localhost:5173

### Verify
- Visit http://localhost:5173 — Landing page should load
- Navigate to Dashboard — map and stat cards should populate
- Click "AI Insights" tab — quick prompts should show recommendation cards
- API test: http://localhost:8000/api/schools (should return 25 schools)
- API test: http://localhost:8000/api/recommendations (should return recommendations array)
