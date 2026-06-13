import { Router, Request, Response, NextFunction } from 'express';
import { auth as firebaseAuth } from '../config/firebase';
// @ts-ignore - admin.auth may not be typed correctly but exists at runtime
import { User, IUser } from '../models/User';
// @ts-ignore - bcrypt types may be missing
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = Router();

/**
 * @route POST /api/auth/google
 * @desc Verify Google ID token and create/login user
 * @access Public
 */
router.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required' });
    }

    // Verify the ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    const name = decodedToken.name ?? '';

    if (!email) {
      return res.status(400).json({ message: 'Email not found in token' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Generate username from email prefix
      let usernameBase = email.split('@')[0];
      // Remove non-alphanumeric characters
      usernameBase = usernameBase.replace(/[^a-z0-9]/gi, '');
      if (!usernameBase) usernameBase = 'user';

      let username = usernameBase;
      let suffix = 0;
      while (await User.findOne({ username })) {
        suffix++;
        username = `${usernameBase}${suffix}`;
      }

      // Generate a random password and hash it (placeholder)
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

      // Create new user
      user = await User.create({
        email,
        name,
        password: hashedPassword,
        allowAI: false, // default
        username,
      });
    } else {
      // Optionally update name if changed
      if (user.name !== name && name) {
        user.name = name;
        await user.save();
      }
    }

    // Return user data (exclude password)
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      allowAI: user.allowAI,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Invalid ID token' });
  }
});

export default router;