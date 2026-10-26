import type { AppEnv } from "../../config/env.js";

export function blockchainConfig(env: AppEnv) {
  return {
    rpcUrl: env.BLOCKCHAIN_RPC_URL,
    contractAddress: env.AUDIT_CONTRACT_ADDRESS,
    privateKey: env.BLOCKCHAIN_PRIVATE_KEY,
  };
}
