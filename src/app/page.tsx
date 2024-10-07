// app/home/page.tsx
'use client';

import { useAuth } from '@/context/authcontext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    const checkAuthStatus = async () => {
      // Simulate an asynchronous check if needed
      if (!user) {
        router.push('/signup');
      } else if (!user.emailVerified) {
        router.push('/verify-email');
      } else {
        // User is authenticated and email is verified, update loading state
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [user, router]);

  if (loading) {
    return <h1                               style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight: '100vh'}}>Loading...</h1>; // Render a loading message or spinner
  }

  // useEffect(() => {
  //   if (!user) {
  //     router.push('/signup');
  //   } else if (!user.emailVerified) {
  //     router.push('/verify-email');
  //   }
  // }, [user, router]);

  return (
    <div style={{display:'flex', justifyContent: 'center', alignItems: 'center', height:'100vh', flexDirection: 'column'}}>
      <h1>Welcome, {user?.email}!</h1>
      <Link href="/expenses" style={{color: 'blue', textDecoration: 'underline'}}>Manage Expenses</Link>
    </div>
  );
};

