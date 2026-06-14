import { Router, Request, Response } from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { Storage } from '@google-cloud/storage';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getServiceAccount, GCPServiceAccount } from '../util/serviceAccount';
import { Session } from '../models/Session';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ANALYSIS_PROMPT = process.env.GEMINI_PROMPT ?? `You are an expert interview coach who evaluates both verbal responses and non-verbal communication.
Analyse the candidate's response and provide feedback using EXACTLY this markdown structure:

## Verbal Feedback

**Relevance & Content:** [Did the answer address the question directly? Was it substantive?]

**Clarity & Communication:** [Was the delivery clear, well-paced and easy to follow?]

**Structure:** [Was a framework like STAR used? Was the response organised logically?]

**Strengths:** [2–3 specific things done well]

**Areas for Improvement:** [2–3 specific, actionable points]

---

## Non-Verbal Communication

**📏 Spatial Distribution:** [Comment on face-to-camera distance and framing. If a score is provided, reference it explicitly.]

**👋 Hand Gestures:** [Comment on gesture use and whether it aided or distracted from the message. Reference score if provided.]

**👁️ Eye Contact:** [Comment on camera engagement and whether it conveyed confidence. Reference score if provided.]

**🧍 Posture:** [Comment on body alignment and professional presence. Reference score if provided.]

---

## Overall Score: [X/10]

[One sentence summary of the candidate's overall performance.]

Be specific, constructive, and concise. Do not skip any section.`;

function buildPromptWithAnalytics(basePrompt: string, analytics?: {
  spatialDistribution: number;
  handGestures: number;
  eyeContact: number;
  posture: number;
}): string {
  if (!analytics) return basePrompt;

  const scores = `

> **Real-time non-verbal scores captured during this session (0–100 scale):**
> - 📏 Spatial Distribution: **${analytics.spatialDistribution}/100**
> - 👋 Hand Gestures: **${analytics.handGestures}/100**
> - 👁️ Eye Contact: **${analytics.eyeContact}/100**
> - 🧍 Posture: **${analytics.posture}/100**
>
> Reference these scores directly in the Non-Verbal Communication section of your feedback.`;

  return basePrompt + scores;
}

