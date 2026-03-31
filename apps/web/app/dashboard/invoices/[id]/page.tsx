import Link from 'next/link';
import { InvoiceActions } from './invoice-actions';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <Link
          href="/dashboard/invoices"
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Invoices
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">Invoice</h1>
        <InvoiceActions invoiceId={id} />
      </div>
    </div>
  );
}
