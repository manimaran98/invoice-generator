import Link from 'next/link';
import { ClientForm } from './client-form';

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900">Clients</h1>
      <ClientForm />
      </div>
    </div>
  );
}
