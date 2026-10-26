import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ethers } from "ethers";
import type { AppEnv } from "../../../config/env.js";

const { createAuditTrailContractMock } = vi.hoisted(() => ({
  createAuditTrailContractMock: vi.fn(),
}));

vi.mock("../../../shared/blockchain/blockchainClient.js", () => ({
  createAuditTrailContract: createAuditTrailContractMock,
}));

import { BlockchainAdapter } from "../../../shared/blockchain/blockchainAdapter.js";

const TEST_AUDIT_ID = "audit-test-123";
const TEST_HASH = "a".repeat(64);
const TEST_EVENT_TYPE = "LINAW_TEST_EVENT";

const TEST_TRANSACTION_HASH = `0x${"b".repeat(64)}`;
const TEST_BLOCK_NUMBER = 12345;
const TEST_TIMESTAMP = 1792000000;

function createMockContract() {
  const anchorAudit = vi.fn();
  const verifyAudit = vi.fn();
  const getAudit = vi.fn();
  const getBlock = vi.fn();

  const functions = {
    anchorAudit,
    verifyAudit,
    getAudit,
  };

  const getFunction = vi.fn((name: keyof typeof functions) => functions[name]);

  const contract = {
    getFunction,
    runner: {
      provider: {
        getBlock,
      },
    },
  };

  return {
    contract,
    anchorAudit,
    verifyAudit,
    getAudit,
    getBlock,
    getFunction,
  };
}

