export function nextSchedule(
  settings: { frequency: string; hour: number; minute: number; intervalMinutes?: number },
  now: Date,
  previous?: Date,
): Date {
  if (settings.frequency === "every_5_minutes" || settings.frequency === "every_10_minutes") {
    const interval = settings.frequency === "every_5_minutes" ? 300000 : 600000;
    return new Date((Math.floor(now.getTime() / interval) + 1) * interval);
  }
  if (settings.frequency === "custom_interval") {
    const minutes = settings.intervalMinutes;
    if (!Number.isInteger(minutes) || minutes! < 1 || minutes! > 1440)
      throw new Error("INVALID_INTERVAL");
    const interval = minutes! * 60000;
    // Preserve the saved cadence after slow processing; skip missed slots after downtime.
    const start = previous?.getTime() ?? now.getTime();
    const slots = Math.max(1, Math.floor((now.getTime() - start) / interval) + 1);
    return new Date(start + slots * interval);
  }
  const next = new Date(now);
  next.setUTCHours(settings.hour, settings.minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}
