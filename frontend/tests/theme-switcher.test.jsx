import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeSwitcher } from "../components/ui/theme-switcher-1";

const mockSetTheme = jest.fn();
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: mockSetTheme }),
}));
jest.mock("motion/react", () => {
  return {
    useReducedMotion: () => true,
    motion: {
      div: ({ initial: _initial, animate: _animate, children, ...props }) => (
        <div {...props}>{children}</div>
      ),
      span: ({ layoutId: _layoutId, transition: _transition, ...props }) => <span {...props} />,
    },
  };
});

test("offers system, light, and dark modes and selects dark", () => {
  render(<ThemeSwitcher />);
  expect(screen.getByRole("radiogroup", { name: "Color theme" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Switch to light theme" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  fireEvent.click(screen.getByRole("radio", { name: "Switch to dark theme" }));
  expect(mockSetTheme).toHaveBeenCalledWith("dark");
});

test("supports arrow keys and Home/End with focus following selection", () => {
  render(<ThemeSwitcher />);
  const light = screen.getByRole("radio", { name: "Switch to light theme" });
  const dark = screen.getByRole("radio", { name: "Switch to dark theme" });
  fireEvent.keyDown(light, { key: "ArrowRight" });
  expect(dark).toHaveFocus();
  expect(mockSetTheme).toHaveBeenLastCalledWith("dark");
  fireEvent.keyDown(dark, { key: "Home" });
  expect(screen.getByRole("radio", { name: "Switch to system theme" })).toHaveFocus();
});
