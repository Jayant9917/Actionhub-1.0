"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { Button } from "@/components/ui/Button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";
import { Menu, X } from "lucide-react";

type MarketingUser = { name: string | null; email: string };
type MarketingAuth = { user: MarketingUser | null; authChecked: boolean };

const MarketingAuthContext = createContext<MarketingAuth>({ user: null, authChecked: false });

export function useMarketingAuth() {
  return useContext(MarketingAuthContext);
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Integrations", href: "/#integrations" },
  { label: "FAQ", href: "/#faq" },
];

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<MarketingUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token?.trim()) {
      setAuthChecked(true);
      return;
    }
    axios
      .get(`${BACKEND_URL}/api/v1/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data?.user) setUser(res.data.user);
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  function signOut() {
    window.localStorage.removeItem("token");
    router.push("/");
    window.location.reload();
  }

  function authControls() {
    if (!authChecked) return null;
    return user ? (
      <>
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          Dashboard
        </Button>
        <Button variant="secondary" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
          Log in
        </Button>
        <Button variant="primary" size="sm" onClick={() => router.push("/signup")}>
          Sign up
        </Button>
      </>
    );
  }

  return (
    <MarketingAuthContext.Provider value={{ user, authChecked }}>
      <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-900">
        <header
          className={`sticky top-0 z-50 border-b transition-all duration-200 ${
            scrolled
              ? "border-neutral-200 bg-white/90 shadow-soft backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90"
              : "border-transparent bg-white/80 backdrop-blur-sm dark:bg-neutral-950/80"
          }`}
        >
          <div className="container-content flex h-16 items-center justify-between gap-3">
            <Link
              href="/"
              aria-label="ActionHub home"
              className="shrink-0 text-title font-semibold tracking-tight text-neutral-900 transition-opacity hover:opacity-75 dark:text-neutral-900"
            >
              ActionHub
            </Link>

            <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
              {navLinks.map(({ label, href }) => {
                const active = label === "Home" && pathname === "/";
                return (
                  <Link
                    key={label}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <ThemeSwitcher />
              <div className="hidden items-center gap-1 sm:flex lg:flex">{authControls()}</div>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:focus-visible:ring-white lg:hidden"
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? (
                  <X size={18} aria-hidden="true" />
                ) : (
                  <Menu size={18} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav
              id="mobile-navigation"
              aria-label="Mobile navigation"
              className="border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950 lg:hidden"
            >
              <div className="mx-auto flex max-w-content-xl flex-col gap-1">
                {navLinks.map(({ label, href }) => {
                  const active = label === "Home" && pathname === "/";
                  return (
                    <Link
                      key={label}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={`rounded-lg px-3 py-2.5 text-sm ${
                        active
                          ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
                <div className="mt-2 flex flex-wrap gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800 sm:hidden">
                  {authControls()}
                </div>
              </div>
            </nav>
          )}
        </header>
        {children}
      </div>
    </MarketingAuthContext.Provider>
  );
}
