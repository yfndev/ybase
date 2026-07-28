import { describe, expect, test } from "vitest";
import { getApplicationMainStatus } from "./mainStatus";

describe("getApplicationMainStatus", () => {
  test("combines the internal review states into the application step", () => {
    expect(getApplicationMainStatus("received")).toBe("application");
    expect(getApplicationMainStatus("review")).toBe("application");
  });

  test("keeps interview, acceptance and terminal decisions distinct", () => {
    expect(getApplicationMainStatus("interview")).toBe("interview");
    expect(getApplicationMainStatus("accepted")).toBe("accepted");
    expect(getApplicationMainStatus("rejected")).toBe("rejected");
    expect(getApplicationMainStatus("withdrawn")).toBe("withdrawn");
  });
});
