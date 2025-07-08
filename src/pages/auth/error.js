import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  let message = 'Authentication error.';
  if (error === 'This email is already registered manually. Please login using email and password.') {
    message = 'This email is already registered manually. Please login using email and password.';
  } else if (error === 'This email is already registered with Google. Please log in with Google.') {
    message = 'This email is already registered with Google. Please log in with Google.';
  } else if (error === 'No Google account found. Please sign up with Google first.') {
    message = 'No Google account found. Please sign up with Google first.';
  } else if (error) {
    message = decodeURIComponent(error);
  }

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-600">{message}</p>
        <button
          className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded"
          onClick={() => router.push('/')}
        >
          Go Home
        </button>
        <p className="mt-4 text-gray-500 text-sm">You will be redirected to the home page in 5 seconds.</p>
      </div>
    </div>
  );
} 