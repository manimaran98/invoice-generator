'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(
          typeof data.message === 'string'
            ? data.message
            : Array.isArray(data.message)
              ? data.message.join(', ')
              : 'Registration failed',
        );
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Create account</h1>
          <p className="text-sm text-zinc-500 mt-1">
            You’ll get a default organization as owner
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-zinc-700">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Password (min 8)
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </label>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Register'}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link className="text-zinc-900 underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
