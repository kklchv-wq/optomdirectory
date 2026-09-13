'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserPlus, LogIn, User, LogOut, Search, Info } from 'lucide-react';

import HeaderSearch from '@/components/UI/HeaderSearch';
import OptomLogo from '@/components/UI/OptomLogo';

interface AuthUser {
  id: number;
  name: string;
  email: string;
  gocNumber: string;
}

interface HeaderProps {
  onSelectTag?: (slug: string) => void;
  selectedSlugs?: string[];
}

export default function Header({ onSelectTag, selectedSlugs }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isDirectoryActive = pathname === '/';
  const isAboutActive = pathname === '/about';

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to check auth state:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-hidden focus:ring-2 focus:ring-teal-500 rounded-md shrink-0"
        >
          <OptomLogo className="h-8 sm:h-9 w-auto text-teal-800 group-hover:text-teal-900 transition-colors" />
          <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight block leading-none">
            Optom Directory
          </span>
        </Link>

        {/* Integrated Navigation Links */}
        <nav className="flex items-center gap-1 text-xs sm:text-sm">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              isDirectoryActive
                ? 'bg-teal-50 text-teal-900 font-extrabold border border-teal-200/80 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
            }`}
          >
            <Search className={`w-3.5 h-3.5 ${isDirectoryActive ? 'text-teal-700' : 'text-slate-400'}`} />
            <span>Directory</span>
          </Link>
          <Link
            href="/about"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              isAboutActive
                ? 'bg-teal-50 text-teal-900 font-extrabold border border-teal-200/80 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
            }`}
          >
            <Info className={`w-3.5 h-3.5 ${isAboutActive ? 'text-teal-700' : 'text-slate-400'}`} />
            <span>About</span>
          </Link>
        </nav>

        {/* Center: Search with Tag Auto-suggestions */}
        <div className="flex-1 flex justify-center max-w-xs sm:max-w-md">
          <HeaderSearch onSelectTag={onSelectTag} selectedSlugs={selectedSlugs} />
        </div>

        <nav className="flex items-center gap-2.5">
          {!loading && (
            <>
              {user ? (
                /* Logged In Practitioner State */
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all"
                  >
                    <User className="w-4 h-4 text-teal-700" />
                    <span>{user.name}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              ) : (
                /* Logged Out State: Join the Directory & Practitioner Login */
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-slate-500" />
                    <span>Practitioner Login</span>
                  </Link>

                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Join the Directory</span>
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
