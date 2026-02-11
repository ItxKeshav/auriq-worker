require("dotenv").config()
const express = require("express")
const axios = require("axios")

const app = express()
app.use(express.json())

// Root
app.get("/", (req, res) => {
  res.status(200).send("Auriq Worker Running ✅")
})

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

/*
  MAIN PROCESS ROUTE
  This will receive chapter data from Auriq frontend
*/
app.post("/process-chapter", async (req, res) => {
  try {
    const { chapterId, text } = req.body

    if (!chapterId || !text) {
      return res.status(400).json({ error: "Missing chapterId or text" })
    }

    console.log("Processing chapter:", chapterId)

    // Basic chunking (safe)
    const chunkSize = 300
    const chunks = []

    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize))
    }

    console.log(`Total chunks: ${chunks.length}`)

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`)

      // Simulated delay (replace later with Sarvam call)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return res.json({
      success: true,
      message: "Chapter processed successfully",
      totalChunks: chunks.length
    })

  } catch (error) {
    console.error("Processing error:", error)
    return res.status(500).json({ error: "Worker crashed" })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`)
})