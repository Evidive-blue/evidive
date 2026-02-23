import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookingSuccessClient } from "./booking-success-client";

// Mock canvas-confetti
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => {
      const { initial, animate, transition, ...rest } = props;
      void initial;
      void animate;
      void transition;
      return require("react").createElement("div", rest, children);
    },
    h1: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => {
      const { initial, animate, transition, ...rest } = props;
      void initial;
      void animate;
      void transition;
      return require("react").createElement("h1", rest, children);
    },
    p: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => {
      const { initial, animate, transition, ...rest } = props;
      void initial;
      void animate;
      void transition;
      return require("react").createElement("p", rest, children);
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

describe("BookingSuccessClient", () => {
  it("renders success title and message", () => {
    render(<BookingSuccessClient />);

    expect(screen.getByText("successTitle")).toBeInTheDocument();
    expect(screen.getByText("successMessage")).toBeInTheDocument();
    expect(screen.getByText("successDetails")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<BookingSuccessClient />);

    expect(screen.getByText("backToCenter")).toBeInTheDocument();
    expect(screen.getByText("backToHome")).toBeInTheDocument();
  });
});
