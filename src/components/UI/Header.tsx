'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserPlus, LogIn, User, LogOut, Search, Info, Menu, X } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Logo & Title */}
          <Link
            href="/"
            className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-md shrink-0"
          >
            <OptomLogo className="h-7 sm:h-9 w-auto text-teal-800 group-hover:text-teal-900 transition-colors" />
            <span className="font-black text-sm sm:text-base lg:text-lg text-slate-900 tracking-tight block leading-none">
              Optom Directory
            </span>
          </Link>

          {/* Desktop Search Center */}
          <div className="hidden lg:flex flex-1 justify-center max-w-sm">
            <HeaderSearch onSelectTag={onSelectTag} selectedSlugs={selectedSlugs} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs sm:text-sm">
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

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
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
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-slate-500" />
                      <span>Login</span>
                    </Link>

                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Join Directory</span>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Right Controls: Quick Join + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-1.5">
            {!user && (
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Sub-Header Search Bar (Visible on mobile screens) */}
        <div className="block lg:hidden pb-3">
          <HeaderSearch onSelectTag={onSelectTag} selectedSlugs={selectedSlugs} />
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 shadow-lg">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                isDirectoryActive
                  ? 'bg-teal-50 text-teal-900 border border-teal-200'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4 text-teal-700" />
              <span>Directory</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                isAboutActive
                  ? 'bg-teal-50 text-teal-900 border border-teal-200'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Info className="w-4 h-4 text-teal-700" />
              <span>About</span>
            </Link>
          </div>

          {!loading && (
            <div className="pt-1">
              {user ? (
                <div className="space-y-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-xs font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-700" />
                      <span>{user.name}</span>
                    </div>
                    <span className="text-[10px] bg-teal-200/80 px-2 py-0.5 rounded-md font-extrabold">
                      Practitioner Portal →
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 p-2.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-slate-500" />
                    <span>Practitioner Login</span>
                  </Link>

                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Join Directory</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
