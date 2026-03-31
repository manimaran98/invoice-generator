import Link from 'next/link';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, internalApiBase } from '@/lib/internal-api';
import { SettingsForm } from './settings-form';

async function loadOrg() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const r = await fetch(`${internalApiBase()}/organizations/current`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!r.ok) {
    return null;
  }
  return r.json() as Promise<{
    legalName: string;
    address: string | null;
    taxId: string | null;
    logoUrl: string | null;
    invoicePrefix: string;
  }>;
}

export default async function SettingsPage() {
  const org = await loadOrg();

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">Organization</h1>
        {org ? (
          <SettingsForm initial={org} />
        ) : (
          <p className="text-sm text-zinc-600">Could not load organization.</p>
        )}
      </div>
    </div>
  );
}
