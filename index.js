require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/process", async (req, res) => {
  const { chapterId, text, voice } = req.body;

  console.log("Processing chapter:", chapterId);

  try {
    const chunks = chunkText(text);

    for (let i = 0; i < chunks.length; i++) {
      await generateChunk(chunks[i], voice);
      console.log(`Chunk ${i+1}/${chunks.length} done`);
    }

    res.json({ status: "completed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Worker failed" });
  }
});

function chunkText(text) {
  return text.match(/.{1,300}(\.|।|!|\?)/g) || [];
}

async function generateChunk(text, voice) {
  await axios.post("https://api.sarvam.ai/text-to-speech", {
    text,
    voice
  }, {
    headers: {
      "Authorization": `Bearer ${process.env.SARVAM_API_KEY}`
    }
  });
}

app.listen(3000, () => {
  console.log("Worker running on port 3000");
});