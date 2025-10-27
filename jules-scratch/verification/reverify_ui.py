
import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        file_path = os.path.abspath('frontend/index.html')
        await page.goto(f'file://{file_path}')

        # 1. Take a screenshot of the initial state.
        await page.screenshot(path='jules-scratch/verification/01_reverify_initial_state.png')

        # 2. Click the start button to verify it is interactive.
        await page.click('#startButton')

        # 3. Take a screenshot of the state immediately after clicking.
        # This will show the "pending" state set by the event listener.
        await page.screenshot(path='jules-scratch/verification/02_reverify_after_click.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
