import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  ACCESS_TOKEN_COOKIE,
  internalApiBase,
} from '@/lib/internal-api';
import { OrgSwitcher } from './org-switcher';

async function loadMe() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const r = await fetch(`${internalApiBase()}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!r.ok) {
    return null;
  }
  return r.json() as Promise<{
    user: { email: string };
    activeOrganizationId: string;
    organizations: { id: string; legalName: string }[];
  }>;
}

export default async function DashboardPage() {
  const me = await loadMe();

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
            {me ? (
              <p className="text-sm text-zinc-600 mt-1">
                {me.user.email} · org{' '}
                <span className="font-mono text-xs">{me.activeOrganizationId}</span>
              </p>
            ) : (
              <p className="text-sm text-zinc-600 mt-1">
                Session issue — try login again.
              </p>
            )}
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
            >
              Log out
            </button>
          </form>
        </header>

        {me && me.organizations.length > 1 ? (
          <OrgSwitcher
            organizations={me.organizations}
            activeId={me.activeOrganizationId}
          />
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/invoices"
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-zinc-300"
          >
            <h2 className="font-medium text-zinc-900">Invoices</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Create, edit drafts, generate PDFs.
            </p>
          </Link>
          <Link
            href="/dashboard/settings"
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-zinc-300"
          >
            <h2 className="font-medium text-zinc-900">Organization</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Legal name, tax ID, invoice prefix.
            </p>
          </Link>
        </section>
      </div>
    </div>
  );
}
