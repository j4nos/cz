import { describe, expect, it, vi } from "vitest";

import { CheckIsAdminUserUseCase } from "@/src/application/use-cases/CheckIsAdminUserUseCase";

describe("CheckIsAdminUserUseCase", () => {
  it("returns true when the current user belongs to the admin group", async () => {
    const useCase = new CheckIsAdminUserUseCase({
      getCurrentGroups: vi.fn().mockResolvedValue(["investor", "admin"]),
    } as never);

    await expect(useCase.execute()).resolves.toBe(true);
  });

  it("returns false when the current user is not an admin", async () => {
    const useCase = new CheckIsAdminUserUseCase({
      getCurrentGroups: vi.fn().mockResolvedValue(["investor"]),
    } as never);

    await expect(useCase.execute()).resolves.toBe(false);
  });

  it("returns false when the auth client fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const useCase = new CheckIsAdminUserUseCase({
      getCurrentGroups: vi.fn().mockRejectedValue(new Error("session failed")),
    } as never);

    await expect(useCase.execute()).resolves.toBe(false);
    consoleError.mockRestore();
  });
});
