export function workflowName(id: string, fallback: string) {
  try {
    return localStorage.getItem(`actionhub.workflowName.${id}`) || fallback;
  } catch {
    return fallback;
  }
}
