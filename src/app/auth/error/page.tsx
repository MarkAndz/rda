'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const errors: Record<string, { title: string; message: string }> = {
    Configuration: {
      title: 'Server error',
      message:
        'There is a problem with the server configuration. Check if you have configured your authentication providers correctly.',
    },
    AccessDenied: {
      title: 'Access denied',
      message: 'You do not have permission to sign in.',
    },
    Verification: {
      title: 'Unable to sign in',
      message:
        'The sign in link is no longer valid. It may have been used already or it may have expired.',
    },
    Default: {
      title: 'Authentication error',
      message: 'An error occurred during authentication. Please try again.',
    },
  };

  const errorType = error && errors[error] ? error : 'Default';
  const { title, message } = errors[errorType];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="mt-6 text-3xl font-bold text-red-600">{title}</h1>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          {error && <p className="mt-2 text-xs text-gray-500">Error code: {error}</p>}
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
            Return to home page
          </Link>
        </div>
      </div>
    </div>
  );
}
