// run node --env-file=.env ./telegram.js
const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);


// --------------------------------------------------
// Import Scraper
// --------------------------------------------------
const { ReadTweets } = require("./scrapper.js");

// async function ReadTweets() {
//     // Your Playwright scraper here.

//     // Ideally return something usable rather than only console.log().
//     return [
//         {
//             content: "Example tweet content",
//             createdOn: "2026-10-13T06:39:15.000Z"
//         }
//     ];
// }


// --------------------------------------------------
// Formatting helper
// --------------------------------------------------

let LastQueriedTime = null; // resets when the bot restarts, but that's okay for now
function formatTweets(tweets) {
    if (!tweets || tweets.length === 0) {
        return "No new tweets found.";
    }

    const tmpTime = new Date();
    const tmpLastTime = LastQueriedTime;
    LastQueriedTime = tmpTime;

    return (
    tweets.map((tweet, index) => {
        return (
            `Post ${index + 1}\n` +
            `${tweet.createdOn}\n\n` +
            `${tweet.content}\n\n` +
            `Link: ${tweet.url}\n\n`
        );
    })
    .join("\n\n--------------------\n\n")
    +
    "\n\n--------------------\n\n" +
    "This bot was last queried at: " +
    (tmpLastTime ? tmpLastTime.toISOString() : "Never")
);
}


// --------------------------------------------------
// Shared CheckTweets logic
// --------------------------------------------------

async function checkTweets() {
    const tweets = await ReadTweets();
    return formatTweets(tweets);
}


// --------------------------------------------------
// /start
// --------------------------------------------------

bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text("Check Tweets", "check_tweets");

    await ctx.reply(
        "Tweet checker ready.\n\n" +
        "Commands:\n" +
        "/checktweets - Check for tweets\n" +
        "/help - Show help\n\n" +
        "You can also use me inline:\n" +
        "@MIMI_mi3bot CheckTweets",
        {
            reply_markup: keyboard
        }
    );
});


// --------------------------------------------------
// /help
// --------------------------------------------------

bot.command("help", async (ctx) => {
    await ctx.reply(
        "Available commands:\n\n" +
        "/checktweets - Check the monitored X account\n" +
        "/help - Show this message\n\n" +
        "Inline usage:\n" +
        "@MIMI_mi3bot CheckTweets"
    );
});


// --------------------------------------------------
// /checktweets
// --------------------------------------------------

bot.command("checktweets", async (ctx) => {
    await ctx.reply("Checking tweets...");

    try {
        const result = await checkTweets();
        await ctx.reply(result);
    }
    catch (error) {
        console.error(error);

        await ctx.reply(
            "Something went wrong while checking tweets."
        );
    }
});


// --------------------------------------------------
// Button from /start
// --------------------------------------------------

bot.callbackQuery("check_tweets", async (ctx) => {
    await ctx.answerCallbackQuery();

    await ctx.reply("Checking tweets...");

    try {
        const result = await checkTweets();
        await ctx.reply(result);
    }
    catch (error) {
        console.error(error);
        await ctx.reply("Something went wrong while checking tweets.");
    }
});


// --------------------------------------------------
// Normal direct messages
//
// Allows:
//
// CheckTweets
// checktweets
// CHECKTWEETS
// --------------------------------------------------

bot.hears(/^checktweets$/i, async (ctx) => {
    await ctx.reply("Checking tweets...");

    try {
        const result = await checkTweets();
        await ctx.reply(result);
    }
    catch (error) {
        console.error(error);
        await ctx.reply("Something went wrong while checking tweets.");
    }
});


// --------------------------------------------------
// INLINE MODE
//
// User types:
//
// @MIMI_mi3bot CheckTweets
// --------------------------------------------------

bot.on("inline_query", async (ctx) => {
    const query = ctx.inlineQuery.query.trim().toLowerCase();

    if (query !== "checktweets") {
        await ctx.answerInlineQuery([
            {
                type: "article",
                id: "help",
                title: "Check Tweets",
                description: "Type CheckTweets to check the monitored account.",
                input_message_content: {
                    message_text:
                        "Use:\n@MIMI_mi3bot CheckTweets"
                }
            }
        ]);

        return;
    }

    try {
        const result = await checkTweets();

        await ctx.answerInlineQuery(
            [
                {
                    type: "article",
                    id: "checktweets-result",
                    title: "Tweet Check Result",
                    description: "Send the latest tweet check result",
                    input_message_content: {
                        message_text: result
                    }
                }
            ],
            {
                cache_time: 0
            }
        );
    }
    catch (error) {
        console.error(error);

        await ctx.answerInlineQuery(
            [
                {
                    type: "article",
                    id: "checktweets-error",
                    title: "Couldn't check tweets",
                    input_message_content: {
                        message_text:
                            "Something went wrong while checking tweets."
                    }
                }
            ],
            {
                cache_time: 0
            }
        );
    }
});


// --------------------------------------------------
// Start Telegram bot
// --------------------------------------------------

bot.start();

console.log("Telegram bot started.");