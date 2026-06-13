export interface GCPServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  [key: string]: string;
}

// Returns parsed service account object.
// On Render: reads FIREBASE_SERVICE_ACCOUNT_B64 (base64-encoded JSON).
// Locally:   reads the file at GOOGLE_APPLICATION_CREDENTIALS.
export function getServiceAccount(): GCPServiceAccount {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    return JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
    ) as GCPServiceAccount;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(
      require('path').resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    ) as GCPServiceAccount;
  }

  throw new Error(
    'No service account credentials found. Set FIREBASE_SERVICE_ACCOUNT_B64 or GOOGLE_APPLICATION_CREDENTIALS.'
  );
}
