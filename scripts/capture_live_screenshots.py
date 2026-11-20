import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:4173"
OUT_DIR = Path("assets/screenshots")
OUT_DIR.mkdir(parents=True, exist_ok=True)

DOCS_DIR = Path("docs/screenshots")
DOCS_DIR.mkdir(parents=True, exist_ok=True)

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop Context
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        
        routes = [
            ("login-page.png", "/login"),
            ("citizen-reporting-page.png", "/verify"),
            ("tender-intelligence-page.png", "/tenders"),
            ("project-monitoring-page.png", "/monitoring"),
            ("contractor-analysis-page.png", "/contractors"),
            ("main-dashboard-page.png", "/"),
        ]
        
        for filename, route in routes:
            url = f"{BASE_URL}{route}"
            print(f"Navigating to {url}...")
            try:
                await page.goto(url, wait_until="networkidle", timeout=15000)
            except Exception as e:
                print(f"Timeout on {url}, capturing current state...")
            await asyncio.sleep(1) # Allow React transitions to settle
            
            target_path = OUT_DIR / filename
            await page.screenshot(path=str(target_path), full_page=False)
            print(f"Saved: {target_path}")
            
            # Also sync into docs/screenshots
            docs_path = DOCS_DIR / filename
            await page.screenshot(path=str(docs_path), full_page=False)
            
        await context.close()
        
        # 2. Mobile Viewport (Pixel 7 / iPhone dimension)
        mobile_context = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        mobile_page = await mobile_context.new_page()
        print("Navigating to mobile view...")
        await mobile_page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=15000)
        await asyncio.sleep(1)
        mobile_target = OUT_DIR / "mobile-responsive.png"
        await mobile_page.screenshot(path=str(mobile_target), full_page=False)
        await mobile_page.screenshot(path=str(DOCS_DIR / "mobile-responsive.png"), full_page=False)
        print(f"Saved: {mobile_target}")
        
        await mobile_context.close()
        await browser.close()
        print("All screenshots successfully captured!")

if __name__ == "__main__":
    asyncio.run(capture())
