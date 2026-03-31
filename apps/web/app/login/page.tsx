import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Sign in</h1>
          <p className="text-sm text-zinc-500 mt-1">Invoice generator</p>
        </div>
        <Suspense
          fallback={
            <p className="text-sm text-zinc-500" role="status">
              Loading…
            </p>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
