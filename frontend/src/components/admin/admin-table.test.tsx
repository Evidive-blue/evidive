import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminTable, type ColumnDef } from "./admin-table";

type TestRow = { id: string; name: string; email: string };

const columns: ColumnDef<TestRow>[] = [
  { key: "id", labelKey: "id", accessor: (r) => r.id },
  { key: "name", labelKey: "name", accessor: (r) => r.name },
  { key: "email", labelKey: "email", accessor: (r) => r.email },
];

const sampleData: TestRow[] = [
  { id: "1", name: "Alice", email: "alice@test.com" },
  { id: "2", name: "Bob", email: "bob@test.com" },
];

describe("AdminTable", () => {
  it("renders column headers from translation keys", () => {
    render(
      <AdminTable columns={columns} data={[]} rowKey={(r) => r.id} />
    );
    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("email")).toBeInTheDocument();
  });

  it("renders empty state when data is empty", () => {
    render(
      <AdminTable columns={columns} data={[]} rowKey={(r) => r.id} />
    );
    expect(screen.getByText("noResults")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(
      <AdminTable columns={columns} data={sampleData} rowKey={(r) => r.id} />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders search input when searchFields provided", () => {
    render(
      <AdminTable
        columns={columns}
        data={sampleData}
        rowKey={(r) => r.id}
        searchFields={[(r) => r.name]}
      />
    );
    expect(screen.getByPlaceholderText("search")).toBeInTheDocument();
  });
});