function extractScore(feedback: string): number | null {
  const match = feedback.match(/overall\s*score[^0-9]*(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return val >= 1 && val <= 10 ? val : null;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

const router = Router();

ffmpeg.setFfmpegPath(ffmpegStatic ?? 'ffmpeg');

const sa: GCPServiceAccount = getServiceAccount();
const storage = new Storage({
  projectId: sa.project_id,
  credentials: { client_email: sa.client_email, private_key: sa.private_key },
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

function runFfmpeg(command: ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    command.on('end', () => resolve()).on('error', reject).run();
  });
}

function tmpFile(ext: string): string {
  return path.join(os.tmpdir(), `cipher-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
}

// ── POST /api/interview/submit (single question, legacy) ──────────────────────
router.post('/submit', upload.single('video'), async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ message: 'No video file provided' }); return; }

  const { userId, goals: goalsRaw, analytics: analyticsRaw } = req.body as { 
    userId?: string; 
    goals?: string;
    analytics?: string;
  };
  if (!userId) { res.status(400).json({ message: 'userId is required' }); return; }
  const goals: string[] = goalsRaw ? JSON.parse(goalsRaw) : [];
  const analytics = analyticsRaw ? JSON.parse(analyticsRaw) : undefined;

  const audioPath = tmpFile('.mp3');
  try {
    const gcsKey = `interviews/${Date.now()}.webm`;
    const gcsFile = bucket.file(gcsKey);
    await gcsFile.save(req.file.buffer, { metadata: { contentType: 'video/webm' } });

    const inputPath = tmpFile('.webm');
    fs.writeFileSync(inputPath, req.file.buffer);
    try {
      await runFfmpeg(ffmpeg(inputPath).noVideo().audioCodec('libmp3lame').audioBitrate('128k').output(audioPath));
    } finally {
      try { fs.unlinkSync(inputPath); } catch { /* ignore */ }
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath), { filename: 'audio.mp3', contentType: 'audio/mpeg' });
    form.append('model_id', 'scribe_v1_experimental');

    const sttResponse = await axios.post('https://api.elevenlabs.io/v1/speech-to-text', form,
      { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, ...form.getHeaders() } });

    const [videoUrl] = await gcsFile.getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    const transcript: string = sttResponse.data.text ?? '';

    const promptWithAnalytics = buildPromptWithAnalytics(ANALYSIS_PROMPT, analytics);
    const geminiResult = await geminiModel.generateContent(
      `${promptWithAnalytics}\n\nGoals: ${goals.join(', ')}\n\nTranscript:\n${transcript}`
    );
    const feedback = geminiResult.response.text();
    const overallScore = extractScore(feedback);
    const session = await Session.create({ userId, videoUrl, transcript, feedback, goals, overallScore });

    res.json({ sessionId: session._id, videoUrl, transcript, feedback, overallScore });
  } catch (err) {
    console.error('Interview submit error:', err);
    res.status(500).json({ message: 'Failed to process video' });
  } finally {
    try { fs.unlinkSync(audioPath); } catch { /* ignore */ }
  }
});

// ── POST /api/interview/questions ─────────────────────────────────────────────
router.post('/questions', async (req: Request, res: Response) => {
  const { topics, difficulty = 'Medium', count = 3 } = req.body as {
    topics?: string[];
    difficulty?: string;
    count?: number;
  };

  if (!topics?.length) { res.status(400).json({ message: 'topics is required' }); return; }

  try {
    const prompt = `Generate exactly ${count} unique behavioral or situational interview questions for a candidate.
Topics: ${topics.join(', ')}.
Difficulty: ${difficulty}.
Easy = straightforward "Tell me about a time…" questions.
Medium = STAR method responses with some complexity.
Hard = complex multi-part questions requiring deep reflection.
Return ONLY a valid JSON array of question strings, no numbering, no extra text.
Example: ["Question one?","Question two?","Question three?"]`;

    const result = await geminiModel.generateContent(prompt);
    const raw = result.response.text().trim();
    const match = raw.match(/\[[\s\S]*?\]/);
    const questions: string[] = match ? (JSON.parse(match[0]) as string[]) : [];
    res.json({ questions: questions.slice(0, count) });
  } catch (err) {
    console.error('Question generation error:', err);
    res.status(500).json({ message: 'Failed to generate questions' });
  }
});

// ── POST /api/interview/submit-batch ─────────────────────────────────────────
const batchFields = upload.fields(
  Array.from({ length: 10 }, (_, i) => ({ name: `video_${i}`, maxCount: 1 }))
);

interface BatchResult {
  sessionId: unknown;
  question: string;
  transcript: string;
  feedback: string;
  videoUrl: string;
  overallScore: number | null;
}

router.post('/submit-batch', batchFields, async (req: Request, res: Response) => {
  const { userId, goals: goalsRaw, questions: questionsRaw, difficulty = 'Medium', analytics: analyticsRaw } = req.body as {
    userId?: string;
    goals?: string;
    questions?: string;
    difficulty?: string;
    analytics?: string;
  };

  if (!userId) { res.status(400).json({ message: 'userId is required' }); return; }

  const goals: string[] = goalsRaw ? (JSON.parse(goalsRaw) as string[]) : [];
  const questions: string[] = questionsRaw ? (JSON.parse(questionsRaw) as string[]) : [];
  const analytics = analyticsRaw ? JSON.parse(analyticsRaw) : undefined;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  if (!files || Object.keys(files).length === 0) {
    res.status(400).json({ message: 'No video files provided' }); return;
  }

  const timestamp = Date.now();

  const processOne = async (index: number): Promise<BatchResult | null> => {
    const file = files[`video_${index}`]?.[0];
    if (!file) return null;

    const question = questions[index] ?? `Question ${index + 1}`;
    const audioPath = tmpFile('.mp3');
    const inputPath = tmpFile('.webm');

    try {
      const gcsKey = `interviews/${timestamp}-q${index}.webm`;
      const gcsFile = bucket.file(gcsKey);
      await gcsFile.save(file.buffer, { metadata: { contentType: 'video/webm' } });

      fs.writeFileSync(inputPath, file.buffer);
      try {
        await runFfmpeg(ffmpeg(inputPath).noVideo().audioCodec('libmp3lame').audioBitrate('128k').output(audioPath));
      } finally {
        try { fs.unlinkSync(inputPath); } catch { /* ignore */ }
      }

      const form = new FormData();
      form.append('file', fs.createReadStream(audioPath), { filename: 'audio.mp3', contentType: 'audio/mpeg' });
      form.append('model_id', 'scribe_v1_experimental');

      const [sttResponse, [videoUrl]] = await Promise.all([
        axios.post('https://api.elevenlabs.io/v1/speech-to-text', form,
          { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, ...form.getHeaders() } }),
        gcsFile.getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
      ]);

      const transcript: string = sttResponse.data.text ?? '';

      const promptWithAnalytics = buildPromptWithAnalytics(ANALYSIS_PROMPT, analytics);
      const geminiResult = await geminiModel.generateContent(
        `${promptWithAnalytics}\n\nQuestion: ${question}\nDifficulty: ${difficulty}\nGoals: ${goals.join(', ')}\n\nCandidate's Transcript:\n${transcript}`
      );
      const feedback = geminiResult.response.text();
      const overallScore = extractScore(feedback);
      const session = await Session.create({ userId, question, videoUrl, transcript, feedback, goals, overallScore });

      return { sessionId: session._id, question, transcript, feedback, videoUrl, overallScore };
    } finally {
      try { fs.unlinkSync(audioPath); } catch { /* ignore */ }
    }
  };

  try {
    const settled = await Promise.allSettled(questions.map((_, i) => processOne(i)));
    const results = settled
      .filter((r): r is PromiseFulfilledResult<BatchResult | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((v): v is BatchResult => v !== null);

    res.json({ results });
  } catch (err) {
    console.error('Batch submit error:', err);
    res.status(500).json({ message: 'Failed to process interview' });
  }
});

export default router;
