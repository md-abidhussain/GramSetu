import asyncio
import json
import subprocess
import time
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:4173"
DOCS_DIR = Path("docs/screenshots")
DOCS_DIR.mkdir(parents=True, exist_ok=True)

MOCK_CITIZEN = {
    "_id": "cit-001",
    "name": "Asha Devi",
    "email": "asha.devi@example.org",
    "phone": "+91 98765 43210",
    "role": "Citizen",
    "isAuthority": False
}

MOCK_OFFICIAL = {
    "_id": "auth-001",
    "name": "Rajesh Kumar, IAS",
    "email": "authority@gramsetu.gov",
    "role": "District Authority",
    "isAuthority": True
}

MOCK_PROJECTS = [
    {
        "_id": "proj-001",
        "title": "Varanasi Ring Road Pavement Upgradation",
        "description": "Bituminous concrete resurfacing and reinforced culvert drainage across Sector 4.",
        "status": "Verified",
        "riskLevel": "Low",
        "budget": 45000000,
        "location": {"address": "NH-31 Corridor, Varanasi", "lat": 25.3176, "lng": 82.9739},
        "contractor": {"_id": "cont-001", "name": "Purvanchal Infracon Ltd.", "trustScore": 94},
        "lifecycleStatus": "AI Verified",
        "aiAssessment": {
            "status": "completed",
            "completionScore": 88,
            "discrepancyFlag": False,
            "comparisonNotes": "Surface profile matches approved specifications. Drainage alignment confirmed."
        },
        "beforeImage": "/samples/roadDamage/road-repair-before.jpg",
        "afterImage": "/samples/roadDamage/road-repair-after.jpg",
        "createdAt": "2026-08-15T10:00:00.000Z"
    },
    {
        "_id": "proj-002",
        "title": "Panchayat Bhavan Access Corridor",
        "description": "All-weather concrete roadway connecting block headquarters to primary health center.",
        "status": "Flagged",
        "riskLevel": "High",
        "budget": 18500000,
        "location": {"address": "Block 3, Shivpur, Varanasi", "lat": 25.3520, "lng": 82.9540},
        "contractor": {"_id": "cont-002", "name": "Maurya Construction Works", "trustScore": 68},
        "lifecycleStatus": "Under Authority Review",
        "aiAssessment": {
            "status": "completed",
            "completionScore": 54,
            "discrepancyFlag": True,
            "comparisonNotes": "Severe longitudinal cracking detected along chainage 1+200. Pavement thickness variance flagged."
        },
        "beforeImage": "/samples/roadDamage/pothole-severe.jpg",
        "afterImage": "/samples/roadDamage/surface-cracking.jpg",
        "createdAt": "2026-09-01T09:30:00.000Z"
    },
    {
        "_id": "proj-003",
        "title": "Ganga Canal Culvert & Overpass",
        "description": "Reinforced cement concrete box culvert with approach ramps.",
        "status": "Pending",
        "riskLevel": "Medium",
        "budget": 32000000,
        "location": {"address": "Canal Road, Chandauli", "lat": 25.2600, "lng": 83.1800},
        "contractor": {"_id": "cont-003", "name": "Ganga Basin Builders", "trustScore": 82},
        "lifecycleStatus": "Construction Started",
        "createdAt": "2026-10-10T14:15:00.000Z"
    }
]

MOCK_COMPLAINTS = [
    {
        "_id": "comp-001",
        "citizen": {"name": "Asha Devi", "phone": "+91 98765 43210"},
        "location": {"address": "Main Bazar Road, Near Primary Health Center", "lat": 25.3210, "lng": 82.9810},
        "description": "Deep edge pothole causing severe vehicle damage and water stagnation after rain.",
        "severity": "High",
        "status": "Inspector Assigned",
        "imageUrl": "/samples/roadDamage/pothole-severe.jpg",
        "segmentation": {
            "status": "completed",
            "defects": [
                {"type": "pothole", "confidence": 0.94, "areaFractionOfImage": 0.18, "areaCm2": 3200}
            ]
        },
        "assignedInspector": {"_id": "insp-001", "name": "Vikram Singh, JE"},
        "createdAt": "2026-11-12T08:30:00.000Z"
    },
    {
        "_id": "comp-002",
        "citizen": {"name": "Ramesh Chandra", "phone": "+91 98111 22334"},
        "location": {"address": "Sector 9 Link Road", "lat": 25.3400, "lng": 82.9900},
        "description": "Extensive cracking along the asphalt surface following culvert installation.",
        "severity": "Medium",
        "status": "Authority Notification",
        "imageUrl": "/samples/roadDamage/surface-cracking.jpg",
        "segmentation": {
            "status": "completed",
            "defects": [
                {"type": "crack", "confidence": 0.89, "areaFractionOfImage": 0.22, "areaCm2": 4500}
            ]
        },
        "createdAt": "2026-11-15T11:45:00.000Z"
    }
]

