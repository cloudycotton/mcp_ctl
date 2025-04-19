import { createPackage } from "../create_package";

// Unleash MCP Server

export const unleash = createPackage({
  name: "unleash",
  aliases: ["unleash"],
  dependsOn: [],
  inputs: [
    {
      name: "UNLEASH_URL",
      description: "Your Unleash server endpoint URL",
      required: true,
      type: "string",
    },
    {
      name: "UNLEASH_API_TOKEN",
      description: "Your Unleash API token for authentication",
      required: true,
      type: "string",
    },
    {
      name: "MCP_HTTP_PORT",
      description: "The HTTP port to use when MCP_TRANSPORT is set to http",
      required: false,
      default: "3000",
      type: "string",
    },
    {
      name: "MCP_TRANSPORT",
      description: "The transport mechanism for MCP (stdio or http)",
      required: false,
      default: "stdio",
      type: "string",
    },
  ] as const,
  buildConfig(inputs) {
    const args: string[] = ["-y", "unleash-mcp"];
    return {
      name: "unleash-mcp",
      command: "npx",
      args,
      env: {
        MCP_TRANSPORT: inputs["MCP_TRANSPORT"] as string,
        MCP_HTTP_PORT: inputs["MCP_HTTP_PORT"] as string,
        UNLEASH_URL: inputs["UNLEASH_URL"] as string,
        UNLEASH_API_TOKEN: inputs["UNLEASH_API_TOKEN"] as string,
      },
    };
  },
});
