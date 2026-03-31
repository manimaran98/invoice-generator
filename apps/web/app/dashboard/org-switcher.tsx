'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function OrgSwitcher({
  organizations,
  activeId,
}: {
  organizations: { id: string; legalName: string }[];
  activeId: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(activeId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(activeId);
  }, [activeId]);

  async function onSwitch() {
    if (value === activeId) {
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/switch-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: value }),
      });
      if (r.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-zinc-800 mb-2">Switch organization</p>
      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm text-zinc-600 flex flex-col gap-1">
          Active org
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-md border border-zinc-300 px-2 py-1.5 text-zinc-900 min-w-[12rem]"
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.legalName}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onSwitch}
          disabled={loading || value === activeId}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? 'Switching…' : 'Switch'}
        </button>
      </div>
    </div>
  );
}
