import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/core/app-error";
import { AuthService } from "@/server/services/auth-service";

describe("AuthService", () => {
  // ─── register ─────────────────────────────────────────────────────────────

  it("creates a user and queues the welcome email", async () => {
    const users = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findReferrerByCode: vi.fn().mockResolvedValue({ id: "ref-1" }),
      createRegisteredUser: vi.fn().mockResolvedValue({
        id: "user-1",
        email: "trader@example.com",
        name: "Ghost Trader",
      }),
    };

    const service = new AuthService({
      createReferralCode: vi.fn().mockResolvedValue("GHOST123"),
      hashPassword: vi.fn().mockResolvedValue("hashed-password"),
      sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
      users,
    });

    const result = await service.register({
      name: "Ghost Trader",
      email: "Trader@Example.com",
      password: "SecurePass123",
      referralCode: "invite",
    });

    expect(users.findByEmail).toHaveBeenCalledWith("trader@example.com");
    expect(users.createRegisteredUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "trader@example.com",
        passwordHash: "hashed-password",
        referrerId: "ref-1",
      }),
    );
    expect(result).toEqual({
      ok: true,
      user: {
        id: "user-1",
        email: "trader@example.com",
      },
    });
  });

  // AUDIT FIX: Added explicit test verifying the password is hashed, not stored
  // in plaintext. The stored value must never equal the raw password input.
  it("hashes the password before storing — never stores plaintext", async () => {
    const rawPassword = "SuperSecret123!";
    let capturedHash = "";

    const users = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findReferrerByCode: vi.fn(),
      createRegisteredUser: vi.fn().mockImplementation(
        (input: { passwordHash: string }) => {
          capturedHash = input.passwordHash;
          return Promise.resolve({ id: "u-1", email: "t@e.com", name: "Test" });
        },
      ),
    };

    const service = new AuthService({
      createReferralCode: vi.fn().mockResolvedValue("CODE1234"),
      hashPassword: vi.fn().mockResolvedValue("$2b$12$hashed_value_here"),
      sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
      users,
    });

    await service.register({ name: "Test", email: "t@e.com", password: rawPassword });

    expect(capturedHash).not.toEqual(rawPassword);
    expect(capturedHash).toBe("$2b$12$hashed_value_here");
  });

  it("throws a conflict error when the email already exists", async () => {
    const service = new AuthService({
      createReferralCode: vi.fn(),
      hashPassword: vi.fn(),
      sendWelcomeEmail: vi.fn(),
      users: {
        findByEmail: vi.fn().mockResolvedValue({ id: "existing-user" }),
        findReferrerByCode: vi.fn(),
        createRegisteredUser: vi.fn(),
      },
    });

    await expect(
      service.register({
        name: "Ghost Trader",
        email: "trader@example.com",
        password: "SecurePass123",
      }),
    ).rejects.toMatchObject({
      code: "ACCOUNT_ALREADY_EXISTS",
      statusCode: 409,
    } satisfies Partial<AppError>);
  });

  it("registers without a referral code when none is provided", async () => {
    const createRegisteredUser = vi.fn().mockResolvedValue({
      id: "u-2",
      email: "no-ref@example.com",
      name: "No Ref",
    });

    const service = new AuthService({
      createReferralCode: vi.fn().mockResolvedValue("NOREFERRAL"),
      hashPassword: vi.fn().mockResolvedValue("hash"),
      sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
      users: {
        findByEmail: vi.fn().mockResolvedValue(null),
        findReferrerByCode: vi.fn(),
        createRegisteredUser,
      },
    });

    await service.register({ name: "No Ref", email: "no-ref@example.com", password: "pass1234" });

    expect(createRegisteredUser).toHaveBeenCalledWith(
      expect.objectContaining({ referrerId: null }),
    );
  });

  it("normalises the email to lowercase before lookup", async () => {
    const findByEmail = vi.fn().mockResolvedValue(null);
    const createRegisteredUser = vi.fn().mockResolvedValue({
      id: "u-3",
      email: "upper@example.com",
      name: "Upper",
    });

    const service = new AuthService({
      createReferralCode: vi.fn().mockResolvedValue("ABCD1234"),
      hashPassword: vi.fn().mockResolvedValue("hash"),
      sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
      users: { findByEmail, findReferrerByCode: vi.fn(), createRegisteredUser },
    });

    await service.register({ name: "Upper", email: "UPPER@EXAMPLE.COM", password: "password1" });

    expect(findByEmail).toHaveBeenCalledWith("upper@example.com");
    expect(createRegisteredUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "upper@example.com" }),
    );
  });

  it("does not throw if the welcome email fails to send", async () => {
    const service = new AuthService({
      createReferralCode: vi.fn().mockResolvedValue("CODE5678"),
      hashPassword: vi.fn().mockResolvedValue("hash"),
      sendWelcomeEmail: vi.fn().mockRejectedValue(new Error("SMTP error")),
      users: {
        findByEmail: vi.fn().mockResolvedValue(null),
        findReferrerByCode: vi.fn(),
        createRegisteredUser: vi.fn().mockResolvedValue({
          id: "u-4",
          email: "test@example.com",
          name: "Test",
        }),
      },
    });

    await expect(
      service.register({ name: "Test", email: "test@example.com", password: "password1" }),
    ).resolves.toMatchObject({ ok: true });
  });
});
