"use client";
export default function GoogleSheetsComplete() {
  return (
    <main className="mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-title">Google authorization finished</h1>
      <p>
        Return to your ActionHub workflow to see the connection result. You can close this window.
      </p>
      <button
        type="button"
        className="rounded-xl bg-brand-600 px-4 py-2 text-white"
        onClick={() => window.close()}
      >
        Close window
      </button>
    </main>
  );
}
