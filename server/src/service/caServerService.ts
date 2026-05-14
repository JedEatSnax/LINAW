import { execFile } from "node:child_process";
import { CA_SERVER_COMMAND_DEFAULTS } from "../model/caServerModel.ts";
import type {
  CommandExecutionResult,
  FabricCommandSpec,
  NormalizedCaServerCommandInput,
} from "../model/caServerModel.ts";

export function runCommand(
  file: string,
  args: string[],
  display: string,
): Promise<CommandExecutionResult> {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      {
        timeout: CA_SERVER_COMMAND_DEFAULTS.commandTimeoutMs,
        maxBuffer: CA_SERVER_COMMAND_DEFAULTS.commandMaxBufferBytes,
      },
      (error: unknown, stdout: string, stderr: string) => {
        if (error) {
          const commandError = error as {
            message?: string;
            code?: unknown;
          };

          const stderrMessage = stderr.trim();
          const baseMessage =
            stderrMessage || commandError.message || "Command execution failed";

          const enrichedError = new Error(baseMessage) as Error & {
            code?: unknown;
            stdout?: string;
            stderr?: string;
            command?: string;
          };

          enrichedError.code = commandError.code;
          enrichedError.stdout = stdout;
          enrichedError.stderr = stderr;
          enrichedError.command = display;

          reject(enrichedError);
          return;
        }

        resolve({ stdout, stderr });
      },
    );
  });
}

export function buildFabricCaServerCommand(
  subCommand: "init" | "start",
  options: NormalizedCaServerCommandInput,
): FabricCommandSpec {
  const args: string[] = [];

  const file = "docker";
  args.push("exec", options.containerName, "fabric-ca-server");
  args.push(subCommand);
  args.push(...CA_SERVER_COMMAND_DEFAULTS.defaultFabricCaFlags);
  args.push(`${options.orgUser}:${options.orgPassword}`);

  const display = [file, ...args].join(" ");
  return { file, args, display };
}
