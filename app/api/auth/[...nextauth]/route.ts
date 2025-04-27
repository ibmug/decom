

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// NextAuth v4 handler
const handler = NextAuth(authOptions);

// Expose both GET and POST for the App Router
export { handler as GET, handler as POST };
