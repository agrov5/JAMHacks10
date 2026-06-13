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

router.post('/submit', upload.single('video'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'No video file provided' });
    return;
  }

  const { userId, goals: goalsRaw } = req.body as { userId?: string; goals?: string };
  if (!userId) {
    res.status(400).json({ message: 'userId is required' });
    return;
  }
  const goals: string[] = goalsRaw ? JSON.parse(goalsRaw) : [];

  const audioPath = tmpFile('.mp3');

  try {
    const timestamp = Date.now();
    const gcsKey = `interviews/${timestamp}.webm`;

    // Upload original webm (has audio+video) directly from buffer — no transcoding needed
    const gcsFile = bucket.file(gcsKey);
    await gcsFile.save(req.file.buffer, { metadata: { contentType: 'video/webm' } });

    // Write to temp file only to extract audio for ElevenLabs
    const inputPath = tmpFile('.webm');
    fs.writeFileSync(inputPath, req.file.buffer);

    try {
      await runFfmpeg(
        ffmpeg(inputPath)
          .noVideo()
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .output(audioPath)
      );
    } finally {
      try { fs.unlinkSync(inputPath); } catch {}
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath), {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg',
    });
    form.append('model_id', 'scribe_v1_experimental');

    const sttResponse = await axios.post(
      'https://api.elevenlabs.io/v1/speech-to-text',
      form,
      { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, ...form.getHeaders() } }
    );

    const videoUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsKey}`;
    const transcript: string = sttResponse.data.text ?? '';

    const session = await Session.create({ userId, videoUrl, transcript, goals });

    res.json({ sessionId: session._id, videoUrl, transcript });
  } catch (err) {
    console.error('Interview submit error:', err);
    res.status(500).json({ message: 'Failed to process video' });
  } finally {
    try { fs.unlinkSync(audioPath); } catch {}
  }
});

export default router;
