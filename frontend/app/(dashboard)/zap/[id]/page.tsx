"use client";
import { useParams, useRouter } from "next/navigation";
import { WorkflowActionsPanel } from "@/components/workflow/WorkflowActionsPanel";
export default function WorkflowBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <WorkflowActionsPanel workflowId={id} onActionsSaved={() => router.push("/dashboard")} />;
}
