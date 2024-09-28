'use client';

import { useAuth } from '@/context/authcontext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const VerifyEmail = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.emailVerified) {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div>
      <p>Please check your email for verification.</p>
    </div>
  );
};

export default VerifyEmail;
