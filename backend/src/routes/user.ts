import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import { getServiceAccount } from '../util/serviceAccount';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AVAILABLE_TOPICS = [
  'Teamwork', 'Problem Solving', 'Adaptability',
  'Communication', 'Leadership', 'Project Management',
];

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

    // Ask Gemini to suggest relevant topics based on resume content
    let suggestedGoals: string[] = [];
    try {
      const geminiResult = await geminiModel.generateContent([
        {
          inlineData: {
            data: req.file.buffer.toString('base64'),
            mimeType: 'application/pdf',
          },
        },
        `You are an interview coach. Based on this resume, suggest up to 3 interview practice topics from this exact list: ${AVAILABLE_TOPICS.join(', ')}. Return ONLY a JSON array, e.g. ["Teamwork","Leadership"]. Only include topics from the list.`,
      ]);
      const raw = geminiResult.response.text().trim();
      const match = raw.match(/\[[\s\S]*?\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as string[];
        suggestedGoals = parsed.filter(t => AVAILABLE_TOPICS.includes(t)).slice(0, 3);
      }
    } catch {
      // Non-critical — user can still pick topics manually
    }

    user.resumeGcsKey = gcsKey;
    await user.save();

    res.json({ resumeGcsKey: gcsKey, suggestedGoals });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ message: 'Failed to upload resume' });
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

export default router;
