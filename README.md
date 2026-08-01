# GramSetu AI

**GramSetu AI** is a full-stack, AI-powered infrastructure verification platform built for transparent government project auditing. It leverages the Google Gemini API (multimodal text + vision) to audit public tenders, evaluate physical construction milestones, and process citizen damage reports.

---

## Folder Structure

```
gramsetu-ai/
  client/       - React, Tailwind CSS, Vite frontend
  server/       - Node.js, Express, MongoDB Atlas backend
  .env.example  - Environment configuration template
```

---

## AI Implementation Details

GramSetu AI wraps all Google Gemini API calls in a unified client helper (`server/services/geminiClient.js`) that enforces JSON output schemas, handles network timeouts, and recovers from parsing errors.

### 1. AI Tender Intelligence (Module 1)
- **Use Case**: Automatically audits government tender PDFs to check for budget anomalies or timeline delays.
- **Workflow**: 
  1. The official uploads a PDF tender.
  2. The server extracts the text using `pdf-parse`.
  3. The text is sent to Gemini (using `gemini-1.5-flash`) with a schema-forcing prompt.
  4. Returns: Executive summary, budget allocated, flagged budget concerns, timeline warnings, and risk level.

### 2. Project Monitoring (Module 2)
- **Use Case**: Compares official "before" and "after" images of construction works.
- **Workflow**:
  1. Authorities upload a photo prior to construction, and another photo upon completion.
  2. Both image URLs are downloaded as base64 buffers and submitted to Gemini vision.
  3. The AI evaluates visible differences to assign a physical completion score, project health status (`Healthy` | `At Risk` | `Failed`), and detailed comparison notes.

### 3. Citizen Verification (Module 3)
- **Use Case**: Processes public complaints by matching citizen photos with official completion photos.
- **Workflow**:
  1. Citizens upload a current photo of an infrastructure asset, adding GPS coordinates and description.
  2. The citizen photo is cross-referenced with the official completion photo using Gemini.
  3. Returns: Specific issues list (`["crack", "road_damage", "garbage", "none"]`), a match score percentage, and a plain-language AI explanation. If the score falls below a threshold or discrepancy is flagged, the project status is set to `Flagged` and authorities are alerted.

---

## Local Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudinary Account
- Gemini API Key

### Backend Setup
1. Open a terminal and navigate to the server folder:
   ```bash
   cd server
   ```
2. Create your `.env` file using the template:
   ```bash
   cp ../.env.example .env
   ```
   Fill in your `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, and Cloudinary variables.
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
   *Note: Server automatically seeds a default authority user: `authority@gramsetu.gov` / password `authority123`.*

### Frontend Setup
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies and start the React dev app:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

---

## Deployment Steps

### 1. Database: MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under "Network Access", add IP address `0.0.0.0/0` to allow connections from Render.
3. Under "Database Access", create a database user and password.
4. Copy the connection string (e.g. `mongodb+srv://<user>:<password>@cluster0.mongodb.net/...`).

### 2. Backend: Render
1. Create a new Web Service on [Render](https://render.com) and link your repository.
2. Configure settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. Add these Environment Variables under "Environment":
   - `MONGODB_URI` (your MongoDB Atlas connection string)
   - `JWT_SECRET` (a secure secret string)
   - `GEMINI_API_KEY` (your Google Gemini API key)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Copy the deployed service URL (e.g., `https://gramsetu-api.onrender.com`).

### 3. Frontend: Vercel
1. Create a new Project on [Vercel](https://vercel.com) and link your repository.
2. Configure settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. In `client/vite.config.js`, update your proxy configuration to route `/api` to your Render backend URL, or configure your fetch utility (`client/src/services/api.js`) to target your Render backend URL instead of the relative proxy path in production.
4. Deploy the frontend.
