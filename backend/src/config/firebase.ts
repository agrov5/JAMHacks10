import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getServiceAccount } from '../util/serviceAccount';

let app: App;
if (!getApps().length) {
  const sa = getServiceAccount();
  app = initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
    }),
  });
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export default app;
