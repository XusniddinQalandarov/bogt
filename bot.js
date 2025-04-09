// Load environment variables from tokens.env
require("dotenv").config({ path: "./tokens.env" });

// Import required packages
const { OpenAI } = require("openai");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const fs = require("fs");

// Debug: Log the environment variables to confirm they are loaded
console.log("TELEGRAM_TOKEN:", process.env.TELEGRAM_TOKEN);
console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY);

// Configuration variables
const channelUsername = "@Xusniddin_m3";
const telegramToken = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = "https://openrouter.ai/api/v1";

// Validate environment variables
if (!telegramToken || !apiKey) {
  console.error("Error: Missing required environment variables.");
  console.error("TELEGRAM_TOKEN:", telegramToken);
  console.error("OPENROUTER_API_KEY:", apiKey);
  process.exit(1); // Exit the process if variables are missing
}

// Initialize Telegram bot and OpenAI client
const bot = new TelegramBot(telegramToken, { polling: false });
const api = new OpenAI({ apiKey, baseURL });

// System prompt for generating posts
const systemPrompt = `This year is 2025. You are a content creator for a popular tech blog. Always have a hashtag at the footer saying #generatedbyAI. Make your responses as beautiful and interesting as possible. Use bold, italic, underlined letters if necessary. Write a short and engaging post (100-150 words) about a trending topic in these following topics:`;

// List of topics for generating posts
const topics = [
  "Essential RxJS patterns every developer should know",
  "How AI is transforming frontend development",
  "Mastering Angular: Tips for writing clean and efficient code",
  "The best JavaScript libraries for 2025",
  "Common fitness mistakes that slow muscle growth",
  "The science behind muscle recovery and optimal rest",
  "How to stay motivated as a self-taught developer",
  "Top productivity tools for software engineers",
  "Hidden gems in Europe you must visit",
  "The impact of WebAssembly on modern web development",
  "How cybersecurity threats are evolving in 2025",
  "The rise of edge computing and its effect on frontend performance",
  "Essential supplements for strength training",
  "How to optimize your gym diet for maximum gains",
  "Best coding habits for mastering new frameworks quickly",
  "The future of virtual reality in online shopping",
  "The impact of AI on the future of work",
  "The most anticipated tech releases of 2025",
  "The future of AI in healthcare",
  "The role of blockchain in the future of finance",
  "The best hiking trails in Europe",
  "Latest advancements in frontend engineering",
  "Effective workout routines for muscle growth",
  "How to stay consistent with coding",
  "Best places to visit in Europe",
  "Breaking tech news of the day",
  "Nutrition tips for gym-goers",
  "A new JavaScript framework you should know about",
  "Top travel destinations for adventure seekers",
];

// File to log posts
const postsLogFile = "posts_log.txt";
const languages = ["English", "Russian", "Uzbek"];

// Function to generate a post
async function generatePost() {
  const topic = topics[Math.floor(Math.random() * topics.length)];

  const completion = await api.chat.completions.create({
    model: "deepseek/deepseek-chat:free",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Write a short and engaging post (100-150 words) about: ${topic}` },
    ],
    temperature: 0.7,
    max_tokens: 350,
  });

  const content = completion.choices[0].message.content;
  const hashtags = await generateHashtags(topic);
  const translated = await generateTranslatedPost(content + "\n" + hashtags, getRandomLanguage());
  return translated;
}

// Function to generate hashtags for a topic
async function generateHashtags(topic) {
  const completion = await api.chat.completions.create({
    model: "deepseek/deepseek-chat:free",
    messages: [
      { role: "user", content: `Generate 3-5 short and catchy hashtags for: ${topic}` },
    ],
    temperature: 0.7,
    max_tokens: 50,
  });
  return completion.choices[0].message.content;
}

// Function to translate a post into a random language
async function generateTranslatedPost(content, language) {
  if (language === "English") return content;
  const completion = await api.chat.completions.create({
    model: "deepseek/deepseek-chat:free",
    messages: [
      { role: "user", content: `Translate the following content to ${language}:\n${content}` },
    ],
    temperature: 0.5,
    max_tokens: 350,
  });
  return completion.choices[0].message.content;
}

// Function to get a random language
function getRandomLanguage() {
  return languages[Math.floor(Math.random() * languages.length)];
}

// Function to send a message to the Telegram channel
async function sendMessageToChannel(message) {
  try {
    await bot.sendMessage(channelUsername, message);
    logPostToFile(message);
    console.log("Message sent to channel.");
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
}

// Function to log posts to a file
function logPostToFile(post) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(postsLogFile, `${timestamp}\n${post}\n\n`);
}

// Schedule daily post at 18:33
cron.schedule("41 18 * * *", async () => {
  console.log("Generating daily post...");
  const post = await generatePost();
  if (post) {
    await sendMessageToChannel(post);
  }
});

// Schedule weekly summary every Sunday at 10:00
cron.schedule("0 10 * * 0", async () => {
  console.log("Generating weekly summary...");
  const posts = fs.readFileSync(postsLogFile, "utf-8").trim().split(/\n\n+/).slice(-7);
  const summary = await generateWeeklySummary(posts);
  if (summary) await sendMessageToChannel(summary);
});

// Function to generate a weekly summary
async function generateWeeklySummary(posts) {
  const completion = await api.chat.completions.create({
    model: "deepseek/deepseek-chat:free",
    messages: [
      { role: "user", content: `Summarize these weekly posts into a digest format:\n${posts.join("\n\n")}` },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });
  return completion.choices[0].message.content;
}

// Log that the bot is running
console.log("Advanced AI Telegram bot is running...");