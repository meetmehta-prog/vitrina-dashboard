'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return {
          title: '🚫 Access Denied',
          message: 'Your email is not in the allowed list. Please contact the administrator for access.',
          email: searchParams.get('email') || ''
        };
      case 'Verification':
        return {
          title: '❌ Verification Failed',
          message: 'The verification link is invalid or has expired.',
          email: ''
        };
      default:
        return {
          title: '❌ Authentication Error',
          message: 'An error occurred during authentication. Please try again.',
          email: ''
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">{errorInfo.title.split(' ')[0]}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{errorInfo.title.split(' ').slice(1).join(' ')}</h1>
          <p className="text-gray-600 mb-6">{errorInfo.message}</p>
          
          {errorInfo.email && (
            <div className="bg-gray-50 border rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Your email:</strong> {errorInfo.email}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This email is not in the allowed list.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition duration-200"
            >
              Try Again
            </Link>
            
            <div className="text-sm text-gray-500">
              <p>Need access? Contact your administrator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}