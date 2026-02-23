import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./footer";

describe("Footer", () => {
  it("renders footer with links", () => {
    render(<Footer />);
    expect(screen.getByText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/discover/i)).toBeInTheDocument();
    expect(screen.getByText(/company/i)).toBeInTheDocument();
    expect(screen.getByText(/legal/i)).toBeInTheDocument();
  });

  it("renders link to about", () => {
    render(<Footer />);
    const aboutLink = screen.getByRole("link", { name: /about/i });
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  it("renders link to contact", () => {
    render(<Footer />);
    const contactLink = screen.getByRole("link", { name: /contact/i });
    expect(contactLink).toHaveAttribute("href", "/contact");
  });
});
