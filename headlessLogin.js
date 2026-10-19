// run node --env-file=.env ./headlessLogin.js

const { chromium } = require('playwright');

(async () => {
    const context = await chromium.launchPersistentContext(
        './x-profile-headless',
        {
            headless: true,
            args: ['--disable-blink-features=AutomationControlled']
        }
    );

    const page = await context.newPage();

    await page.goto('https://x.com/');
    // Username / email
    const usernameInput = page.locator(
      'input[name="username_or_email"]'
    );
    
    await usernameInput.waitFor({ state: 'visible' });
    await usernameInput.fill(process.env.X_USERNAME);
    console.log("Username visible");
    
    // Submit username
    await page.locator('button[type="submit"]').click();
    console.log("Username submitted");
    
    // Password
    const passwordInput = page.locator(
      'input[autocomplete="current-password"]'
    );
    console.log("Password visible");
    
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill(process.env.X_PASSWORD);
    console.log("Password submitted");
    
    // "Continue"
    await page
        .getByRole('button', { name: 'Continue' })
        .click();

    // Login flow continues here...
})();