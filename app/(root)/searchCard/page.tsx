import { authOptions } from '@/lib/authOptions';
import SearchCardClient from './search-card-client';
import { getServerSession } from 'next-auth';

export default async function SearchCardPage() {
  const session = await getServerSession(authOptions)
  return <SearchCardClient session={session} />;
}