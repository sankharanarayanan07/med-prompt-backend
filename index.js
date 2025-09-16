require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini client with API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function makeGeminiRequest(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    // Defensive extraction for text
    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.text ||
      "No answer returned from Gemini.";
    return text;
  } catch (error) {
    console.error("Gemini API error:", error.response?.data || error.message);
    throw error;
  }
}

// Express setup
const app = express();
app.use(cors());
app.use(bodyParser.json());

// /chat endpoint: expects JSON { "prompt": "Your question here" }
app.post("/chat", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Please provide a prompt in the request body." });
  }

  try {
    const text = await makeGeminiRequest(prompt);
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: "Error generating completion from Gemini" });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
