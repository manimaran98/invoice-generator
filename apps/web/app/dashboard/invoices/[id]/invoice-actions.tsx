'use client';

import { useEffect, useState } from 'react';

type Inv = {
  id: string;
  number: string;
  status: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
};

type Job = {
  status: string;
  errorMessage: string | null;
} | null;

export function InvoiceActions({ invoiceId }: { invoiceId: string }) {
  const [inv, setInv] = useState<Inv | null>(null);
  const [job, setJob] = useState<Job | undefined>(undefined);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const r = await fetch(`/api/backend/invoices/${invoiceId}`);
    if (r.ok) {
      setInv(await r.json());
    }
    const s = await fetch(`/api/backend/invoices/${invoiceId}/pdf/status`);
    if (s.ok) {
      setJob(await s.json());
    } else {
      setJob(null);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load defined per render
  }, [invoiceId]);

  async function enqueuePdf() {
    setMsg(null);
    const r = await fetch(`/api/backend/invoices/${invoiceId}/pdf`, {
      method: 'POST',
    });
    if (!r.ok) {
      setMsg('Could not queue PDF');
      return;
    }
    setMsg('PDF queued — refreshing status…');
    await load();
    const t = setInterval(load, 2000);
    setTimeout(() => clearInterval(t), 30000);
  }

  if (!inv) {
    return <p className="text-sm text-zinc-600">Loading…</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-sm">
      <p className=" font-mono text-lg">{inv.number}</p>
      <p className="text-zinc-600">Status: {inv.status}</p>
      <p>
        Total: {(inv.totalCents / 100).toFixed(2)} {inv.currency} (tax:{' '}
        {(inv.taxCents / 100).toFixed(2)})
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void enqueuePdf()}
          className="rounded-md bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-800"
        >
          Generate PDF
        </button>
        <a
          href={`/api/backend/invoices/${invoiceId}/pdf/download`}
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 hover:bg-zinc-50"
        >
          Download PDF
        </a>
      </div>
      {job ? (
        <p className="text-zinc-600">
          Last PDF job: {job.status}
          {job.errorMessage ? ` — ${job.errorMessage}` : ''}
        </p>
      ) : (
        <p className="text-zinc-500">No PDF job yet.</p>
      )}
      {msg ? <p className="text-zinc-700">{msg}</p> : null}
    </div>
  );
}
