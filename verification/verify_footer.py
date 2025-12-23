from playwright.sync_api import sync_playwright, expect

def verify_footer(page):
    try:
        page.goto("http://localhost:8080/", timeout=10000)
    except:
        print("Failed to navigate to localhost:8080")
        return

    # Wait for footer text specifically
    # The header also contains the text "SoundCloud", so we need to be specific.
    # The footer items are in a div with "flex flex-wrap"

    footer = page.locator(".flex.flex-wrap.justify-center.gap-6")
    expect(footer).to_be_visible()

    expect(footer.get_by_text("SoundCloud", exact=True)).to_be_visible()
    expect(footer.get_by_text("Twitch", exact=True)).to_be_visible()
    expect(footer.get_by_text("Kick", exact=True)).to_be_visible()

    # Check for the icons within the footer
    expect(footer.locator(".text-twitch")).to_be_visible()
    expect(footer.locator(".text-kick")).to_be_visible()
    expect(footer.locator(".text-soundcloud")).to_be_visible()

    page.screenshot(path="verification/footer_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_footer(page)
            print("Footer verification script finished successfully.")
        except Exception as e:
            print(f"Verification script failed: {e}")
        finally:
            browser.close()
