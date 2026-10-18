const { readFile } = require('node:fs');
const { json } = require('node:stream/consumers');
const { chromium } = require('playwright');

const fs = require("fs");
const crypto = require("crypto");

const POSTS_TO_READ = 5
const SEEN_FILE = "./seen.json";

function hash(text) {
    // Doesn't need cryptographic security,
    // but SHA-1 is built-in, simple, and collision-resistant enough for this use.
    return crypto
        .createHash("sha1")
        .update(text, "utf8")
        .digest("hex");
}

function addToReferences(postString, dateTimeCreated) {
    const h = hash(postString);

    // Load existing database
    let db = [];

    if (fs.existsSync(SEEN_FILE)) {
        try {
            const contents = fs.readFileSync(SEEN_FILE, "utf8");

            if (contents.trim()) {
                db = JSON.parse(contents);
            }
        } catch (error) {
            console.error("Couldn't read seen.json:", error);
            return false;
        }
    }

    // Delete entries older than ~1 month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    db = db.filter(post => {
        const createdOn = new Date(post.CreatedOn);
        return createdOn >= oneMonthAgo;
    });

    // Already seen
    const existingPost = db.find(post => post.Hash === h);

    if (existingPost) {
        console.log("Post already seen");
        return false;
    }

    // Add new post
    db.push({
        Hash: h,
        CreatedOn: dateTimeCreated
    });

    // Save back to disk
    fs.writeFileSync(
        SEEN_FILE,
        JSON.stringify(db, null, 2),
        "utf8"
    );

    return true;
}

(async () => {
    const context = await chromium.launchPersistentContext(
        './x-profile',
        {
            headless: true,
            args: ['--disable-blink-features=AutomationControlled']
        }
    );
    
    console.log("Starting playwright script to read tweets from x.com");
    const page = context.pages()[0] ?? await context.newPage();
    await page.goto('https://x.com/mimi_3mi');

    // for clicking on show more later, setup for loop per tweet
    const containerTestId = "tweet";
    const textTestId = "tweetText";
    const showMoreTestId = "tweet-text-show-more-link";
    const timeTestId = "User-Name"

    // A pinned tweet is located within a tweet, with a div of this test-id, with innerText as Pinned
    // Will be used for skip reading pinned tweets later
    const isPinnedTweetTestId = "socialContext"

    // time info is located within the div test-id "User-Name"
    // <time datetime="2026-10-18T06:23:25.000Z">1h</time>


    const tweets = page.locator(`[data-testid="${containerTestId}"]`);

    for (let i = 0; i < POSTS_TO_READ; i++) {
        console.log(`Grabbing post no: ${i}`);
        try {
            // grabs content
            const tweet = tweets.nth(i);
            const textElement = tweet.locator(`[data-testid="${textTestId}"]`).first();
            const showMoreElement = tweet.locator(`[data-testid="${showMoreTestId}"]`);

            if (await showMoreElement.count() > 0) {
                await showMoreElement.click();
            }
            const textContent = await textElement.innerText();
            console.log("Content:");
            console.log(textContent);
            
            // grab time if possible, if not, just continue to next tweet
            let dateTimeCreated = "<no time found>";
            try {
                const userNameElement = tweet.locator(`[data-testid="${timeTestId}"]`).first();
                const timeElement = await userNameElement.locator('time').first();
                dateTimeCreated = await timeElement.getAttribute('datetime');
                
                console.log("Created On:");
                console.log(dateTimeCreated);
            } catch (error) {
                console.log("Couldn't locate a time element for this tweet");
            }

            // add to references (isAdded bool for future use, if needed)
            const isAdded = addToReferences(textContent, dateTimeCreated);

            // after each post scroll the viewport down to the next post, so that the next post is visible and can be read
            await tweet.scrollIntoViewIfNeeded();
        } catch (error) {
            console.log(error);
            continue
        }        
    }

    await context.close();
})();