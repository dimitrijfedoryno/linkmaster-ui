from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the frontend
            page.goto("http://localhost:8080")

            # Wait for any content to ensure page loaded
            page.wait_for_selector("#root")

            # Take a screenshot
            page.screenshot(path="verification/frontend_snapshot.png")
            print("Screenshot saved to verification/frontend_snapshot.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
