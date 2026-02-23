import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardSidebar } from "./dashboard-sidebar";

describe("DashboardSidebar", () => {
  it("renders all navigation items", () => {
    render(<DashboardSidebar />);

    expect(screen.getByText("overview")).toBeInTheDocument();
    expect(screen.getByText("services")).toBeInTheDocument();
    expect(screen.getByText("bookings")).toBeInTheDocument();
    expect(screen.getByText("calendar")).toBeInTheDocument();
    expect(screen.getByText("team")).toBeInTheDocument();
    expect(screen.getByText("payments")).toBeInTheDocument();
    expect(screen.getByText("reviews")).toBeInTheDocument();
    expect(screen.getByText("settings")).toBeInTheDocument();
  });

  it("renders section titles", () => {
    render(<DashboardSidebar />);

    expect(screen.getByText("sectionBookings")).toBeInTheDocument();
    expect(screen.getByText("sectionPlanning")).toBeInTheDocument();
    expect(screen.getByText("sectionTeamFinances")).toBeInTheDocument();
    expect(screen.getByText("sectionOther")).toBeInTheDocument();
  });

  it("renders back to site link", () => {
    render(<DashboardSidebar />);
    expect(screen.getByText("backToSite")).toBeInTheDocument();
  });

  it("renders all navigation links with correct hrefs", () => {
    render(<DashboardSidebar />);

    const links = screen.getAllByRole("link");
    const hrefs = links.map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/services");
    expect(hrefs).toContain("/dashboard/bookings");
    expect(hrefs).toContain("/dashboard/calendar");
    expect(hrefs).toContain("/dashboard/team");
    expect(hrefs).toContain("/dashboard/payments");
    expect(hrefs).toContain("/dashboard/reviews");
    expect(hrefs).toContain("/dashboard/settings");
  });
});
