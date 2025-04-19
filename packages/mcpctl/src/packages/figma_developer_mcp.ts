import { createPackage } from "../create_package";

// Framelink Figma MCP Server

export const figma_developer_mcp = createPackage({
  name: "figma_developer_mcp",
  aliases: ["figma"],
  dependsOn: [],
  inputs: [
    {
      name: "figma-api-key",
      description: "Figma API key.",
      required: true,
      type: "string",
    },
  ] as const,
  buildConfig(inputs) {
    const args: string[] = ["-y", "figma-developer-mcp"];
    if (inputs["figma-api-key"]) {
      args.push(`--figma-api-key=${inputs["figma-api-key"]}`);
    }
    args.push('--stdio')
    return {
      name: "figma-developer-mcp",
      command: "npx",
      args,
      env: {},
    };
  },
});
