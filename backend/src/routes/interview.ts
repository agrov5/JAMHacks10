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
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
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

  const inputPath  = tmpFile('.webm');
  const audioPath  = tmpFile('.mp3');
  const videoPath  = tmpFile('.mp4');

  try {
    fs.writeFileSync(inputPath, req.file.buffer);

    // Strip audio → video-only mp4 and extract audio mp3 in parallel
    await Promise.all([
      runFfmpeg(
        ffmpeg(inputPath)
          .noAudio()
          .videoCodec('libx264')
          .outputOptions(['-preset fast', '-crf 23'])
          .output(videoPath)
      ),
      runFfmpeg(
        ffmpeg(inputPath)
          .noVideo()
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .output(audioPath)
      ),
    ]);

    const timestamp = Date.now();
    const videoKey = `interviews/${timestamp}-video.mp4`;
    const audioKey = `interviews/${timestamp}-audio.mp3`;

    // Upload video and audio to GCS + send audio to ElevenLabs — all in parallel
    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath), {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg',
    });
    form.append('model_id', 'scribe_v1');

    const [, , sttResponse] = await Promise.all([
      bucket.upload(videoPath, { destination: videoKey, metadata: { contentType: 'video/mp4' } }),
      bucket.upload(audioPath, { destination: audioKey, metadata: { contentType: 'audio/mpeg' } }),
      axios.post('https://api.elevenlabs.io/v1/speech-to-text', form, {
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, ...form.getHeaders() },
      }),
    ]);

    const base = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}`;
    const transcript: string = sttResponse.data.text ?? '';

    res.json({
      videoUrl: `${base}/${videoKey}`,
      audioUrl: `${base}/${audioKey}`,
      transcript,
    });
  } catch (err) {
    console.error('Interview submit error:', err);
    res.status(500).json({ message: 'Failed to process video' });
  } finally {
    for (const f of [inputPath, audioPath, videoPath]) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
});

export default router;
