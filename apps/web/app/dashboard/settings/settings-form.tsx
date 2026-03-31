'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Org = {
  legalName: string;
  address: string | null;
  taxId: string | null;
  logoUrl: string | null;
  invoicePrefix: string;
};

export function SettingsForm({ initial }: { initial: Org }) {
  const router = useRouter();
  const [legalName, setLegalName] = useState(initial.legalName);
  const [address, setAddress] = useState(initial.address ?? '');
  const [taxId, setTaxId] = useState(initial.taxId ?? '');
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? '');
  const [invoicePrefix, setInvoicePrefix] = useState(initial.invoicePrefix);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const r = await fetch('/api/backend/organizations/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName,
          address: address || undefined,
          taxId: taxId || undefined,
          logoUrl: logoUrl || undefined,
          invoicePrefix,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setMessage(
          typeof d.message === 'string' ? d.message : 'Update failed',
        );
        return;
      }
      setMessage('Saved');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <label className="block text-sm font-medium text-zinc-700">
        Legal name
        <input
          required
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </label>
      <label className="block text-sm font-medium text-zinc-700">
        Address
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </label>
      <label className="block text-sm font-medium text-zinc-700">
        Tax ID
        <input
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </label>
      <label className="block text-sm font-medium text-zinc-700">
        Logo URL
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </label>
      <label className="block text-sm font-medium text-zinc-700">
        Invoice prefix
        <input
          required
          value={invoicePrefix}
          onChange={(e) => setInvoicePrefix(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </label>
      {message ? (
        <p className="text-sm text-zinc-600" role="status">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
