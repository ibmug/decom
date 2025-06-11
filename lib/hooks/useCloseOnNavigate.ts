
'use client';

import { useRouter } from 'next/navigation';

export function useCloseOnNavigate(setIsOpen: (value: boolean) => void) {
  const router = useRouter();

  const handleNavigate = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  return handleNavigate;
}
