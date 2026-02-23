import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactClient } from "./contact-client";

describe("ContactClient", () => {
  it("renders contact form with all fields", () => {
    render(<ContactClient />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("submits form and shows success message", async () => {
    const user = userEvent.setup();
    render(<ContactClient />);

    await user.type(screen.getByLabelText(/name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john.doe@test.evidive.local");
    await user.type(screen.getByLabelText(/subject/i), "Test");
    await user.type(screen.getByLabelText(/message/i), "Hello world");

    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText(/success/i)).toBeInTheDocument();
  });
});
