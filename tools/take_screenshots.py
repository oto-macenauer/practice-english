#!/usr/bin/env python3
"""
Generate PWA screenshots for the Practice English app using Playwright.

Usage:
  1. Install: pip install playwright && playwright install chromium
  2. Serve the app locally: python -m http.server 8080
  3. Run:  python tools/take_screenshots.py
     Or:  python tools/take_screenshots.py --base-url http://localhost:3000
"""

import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "images" / "screenshots"

# Screenshot definitions: (filename, url_path, viewport, form_factor)
SCREENSHOTS = [
    # Wide (desktop/tablet landscape)
    ("home-wide.webp",  "/index.html", {"width": 1280, "height": 720}, "wide"),
    ("test-wide.webp",  "/modules/practice-tests/unit7/index.html", {"width": 1280, "height": 720}, "wide"),
    # Narrow (mobile portrait)
    ("home-narrow.webp", "/index.html", {"width": 390, "height": 844}, "narrow"),
    ("test-narrow.webp", "/modules/practice-tests/unit7/index.html", {"width": 390, "height": 844}, "narrow"),
]


def main():
    parser = argparse.ArgumentParser(description="Take PWA screenshots")
    parser.add_argument("--base-url", default="http://localhost:8080",
                        help="Base URL of the running app (default: http://localhost:8080)")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for filename, path, viewport, form_factor in SCREENSHOTS:
            output_path = OUTPUT_DIR / filename
            print(f"[{filename}] {viewport['width']}x{viewport['height']} ({form_factor})")

            context = browser.new_context(
                viewport=viewport,
                device_scale_factor=2 if form_factor == "narrow" else 1,
            )
            page = context.new_page()
            page.goto(args.base_url + path, wait_until="networkidle")
            page.wait_for_timeout(1000)  # let images load

            # Take screenshot at exact viewport size
            screenshot_bytes = page.screenshot(type="png")

            # Convert to WebP via Pillow for smaller size
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(screenshot_bytes))
            # Resize to exact manifest dimensions
            img = img.resize((viewport["width"], viewport["height"]), Image.LANCZOS)
            img.save(str(output_path), "WEBP", quality=90)

            file_size = output_path.stat().st_size / 1024
            print(f"  Saved ({file_size:.0f} KB)")

            context.close()

        browser.close()

    print(f"\nDone! Screenshots saved to {OUTPUT_DIR.relative_to(PROJECT_ROOT)}/")


if __name__ == "__main__":
    main()
