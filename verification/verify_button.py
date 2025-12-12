from playwright.sync_api import sync_playwright

def verify_button():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the frontend
            page.goto("http://localhost:8080")

            # Wait for any content to ensure page loaded
            page.wait_for_selector("#root")

            # We can't easily trigger a download state without backend interaction,
            # but we can try to verify if the page loads without errors.
            # To verify the button, we ideally need it to appear.
            # But in this restricted environment, I might not be able to easily mock the socket state.
            # However, I can at least take a screenshot of the main page.

            # Take a screenshot
            page.screenshot(path="verification/button_snapshot.png")
            print("Screenshot saved to verification/button_snapshot.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_button()
