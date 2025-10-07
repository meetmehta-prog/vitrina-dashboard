'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session) {
      setIsLoading(false);
    }
  }, [session, status, router]);

  if (status === 'loading' || isLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  return <Dashboard />;
}