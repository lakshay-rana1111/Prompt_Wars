import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { buildCandidateProfile, generateIndependentOpinion, runDebate, synthesizeFinalDecision } from "./llm.js";
import { normalizeText, parsePdfBuffer } from "./parsing.js";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const port = Number(process.env.PORT ?? 3000);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

function readBodyFile(filePath: string) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  return readFile(absolute, "utf8");
}

async function extractText(file: Express.Multer.File) {
  const lower = file.originalname.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return normalizeText(await parsePdfBuffer(file.buffer));
  }
  return normalizeText(file.buffer.toString("utf8"));
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/analyze", upload.fields([
  { name: "jobDescription", maxCount: 1 },
  { name: "resumeA", maxCount: 1 },
  { name: "resumeB", maxCount: 1 },
  { name: "transcriptA", maxCount: 1 },
  { name: "transcriptB", maxCount: 1 },
]), async (req, res) => {
  try {
    const files = req.files as Record<string, Express.Multer.File[] | undefined>;
    const getFile = (name: string) => files[name]?.[0];

    const jobDescriptionFile = getFile("jobDescription");
    const resumeA = getFile("resumeA");
    const resumeB = getFile("resumeB");
    const transcriptA = getFile("transcriptA");
    const transcriptB = getFile("transcriptB");

    if (!jobDescriptionFile || !resumeA || !resumeB || !transcriptA || !transcriptB) {
      return res.status(400).json({ error: "Missing required files." });
    }

    const jobDescription = await extractText(jobDescriptionFile);
    const inputs = [
      { id: "A", resume: await extractText(resumeA), transcript: await extractText(transcriptA) },
      { id: "B", resume: await extractText(resumeB), transcript: await extractText(transcriptB) },
    ];

    const results = [];
    for (const candidate of inputs) {
      const profile = await buildCandidateProfile(ai, jobDescription, candidate.resume, candidate.transcript);
      const initialOpinions = await Promise.all([
        generateIndependentOpinion(ai, "technical", profile, jobDescription),
        generateIndependentOpinion(ai, "hr_culture", profile, jobDescription),
        generateIndependentOpinion(ai, "hiring_manager", profile, jobDescription),
        generateIndependentOpinion(ai, "skeptic", profile, jobDescription),
      ]);
      const debate = await runDebate(ai, jobDescription, profile, initialOpinions);
      const finalDecision = await synthesizeFinalDecision(ai, jobDescription, profile, initialOpinions, debate);
      results.push({ candidateId: candidate.id, profile, initialOpinions, debate, finalDecision });
    }

    res.json({ jobDescription, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Interview Panel App</title><style>body{font-family:system-ui;margin:40px;max-width:900px}textarea,input,button{width:100%;margin:8px 0;padding:10px}pre{white-space:pre-wrap;background:#111;color:#eee;padding:16px;border-radius:8px}</style></head><body><h1>Interview Panel App</h1><p>Upload JD, resumes, and transcripts via <code>/api/analyze</code>.</p></body></html>`);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
