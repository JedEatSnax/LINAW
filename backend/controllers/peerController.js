const {
  provisionOrganization,
  runInContainer,
  startPeerNode,
} = require("../service/fabric/peerService");

async function startPeer(req, res) {
  const { organization } = req.body ?? {};
  const startedPeer = await startPeerNode(organization);

  res.status(202).json({
    ok: true,
    message: "peer node start launched",
    ...startedPeer,
  });
}

async function provisionOrg(req, res) {
  const provisioned = await provisionOrganization(req.body ?? {});

  res.status(201).json({
    ok: true,
    message: "organization provisioned",
    organization: provisioned,
  });
}

async function execContainer(req, res) {
  const { containerName, command } = req.body ?? {};
  const result = await runInContainer(containerName, command);

  res.status(200).json({
    ok: true,
    message: "container command executed",
    ...result,
  });
}

module.exports = {
  startPeer,
  provisionOrg,
  execContainer,
};