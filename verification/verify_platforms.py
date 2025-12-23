from playwright.sync_api import sync_playwright, expect
import time

def verify_platforms(page):
    # Navigate to the home page
    # Log shows port 8080

    try:
        page.goto("http://localhost:8080/", timeout=10000)
    except:
        print("Failed to navigate to localhost:8080")
        return

    # Wait for the input to be visible
    input_selector = "input[type='url']"
    try:
        page.wait_for_selector(input_selector, timeout=5000)
    except:
        print("Input selector not found. Dumping HTML...")
        # print(page.content())
        return

    # Test Twitch Detection
    twitch_url = "https://www.twitch.tv/videos/123456789"
    page.fill(input_selector, twitch_url)

    # Wait for the logo to appear.
    # We can check for the specific SVG path or class.
    # PlatformLogo gives a div with class "text-twitch".

    try:
        expect(page.locator(".text-twitch")).to_be_visible(timeout=3000)
    except:
        print("Twitch logo not visible")
        page.screenshot(path="verification/twitch_fail.png")
        raise

    # Take screenshot for Twitch
    page.screenshot(path="verification/twitch_verification.png")

    # Clear input
    page.fill(input_selector, "")

    # Test Kick Detection
    kick_url = "https://kick.com/streamer/videos/12345"
    page.fill(input_selector, kick_url)

    try:
        expect(page.locator(".text-kick")).to_be_visible(timeout=3000)
    except:
        print("Kick logo not visible")
        page.screenshot(path="verification/kick_fail.png")
        raise

    # Take screenshot for Kick
    page.screenshot(path="verification/kick_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_platforms(page)
            print("Verification script finished successfully.")
        except Exception as e:
            print(f"Verification script failed: {e}")
        finally:
            browser.close()
