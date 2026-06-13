import { Router, Request, Response } from 'express';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

interface RawJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_apply_link?: string;
  job_employment_type?: string;
}

// GET /api/jobs/search?topics=Leadership,System+Design
router.get('/search', async (req: Request, res: Response) => {
  const { topics } = req.query as { topics?: string };
  const topicList = topics ? topics.split(',').map(t => t.trim()).filter(Boolean) : [];

  if (!topicList.length) {
    res.status(400).json({ message: 'topics query param required' });
    return;
  }

  try {
    const response = await axios.get<{ data?: RawJob[] }>(
      'https://jsearch.p.rapidapi.com/search',
      {
        params: { query: topicList.join(' '), page: '1', num_pages: '1' },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      }
    );

    const rawJobs: RawJob[] = (response.data.data ?? []).slice(0, 8);

    if (!rawJobs.length) {
      res.json({ jobs: [] });
      return;
    }

    // Rate all jobs in a single Gemini call
    const jobList = rawJobs
      .map((j, i) => `${i + 1}. "${j.job_title}" at ${j.employer_name}`)
      .join('\n');

    const geminiResult = await geminiModel.generateContent(
      `A candidate has been practising interviews on these topics: ${topicList.join(', ')}.
Rate how relevant each job below is to this candidate (1 = not relevant, 5 = perfect match).
${jobList}
Return ONLY a JSON array of integers (one per job, same order), e.g. [4,2,5,3,1,3,4,2]`
    );

    const raw = geminiResult.response.text().trim();
    const match = raw.match(/\[[\s\S]*?\]/);
    const ratings: number[] = match
      ? (JSON.parse(match[0]) as number[])
      : rawJobs.map(() => 3);

    const jobs = rawJobs
      .map((j, i) => ({
        id: j.job_id,
        title: j.job_title,
        company: j.employer_name,
        location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '),
        applyUrl: j.job_apply_link ?? null,
        employmentType: j.job_employment_type ?? null,
        rating: Math.min(5, Math.max(1, Math.round(ratings[i] ?? 3))),
      }))
      .sort((a, b) => b.rating - a.rating);

    res.json({ jobs });
  } catch (err) {
    console.error('Jobs search error:', err);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

export default router;
