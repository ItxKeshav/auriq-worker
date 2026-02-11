const express = require("express");
require("dotenv").config();

const app = express();

app.use(express.json({ limit: "10mb" }));

// ==============================
// HEALTH ROUTE
// ==============================
app.get("/", (req, res) => {
  res.status(200).send("Auriq Worker Running ✅");
});

// ==============================
// SIMPLE TEXT CHUNK FUNCTION
// ==============================
function chunkText(text, size = 300) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// ==============================
// PROCESS ROUTE
// ==============================
app.post("/process", async (req, res) => {
  try {
    const { chapterId, text, voice } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!process.env.SARVAM_API_KEY) {
      return res.status(500).json({ error: "SARVAM_API_KEY missing" });
    }

    console.log("Processing chapter:", chapterId);
    console.log("Text length:", text.length);

    const chunks = chunkText(text);

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20 sec timeout

      try {
        const response = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.SARVAM_API_KEY}`
          },
          body: JSON.stringify({
            text: chunks[i],
            voice: voice || "default"
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Sarvam API error:", errorText);
          return res.status(500).json({
            error: "Sarvam API failed",
            details: errorText
          });
        }

        console.log(`Chunk ${i + 1} completed`);
      } catch (err) {
        clearTimeout(timeout);

        if (err.name === "AbortError") {
          console.error("Chunk timeout");
          return res.status(500).json({
            error: "Chunk timeout"
          });
        }

        console.error("Chunk processing error:", err.message);
        return res.status(500).json({
          error: "Chunk failed",
          message: err.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Chapter processed successfully"
    });

  } catch (error) {
    console.error("Worker crashed:", error.message);
    return res.status(500).json({
      error: "Worker crashed",
      message: error.message
    });
  }
});

// ==============================
// START SERVER (Railway Safe)
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Auriq Worker running on port ${PORT}`);
});