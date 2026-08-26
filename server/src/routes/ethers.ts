import { Hono } from "hono";
import { ethers } from "ethers";

const router = new Hono<{ Bindings: CloudflareBindings }>();

router.get("/", async (c) => {
  try {
    const URL = `https://eth-sepolia.g.alchemy.com/v2/${c.env.RPC_API_KEY}`;
    const provider = new ethers.JsonRpcProvider(URL);

    if (!c.env.WALLET_ADDRESS) {
      throw new Error("Wallet address not set");
    }
    const balance = await provider.getBalance(c.env.WALLET_ADDRESS);

    return c.json({ balance: balance.toString() });
  } catch (error) {
    console.error("Blockchain request failed:", error);
    return c.json({ error: "Blockchain request failed" }, 500);
  }
});

export default router;
