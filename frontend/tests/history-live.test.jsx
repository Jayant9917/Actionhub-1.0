import React from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import axios from "axios";
import { TaskHistory } from "../components/history/TaskHistory";
import { ToastContainer } from "../components/ui/toast";
jest.mock("axios", () => ({ get: jest.fn() }));
const id = "aa3f9700-a5e5-4af1-97bd-3496ac539e50";
const pending = {
  id,
  zapId: id,
  createdAt: "2026-11-14T08:00:00Z",
  status: "running",
  zap: { trigger: { type: { name: "Webhook" } } },
  actionRuns: [
    {
      id: "a",
      type: "email",
      status: "pending",
      attempts: 0,
      updatedAt: "2026-11-14T08:00:00Z",
      nextAttemptAt: "2026-11-14T08:00:00Z",
      errorCode: null,
    },
  ],
};
const done = {
  ...pending,
  status: "succeeded",
  actionRuns: [{ ...pending.actionRuns[0], status: "succeeded", attempts: 1 }],
};
const page = (run) => ({ data: { runs: [run], workflows: [], nextCursor: null } });
beforeEach(() => {
  jest.useFakeTimers();
  axios.get.mockImplementation((url) =>
    Promise.resolve(url.endsWith(id) ? { data: { run: done } } : page(pending)),
  );
});
afterEach(() => {
  jest.useRealTimers();
});
async function setup() {
  await act(async () => {
    render(<TaskHistory />);
  });
}
test("active table rows refresh automatically and stop polling after completion", async () => {
  await setup();
  expect(within(screen.getByRole("table")).getByText("In progress")).toBeInTheDocument();
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(within(screen.getByRole("table")).getByText("Succeeded")).toBeInTheDocument();
  const count = axios.get.mock.calls.length;
  await act(async () => {
    jest.advanceTimersByTime(6000);
  });
  expect(axios.get).toHaveBeenCalledTimes(count);
});
test("live action failures show an actionable toast", async () => {
  const failed = {
    ...done,
    status: "failed",
    actionRuns: [
      {
        ...pending.actionRuns[0],
        type: "http.request",
        status: "failed",
        attempts: 1,
        errorCode: "MISSING_EVENT_FIELD",
      },
    ],
  };
  axios.get.mockImplementation((url) =>
    Promise.resolve(url.endsWith(id) ? { data: { run: failed } } : page(pending)),
  );
  await act(async () => {
    render(
      <>
        <TaskHistory />
        <ToastContainer />
      </>,
    );
  });
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(screen.getByRole("alert")).toHaveTextContent(
    "HTTP request: This action uses a field that is not in the event.",
  );
});
test("opening newer details immediately updates the table too", async () => {
  await setup();
  fireEvent.click(screen.getByRole("button", { name: /View details for/ }));
  await act(async () => {});
  expect(within(screen.getByRole("table")).queryByText("In progress")).not.toBeInTheDocument();
  expect(within(screen.getByRole("table")).getByText("Succeeded")).toBeInTheDocument();
});
test("hidden tabs pause polling and resume when visible", async () => {
  await setup();
  const original = Object.getOwnPropertyDescriptor(document, "visibilityState");
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  const count = axios.get.mock.calls.length;
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(axios.get).toHaveBeenCalledTimes(count);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  await act(async () => {
    fireEvent(document, new Event("visibilitychange"));
  });
  expect(within(screen.getByRole("table")).getByText("Succeeded")).toBeInTheDocument();
  if (original) Object.defineProperty(document, "visibilityState", original);
  else delete document.visibilityState;
});
test("a temporary polling error keeps the last known row and recovers", async () => {
  await setup();
  axios.get.mockRejectedValueOnce(new Error("offline"));
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(screen.getByText(/Live updates are temporarily unavailable/)).toBeInTheDocument();
  expect(within(screen.getByRole("table")).getByText("In progress")).toBeInTheDocument();
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(within(screen.getByRole("table")).getByText("Succeeded")).toBeInTheDocument();
});
test("status-filtered rows disappear when their status changes", async () => {
  await setup();
  fireEvent.change(screen.getByLabelText("Status"), { target: { value: "running" } });
  await act(async () => {});
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(screen.getByText("No matching runs")).toBeInTheDocument();
});
