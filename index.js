require("dotenv").config()
const express = require("express")
const axios = require("axios")

const app = express()
app.use(express.json())

// ---------------------------
// BASIC ROUTES
// ---------------------------

app.get("/", (req, res) => {
  res.status(200).send("Auriq Worker Running ✅")
})

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

// ---------------------------
// SAFE SENTENCE CHUNKING
// ---------------------------

function chunkText(text, maxLength = 300) {
  const sentences = text.split(/(?<=[.?!।])/g)
  const chunks = []
  let current = ""

  for (let sentence of sentences) {
    if ((current + sentence).length <= maxLength) {
      current += sentence
    } else {
      if (current) chunks.push(current.trim())
      current = sentence
    }
  }

  if (current) chunks.push(current.trim())
  return chunks
}

// ---------------------------
// SARVAM CALL WITH RETRY
// ---------------------------

async function callSarvamTTS(text, retryCount = 0) {
  const MAX_RETRIES = 3

  try {
    const response = await axios.post(
      "https://api.sarvam.ai/v1/tts", // confirm endpoint from docs
      {
        text: text,
        voice: "shubh", // replace later dynamically
        format: "mp3"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SARVAM_API_KEY}`
        },
        timeout: 20000 // 20 sec timeout
      }
    )

    return response.data

  } catch (error) {
    const status = error.response?.status

    // Handle rate limit
    if (status === 429 && retryCount < MAX_RETRIES) {
      console.log("Rate limited. Retrying...")
      await new Promise(r => setTimeout(r, 2000))
      return callSarvamTTS(text, retryCount + 1)
    }

    // Retry other network errors
    if (retryCount < MAX_RETRIES) {
      console.log("Retrying chunk...")
      await new Promise(r => setTimeout(r, 1000))
      return callSarvamTTS(text, retryCount + 1)
    }

    throw error
  }
}

// ---------------------------
// MAIN PROCESS ROUTE
// ---------------------------

app.post("/process-chapter", async (req, res) => {
  try {
    const { chapterId, text } = req.body

    if (!chapterId || !text) {
      return res.status(400).json({ error: "Missing chapterId or text" })
    }

    console.log("Processing chapter:", chapterId)

    const chunks = chunkText(text, 300)

    console.log(`Total chunks: ${chunks.length}`)

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`)

      // REAL SARVAM CALL
      await callSarvamTTS(chunks[i])
    }

    return res.json({
      success: true,
      message: "Chapter processed successfully",
      totalChunks: chunks.length
    })

  } catch (error) {
    console.error("Processing error:", error.message)

    return res.status(500).json({
      error: "Processing failed",
      details: error.message
    })
  }
})

// ---------------------------
// SERVER START
// ---------------------------

const PORT = process.env.PORT || 3000

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`)
})