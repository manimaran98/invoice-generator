'use client';

import { FormEvent, useEffect, useState } from 'react';

type Client = {
  id: string;
  name: string;
  email: string | null;
};

export function ClientForm() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const r = await fetch('/api/backend/clients');
    if (r.ok) {
      setClients(await r.json());
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const r = await fetch('/api/backend/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || undefined }),
      });
      if (!r.ok) {
        setMsg('Failed to create client');
        return;
      }
      setName('');
      setEmail('');
      setMsg('Client added');
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-medium text-zinc-900">Add client</h2>
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
        {msg ? <p className="text-sm text-zinc-600">{msg}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Add'}
        </button>
      </form>
      <ul className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
        {clients.map((c) => (
          <li key={c.id} className="px-4 py-3 text-sm text-zinc-800">
            {c.name}
            {c.email ? (
              <span className="text-zinc-500 ml-2">{c.email}</span>
            ) : null}
          </li>
        ))}
        {clients.length === 0 ? (
          <li className="px-4 py-6 text-sm text-zinc-500">No clients yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
