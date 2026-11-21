"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { Button } from "@/components/ui/Button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher-1";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string | null; email: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || !token.trim()) {
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

  return (
    <div className="min-h-screen bg-white">
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-200 ${
          scrolled
            ? "border-neutral-200 bg-white/90 shadow-soft backdrop-blur-md"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="container-content flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-title font-semibold text-neutral-900 transition-opacity duration-fast hover:opacity-80"
          >
            Automate
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Primary navigation">
            <ThemeSwitcher />
            {authChecked &&
              (user ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                    Dashboard
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem("token");
                      router.push("/");
                      window.location.reload();
                    }}
                  >
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
              ))}
          </nav>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-marketing-navigation"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 md:hidden"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        <nav
          id="mobile-marketing-navigation"
          aria-label="Mobile navigation"
          hidden={!mobileMenuOpen}
          className="absolute inset-x-0 top-full border-b border-neutral-200 bg-white px-4 py-4 shadow-soft md:hidden"
        >
          <div className="container-content mx-auto flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="text-body-sm font-medium text-neutral-600">Appearance</span>
              <ThemeSwitcher />
            </div>
            {authChecked &&
              (user ? (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/dashboard");
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      localStorage.removeItem("token");
                      router.push("/");
                      window.location.reload();
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/login");
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/signup");
                    }}
                  >
                    Sign up
                  </Button>
                </div>
              ))}
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
