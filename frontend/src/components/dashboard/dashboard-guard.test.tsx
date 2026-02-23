import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mockMe = vi.fn();
const mockIsAuthenticated = vi.fn();
const mockReplace = vi.fn();

vi.mock("@/lib/api", () => ({
  authApi: {
    me: (...args: unknown[]) => mockMe(...args),
  },
  isAuthenticated: () => mockIsAuthenticated(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
  Link: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    const React = require("react");
    return React.createElement("a", { href }, children);
  },
}));

import { DashboardGuard } from "./dashboard-guard";

describe("DashboardGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner initially", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockMe.mockReturnValue(new Promise(() => {})); // never resolves

    render(
      <DashboardGuard>
        <div>Dashboard Content</div>
      </DashboardGuard>
    );

    // Should not show children yet
    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
  });

  it("shows children when user is diver", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockMe.mockResolvedValue({
      id: "1",
      email: "center@test.com",
      roles: ["diver"],
    });

    render(
      <DashboardGuard>
        <div>Dashboard Content</div>
      </DashboardGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });
  });

  it("redirects when user is not authenticated", () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <DashboardGuard>
        <div>Dashboard Content</div>
      </DashboardGuard>
    );

    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
