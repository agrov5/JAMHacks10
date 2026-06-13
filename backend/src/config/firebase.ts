import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;
if (!getApps().length) {
  app = initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS as string),
  });
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export default app;
