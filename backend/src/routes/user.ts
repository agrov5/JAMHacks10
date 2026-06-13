import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import { getServiceAccount } from '../util/serviceAccount';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

const sa = getServiceAccount();
const storage = new Storage({
  projectId: sa.project_id,
  credentials: { client_email: sa.client_email, private_key: sa.private_key },
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// PUT /api/user/resume — upload or replace a user's resume
router.put('/resume', upload.single('resume'), async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) { res.status(400).json({ message: 'userId is required' }); return; }
  if (!req.file) { res.status(400).json({ message: 'No resume file provided' }); return; }

  try {
    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    // Delete old resume from GCS if one exists
    if (user.resumeGcsKey) {
      try { await bucket.file(user.resumeGcsKey).delete(); } catch { /* already gone */ }
    }

    // Upload new resume
    const gcsKey = `resumes/${userId}-${Date.now()}.pdf`;
    const gcsFile = bucket.file(gcsKey);
    await gcsFile.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype || 'application/pdf' },
    });

    // Ask Gemini to suggest topics and extract location from resume
    let suggestedGoals: string[] = [];
    let extractedLocation: string | null = null;
    try {
      const geminiResult = await geminiModel.generateContent([
        {
          inlineData: {
            data: req.file.buffer.toString('base64'),
            mimeType: 'application/pdf',
          },
        },
        `You are an expert interview coach. Analyse this resume and return a JSON object with two keys:
1. "topics": an array of 4–6 specific interview practice topics tailored to this candidate's background (2–4 words each, e.g. "System Design", "Python Development").
2. "location": the candidate's current city/region if clearly stated on the resume (e.g. "San Francisco, CA"), or null if not found.
Return ONLY valid JSON, no extra text. Example: {"topics":["System Design","Python Development"],"location":"Toronto, ON"}`,
      ]);
      const raw = geminiResult.response.text().trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { topics?: string[]; location?: string | null };
        if (Array.isArray(parsed.topics)) suggestedGoals = parsed.topics.slice(0, 6);
        if (parsed.location) extractedLocation = parsed.location;
      }
    } catch {
      // Non-critical — user can still pick topics manually
    }

    user.resumeGcsKey = gcsKey;
    if (extractedLocation) user.location = extractedLocation;
    await user.save();

    res.json({ resumeGcsKey: gcsKey, suggestedGoals, extractedLocation });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ message: 'Failed to upload resume' });
  }
});

// GET /api/user/:userId/resume-suggestions — re-run Gemini on stored resume
router.get('/:userId/resume-suggestions', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).select('resumeGcsKey');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    if (!user.resumeGcsKey) { res.status(404).json({ message: 'No resume on file' }); return; }

    const [buffer] = await bucket.file(user.resumeGcsKey).download();

    let suggestedGoals: string[] = [];
    const geminiResult = await geminiModel.generateContent([
      { inlineData: { data: buffer.toString('base64'), mimeType: 'application/pdf' } },
      `You are an expert interview coach. Analyse this resume and suggest 4–6 specific interview practice topics tailored to this candidate's background, skills, and experience level. Topics should be concise (2–4 words) and directly relevant to the person's career (e.g. "System Design", "Product Analytics", "Cross-team Collaboration", "Python Development"). Return ONLY a valid JSON array of strings, no extra text.`,
    ]);
    const raw = geminiResult.response.text().trim();
    const match = raw.match(/\[[\s\S]*?\]/);
    if (match) suggestedGoals = (JSON.parse(match[0]) as string[]).slice(0, 6);

    res.json({ suggestedGoals });
  } catch (err) {
    console.error('Resume suggestions error:', err);
    res.status(500).json({ message: 'Failed to generate suggestions' });
  }
});

// GET /api/user/:userId/profile
router.get('/:userId/profile', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const sessions = await Session.find({ userId }).sort({ createdAt: -1 });

    let resumeUrl: string | null = null;
    if (user.resumeGcsKey) {
      try {
        [resumeUrl] = await bucket.file(user.resumeGcsKey).getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });
      } catch { /* file missing from bucket */ }
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        location: user.location ?? null,
        createdAt: user.createdAt,
      },
      resumeUrl,
      hasResume: !!user.resumeGcsKey,
      sessions,
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// PATCH /api/user/:userId — update editable profile fields (location)
router.patch('/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { location } = req.body as { location?: string };
  try {
    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    if (location !== undefined) user.location = location.trim() || null;
    await user.save();
    res.json({ location: user.location ?? null });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;
