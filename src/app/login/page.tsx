'use client';

import { useState } from 'react';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebaseconfig';
import { useRouter } from 'next/navigation';
import '../styles/auth.css';
import Link from 'next/link';
import {
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); 
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);  // To track if reset email was sent
  const { isOpen, onOpen, onClose } = useDisclosure();  // Controls modal visibility
  const [loading, setLoading] = useState(false);  // For loading state during reset
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.emailVerified) {
        router.push('/');
      } else {
        router.push('/verify-email');
      }
    } catch (error:any) {
      console.error(error);
      const errorMessage = getFriendlyErrorMessage(error.code);
      setError(errorMessage);  

      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

   // Handle password reset logic
   const handleResetPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail);  // Send password reset email
      setResetEmailSent(true);  // Email sent successfully
      setLoading(false);
    } catch (error: any) {
      console.error(error);
      setError('Failed to send password reset email. Please check the email address.');
      setLoading(false);
    }
  };

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'The email address is not valid.';
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
        <h2 className="heading">Login</h2>
        <form onSubmit={handleLogin} className="form">
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
          <button type="submit" className="button">Login</button>
          {error && <p className="error">{error}</p>}
          <p className="linkText">
          Don’t have an account? <Link href="/signup">Sign up here</Link>
        </p>
        <p className="linkText">
            <span onClick={onOpen} style={{ cursor: 'pointer' }}>Forgot Password?</span>
          </p>
        </form>
      </div>

       {/* Reset Password Modal */}
       <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            {resetEmailSent && (
              <p style={{ color: 'green' }}>Password reset email sent!</p>
            )}
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={handleResetPassword}
              isLoading={loading}
              isDisabled={!resetEmail}  // Disable button if email is empty
            >
              Reset Password
            </Button>
            <Button onClick={onClose} ml={3}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
};
