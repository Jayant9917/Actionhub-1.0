"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { BACKEND_URL } from "@/app/config";
import { apiMessage, apiOptions } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/toast";
export function GoogleSignInButton({ purpose = "login" }: { purpose?: "login" | "link" }) {
  const [enabled, setEnabled] = useState(false),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false);
  const [linkRequired, setLinkRequired] = useState(false);
  useEffect(() => {
    let active = true;
    axios
      .get(`${BACKEND_URL}/api/v1/oauth/google/capabilities`, { timeout: 10000 })
      .then(({ data }) => {
        if (active) {
          setEnabled(data.enabled === true);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    const result = new URLSearchParams(window.location.search).get("google");
    if (result === "link_required") setLinkRequired(true);
    else if (result === "linked")
      toast.success("Google sign-in is linked to your existing ActionHub account.");
    else if (result === "denied") toast.error("Google authorization was cancelled.");
    else if (result === "failed") toast.error("Google authorization failed. Please try again.");
    return () => {
      active = false;
    };
  }, []);
  async function connect() {
    setBusy(true);
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/v1/oauth/google/${purpose}/start`,
        {},
        purpose === "link" ? apiOptions() : { timeout: 15000 },
      );
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      setBusy(false);
      toast.error(apiMessage(error, "Could not start Google sign-in."));
    }
  }
  return (
    <div className="mt-5 space-y-2">
      {linkRequired && purpose === "login" && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-body-sm text-neutral-800"
        >
          <p className="font-semibold">Link Google to your existing account</p>
          <p className="mt-2">
            An ActionHub account already uses this email. Log in below with your email and password,
            then open Settings and choose Link Google sign-in. Select the same Google account to
            finish linking. After that, you can use Continue with Google.
          </p>
        </div>
      )}
      <Button
        variant="secondary"
        className="w-full"
        disabled={!enabled || busy}
        onClick={() => void connect()}
      >
        <Image src="/google.svg" alt="" width={20} height={20} />
        {busy
          ? "Opening Google..."
          : purpose === "link"
            ? "Link Google sign-in"
            : "Continue with Google"}
      </Button>
      {loaded && !enabled && (
        <p className="text-caption text-neutral-500">
          Google sign-in will be available after the Google OAuth client credentials are configured.
        </p>
      )}
    </div>
  );
}
