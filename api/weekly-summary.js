const { OpenAI } = require("openai");
const TelegramBot = require("node-telegram-bot-api");

// Initialize Telegram bot and OpenAI client
const telegramToken = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = "https://openrouter.ai/api/v1";

const bot = new TelegramBot(telegramToken, { polling: false });
const api = new OpenAI({ apiKey, baseURL });

const channelUsername = "@Xusniddin_m3";

// Function to generate a placeholder weekly summary
async function generateWeeklySummary() {
  try {
    const completion = await api.chat.completions.create({
      model: "deepseek/deepseek-chat:free",
      messages: [
        { role: "user", content: "Generate a short weekly summary (100-150 words) for a tech blog Telegram channel, highlighting key trends or topics in tech for the past week. Include #generatedbyAI at the end." },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating weekly summary:", error.message);
    return null;
  }
}

// Function to send a message to the Telegram channel
async function sendMessageToChannel(message) {
  try {
    await bot.sendMessage(channelUsername, message);
    console.log("Weekly summary sent to channel:", channelUsername);
  } catch (error) {
    console.error("Error sending weekly summary to Telegram:", error.message);
    if (error.response) {
      console.error("Telegram API response:", error.response.body);
    }
  }
}

// Serverless function handler
module.exports = async (req, res) => {
  console.log("Weekly summary function triggered");

  const summary = await generateWeeklySummary();
  if (summary) {
    await sendMessageToChannel(summary);
    res.status(200).json({ message: "Weekly summary sent successfully", summary });
  } else {
    res.status(500).json({ error: "Failed to generate weekly summary" });
  }
};