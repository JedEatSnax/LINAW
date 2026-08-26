import { JsonRpcProvider } from "ethers";

let cachedProvider: JsonRpcProvider | null = null;

export const getWeb3Provider = (rpcUrl: string) => {
  if (cachedProvider) {
    return cachedProvider;
  }

  cachedProvider = new JsonRpcProvider(rpcUrl);
  return cachedProvider;
};
