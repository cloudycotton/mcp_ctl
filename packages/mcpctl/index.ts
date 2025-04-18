#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import inquirer from "inquirer";
import fuzzy from "fuzzy";

import { spawn } from "child_process";
import { readClaudeConfig, writeClaudeConfig } from "./claude_config";
import { term } from "./term";
import { InputType } from "./create_package";
import { RegistryManager } from './registry/registry_manager';
import { PackageMetadata } from './types/registry';
const registryManager = new RegistryManager();

async function formatPackage(pkg: PackageMetadata) {
  if (!pkg) return '';

  return `
${term.bold(pkg.name)} ${term.gray(`(${pkg.version})`)}
${term.dim("Dependencies:")} ${
    pkg.dependencies.length ? pkg.dependencies.join(", ") : "None"
  }
${term.dim("Inputs:")}
${pkg.inputs
  .map(
    (input) =>
      `  ${input.name}${input.required ? term.red("*") : ""}: ${
        input.description
      }`
  )
  .join("\n")}
`;
}

// CLI Commands
async function listServers() {
  const config = await readClaudeConfig();

  if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
    console.log(term.yellow("No MCP servers configured"));
    return;
  }

  console.log(term.bold("\nConfigured MCP Servers:"));
  Object.entries(config.mcpServers).forEach(([name, server]: [string, any]) => {
    console.log(`
${term.green(name)}
  Command: ${server.command}
  Args: ${server.args.join(" ")}
`);
  });
}
async function installPackage(packageName: string, serverName?: string) {
  let packages = await registryManager.listPackages(packageName,true);
  const pkg = packages[0];

  if (pkg.dependencies.length > 0) {
    console.log(
      term.yellow(`Checking dependencies: ${pkg.dependencies.join(", ")}`)
    );
  }

  let finalServerName = serverName;
  if (!finalServerName) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "serverName",
        message: "Enter a name for this MCP server:",
        default: pkg.name,
        validate: (input) =>
          input.trim() !== "" ? true : "Server name cannot be empty",
      },
    ]);
    finalServerName = answers.serverName;
  }


  const inputs: Record<string, unknown> = {};
  for (const input of pkg.inputs) {

    const inputType = input.type as InputType;

    let promptType: string;
    switch (inputType) {
      case "boolean":
        promptType = "confirm";
        break;
      case "password":
        promptType = "password";
        break;
      case "string":
      default:
        promptType = "input";
        break;
    }


    const promptConfig: any = {
      type: promptType,
      name: "value",
      message: `${input.description}${input.required ? " (required)" : ""}:`,
    };


    if ((input as any).default) {
      promptConfig.default = (input as any).default;
    }


    promptConfig.validate = (value: any) => {
      if (input.required) {
        if (inputType === "boolean") {

          return true;
        } else if (
          value === undefined ||
          (typeof value === "string" && value.trim() === "")
        ) {
          return `${input.name} is required`;
        }
      }
      return true;
    };

    const answers = await inquirer.prompt([promptConfig]);
    inputs[input.name] = answers.value;
  }


  const mcpConfig =  await registryManager.buildConfig(packageName, inputs);


  await updateClaudeConfig({
    name: finalServerName,
    command: mcpConfig.command,
    args: mcpConfig.args,
    env: mcpConfig.env,
  });

  console.log(
    term.green(`✅ Successfully installed ${pkg.name} as "${finalServerName}"`)
  );
}

async function updateClaudeConfig({
  name,
  command,
  args,
  env,
}: {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}) {
  try {
    const config = await readClaudeConfig();

    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    if (config.mcpServers[name]) {
      const { replace } = await inquirer.prompt([
        {
          type: "confirm",
          name: "replace",
          message: `An MCP server named "${name}" is already configured. Do you want to replace it?`,
          default: false,
        },
      ]);

      if (!replace) {
        console.log(
          term.yellow(
            `⚠️ Skipped replacing config for existing MCP server "${name}"`
          )
        );
        return;
      }
    }

    config.mcpServers[name] = {
      command,
      args,
      env,
    };

    await writeClaudeConfig(config);
    console.log(
      term.green("✅ Successfully added MCP server to Claude configuration")
    );
  } catch (error) {
    console.error(term.red("⚠️ Failed to update Claude configuration"), error);
  }
}

