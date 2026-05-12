const express = require("express");
const cors = require("cors");
const { execFile } = require("node:child_process");

const app = express();
const port = Number(process.env["PORT"] ?? 3000);

type FabricCommandSpec = { file: string; args: string[]; display: string };

function runCommand(
  file: string,
  args: string[],
  display: string,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      { timeout: 30_000, maxBuffer: 1024 * 1024 },
      (error: any, stdout: string, stderr: string) => {
        if (error) {
          reject({
            message: error.message,
            code: error.code,
            stdout,
            stderr,
            command: display,
          });
          return;
        }
        resolve({ stdout, stderr });
      },
    );
  });
}

function buildFabricCaServerCommand(
  subCommand: "init" | "start" | "version",
  options: {
    useDocker?: boolean;
    containerName?: string;
    bootstrapUser?: string;
    bootstrapPass?: string;
    homeDir?: string;
    corsEnabled?: boolean;
  },
): FabricCommandSpec {
  const args: string[] = [];
  let file = "fabric-ca-server";

  if (options.useDocker) {
    if (!options.containerName) {
      throw new Error("containerName is required when useDocker=true");
    }
    file = "docker";
    args.push("exec", String(options.containerName), "fabric-ca-server");
  }

  args.push(subCommand);

  if (subCommand === "init" || subCommand === "start") {
    if (options.bootstrapUser || options.bootstrapPass) {
      const user = options.bootstrapUser ?? "admin";
      const pass = options.bootstrapPass ?? "adminpw";
      args.push("-b", `${user}:${pass}`);
    }

    if (options.homeDir) {
      args.push("--home", String(options.homeDir));
    }
  }

  const display = [file, ...args].join(" ");
  return { file, args, display };
}

app.use(
  cors({
    origin: process.env["ALLOWED_ORIGIN"] ?? ["http://localhost:5173"],
  }),
);
app.use(express.json());

app.get("/api/fabric-ca-server/version", async (req: any, res: any) => {
  try {
    const useDocker = req.query.useDocker === "true";
    const containerName = req.query.containerName;
    const command = buildFabricCaServerCommand("version", {
      useDocker,
      containerName,
    });
    const result = await runCommand(command.file, command.args, command.display);
    res.status(200).json({ command: command.display, ...result });
  } catch (error: any) {
    res.status(400).json({
      error: error.message ?? "Failed to run version command",
      details: error,
    });
  }
});

app.post("/api/fabric-ca-server/init", async (req: any, res: any) => {
  try {
    const {
      useDocker = true,
      containerName,
      bootstrapUser = "admin",
      bootstrapPass = "adminpw",
      homeDir,
    } = req.body ?? {};

    const command = buildFabricCaServerCommand("init", {
      useDocker,
      containerName,
      bootstrapUser,
      bootstrapPass,
      homeDir,
    });

    const result = await runCommand(command.file, command.args, command.display);
    res.status(200).json({ command: command.display, ...result });
  } catch (error: any) {
    res.status(400).json({
      error: error.message ?? "Failed to run init command",
      details: error,
    });
  }
});

app.post("/api/fabric-ca-server/start", async (req: any, res: any) => {
  try {
    const {
      useDocker = true,
      containerName,
      bootstrapUser,
      bootstrapPass,
      homeDir,
    } = req.body ?? {};

    const command = buildFabricCaServerCommand("start", {
      useDocker,
      containerName,
      bootstrapUser,
      bootstrapPass,
      homeDir,
    });

    const result = await runCommand(command.file, command.args, command.display);
    res.status(200).json({ command: command.display, ...result });
  } catch (error: any) {
    res.status(400).json({
      error: error.message ?? "Failed to run start command",
      details: error,
    });
  }
});

app.listen(port, () => {
  console.log(`Express running on port ${port}`);
});
