import type { Request, Response } from "express";
import {
  buildFabricCaServerCommand,
  runCommand,
} from "../service/caServerService.ts";
import type {
  CaServerCommandInput,
  CommandExecutionResult,
  FabricCommandSpec,
} from "../model/caServerModel.ts";
import { normalizeCaServerCommandInput } from "../model/caServerModel.ts";

function respondWithCommandResult(
  res: Response,
  command: FabricCommandSpec,
  result: CommandExecutionResult,
): void {
  res.status(200).json({ command: command.display, ...result });
}

export async function initFabricCaServer(
  req: Request<{}, unknown, CaServerCommandInput>,
  res: Response,
): Promise<void> {
  const command = buildFabricCaServerCommand(
    "init",
    normalizeCaServerCommandInput(req.body ?? {}),
  );
  const result = await runCommand(command.file, command.args, command.display);
  respondWithCommandResult(res, command, result);
}

export async function startFabricCaServer(
  req: Request<{}, unknown, CaServerCommandInput>,
  res: Response,
): Promise<void> {
  const command = buildFabricCaServerCommand(
    "start",
    normalizeCaServerCommandInput(req.body ?? {}),
  );
  const result = await runCommand(command.file, command.args, command.display);
  respondWithCommandResult(res, command, result);
}
