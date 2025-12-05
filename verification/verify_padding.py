from playwright.sync_api import sync_playwright

def verify_padding():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use larger viewport to mimic desktop, or smaller for mobile
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # Based on lsof, it seems to be running on 8082 (most recent) or 8080/8081.
        # I'll try 8082 as it is the newest.
        try:
            page.goto("http://localhost:8082", timeout=10000)
        except Exception as e:
            print(f"Failed to load localhost:8082: {e}")
            return

        # Wait for the main content to be visible
        try:
            page.wait_for_selector("text=Media Downloader", timeout=10000)
        except Exception as e:
            print(f"Failed to find 'Media Downloader': {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            return

        # Take a screenshot
        page.screenshot(path="/home/jules/verification/padding_check.png")
        print("Screenshot taken at /home/jules/verification/padding_check.png")

        browser.close()

if __name__ == "__main__":
    verify_padding()
