# GramSetu — Team Contributions & Authorship Record

This document provides a factual, verifiable record of individual and collaborative contributions to the GramSetu repository based on the Git commit history, pull requests, and architectural responsibility areas.

---

## Contributor Summary

| Contributor | GitHub Handle / Identity | Primary Responsibilities & Functional Areas |
| :--- | :--- | :--- |
| **Mohd Abid Hussain** | `md-abidhussain` (abidhussain.ah7860@gmail.com) | System Architecture, Full-Stack Lead, Auth & RBAC, Gemini AI Pipeline, Security Hardening, Test Suite, GovTech UI |
| **Bibhuti Kumar Parida** | `bibhuti-parida` / `Bibhuti Kumar Parida` | AI Defect Detection Service, ONNX Model Integration, Automated PDF Audit Reports, Database Seed Data |
| **Ramu1029** | `Ramu1029` | Infrastructure Project Lifecycle Module, Contractor Registry & Analytics UI Forms |

---

## 1. Mohd Abid Hussain (`md-abidhussain`) — Lead Architect & Developer

### Core Responsibilities
- **System Architecture & Design**:
  - Established repository structure, full-stack monorepo workflows, environment configuration schemas, and deployment pipelines.
  - Defined end-to-end data schemas using Mongoose (`CitizenReport`, `Project`, `Tender`, `Contractor`, `Authority`, `Reward`, `Notification`).
- **Authentication & Role-Based Authorization (RBAC)**:
  - Implemented secure cookie-based session management (`HttpOnly`, `SameSite=Strict`, `Secure` in production).
  - Developed role-based middleware (`protect`, `restrictTo`) strictly enforcing permissions across `Citizen`, `Official`, `Inspector`, `Contractor`, and `Admin` roles.
  - Implemented session revocation via `tokenVersion`, protection against IDOR (Insecure Direct Object References), and credential protection.
- **Citizen Infrastructure Reporting & Workflow Engine**:
  - Engineered the citizen grievance submission flow with GPS coordinate capture, image upload, and state machine transitions (`Submitted` -> `UnderReview` -> `Accepted` / `Rejected` -> `Resolved`).
  - Implemented EXIF metadata stripping (`stripImageMetadata.js`) to safeguard citizen privacy before image processing.
  - Created transactional state updates preventing double-payout of citizen civic rewards.
- **Gemini AI Tender & Damage Analysis Pipeline**:
  - Built isolated AI service layer (`server/services/ai/`) for tender document extraction, risk assessment, and before/after project comparison.
  - Designed structured JSON schemas (`server/services/ai/responseSchema.js`) with bounded retry logic and strict fallback handling so the core system never crashes when AI is unavailable.
- **Frontend GovTech UI/UX Design**:
  - Overhauled visual identity according to modern Indian GovTech standards (Deep Navy `#0e2c53`, Warm Beige surface `#f7f4ee`, Saffron accents `#9a4f00`).
  - Implemented responsive dashboards, empty/loading/error states, and WCAG/GIGW accessibility compliance.
- **Testing & Quality Assurance**:
  - Authored comprehensive test harness: 129+ server unit tests, integration tests with MongoDB Memory Server, and Vitest component test suites.
  - Set up CI/CD workflows (`.github/workflows/ci.yml`), smoke tests (`scripts/smoke.js`), and load benchmarking (`scripts/loadtest.js`).

---

## 2. Bibhuti Kumar Parida (`bibhuti-parida`) — AI & Infrastructure Contributor

### Core Responsibilities & Commits
- **Defect Detection Microservice (`segmentation-service/`)**:
  - Initial setup of the Python microservice for road defect segmentation (`a884d8f`).
  - Integration of YOLO / ONNX object detection runtime (`47f494f`, `c6b9d6f`).
  - Uploaded initial ONNX model weights (`models/model.onnx`) for cloud deployment (`33c4cb4`).
- **Automated PDF Audit Report Generator**:
  - Implemented the PDF export engine for project status and citizen complaint audit summaries using PDFKit (`858f4ee`, `68c17eb`).
  - Mapped database schemas to formatted printable reports for municipal officials.
- **Database Seed Data & Deployment Linking**:
  - Seeded realistic citizen complaints linked to demo citizen profiles in MongoDB (`5aceb6e`).
  - Configured live API proxy and Express backend endpoints in `vercel.json` (`e21d19c`, `d767cb6`).
  - Resolved middleware import bugs in contractor routes and NaN edge cases in average dashboard calculations (`bdb2c56`).

---

## 3. Ramu1029 (`Ramu1029`) — Lifecycle & Contractor Module Contributor

### Core Responsibilities & Commits
- **Project Lifecycle Tracking Module**:
  - Implemented frontend project lifecycle stage tracker allowing municipal authorities to view and update milestone stages (`342004a`).
  - Created UI stage cards visualising civil project progression from Tender to Completion.
- **Contractor Registry & Analytics**:
  - Created initial contractor registry form and dashboard analytics view (`376a437`).
  - Updated contractor registration input validation, GSTIN fields, and past performance inputs (`77d3249`).
  - Contributed to `feature/contractor-registry-analytics` and `feature/Infrastructure-Lifecycle-Module` branches.

---

## 4. Collaborative Development & Subsequent Refactoring

| Feature / Module | Initial Implementation | Architectural Refactoring |
| :--- | :--- | :--- |
| **Defect Detection Integration** | Prototyped by Bibhuti Kumar Parida using FastAPI & YOLO | Refactored by Mohd Abid Hussain to enforce honest AI classification (`real_inference`, `demo_simulation`, `model_unavailable`), strict service tokens, and timeout/error isolation in Express backend |
| **Contractor Management** | Registry forms and views created by Ramu1029 | Standardized by Mohd Abid Hussain with backend RBAC guards, reputation scoring algorithms (`contractorScoreService.js`), and input sanitization |
| **PDF Reporting** | PDF report generator built by Bibhuti Kumar Parida | Hardened by Mohd Abid Hussain to handle missing media gracefully and sanitize database outputs |
| **Lifecycle State Machine** | Lifecycle UI views developed by Ramu1029 | Constrained by Mohd Abid Hussain with backend validation rules ensuring AI verification steps cannot be bypassed manually |

---

## Interview & Project Defense Quick Reference

When presenting or explaining this project:
1. **Explain Own Work (`md-abidhussain`)**: Lead architect responsible for full-stack system architecture, security hardening, authentication state machine, Gemini AI integration, database schema consistency, test suites, and accessible UI.
2. **Credit Teammates Accurately**: Bibhuti Parida contributed the initial Python segmentation service, ONNX model weights, and PDF report generator. Ramu contributed the initial project lifecycle tracker and contractor registration forms.
3. **Refactoring Narrative**: Demonstrates engineering leadership—taking functional team prototypes and hardening them into production-ready, secure, tested, and maintainable services with proper error isolation and accessibility.
