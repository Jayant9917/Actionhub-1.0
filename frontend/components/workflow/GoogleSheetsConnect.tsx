"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { apiMessage, apiOptions } from "@/lib/actions";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
export function GoogleSheetsConnect({ onConnected }: { onConnected: (id: string) => void }) {
  const [enabled, setEnabled] = useState(false),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [name, setName] = useState("My Google Sheets");
  const popup = useRef<Window | null>(null),
    timer = useRef<ReturnType<typeof setTimeout>>(),
    generation = useRef(0);
  const stop = useCallback(() => {
    generation.current++;
    clearTimeout(timer.current);
    popup.current?.close();
  }, []);
  useEffect(() => {
    let active = true;
    axios
      .get(`${BACKEND_URL}/api/v1/oauth/google/capabilities`, apiOptions())
      .then(({ data }) => {
        if (active) {
          setEnabled(data.enabled === true);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
      stop();
    };
  }, [stop]);
  function cancel() {
    generation.current++;
    clearTimeout(timer.current);
    popup.current?.close();
    setBusy(false);
  }
  async function connect() {
    if (!name.trim()) {
      toast.error("Enter a connection name first.");
      return;
    }
    popup.current = window.open("about:blank", "_blank", "popup,width=600,height=750");
    if (!popup.current) {
      toast.error("Allow popups for ActionHub to connect Google Sheets.");
      return;
    }
    popup.current.opener = null;
    const runId = ++generation.current;
    setBusy(true);
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/v1/oauth/google/sheets/start`,
        { name: name.trim() },
        apiOptions(),
      );
      if (runId !== generation.current) return;
      popup.current.location.replace(data.authorizationUrl);
      const deadline = Date.now() + 600000;
      const poll = async () => {
        if (runId !== generation.current) return;
        try {
          const result = await axios.get(
            `${BACKEND_URL}/api/v1/oauth/google/attempt/${encodeURIComponent(data.attemptId)}`,
            apiOptions(),
          );
          if (runId !== generation.current) return;
          if (result.data.status === "connected" && typeof result.data.credentialId === "string") {
            cancel();
            toast.success("Google Sheets connected. Choose your spreadsheet and columns.");
            onConnected(result.data.credentialId);
            return;
          }
          if (["failed", "denied"].includes(result.data.status)) {
            cancel();
            toast.error(
              result.data.status === "denied"
                ? "Google Sheets permission was cancelled."
                : "Google Sheets connection failed. Try again and approve spreadsheet access.",
            );
            return;
          }
          if (Date.now() >= deadline) {
            cancel();
            toast.error("Google Sheets connection expired. Please try again.");
            return;
          }
          timer.current = setTimeout(() => void poll(), 2000);
        } catch (error) {
          if (runId === generation.current) {
            cancel();
            toast.error(
              apiMessage(
                error,
                "Could not confirm Google Sheets connection. Refresh connections before trying again.",
              ),
            );
          }
        }
      };
      void poll();
    } catch (error) {
      if (runId === generation.current) {
        cancel();
        toast.error(apiMessage(error, "Could not connect Google Sheets."));
      }
    }
  }
  return (
    <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
      <p className="font-semibold">Connect Google Sheets</p>
      <p className="text-body-sm text-neutral-500">
        Choose a Google account and approve spreadsheet access. No service-account JSON is needed.
      </p>
      <Input
        id="google-oauth-name"
        label="Google connection name"
        value={name}
        maxLength={80}
        disabled={busy}
        onChange={(e) => setName(e.target.value)}
      />
      <Button disabled={!enabled || busy} onClick={() => void connect()}>
        {busy ? "Waiting for Google..." : "Connect Google Sheets"}
      </Button>
      {busy && (
        <Button variant="ghost" onClick={cancel}>
          Cancel connection
        </Button>
      )}
      {loaded && !enabled && (
        <p className="text-caption text-neutral-500">
          The administrator needs to configure Google OAuth first. Manual service-account setup
          below still works.
        </p>
      )}
    </div>
  );
}
