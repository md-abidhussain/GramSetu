# GramSetu AI — GovTech Infrastructure Verification & Audit Platform

GramSetu AI is a next-generation GovTech enterprise platform designed for auditing, monitoring, and validating public infrastructure works. It provides municipal and district authorities with automated tender analytics, real-time before/after project construction tracking, and a geo-verifiable citizen complaint audit ledger.

---

## 📌 Problem Statement & Limitations of Existing Systems

1. **Information Asymmetry**: Municipalities often execute infrastructure projects (roads, schools, pipelines) without transparent verification.
2. **Post-Completion Neglect**: Infrastructure monitoring conventionally halts after project completion, leaving subsequent damages unrecorded and unaddressed.
3. **Audit Fraud**: Manual audits are prone to reporting delays, lack objective photographic proof, and are subject to human bias.
4. **Poor Citizen Engagement**: Citizen portals lack feedback loops, duplicate detection, and visual evidence validation.

### Limitations:
* **No Structural Verification**: Simple text complaints do not quantify the severity of road defects (potholes/cracks).
* **Placeholder Auditing**: Authority portals rely on basic "Accept/Reject" buttons without site-inspections or before/after image validation.

---

## 💡 The GramSetu AI Proposed Solution

GramSetu AI replaces manual municipal inspections with a **closed-loop AI auditing pipeline** combining **Gemini Vision Comparison** and **YOLOv8 Semantic Segmentation**:
* **Before/After Analysis**: Auto-compares completed construction against initial site condition to generate a structural compliance index.
* **Citizen Audit Feed**: Citizens submit geotagged photos to trigger automated defect calculations (area in cm², width, height, diameter).
* **Complaint-Driven Project Degradation**: Auto-recalculates contractor trust scores and degrades project health if citizen complaints escalate on verified projects.

---

## 🛠️ Technology Stack

* **Frontend**: React.js, Vite, TailwindCSS (Vanilla GovTech portal styling), Leaflet Maps, Lucide Icons.
* **Backend**: Node.js, Express, MongoDB (Mongoose schemas), JWT (JSON Web Tokens).
* **AI & Segmentation**: Python FastAPI, Ultralytics YOLOv8-Seg, ONNX Runtime.
* **Model Inference Provider**: ONNX Runtime (CPU execution provider default).
* **Database**: MongoDB (separate collections for Citizens and Authorities).

---

## 🔒 Authentication & Role-Based Security

### Separate Collections:
1. **Citizen Collection**: Stores name, email/Gmail, mobile phone number, password hash, and earned reward points/badges. Check for duplicate entries is run against both email and phone fields.
2. **Authority Collection**: Stores name, email, password hash, role classification, and a unique official User ID (e.g. `AUTH-2026-9021`).

### Cookie-based Authentication:
- Session tokens are dispatched via HttpOnly, SameSite secure cookie headers instead of `localStorage`.
- Role-based middleware separates official routing limits. Allowed Official roles:
  * **District Authority** (Final Approvals & Assignments)
  * **Inspector** (Field Inspections & Evidence Uploads)
  * **PWD Engineer** (Tender Intake & Project Initialization)
  * **Government Officer** (Auditing & Review)
  * **Admin** (System Control)

---

## 🌀 Platform Workflows

### 📢 Complaint Lifecycle
```text
Citizen -> Complaint Submitted -> AI Analysis -> Duplicate Detection -> Severity Detection 
        -> Geo Verification -> Authority Notification -> Inspector Assigned -> Inspection Scheduled 
        -> Inspector Uploads Verification -> Gemini Analysis -> AI Agent Validation 
        -> Authority Decision (Accepted, Rejected, Need More Evidence) -> Citizen Notification 
        -> Resolution Published
```

### 📍 Project Monitoring Workflow
```text
PWD Engineer Publishes Tender -> Contract Awarded -> Contractor Starts Work -> PWD Inspector 
    Uploads Before Images -> Project Completed -> Inspector Uploads After Images -> Gemini compares 
    construction -> AI Agent validates -> District Authority approves -> Project Completed 
    -> Citizens continue monitoring for defects
```

---

## 🚀 AI Agent Validation Pipeline

```text
Input Images
     |
     v
Gemini Vision Analysis
     |
     v
Agent Validation Layer (Structure checking, retry on fail, regex fallback parser)
     |
     v
Normalized Output: { Confidence %, Reasoning, Risk Rating, Suggested Action }
```

---

## 📁 Folder Structure

```text
├── client/                     # React.js SPA frontend
│   ├── src/
│   │   ├── components/         # Map, Leaderboards, Forms, Layout
│   │   ├── context/            # AuthContext (split official/citizen)
│   │   ├── pages/              # Dashboard, Tenders, Monitoring, Citizen Portal
│   │   └── services/           # API fetch helpers
├── server/                     # Node/Express API
│   ├── models/                 # Mongoose schemas (Authority, Citizen, Project, etc.)
│   ├── controllers/            # Auth, Project, Citizen workflow logic
│   └── routes/                 # Endpoint routers
└── segmentation-service/       # FastAPI YOLOv8 inference service
```

---

## 📄 Database Schema Summary

### Authority Schema:
* `uniqueUserId`: String (unique: true, auto-generated e.g., `AUTH-2026-XXXX`)
* `role`: String (enum: `['Government Officer', 'Inspector', 'District Authority', 'PWD Engineer', 'Admin']`)

### Citizen Schema:
* `email`: String (optional, unique, sparse)
* `phone`: String (optional, unique, sparse)
* `points`: Number (default: 0)

### Project Schema:
* `lifecycleStatus`: String (enum: `['Tender Published', 'Project Created', 'Construction Started', ...]`)
* `healthPercentage`: Number (default: 100)
* `complaintCount`: Number (default: 0)

---

## 🔧 Setup & Running Locally

### 1. Backend Setup (`server/`)
1. Create a `server/.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/gramsetu
   JWT_SECRET=super_secure_jwt_token_secret_phrase
   GEMINI_API_KEY=your-gemini-key
   CLOUDINARY_CLOUD_NAME=your-cloud
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-secret
   SEGMENTATION_SERVICE_URL=http://localhost:8000
   ```
2. Start the dev server: `npm run dev`

### 2. Python Segmentation Setup (`segmentation-service/`)
1. Create a virtual environment and start:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app:app --port 8000
   ```

### 3. Client Setup (`client/`)
1. Start the client: `npm run dev`
2. Access the app on: `http://localhost:3000` (or `http://localhost:3001`)

---

## 👥 Contributors

* **Mohd Abid Hussain** (Lead Developer)
* **Bibhuti Parida** (AI & ONNX Integration)
* **Ramu1029** (Project Lifecycle Developer)
