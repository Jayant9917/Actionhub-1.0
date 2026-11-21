export function workflowName(id: string, fallback: string) {
  try {
    return localStorage.getItem(`actionhub.workflowName.${id}`) || fallback;
  } catch {
    return fallback;
  }
}

export function saveWorkflowName(id: string, name: string) {
  localStorage.setItem(`actionhub.workflowName.${id}`, name.trim());
}
