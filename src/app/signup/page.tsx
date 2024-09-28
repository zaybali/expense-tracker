// app/signup/page.tsx
'use client';

import { useState } from 'react';
import { auth } from '@/firebase/firebaseconfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import '../styles/auth.css';
import Link from 'next/link';


const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);  
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      router.push('/verify-email');
    } catch (error:any) {
      console.error(error);
      const errorMessage = getFriendlyErrorMessage(error.code);
      setError(errorMessage);  

      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };
  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/email-already-in-use':
        return 'The email address is already in use.';
      case 'auth/invalid-credential':
        return 'The email or password is not valid.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <div className="container">
    <h1 className="mainHeading">Expense Tracker</h1>
    <div className="formWrapper">
      <h2 className="heading">Sign Up</h2>
      <form onSubmit={handleSignup} className="form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input"
          required
        />
        <button type="submit" className="button">Sign Up</button>
        {error && <p className="error">{error}</p>}
        <p className="linkText">
          Already have an account? <Link href="/login">Login here</Link>
        </p>
      </form>
    </div>
  </div>
  );
};

export default Signup;
