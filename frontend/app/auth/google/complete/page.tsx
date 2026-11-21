"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
export default function GoogleLoginComplete() {
  const router = useRouter(),
    request = useRef<Promise<{ data: { token?: unknown } }> | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    // Share the one-time handoff request across React development Strict Mode effects.
    request.current ??= axios.post(
      `${BACKEND_URL}/api/v1/oauth/google/session`,
      {},
      { timeout: 15000 },
    );
    request.current
      .then(({ data }) => {
        if (!active) return;
        if (typeof data.token !== "string" || !data.token) throw new Error();
        localStorage.setItem("token", data.token);
        router.replace("/dashboard");
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [router]);
  if (!error) return <main className="min-h-screen bg-neutral-50" aria-busy="true" />;
  return (
    <main className="mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-title">Google sign-in could not finish</h1>
      {error && (
        <p>
          Start Google sign-in again. Your existing account and workflows have not been changed.
        </p>
      )}
      <Link href="/login" className="text-brand-600">
        Return to login
      </Link>
    </main>
  );
}
