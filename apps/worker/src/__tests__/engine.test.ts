import { describe, it, expect } from "vitest";

// ── Template resolution ──────────────────────────────────────────
function resolveTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_: string, path: string) => {
    let value: unknown = context;
    for (const key of path.split(".")) {
      if (value && typeof value === "object") value = (value as Record<string, unknown>)[key];
      else return `{{${path}}}`;
    }
    return value !== undefined && value !== null ? String(value) : `{{${path}}}`;
  });
}

// ── Delay parsing ────────────────────────────────────────────────
function parseDelay(d: string): number {
  const match = d.match(/^(\d+)\s*(m|min|h|d)$/i);
  if (!match) return 3 * 86400_000;
  const n = parseInt(match[1]);
  switch (match[2].toLowerCase()) {
    case "m": case "min": return n * 60_000;
    case "h": return n * 3600_000;
    case "d": return n * 86400_000;
    default: return 3 * 86400_000;
  }
}

// ── Tests ────────────────────────────────────────────────────────
describe("resolveTemplate", () => {
  it("replaces simple variables", () => {
    const result = resolveTemplate("Hi {{lead.name}}!", { lead: { name: "Alice" } });
    expect(result).toBe("Hi Alice!");
  });

  it("replaces nested variables", () => {
    const result = resolveTemplate("{{lead.email}} at {{lead.company}}", {
      lead: { email: "alice@test.com", company: "Acme" },
    });
    expect(result).toBe("alice@test.com at Acme");
  });

  it("leaves unmatched variables", () => {
    const result = resolveTemplate("Hi {{unknown.var}}", { lead: { name: "Bob" } });
    expect(result).toBe("Hi {{unknown.var}}");
  });

  it("handles multiple occurrences", () => {
    const result = resolveTemplate("{{lead.name}} from {{lead.company}} — {{lead.name}}", {
      lead: { name: "Carol", company: "BigCo" },
    });
    expect(result).toBe("Carol from BigCo — Carol");
  });

  it("handles null/undefined values", () => {
    const result = resolveTemplate("Email: {{lead.email}}", { lead: { email: null } });
    expect(result).toBe("Email: {{lead.email}}");
  });
});

describe("parseDelay", () => {
  it("parses minutes", () => {
    expect(parseDelay("5m")).toBe(300_000);
    expect(parseDelay("30min")).toBe(1_800_000);
  });

  it("parses hours", () => {
    expect(parseDelay("2h")).toBe(7_200_000);
  });

  it("parses days", () => {
    expect(parseDelay("1d")).toBe(86_400_000);
  });

  it("defaults to 3 days for invalid input", () => {
    expect(parseDelay("invalid")).toBe(3 * 86_400_000);
  });
});
