import { Router, Request, Response } from 'express';
import { auth as firebaseAuth } from '../config/firebase';
import { User } from '../models/User';

const router = Router();

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ message: 'ID token is required' });
      return;
    }

    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) {
      res.status(400).json({ message: 'Email not found in token' });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(403).json({ message: 'No account found for this Google account. Please contact your administrator.' });
      return;
    }

    res.status(200).json({
      id: user._id,
      email: user.email,
      name: user.name,
      allowAI: user.allowAI,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Invalid ID token' });
  }
});

export default router;
