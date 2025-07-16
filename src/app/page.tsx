
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // This effect runs only on the client
    const masterPassword = localStorage.getItem('masterPassword');
    const userAccount = localStorage.getItem('userAccount');

    if (!masterPassword) {
      router.replace('/setup');
    } else if (!userAccount) {
      router.replace('/create-account');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
