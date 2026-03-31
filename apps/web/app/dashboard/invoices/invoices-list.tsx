'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Row = {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  currency: string;
  client: { name: string };
};

export function InvoicesList() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await fetch('/api/backend/invoices');
      if (r.ok) {
        setRows(await r.json());
      } else {
        setRows([]);
      }
    })();
  }, []);

  if (rows === null) {
    return <p className="text-sm text-zinc-600">Loading…</p>;
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100 text-left text-zinc-600">
          <tr>
            <th className="px-4 py-2 font-medium">Number</th>
            <th className="px-4 py-2 font-medium">Client</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Total</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((inv) => (
            <tr key={inv.id} className="border-t border-zinc-100">
              <td className="px-4 py-2 font-mono">{inv.number}</td>
              <td className="px-4 py-2">{inv.client.name}</td>
              <td className="px-4 py-2">{inv.status}</td>
              <td className="px-4 py-2">
                {(inv.totalCents / 100).toFixed(2)} {inv.currency}
              </td>
              <td className="px-4 py-2 text-right">
                <Link href={`/dashboard/invoices/${inv.id}`} className="text-zinc-900 underline">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-zinc-500">No invoices yet.</p>
      ) : null}
    </div>
  );
}
