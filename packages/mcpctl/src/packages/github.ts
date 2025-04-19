import { createPackage } from "../create_package";

export const github = createPackage({
  name: "Github",
  aliases: ["gh", "github"],
  dependsOn: ["docker"],
  inputs: [
    {
      name: "github_personal_token",
      description: "Create a github personal token for MCP server.",
      required: true,
      type: "string",
    },
  ] as const,
  buildConfig(inputs) {
    return {
      command: "docker",
      args: [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server",
      ],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: inputs.github_personal_token as string,
      },
    };
  },
});
