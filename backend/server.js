require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

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

async function callAI(messages) {
  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!apiUrl || !apiKey || !model) {
    throw new Error("AI environment variables are not configured.");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  return data?.choices?.[0]?.message?.content || "";
}

function extractJSON(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }

    throw new Error("AI returned invalid JSON.");
  }
}

app.post("/api/study", async (req, res) => {
  try {
    const input = String(req.body?.input || "").trim();

    if (!input) {
      return res.status(400).json({
        ok: false,
        message: "Input is required."
      });
    }

    const prompt = `
You are StudyAI inside an English-learning platform.

Analyze the learner's English carefully.

Return ONLY valid JSON with this structure:
{
  "original": "",
  "corrected": "",
  "explanation": "",
  "rule": "",
  "betterVersion": "",
  "examples": [],
  "practice": []
}

Explain the mistake clearly at the learner's level.
Do not invent an error if the sentence is already correct.
`;

    const result = await callAI([
      { role: "system", content: prompt },
      { role: "user", content: input }
    ]);

    const parsed = extractJSON(result);

    res.json({
      ok: true,
      data: parsed
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

app.post("/api/speakmate/analyse", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({
        ok: false,
        message: "Speech transcript is required."
      });
    }

    const prompt = `
You are SpeakMate, an English speaking coach.

Analyze the learner's transcript.

Return ONLY valid JSON:
{
  "correctedSentence": "",
  "grammar": [],
  "vocabulary": [],
  "fluency": {
    "score": null,
    "feedback": "",
    "improvements": []
  },
  "pronunciation": {
    "score": null,
    "feedback": "",
    "limitations": ""
  },
  "naturalVersion": "",
  "repeatPrompt": ""
}

For grammar errors include:
original, error, correction, why, rule.

Do NOT claim to accurately score pronunciation from transcript alone.
If audio is not provided, pronunciation score must be null.
`;

    const result = await callAI([
      { role: "system", content: prompt },
      { role: "user", content: text }
    ]);

    const parsed = extractJSON(result);

    res.json({
      ok: true,
      data: parsed
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

app.post("/api/ielts/analyse", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    const part = String(req.body?.part || "");
    const question = String(req.body?.question || "");

    if (!text) {
      return res.status(400).json({
        ok: false,
        message: "IELTS answer is required."
      });
    }

    const prompt = `
You are an IELTS Speaking practice examiner.

Analyze the learner's answer using the four IELTS Speaking criteria:

1. Fluency and Coherence
2. Lexical Resource
3. Grammatical Range and Accuracy
4. Pronunciation

Return ONLY valid JSON:
{
  "overall": {
    "bandEstimate": null,
    "summary": ""
  },
  "fluency": {
    "score": null,
    "feedback": "",
    "evidence": [],
    "improvements": []
  },
  "lexicalResource": {
    "score": null,
    "feedback": "",
    "evidence": [],
    "improvements": []
  },
  "grammar": {
    "score": null,
    "feedback": "",
    "errors": []
  },
  "pronunciation": {
    "score": null,
    "feedback": "",
    "limitations": ""
  },
  "improvedAnswer": "",
  "repeatPrompt": ""
}

For grammar errors use:
{
  "original": "",
  "error": "",
  "correction": "",
  "why": "",
  "rule": "",
  "better": ""
}

Do not fabricate pronunciation evidence.
If only transcript text is provided and no audio analysis is available,
pronunciation.score must be null and limitations must explain this.

The result is a practice estimate, NOT an official IELTS score.

Part: ${part}
Question: ${question}
`;

    const result = await callAI([
      { role: "system", content: prompt },
      { role: "user", content: text }
    ]);

    const parsed = extractJSON(result);

    res.json({
      ok: true,
      data: parsed
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`LingoUp backend running on port ${PORT}`);
});
