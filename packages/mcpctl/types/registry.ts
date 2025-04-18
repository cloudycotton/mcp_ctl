export interface PackageInput {
    name: string;
    type: 'string' | 'boolean' | 'number';
    required: boolean;
    description: string;
  }
  
export interface BuildConfig {
  command: string;
  args: string[];
  configOptions?: Record<string, string>;
}

export interface PackageMetadata {
    name: string;
    aliases: string[];
    version: string;
    description: string;
    repository: string;
    maintainer: string;
    inputs: PackageInput[];
    dependencies: string[];
    buildConfig: BuildConfig;
  }
  
  export interface Registry {
    registryVersion: string;
    lastUpdated: string;
    packages: Record<string, PackageMetadata>;
  }