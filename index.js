const express = require("express");
const fetch = require("node-fetch");

const app = express();

// Middleware
app.use(express.json({ limit: "5mb" }));

// ===============================
// Health Check Route
// ===============================
app.get("/", (req, res) => {
  res.status(200).send("Auriq Worker Running ✅");
});

// ===============================
// Process Route (Basic Version)
// ===============================
app.post("/process", async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Missing text"
      });
    }

    if (!process.env.SARVAM_API_KEY) {
      return res.status(500).json({
        error: "SARVAM_API_KEY not configured"
      });
    }

    console.log("Processing text length:", text.length);

    // Example Sarvam call (adjust endpoint if needed)
    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SARVAM_API_KEY}`
      },
      body: JSON.stringify({
        text: text,
        voice: voice || "default"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam error:", errorText);
      return res.status(500).json({
        error: "Sarvam API failed",
        details: errorText
      });
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Worker error:", error.message);

    return res.status(500).json({
      error: "Worker failed",
      message: error.message
    });
  }
});

// ===============================
// Server Start
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Auriq Worker running on port ${PORT}`);
});