import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-zinc-50 p-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Invoice generator</h1>
      <p className="text-zinc-600 text-center max-w-md">
        Multi-tenant invoices, PDFs via BullMQ + Redis, NestJS API, Next.js UI.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
        >
          Register
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
