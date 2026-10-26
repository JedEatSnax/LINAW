import { ethers } from "ethers";

import type { AppEnv } from "../../config/env.js";
import { createAuditTrailContract } from "./blockchainClient.js";

type AnchorAuditInput = {
  auditId: string;
  hashValue: string;
  eventType: string;
};

export type BlockchainAuditRecord = {
  auditId: string;
  hashValue: string;
  eventType: string;
  anchoredAt: number;
};

export class BlockchainAdapter {
  constructor(private readonly env: AppEnv) {}

  async anchorAudit(input: AnchorAuditInput) {
    const auditTrailContract = createAuditTrailContract(this.env);

    const auditIdBytes32 = ethers.id(input.auditId);

    const hashValueBytes32 = input.hashValue.startsWith("0x")
      ? input.hashValue
      : `0x${input.hashValue}`;

    if (!/^0x[0-9a-fA-F]{64}$/.test(hashValueBytes32)) {
      throw new Error("Invalid hashValue: expected a 32-byte hexadecimal hash");
    }

    const transaction = await auditTrailContract.getFunction("anchorAudit")(
      auditIdBytes32,
      hashValueBytes32,
      input.eventType,
    );

    const receipt = await transaction.wait();

    const block = await auditTrailContract.runner?.provider?.getBlock(
      receipt.blockNumber,
    );

    if (!block) {
      throw new Error("Block not found");
    }

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      anchoredAt: block.timestamp,
    };
  }

  async verifyAudit(auditId: string, hashValue: string) {
    const auditTrailContract = createAuditTrailContract(this.env);

    const auditIdBytes32 = ethers.id(auditId);

    const hashValueBytes32 = hashValue.startsWith("0x")
      ? hashValue
      : `0x${hashValue}`;

    if (!/^0x[0-9a-fA-F]{64}$/.test(hashValueBytes32)) {
      throw new Error("Invalid hashValue: expected a 32-byte hexadecimal hash");
    }

    return await auditTrailContract.getFunction("verifyAudit")(
      auditIdBytes32,
      hashValueBytes32,
    );
  }

  async getAudit(auditId: string): Promise<BlockchainAuditRecord> {
    const auditTrailContract = createAuditTrailContract(this.env);

    const auditIdBytes32 = ethers.id(auditId);

    const record =
      await auditTrailContract.getFunction("getAudit")(auditIdBytes32);

    return {
      auditId: record[0],
      hashValue: record[1].replace(/^0x/, "").toLowerCase(),
      eventType: record[2],
      anchoredAt: Number(record[3]),
    };
  }
}
