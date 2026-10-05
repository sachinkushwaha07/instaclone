import { z } from 'zod';

// Mirrors the Angular RegisterComponent's own validators, so a request that
// passed client-side validation also passes here — but the server check is
// the one that actually matters, since the client can always be bypassed.
export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9._]+$/, 'Letters, numbers, dots and underscores only.'),
  displayName: z.string().min(1).max(60),
  password: z.string().min(8).max(72), // bcrypt silently truncates beyond 72 bytes
});

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});