'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Client = { id: string; name: string };

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [lineDesc, setLineDesc] = useState('Services');
  const [lineQty, setLineQty] = useState('1');
  const [linePrice, setLinePrice] = useState('10000');
  const [taxCents, setTaxCents] = useState('0');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await fetch('/api/backend/clients');
      if (r.ok) {
        const list = (await r.json()) as Client[];
        setClients(list);
        if (list[0]) {
          setClientId(list[0].id);
        }
      }
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!clientId) {
      setMsg('Add a client first (Clients page).');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/backend/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          issueDate: new Date(issueDate).toISOString(),
          taxCents: parseInt(taxCents, 10) || 0,
          lineItems: [
            {
              description: lineDesc,
              quantity: parseFloat(lineQty),
              unitPriceCents: parseInt(linePrice, 10),
            },
          ],
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(typeof data.message === 'string' ? data.message : 'Create failed');
        return;
      }
      router.push(`/dashboard/invoices/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <Link href="/dashboard/invoices" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Invoices
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">New invoice</h1>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <label className="block text-sm font-medium text-zinc-700">
            Client
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            >
              <option value="">Select…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Issue date
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Line description
            <input
              value={lineDesc}
              onChange={(e) => setLineDesc(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-zinc-700">
              Qty
              <input
                value={lineQty}
                onChange={(e) => setLineQty(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Unit price (cents)
              <input
                value={linePrice}
                onChange={(e) => setLinePrice(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-zinc-700">
            Tax (cents)
            <input
              value={taxCents}
              onChange={(e) => setTaxCents(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </label>
          {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create draft'}
          </button>
        </form>
      </div>
    </div>
  );
}
