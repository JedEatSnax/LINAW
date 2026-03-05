const { connect, hash, signers } = require("@hyperledger/fabric-gateway");
const fs = require("fs").promises;
const crypto = require("crypto");

// template for now :((
const createNetwork = async (req, res) => {
  try {
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { createNetwork };
