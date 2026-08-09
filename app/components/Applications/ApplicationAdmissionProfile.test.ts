import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";

vi.mock("@/components/ui/button", async () => {
  const { createElement: createButtonElement } = await import("react");
  return {
    Button: ({
      asChild: _asChild,
      size: _size,
      variant: _variant,
      ...props
    }: ComponentProps<"button"> & {
      asChild?: boolean;
      size?: string;
      variant?: string;
    }) => createButtonElement("button", props),
  };
});

vi.mock("@/components/ui/skeleton", async () => {
  const { createElement: createSkeletonElement } = await import("react");
  return {
    Skeleton: (props: ComponentProps<"div">) =>
      createSkeletonElement("div", { "data-slot": "skeleton", ...props }),
  };
});

vi.mock("@/lib/utils", () => ({
  cn: (...values: unknown[]) =>
    values.filter((value) => typeof value === "string").join(" "),
}));

import { ApplicationAdmissionProfile } from "./ApplicationAdmissionProfile";

const candidate = {
  id: "platform-alex",
  name: "Alex Beispiel",
  email: "alex@example.com",
  dateOfBirth: "2004-01-01",
};

test("shows a skeleton while automatically searching for profiles", () => {
  const markup = renderToStaticMarkup(
    createElement(ApplicationAdmissionProfile, {
      canSync: true,
      candidates: null,
      hasProfile: false,
      isPending: true,
      isSearching: true,
      searchError: false,
      onSearch: vi.fn(),
      onSelect: vi.fn(),
    }),
  );

  expect(markup).toContain('aria-busy="true"');
  expect(markup).toContain('data-slot="skeleton"');
  expect(markup).toContain("Member-Profile werden gesucht");
  expect(markup).not.toContain("Member-Profile suchen</button>");
});

test("keeps the linked profile visibly selected after a step change", () => {
  const markup = renderToStaticMarkup(
    createElement(ApplicationAdmissionProfile, {
      canSync: true,
      candidates: [candidate],
      dateOfBirth: candidate.dateOfBirth,
      hasProfile: true,
      isPending: false,
      isSearching: false,
      searchError: false,
      selectedProfileId: candidate.id,
      onSearch: vi.fn(),
      onSelect: vi.fn(),
    }),
  );

  expect(markup).toContain("Member-Profil zugeordnet");
  expect(markup).toContain("Alex Beispiel");
  expect(markup).toContain("Zugeordnet");
  expect(markup).toContain("01.01.2004");
});

test("does not duplicate the decision-level age error in the profile", () => {
  const markup = renderToStaticMarkup(
    createElement(ApplicationAdmissionProfile, {
      canSync: true,
      candidates: [candidate],
      dateOfBirth: "2000-01-01",
      hasProfile: true,
      isPending: false,
      isSearching: false,
      searchError: false,
      selectedProfileId: candidate.id,
      onSearch: vi.fn(),
      onSelect: vi.fn(),
    }),
  );

  expect(markup).toContain("01.01.2000");
  expect(markup).not.toContain("Bei der Aufnahme muss die Person");
});
