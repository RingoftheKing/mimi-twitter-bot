const { chromium } = require('playwright');

(async () => {
    const context = await chromium.launchPersistentContext(
        './x-profile',
        {
            headless: true,
            args: ['--disable-blink-features=AutomationControlled']
        }
    );

    const page = context.pages()[0] ?? await context.newPage();

    await page.goto('https://x.com/mimi_3mi');

    const posts = page.locator('[data-testid="tweetText"]');

    for (let i = 0; i < Math.max(await posts.count(), 3); i++) {
        console.log(await posts.nth(i).innerText());
    }

    // for clicking on show more later, setup for loop per tweet
    const containerTestId = "tweet";
    const textTestId = "tweetText";
    const showMoreTestId = "tweet-text-show-more-link";

    await context.close();
})();