MOCK_CONTRACTORS = [
    {
        "_id": "cont-001",
        "name": "Purvanchal Infracon Ltd.",
        "registrationId": "UP-PWD-2021-098",
        "trustScore": 94,
        "completedCount": 18,
        "delayedCount": 1,
        "budgetOverrunsCount": 0,
        "citizenComplaintsCount": 2,
        "qualityIssuesCount": 0,
        "aiSummary": "Consistently adheres to material thickness standards. Timely project delivery with high public satisfaction.",
        "createdAt": "2021-03-15T00:00:00.000Z"
    },
    {
        "_id": "cont-002",
        "name": "Maurya Construction Works",
        "registrationId": "UP-PWD-2019-342",
        "trustScore": 68,
        "completedCount": 12,
        "delayedCount": 4,
        "budgetOverrunsCount": 2,
        "citizenComplaintsCount": 7,
        "qualityIssuesCount": 3,
        "aiSummary": "Repeated asphalt compaction deficits detected on rural road projects. 4 delayed handovers recorded.",
        "createdAt": "2019-07-20T00:00:00.000Z"
    },
    {
        "_id": "cont-003",
        "name": "Ganga Basin Builders",
        "registrationId": "UP-PWD-2022-115",
        "trustScore": 82,
        "completedCount": 9,
        "delayedCount": 1,
        "budgetOverrunsCount": 1,
        "citizenComplaintsCount": 3,
        "qualityIssuesCount": 1,
        "aiSummary": "Reliable structural bridge and culvert work with acceptable timeline compliance.",
        "createdAt": "2022-01-10T00:00:00.000Z"
    }
]

MOCK_TENDERS = [
    {
        "_id": "tend-001",
        "title": "State Highway 87 Resurfacing & Drainage Package",
        "referenceNumber": "UP/PWD/SH87/2026/04",
        "estimatedBudget": 58000000,
        "status": "Evaluated",
        "riskScore": 14,
        "contractor": MOCK_CONTRACTORS[0],
        "clauses": [
            {"clause": "Liquidated damages of 0.5% per week up to maximum 10%", "status": "Compliant"},
            {"clause": "3-year defect liability maintenance warranty", "status": "Compliant"}
        ],
        "aiSummary": "Standard MoRTH specification contract. Clean liability and liquidated damage provisions.",
        "createdAt": "2026-10-05T12:00:00.000Z"
    }
]

MOCK_DASHBOARD_SUMMARY = {
    "totalProjects": 3,
    "completedProjects": 1,
    "averageCompletionScore": 88,
    "aiAssessedProjects": 2,
    "flaggedProjects": 1,
    "totalComplaints": 2,
    "activeTendersCount": 1
}

async def setup_mock_routes(context, user_profile):
    async def route_handler(route):
        url = route.request.url
        method = route.request.method

        if "/api/auth/me" in url:
            if user_profile:
                await route.fulfill(status=200, content_type="application/json", body=json.dumps(user_profile))
            else:
                await route.fulfill(status=401, content_type="application/json", body=json.dumps({"error": "Unauthorized"}))
        elif "/api/dashboard/summary" in url:
            await route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_DASHBOARD_SUMMARY))
        elif "/api/projects" in url:
            await route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_PROJECTS))
        elif "/api/citizen/complaints" in url:
            await route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_COMPLAINTS))
        elif "/api/citizen/inspectors" in url:
            await route.fulfill(status=200, content_type="application/json", body=json.dumps([{"_id": "insp-001", "name": "Vikram Singh, JE", "email": "vikram@gramsetu.gov"}]))
        elif "/api/contractors" in url:
            await route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_CONTRACTORS))
        elif "/api/tenders" in url:
            await route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_TENDERS))
        elif "/api/notifications" in url:
            await route.fulfill(status=200, content_type="application/json", body=json.dumps([]))
        elif "/api/monitoring/project-lifecycle" in url:
            await route.fulfill(status=200, content_type="application/json", body=json.dumps({
                "currentStatus": "AI Verified",
                "allowedNextStatuses": ["Citizen Verification", "Under Authority Review"],
                "history": [
                    {"status": "Tender Published", "timestamp": "2026-08-15T10:00:00.000Z", "changedBy": "Official"},
                    {"status": "Project Created", "timestamp": "2026-08-20T10:00:00.000Z", "changedBy": "Official"},
                    {"status": "Construction Started", "timestamp": "2026-09-01T10:00:00.000Z", "changedBy": "Official"},
                    {"status": "AI Verified", "timestamp": "2026-11-01T10:00:00.000Z", "changedBy": "AI Engine"}
                ]
            }))
        else:
            await route.continue_()

    await context.route("**/api/**", route_handler)

