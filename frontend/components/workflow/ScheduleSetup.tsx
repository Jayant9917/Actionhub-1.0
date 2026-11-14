"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { apiMessage, apiOptions } from "@/lib/actions";
import { useToastFeedback } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
export type ScheduleDraft = {
  frequency: "every_5_minutes" | "every_10_minutes" | "custom_interval" | "daily";
  intervalMinutes: number;
  hour: number;
  minute: number;
  enabled: boolean;
};
export const initialSchedule: ScheduleDraft = {
  frequency: "every_5_minutes",
  intervalMinutes: 5,
  hour: 9,
  minute: 0,
  enabled: true,
};
export function ScheduleFields({
  value,
  onChange,
}: {
  value: ScheduleDraft;
  onChange: (next: ScheduleDraft) => void;
}) {
  return (
    <div className="space-y-5">
      <label className="block text-body-sm font-medium">
        Repeat
        <select
          aria-label="Schedule frequency"
          value={value.frequency}
          onChange={(e) => {
            const frequency = e.target.value as ScheduleDraft["frequency"];
            const intervalMinutes =
              frequency === "every_5_minutes"
                ? 5
                : frequency === "every_10_minutes"
                  ? 10
                  : Number.isInteger(value.intervalMinutes) &&
                      value.intervalMinutes >= 1 &&
                      value.intervalMinutes <= 1440
                    ? value.intervalMinutes
                    : 5;
            onChange({ ...value, frequency, intervalMinutes });
          }}
          className="mt-2 w-full rounded-xl border border-neutral-200 p-3"
        >
          <option value="every_5_minutes">Every 5 minutes</option>
          <option value="every_10_minutes">Every 10 minutes</option>
          <option value="custom_interval">Custom interval</option>
          <option value="daily">Every day</option>
        </select>
      </label>
      {value.frequency === "custom_interval" && (
        <label className="block text-body-sm font-medium">
          Interval (minutes)
          <input
            aria-label="Interval (minutes)"
            type="number"
            min={1}
            max={1440}
            step={1}
            required
            value={Number.isNaN(value.intervalMinutes) ? "" : value.intervalMinutes}
            onChange={(e) => onChange({ ...value, intervalMinutes: e.target.valueAsNumber })}
            className="mt-2 w-full rounded-xl border border-neutral-200 p-3"
          />
          <span className="mt-2 block text-caption text-neutral-500">
            Enter 1 to 1440 whole minutes. For example, 12 means every 12 minutes, starting after
            publishing or saving.
          </span>
        </label>
      )}
      {value.frequency === "daily" && (
        <label className="block text-body-sm font-medium">
          Time (UTC)
          <input
            aria-label="Daily time (UTC)"
            type="time"
            required
            value={`${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`}
            onChange={(e) => {
              if (e.target.value) {
                const [hour, minute] = e.target.value.split(":").map(Number);
                onChange({ ...value, hour, minute });
              }
            }}
            className="mt-2 w-full rounded-xl border border-neutral-200 p-3"
          />
        </label>
      )}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
        />
        Schedule enabled
      </label>
      <p className="text-body-sm text-neutral-500">
        Daily times use UTC. Presets use clock boundaries: five minutes at :00, :05 and so on; ten
        minutes at :00, :10 and so on. Custom intervals start from when you publish or save. Docker
        must be running. After downtime, one overdue run is created; missed intervals are skipped.
      </p>
    </div>
  );
}
export function ScheduleSetup({ workflowId }: { workflowId: string }) {
  const [draft, setDraft] = useState(initialSchedule),
    [next, setNext] = useState(""),
    [loaded, setLoaded] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useToastFeedback(error, message);
  const url = `${BACKEND_URL}/api/v1/zap/${encodeURIComponent(workflowId)}/schedule`;
  useEffect(() => {
    let active = true;
    axios
      .get(url, apiOptions())
      .then(({ data }) => {
        if (active) {
          const s = data.schedule;
          setDraft({
            frequency: s.frequency,
            intervalMinutes: s.intervalMinutes ?? 5,
            hour: s.hour,
            minute: s.minute,
            enabled: s.enabled,
          });
          setNext(s.nextRunAt);
          setLoaded(true);
        }
      })
      .catch((failure) => {
        if (active) setError(apiMessage(failure, "Could not load schedule."));
      });
    return () => {
      active = false;
    };
  }, [url]);
  async function save() {
    if (
      draft.frequency === "custom_interval" &&
      (!Number.isInteger(draft.intervalMinutes) ||
        draft.intervalMinutes < 1 ||
        draft.intervalMinutes > 1440)
    ) {
      setError("Enter a whole-number interval from 1 to 1440 minutes.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const { data } = await axios.put(url, draft, apiOptions());
      setNext(data.schedule.nextRunAt);
      setMessage(
        draft.enabled
          ? "Schedule saved. Future runs use this timing."
          : "Schedule paused. Runs already started may finish.",
      );
    } catch (failure) {
      setError(apiMessage(failure, "Could not save schedule."));
    } finally {
      setSaving(false);
    }
  }
  if (!loaded) return <p>{error || "Loading schedule..."}</p>;
  return (
    <div className="space-y-5">
      <ScheduleFields value={draft} onChange={setDraft} />
      {draft.enabled && next && (
        <p className="text-body-sm">
          Saved next run: {new Date(next).toLocaleString()} (your local time)
        </p>
      )}
      <Button disabled={saving} onClick={() => void save()}>
        {saving ? "Saving..." : "Save schedule"}
      </Button>
    </div>
  );
}
