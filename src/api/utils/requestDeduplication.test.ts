import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createRequestFingerprint,
    executeWithRequestDeduplication,
    getRequestLockState,
    isRequestFingerprintLocked,
    resetRequestDeduplicationState,
} from "./requestDeduplication";

function createDeferred<T>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T | PromiseLike<T>) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    reject = nextReject;
    resolve = nextResolve;
  });

  return {
    promise,
    reject,
    resolve,
  };
}

describe("request deduplication", () => {
  afterEach(() => {
    resetRequestDeduplicationState();
    vi.useRealTimers();
  });

  it("joins identical in-flight requests into a single network call", async () => {
    const deferred = createDeferred<string>();
    let executionCount = 0;

    const firstRequest = executeWithRequestDeduplication({
      config: {
        method: "DELETE",
        url: "/api/assignments/assignment-1",
      },
      dedupe: {
        cooldownMs: 0,
        enabled: true,
        key: "",
        mode: "join",
      },
      execute: async () => {
        executionCount += 1;
        return deferred.promise;
      },
    });

    const secondRequest = executeWithRequestDeduplication({
      config: {
        method: "DELETE",
        url: "/api/assignments/assignment-1",
      },
      dedupe: {
        cooldownMs: 0,
        enabled: true,
        key: "",
        mode: "join",
      },
      execute: async () => {
        executionCount += 1;
        return "duplicate";
      },
    });

    expect(executionCount).toBe(1);

    deferred.resolve("deleted");

    await expect(firstRequest).resolves.toBe("deleted");
    await expect(secondRequest).resolves.toBe("deleted");
  });

  it("keeps mutation requests locked during the cooldown window", async () => {
    vi.useFakeTimers();

    const config = {
      data: {
        systemName: "UniGuard",
      },
      method: "PUT",
      url: "/api/settings",
    };
    const fingerprint = createRequestFingerprint(config);

    await expect(
      executeWithRequestDeduplication({
        config,
        dedupe: {
          cooldownMs: 400,
          enabled: true,
          key: "",
          mode: "join",
        },
        execute: async () => "saved",
      }),
    ).resolves.toBe("saved");

    expect(getRequestLockState(fingerprint)).toBe("cooldown");
    expect(isRequestFingerprintLocked(fingerprint)).toBe(true);

    await vi.advanceTimersByTimeAsync(401);

    expect(getRequestLockState(fingerprint)).toBe("idle");
    expect(isRequestFingerprintLocked(fingerprint)).toBe(false);
  });
});