async def capture_all():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # 1. Capture Login Page with Demo Access (Unauthenticated)
        unauth_ctx = await browser.new_context(viewport={"width": 1280, "height": 800})
        await setup_mock_routes(unauth_ctx, None)
        page = await unauth_ctx.new_page()
        print("Capturing login-demo-access.png...")
        await page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=15000)
        await asyncio.sleep(1)
        await page.screenshot(path=str(DOCS_DIR / "login-demo-access.png"), full_page=False)
        await page.screenshot(path=str(DOCS_DIR / "login-page.png"), full_page=False)
        print("Saved login-demo-access.png")
        await unauth_ctx.close()

        # 2. Capture Citizen Views (Dashboard, New Report, My Reports)
        cit_ctx = await browser.new_context(viewport={"width": 1280, "height": 800})
        await setup_mock_routes(cit_ctx, MOCK_CITIZEN)
        cit_page = await cit_ctx.new_page()

        print("Capturing citizen-dashboard.png...")
        await cit_page.goto(f"{BASE_URL}/verify", wait_until="networkidle", timeout=15000)
        await asyncio.sleep(1.5)
        await cit_page.screenshot(path=str(DOCS_DIR / "citizen-dashboard.png"), full_page=False)
        print("Saved citizen-dashboard.png")

        print("Capturing citizen-new-report.png...")
        await cit_page.goto(f"{BASE_URL}/verify?tab=submit", wait_until="networkidle", timeout=15000)
        await asyncio.sleep(1.5)
        await cit_page.screenshot(path=str(DOCS_DIR / "citizen-new-report.png"), full_page=False)
        await cit_page.screenshot(path=str(DOCS_DIR / "citizen-reporting-page.png"), full_page=False)
        print("Saved citizen-new-report.png")

        print("Capturing citizen-my-reports.png...")
        await cit_page.goto(f"{BASE_URL}/verify?tab=track", wait_until="networkidle", timeout=15000)
        await asyncio.sleep(1.5)
        await cit_page.screenshot(path=str(DOCS_DIR / "citizen-my-reports.png"), full_page=False)
        print("Saved citizen-my-reports.png")
        await cit_ctx.close()

        # 3. Capture Official Oversight Views (Dashboard, Tenders, Project Monitoring, Contractors)
        auth_ctx = await browser.new_context(viewport={"width": 1280, "height": 800})
        await setup_mock_routes(auth_ctx, MOCK_OFFICIAL)
        auth_page = await auth_ctx.new_page()

        print("Capturing official-dashboard.png...")
        await auth_page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle", timeout=15000)
        await asyncio.sleep(1.5)
        await auth_page.screenshot(path=str(DOCS_DIR / "official-dashboard.png"), full_page=False)
        await auth_page.screenshot(path=str(DOCS_DIR / "main-dashboard-page.png"), full_page=False)
        print("Saved official-dashboard.png")

        print("Capturing tender-intelligence.png...")
        await auth_page.goto(f"{BASE_URL}/tenders", wait_until="networkidle", timeout=15000)
        await asyncio.sleep(1.5)
        await auth_page.screenshot(path=str(DOCS_DIR / "tender-intelligence.png"), full_page=False)
        await auth_page.screenshot(path=str(DOCS_DIR / "tender-intelligence-page.png"), full_page=False)
        print("Saved tender-intelligence.png")

        print("Capturing project-monitoring.png...")
        await auth_page.goto(f"{BASE_URL}/projects", wait_until="networkidle", timeout=15000)
        await asyncio.sleep(1.5)
        await auth_page.screenshot(path=str(DOCS_DIR / "project-monitoring.png"), full_page=False)
        await auth_page.screenshot(path=str(DOCS_DIR / "project-monitoring-page.png"), full_page=False)
        print("Saved project-monitoring.png")

        print("Capturing contractor-analysis-page.png...")
        await auth_page.goto(f"{BASE_URL}/contractors", wait_until="networkidle", timeout=15000)
        await asyncio.sleep(1.5)
        await auth_page.screenshot(path=str(DOCS_DIR / "contractor-analysis-page.png"), full_page=False)
        print("Saved contractor-analysis-page.png")
        await auth_ctx.close()

        # 4. Capture Mobile Responsive View (Citizen on Mobile)
        mob_ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        await setup_mock_routes(mob_ctx, MOCK_CITIZEN)
        mob_page = await mob_ctx.new_page()
        print("Capturing mobile-citizen-reporting.png...")
        await mob_page.goto(f"{BASE_URL}/verify?tab=submit", wait_until="networkidle", timeout=15000)
        await asyncio.sleep(1.5)
        await mob_page.screenshot(path=str(DOCS_DIR / "mobile-citizen-reporting.png"), full_page=False)
        await mob_page.screenshot(path=str(DOCS_DIR / "mobile-responsive.png"), full_page=False)
        print("Saved mobile-citizen-reporting.png")
        await mob_ctx.close()

        await browser.close()
        print("All 8 screenshots successfully captured!")

if __name__ == "__main__":
    print("Starting client preview server on port 4173...")
    proc = subprocess.Popen(
        "npx vite preview --port 4173",
        cwd="client",
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(3)
    try:
        asyncio.run(capture_all())
    finally:
        print("Stopping client preview server...")
        subprocess.run(f"taskkill /F /T /PID {proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

