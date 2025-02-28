const { OpenAI } = require("openai");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

// Replace with your Telegram Bot API token
const telegramToken = "7369552148:AAF6VlLVaAf5CvyeOyKCy9zu4M16OmuotlA";
const channelUsername = "@Xusniddin_m3";

// OpenAI API Configuration
const baseURL = "https://openrouter.ai/api/v1";
const apiKey = "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";
const systemPrompt = "This year is 2025. You are a content creator for a popular tech blog. Always have a hashtag at the footer saying #generatedbyAI. Make your responses as beautiful and interesting as possible. Use bold, italic, underlined letters if neccessary. Write a short and engaging post (100-150 words) about a trending topic in these following topics:";

// Initialize the Telegram bot
const bot = new TelegramBot(telegramToken, { polling: false });
const api = new OpenAI({ apiKey, baseURL });

// Topics pool
const topics = [
  "Latest advancements in frontend engineering",
  "Effective workout routines for muscle growth",
  "How to stay consistent with coding",
  "Best places to visit in Europe",
  "Breaking tech news of the day",
  "Nutrition tips for gym-goers",
  "A new JavaScript framework you should know about",
  "Top travel destinations for adventure seekers",
];

// Function to generate AI response
async function generatePost() {
  try {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const completion = await api.chat.completions.create({
      model: "deepseek/deepseek-chat:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Write a short and engaging post (100-150 words) about: ${randomTopic}` },
      ],
      temperature: 0.7,
      max_tokens: 350,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      console.error("Error generating post:", error.response.data);
    } else {
      console.error("Error generating post:", error.message);
    }
    return null;
  }
}

// Function to send a message to the Telegram channel
async function sendMessageToChannel(message) {
  try {
    await bot.sendMessage(channelUsername, message);
    console.log(`Message sent to channel: ${message}`);
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
}

// Schedule a post every day at 10 AM
cron.schedule("21 15 * * *", async () => {
  console.log("Generating daily post...");
  const post = await generatePost();
  if (post) {
    await sendMessageToChannel(post);
  }
});

console.log("Daily Telegram post scheduler is running...");