describe("BlockchainAdapter", () => {
  let adapter: BlockchainAdapter;
  let mock: ReturnType<typeof createMockContract>;

  beforeEach(() => {
    vi.clearAllMocks();

    mock = createMockContract();

    createAuditTrailContractMock.mockReturnValue(mock.contract as never);

    adapter = new BlockchainAdapter({} as AppEnv);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("anchorAudit", () => {
    it("submits an audit record and returns transaction details", async () => {
      mock.anchorAudit.mockResolvedValue({
        wait: vi.fn().mockResolvedValue({
          hash: TEST_TRANSACTION_HASH,
          blockNumber: TEST_BLOCK_NUMBER,
        }),
      });

      mock.getBlock.mockResolvedValue({
        timestamp: TEST_TIMESTAMP,
      });

      const result = await adapter.anchorAudit({
        auditId: TEST_AUDIT_ID,
        hashValue: TEST_HASH,
        eventType: TEST_EVENT_TYPE,
      });

      expect(createAuditTrailContractMock).toHaveBeenCalledWith(
        expect.any(Object),
      );

      expect(mock.getFunction).toHaveBeenCalledWith("anchorAudit");

      expect(mock.anchorAudit).toHaveBeenCalledWith(
        ethers.id(TEST_AUDIT_ID),
        `0x${TEST_HASH}`,
        TEST_EVENT_TYPE,
      );

      expect(mock.getBlock).toHaveBeenCalledWith(TEST_BLOCK_NUMBER);

      expect(result).toEqual({
        transactionHash: TEST_TRANSACTION_HASH,
        blockNumber: TEST_BLOCK_NUMBER,
        anchoredAt: TEST_TIMESTAMP,
      });
    });

    it("accepts a hash that already has the 0x prefix", async () => {
      mock.anchorAudit.mockResolvedValue({
        wait: vi.fn().mockResolvedValue({
          hash: TEST_TRANSACTION_HASH,
          blockNumber: TEST_BLOCK_NUMBER,
        }),
      });

      mock.getBlock.mockResolvedValue({
        timestamp: TEST_TIMESTAMP,
      });

      await adapter.anchorAudit({
        auditId: TEST_AUDIT_ID,
        hashValue: `0x${TEST_HASH}`,
        eventType: TEST_EVENT_TYPE,
      });

      expect(mock.anchorAudit).toHaveBeenCalledWith(
        ethers.id(TEST_AUDIT_ID),
        `0x${TEST_HASH}`,
        TEST_EVENT_TYPE,
      );
    });

    it("rejects an invalid hash before submitting a transaction", async () => {
      await expect(
        adapter.anchorAudit({
          auditId: TEST_AUDIT_ID,
          hashValue: "invalid-hash",
          eventType: TEST_EVENT_TYPE,
        }),
      ).rejects.toThrow(
        "Invalid hashValue: expected a 32-byte hexadecimal hash",
      );

      expect(mock.anchorAudit).not.toHaveBeenCalled();
    });

    it("rejects a hash that is not exactly 32 bytes", async () => {
      await expect(
        adapter.anchorAudit({
          auditId: TEST_AUDIT_ID,
          hashValue: "a".repeat(63),
          eventType: TEST_EVENT_TYPE,
        }),
      ).rejects.toThrow(
        "Invalid hashValue: expected a 32-byte hexadecimal hash",
      );

      expect(mock.anchorAudit).not.toHaveBeenCalled();
    });

    it("throws when the transaction block cannot be found", async () => {
      mock.anchorAudit.mockResolvedValue({
        wait: vi.fn().mockResolvedValue({
          hash: TEST_TRANSACTION_HASH,
          blockNumber: TEST_BLOCK_NUMBER,
        }),
      });

      mock.getBlock.mockResolvedValue(null);

      await expect(
        adapter.anchorAudit({
          auditId: TEST_AUDIT_ID,
          hashValue: TEST_HASH,
          eventType: TEST_EVENT_TYPE,
        }),
      ).rejects.toThrow("Block not found");
    });

    it("propagates transaction failures", async () => {
      mock.anchorAudit.mockRejectedValue(
        new Error("Transaction submission failed"),
      );

      await expect(
        adapter.anchorAudit({
          auditId: TEST_AUDIT_ID,
          hashValue: TEST_HASH,
          eventType: TEST_EVENT_TYPE,
        }),
      ).rejects.toThrow("Transaction submission failed");
    });
  });

  describe("verifyAudit", () => {
    it("returns true when the audit record matches", async () => {
      mock.verifyAudit.mockResolvedValue(true);

      await expect(adapter.verifyAudit(TEST_AUDIT_ID, TEST_HASH)).resolves.toBe(
        true,
      );

      expect(mock.getFunction).toHaveBeenCalledWith("verifyAudit");

      expect(mock.verifyAudit).toHaveBeenCalledWith(
        ethers.id(TEST_AUDIT_ID),
        `0x${TEST_HASH}`,
      );
    });

    it("returns false when the audit record does not match", async () => {
      mock.verifyAudit.mockResolvedValue(false);

      await expect(adapter.verifyAudit(TEST_AUDIT_ID, TEST_HASH)).resolves.toBe(
        false,
      );
    });

    it("rejects an invalid hash before verification", async () => {
      await expect(
        adapter.verifyAudit(TEST_AUDIT_ID, "not-a-hash"),
      ).rejects.toThrow(
        "Invalid hashValue: expected a 32-byte hexadecimal hash",
      );

      expect(mock.verifyAudit).not.toHaveBeenCalled();
    });

    it("propagates contract verification errors", async () => {
      mock.verifyAudit.mockRejectedValue(new Error("RPC request failed"));

      await expect(
        adapter.verifyAudit(TEST_AUDIT_ID, TEST_HASH),
      ).rejects.toThrow("RPC request failed");
    });
  });

  describe("getAudit", () => {
    it("returns the audit record in the expected format", async () => {
      const expectedAuditId = ethers.id(TEST_AUDIT_ID);
      const expectedHash = `0x${TEST_HASH.toUpperCase()}`;

      mock.getAudit.mockResolvedValue([
        expectedAuditId,
        expectedHash,
        TEST_EVENT_TYPE,
        BigInt(TEST_TIMESTAMP),
      ]);

      const result = await adapter.getAudit(TEST_AUDIT_ID);

      expect(mock.getFunction).toHaveBeenCalledWith("getAudit");

      expect(mock.getAudit).toHaveBeenCalledWith(expectedAuditId);

      expect(result).toEqual({
        auditId: expectedAuditId,
        hashValue: TEST_HASH,
        eventType: TEST_EVENT_TYPE,
        anchoredAt: TEST_TIMESTAMP,
      });
    });

    it("converts the timestamp to a number", async () => {
      mock.getAudit.mockResolvedValue([
        ethers.id(TEST_AUDIT_ID),
        `0x${TEST_HASH}`,
        TEST_EVENT_TYPE,
        1792000000n,
      ]);

      const result = await adapter.getAudit(TEST_AUDIT_ID);

      expect(result.anchoredAt).toBe(TEST_TIMESTAMP);
      expect(typeof result.anchoredAt).toBe("number");
    });

    it("propagates contract retrieval errors", async () => {
      mock.getAudit.mockRejectedValue(new Error("Failed to retrieve audit"));

      await expect(adapter.getAudit(TEST_AUDIT_ID)).rejects.toThrow(
        "Failed to retrieve audit",
      );
    });
  });
});
