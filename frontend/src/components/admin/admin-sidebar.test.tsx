import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminSidebar } from "./admin-sidebar";

describe("AdminSidebar", () => {
  it("renders navigation links", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText("clients")).toBeInTheDocument();
    expect(screen.getByText("centers")).toBeInTheDocument();
    expect(screen.getByText("bookings")).toBeInTheDocument();
    expect(screen.getByText("settings")).toBeInTheDocument();
  });

  it("renders link to admin dashboard", () => {
    render(<AdminSidebar />);
    const dashboardLink = screen.getByRole("link", { name: "dashboard" });
    expect(dashboardLink).toHaveAttribute("href", "/admin");
  });

  it("renders link to clients", () => {
    render(<AdminSidebar />);
    const clientsLink = screen.getByRole("link", { name: "clients" });
    expect(clientsLink).toHaveAttribute("href", "/admin/clients");
  });
});
