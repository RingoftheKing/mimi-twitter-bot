// run node --env-file=.env ./headlessLogin.js

const { chromium } = require('playwright');

function checkIfLoggedIn(page) {
    // Check for the presence of the "Home" link in the navigation bar
    const homeLink = page.locator('a[aria-label="Home"]');
    return homeLink.isVisible();
}

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

    const isAlreadyLoggedIn = checkIfLoggedIn(page); 
    if (isAlreadyLoggedIn) {
        console.log("Already logged in, no need to log in again.");
        return;
    }
    
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

    // A Basic check that we are at home
    const isLoggedIn = checkIfLoggedIn(page);
    if (isLoggedIn) {
        console.log("Login successful");
    } else {
        console.log("Unable to confirm login success");
    }

})();