async function removeServer(serverName: string) {
  const config = await readClaudeConfig();

  if (!config.mcpServers || !config.mcpServers[serverName]) {
    console.log(term.yellow(`No MCP server named "${serverName}" found`));
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Are you sure you want to remove the MCP server "${serverName}"?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(term.yellow("Operation cancelled"));
    return;
  }

  delete config.mcpServers[serverName];
  await writeClaudeConfig(config);
  console.log(term.green(`✅ Successfully removed MCP server "${serverName}"`));
}

async function startServer(serverName: string) {
  const config = await readClaudeConfig();

  if (!config.mcpServers || !config.mcpServers[serverName]) {
    console.log(term.yellow(`No MCP server named "${serverName}" found`));
    return;
  }

  const serverConfig = config.mcpServers[serverName];

  console.log(term.green(`Starting MCP server "${serverName}"...`));
  console.log(
    `Command: ${serverConfig.command} ${serverConfig.args.join(" ")}`
  );

  try {
    const child = spawn(serverConfig.command, serverConfig.args, {
      stdio: "inherit",
      env: { ...process.env, ...serverConfig.env },
    });

    child.on("error", (error) => {
      console.error(term.red(`Failed to start server: ${error.message}`));
    });

    process.on("SIGINT", () => {
      console.log(term.yellow("\nStopping MCP server..."));
      child.kill("SIGINT");
    });

    console.log(
      term.green(`MCP server "${serverName}" is running (PID: ${child.pid})`)
    );
    console.log(term.gray("Press Ctrl+C to stop the server"));

    await new Promise((resolve) => {
      child.on("close", (code) => {
        console.log(term.yellow(`MCP server exited with code ${code}`));
        resolve(null);
      });
    });
  } catch (error: any) {
    console.error(term.red(`Failed to start server: ${error.message}`));
  }
}

async function listPackages(searchTerm?: string) {
  let packages = await registryManager.listPackages(searchTerm);
  if (packages.length ==0){
    console.log(term.red(`No packages found`));
    return;
  }
  
  for (const pkg of packages) {
    console.log(await formatPackage(pkg));
  }
  console.log(term.green(`Found ${packages.length} packages`));
}

// Main CLI definition
async function main() {
  return yargs(hideBin(process.argv))
    .command("list", "List all configured MCP servers", {}, async () => {
      await listServers();
    })
    .command(
      "packages [search]",
      "List available packages",
      (yargs) => {
        return yargs.positional("search", {
          describe: "Search term to filter packages",
          type: "string",
        });
      },
      async (argv) => {
        await listPackages(argv.search as string | undefined);
      }
    )
    .command(
      "install <package> [name]",
      "Install and configure an MCP package",
      (yargs) => {
        return yargs
          .positional("package", {
            describe: "Package to install",
            type: "string",
            demandOption: true,
          })
          .positional("name", {
            describe: "Name for the MCP server",
            type: "string",
          });
      },
      async (argv) => {
        await installPackage(
          argv.package as string,
          argv.name as string | undefined
        );
      }
    )
    .command(
      "remove <name>",
      "Remove a configured MCP server",
      (yargs) => {
        return yargs.positional("name", {
          describe: "Name of the MCP server to remove",
          type: "string",
          demandOption: true,
        });
      },
      async (argv) => {
        await removeServer(argv.name as string);
      }
    )
    .command(
      "start <name>",
      "Start an MCP server",
      (yargs) => {
        return yargs.positional("name", {
          describe: "Name of the MCP server to start",
          type: "string",
          demandOption: true,
        });
      },
      async (argv) => {
        await startServer(argv.name as string);
      }
    )
    .command(
      "search <term>",
      "Search for packages",
      (yargs) => {
        return yargs.positional("term", {
          describe: "Search term",
          type: "string",
          demandOption: true,
        });
      },
      async (argv) => {
        await listPackages(argv.term as string);
      }
    )
    .example([
      ["$0 packages", "List all available packages"],
      [
        "$0 install github my-gh-server",
        'Install the GitHub package as "my-gh-server"',
      ],
      ["$0 list", "List all configured MCP servers"],
      ["$0 start my-gh-server", 'Start the "my-gh-server" MCP server'],
      ["$0 search mongo", 'Search for packages matching "mongo"'],
    ])
    .recommendCommands()
    .strict()
    .alias("h", "help")
    .alias("v", "version")
    .wrap(yargs().terminalWidth())
    .epilogue("For more information, visit https://github.com/runablehq/mcpctl")
    .demandCommand(1, "Please specify a command")
    .parse();
}

main().catch((error) => {
  console.error(term.red("Error:"), error.message);
  process.exit(1);
});
