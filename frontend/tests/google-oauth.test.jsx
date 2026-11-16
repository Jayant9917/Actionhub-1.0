import React, { StrictMode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { GoogleSheetsConnect } from "../components/workflow/GoogleSheetsConnect";
import Complete from "../app/auth/google/complete/page";
import { ActionListEditor } from "../components/workflow/ActionListEditor";
import { newAction } from "../lib/actions";
const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));
beforeEach(() => {
  axios.get.mockResolvedValue({ data: { enabled: true } });
  axios.post.mockResolvedValue({ data: {} });
  localStorage.clear();
});
test("sign-in waits for administrator Google credentials and leaves password login available", async () => {
  axios.get.mockResolvedValue({ data: { enabled: false } });
  render(<GoogleSignInButton />);
  expect(await screen.findByText(/Google sign-in will be available/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
});
test.each(["login", "link"])("starts the separate %s purpose", async (purpose) => {
  axios.post.mockRejectedValue(new Error());
  render(<GoogleSignInButton purpose={purpose} />);
  const button = screen.getByRole("button");
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith(
      `/api/v1/oauth/google/${purpose}/start`,
      {},
      expect.any(Object),
    ),
  );
});
test("Google session handoff survives React Strict Mode without exchanging twice", async () => {
  axios.post.mockResolvedValue({ data: { token: "application-session" } });
  render(
    <StrictMode>
      <Complete />
    </StrictMode>,
  );
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard"));
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem("token")).toBe("application-session");
});
test("failed handoff offers login without saving a token", async () => {
  axios.post.mockRejectedValue(new Error());
  render(<Complete />);
  expect(await screen.findByText("Google sign-in could not finish")).toBeInTheDocument();
  expect(localStorage.getItem("token")).toBeNull();
});
test("Sheets is connected in a popup without leaving the workflow", async () => {
  const popup = { opener: {}, location: { replace: jest.fn() }, close: jest.fn() };
  jest.spyOn(window, "open").mockReturnValue(popup);
  axios.post.mockResolvedValue({
    data: { authorizationUrl: "https://accounts.google.com/auth", attemptId: "attempt" },
  });
  axios.get.mockImplementation((url) =>
    Promise.resolve({
      data: url.includes("/attempt/")
        ? { status: "connected", credentialId: "new-google" }
        : { enabled: true },
    }),
  );
  const connected = jest.fn();
  render(<GoogleSheetsConnect onConnected={connected} />);
  const button = screen.getByRole("button", { name: "Connect Google Sheets" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await waitFor(() => expect(connected).toHaveBeenCalledWith("new-google"));
  expect(popup.opener).toBeNull();
  expect(popup.location.replace).toHaveBeenCalledWith("https://accounts.google.com/auth");
  expect(popup.close).toHaveBeenCalled();
});
test("blocked popups do not start a Sheets authorization attempt", async () => {
  jest.spyOn(window, "open").mockReturnValue(null);
  render(<GoogleSheetsConnect onConnected={jest.fn()} />);
  const button = screen.getByRole("button", { name: "Connect Google Sheets" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  expect(axios.post).not.toHaveBeenCalled();
});
test("Google OAuth connections appear in the existing Sheets dropdown", () => {
  render(
    <ActionListEditor
      actions={[newAction("google_sheets.append_row")]}
      connections={[{ id: "oauth", name: "My Google", provider: "google.oauth" }]}
      onChange={jest.fn()}
      view="connection"
    />,
  );
  expect(screen.getByRole("option", { name: "My Google" })).toBeInTheDocument();
});
test("unconfigured Sheets shows manual setup guidance", async () => {
  axios.get.mockResolvedValue({ data: { enabled: false } });
  render(<GoogleSheetsConnect onConnected={jest.fn()} />);
  expect(
    await screen.findByText(/administrator needs to configure Google OAuth/),
  ).toBeInTheDocument();
});
