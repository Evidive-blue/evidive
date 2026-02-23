import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginClient } from "./login-client";

describe("LoginClient", () => {
  it("renders login form with email and password fields", () => {
    render(<LoginClient />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("renders link to register", () => {
    render(<LoginClient />);
    expect(screen.getByText(/noAccount/i)).toBeInTheDocument();
  });
});
