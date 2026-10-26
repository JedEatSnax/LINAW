import { ethers } from "ethers";
import type { AppEnv } from "./../../config/env.js";

import auditTrailAbi from "./abi/auditTrail.json" with { type: "json" };

export function createAuditTrailContract(env: AppEnv) {
  const provider = new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);

  const wallet = new ethers.Wallet(env.BLOCKCHAIN_PRIVATE_KEY, provider);

  return new ethers.Contract(env.AUDIT_CONTRACT_ADDRESS, auditTrailAbi, wallet);
}
