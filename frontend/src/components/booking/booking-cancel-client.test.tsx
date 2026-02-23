import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookingCancelClient } from "./booking-cancel-client";

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

describe("BookingCancelClient", () => {
  it("renders cancel title and message", () => {
    render(<BookingCancelClient />);

    expect(screen.getByText("cancelTitle")).toBeInTheDocument();
    expect(screen.getByText("cancelMessage")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<BookingCancelClient />);

    expect(screen.getByText("backToCenter")).toBeInTheDocument();
    expect(screen.getByText("backToHome")).toBeInTheDocument();
  });
});
