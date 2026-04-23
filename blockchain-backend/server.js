import cors from "cors";
import express from "express";
import {
  provisionOrganization,
  runInContainer,
  startPeerNode,
} from "./peer.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

const corsOptions = {
  origin: ["http://localhost:5173"],
};
app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/v1", (_request, response) => {
  response.json({ ok: true, service: "test-backend" });
});

app.post("/api/v1/fabric/peer/start", async (request, response) => {
  try {
    const { organization } = request.body ?? {};
    const startedPeer = await startPeerNode(organization);

    response.status(202).json({
      ok: true,
      message: "peer node start launched",
      ...startedPeer,
    });
  } catch (error) {
    response.status(error.statusCode ?? 500).json({
      ok: false,
      error: error.message ?? "Unable to start peer node",
    });
  }
});

app.post("/api/v1/fabric/org/provision", (request, response) => {
  try {
    const provisioned = provisionOrganization(request.body ?? {});

    response.status(201).json({
      ok: true,
      message: "organization provisioned",
      organization: provisioned,
    });
  } catch (error) {
    response.status(error.statusCode ?? 500).json({
      ok: false,
      error: error.message ?? "Unable to provision organization",
    });
  }
});

app.post("/api/v1/fabric/container/exec", async (request, response) => {
  try {
    const { containerName, command } = request.body ?? {};
    const result = await runInContainer(containerName, command);

    response.status(200).json({
      ok: true,
      message: "container command executed",
      ...result,
    });
  } catch (error) {
    response.status(error.statusCode ?? 500).json({
      ok: false,
      error: error.message ?? "Unable to run container command",
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
      exitCode: error.exitCode,
      dockerCmd: error.dockerCmd,
    });
  }
});

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});
