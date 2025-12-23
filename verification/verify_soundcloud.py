from playwright.sync_api import sync_playwright

def verify_soundcloud(page):
    # Navigate to the app (assuming default Vite port 8080, wait for it to be ready)
    page.goto("http://localhost:8080")

    # Wait for the input to appear
    page.wait_for_selector("input[type='url']")

    # Fill in a SoundCloud URL
    page.fill("input[type='url']", "https://soundcloud.com/user/track")

    # Wait for detection (a short delay for state update)
    page.wait_for_timeout(1000)

    # Check if the input border has the correct color class (we can check computed style or class)
    # The input should have a class 'border-soundcloud' or similar if we implemented it right?
    # Actually in DownloadInput.tsx: className={cn(..., platform && `border-${platform}`)}
    # So we look for class 'border-soundcloud'

    # Also check if the logo appeared. The logo component renders an SVG.
    # We can check if the text-soundcloud class is present on the logo container.

    page.screenshot(path="verification/soundcloud_detection.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_soundcloud(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
