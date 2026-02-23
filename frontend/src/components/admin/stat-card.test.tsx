import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(<StatCard title="Users" value="42" />);
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <StatCard title="Revenue" value="€1,200" description="This month" />
    );
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("€1,200")).toBeInTheDocument();
    expect(screen.getByText("This month")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<StatCard title="Total" value="—" />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.queryByText("This month")).not.toBeInTheDocument();
  });
});
