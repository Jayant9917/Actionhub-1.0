"use client";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { ConnectionManager } from "@/components/workflow/ConnectionManager";
import { Card, CardHeader } from "@/components/ui/Card";
import axios from "axios";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/app/config";
import { apiOptions } from "@/lib/actions";

export default function SettingsPage() {
  const [account, setAccount] = useState<{
    name: string | null;
    email: string;
    googleLinked?: boolean;
  } | null>(null);
  useEffect(() => {
    let active = true;
    axios
      .get(`${BACKEND_URL}/api/v1/user`, apiOptions())
      .then(({ data }) => {
        if (active) setAccount(data.user);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="container-content py-8">
      <div className="mb-8">
        <h1 className="text-display-sm text-neutral-900">Settings</h1>
        <p className="mt-1 text-body text-neutral-500">Manage your account and preferences</p>
      </div>

      <div className="space-y-8 max-w-2xl">
        <Card padding="lg">
          <CardHeader title="Account" />
          {account && (
            <p className="text-body">
              {account.name && <strong className="block">{account.name}</strong>}
              {account.email}
            </p>
          )}
          {account?.googleLinked ? (
            <p className="text-body-sm">Google sign-in linked</p>
          ) : (
            <details className="mt-3 text-body-sm">
              <summary className="cursor-pointer">Google sign-in</summary>
              <GoogleSignInButton purpose="link" />
            </details>
          )}
        </Card>
        <ConnectionManager />
      </div>
    </div>
  );
}
