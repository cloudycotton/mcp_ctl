import { createPackage } from "../create_package";

export const semgrep = createPackage({
  name: "semgrep",
  aliases: ["semgrep-mcp"],
  dependsOn: ["uv"],
  inputs: [],
  buildConfig(inputs) {
    const args: string[] = ["semgrep-mcp"];
    return {
      name: "semgrep",
      command: "uvx",
      args,
      env: {},
    };
  },
});
