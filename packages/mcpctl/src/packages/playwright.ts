import { createPackage } from "../create_package";

export const playwright = createPackage({
  name: "playwright",
  aliases: ["playwright", "browser"],
  dependsOn: [],
  inputs: [
    {
      name: "vision",
      description: "Use vision instead of relying only on snapshot.",
      required: false,
      default: true,
      type: "boolean",
    },
    {
      name: "headless",
      description: "Run in headless mode.",
      required: false,
      default: true,
      type: "boolean",
    },
  ] as const,
  buildConfig(inputs) {
    const args: string[] = ["-y", "@playwright/mcp@latest"];
    if (inputs.headless) {
      args.push("--headless");
    }
    if (inputs.vision) {
      args.push("--vision");
    }
    return {
      name: "playwright",
      command: "npx",
      args,
      env: {},
    };
  },
});
