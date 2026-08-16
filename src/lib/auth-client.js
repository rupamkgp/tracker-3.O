import { createAuthClient } from "better-auth/react";

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_BASE_URL || 'https://ep-quiet-shadow-axfnflw6.neonauth.c-4.us-east-2.aws.neon.tech/neondb/auth';
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '/auth' : neonAuthUrl,
});
