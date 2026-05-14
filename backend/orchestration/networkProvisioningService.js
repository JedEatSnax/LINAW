const { runCommand } = require("./commandRunner");

class networkProvisioningService {
  async testEcho({ user_id }) {
    // later this will be provision(), but for now just a safe test

    const result = await runCommand({
      command: "echo",
      args: [`hello from backend user ${user_id}`],
      cwd: process.cwd(),
    });

    return {
      message,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  }
}

module.exports = new networkProvisioningService();
