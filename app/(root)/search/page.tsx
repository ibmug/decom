import { authOptions } from '@/lib/authOptions';
import { getServerSession } from 'next-auth';
import SearchProduct from './search-product';

export default async function SearchProductPage() {
  const session = await getServerSession(authOptions)
  return <SearchProduct session={session} />;
}