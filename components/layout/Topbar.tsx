'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const PATH_TITLES: Record<string, string> = {
  '/': 'Today',
  '/objects': 'Objects',
  '/claims': 'Claims',
  '/alerts': 'Alerts',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/search': 'Search',
  '/dashboard': 'Dashboard',
};

function getPageTitle(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname];
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const last = segments[segments.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1);
  }
  return 'Today';
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const hasAlerts = true; // placeholder; wire to real data as needed

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
      {/* LEFT: page title */}
      <div className="flex-1">
        <span className="font-semibold text-gray-900 text-lg">
          {getPageTitle(pathname)}
        </span>
      </div>

      {/* CENTER: global search */}
      <div className="flex-1 flex justify-center">
        <div className="relative flex items-center w-full max-w-sm">
          <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search PRISM..."
            className="w-full bg-gray-100 border-none rounded-lg pl-9 pr-14 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute right-3 text-xs text-gray-400 font-medium select-none">
            ⌘K
          </span>
        </div>
      </div>

      {/* RIGHT: actions */}
      <div className="flex justify-end items-center gap-3">
        {/* Bell with alert dot */}
        <button className="relative p-1 rounded-md hover:bg-gray-100 transition-colors" aria-label="Alerts">
          <Bell className="h-5 w-5 text-gray-600" />
          {hasAlerts && (
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>

        {/* User avatar */}
        <div
          className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center select-none"
          aria-label="User avatar"
        >
          <span className="text-xs font-semibold text-navy-700" style={{ color: '#1e3a5f' }}>
            JT
          </span>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
