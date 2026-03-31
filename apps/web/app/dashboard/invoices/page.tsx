import Link from 'next/link';
import { InvoicesList } from './invoices-list';

export default function InvoicesPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Dashboard
          </Link>
          <div className="flex gap-3 text-sm">
            <Link
              href="/dashboard/clients"
              className="text-zinc-600 underline hover:text-zinc-900"
            >
              Clients
            </Link>
            <Link
              href="/dashboard/invoices/new"
              className="rounded-md bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-800"
            >
              New invoice
            </Link>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">Invoices</h1>
        <InvoicesList />
      </div>
    </div>
  );
}
