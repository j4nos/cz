import { describe, expect, it, vi } from "vitest";

import { DeleteAccountService } from "@/src/application/use-cases/deleteAccountService";

describe("DeleteAccountService", () => {
  it("deletes the user profile and then deletes the auth user by user id", async () => {
    const repository = { deleteUserProfile: vi.fn().mockResolvedValue(undefined) };
    const deleteAuthUser = vi.fn().mockResolvedValue(undefined);
    const service = new DeleteAccountService(repository, deleteAuthUser);

    await service.deleteAccount({
      userId: "user-1",
      email: "user@example.com",
      userPoolId: "pool-1",
      region: "eu-central-1",
    });

    expect(repository.deleteUserProfile).toHaveBeenCalledWith("user-1");
    expect(deleteAuthUser).toHaveBeenCalledTimes(1);
    expect(deleteAuthUser).toHaveBeenCalledWith({
      userPoolId: "pool-1",
      username: "user-1",
      region: "eu-central-1",
    });
  });

  it("falls back to deleting the auth user by email", async () => {
    const repository = { deleteUserProfile: vi.fn().mockResolvedValue(undefined) };
    const deleteAuthUser = vi
      .fn()
      .mockRejectedValueOnce(new Error("not found"))
      .mockResolvedValueOnce(undefined);
    const service = new DeleteAccountService(repository, deleteAuthUser);

    await service.deleteAccount({
      userId: "user-1",
      email: "user@example.com",
      userPoolId: "pool-1",
      region: "eu-central-1",
    });

    expect(deleteAuthUser).toHaveBeenNthCalledWith(2, {
      userPoolId: "pool-1",
      username: "user@example.com",
      region: "eu-central-1",
    });
  });
});
