const { chromium } = require('playwright');

(async () => {
    const context = await chromium.launchPersistentContext(
        './x-profile',
        {
            headless: false,
            args: ['--disable-blink-features=AutomationControlled']
        }
    );

    // const UserAgent = require('user-agents')
    // const optionsContext = {
    //   userAgent: new UserAgent([/Chrome/i, { deviceCategory: 'desktop' }]).userAgent,
    //   locale: 'en-US',
    //   viewport: { width: 1280, height: 720 },
    //   deviceScaleFactor: 1
    // };

    // await context.newContext(optionsContext);

    const page = await context.newPage();

    await page.goto('https://x.com/login');

    console.log('Complete login + 2FA manually in the browser.');

    // Keep browser open while you log in manually.
})();