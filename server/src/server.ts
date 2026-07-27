import express from "express";
import cors from "cors";
import { network } from "hardhat";
const { ethers } = await network.create();

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const URL = `https://eth-sepolia.g.alchemy.com/v2/${process.env.RPC_API_KEY}`;
const ADDRESS = process.env.WALLET_ADDRESS;

app.listen(PORT, () => {
  console.log(`Express running on port ${PORT}`);
});

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? ["http://localhost:5173"],
  }),
);

const provider = new ethers.JsonRpcProvider(URL);
if (!ADDRESS) {
  throw new Error("Wallet address not set");
}
const balance = await provider.getBalance(ADDRESS);
console.log(ethers.formatUnits(balance, 18));
