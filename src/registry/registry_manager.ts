import { readFile } from 'fs/promises';
import path from 'path';
import { Registry, PackageMetadata } from '../types/registry';

export class RegistryManager {
  private registry: Registry | null = null;
  private readonly registryPath: string;

  constructor() {
    this.registryPath = path.join(__dirname, '../../registry/packages.json');
  }

  async loadRegistry(): Promise<void> {
    const content = await readFile(this.registryPath, 'utf-8');
    this.registry = JSON.parse(content);
  }

  async getPackage(name: string): Promise<PackageMetadata | null> {
    console.log('Loading registries...',name);
    console.log(this.registry);
    if (!this.registry) {
      console.log("found the registry");
      const a =  await this.loadRegistry();
      console.log("registry loaded")
    }
    return this.registry?.packages[name] || null;
  }

  async listPackages(): Promise<PackageMetadata[]> {
    if (!this.registry) {
      await this.loadRegistry();
    }
    return Object.values(this.registry?.packages || {});
  }

  async buildConfig(name: string, inputs: Record<string, any>): Promise<{
    command: string;
    args: string[];
    env: Record<string, string>;
  }> {
    const pkg = await this.getPackage(name);
    if (!pkg || !pkg.buildConfig) {
      throw new Error(`No build configuration found for package ${name}`);
    }

    const config = {
      command: pkg.buildConfig.command,
      args: [...pkg.buildConfig.args],
      env: {} as Record<string, string>
    };

    // Apply input configurations
    if (pkg.buildConfig.configOptions) {
      for (const [key, flag] of Object.entries(pkg.buildConfig.configOptions)) {
        if (inputs[key]) {
          config.args.push(flag as string);
        }
      }
    }

    // Handle environment variables from inputs
    pkg.inputs.forEach(input => {
      if (inputs[input.name]) {
        config.env[input.name] = inputs[input.name];
      }
    });

    return config;
  }
}