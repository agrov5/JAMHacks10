import { Router, Request, Response, NextFunction } from 'express';
import { isSignupsEnabled, setSignupsEnabled } from '../config/signupState';

const router = Router();

function basicAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="CipherAI Admin"').status(401).json({ message: 'Unauthorized' });
    return;
  }
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const colon = decoded.indexOf(':');
  const user = decoded.slice(0, colon);
  const pass = decoded.slice(colon + 1);
  if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
}

// GET /api/admin/signup-status
router.get('/signup-status', basicAuth, (_req: Request, res: Response) => {
  res.json({ signupsEnabled: isSignupsEnabled() });
});

// POST /api/admin/signup/enable
router.post('/signup/enable', basicAuth, (_req: Request, res: Response) => {
  setSignupsEnabled(true);
  res.json({ signupsEnabled: true, message: 'Sign-ups enabled' });
});

// POST /api/admin/signup/disable
router.post('/signup/disable', basicAuth, (_req: Request, res: Response) => {
  setSignupsEnabled(false);
  res.json({ signupsEnabled: false, message: 'Sign-ups disabled' });
});

export default router;
