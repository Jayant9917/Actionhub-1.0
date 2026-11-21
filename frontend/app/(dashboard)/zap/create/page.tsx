"use client";
import { toast, useToastFeedback } from "@/components/ui/toast";
import { ScheduleFields, initialSchedule } from "@/components/workflow/ScheduleSetup";
import { TallyFields } from "@/components/workflow/TallyTriggerSetup";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { actionPayload, apiMessage, apiOptions } from "@/lib/actions";
import type { ActionDraft } from "@/lib/actions";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
export default function CreateAutomationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState(initialSchedule);
  const [trigger, setTrigger] = useState("");
  const [actions, setActions] = useState<ActionDraft[]>([]);
  const [github, setGithub] = useState({ repository: "", secret: "", enabled: true });
  const [tally, setTally] = useState({ formId: "", secret: "", enabled: true });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useToastFeedback(error);
  const [draftReady, setDraftReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("actionhub.workflowDraft") ?? "null");
      if (saved) {
        setName(typeof saved.name === "string" ? saved.name : "");
        setTrigger(saved.trigger);
        setSchedule(saved.schedule);
        setActions(saved.actions);
        setGithub({ ...saved.github, secret: "" });
        setTally({ ...saved.tally, secret: "" });
      }
    } catch {
      // An unavailable or invalid draft should not prevent creating a workflow.
    }
    setDraftReady(true);
  }, []);
  useEffect(() => {
    if (!draftReady) return;
    try {
      sessionStorage.setItem(
        "actionhub.workflowDraft",
        JSON.stringify({
          name,
          trigger,
          schedule,
          actions,
          github: { repository: github.repository, enabled: github.enabled },
          tally: { formId: tally.formId, enabled: tally.enabled },
        }),
      );
    } catch {
      // The workflow can still be published if browser storage is unavailable.
    }
  }, [
    draftReady,
    name,
    trigger,
    schedule,
    actions,
    github.repository,
    github.enabled,
    tally.formId,
    tally.enabled,
  ]);
  async function publish() {
    setError("");
    if (
      trigger === "schedule" &&
      schedule.frequency === "custom_interval" &&
      (!Number.isInteger(schedule.intervalMinutes) ||
        schedule.intervalMinutes < 1 ||
        schedule.intervalMinutes > 1440)
    ) {
      setError("Enter a whole-number interval from 1 to 1440 minutes.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/v1/zap`,
        {
          availableTriggerId: trigger,
          ...(name.trim() ? { name: name.trim() } : {}),
          actions: actionPayload(actions),
          ...(trigger === "schedule" ? { schedule } : {}),
          ...(trigger === "tally.form_submitted" ? { tally } : {}),
          ...(trigger.startsWith("github.") ? { github } : {}),
        },
        apiOptions(),
      );
      try {
        sessionStorage.removeItem("actionhub.workflowDraft");
      } catch {
        // Publishing already succeeded.
      }
      toast.success("Automation published. It is ready to receive events.");
      router.push(`/zap/${data.zapId}`);
    } catch (failure) {
      setError(apiMessage(failure, "Could not create automation."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <WorkflowCanvas
      title="Create automation"
      workflowNameField={
        <Input
          label="Workflow name (optional)"
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Contact form notifications"
        />
      }
      trigger={trigger}
      actions={actions}
      onTriggerChange={setTrigger}
      onActionsChange={setActions}
      onSave={() => void publish()}
      saving={saving}
      saveLabel="Publish"
      renderTriggerSettings={(done) =>
        trigger === "schedule" ? (
          <div className="space-y-5">
            <ScheduleFields value={schedule} onChange={setSchedule} />
            <Button onClick={done}>Done</Button>
          </div>
        ) : trigger === "tally.form_submitted" ? (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              done();
            }}
          >
            <TallyFields value={tally} onChange={setTally} />
            <p className="text-body-sm text-neutral-500">
              Publish to get your webhook URL, then add it in Tally → Integrations → Webhooks.
            </p>
            <Button type="submit">Done</Button>
          </form>
        ) : trigger.startsWith("github.") ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              done();
            }}
          >
            <p className="text-body-sm text-neutral-500">
              Choose the repository to watch and use the same secret in its GitHub webhook settings.
            </p>
            <Input
              label="Repository"
              placeholder="owner/repository"
              required
              pattern="[A-Za-z0-9-]+/[A-Za-z0-9_.-]+"
              value={github.repository}
              onChange={(event) => setGithub({ ...github, repository: event.target.value })}
            />
            <Input
              label="GitHub webhook secret"
              type="password"
              autoComplete="new-password"
              required
              minLength={16}
              maxLength={512}
              value={github.secret}
              onChange={(event) => setGithub({ ...github, secret: event.target.value })}
            />
            <p className="rounded-xl bg-brand-50/50 p-3 text-body-sm text-neutral-600">
              Your webhook URL will be available after publishing. These settings are saved
              privately with your workflow.
            </p>
            <div className="flex justify-end border-t border-neutral-200 pt-4">
              <Button type="submit">Done</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <p className="text-body text-neutral-600">
              Your webhook URL will appear after publishing. Send JSON events to that URL to start
              this workflow.
            </p>
            <div className="flex justify-end border-t border-neutral-200 pt-4">
              <Button onClick={done}>Done</Button>
            </div>
          </div>
        )
      }
    />
  );
}
