const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "LingoUp Backend",
    message: "LingoUp AI backend is running."
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "LingoUp",
    status: "healthy"
  });
});

app.post("/api/study", async (req, res) => {
  res.status(501).json({
    ok: false,
    message: "StudyAI will be connected to the real AI provider in the next backend step."
  });
});

app.post("/api/speakmate/analyse", async (req, res) => {
  res.status(501).json({
    ok: false,
    message: "SpeakMate AI analysis will be connected in the next backend step."
  });
});

app.post("/api/ielts/analyse", async (req, res) => {
  res.status(501).json({
    ok: false,
    message: "IELTS AI analysis will be connected in the next backend step."
  });
});

app.listen(PORT, () => {
  console.log(`LingoUp backend running on port ${PORT}`);
});
