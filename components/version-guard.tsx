'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { APP_VERSION } from '@/lib/constants';





export default function VersionGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cachedVersion = localStorage.getItem('app_version');

    if (cachedVersion !== APP_VERSION) {
      // Clear local/session storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear auth by signing out
      signOut({ redirect: false }).then(() => {
        // Set new version
        localStorage.setItem('app_version', APP_VERSION);
        // Reload to re-init app cleanly
        window.location.reload();
      });
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
