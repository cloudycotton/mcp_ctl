export type InputType = "boolean" | "string" | "password";

export interface Input {
  name: string;
  description: string;
  required?: boolean;
  type: InputType;
  default?: string | boolean | number;
}

// Define a utility type to extract input names as a string union
export type InputNames<T extends readonly Input[]> = T[number]["name"];

// Improved inference helper that properly handles required vs optional
export type InferInputValues<T extends readonly Input[]> = {
  [K in InputNames<T>]: Extract<
    T[number],
    { name: K }
  >["required"] extends false
    ? unknown | undefined
    : unknown;
};

// Package interface that correctly infers input types
export interface Package<T extends readonly Input[] = readonly Input[]> {
  name: string;
  aliases: string[];
  dependsOn: string[];
  inputs: T;
  buildConfig: (userInputs: InferInputValues<T>) => MCPConfig;
}

export interface MCPConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

// Helper function to create a properly typed package
export function createPackage<T extends readonly Input[]>(
  packageDef: Omit<Package<T>, "buildConfig"> & {
    buildConfig: (userInputs: InferInputValues<T>) => MCPConfig;
  }
): Package<T> {
  return packageDef;
}
